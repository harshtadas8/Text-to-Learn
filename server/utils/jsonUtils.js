export function extractJson(rawText) {
  try {
    // 1. If it's already perfectly valid JSON, just parse and return it.
    // Sometimes the model outputs raw JSON without any markdown or conversational wrapper.
    return JSON.parse(rawText);
  } catch (err) {
    // 2. If standard parsing fails, try to extract it from markdown blocks or find the outermost curly braces.
    const first = rawText.indexOf("{");
    const last = rawText.lastIndexOf("}");

    if (first === -1 || last === -1) {
      throw new Error("Invalid JSON from AI: No JSON object found in response");
    }

    try {
      return JSON.parse(rawText.slice(first, last + 1));
    } catch (parseErr) {
      console.error("AI JSON Parse Error on extracted string:", parseErr);
      throw new Error("Invalid JSON from AI: Extracted JSON is malformed");
    }
  }
}
