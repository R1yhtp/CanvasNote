import {test} from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {emptyProject,makeItem,world} from '../src/model';
import {startPinch,movePinch,sameSelection} from '../src/gestures';
import {exportLayout} from '../src/exportLayout';
import {useStore,currentBoard} from '../src/store';
import {writeRecovery,readLastProject,listProjects,readProject,deleteProject,readWorkspacePreferences,writeWorkspacePreferences} from '../src/recovery';

test('pinch preserves its world anchor while both fingers move',()=>{
  const camera={x:45,y:-18,zoom:.8},start=startPinch([{x:100,y:100},{x:300,y:100}],camera)!;
  const before=world(start.center,camera),next=movePinch(start,[{x:100,y:130},{x:500,y:130}]),after=world({x:300,y:130},next);
  assert.equal(next.zoom,1.6);assert.ok(Math.abs(before.x-after.x)<1e-8);assert.ok(Math.abs(before.y-after.y)<1e-8);assert.deepEqual(camera,{x:45,y:-18,zoom:.8});
});
test('extreme pinch distances clamp zoom without losing the current center',()=>{
  const start=startPinch([{x:0,y:0},{x:1,y:0}],{x:0,y:0,zoom:1})!;
  const next=movePinch(start,[{x:-10000,y:0},{x:10000,y:0}]);assert.equal(next.zoom,4);assert.equal(world({x:0,y:0},next).x,.5);
  assert.equal(startPinch([{x:0,y:0}],start.camera),null);
});
test('tap multiselection toggles whole groups and dragging retains selection',()=>{
  assert.deepEqual(sameSelection(['a','b'],'a',['a'],false),['a','b']);
  assert.deepEqual(sameSelection(['a'],'b',['b','c'],true),['a','b','c']);
  assert.deepEqual(sameSelection(['a','b','c'],'b',['b','c'],true),['a']);
});
test('PNG allocation is capped before rendering very large and rotated canvases',()=>{
  const items=[{...makeItem('rect',-5000000,-5000000),width:100,height:200,rotation:45},makeItem('note',5000000,5000000)];
  const layout=exportLayout(items,3);assert.ok(layout.width<=8192&&layout.height<=8192);assert.ok(layout.width*layout.height<=32000000);assert.ok(layout.scale<1);assert.ok(Number.isFinite(layout.x));
  assert.throws(()=>exportLayout([],2),/没有可导出的内容/);
});
test('note creation and first text edit undo as one user action',()=>{
  const s=useStore.getState();s.load(emptyProject());const item=makeItem('note',4,6);s.change(p=>p.boards[0].items.push(item));s.change(p=>p.boards[0].items[0].text='中文笔记',true);
  assert.equal(useStore.getState().past.length,1);s.undo();assert.equal(currentBoard().items.length,0);s.redo();assert.equal(currentBoard().items[0].text,'中文笔记');
});
test('undoing content does not jump back to a previous pan or zoom',()=>{
  const s=useStore.getState();s.load(emptyProject());s.change(p=>p.boards[0].items.push(makeItem('note',0,0)));s.preview(p=>p.boards[0].camera={x:120,y:-80,zoom:2});s.undo();assert.equal(currentBoard().items.length,0);assert.deepEqual(currentBoard().camera,{x:120,y:-80,zoom:2});s.redo();assert.equal(currentBoard().items.length,1);assert.deepEqual(currentBoard().camera,{x:120,y:-80,zoom:2});
});
test('clear removes the entire active board as one undoable action and preserves assets through autosave',async()=>{
  const p=emptyProject(),other=p.boards[0],active={id:'scratch-board',name:'草稿',items:[{...makeItem('image',12,34),assetId:'photo',locked:true,groupId:'group'},{...makeItem('note',40,70),text:'隐藏的便签',hidden:true,groupId:'group'},makeItem('frame',-80,-30)],camera:{x:91,y:-44,zoom:1.4}};
  p.boards.push(active);p.activeBoard=active.id;other.items.push({...makeItem('image',0,0),assetId:'other-photo'});
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6GbcAAAAASUVORK5CYII=';
  p.assets={photo:{name:'截图.png',data:image},'other-photo':{name:'另一张.png',data:image},wallpaper:{name:'背景.png',data:image}};p.appearance.backgroundId='wallpaper';
  const before=structuredClone(p),s=useStore.getState();s.load(p);s.setTool('pen');s.select(active.items.map(e=>e.id));s.clearBoard();
  try{
    assert.equal(currentBoard().items.length,0);assert.equal(useStore.getState().past.length,1);assert.deepEqual(useStore.getState().selection,[]);assert.equal(useStore.getState().tool,'pen');assert.deepEqual(currentBoard().camera,active.camera);assert.deepEqual(useStore.getState().project.boards[0],before.boards[0]);assert.deepEqual(useStore.getState().project.assets,before.assets);assert.deepEqual(useStore.getState().project.appearance,before.appearance);
    await writeRecovery(useStore.getState().project);const cleared=(await readProject(p.id))!;assert.equal(cleared.boards[1].items.length,0);assert.equal(cleared.assets.photo,undefined);assert.ok(cleared.assets['other-photo']);assert.ok(cleared.assets.wallpaper);
    s.preview(project=>project.boards[1].camera={x:-120,y:210,zoom:2});s.undo();assert.deepEqual(currentBoard().items,before.boards[1].items);assert.deepEqual(currentBoard().camera,{x:-120,y:210,zoom:2});assert.deepEqual(useStore.getState().project.assets,before.assets);assert.equal(useStore.getState().past.length,0);
    await writeRecovery(useStore.getState().project);const restored=(await readProject(p.id))!;assert.deepEqual(restored.boards[1].items,before.boards[1].items);assert.equal(restored.assets.photo.data,image);
    s.redo();assert.equal(currentBoard().items.length,0);assert.deepEqual(useStore.getState().project.boards[0],before.boards[0]);assert.deepEqual(currentBoard().camera,{x:-120,y:210,zoom:2});
  }finally{await deleteProject(p.id);}
});
test('clearing an already empty board does not create history, dirty it, or discard redo',()=>{
  const s=useStore.getState();s.load(emptyProject());const before=useStore.getState();s.clearBoard();assert.equal(useStore.getState(),before);
  s.change(p=>p.boards[0].items.push(makeItem('pen',0,0)));s.undo();const undone=useStore.getState();s.clearBoard();assert.equal(useStore.getState(),undone);assert.equal(useStore.getState().future.length,1);s.redo();assert.equal(currentBoard().items.length,1);
});
test('saved workspaces survive switching, queued writes and deleting the active project',async()=>{
  const first=emptyProject('第一份'),second=emptyProject('第二份');first.boards[0].items.push({...makeItem('note',-40,70),text:'保留内容'});
  const pending=writeRecovery(first);first.name='调用后的修改不应进入这次保存';await pending;assert.equal((await readProject(first.id))!.name,'第一份');
  const old=writeRecovery(second);second.name='更新后的第二份';const latest=writeRecovery(second);await Promise.all([old,latest]);
  assert.equal((await readLastProject())!.name,'更新后的第二份');assert.equal((await listProjects()).length,2);assert.equal((await readProject(first.id))!.boards[0].items[0].text,'保留内容');
  await deleteProject(second.id);assert.equal(await readLastProject(),undefined);assert.equal(await readProject(second.id),undefined);assert.equal((await listProjects()).length,1);
  await writeRecovery((await readProject(first.id))!);assert.equal((await readLastProject())!.id,first.id);await deleteProject(first.id);
});
test('workspace layout is durable, captures queued values, and stays separate from project history',async()=>{
  assert.deepEqual(await readWorkspacePreferences(),{toolbarPosition:'bottom',toolbarCollapsed:false});
  const project=emptyProject('独立的笔记'),s=useStore.getState();s.load(project);const state=useStore.getState();
  const preferences={toolbarPosition:'left' as const,toolbarCollapsed:true};const first=writeWorkspacePreferences(preferences);preferences.toolbarCollapsed=false;await first;assert.deepEqual(await readWorkspacePreferences(),{toolbarPosition:'left',toolbarCollapsed:true});
  const pending=writeWorkspacePreferences({toolbarPosition:'left',toolbarCollapsed:false}),save=writeRecovery(project),last=writeWorkspacePreferences({toolbarPosition:'right',toolbarCollapsed:true});await Promise.all([pending,save,last]);
  assert.deepEqual(await readWorkspacePreferences(),{toolbarPosition:'right',toolbarCollapsed:true});assert.equal(useStore.getState(),state);assert.equal((await readLastProject())!.id,project.id);assert.equal('toolbarPosition' in (await readProject(project.id))!,false);
  await deleteProject(project.id);assert.deepEqual(await readWorkspacePreferences(),{toolbarPosition:'right',toolbarCollapsed:true});await writeWorkspacePreferences({toolbarPosition:'bottom',toolbarCollapsed:false});
});
