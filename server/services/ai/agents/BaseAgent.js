import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractJson } from "../../../utils/jsonUtils.js";

export class BaseAgent {
  constructor(modelName = "gemini-3.5-flash-lite", requireJson = false) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const config = { model: modelName };
    if (requireJson) {
      config.generationConfig = { responseMimeType: "application/json" };
    }
    this.model = this.genAI.getGenerativeModel(config);
  }

  extractJson(text) {
    return extractJson(text);
  }
}
