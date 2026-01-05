export function generateWithMock(topic, level) {
  return {
    title: `Create a ${level} level course on ${topic}`,
    description: "Mock AI-generated course",
    level,
    modules: [
      {
        moduleTitle: "Introduction",
        lessons: [
          "What is the topic?",
          "Why this topic matters",
          "Real-world applications",
        ],
      },
    ],
  };
}
