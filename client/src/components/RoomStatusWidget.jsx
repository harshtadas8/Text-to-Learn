import React from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

export default function RoomStatusWidget() {
  const { roomData, leaveRoom } = useSocket() || {};
  const navigate = useNavigate();

  if (!roomData) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className="bg-gray-950/90 backdrop-blur-md border border-emerald-900/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] rounded-2xl p-4 flex flex-col gap-3 min-w-[240px]">
        
        {/* Header: Room Code and Pulse */}
        <div className="flex items-center justify-between">
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

        <p className="text-xs text-gray-400">
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
