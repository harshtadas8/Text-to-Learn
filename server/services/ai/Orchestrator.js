import { logger } from "../../config/logger.js";
import { LessonAgent } from "./agents/LessonAgent.js";
import { EvaluatorAgent } from "./agents/EvaluatorAgent.js";
import { AnalysisAgent } from "./agents/AnalysisAgent.js";
import { RemedialAgent } from "./agents/RemedialAgent.js";

export class Orchestrator {
  constructor() {
    this.lessonAgent = new LessonAgent();
    this.evaluatorAgent = new EvaluatorAgent();
    this.analysisAgent = new AnalysisAgent();
    this.remedialAgent = new RemedialAgent();
  }

  async createValidatedCourse(topic, level, language, goal, timeAvailable, userMemory, sourceMaterial = '', maxRetries = 2) {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        logger.info(`[Orchestrator] Attempt ${attempts + 1} to generate course...`);
        const course = await this.lessonAgent.generateCourse(topic, level, language, goal, timeAvailable, userMemory, sourceMaterial);
        
        logger.info(`[Orchestrator] Evaluating generated course...`);
        const evaluation = await this.evaluatorAgent.evaluateCourse(course);
        
        if (evaluation.isValid) {
          logger.info(`[Orchestrator] Course is valid!`);
          return evaluation.fixedCourse || course; 
        }
        
        logger.info(`[Orchestrator] Course rejected by Evaluator. Reason: ${evaluation.feedback}`);
      } catch (err) {
        logger.info(`[Orchestrator] Generation failed (e.g. malformed JSON). Reason: ${err.message}`);
      }
      attempts++;
    }
    
    throw new Error("Failed to generate a valid course after multiple attempts.");
  }

  async analyzeAndExtractMemory(courseTopic, quizQuestions, userAnswers) {
    logger.info(`[Orchestrator] Analyzing quiz results for user memory...`);
    return await this.analysisAgent.analyzeQuizResults(courseTopic, quizQuestions, userAnswers);
  }

  async generateRemedial(topic, failedQuestions) {
    logger.info(`[Orchestrator] Generating remedial lesson for missed questions on ${topic}...`);
    return await this.remedialAgent.generateRemedialLesson(topic, failedQuestions);
  }

  async generateRefresher(topic) {
    logger.info(`[Orchestrator] Generating refresher lesson for weak topic ${topic}...`);
    return await this.remedialAgent.generateRefresherLesson(topic);
  }
}

