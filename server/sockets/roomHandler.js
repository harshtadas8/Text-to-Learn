import { logger } from "../config/logger.js";
import { connection as redisClient } from "../config/queue.js";

const getRoom = async (roomCode) => {
  try {
    const data = await redisClient.get(`room:${roomCode}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error("Redis getRoom error:", err);
    return null;
  }
};

const saveRoom = async (roomCode, data) => {
  try {
    await redisClient.set(`room:${roomCode}`, JSON.stringify(data), "EX", 24 * 60 * 60);
  } catch (err) {
    logger.error("Redis saveRoom error:", err);
  }
};

const deleteRoom = async (roomCode) => {
  try {
    await redisClient.del(`room:${roomCode}`);
  } catch (err) {
    logger.error("Redis deleteRoom error:", err);
  }
};

const roomHandler = (io) => {
  io.on("connection", (socket) => {
    const authUserId = socket.user?.sub;
    if (authUserId) {
      socket.join(`user_${authUserId}`);
      logger.info(`[Socket] User ${authUserId} joined their personal room.`);
    }
    logger.info(`🔌 New WebSocket Connection: ${socket.id}`);

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
      logger.info(`👤 ${user?.name || 'User'} joined room ${roomCode}`);
      io.to(roomCode).emit("room-updated", { roomCode, ...room });
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

    // WHITEBOARD SYNC
    socket.on("draw-stroke", async ({ roomCode, stroke }) => {
      const room = await getRoom(roomCode);
      if (room) {
        if (!room.whiteboardStrokes) room.whiteboardStrokes = [];
        room.whiteboardStrokes.push(stroke);
        // Cap the number of strokes to prevent memory overflow
        if (room.whiteboardStrokes.length > 5000) {
          room.whiteboardStrokes = room.whiteboardStrokes.slice(-5000);
        }
        await saveRoom(roomCode, room);
      }
      socket.to(roomCode).emit("receive-stroke", stroke);
    });

    socket.on("clear-whiteboard", async ({ roomCode }) => {
      const room = await getRoom(roomCode);
      if (room) {
        room.whiteboardStrokes = [];
        await saveRoom(roomCode, room);
      }
      socket.to(roomCode).emit("whiteboard-cleared");
    });

    // CHAT SYNC
    socket.on("send-chat-message", async ({ roomCode, message }) => {
      // Ephemeral chat: we don't save it to Redis room state for now, just broadcast
      socket.to(roomCode).emit("receive-chat-message", message);
    });

    // QUIZ BATTLE START
    socket.on("start-quiz-battle", async ({ roomCode, totalQuestions }) => {
      const room = await getRoom(roomCode);
      if (room) {
        room.quizScores = {};
        room.teams = {};
        room.quizQuestionStats = {};
        room.submissions = 0;
        room.totalQuestions = totalQuestions || 3;

        // Assign teams randomly or by index
        room.users.forEach((u, index) => {
          room.quizScores[u.id] = 0;
          room.teams[u.id] = index % 2 === 0 ? "Team A" : "Team B";
        });
        
        // Reset streaks if it's a new room session, or just initialize
        if (!room.quizStreaks) room.quizStreaks = {};

        await saveRoom(roomCode, room);
        io.to(roomCode).emit("quiz-battle-started", {
          quizScores: room.quizScores,
          teams: room.teams
        });
      }
    });

    // QUIZ ANSWER SUBMITTED (Batch)
    socket.on("submit-quiz-answers", async ({ roomCode, userId, results }) => {
      const room = await getRoom(roomCode);
      if (room && room.quizScores) {
        let earnedPoints = 0;

        results.forEach((result, qIndex) => {
          const isCorrect = result.isCorrect;

          // Stats tracking
          if (!room.quizQuestionStats[qIndex]) {
            room.quizQuestionStats[qIndex] = { correct: 0, wrong: 0 };
          }

          if (isCorrect) {
            room.quizQuestionStats[qIndex].correct += 1;
            
            // Streak math
            room.quizStreaks[userId] = (room.quizStreaks[userId] || 0) + 1;
            const streakMultiplier = room.quizStreaks[userId] - 1; // 0 for first
            earnedPoints += 10 + (streakMultiplier * 5);
          } else {
            room.quizQuestionStats[qIndex].wrong += 1;
            room.quizStreaks[userId] = 0; // reset streak
          }
        });

        room.quizScores[userId] = (room.quizScores[userId] || 0) + earnedPoints;
        room.submissions = (room.submissions || 0) + 1;

        await saveRoom(roomCode, room);
        io.to(roomCode).emit("quiz-scores-updated", {
          quizScores: room.quizScores,
          quizStreaks: room.quizStreaks,
        });

        // Check if everyone has submitted
        if (room.submissions >= room.users.length) {
          // Calculate winning team
          let teamAScore = 0;
          let teamBScore = 0;
          let mvp = null;
          let highestScore = -1;

          room.users.forEach(u => {
            const s = room.quizScores[u.id] || 0;
            if (room.teams[u.id] === "Team A") teamAScore += s;
            if (room.teams[u.id] === "Team B") teamBScore += s;
            
            if (s > highestScore) {
              highestScore = s;
              mvp = u;
            }
          });

          const winningTeam = teamAScore > teamBScore ? "Team A" : (teamBScore > teamAScore ? "Team B" : "Tie");

          io.to(roomCode).emit("quiz-battle-finished", {
            teamAScore,
            teamBScore,
            winningTeam,
            mvp,
            questionStats: room.quizQuestionStats
          });
        }
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
          logger.info(`👤 ${user.name} left room ${roomCode}`);
          
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
            logger.info(`🔌 ${user.name} disconnected from room ${roomCode}`);
            
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
      logger.info(`🔌 Disconnected: ${socket.id}`);
    });
  });
};

export default roomHandler;
