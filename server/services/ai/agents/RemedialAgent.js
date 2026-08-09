import { getGenAI } from "../gemini.service.js";

export class RemedialAgent {
  async generateRemedialLesson(topic, failedQuestions) {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      systemInstruction: `You are an empathetic, encouraging AI Remedial Teacher.
The student has just failed a quiz on ${topic}.
Based on the questions they got wrong, generate a very short, highly focused "Micro-Lesson" (max 300 words).
Focus ONLY on explaining the concepts they missed in a simple, easy-to-understand way.
Use analogies if helpful. Do not scold them.
Return the output in Markdown format without a markdown codeblock around it.`,
    });

    const failedConcepts = failedQuestions.map(q => `Question: ${q.question}\nCorrect Answer: ${q.correctAnswer}\nStudent Answer: ${q.studentAnswer}`).join('\n\n');

    const prompt = `Here are the questions the student got wrong:\n${failedConcepts}\n\nPlease generate the remedial micro-lesson now.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("[RemedialAgent] Failed to generate remedial lesson", error);
      return null;
    }
  }
}
