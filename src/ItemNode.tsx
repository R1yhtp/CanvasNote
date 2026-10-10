import {memo,useEffect,useState} from 'react';
import {Group,Rect,Ellipse,Text,Line,Arrow,Image as KImage} from 'react-konva';
import {Item} from './model';
import type {KonvaEventObject} from 'konva/lib/Node';
type Props={item:Item;image?:string;selected:boolean;editing:boolean;interactive:boolean;ink:string;onDown:(e:KonvaEventObject<MouseEvent|TouchEvent>,item:Item)=>void;onEdit:(item:Item)=>void;onDrag:(e:KonvaEventObject<DragEvent>,item:Item,phase:string)=>void;onTransform:(e:KonvaEventObject<Event>,item:Item)=>void};
export const ItemNode=memo(function ItemNode({item:e,image,selected,editing,interactive,ink,onDown,onEdit,onDrag,onTransform}:Props){const[img,setImg]=useState<HTMLImageElement>();useEffect(()=>{if(!image){setImg(undefined);return;}let alive=true;const i=new window.Image();i.onload=()=>alive&&setImg(i);i.src=image;return()=>{alive=false;};},[image]);if(e.hidden)return null;
const common={fill:e.fill,stroke:e.stroke,strokeWidth:e.strokeWidth};let body;
switch(e.kind){case 'note':body=<><Rect width={e.width} height={e.height} fill={e.fill} cornerRadius={5} shadowColor="#000" shadowBlur={6} shadowOpacity={.08} shadowOffsetY={3}/><Text visible={!editing} x={18} y={18} width={Math.max(30,e.width-36)} height={e.height-30} text={e.text} fontFamily="Segoe UI, Microsoft YaHei, sans-serif" fontSize={e.fontSize} fill={e.textColor||'#26313c'} lineHeight={1.5} wrap="char"/></>;break;
case 'text':body=<><Rect width={e.width} height={e.height} fill="rgba(0,0,0,0)"/><Text visible={!editing} width={e.width} height={e.height} text={e.text} fontFamily="Segoe UI, Microsoft YaHei, sans-serif" fontSize={e.fontSize} fill={e.textColor||ink} lineHeight={1.5} wrap="char"/></>;break;
case 'rect':body=<Rect width={e.width} height={e.height} {...common} cornerRadius={12}/>;break;
case 'ellipse':body=<Ellipse x={e.width/2} y={e.height/2} radiusX={e.width/2} radiusY={e.height/2} {...common}/>;break;
case 'arrow':body=<Arrow points={e.points||[0,0,e.width,e.height]} stroke={e.stroke} fill={e.stroke} strokeWidth={e.strokeWidth} pointerLength={12} pointerWidth={12} hitStrokeWidth={18}/>;break;
case 'pen':case 'highlight':body=<Line points={e.points||[]} stroke={e.stroke} strokeWidth={e.strokeWidth} lineCap="round" lineJoin="round" tension={.3} hitStrokeWidth={Math.max(e.strokeWidth,15)}/>;break;
case 'image':body=img?<><Rect width={e.width} height={e.height} fill="#fff" cornerRadius={10} shadowColor="#000" shadowBlur={12} shadowOpacity={.16} shadowOffsetY={5}/><KImage image={img} width={e.width} height={e.height}/></>:<Rect width={e.width} height={e.height} fill="#80919d"/>;break;
case 'frame':body=<><Rect width={e.width} height={e.height} fill="rgba(130,140,180,.025)" stroke={selected?'#8a8fff':'#788395'} strokeWidth={1.5} dash={[8,6]} cornerRadius={10}/><Text text={e.text||'演示区域'} y={-26} fontSize={14} fill={ink}/></>;}
return <Group id={e.id} name="item" x={e.x} y={e.y} rotation={e.rotation} opacity={e.opacity??(e.kind==='highlight'?.36:1)} draggable={interactive&&!e.locked} onMouseDown={v=>onDown(v,e)} onTouchStart={v=>onDown(v,e)} onDblClick={()=>interactive&&onEdit(e)} onTap={()=>interactive&&onEdit(e)} onDragStart={v=>onDrag(v,e,'start')} onDragMove={v=>onDrag(v,e,'move')} onDragEnd={v=>onDrag(v,e,'end')} onTransformEnd={v=>onTransform(v,e)}>{body}</Group>;
});
