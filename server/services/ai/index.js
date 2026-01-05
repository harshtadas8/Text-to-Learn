import { generateWithGemini } from "./gemini.service.js";
import { generateWithMock } from "./mock.service.js";

export async function generateCourse(topic, level) {
  const provider = process.env.AI_PROVIDER?.toLowerCase();

  if (provider === "gemini") {
    console.log("✨ Using Gemini AI");
    return generateWithGemini(topic, level);
  }

  console.log("🤖 Using Mock AI");
  return generateWithMock(topic, level);
}
