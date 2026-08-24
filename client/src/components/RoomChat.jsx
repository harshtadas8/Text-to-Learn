import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth0 } from "@auth0/auth0-react";

export default function RoomChat() {
  const { socket, roomCode, roomData } = useSocket();
  const { user } = useAuth0();
  const [messages, setMessages] = useState(() => roomData?.chatMessages || []);
  const [inputMsg, setInputMsg] = useState("");
  const messagesEndRef = useRef(null);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, msg]);
    if (roomData) {
      if (!roomData.chatMessages) roomData.chatMessages = [];
      roomData.chatMessages.push(msg);
      if (roomData.chatMessages.length > 1000) {
        roomData.chatMessages = roomData.chatMessages.slice(-1000);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    
    const handleReceiveMessage = (message) => {
      addMessage(message);
    };
    
    socket.on("receive-chat-message", handleReceiveMessage);
    return () => socket.off("receive-chat-message", handleReceiveMessage);
  }, [socket, roomData]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socket) return;
    
    const newMsg = {
      id: Date.now(),
      userId: user?.sub,
      userName: user?.name || "Unknown",
      text: inputMsg.trim(),
      timestamp: new Date().toISOString()
    };
    
    addMessage(newMsg);
    socket.emit("send-chat-message", { roomCode, message: newMsg });
    setInputMsg("");
  };

  const handleSendReaction = (emoji) => {
    if (!socket) return;
    const newMsg = {
      id: Date.now(),
      userId: user?.sub,
      userName: user?.name || "Unknown",
      text: emoji,
      isReaction: true,
      timestamp: new Date().toISOString()
    };
    addMessage(newMsg);
    socket.emit("send-chat-message", { roomCode, message: newMsg });
  };

  if (!roomData) return null;

  return (
    <div className="flex flex-col h-[600px] bg-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <h3 className="font-bold text-emerald-400">Study Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const isMe = user?.sub && msg.userId === user.sub;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-gray-500 mb-1 px-1">{isMe ? 'You' : msg.userName}</span>
              {msg.isReaction ? (
                <div className="text-4xl animate-bounce">{msg.text}</div>
              ) : (
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] break-words text-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2 mb-3 px-1">
          <button onClick={() => handleSendReaction("🤯")} className="text-xl hover:scale-125 transition" title="Mind Blown">🤯</button>
          <button onClick={() => handleSendReaction("❓")} className="text-xl hover:scale-125 transition" title="Confused">❓</button>
          <button onClick={() => handleSendReaction("🔥")} className="text-xl hover:scale-125 transition" title="Fire">🔥</button>
          <button onClick={() => handleSendReaction("👍")} className="text-xl hover:scale-125 transition" title="Thumbs Up">👍</button>
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-emerald-500"
          />
          <button 
            type="submit"
            disabled={!inputMsg.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 text-sm rounded-xl font-bold transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
