import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
// Note: Ensure GEMINI_API_KEY is set in .env.local for local development.
const genAI = new GoogleGenerativeAI(API_KEY);

export const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
});

// Since "gemini-3-flash-preview" is likely a hallucination or future model in the user's prompt (it's currently 1.5 or 2.0),
// I will use a safe default if the specific model string causes 404.
// But for "Execution", I should code what's asked.
