import {Item,bounds} from './model';
export function exportLayout(items:Item[],density:number){
  if(!items.length)throw Error('没有可导出的内容');
  const box=bounds(items),padding=40,width=box.width+padding*2,height=box.height+padding*2;
  const scale=Math.min(Math.max(.1,density),8192/width,8192/height,Math.sqrt(32000000/(width*height)));
  return {width:Math.max(1,Math.floor(width*scale)),height:Math.max(1,Math.floor(height*scale)),scale,x:(padding-box.x)*scale,y:(padding-box.y)*scale};
}
