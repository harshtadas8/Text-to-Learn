import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useParams } from "react-router-dom";
import Whiteboard from "../components/Whiteboard";
import RoomChat from "../components/RoomChat";

export default function StudyRoom() {
  const { socket, roomData, leaveRoom } = useSocket();
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const { roomCode: initialRoomCode } = useParams();

  const [inputCode, setInputCode] = useState(initialRoomCode || "");
  const [joining, setJoining] = useState(false);

  // Stop showing "joining" spinner once we have roomData
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (roomData) setJoining(false);
  }, [roomData]);

  // If the URL already has a room code and we're not yet in any room, auto-join
  useEffect(() => {
    if (initialRoomCode && socket && isAuthenticated && !roomData && !joining) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJoining(true);
      socket.emit("join-room", { roomCode: initialRoomCode, user });
    }
  }, [initialRoomCode, socket, isAuthenticated]);

  const handleJoinRoom = (code = inputCode) => {
    if (!code.trim() || !socket) return;
    setJoining(true);
    socket.emit("join-room", { roomCode: code.trim().toUpperCase(), user });
    navigate(`/room/${code.trim().toUpperCase()}`);
  };

  const handleCreateRoom = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setJoining(true);
    socket.emit("join-room", { roomCode: newCode, user });
    navigate(`/room/${newCode}`);
  };

  if (!isAuthenticated) {
    return <div className="text-white text-center mt-20">Please log in to join a study room.</div>;
  }

  // ----- NOT IN A ROOM (LOBBY) -----
  if (!roomData) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-black text-white flex flex-col items-center pt-10 sm:justify-center sm:pt-0 p-4">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 text-center">
          Multiplayer Study Rooms
        </h1>

        <div className="bg-gray-900 border border-gray-800 p-6 sm:p-8 rounded-2xl w-full max-w-md space-y-6 shadow-xl">
          <button
            onClick={handleCreateRoom}
            disabled={joining}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white transition disabled:opacity-50"
          >
            {joining ? "Creating..." : "Create New Room"}
          </button>

          <div className="flex items-center text-gray-500">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-3 text-sm font-semibold tracking-wider">OR</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-3 sm:py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-center sm:text-left tracking-widest sm:tracking-normal font-bold sm:font-normal"
            />
            <button
              onClick={() => handleJoinRoom()}
              disabled={joining || !inputCode.trim()}
              className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition disabled:opacity-50"
            >
              {joining ? "..." : "Join"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----- IN A ROOM -----
  const isHost = roomData.hostId === socket?.id;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 border border-gray-800 p-6 rounded-2xl gap-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-1">Room: {roomData.roomCode}</h1>
            <p className="text-gray-400 text-sm">Share this code with your friends to learn together!</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => { leaveRoom(); navigate("/courses"); }}
              className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl font-bold transition"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Participants */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            Users in Room
            <span className="bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded text-sm">
              {roomData.users?.length || 0}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomData.users?.map((u) => (
              <div key={u.id} className="flex items-center gap-4 bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-lg">
                {u.picture ? (
                  <img src={u.picture} alt={u.name} className="w-12 h-12 rounded-full border border-gray-700" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold">
                    {(u.name || "?").charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-200">{u.name}</h3>
                  {u.socketId === roomData.hostId && (
                    <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded font-semibold tracking-wide">HOST</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collaborative Whiteboard & Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-gray-900 border-gray-800 p-2 sm:p-4 rounded-2xl flex flex-col items-center shadow-xl h-[600px] w-full">
            <Whiteboard />
          </div>
          <div className="lg:col-span-1 h-[600px] w-full">
            <RoomChat />
          </div>
        </div>

      </div>
    </div>
  );
}
