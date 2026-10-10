import {Project,Item,Theme,prune,validate} from './model';
import {WorkspacePreferences,normalizeWorkspacePreferences} from './workspacePreferences';
export interface ProjectSummary {id:string;name:string;updatedAt:string;theme:Theme;items:Item[];boardCount:number}
let opening:Promise<IDBDatabase>|undefined;
function database(){
  return opening??=new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open('canvasnote-local',2);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains('recovery'))db.createObjectStore('recovery');
      if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects',{keyPath:'id'});
      if(!db.objectStoreNames.contains('summaries'))db.createObjectStore('summaries',{keyPath:'id'});
      if(!db.objectStoreNames.contains('preferences'))db.createObjectStore('preferences');
    };
    request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();opening=undefined;};resolve(request.result);};
    request.onerror=()=>{opening=undefined;reject(request.error);};
    request.onblocked=()=>{opening=undefined;reject(Error('请关闭其他旧版 CanvasNote 窗口后重试。'));};
  });
}
async function get<T>(store:string,key:string):Promise<T|undefined>{
  const db=await database();
  return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
export function readRecovery(){return get<Project>('recovery','latest');}
export async function readLastProject(){
  const id=await get<string>('preferences','active');
  const p=id?await get<Project>('projects',id):await readRecovery();
  return p?validate(p):undefined;
}
export async function listProjects():Promise<ProjectSummary[]>{
  const db=await database();
  return new Promise((resolve,reject)=>{const r=db.transaction('summaries').objectStore('summaries').getAll();r.onsuccess=()=>resolve(r.result.sort((a:ProjectSummary,b:ProjectSummary)=>b.updatedAt.localeCompare(a.updatedAt)));r.onerror=()=>reject(r.error);});
}
export async function readProject(id:string){const p=await get<Project>('projects',id);return p?validate(p):undefined;}
let queue:Promise<unknown>=Promise.resolve();
export async function readWorkspacePreferences(){return normalizeWorkspacePreferences(await get<unknown>('preferences','workspace'));}
export function writeWorkspacePreferences(preferences:WorkspacePreferences){
  const value=normalizeWorkspacePreferences(preferences);
  const job=queue.catch(()=>{}).then(async()=>{
    const db=await database();
    await new Promise<void>((resolve,reject)=>{const transaction=db.transaction('preferences','readwrite');transaction.objectStore('preferences').put(value,'workspace');transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error||Error('工具栏设置保存失败'));});
  });
  queue=job;return job;
}
export function writeRecovery(project:Project){
  const p=prune(project);
  const summary:ProjectSummary={id:p.id,name:p.name,updatedAt:p.updatedAt,theme:p.appearance.theme,items:p.boards[0].items.filter(x=>!x.hidden).slice(0,80).map(x=>({...x,points:x.points?.slice(0,160)})),boardCount:p.boards.length};
  const job=queue.catch(()=>{}).then(async()=>{
    const db=await database();
    await new Promise<void>((resolve,reject)=>{
      const transaction=db.transaction(['projects','summaries','preferences','recovery'],'readwrite');
      transaction.objectStore('projects').put(p);
      transaction.objectStore('summaries').put(summary);
      transaction.objectStore('preferences').put(p.id,'active');
      transaction.objectStore('recovery').put(p,'latest');
      transaction.oncomplete=()=>resolve();
      transaction.onerror=()=>reject(transaction.error);
      transaction.onabort=()=>reject(transaction.error||Error('本机保存失败'));
    });
  });
  queue=job;
  return job;
}
export async function deleteProject(id:string){
  await queue.catch(()=>{});
  const db=await database();
  await new Promise<void>((resolve,reject)=>{const t=db.transaction(['projects','summaries','preferences','recovery'],'readwrite');t.objectStore('projects').delete(id);t.objectStore('summaries').delete(id);const active=t.objectStore('preferences').get('active');active.onsuccess=()=>{if(active.result===id){t.objectStore('preferences').delete('active');t.objectStore('recovery').delete('latest');}};t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('删除失败'));});
}
