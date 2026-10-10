import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import {
  MousePointer2, Pencil, Eraser, StickyNote, Type, Square, Circle, ArrowUpRight,
  ImagePlus, Hand, MoreHorizontal, Highlighter, Scan, Check, CheckSquare,
  Trash2, Undo2, Redo2, ChevronsDown, ChevronsUp, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { Tool } from './model';
import { currentBoard, useStore } from './store';
import { ToolbarPosition } from './workspacePreferences';

type Props = {
  position: ToolbarPosition;
  collapsed: boolean;
  disabled: boolean;
  popup: string | null;
  multiple: boolean;
  onPopup: (popup: string | null) => void;
  onTool: (tool: Tool, options?: boolean) => void;
  onCollapse: (collapsed: boolean) => void;
  onMultiple: () => void;
};

// Popovers sit outside the scrolling tool list so a short tablet screen cannot clip them.
function ToolPopover({ anchor, position, pen = false, label, children }: {
  anchor: HTMLButtonElement | null;
  position: ToolbarPosition;
  pen?: boolean;
  label?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState<{ left: number; top: number }>();
  useLayoutEffect(() => {
    const place = () => {
      if (!anchor || !ref.current) return;
      const rect = anchor.getBoundingClientRect(), margin = 12, gap = 10;
      const width = Math.min(ref.current.offsetWidth || (pen ? 232 : 180), window.innerWidth - margin * 2);
      const height = Math.min(ref.current.offsetHeight || 200, window.innerHeight - margin * 2);
      const left = position === 'left' ? rect.right + gap
        : position === 'right' ? rect.left - width - gap
        : rect.left + rect.width / 2 - width / 2;
      const top = position === 'bottom' ? rect.top - height - gap
        : rect.top + rect.height / 2 - height / 2;
      setPoint({
        left: Math.max(margin, Math.min(left, window.innerWidth - width - margin)),
        top: Math.max(margin, Math.min(top, window.innerHeight - height - margin)),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchor, position, pen]);
  return <div ref={ref} className={`popup tool-popup ${pen ? 'pen-popup' : ''}`}
    role={label ? 'group' : undefined} aria-label={label}
    style={{ ...point, visibility: point ? 'visible' : 'hidden' }}>{children}</div>;
}

export function Toolbar({ position, collapsed, disabled, popup, multiple,
  onPopup, onTool, onCollapse, onMultiple }: Props) {
  const s = useStore(), board = currentBoard();
  const anchors = useRef<Record<string, HTMLButtonElement | null>>({});
  const shapeTools: Tool[] = ['rect', 'ellipse', 'arrow'];
  const shape = shapeTools.includes(s.tool) ? s.tool : 'rect';
  const shapeIcons = { rect: Square, ellipse: Circle, arrow: ArrowUpRight };
  const tools = [
    ['select', '选择', MousePointer2], ['pen', '画笔', Pencil], ['erase', '橡皮擦', Eraser],
    ['note', '便签', StickyNote], ['text', '文字', Type],
    ['shapes', '形状', shapeIcons[shape as keyof typeof shapeIcons]],
    ['image', '资料', ImagePlus], ['hand', '手形', Hand], ['extra', '更多', MoreHorizontal],
  ] as const;
  const Collapse = position === 'left' ? ChevronsLeft : position === 'right' ? ChevronsRight : ChevronsDown;
  const Expand = position === 'left' ? ChevronsRight : position === 'right' ? ChevronsLeft : ChevronsUp;
  const active = (tool: string) => s.tool === tool
    || tool === 'shapes' && shapeTools.includes(s.tool)
    || tool === 'extra' && ['highlight', 'frame'].includes(s.tool);
  const anchor = anchors.current[popup === 'highlight' ? 'extra' : popup || ''] || null;

  return <>
    <div className={`tool-dock dock-${position} ${collapsed ? 'is-collapsed' : ''}`}
      role="toolbar" aria-label="绘图工具" aria-orientation={position === 'bottom' ? 'horizontal' : 'vertical'}>
      {collapsed ? <button className="icon-button dock-toggle" aria-label="展开工具栏" title="展开工具栏"
        aria-expanded={false} aria-controls="canvasnote-tools" disabled={disabled}
        onClick={() => onCollapse(false)}><Expand size={21} /></button> : <>
        <div className="dock-scroll" id="canvasnote-tools" onScroll={() => onPopup(null)}>
          {tools.map(([tool, label, Icon]) => <div className="popup-anchor" key={tool}>
            <button ref={node => { anchors.current[tool] = node; }}
              className={`tool-button ${active(tool) ? 'active' : ''} ${tool === 'select' && multiple ? 'multi' : ''}`}
              aria-label={tool === 'extra' ? '更多工具' : label} title={label} aria-pressed={active(tool)}
              aria-expanded={['pen', 'erase', 'shapes', 'extra'].includes(tool)
                ? popup === tool || tool === 'extra' && popup === 'highlight' : undefined}
              onClick={() => tool === 'shapes' || tool === 'extra'
                ? onPopup(popup === tool ? null : tool) : onTool(tool as Tool, true)}
              disabled={disabled}><Icon size={21} /><span>{label}</span></button>
          </div>)}
        </div>
        <div className="dock-actions">
          <div className="dock-history" role="group" aria-label="历史操作">
            <button className="icon-button" aria-label="撤销" title="撤销" disabled={disabled || !s.past.length}
              onClick={s.undo}><Undo2 size={20} /></button>
            <button className="icon-button" aria-label="重做" title="重做" disabled={disabled || !s.future.length}
              onClick={s.redo}><Redo2 size={20} /></button>
          </div>
          <button className="icon-button dock-toggle" aria-label="收起工具栏" title="收起工具栏"
            aria-expanded={true} aria-controls="canvasnote-tools" disabled={disabled}
            onClick={() => onCollapse(true)}><Collapse size={21} /></button>
        </div>
      </>}
    </div>
    {!collapsed && ['pen', 'highlight', 'erase', 'shapes', 'extra'].includes(popup || '') &&
      <ToolPopover key={popup} anchor={anchor} position={position} pen={popup === 'pen' || popup === 'highlight'}
        label={popup === 'pen' || popup === 'highlight' ? '画笔设置' : popup === 'erase' ? '橡皮擦选项' : undefined}>
        {(popup === 'pen' || popup === 'highlight') && <>
          <label className="pen-color"><span>颜色</span><input type="color" aria-label="画笔颜色" value={s.stroke}
            onChange={event => useStore.setState({ stroke: event.target.value })} /></label>
          <label className="pen-width"><span>粗细</span><output>{s.penWidth}</output>
            <input type="range" aria-label="画笔粗细" min={1} max={20} value={s.penWidth}
              onChange={event => useStore.setState({ penWidth: Number(event.target.value) })} /></label>
        </>}
        {popup === 'erase' && <button disabled={!board.items.length}
          onClick={() => { s.clearBoard(); onPopup(null); }}><Trash2 size={19} />清空画布</button>}
        {popup === 'shapes' && (['rect', 'ellipse', 'arrow'] as const).map(kind => {
          const Icon = shapeIcons[kind];
          return <button key={kind} onClick={() => onTool(kind)}><Icon size={19} />
            {{ rect: '矩形', ellipse: '椭圆', arrow: '箭头' }[kind]}{s.tool === kind && <Check size={15} />}</button>;
        })}
        {popup === 'extra' && <>
          <button onClick={() => onTool('highlight', true)}><Highlighter size={19} />荧光笔</button>
          <button onClick={() => onTool('frame')}><Scan size={19} />演示区域</button>
          <button className="menu-separator" aria-pressed={multiple} onClick={onMultiple}>
            <CheckSquare size={19} />{multiple ? '退出多选' : '多选'}</button>
          <button onClick={() => { s.setTool('select'); s.select(board.items.filter(item => !item.hidden).map(item => item.id)); onPopup(null); }}>
            <MousePointer2 size={19} />全选</button>
        </>}
      </ToolPopover>}
  </>;
}
