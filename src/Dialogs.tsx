import {ReactNode,useEffect,useRef} from 'react';
import {X,Check,Upload,Sun,Moon,Sparkles,Activity,PanelBottom,PanelLeft,PanelRight} from 'lucide-react';
import {useStore} from './store';
import {Theme} from './model';
import {WorkspacePreferences,ToolbarPosition} from './workspacePreferences';

export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
  const ref=useRef<HTMLElement>(null),close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    // An editor focuses its textarea in the originating touch event so iPad can open the keyboard.
    if(!ref.current?.contains(document.activeElement))ref.current?.focus({preventScroll:true});
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close.current();}
      if(event.key==='Tab'){
        const nodes=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea,select,[tabindex="0"]')||[]),first=nodes[0],last=nodes.at(-1);
        if(!first)return;
        if(event.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[]);
  return <div className="modal-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}><section ref={ref} tabIndex={-1} className={`modal ${wide?'wide':''}`} role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="icon-button" aria-label="关闭" onClick={onClose}><X size={20}/></button></header><div className="modal-body">{children}</div></section></div>;
}
export function Appearance({onClose,onBackground}:{onClose:()=>void;onBackground:()=>void}){
  const a=useStore(s=>s.project.appearance),change=useStore(s=>s.change),update=(v:Partial<typeof a>)=>{if(v.theme){const state=useStore.getState();if(['#334155','#d4dce9'].includes(state.stroke))useStore.setState({stroke:v.theme==='paper'?'#334155':'#d4dce9'});}change(p=>Object.assign(p.appearance,v));};
  const themes:[Theme,string,typeof Sun][]=[['paper','浅色',Sun],['dark','深色',Moon],['aurora','极光',Sparkles],['cyber','电子',Activity]];
  return <Modal title="外观" onClose={onClose}><div className="theme-options">{themes.map(([id,name,Icon])=><button key={id} className={`theme-option ${id} ${a.theme===id?'active':''}`} aria-pressed={a.theme===id} onClick={()=>update({theme:id})}><span className="theme-preview"><Icon size={22}/>{a.theme===id&&<Check size={15}/>}</span><span>{name}</span></button>)}</div>
    <label className="setting-row"><span>画布背景</span><select aria-label="画布背景" value={a.grid} onChange={e=>update({grid:e.target.value as typeof a.grid})}><option value="dots">点阵</option><option value="lines">网格</option><option value="none">纯色</option></select></label>
    {['aurora','cyber'].includes(a.theme)&&<div className="setting-row"><label htmlFor="motion">动态效果</label><button id="motion" className={`toggle ${a.motion?'on':''}`} aria-label="动态效果" aria-pressed={a.motion} onClick={()=>update({motion:!a.motion})}><i/></button></div>}
    <div className="setting-row"><span>背景图片</span><div className="row-actions"><button onClick={onBackground}><Upload size={16}/>上传</button>{a.backgroundId&&<button onClick={()=>update({backgroundId:undefined})}>移除</button>}</div></div>
    {a.backgroundId&&<label className="setting-row"><span>图片透明度</span><input aria-label="图片透明度" type="range" min="0" max="1" step=".05" value={a.backgroundOpacity} onChange={e=>update({backgroundOpacity:Number(e.target.value)})}/><span>{Math.round(a.backgroundOpacity*100)}%</span></label>}
    <footer><button className="primary" onClick={onClose}>完成</button></footer></Modal>;
}
export function ToolbarSettings({value,onChange,onClose}:{value:WorkspacePreferences;onChange:(value:Partial<WorkspacePreferences>)=>void;onClose:()=>void}){
  const positions:[ToolbarPosition,string,typeof PanelBottom][]=[['bottom','底部',PanelBottom],['left','左侧',PanelLeft],['right','右侧',PanelRight]];
  return <Modal title="工具栏" onClose={onClose}><h3>位置</h3><div className="toolbar-positions" role="group" aria-label="工具栏位置">{positions.map(([position,label,Icon])=><button key={position} aria-pressed={value.toolbarPosition===position} className={value.toolbarPosition===position?'active':''} onClick={()=>onChange({toolbarPosition:position})}><Icon size={23}/><span>{label}</span></button>)}</div><label className="setting-row"><span>收起工具栏</span><input type="checkbox" aria-label="收起工具栏" checked={value.toolbarCollapsed} onChange={event=>onChange({toolbarCollapsed:event.target.checked})}/></label><footer><button className="primary" onClick={onClose}>完成</button></footer></Modal>;
}
export function Help({onClose,onInstall,installable}:{onClose:()=>void;onInstall:()=>void;installable:boolean}){
  return <Modal title="Help" onClose={onClose} wide><div className="help-content">
    <section><h3>画布操作</h3><p>撤销和重做在工具栏里。点工具栏末尾的双箭头可收起，再点小箭头展开。菜单里的“工具栏”可选择底部、左侧或右侧；布局会保存在当前设备。收起工具栏后仍可继续绘制，电脑撤销快捷键也可照常使用。</p><p>选择工具下，拖动物体改变位置。电脑拖动空白处可框选；平板拖动空白处移动画布，双指捏合缩放。</p><p>手形工具可以拖动画布。电脑也可以按住空格拖动，按 Ctrl / ⌘ 滚轮缩放。</p><p>点击“便签”或“文字”直接添加。电脑双击文字编辑；平板点按文字编辑，再点“完成”。用形状或画笔工具在画布上拖动即可绘制。</p><p>点“画笔”可以调整颜色和粗细，点画布后设置面板收起；再次点画笔可以重新打开。“橡皮擦”删除点到的整个对象或笔迹，点开后也可以选择“清空画布”。清空只影响当前画布，点一次撤销就能恢复；背景和其他画布会保留。</p><p>“更多工具”里可以开启多选，然后逐个点选对象。选中后可修改颜色、字号、复制、删除；“对象属性”里可以组合、排列或锁定。</p></section>
    <section><h3>资料和文件</h3><p>“资料”可以导入图片或 PDF。PDF 选择一页作为图片放入画布。电脑也支持拖入文件或粘贴截图、文字。</p><p>内容自动保存在当前设备和浏览器中，菜单里的“我的画布”可以切换项目。关闭后再次打开会回到上次的项目。</p><p>“导出”可以保存可继续编辑的 .canvasnote 文件，或导出 PNG 图片。另一台设备通过“打开文件”导入项目；不同设备之间不会自动同步。</p><p>清除浏览器的网站数据会删除本机画布。重要资料请导出项目文件备份。</p></section>
    <section><h3>平板与离线使用</h3><p>iPad：在 Safari 中打开此应用地址，在分享菜单里选择“添加到主屏幕”。Android：使用浏览器菜单中的“安装应用”或“添加到主屏幕”。</p><p>首次联网打开并完成缓存后，可离线使用。应用更新、首次打开和尚未缓存的内容仍需要网络。</p>{installable&&<button onClick={onInstall}>安装应用</button>}</section>
    <section><h3>电脑快捷键</h3><div className="shortcut-grid">{[['V','选择'],['H','手形'],['P','画笔'],['N / T','便签 / 文字'],['R / A','矩形 / 箭头'],['Delete','删除'],['Ctrl / ⌘ Z','撤销'],['Ctrl / ⌘ Shift Z','重做'],['Ctrl / ⌘ S','立即保存到本机'],['Ctrl / ⌘ C / V','复制 / 粘贴'],['Ctrl / ⌘ D','复制一份'],['Ctrl / ⌘ A','全选']].map(([key,label])=><div key={key}><span>{label}</span><kbd>{key}</kbd></div>)}</div></section>
    <p className="version-label">CanvasNote 0.1.0</p></div></Modal>;
}
