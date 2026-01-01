import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
// Note: Ensure GEMINI_API_KEY is set in .env.local for local development.
const genAI = new GoogleGenerativeAI(API_KEY);

export const getGeminiModel = (modelName: string = "gemini-2.5-flash") => {
    return genAI.getGenerativeModel({
        model: modelName,
    });
};

// Default model instance for backward compatibility
export const model = getGeminiModel("gemini-2.5-flash");

export { genAI };
