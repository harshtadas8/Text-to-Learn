import { useState, useEffect } from "react";
import VideoBlock from "./VideoBlock"; // ✅ ADD THIS
import TypewriterEffect from "./TypewriterEffect";

export default function LessonViewer({ content }) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Reset when content changes
  useEffect(() => {
    setActiveIdx(0);
  }, [content]);

  if (!content) return null;

  // Flatten all items that need typing into a single list to manage sequence
  const blocks = [];
  
  if (content.objectives?.length > 0) {
    blocks.push({
      type: "objectives_container",
      items: content.objectives
    });
  }

  if (content.content?.length > 0) {
    blocks.push(...content.content);
  }

  const handleComplete = (idx) => {
    if (idx === activeIdx) {
      setActiveIdx((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6 text-base text-gray-200">
      {blocks.map((block, idx) => {
        // Only render if it's our turn or we've already been rendered
        if (idx > activeIdx) return null;

        const isStreaming = idx === activeIdx;

        if (block.type === "objectives_container") {
          return (
            <div key={idx}>
              <h3 className="text-emerald-400 font-semibold mb-2">
                🎯 Learning Objectives
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {block.items.map((obj, i) => (
                  <li key={i}>
                    {/* For lists, we just render the whole list block text sequentially or all at once. 
                        To keep it simple, we type out the whole list text as one block, or just render it all. */}
                    {isStreaming ? (
                      <TypewriterEffect text={obj} speed={5} onComplete={i === block.items.length - 1 ? () => handleComplete(idx) : undefined} />
                    ) : (
                      obj
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (block.type === "heading") {
          return (
            <h3 key={idx} className="text-xl font-semibold text-white mt-4">
              {isStreaming ? (
                <TypewriterEffect text={block.text} speed={10} onComplete={() => handleComplete(idx)} />
              ) : (
                block.text
              )}
            </h3>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={idx} className="text-gray-300 leading-relaxed text-base">
              {isStreaming ? (
                <TypewriterEffect text={block.text} speed={10} onComplete={() => handleComplete(idx)} />
              ) : (
                block.text
              )}
            </p>
          );
        }

        if (block.type === "code") {
          // No typewriter for code blocks to avoid formatting issues, just instantly appear and advance
          if (isStreaming) {
            // Use setTimeout to advance immediately on mount
            setTimeout(() => handleComplete(idx), 0);
          }
          return (
            <pre
              key={idx}
              className="bg-black border border-gray-700 rounded-lg p-4 text-sm overflow-x-auto text-emerald-300"
            >
              <code>{block.code}</code>
            </pre>
          );
        }

        if (block.type === "video") {
          if (isStreaming) {
            setTimeout(() => handleComplete(idx), 0);
          }
          return <VideoBlock key={idx} query={block.query} />;
        }

        // Advance if unknown block
        if (isStreaming) setTimeout(() => handleComplete(idx), 0);
        return null;
      })}
    </div>
  );
}
