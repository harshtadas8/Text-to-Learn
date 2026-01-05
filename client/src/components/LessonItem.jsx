import { useState } from "react";

export default function LessonItem({ lesson }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-800 rounded-lg mb-3">
      {/* HEADER */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 bg-gray-900 hover:bg-gray-800 flex justify-between items-center"
      >
        <span className="text-white">
          {lesson.lessonIndex}. {lesson.title}
        </span>
        <span className="text-gray-400">{open ? "−" : "+"}</span>
      </button>

      {/* BODY */}
      {open && (
        <div className="px-4 py-4 bg-black space-y-4">
          {/* Explanation */}
          {lesson.explanation && (
            <p className="text-gray-300 text-sm leading-relaxed">
              {lesson.explanation}
            </p>
          )}

          {/* Resources */}
          {lesson.resources && (
            <div className="space-y-2">
              {lesson.resources.youtube?.length > 0 && (
                <div>
                  <h4 className="text-emerald-400 text-sm mb-1">
                    📺 YouTube
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-gray-300">
                    {lesson.resources.youtube.map((y, i) => (
                      <li key={i}>
                        <a
                          href={y.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {y.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lesson.resources.blogs?.length > 0 && (
                <div>
                  <h4 className="text-emerald-400 text-sm mb-1">
                    📘 Blogs
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-gray-300">
                    {lesson.resources.blogs.map((b, i) => (
                      <li key={i}>
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {b.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
