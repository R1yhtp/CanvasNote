import {create} from 'zustand';
import {Project,Item,Tool,emptyProject,uid,prune} from './model';
function restoreContent(content:Project,current:Project):Project{return {...content,activeBoard:content.boards.some(b=>b.id===current.activeBoard)?current.activeBoard:content.activeBoard,boards:content.boards.map(b=>({...b,camera:current.boards.find(view=>view.id===b.id)?.camera||b.camera})),updatedAt:new Date().toISOString()};}
interface State {project:Project;selection:string[];tool:Tool;past:Project[];future:Project[];revision:number;dirty:boolean;color:string;stroke:string;penWidth:number;setTool:(t:Tool)=>void;select:(s:string[])=>void;change:(f:(p:Project)=>void,merge?:boolean)=>void;preview:(f:(p:Project)=>void)=>void;undo:()=>void;redo:()=>void;load:(p:Project)=>void;saved:(revision:number)=>void;remove:()=>void;clearBoard:()=>void;copy:()=>Item[];paste:(items:Item[],offset?:number)=>void;patch:(ids:string[],v:Partial<Item>)=>void}
export const useStore=create<State>((set,get)=>({project:emptyProject(),selection:[],tool:'select',past:[],future:[],revision:0,dirty:false,color:'#fff2be',stroke:'#334155',penWidth:3,setTool:tool=>set({tool,selection:[]}),select:selection=>set({selection}),
change:(f,merge=false)=>{const s=get(),p=structuredClone(s.project);f(p);p.updatedAt=new Date().toISOString();set({project:p,past:merge?s.past:[...s.past.slice(-59),s.project],future:[],revision:s.revision+1,dirty:true});},
preview:f=>{const p=structuredClone(get().project);f(p);set({project:p});},
undo:()=>{const s=get();if(!s.past.length)return;set({project:restoreContent(s.past.at(-1)!,s.project),past:s.past.slice(0,-1),future:[s.project,...s.future],revision:s.revision+1,dirty:true,selection:[]});},
redo:()=>{const s=get();if(!s.future.length)return;set({project:restoreContent(s.future[0],s.project),past:[...s.past,s.project],future:s.future.slice(1),revision:s.revision+1,dirty:true,selection:[]});},
load:project=>set(s=>({project,selection:[],tool:'select',past:[],future:[],revision:s.revision+1,dirty:false})),saved:revision=>{if(get().revision===revision)set({dirty:false});},
remove:()=>{const s=get();s.change(p=>{const b=p.boards.find(b=>b.id===p.activeBoard)!;b.items=b.items.filter(e=>!s.selection.includes(e.id)||e.locked);});set({selection:[]});},
clearBoard:()=>{const s=get(),board=s.project.boards.find(b=>b.id===s.project.activeBoard)!;if(!board.items.length)return;s.change(p=>{p.boards.find(b=>b.id===board.id)!.items=[];});set({selection:[]});},
copy:()=>{const s=get();return structuredClone(s.project.boards.find(b=>b.id===s.project.activeBoard)!.items.filter(e=>s.selection.includes(e.id)));},
paste:(items,offset=28)=>{const groups=new Map<string,string>(),copies=items.map(e=>({...structuredClone(e),id:uid(),x:e.x+offset,y:e.y+offset,locked:false,groupId:e.groupId?(groups.get(e.groupId)||(()=>{const n=uid();groups.set(e.groupId!,n);return n;})()):undefined}));get().change(p=>p.boards.find(b=>b.id===p.activeBoard)!.items.push(...copies));set({selection:copies.map(e=>e.id),tool:'select'});},
patch:(ids,v)=>get().change(p=>{const b=p.boards.find(b=>b.id===p.activeBoard)!;b.items=b.items.map(e=>ids.includes(e.id)&&!e.locked?{...e,...v}:e);})}));
export function currentBoard(){const p=useStore.getState().project;return p.boards.find(b=>b.id===p.activeBoard)!;}
export function snapshot(){return prune(useStore.getState().project);}
