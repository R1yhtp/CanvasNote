import {decode,encode,download,safeName} from './files';
import {Project} from './model';
import {invoke} from '@tauri-apps/api/core';
declare global {interface Window {canvasnote?:{open:()=>Promise<{data:number[];path:string}|null>;save:(data:number[],name:string)=>Promise<string|null>;exportPNG:(data:number[],name:string)=>Promise<string|null>;dirty:(v:boolean)=>void};__TAURI_INTERNALS__?:unknown}}
if(typeof window!=='undefined'&&window.__TAURI_INTERNALS__&&!window.canvasnote){window.canvasnote={open:()=>invoke('project_open'),save:(data,name)=>invoke('project_save',{data,name,exporting:false}),exportPNG:(data,name)=>invoke('project_save',{data,name,exporting:true}),dirty:value=>{invoke('project_dirty',{value}).catch(()=>{});}};}
export async function saveProject(p:Project){const bytes=await encode(p);if(window.canvasnote)return Boolean(await window.canvasnote.save(Array.from(bytes),safeName(p.name)+'.canvasnote'));download(new Blob([bytes as BlobPart]),safeName(p.name)+'.canvasnote');return true;}
export async function openNative(){const r=await window.canvasnote?.open();return r?decode(new Uint8Array(r.data)):null;}
export async function savePNG(dataUrl:string,name:string){const blob=await(await fetch(dataUrl)).blob();if(window.canvasnote)return Boolean(await window.canvasnote.exportPNG(Array.from(new Uint8Array(await blob.arrayBuffer())),safeName(name)+'.png'));download(blob,safeName(name)+'.png');return true;}
