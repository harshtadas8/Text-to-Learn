import { useState, useRef, useEffect } from "react";
import { chatWithTutorAPI } from "../services/api";
import ReactMarkdown from "react-markdown";

export default function LessonTutor({ lessonContent, courseId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hi! I'm your AI Tutor. I've read the lesson above. What questions do you have?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError("");

    // Add user message to UI
    const updatedMessages = [
      ...messages,
      { role: "user", text: userMessage },
    ];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Convert UI messages to Gemini history format (excluding the very first greeting and the latest message)
      const history = messages
        .slice(1) // skip greeting
        .map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        }));

      // In lessonContent we pass the raw string version of the JSON content
      const stringifiedContent = typeof lessonContent === 'string' ? lessonContent : JSON.stringify(lessonContent, null, 2);

      const res = await chatWithTutorAPI({
        courseId,
        lessonContent: stringifiedContent,
        history,
        message: userMessage,
      });

      if (res.success && res.data?.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: res.data.reply },
        ]);
      } else {
        throw new Error("Invalid response from tutor");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="mt-6 border-t border-gray-800 pt-6 text-center">
        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 mx-auto"
        >
          <span>Ask AI Tutor</span>
          <span>🤖</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 border border-gray-800 rounded-xl overflow-hidden shadow-2xl bg-gray-900 flex flex-col h-[500px]">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-indigo-400 flex items-center gap-2">
          <span>🤖</span> AI Tutor
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition"
        >
          Close
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none"
              }`}
            >
              <ReactMarkdown 
                components={{
                  strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2" {...props} />,
                  li: ({node, ...props}) => <li className="my-1" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  a: ({node, ...props}) => <a className="text-indigo-400 hover:underline" {...props} />
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg text-sm bg-gray-800 border border-gray-700 text-gray-400 rounded-bl-none flex gap-1">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
            </div>
          </div>
        )}
        {error && (
          <div className="text-center text-red-400 text-xs">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this lesson..."
          disabled={isLoading}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
