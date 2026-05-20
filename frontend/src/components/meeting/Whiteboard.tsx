'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Trash2, Download, Pencil, Eraser, Minus, Plus } from 'lucide-react';

interface Props {
  onDraw: (data: any) => void;
  onExternalDraw: (cb: (data: any) => void) => void;
  onClear: () => void;
  onClose: () => void;
}

const COLORS = ['#ffffff', '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#f97316'];

export default function Whiteboard({ onDraw, onExternalDraw, onClear, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [color, setColor] = useState('#ffffff');
  const [size, setSize] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    onExternalDraw((data: any) => {
      if (data.clear) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }
      drawLine(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.size, data.tool);
    });
  }, []);

  const drawLine = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, sz: number, t: string) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = t === 'eraser' ? '#1e293b' : col;
    ctx.lineWidth = t === 'eraser' ? sz * 4 : sz;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    drawLine(ctx, lastPos.current.x, lastPos.current.y, pos.x, pos.y, color, size, tool);
    onDraw({ x0: lastPos.current.x, y0: lastPos.current.y, x1: pos.x, y1: pos.y, color, size, tool });
    lastPos.current = pos;
  };

  const stopDrawing = () => { drawing.current = false; };

  const handleClear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = canvasRef.current!.toDataURL('image/png');
    a.download = 'whiteboard.png';
    a.click();
  };

  return (
    <div className="sidebar animate-fade-in flex flex-col lg:w-[400px]">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="font-semibold text-white">Whiteboard</h3>
        <div className="flex items-center gap-1">
          <button onClick={handleClear} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white" title="Clear">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={download} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white" title="Download">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 border-b border-white/10 flex-wrap">
        <div className="flex gap-1">
          <button onClick={() => setTool('pen')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${tool === 'pen' ? 'bg-blue-600' : 'hover:bg-white/10'}`}>
            <Pencil className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={() => setTool('eraser')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${tool === 'eraser' ? 'bg-blue-600' : 'hover:bg-white/10'}`}>
            <Eraser className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSize(s => Math.max(1, s - 1))} className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-white">
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-white text-xs w-4 text-center">{size}</span>
          <button onClick={() => setSize(s => Math.min(20, s + 1))} className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-white">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-125' : 'border-transparent'}`}
              style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <canvas ref={canvasRef}
          style={{ width: '100%', height: '100%', cursor: tool === 'eraser' ? 'crosshair' : 'pencil', display: 'block' }}
          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
      </div>
    </div>
  );
}
