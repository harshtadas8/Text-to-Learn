export const buildDummyCourse = (topic, level) => {
  return {
    title: `${topic} – ${level} Course`,
    description: `A ${level}-level course on ${topic}`,
    modules: [
      {
        title: `Introduction to ${topic}`,
        lessons: [
          `What is ${topic}?`,
          `Why learn ${topic}?`,
        ],
      },
      {
        title: `Core Concepts of ${topic}`,
        lessons: [
          `${topic} fundamentals`,
          `Real-world use cases`,
        ],
      },
    ],
  };
};
