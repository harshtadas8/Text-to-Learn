import React, { useState, useEffect, useRef } from "react";
import { getNotificationsAPI, markNotificationReadAPI, markAllNotificationsReadAPI, triggerTestDigestAPI } from "../services/api";
import { useSocket } from "../context/SocketContext";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      const data = await getNotificationsAPI();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll every minute just in case
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time notifications via WebSockets
  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 20)); // Keep latest 20
      setUnreadCount(prev => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);
    
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadAPI(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadAPI();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerTest = async () => {
    try {
      await triggerTestDigestAPI();
      setTimeout(fetchNotifications, 2000); // give worker time to run
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-full hover:bg-gray-800 transition"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-black">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[400px]">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>✔️</span> Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {notifications.map(n => (
                  <div 
                    key={n._id} 
                    className={`p-4 transition ${n.isRead ? "opacity-70 bg-transparent" : "bg-gray-800/50"}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${n.isRead ? "text-gray-300" : "text-emerald-400"}`}>
                          {n.title}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-2">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button 
                          onClick={() => handleMarkRead(n._id)}
                          className="text-gray-500 hover:text-white transition p-1"
                          title="Mark as read"
                        >
                          <span>✔️</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-2 border-t border-gray-800 bg-gray-950 text-center">
            <button 
              onClick={handleTriggerTest}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition"
            >
              Trigger Test Digest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
