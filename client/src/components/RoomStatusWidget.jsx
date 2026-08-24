import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

export default function RoomStatusWidget() {
  const { roomData, leaveRoom } = useSocket() || {};
  const navigate = useNavigate();
  
  const [position, setPosition] = useState({ x: 24, y: 24 }); // pixels from bottom/right by default
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetPosAtStart = useRef({ x: 24, y: 24 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      
      const dx = dragStartPos.current.x - clientX;
      const dy = dragStartPos.current.y - clientY;
      
      setPosition({
        x: widgetPosAtStart.current.x + dx,
        y: widgetPosAtStart.current.y + dy
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleMouseMove, { passive: false });
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  if (!roomData) return null;

  const handleDragStart = (e) => {
    // Only drag from the header part to avoid blocking button clicks
    if (e.target.tagName.toLowerCase() === 'button') return;
    
    setIsDragging(true);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    dragStartPos.current = { x: clientX, y: clientY };
    widgetPosAtStart.current = { ...position };
  };

  return (
    <div 
      className="fixed z-50 animate-fade-in-up select-none touch-none"
      style={{ bottom: `${position.y}px`, right: `${position.x}px`, cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      <div className="bg-gray-950/90 backdrop-blur-md border border-emerald-900/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] rounded-2xl p-4 flex flex-col gap-3 min-w-[240px]">
        
        {/* Header: Room Code and Pulse */}
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-bold text-gray-200">Room {roomData.roomCode}</span>
          </div>
          <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-md font-mono">
            {roomData.users?.length || 0} Joined
          </span>
        </div>

        <p className="text-xs text-gray-400 pointer-events-none">
          Global Multiplayer Sync Active
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => navigate(`/room/${roomData.roomCode}`)}
            className="flex-1 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
          >
            Lobby
          </button>
          <button
            onClick={() => {
              leaveRoom();
              navigate("/courses");
            }}
            className="flex-1 py-1.5 text-xs font-semibold bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition"
          >
            Leave
          </button>
        </div>

      </div>
    </div>
  );
}
