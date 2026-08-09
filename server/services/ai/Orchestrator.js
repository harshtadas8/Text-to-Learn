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

  async createValidatedCourse(topic, level, language, goal, timeAvailable, userMemory, maxRetries = 2) {
    let attempts = 0;
    while (attempts < maxRetries) {
      console.log(`[Orchestrator] Attempt ${attempts + 1} to generate course...`);
      const course = await this.lessonAgent.generateCourse(topic, level, language, goal, timeAvailable, userMemory);
      
      console.log(`[Orchestrator] Evaluating generated course...`);
      const evaluation = await this.evaluatorAgent.evaluateCourse(course);
      
      if (evaluation.isValid) {
        console.log(`[Orchestrator] Course is valid!`);
        // If the evaluator fixed minor issues, use the fixed version. Otherwise use original.
        return evaluation.fixedCourse || course; 
      }
      
      console.log(`[Orchestrator] Course rejected by Evaluator. Reason: ${evaluation.feedback}`);
      attempts++;
    }
    
    throw new Error("Failed to generate a valid course after multiple attempts. The AI Evaluator repeatedly rejected the output.");
  }

  async analyzeAndExtractMemory(courseTopic, quizQuestions, userAnswers) {
    console.log(`[Orchestrator] Analyzing quiz results for user memory...`);
    return await this.analysisAgent.analyzeQuizResults(courseTopic, quizQuestions, userAnswers);
  }

  async generateRemedial(topic, failedQuestions) {
    console.log(`[Orchestrator] Generating remedial lesson for missed questions on ${topic}...`);
    return await this.remedialAgent.generateRemedialLesson(topic, failedQuestions);
  }
}

