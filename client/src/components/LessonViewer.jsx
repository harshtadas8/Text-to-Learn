import { useState } from "react";
import VideoBlock from "./VideoBlock"; // ✅ ADD THIS

export default function LessonViewer({ content }) {
  if (!content) return null;

  return (
    <div className="space-y-6 text-sm text-gray-200">
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
            <h3 key={idx} className="text-lg font-semibold text-white mt-4">
              {block.text}
            </h3>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={idx} className="text-gray-300 leading-relaxed">
              {block.text}
            </p>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={idx}
              className="bg-black border border-gray-700 rounded-lg p-4 text-xs overflow-x-auto text-emerald-300"
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

      {/* MCQs */}
      {content.mcqs?.length > 0 && (
        <div className="mt-8 border-t border-gray-700 pt-6">
          <h3 className="text-emerald-400 font-semibold mb-4">
            🧠 Quick Check (MCQs)
          </h3>

          <div className="space-y-4">
            {content.mcqs.map((mcq, index) => (
              <MCQCard key={index} mcq={mcq} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- MCQ CARD ---------------- */

function MCQCard({ mcq, index }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-black">
      <p className="font-medium text-white mb-3">
        {index + 1}. {mcq.question}
      </p>

      <ul className="space-y-2 text-gray-300">
        {mcq.options.map((opt, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-gray-500">
              {String.fromCharCode(65 + i)}.
            </span>
            <span>{opt}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setShowAnswer((prev) => !prev)}
        className="mt-3 text-sm text-emerald-400 hover:underline"
      >
        {showAnswer ? "Hide Answer" : "Show Answer"}
      </button>

      {showAnswer && (
        <div className="mt-3 text-sm text-gray-300">
          <p>
            ✅ <span className="text-white">Correct Answer:</span>{" "}
            {String.fromCharCode(65 + mcq.correctAnswer)}
          </p>
          <p className="mt-1 text-gray-400">
            📝 {mcq.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
