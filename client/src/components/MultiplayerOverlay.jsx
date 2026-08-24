import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import QuizViewer from "./QuizViewer";

export default function MultiplayerOverlay() {
  const { socket, roomData } = useSocket() || {};
  const isHost = roomData?.hostId === socket?.id;
  const inRoom = !!roomData;

  const [globalQuiz, setGlobalQuiz] = useState(null);

  useEffect(() => {
    if (!socket || !inRoom) return;

    const handleReceiveQuiz = ({ quizData, meta }) => {
      if (!isHost) setGlobalQuiz({ quizData, meta });
    };
    const handleCloseQuiz = () => setGlobalQuiz(null);

    socket.on("receive-quiz", handleReceiveQuiz);
    socket.on("receive-close-global-quiz", handleCloseQuiz);

    return () => {
      socket.off("receive-quiz", handleReceiveQuiz);
      socket.off("receive-close-global-quiz", handleCloseQuiz);
    };
  }, [socket, isHost, inRoom]);

  // Clear overlay when leaving a room
  useEffect(() => {
    if (!inRoom) {
      setGlobalQuiz(null);
    }
  }, [inRoom]);

  const noop = () => {};

  if (!inRoom || isHost) return null;

  return (
    <>

      {globalQuiz && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-start justify-center p-4 overflow-y-auto py-10">
          <div className="w-full max-w-5xl bg-gray-950 border border-gray-800 rounded-2xl relative shadow-2xl p-6">
            <div className="text-center mb-4">
              <span className="bg-emerald-900/50 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                ⚔️ Live Quiz Battle
              </span>
            </div>
            <QuizViewer
              courseTopic={globalQuiz.meta?.courseTopic || ""}
              moduleTitle={globalQuiz.meta?.moduleTitle || ""}
              lessonTitle={globalQuiz.meta?.lessonTitle || ""}
              lessonContent={globalQuiz.meta?.lessonContent || ""}
              initialQuizData={globalQuiz.quizData}
            />
          </div>
        </div>
      )}
    </>
  );
}
