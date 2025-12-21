import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Panel, Pattern, Point } from '../../types';
import { 
  getTriangleForCell, 
  calculateGridDimensions, 
  findCellAtPoint,
  generatePatternSegments,
  generateTriangleEdges
} from '../../geometry';

interface GridCanvasProps {
  panel: Panel;
  patterns: Pattern[];
  selectedPatternId: string;
  selectedRotation: 0 | 120 | 240;
  onCellClick: (row: number, col: number, shiftKey: boolean) => void;
  onCellRightClick: (row: number, col: number) => void;
  onPatternPick: (patternId: string, rotation: 0 | 120 | 240) => void;
}

export function GridCanvas({
  panel,
  patterns,
  selectedPatternId,
  selectedRotation,
  onCellClick,
  onCellRightClick,
  onPatternPick,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [transform, setTransform] = useState({ x: 50, y: 50, scale: 3 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const defaultPattern = patterns.find(p => p.id === panel.defaultPatternId);
  
  // Draw the grid
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const { width, height } = canvas;
    const { x: offsetX, y: offsetY, scale } = transform;
    
    // Clear canvas
    ctx.fillStyle = '#1c1917'; // stone-900
    ctx.fillRect(0, 0, width, height);
    
    // Apply transform
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    // Draw panel background
    ctx.fillStyle = '#292524'; // stone-800
    ctx.fillRect(0, 0, panel.widthMm, panel.heightMm);
    
    // Draw panel border
    ctx.strokeStyle = '#78716c'; // stone-500
    ctx.lineWidth = 0.5 / scale;
    ctx.strokeRect(0, 0, panel.widthMm, panel.heightMm);
    
    // Calculate grid dimensions
    const { rows, cols } = calculateGridDimensions(
      panel.widthMm,
      panel.heightMm,
      panel.triangleSizeMm
    );
    
    // Draw triangles
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tri = getTriangleForCell(row, col, panel.triangleSizeMm);
        
        // Check if triangle is visible in panel
        const minX = Math.min(tri.A.x, tri.B.x, tri.C.x);
        const maxX = Math.max(tri.A.x, tri.B.x, tri.C.x);
        const minY = Math.min(tri.A.y, tri.B.y, tri.C.y);
        const maxY = Math.max(tri.A.y, tri.B.y, tri.C.y);
        
        if (maxX < 0 || minX > panel.widthMm || maxY < 0 || minY > panel.heightMm) {
          continue;
        }
        
        // Get pattern for this cell
        const cellKey = `${row},${col}`;
        const cellConfig = panel.cells[cellKey];
        const pattern = cellConfig
          ? patterns.find(p => p.id === cellConfig.patternId) || defaultPattern
          : defaultPattern;
        const rotation = cellConfig?.rotation || 0;
        
        if (!pattern) continue;
        
        // Clip to panel bounds
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, panel.widthMm, panel.heightMm);
        ctx.clip();

        // Draw triangle fill
        ctx.fillStyle = '#44403c'; // stone-700
        ctx.beginPath();
        ctx.moveTo(tri.A.x, tri.A.y);
        ctx.lineTo(tri.B.x, tri.B.y);
        ctx.lineTo(tri.C.x, tri.C.y);
        ctx.closePath();
        ctx.fill();

        // Clip to triangle bounds for pattern segments
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tri.A.x, tri.A.y);
        ctx.lineTo(tri.B.x, tri.B.y);
        ctx.lineTo(tri.C.x, tri.C.y);
        ctx.closePath();
        ctx.clip();

        // Generate and draw pattern segments
        const segments = generatePatternSegments(pattern, tri, rotation);

        ctx.strokeStyle = '#d6d3d1'; // stone-300
        ctx.fillStyle = '#d6d3d1';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw polygons (filled)
        for (const poly of segments.polygons) {
          ctx.beginPath();
          ctx.moveTo(poly.points[0].x, poly.points[0].y);
          for (let i = 1; i < poly.points.length; i++) {
            ctx.lineTo(poly.points[i].x, poly.points[i].y);
          }
          ctx.closePath();
          ctx.fill();
        }

        // Draw lines
        for (const line of segments.lines) {
          ctx.lineWidth = line.weight;
          ctx.beginPath();
          ctx.moveTo(line.start.x, line.start.y);
          ctx.lineTo(line.end.x, line.end.y);
          ctx.stroke();
        }

        // Draw arcs
        for (const arc of segments.arcs) {
          ctx.lineWidth = arc.weight;
          ctx.beginPath();
          ctx.arc(arc.center.x, arc.center.y, arc.radius, arc.startAngle, arc.endAngle);
          ctx.stroke();
        }

        // Draw triangle edges
        const edges = generateTriangleEdges(tri, pattern.baseWeight);
        for (const edge of edges) {
          ctx.lineWidth = edge.weight;
          ctx.beginPath();
          ctx.moveTo(edge.start.x, edge.start.y);
          ctx.lineTo(edge.end.x, edge.end.y);
          ctx.stroke();
        }

        ctx.restore(); // Restore triangle clip
        ctx.restore(); // Restore panel clip
      }
    }
    
    ctx.restore();
  }, [panel, patterns, transform, defaultPattern]);
  
  // Resize canvas to fill container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    
    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    });
    
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [draw]);
  
  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);
  
  // Convert screen coordinates to panel coordinates
  const screenToPanel = (screenX: number, screenY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - transform.x) / transform.scale;
    const y = (screenY - rect.top - transform.y) / transform.scale;
    return { x, y };
  };
  
  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle mouse button - start panning
      setIsPanning(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (e.button === 0) {
      // Left click - start potential drag paint
      setIsDragging(true);
      const panelPos = screenToPanel(e.clientX, e.clientY);
      const cell = findCellAtPoint(panelPos, panel.triangleSizeMm);
      
      if (cell && panelPos.x >= 0 && panelPos.x <= panel.widthMm && 
          panelPos.y >= 0 && panelPos.y <= panel.heightMm) {
        if (e.shiftKey) {
          // Pick pattern
          const cellKey = `${cell.row},${cell.col}`;
          const cellConfig = panel.cells[cellKey];
          if (cellConfig) {
            onPatternPick(cellConfig.patternId, cellConfig.rotation);
          } else if (defaultPattern) {
            onPatternPick(defaultPattern.id, 0);
          }
        } else {
          onCellClick(cell.row, cell.col, e.shiftKey);
        }
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && lastMouse) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    } else if (isDragging && !e.shiftKey) {
      // Drag painting
      const panelPos = screenToPanel(e.clientX, e.clientY);
      const cell = findCellAtPoint(panelPos, panel.triangleSizeMm);
      
      if (cell && panelPos.x >= 0 && panelPos.x <= panel.widthMm && 
          panelPos.y >= 0 && panelPos.y <= panel.heightMm) {
        onCellClick(cell.row, cell.col, false);
      }
    }
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
    setLastMouse(null);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.5, Math.min(20, transform.scale * scaleFactor));
    
    // Zoom toward mouse position
    const scaleRatio = newScale / transform.scale;
    const newX = mouseX - (mouseX - transform.x) * scaleRatio;
    const newY = mouseY - (mouseY - transform.y) * scaleRatio;
    
    setTransform({ x: newX, y: newY, scale: newScale });
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const panelPos = screenToPanel(e.clientX, e.clientY);
    const cell = findCellAtPoint(panelPos, panel.triangleSizeMm);
    
    if (cell && panelPos.x >= 0 && panelPos.x <= panel.widthMm && 
        panelPos.y >= 0 && panelPos.y <= panel.heightMm) {
      onCellRightClick(cell.row, cell.col);
    }
  };
  
  const handleFitToView = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const padding = 40;
    const scaleX = (canvas.width - padding * 2) / panel.widthMm;
    const scaleY = (canvas.height - padding * 2) / panel.heightMm;
    const scale = Math.min(scaleX, scaleY);
    
    const x = (canvas.width - panel.widthMm * scale) / 2;
    const y = (canvas.height - panel.heightMm * scale) / 2;
    
    setTransform({ x, y, scale });
  };
  
  return (
    <div ref={containerRef} className="relative w-full h-full bg-stone-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-stone-800/90 rounded-lg px-3 py-2">
        <button
          onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.5, t.scale / 1.2) }))}
          className="p-1 hover:bg-stone-700 rounded"
        >
          <svg className="w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="text-xs text-stone-400 min-w-[4rem] text-center">
          {Math.round(transform.scale * 100)}%
        </span>
        <button
          onClick={() => setTransform(t => ({ ...t, scale: Math.min(20, t.scale * 1.2) }))}
          className="p-1 hover:bg-stone-700 rounded"
        >
          <svg className="w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="w-px h-4 bg-stone-600 mx-1" />
        <button
          onClick={handleFitToView}
          className="px-2 py-1 text-xs text-stone-300 hover:bg-stone-700 rounded"
        >
          Fit
        </button>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 right-4 text-xs text-stone-500 bg-stone-800/80 rounded px-2 py-1">
        Click: paint · Shift+click: pick · Right-click: rotate · Scroll: zoom · Middle-drag: pan
      </div>
    </div>
  );
}
