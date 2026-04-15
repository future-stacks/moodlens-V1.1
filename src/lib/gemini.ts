import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getIntervention(mood: string, history: any[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user is currently feeling: ${mood}. Provide a structured habit intervention for a high-functioning individual.`,
      config: {
        systemInstruction: "You are a senior product engineer, behavioral psychologist, and habit design expert. Your goal is to help users take action immediately and maintain consistency. Keep responses punchy and low-friction. The 'quote' must be highly relevant to the specific mood provided, offering either comfort or a necessary push.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, description: "A micro-action taking less than 2 minutes." },
            reframe: { type: Type.STRING, description: "A cognitive reframe to reduce resistance." },
            nextStep: { type: Type.STRING, description: "A simplified next step to remove overthinking." },
            reflection: { type: Type.STRING, description: "An optional, non-intrusive reflection question." },
            quote: { type: Type.STRING, description: "A highly relevant, short inspirational quote." },
            author: { type: Type.STRING, description: "The author of the quote." },
            journalPrompt: { type: Type.STRING, description: "A deep but short journal prompt." }
          },
          required: ["action", "reframe", "nextStep", "quote", "author", "journalPrompt"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      action: "Take 3 deep breaths.",
      reframe: "Action is the antidote to anxiety.",
      nextStep: "Focus on one small task.",
      reflection: "What is one thing you can control right now?"
    };
  }
}
