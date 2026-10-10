import {Camera,zoomAt} from './model';
export interface Point {x:number;y:number}
export interface Pinch {center:Point;distance:number;camera:Camera}
export function startPinch(points:Point[],camera:Camera):Pinch|null {
  if(points.length<2)return null;
  const [a,b]=points;
  return {center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),camera:{...camera}};
}
export function movePinch(start:Pinch,points:Point[]):Camera {
  if(points.length<2)return start.camera;
  const now=startPinch(points,start.camera)!;
  const camera=zoomAt(start.camera,start.center,start.camera.zoom*now.distance/start.distance);
  return {...camera,x:camera.x+now.center.x-start.center.x,y:camera.y+now.center.y-start.center.y};
}
export function sameSelection(ids:string[],id:string,group:string[],multiple:boolean):string[] {
  if(multiple)return ids.includes(id)?ids.filter(x=>!group.includes(x)):[...new Set([...ids,...group])];
  return ids.includes(id)?ids:group;
}
