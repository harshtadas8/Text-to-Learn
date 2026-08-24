import { Orchestrator } from "./Orchestrator.js";
import { QuizAgent } from "./agents/QuizAgent.js";
import { TutorAgent } from "./agents/TutorAgent.js";

// Initialize Agents
const orchestrator = new Orchestrator();
const quizAgent = new QuizAgent();
const tutorAgent = new TutorAgent();

// Backward compatible wrappers that use the new Multi-Agent architecture
export async function generateCourseWithGemini(topic, level, language, goal, timeAvailable, userMemory = null) {
  // Uses Orchestrator which combines LessonAgent + EvaluatorAgent
  return await orchestrator.createValidatedCourse(topic, level, language, goal, timeAvailable, userMemory);
}

export async function generateQuizWithGemini(courseTopic, moduleTitle, lessonTitle, lessonContent) {
  return await quizAgent.generateQuiz(courseTopic, moduleTitle, lessonTitle, lessonContent);
}

export async function chatWithLesson(courseId, lessonContent, chatHistory, userMessage, userMemory = null) {
  return await tutorAgent.chat(courseId, lessonContent, chatHistory, userMessage, userMemory);
}

export async function analyzeQuizForMemory(courseTopic, quizQuestions, userAnswers) {
  return await orchestrator.analyzeAndExtractMemory(courseTopic, quizQuestions, userAnswers);
}

// -----------------------------------------------------
// Vector Search (Phase A)
// -----------------------------------------------------
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance = null;
export function getGenAI() {
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAIInstance;
}

export async function generateRemedialWithGemini(topic, failedQuestions) {
  return await orchestrator.generateRemedial(topic, failedQuestions);
}

export async function generateEmbeddings(text) {
  const genAI = getGenAI();
  const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values.slice(0, 768);
}


export async function generateDiagnosticQuizWithGemini(topic, language, sourceMaterial = '') {
  return await quizAgent.generateDiagnosticQuiz(topic, language, sourceMaterial);
}

export async function generateRefresherWithGemini(topic) {
  return await orchestrator.generateRefresher(topic);
}
