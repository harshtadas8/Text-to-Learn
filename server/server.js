import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import courseRoutes from "./routes/courseRoutes.js"; // 👈 ADD
import lessonRoutes from "./routes/lessonRoutes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";


await connectDB();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://text-to-learn.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/lessons", lessonRoutes);
app.use("/api/youtube", youtubeRoutes);


// Health check
app.get("/", (req, res) => {
  res.send("Text-to-Learn API is running");
});

// 👇 ADD THIS
app.use("/api/courses", courseRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
