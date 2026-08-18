import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useParams } from "react-router-dom";

export default function StudyRoom() {
  const { socket, roomData, leaveRoom } = useSocket();
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const { roomCode: initialRoomCode } = useParams();

  const [inputCode, setInputCode] = useState(initialRoomCode || "");
  const [joining, setJoining] = useState(false);

  // Stop showing "joining" spinner once we have roomData
  useEffect(() => {
    if (roomData) setJoining(false);
  }, [roomData]);

  // Listen for floating emoji reactions
  useEffect(() => {
    if (!socket) return;

    const handleReaction = ({ emoji }) => {
      const el = document.createElement("div");
      el.innerText = emoji;
      el.className = "fixed text-4xl pointer-events-none z-50";
      el.style.left = `${Math.random() * 80 + 10}vw`;
      el.style.bottom = "0";
      el.style.transition = "transform 2s, opacity 2s";
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = "translateY(-80vh)";
        el.style.opacity = "0";
      });
      setTimeout(() => el.remove(), 2000);
    };

    socket.on("receive-reaction", handleReaction);
    return () => socket.off("receive-reaction", handleReaction);
  }, [socket]);

  // If the URL already has a room code and we're not yet in any room, auto-join
  useEffect(() => {
    if (initialRoomCode && socket && isAuthenticated && !roomData && !joining) {
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

  const sendReaction = (emoji) => {
    if (socket && roomData) {
      socket.emit("send-reaction", { roomCode: roomData.roomCode, emoji, userName: user?.name });
    }
  };

  if (!isAuthenticated) {
    return <div className="text-white text-center mt-20">Please log in to join a study room.</div>;
  }

  // ----- NOT IN A ROOM (LOBBY) -----
  if (!roomData) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          Multiplayer Study Rooms
        </h1>

        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md space-y-6">
          <button
            onClick={handleCreateRoom}
            disabled={joining}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white transition disabled:opacity-50"
          >
            {joining ? "Creating..." : "Create New Room"}
          </button>

          <div className="flex items-center text-gray-500">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-3 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleJoinRoom()}
              disabled={joining || !inputCode.trim()}
              className="px-6 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition disabled:opacity-50"
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
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 border border-gray-800 p-6 rounded-2xl gap-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-1">Room: {roomData.roomCode}</h1>
            <p className="text-gray-400 text-sm">Share this code with your friends to learn together!</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex gap-2 bg-gray-800 px-4 py-2 rounded-xl">
              <button onClick={() => sendReaction("🤯")} className="text-2xl hover:scale-125 transition" title="Mind Blown">🤯</button>
              <button onClick={() => sendReaction("❓")} className="text-2xl hover:scale-125 transition" title="Confused">❓</button>
              <button onClick={() => sendReaction("🔥")} className="text-2xl hover:scale-125 transition" title="Fire">🔥</button>
            </div>

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

        {/* Action Section */}
        <div className={`border ${isHost ? "bg-emerald-900/20 border-emerald-900/50" : "bg-gray-900 border-gray-800"} p-8 rounded-2xl flex flex-col items-center text-center shadow-xl`}>
          {isHost ? (
            <>
              <div className="w-16 h-16 bg-emerald-900/50 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">You are the Host!</h2>
              <p className="text-gray-300 mb-6 max-w-md">
                Go to your courses and open a <strong>Reel</strong> or start a <strong>Quiz Battle</strong>. Everyone in this room will automatically sync to your screen.
              </p>
              <button
                onClick={() => navigate("/courses")}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
              >
                Go to My Courses
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-200 mb-2">Waiting for Host...</h2>
              <p className="text-gray-400 mb-6 max-w-md">
                The Host hasn't started a session yet. When they open a Reel or Quiz, it will automatically appear on your screen.
              </p>
              <button
                onClick={() => navigate("/courses")}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition"
              >
                Browse Courses Meanwhile
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
