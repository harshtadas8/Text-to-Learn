const roomHandler = (io) => {
  // Store room state in memory
  // { 'roomCode': { users: [{ id, name }], hostId: socket.id, courseId: '...', score: {} } }
  const rooms = {};

  io.on("connection", (socket) => {
    console.log(`🔌 New WebSocket Connection: ${socket.id}`);

    // JOIN ROOM
    socket.on("join-room", ({ roomCode, user }) => {
      socket.join(roomCode);
      
      if (!rooms[roomCode]) {
        rooms[roomCode] = {
          hostId: socket.id, // first person is the host
          users: [],
          quizScores: {},
          activeReel: null,
          activeQuiz: null,
        };
      }

      // Add user if not already there
      const existingUser = rooms[roomCode].users.find((u) => u.id === user.sub);
      if (!existingUser) {
        rooms[roomCode].users.push({
          socketId: socket.id,
          id: user.sub,
          name: user.name || "Anonymous Learner",
          picture: user.picture,
        });
      } else {
        // Update socket ID for existing user
        existingUser.socketId = socket.id;
      }

      console.log(`👤 ${user.name} joined room ${roomCode}`);

      // Broadcast updated room data to everyone in the room
      io.to(roomCode).emit("room-updated", { roomCode, ...rooms[roomCode] });
    });

    // SYNC LESSON REEL STATE
    socket.on("sync-reel-slide", ({ roomCode, slideIndex, isPlaying }) => {
      const room = rooms[roomCode];
      if (room && room.hostId === socket.id) {
        // Only the host can dictate the slide for now
        socket.to(roomCode).emit("force-sync-slide", { slideIndex, isPlaying });
      }
    });

    // REACTION (Mind Blown / Confused)
    socket.on("send-reaction", ({ roomCode, emoji, userName }) => {
      // Send to everyone EXCEPT the sender
      socket.to(roomCode).emit("receive-reaction", { emoji, userName });
    });

    // SYNC QUIZ
    socket.on("sync-quiz", ({ roomCode, quizData, meta }) => {
      if (rooms[roomCode]) {
        rooms[roomCode].activeQuiz = { quizData, meta };
      }
      socket.to(roomCode).emit("receive-quiz", { quizData, meta });
    });

    socket.on("close-global-quiz", ({ roomCode }) => {
      if (rooms[roomCode]) {
        rooms[roomCode].activeQuiz = null;
      }
      socket.to(roomCode).emit("receive-close-global-quiz");
    });

    // SYNC REEL OPEN/CLOSE
    socket.on("host-opened-reel", ({ roomCode, content, lessonTitle, language }) => {
      if (rooms[roomCode]) {
        rooms[roomCode].activeReel = { content, lessonTitle, language };
      }
      socket.to(roomCode).emit("receive-opened-reel", { content, lessonTitle, language });
    });

    socket.on("host-closed-reel", ({ roomCode }) => {
      if (rooms[roomCode]) {
        rooms[roomCode].activeReel = null;
      }
      socket.to(roomCode).emit("receive-closed-reel");
    });

    // QUIZ BATTLE START
    socket.on("start-quiz-battle", ({ roomCode }) => {
      // Reset scores
      if (rooms[roomCode]) {
        rooms[roomCode].quizScores = {};
        rooms[roomCode].users.forEach(u => {
          rooms[roomCode].quizScores[u.id] = 0;
        });
        io.to(roomCode).emit("quiz-battle-started", rooms[roomCode].quizScores);
      }
    });

    // QUIZ ANSWER SUBMITTED
    socket.on("submit-quiz-answer", ({ roomCode, userId, isCorrect }) => {
      if (rooms[roomCode] && rooms[roomCode].quizScores) {
        if (isCorrect) {
          rooms[roomCode].quizScores[userId] = (rooms[roomCode].quizScores[userId] || 0) + 10;
        }
        io.to(roomCode).emit("quiz-scores-updated", rooms[roomCode].quizScores);
      }
    });

    // LEAVE SPECIFIC ROOM
    socket.on("leave-room", ({ roomCode }) => {
      socket.leave(roomCode);
      const room = rooms[roomCode];
      if (room) {
        const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
        if (userIndex !== -1) {
          const user = room.users[userIndex];
          room.users.splice(userIndex, 1);
          console.log(`👤 ${user.name} left room ${roomCode}`);
          
          if (room.users.length === 0) {
            delete rooms[roomCode];
          } else {
            if (room.hostId === socket.id) {
              room.hostId = room.users[0].socketId;
            }
            io.to(roomCode).emit("room-updated", { roomCode, ...room });
          }
        }
      }
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log(`🔌 Disconnected: ${socket.id}`);
      
      // Remove user from any rooms they were in
      for (const roomCode in rooms) {
        const room = rooms[roomCode];
        const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
        
        if (userIndex !== -1) {
          const user = room.users[userIndex];
          room.users.splice(userIndex, 1);
          
          if (room.users.length === 0) {
            // Delete room if empty
            delete rooms[roomCode];
          } else {
            // Re-assign host if the host left
            if (room.hostId === socket.id) {
              room.hostId = room.users[0].socketId;
            }
            io.to(roomCode).emit("room-updated", { roomCode, ...room });
          }
        }
      }
    });
  });
};

export default roomHandler;
