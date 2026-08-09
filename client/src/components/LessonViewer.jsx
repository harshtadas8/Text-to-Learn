import { useState } from "react";
import VideoBlock from "./VideoBlock"; // ✅ ADD THIS

export default function LessonViewer({ content }) {
  if (!content) return null;

  return (
    <div className="space-y-6 text-base text-gray-200">
      {/* OBJECTIVES */}
      {content.objectives?.length > 0 && (
        <div>
          <h3 className="text-emerald-400 font-semibold mb-2">
            🎯 Learning Objectives
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            {content.objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>
      )}

      {/* CONTENT BLOCKS */}
      {content.content?.map((block, idx) => {
        if (block.type === "heading") {
          return (
            <h3 key={idx} className="text-xl font-semibold text-white mt-4">
              {block.text}
            </h3>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={idx} className="text-gray-300 leading-relaxed text-base">
              {block.text}
            </p>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={idx}
              className="bg-black border border-gray-700 rounded-lg p-4 text-sm overflow-x-auto text-emerald-300"
            >
              <code>{block.code}</code>
            </pre>
          );
        }

        // ✅ REPLACE ONLY THIS PART
        if (block.type === "video") {
          return <VideoBlock key={idx} query={block.query} />;
        }

        return null;
      })}
    </div>
  );
}
