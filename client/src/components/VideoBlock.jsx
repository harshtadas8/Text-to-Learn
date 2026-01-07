import { useEffect, useState } from "react";

export default function VideoBlock({ query }) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideo() {
      try {
        const res = await fetch(`${BASE_URL}/youtube/search?q=${topic}`);
        const data = await res.json();
        setVideo(data);
      } catch (err) {
        console.error("Failed to load video", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideo();
  }, [query]);

  if (loading) {
    return <p className="text-gray-400 italic">Loading video...</p>;
  }

  if (!video?.videoId) {
    return <p className="text-gray-500 italic">No video found.</p>;
  }

  return (
    <div className="mt-6 border border-gray-700 rounded-xl overflow-hidden bg-black max-w-2xl">
      <p className="text-sm text-gray-400 px-3 pt-3">
        📺 Recommended Video
      </p>

      <div
        className="relative w-full"
        style={{ paddingTop: "50%" }} // 👈 smaller than 16:9
      >
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${video.videoId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
