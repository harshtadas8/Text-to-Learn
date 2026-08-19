import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db.js";

import courseRoutes from "./routes/courseRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import tutorRoutes from "./routes/tutorRoutes.js";
import srsRoutes from "./routes/srsRoutes.js";
import requireAuth from "./middlewares/requireAuth.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import roomHandler from "./sockets/roomHandler.js";
import "./workers/aiWorker.js"; // 🔥 START BULLMQ WORKER

await connectDB();

const app = express();

/* ===============================
   ✅ CORS CONFIG (VERY IMPORTANT)
================================ */
// Put exact URLs here. No trailing slashes (/) at the end!
const allowedOrigins = [
  "http://localhost:5173",
  "https://text-to-learn-psi.vercel.app" 
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman or curl)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost:")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

import { createAdapter } from "@socket.io/redis-adapter";
import { connection as pubClient, connection as subClient } from "./config/queue.js";
import { socketAuthMiddleware } from "./sockets/socketAuth.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  adapter: createAdapter(pubClient, subClient.duplicate())
});

// Use authentication for WebSockets
io.use(socketAuthMiddleware);

// Initialize Socket.io Handlers
roomHandler(io);

// 🔥 Handle preflight requests explicitly
app.options("*", cors());

/* ===============================
   MIDDLEWARES
================================ */
app.use(express.json());

/* ===============================
   ROUTES
================================ */
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/srs", srsRoutes);

/* ===============================
   GLOBAL ERROR HANDLER
================================ */
app.use(errorHandler);

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Text-to-Learn API is running");
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server & WebSockets running on port ${PORT}`);
});