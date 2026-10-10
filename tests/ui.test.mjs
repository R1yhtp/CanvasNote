// DOM and canvas integration checks. This is not a real-browser or physical-device test.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {createCanvas,Image,DOMMatrix,Path2D} from '@napi-rs/canvas';
import {indexedDB,IDBKeyRange} from 'fake-indexeddb';

const require=createRequire(import.meta.url),generated=path.resolve('tests/.ui-build.mjs');
await build({stdin:{contents:"export {default as App} from './src/App.tsx';export {Canvas} from './src/Canvas.tsx';export {useStore,currentBoard} from './src/store.ts';export {emptyProject,makeItem,world} from './src/model.ts';export * from './src/recovery.ts';",resolveDir:process.cwd(),sourcefile:'ui-entry.tsx',loader:'tsx'},outfile:generated,bundle:true,format:'esm',platform:'node',packages:'external',jsx:'automatic',plugins:[{name:'raw-worker',setup(build){build.onResolve({filter:/\?raw$/},args=>({path:require.resolve(args.path.replace(/\?raw$/,'')),namespace:'raw'}));build.onLoad({filter:/.*/,namespace:'raw'},async args=>({contents:`export default ${JSON.stringify(await fs.readFile(args.path,'utf8'))}`,loader:'js'}));}}]});
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://canvasnote.test/',pretendToBeVisual:true});
let viewport={width:1024,height:708},coarse=false;
const queries=new Map();
dom.window.matchMedia=query=>{
  if(queries.has(query))return queries.get(query);
  const listeners=new Set(),q={media:query,get matches(){return query.includes('pointer: coarse')?coarse:false;},addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),notify:()=>listeners.forEach(fn=>fn({matches:q.matches}))};queries.set(query,q);return q;
};
class ResizeObserver{constructor(cb){this.cb=cb;}observe(node){queueMicrotask(()=>this.cb([{target:node,contentRect:viewport}]));}disconnect(){}}
dom.window.ResizeObserver=ResizeObserver;dom.window.Image=Image;
for(const [key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,HTMLCanvasElement:dom.window.HTMLCanvasElement,HTMLImageElement:dom.window.HTMLImageElement,Element:dom.window.Element,Event:dom.window.Event,MouseEvent:dom.window.MouseEvent,KeyboardEvent:dom.window.KeyboardEvent,MutationObserver:dom.window.MutationObserver,Image,DOMMatrix,Path2D,ResizeObserver,indexedDB,IDBKeyRange,matchMedia:dom.window.matchMedia,requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window),cancelAnimationFrame:dom.window.cancelAnimationFrame.bind(dom.window),IS_REACT_ACT_ENVIRONMENT:true}))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
const backing=new WeakMap();
function nativeCanvas(element){let canvas=backing.get(element);if(!canvas){canvas=createCanvas(Math.max(1,element.width),Math.max(1,element.height));backing.set(element,canvas);}return canvas;}
for(const key of ['width','height']){const descriptor=Object.getOwnPropertyDescriptor(dom.window.HTMLCanvasElement.prototype,key);Object.defineProperty(dom.window.HTMLCanvasElement.prototype,key,{get:descriptor.get,set(value){descriptor.set.call(this,value);const native=backing.get(this);if(native)native[key]=Math.max(1,Number(value));}});}
dom.window.HTMLCanvasElement.prototype.getContext=function(type){if(type!=='2d')return null;const ctx=nativeCanvas(this).getContext('2d');if(!ctx.__adapted){const original=ctx.drawImage.bind(ctx);ctx.drawImage=(image,...args)=>original(backing.get(image)||image,...args);ctx.__adapted=true;}return ctx;};
dom.window.HTMLCanvasElement.prototype.toDataURL=function(...args){return nativeCanvas(this).toDataURL(...args);};
dom.window.HTMLElement.prototype.getBoundingClientRect=function(){return {x:0,y:60,left:0,top:60,width:viewport.width,height:viewport.height,right:viewport.width,bottom:viewport.height+60,toJSON(){return this;}};};
for(const [key,dimension]of [['clientWidth','width'],['clientHeight','height']])Object.defineProperty(dom.window.HTMLElement.prototype,key,{configurable:true,get(){return Number.parseFloat(this.style[dimension])||viewport[dimension];}});
const React=await import('react'),{act}=React,{render,fireEvent,screen,waitFor,cleanup}=await import('@testing-library/react');
const Konva=(await import('konva')).default;
const {App,Canvas,useStore,currentBoard,emptyProject,makeItem,world,readLastProject,listProjects,readWorkspacePreferences}=await import(generated);
const logs=[];
const check=async(name,fn)=>{await fn();logs.push(name);console.log('PASS',name);};
const click=label=>fireEvent.click(screen.queryByRole('button',{name:label,exact:true})||screen.getByRole('menuitem',{name:label,exact:true}));
const stage=()=>Konva.stages.find(s=>!s.isDestroyed?.()&&s.container().isConnected);
function touch(type,points,changed=points){const content=stage().content,event=new dom.window.Event(type,{bubbles:true,cancelable:true});const list=p=>p.map(([x,y],i)=>({identifier:i,clientX:x,clientY:y+60,target:content}));Object.defineProperties(event,{touches:{value:list(points)},changedTouches:{value:list(changed)}});content.dispatchEvent(event);}
function mouse(type,x,y){stage().content.dispatchEvent(new dom.window.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y+60,button:0,buttons:type==='mouseup'?0:1}));}

try{
  useStore.getState().load(emptyProject());
  await act(async()=>{render(React.createElement(App));});
  await waitFor(()=>assert.ok(screen.getByText('已保存')));
  await check('default screen is a blank canvas with nine common tools including the eraser',async()=>{
    assert.equal(currentBoard().items.length,0);assert.equal(document.querySelectorAll('aside').length,0);assert.equal(document.querySelector('.statusbar'),null);assert.equal(document.querySelector('.minimap'),null);assert.equal(screen.getByRole('toolbar',{name:'绘图工具'}).querySelectorAll('.tool-button').length,9);assert.ok(screen.getByRole('button',{name:'橡皮擦'}).classList.contains('tool-button'));assert.equal(document.querySelectorAll('[role=dialog]').length,0);assert.equal(screen.queryByRole('slider',{name:'画笔粗细'}),null);
  });
  await check('undo and redo live in the drawing dock rather than the project header',async()=>{
    assert.equal(document.querySelector('.topbar [aria-label="撤销"]'),null);assert.equal(document.querySelector('.topbar [aria-label="重做"]'),null);const dock=screen.getByRole('toolbar',{name:'绘图工具'});assert.ok(dock.contains(screen.getByRole('button',{name:'撤销'})));assert.ok(dock.contains(screen.getByRole('button',{name:'重做'})));assert.ok(screen.getByRole('button',{name:'撤销'}).disabled);
  });
  await check('pen settings open only on demand, close when drawing starts, and retain the chosen style',async()=>{
    await act(async()=>click('画笔'));assert.ok(screen.getByRole('group',{name:'画笔设置'}));assert.equal(document.querySelector('.context-bar.pen-options'),null);fireEvent.change(screen.getByRole('slider',{name:'画笔粗细'}),{target:{value:'7'}});fireEvent.change(screen.getByLabelText('画笔颜色'),{target:{value:'#e14d64'}});
    await act(async()=>{mouse('mousedown',70,570);mouse('mousemove',110,590);mouse('mouseup',110,590);});assert.equal(screen.queryByRole('group',{name:'画笔设置'}),null);assert.equal(useStore.getState().tool,'pen');assert.equal(currentBoard().items[0].strokeWidth,7);assert.equal(currentBoard().items[0].stroke,'#e14d64');await act(async()=>click('撤销'));assert.equal(currentBoard().items.length,0);
    await act(async()=>click('画笔'));assert.equal(screen.getByRole('slider',{name:'画笔粗细'}).value,'7');await act(async()=>click('画笔'));assert.equal(screen.queryByRole('group',{name:'画笔设置'}),null);await act(async()=>click('选择'));
  });
  await check('collapsing controls leaves drawing and keyboard undo available without a layout history entry',async()=>{
    await act(async()=>click('画笔'));const history=useStore.getState().past.length;await act(async()=>click('收起工具栏'));assert.equal(screen.queryByRole('button',{name:'画笔'}),null);assert.equal(document.querySelector('.zoom-control'),null);assert.equal(document.querySelector('.context-bar'),null);assert.equal(screen.queryByRole('group',{name:'画笔设置'}),null);assert.equal(useStore.getState().past.length,history);assert.equal(useStore.getState().tool,'pen');
    await act(async()=>{mouse('mousedown',210,540);mouse('mousemove',250,555);mouse('mouseup',250,555);});assert.equal(currentBoard().items.length,1);await act(async()=>fireEvent.keyDown(document.body,{key:'z',ctrlKey:true}));assert.equal(currentBoard().items.length,0);assert.ok(screen.getByRole('button',{name:'展开工具栏'}));await act(async()=>click('展开工具栏'));assert.equal(useStore.getState().tool,'pen');assert.equal(screen.queryByRole('group',{name:'画笔设置'}),null);await act(async()=>click('选择'));
  });
  await check('toolbar placement changes through the menu, persists, and leaves project history untouched',async()=>{
    const project=useStore.getState().project,history=useStore.getState().past.length;
    await act(async()=>click('菜单'));await act(async()=>click('工具栏'));await act(async()=>click('左侧'));assert.equal(screen.getByRole('toolbar',{name:'绘图工具'}).getAttribute('aria-orientation'),'vertical');assert.ok(screen.getByRole('button',{name:'左侧'}).getAttribute('aria-pressed')==='true');await act(async()=>click('右侧'));await waitFor(async()=>assert.equal((await readWorkspacePreferences()).toolbarPosition,'right'));assert.equal(document.querySelector('.app').dataset.toolbarPosition,'right');assert.equal(useStore.getState().project,project);assert.equal(useStore.getState().past.length,history);await act(async()=>click('底部'));await act(async()=>click('完成'));assert.equal(screen.getByRole('toolbar',{name:'绘图工具'}).getAttribute('aria-orientation'),'horizontal');
  });
  await check('a side-docked pen popover stays outside the scrolling list and closes when drawing starts',async()=>{
    await act(async()=>click('菜单'));await act(async()=>click('工具栏'));await act(async()=>click('左侧'));await act(async()=>click('完成'));await act(async()=>click('画笔'));const panel=screen.getByRole('group',{name:'画笔设置'});assert.equal(panel.closest('.dock-scroll'),null);assert.ok(Number.isFinite(Number.parseFloat(panel.style.left)));assert.ok(Number.isFinite(Number.parseFloat(panel.style.top)));await act(async()=>{mouse('mousedown',70,570);mouse('mousemove',110,590);mouse('mouseup',110,590);});assert.equal(screen.queryByRole('group',{name:'画笔设置'}),null);assert.equal(currentBoard().items.length,1);await act(async()=>click('撤销'));await act(async()=>click('选择'));await act(async()=>click('菜单'));await act(async()=>click('工具栏'));await act(async()=>click('底部'));await act(async()=>click('完成'));
  });
  await check('desktop note can be added and edited directly; one undo removes the complete action',async()=>{
    await act(async()=>click('便签'));const input=screen.getByRole('textbox',{name:'文字内容'});fireEvent.change(input,{target:{value:'中文笔记\n第一行内容'}});await act(async()=>fireEvent.blur(input));assert.equal(currentBoard().items[0].text,'中文笔记\n第一行内容');assert.equal(useStore.getState().past.length,1);await act(async()=>click('撤销'));assert.equal(currentBoard().items.length,0);await act(async()=>click('重做'));assert.equal(currentBoard().items[0].text,'中文笔记\n第一行内容');
  });
  await check('mouse rectangle draw commits one object and supports object deletion',async()=>{
    await act(async()=>click('形状'));await act(async()=>click('矩形'));
    await act(async()=>{mouse('mousedown',70,70);mouse('mousemove',210,180);mouse('mouseup',210,180);});assert.equal(currentBoard().items.at(-1).kind,'rect');assert.equal(currentBoard().items.at(-1).width,140);await act(async()=>click('删除'));assert.equal(currentBoard().items.length,1);
  });
  await check('the main-toolbar eraser deletes a clicked object and supports undo without opening More',async()=>{
    const before=structuredClone(currentBoard().items),item=before[0],c=currentBoard().camera;await act(async()=>click('橡皮擦'));assert.equal(useStore.getState().tool,'erase');assert.ok(screen.getByRole('button',{name:'清空画布'}));stage().draw();await act(async()=>{mouse('mousedown',(item.x+80)*c.zoom+c.x,(item.y+60)*c.zoom+c.y);mouse('mouseup',(item.x+80)*c.zoom+c.x,(item.y+60)*c.zoom+c.y);});assert.equal(currentBoard().items.length,0);assert.equal(screen.queryByRole('group',{name:'橡皮擦选项'}),null);await act(async()=>click('撤销'));assert.deepEqual(currentBoard().items,before);await act(async()=>click('选择'));
  });
  await check('multi-object resize is committed and undone together',async()=>{
    const s=useStore.getState(),second=makeItem('note',90,90);await act(async()=>{s.change(p=>p.boards[0].items.push(second));s.select(currentBoard().items.map(e=>e.id));});const before=structuredClone(currentBoard().items),history=useStore.getState().past.length;
    await act(async()=>{for(const item of before){const node=stage().findOne('#'+item.id);node.scale({x:1.5,y:1.5});node.x(item.x+20);}stage().findOne('#'+before[0].id).fire('transformend',{evt:new Event('transformend')},true);});assert.equal(useStore.getState().past.length,history+1);assert.equal(currentBoard().items[0].width,before[0].width*1.5);assert.equal(currentBoard().items[1].width,before[1].width*1.5);await act(async()=>s.undo());assert.deepEqual(currentBoard().items,before);
  });
  await check('tablet note opens a focused text sheet and saves through the Done button',async()=>{
    coarse=true;await act(async()=>queries.get('(pointer: coarse)').notify());await act(async()=>click('便签'));assert.ok(screen.getByRole('dialog',{name:'编辑文字'}));const input=screen.getByRole('textbox',{name:'文字内容'});assert.equal(document.activeElement,input);fireEvent.compositionStart(input);fireEvent.change(input,{target:{value:'平板输入中文'}});fireEvent.compositionEnd(input);await act(async()=>click('完成'));assert.equal(currentBoard().items.at(-1).text,'平板输入中文');assert.equal(document.querySelector('[role=dialog]'),null);assert.ok(screen.getByRole('button',{name:'编辑文字'}));
  });
  await check('tablet can tap existing note text to edit without a mouse or keyboard shortcut',async()=>{
    await act(async()=>click('选择'));stage().draw();const item=currentBoard().items.at(-1),c=currentBoard().camera,x=(item.x+100)*c.zoom+c.x,y=(item.y+50)*c.zoom+c.y;
    await act(async()=>touch('touchstart',[[x,y]]));await act(async()=>touch('touchend',[],[[x,y]]));assert.ok(screen.getByRole('dialog',{name:'编辑文字'}));fireEvent.change(screen.getByRole('textbox',{name:'文字内容'}),{target:{value:'再次编辑'}});await act(async()=>click('完成'));assert.equal(currentBoard().items.at(-1).text,'再次编辑');
  });
  await check('tablet object drag changes position and one undo restores it',async()=>{
    await act(async()=>click('选择'));stage().draw();const before=structuredClone(currentBoard().items.at(-1)),c=currentBoard().camera,x=(before.x+100)*c.zoom+c.x,y=(before.y+50)*c.zoom+c.y;
    await act(async()=>touch('touchstart',[[x,y]]));await act(async()=>touch('touchmove',[[x+30,y+10]]));await act(async()=>touch('touchmove',[[x+60,y+20]]));await act(async()=>touch('touchend',[],[[x+60,y+20]]));assert.equal(currentBoard().items.at(-1).x,before.x+60/c.zoom);assert.equal(currentBoard().items.at(-1).y,before.y+20/c.zoom);await act(async()=>click('撤销'));assert.equal(currentBoard().items.at(-1).x,before.x);
  });
  await check('single-finger empty-space drag pans in selection mode without creating content',async()=>{
    await act(async()=>click('选择'));const before={...currentBoard().camera},count=currentBoard().items.length;await act(async()=>{touch('touchstart',[[850,570]]);touch('touchmove',[[900,600]]);touch('touchend',[],[[900,600]]);});assert.equal(currentBoard().camera.x,before.x+50);assert.equal(currentBoard().camera.y,before.y+30);assert.equal(currentBoard().items.length,count);
  });
  await check('pinch cancels an in-progress stroke and suppresses the remaining finger until release',async()=>{
    await act(async()=>click('画笔'));const count=currentBoard().items.length,zoom=currentBoard().camera.zoom;await act(async()=>{touch('touchstart',[[80,500]]);touch('touchmove',[[100,520]]);touch('touchstart',[[100,520],[300,520]]);touch('touchmove',[[70,510],[470,510]]);touch('touchend',[[70,510]],[[470,510]]);touch('touchmove',[[90,540]]);touch('touchend',[],[[90,540]]);});assert.equal(currentBoard().items.length,count);assert.equal(currentBoard().camera.zoom,zoom*2);
    await act(async()=>{touch('touchstart',[[60,400]]);touch('touchmove',[[70,415]]);touch('touchmove',[[90,425]]);touch('touchend',[],[[90,425]]);});assert.equal(currentBoard().items.length,count+1);assert.equal(currentBoard().items.at(-1).kind,'pen');assert.equal(currentBoard().items.at(-1).points.length,8);
  });
  await check('a touch cancellation discards a draft instead of saving accidental ink',async()=>{
    const count=currentBoard().items.length;await act(async()=>{touch('touchstart',[[500,400]]);touch('touchmove',[[550,440]]);touch('touchcancel',[],[[550,440]]);});assert.equal(currentBoard().items.length,count);
  });
  await check('tablet drawing continues while the dock is collapsed and expansion preserves the active tool',async()=>{
    const count=currentBoard().items.length;await act(async()=>click('收起工具栏'));assert.equal(useStore.getState().tool,'pen');await act(async()=>{touch('touchstart',[[500,400]]);touch('touchmove',[[550,440]]);touch('touchend',[],[[550,440]]);});assert.equal(currentBoard().items.length,count+1);await act(async()=>click('展开工具栏'));assert.equal(useStore.getState().tool,'pen');await act(async()=>click('撤销'));assert.equal(currentBoard().items.length,count);
  });
  await check('a tablet tap dismisses eraser options while erasing a stroke, and undo restores it',async()=>{
    const before=structuredClone(currentBoard().items);await act(async()=>click('橡皮擦'));assert.ok(screen.getByRole('group',{name:'橡皮擦选项'}));stage().draw();await act(async()=>{touch('touchstart',[[70,415]]);touch('touchend',[],[[70,415]]);});assert.equal(currentBoard().items.length,before.length-1);assert.equal(screen.queryByRole('group',{name:'橡皮擦选项'}),null);await act(async()=>click('撤销'));assert.deepEqual(currentBoard().items,before);
  });
  await check('clear in the eraser popover is one action; clear and undo both autosave the correct content',async()=>{
    const before=structuredClone(currentBoard().items),camera={...currentBoard().camera},history=useStore.getState().past.length;await act(async()=>click('橡皮擦'));await act(async()=>click('清空画布'));assert.equal(currentBoard().items.length,0);assert.deepEqual(currentBoard().camera,camera);assert.equal(useStore.getState().past.length,history+1);assert.equal(screen.queryByRole('button',{name:'清空画布'}),null);
    await waitFor(()=>assert.ok(screen.getByText('已保存')));let saved;await act(async()=>{saved=await readLastProject();});assert.equal(saved.boards.find(b=>b.id===saved.activeBoard).items.length,0);
    await act(async()=>click('橡皮擦'));assert.ok(screen.getByRole('button',{name:'清空画布'}).disabled);await act(async()=>click('撤销'));assert.deepEqual(currentBoard().items,before);assert.deepEqual(currentBoard().camera,camera);await waitFor(()=>assert.ok(screen.getByText('已保存')));await act(async()=>{saved=await readLastProject();});assert.deepEqual(saved.boards.find(b=>b.id===saved.activeBoard).items,before);
    await act(async()=>click('重做'));assert.equal(currentBoard().items.length,0);await act(async()=>click('撤销'));assert.deepEqual(currentBoard().items,before);await act(async()=>click('选择'));
  });
  await check('Help contains usage, installation and file portability guidance; appearance has plain labels',async()=>{
    await act(async()=>click('Help'));assert.ok(screen.getByRole('dialog',{name:'Help'}));assert.ok(screen.getByText(/不同设备之间不会自动同步/));assert.ok(screen.getByText(/添加到主屏幕/));await act(async()=>click('关闭'));await act(async()=>click('菜单'));await act(async()=>click('外观'));for(const label of ['浅色','深色','极光','电子'])assert.ok(screen.getByRole('button',{name:label}));await act(async()=>click('深色'));assert.ok(document.querySelector('.app.dark'));await act(async()=>click('完成'));
  });
  await check('project gallery switches saved projects without replacement warnings or lost content',async()=>{
    await act(async()=>click('菜单'));await act(async()=>click('重命名'));fireEvent.change(screen.getByRole('textbox',{name:'画布名称'}),{target:{value:'原有资料'}});await act(async()=>click('完成'));const id=useStore.getState().project.id,count=currentBoard().items.length;
    await act(async()=>click('菜单'));await act(async()=>click('新建画布'));await waitFor(()=>assert.equal(currentBoard().items.length,0));await act(async()=>fireEvent.click(document.querySelector('.project-name')));await waitFor(()=>assert.ok(screen.getByRole('dialog',{name:'我的画布'})));await act(async()=>fireEvent.click(screen.getByText('原有资料')));await waitFor(()=>assert.equal(useStore.getState().project.id,id));assert.equal(currentBoard().items.length,count);assert.ok((await listProjects()).length>=2);
  });
  await check('automatic local save reopens the last project with content and camera',async()=>{
    await waitFor(()=>assert.ok(screen.getByText('已保存')));const before=structuredClone(useStore.getState().project);cleanup();await act(async()=>{useStore.getState().load(emptyProject());render(React.createElement(App));});await waitFor(()=>assert.equal(useStore.getState().project.id,before.id));assert.equal(currentBoard().items.length,before.boards[0].items.length);assert.deepEqual(currentBoard().camera,before.boards[0].camera);let saved;await act(async()=>{saved=await readLastProject();});assert.equal(saved.id,before.id);await waitFor(()=>assert.ok(screen.getByText('已保存')));
  });
  await check('reopening restores both the side placement and collapsed state alongside saved notes',async()=>{
    await act(async()=>click('菜单'));await act(async()=>click('工具栏'));await act(async()=>click('左侧'));await act(async()=>click('完成'));await act(async()=>click('收起工具栏'));await waitFor(async()=>assert.deepEqual(await readWorkspacePreferences(),{toolbarPosition:'left',toolbarCollapsed:true}));const before=structuredClone(useStore.getState().project);cleanup();await act(async()=>{useStore.getState().load(emptyProject());render(React.createElement(App));});await waitFor(()=>assert.equal(useStore.getState().project.id,before.id));await waitFor(()=>assert.ok(screen.getByRole('button',{name:'展开工具栏'})));assert.equal(document.querySelector('.app').dataset.toolbarPosition,'left');assert.equal(screen.queryByRole('button',{name:'画笔'}),null);assert.deepEqual(currentBoard().items,before.boards.find(b=>b.id===before.activeBoard).items);await act(async()=>click('展开工具栏'));await act(async()=>click('菜单'));await act(async()=>click('工具栏'));await act(async()=>click('底部'));await act(async()=>click('完成'));
  });
  cleanup();
  await check('PNG export uses actual canvas nodes and outputs dimensions within the allocation cap',async()=>{
    const project=emptyProject(),note={...makeItem('note',-300,20),text:'导出中文',fill:'#dce6ff'};project.boards[0].items.push(note);useStore.getState().load(project);const ref=React.createRef();await act(async()=>{render(React.createElement(Canvas,{ref,onImport(){},presenting:false,multiple:false,coarse:true,onEditing(){}}));});const data=await ref.current.export(false,false,2),image=new Image();image.src=Buffer.from(data.split(',')[1],'base64');assert.ok(image.width>note.width&&image.width<=8192);assert.ok(image.height>note.height&&image.height<=8192);assert.ok(data.startsWith('data:image/png;base64,'));cleanup();
  });
  console.log(`UI integration checks passed: ${logs.length}`);
}finally{cleanup();dom.window.close();await fs.rm(generated,{force:true});}
