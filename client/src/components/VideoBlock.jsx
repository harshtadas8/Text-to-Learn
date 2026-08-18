import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function VideoBlock({ query }) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (!query) return;

    async function fetchVideo() {
      try {
        const res = await fetch(
          `${BASE_URL}/youtube/search?q=${encodeURIComponent(query)}`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

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
    return (
      <div className="mt-6 border border-gray-800 rounded-xl overflow-hidden bg-gray-900 max-w-2xl animate-pulse">
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}></div>
      </div>
    );
  }

  if (!video?.videoId) {
    return <p className="text-gray-500 italic">No video found.</p>;
  }

  return (
    <div className="mt-6 border border-gray-700 rounded-xl overflow-hidden bg-black max-w-2xl relative">
      {!iframeLoaded && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center z-10">
          <span className="text-gray-500 font-medium">Loading player...</span>
        </div>
      )}
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
          src={`https://www.youtube.com/embed/${video.videoId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
}