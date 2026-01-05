import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&type=video&maxResults=1` +
      `&q=${encodeURIComponent(query)}` +
      `&key=${process.env.YOUTUBE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return res.json({ videoId: null });
    }

    res.json({
      videoId: data.items[0].id.videoId,
      title: data.items[0].snippet.title,
    });
  } catch (err) {
    console.error("YouTube API error:", err);
    res.status(500).json({ error: "YouTube fetch failed" });
  }
});

export default router;
