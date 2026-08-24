import React, { useRef, useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const { socket, roomCode, roomData } = useSocket();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#10B981"); // Emerald 500
  const [initialDrawn, setInitialDrawn] = useState(false);

  // Draw a line segment
  const drawLine = (x0, y0, x1, y1, strokeColor, emit, saveToState = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    
    if (strokeColor === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 3;
      ctx.strokeStyle = strokeColor;
    }

    ctx.lineCap = "round";
    ctx.stroke();
    ctx.closePath();

    const w = canvas.width;
    const h = canvas.height;
    
    const strokeObj = {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: strokeColor,
    };

    if (saveToState && roomData) {
      if (!roomData.whiteboardStrokes) roomData.whiteboardStrokes = [];
      roomData.whiteboardStrokes.push(strokeObj);
      if (roomData.whiteboardStrokes.length > 5000) {
        roomData.whiteboardStrokes = roomData.whiteboardStrokes.slice(-5000);
      }
    }

    if (!emit || !socket) return;
    
    // Normalize coordinates so they scale correctly across different screen sizes
    socket.emit("draw-stroke", {
      roomCode,
      stroke: strokeObj
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let initialDrawDone = false;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        
        if (newWidth === 0 || newHeight === 0) continue;

        // Check if size actually changed significantly to avoid infinite redraw loops
        if (Math.abs(canvas.width - newWidth) > 5 || Math.abs(canvas.height - newHeight) > 5) {
           canvas.width = newWidth;
           canvas.height = newHeight;
           
           // Redraw strokes
           if (roomData?.whiteboardStrokes) {
             roomData.whiteboardStrokes.forEach(s => {
               drawLine(s.x0 * newWidth, s.y0 * newHeight, s.x1 * newWidth, s.y1 * newHeight, s.color, false);
             });
             initialDrawDone = true;
           }
        } else if (!initialDrawDone && roomData?.whiteboardStrokes) {
           // Size didn't change much, but we haven't drawn yet
           roomData.whiteboardStrokes.forEach(s => {
             drawLine(s.x0 * newWidth, s.y0 * newHeight, s.x1 * newWidth, s.y1 * newHeight, s.color, false);
           });
           initialDrawDone = true;
        }
      }
    });

    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, [roomData?.whiteboardStrokes]);

  useEffect(() => {
    if (!socket) return;
    
    const onReceiveStroke = (stroke) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      drawLine(stroke.x0 * w, stroke.y0 * h, stroke.x1 * w, stroke.y1 * h, stroke.color, false, true);
    };

    const onWhiteboardCleared = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (roomData) roomData.whiteboardStrokes = [];
    };

    socket.on("receive-stroke", onReceiveStroke);
    socket.on("whiteboard-cleared", onWhiteboardCleared);
    
    return () => {
      socket.off("receive-stroke", onReceiveStroke);
      socket.off("whiteboard-cleared", onWhiteboardCleared);
    };
  }, [socket, roomData]);

  // Handle mouse/touch events
  const currentPos = useRef({ x: 0, y: 0 });

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onMouseDown = (e) => {
    setIsDrawing(true);
    currentPos.current = getCoordinates(e);
  };

  const onMouseMove = (e) => {
    if (!isDrawing) return;
    const newPos = getCoordinates(e);
    drawLine(currentPos.current.x, currentPos.current.y, newPos.x, newPos.y, color, true, true);
    currentPos.current = newPos;
  };

  const onMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (roomData) roomData.whiteboardStrokes = [];
    if (socket) {
      socket.emit("clear-whiteboard", { roomCode });
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[400px] bg-gray-950 rounded-2xl border border-gray-800 shadow-xl overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1 sm:gap-2 p-1.5 sm:p-2 bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-700 shadow-lg items-center max-w-[calc(100%-2rem)]">
        {["#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#FFFFFF"].map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-transform shrink-0 ${color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
            style={{ backgroundColor: c }}
            aria-label={`Color ${c}`}
          />
        ))}
        <button
          onClick={() => setColor("eraser")}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition shrink-0 ${color === "eraser" ? 'bg-gray-700 ring-2 ring-white' : 'hover:bg-gray-800'}`}
          title="Eraser"
        >
          🧹
        </button>
        <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <button
          onClick={handleClear}
          className="px-2 py-1 sm:px-3 text-[10px] sm:text-xs font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition shrink-0"
        >
          CLEAR
        </button>
      </div>
      
      <div className="flex-1 w-full h-full relative cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseOut={onMouseUp}
          onTouchStart={onMouseDown}
          onTouchMove={onMouseMove}
          onTouchEnd={onMouseUp}
          className="absolute inset-0 block w-full h-full"
        />
      </div>
    </div>
  );
}
