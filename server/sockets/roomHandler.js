import { cacheConnection as redisClient } from "../config/queue.js";

const getRoom = async (roomCode) => {
  const data = await redisClient.get(`room:${roomCode}`);
  return data ? JSON.parse(data) : null;
};

const saveRoom = async (roomCode, data) => {
  await redisClient.set(`room:${roomCode}`, JSON.stringify(data), "EX", 24 * 60 * 60);
};

const deleteRoom = async (roomCode) => {
  await redisClient.del(`room:${roomCode}`);
};

const roomHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 New WebSocket Connection: ${socket.id}`);

    // JOIN ROOM
    socket.on("join-room", async ({ roomCode, user }) => {
      socket.join(roomCode);
      
      const authUserId = socket.user.sub;
      
      let room = await getRoom(roomCode);
      if (!room) {
        room = {
          hostId: socket.id,
          users: [],
          quizScores: {},
          activeReel: null,
          activeQuiz: null,
        };
      }

      const existingUser = room.users.find((u) => u.id === authUserId);
      if (!existingUser) {
        room.users.push({
          socketId: socket.id,
          id: authUserId,
          name: user?.name || "Anonymous Learner",
          picture: user?.picture,
        });
      } else {
        existingUser.socketId = socket.id;
        // Also update name/picture just in case
        if (user?.name) existingUser.name = user.name;
        if (user?.picture) existingUser.picture = user.picture;
      }

      await saveRoom(roomCode, room);
      console.log(`👤 ${user?.name || 'User'} joined room ${roomCode}`);
      io.to(roomCode).emit("room-updated", { roomCode, ...room });
    });

    // SYNC LESSON REEL STATE
    socket.on("sync-reel-slide", async ({ roomCode, slideIndex, isPlaying }) => {
      const room = await getRoom(roomCode);
      if (room && room.hostId === socket.id) {
        socket.to(roomCode).emit("force-sync-slide", { slideIndex, isPlaying });
      }
    });

    // REACTION (Mind Blown / Confused)
    socket.on("send-reaction", ({ roomCode, emoji, userName }) => {
      socket.to(roomCode).emit("receive-reaction", { emoji, userName });
    });

    // SYNC QUIZ
    socket.on("sync-quiz", async ({ roomCode, quizData, meta }) => {
      const room = await getRoom(roomCode);
      if (room) {
        room.activeQuiz = { quizData, meta };
        await saveRoom(roomCode, room);
      }
      socket.to(roomCode).emit("receive-quiz", { quizData, meta });
    });

    socket.on("close-global-quiz", async ({ roomCode }) => {
      const room = await getRoom(roomCode);
      if (room) {
        room.activeQuiz = null;
        await saveRoom(roomCode, room);
      }
      socket.to(roomCode).emit("receive-close-global-quiz");
    });

    // SYNC REEL OPEN/CLOSE
    socket.on("host-opened-reel", async ({ roomCode, content, lessonTitle, language }) => {
      const room = await getRoom(roomCode);
      if (room) {
        room.activeReel = { content, lessonTitle, language };
        await saveRoom(roomCode, room);
      }
      socket.to(roomCode).emit("receive-opened-reel", { content, lessonTitle, language });
    });

    socket.on("host-closed-reel", async ({ roomCode }) => {
      const room = await getRoom(roomCode);
      if (room) {
        room.activeReel = null;
        await saveRoom(roomCode, room);
      }
      socket.to(roomCode).emit("receive-closed-reel");
    });

    // QUIZ BATTLE START
    socket.on("start-quiz-battle", async ({ roomCode }) => {
      const room = await getRoom(roomCode);
      if (room) {
        room.quizScores = {};
        room.users.forEach(u => {
          room.quizScores[u.id] = 0;
        });
        await saveRoom(roomCode, room);
        io.to(roomCode).emit("quiz-battle-started", room.quizScores);
      }
    });

    // QUIZ ANSWER SUBMITTED
    socket.on("submit-quiz-answer", async ({ roomCode, userId, isCorrect }) => {
      const room = await getRoom(roomCode);
      if (room && room.quizScores) {
        if (isCorrect) {
          room.quizScores[userId] = (room.quizScores[userId] || 0) + 10;
        }
        await saveRoom(roomCode, room);
        io.to(roomCode).emit("quiz-scores-updated", room.quizScores);
      }
    });

    // LEAVE SPECIFIC ROOM
    socket.on("leave-room", async ({ roomCode }) => {
      socket.leave(roomCode);
      const room = await getRoom(roomCode);
      if (room) {
        const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
        if (userIndex !== -1) {
          const user = room.users[userIndex];
          room.users.splice(userIndex, 1);
          console.log(`👤 ${user.name} left room ${roomCode}`);
          
          if (room.users.length === 0) {
            await deleteRoom(roomCode);
          } else {
            if (room.hostId === socket.id) {
              room.hostId = room.users[0].socketId;
            }
            await saveRoom(roomCode, room);
            io.to(roomCode).emit("room-updated", { roomCode, ...room });
          }
        }
      }
    });

    // DISCONNECTING (socket.rooms is still available here)
    socket.on("disconnecting", async () => {
      for (const roomCode of socket.rooms) {
        if (roomCode === socket.id) continue;
        
        const room = await getRoom(roomCode);
        if (room) {
          const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
          if (userIndex !== -1) {
            const user = room.users[userIndex];
            room.users.splice(userIndex, 1);
            console.log(`🔌 ${user.name} disconnected from room ${roomCode}`);
            
            if (room.users.length === 0) {
              await deleteRoom(roomCode);
            } else {
              if (room.hostId === socket.id) {
                room.hostId = room.users[0].socketId;
              }
              await saveRoom(roomCode, room);
              io.to(roomCode).emit("room-updated", { roomCode, ...room });
            }
          }
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Disconnected: ${socket.id}`);
    });
  });
};

export default roomHandler;
