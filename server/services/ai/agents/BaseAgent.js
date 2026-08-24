import { logger } from "../../../config/logger.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractJson } from "../../../utils/jsonUtils.js";
import AIUsage from "../../../models/AIUsage.js";
import Groq from "groq-sdk";

export class BaseAgent {
  constructor(modelName = "gemini-3.5-flash-lite", requireJson = false) {
    this.modelName = modelName;
    this.requireJson = requireJson;
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const config = { model: modelName };
    if (requireJson) {
      config.generationConfig = { responseMimeType: "application/json" };
    }
    this.model = this.genAI.getGenerativeModel(config);
    this.groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
  }

  extractJson(text, schema = null) {
    const data = extractJson(text);
    if (schema) {
      // If validation fails, Zod throws a ZodError with detailed issues.
      // This will automatically be caught by the Orchestrator/Caller to trigger a retry.
      return schema.parse(data);
    }
    return data;
  }

  async generate(prompt, userId = "system", operationType = "unknown") {
    let text = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let estimatedCost = 0;
    let actualModel = this.modelName;

    try {
      const result = await this.model.generateContent(prompt);
      const usage = result.response.usageMetadata || {};
      inputTokens = usage.promptTokenCount || 0;
      outputTokens = usage.candidatesTokenCount || 0;
      
      // Rough estimate for flash-lite: $0.075 / 1M input, $0.30 / 1M output
      estimatedCost = (inputTokens / 1_000_000 * 0.075) + (outputTokens / 1_000_000 * 0.30);
      text = result.response.text();

    } catch (err) {
      logger.error(`[BaseAgent] Gemini generation failed (${err.message}). Attempting Groq fallback...`);
      
      if (!this.groqClient) {
        throw new Error("Gemini API failed and GROQ_API_KEY is not configured for fallback.");
      }

      actualModel = "llama-3.1-8b-instant"; // Groq fallback model
      const completion = await this.groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: actualModel,
        response_format: this.requireJson ? { type: "json_object" } : { type: "text" },
      });

      text = completion.choices[0]?.message?.content || "";
      
      // Groq provides token usage
      inputTokens = completion.usage?.prompt_tokens || 0;
      outputTokens = completion.usage?.completion_tokens || 0;
      estimatedCost = (inputTokens / 1_000_000 * 0.05) + (outputTokens / 1_000_000 * 0.08); // rough groq cost
      
      logger.info(`[BaseAgent] Groq fallback succeeded using ${actualModel}.`);
    }
    
    // Fire-and-forget log to database
    AIUsage.create({
      userId,
      operationType,
      inputTokens,
      outputTokens,
      estimatedCost,
      modelName: actualModel
    }).catch(err => logger.error("[AIUsage] Failed to log usage:", err));
    
    // Increment on User model if not system
    if (userId !== "system") {
      import("../../../models/User.js").then(({ default: User }) => {
        User.updateOne(
          { auth0Id: userId },
          { 
            $inc: { 
              "aiUsage.inputTokens": inputTokens,
              "aiUsage.outputTokens": outputTokens,
              "aiUsage.estimatedCost": estimatedCost
            } 
          }
        ).catch(err => logger.error("[AIUsage] Failed to increment User aiUsage:", err));
      });
    }
    
    return {
      text,
      usage: { inputTokens, outputTokens, estimatedCost }
    };
  }
}
