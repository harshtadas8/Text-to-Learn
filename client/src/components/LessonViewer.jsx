import { useState, useEffect } from "react";
import VideoBlock from "./VideoBlock"; // ✅ ADD THIS
import TypewriterEffect from "./TypewriterEffect";
import TextToSpeechButton from "./TextToSpeechButton";

export default function LessonViewer({ content, language, reelButton }) {
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

  const fullText = blocks
    .filter(b => b.type === "objectives_container" || b.type === "heading" || b.type === "paragraph" || b.type === "list")
    .map(b => {
      if (b.type === "objectives_container") return "Learning Objectives: " + (Array.isArray(b.items) ? b.items.join(". ") : String(b.items || ""));
      if (b.type === "list") return Array.isArray(b.items) ? b.items.join(". ") : String(b.items || "");
      return String(b.text || "");
    })
    .join(". ");

  return (
    <div className="text-base text-gray-200">
      <div className="flex flex-wrap justify-end gap-3 mb-6">
        {reelButton}
        <TextToSpeechButton text={fullText} language={language} />
      </div>
      <div className="space-y-6">
      {blocks.map((block, idx) => {
        // Only render if it's our turn or we've already been rendered
        if (idx > activeIdx) return null;

        const isStreaming = idx === activeIdx;

        if (block.type === "objectives_container") {
          const items = Array.isArray(block.items) ? block.items : (block.items ? [String(block.items)] : []);
          
          if (items.length === 0 && isStreaming) {
            setTimeout(() => handleComplete(idx), 0);
            return null;
          }

          return (
            <div key={idx}>
              <h3 className="text-emerald-400 font-semibold mb-2">
                🎯 Learning Objectives
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {items.map((obj, i) => (
                  <li key={i}>
                    {isStreaming ? (
                      <TypewriterEffect text={String(obj)} speed={5} onComplete={i === items.length - 1 ? () => handleComplete(idx) : undefined} />
                    ) : (
                      String(obj)
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
                <TypewriterEffect text={block.text} speed={2} onComplete={() => handleComplete(idx)} />
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
                <TypewriterEffect text={block.text} speed={2} onComplete={() => handleComplete(idx)} />
              ) : (
                block.text
              )}
            </p>
          );
        }

        if (block.type === "list") {
          const items = Array.isArray(block.items) ? block.items : (block.items ? [String(block.items)] : []);
          
          if (items.length === 0 && isStreaming) {
            setTimeout(() => handleComplete(idx), 0);
            return null;
          }

          return (
            <ul key={idx} className="list-disc list-inside space-y-2 text-gray-300 pl-2">
              {items.map((item, i) => (
                <li key={i}>
                  {isStreaming ? (
                    <TypewriterEffect 
                      text={String(item)} 
                      speed={2} 
                      onComplete={i === items.length - 1 ? () => handleComplete(idx) : undefined} 
                    />
                  ) : (
                    String(item)
                  )}
                </li>
              ))}
            </ul>
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
    </div>
  );
}
