import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import courseRoutes from "./routes/courseRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";

await connectDB();

const app = express();

/* ===============================
   ✅ CORS CONFIG (VERY IMPORTANT)
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "https://text-to-learn.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman, Render health checks)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

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

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});