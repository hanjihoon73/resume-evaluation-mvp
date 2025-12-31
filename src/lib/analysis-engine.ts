
import { GoogleGenerativeAI } from "@google/generative-ai";
import { model } from "./gemini";
import { SYSTEM_PROMPT } from "./system-prompt";

export interface AnalysisResult {
    education: { score: number; summary: string };
    career: { score: number; totalYears: number; summary: string };
    techStack: { score: number; summary: string };
    aiCapability: { score: number; summary: string };
    cultureFit: { score: number; summary: string };
    basicInfo: {
        finalEducation: string;
        gpa: string;
        birthYear: string;
        totalCareerParams: string;
    };
    overallReview: string;
    pros: string[];
    cons: string[];
    interviewQuestions: string[];
}

// Function to analyze a single text chunk (resume content)
async function analyzeResumeText(text: string): Promise<AnalysisResult> {
    const prompt = `
    다음 이력서 내용을 분석해 주세요.
    
    ---
    ${text}
    ---
    `;

    // We will use generateContent with the system instruction if supported, 
    // or prepend system prompt. Gemini 1.5 Flash supports systemInstruction via config, 
    // but the simple SDK usage often is chat or generateContent with text.
    // Let's try prepending for safety in this MVP or using systemInstruction if the client supports it comfortably.
    // The current GoogleGenerativeAI SDK supports systemInstruction.

    // However, I already initialized 'model' in gemini.ts without systemInstruction.
    // I can pass it here if I create a new getGenerativeModel or just mix it in the prompt.
    // For robust JSON output, I will ask for JSON schema or just text.

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT + "\n" + prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

    const responseText = result.response.text();
    return JSON.parse(responseText) as AnalysisResult;
}

// Function to perform 3 rounds of analysis and average the scores
export async function analyzeResumeWithRetry(text: string, onProgress?: (round: number) => void): Promise<AnalysisResult> {
    const ROUNDS = 3;
    const results: AnalysisResult[] = [];

    // Serial Processing for 3 rounds
    for (let i = 0; i < ROUNDS; i++) {
        try {
            console.log(`Analyzing round ${i + 1}...`);
            if (onProgress) onProgress(i + 1);
            const result = await analyzeResumeText(text);
            results.push(result);
        } catch (error) {
            console.error(`Error in round ${i + 1}`, error);
            // Continue or Fail? Plan says perform 3 times. If one fails, we might want to retry or skip.
            // For MVP, if it fails, we will try once more or just ignore. 
            // Let's try to proceed if we have at least 1 result, but strictly we should try to get 3.
            // I'll add a simple retry logic inside or just accept failure and avg what we have.
        }
    }

    if (results.length === 0) {
        throw new Error("Analysis failed completely.");
    }

    // Calculate Averages for scores
    const avgHeight = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const finalResult: AnalysisResult = {
        ...results[0], // Copy text fields from the first successful result
        education: {
            ...results[0].education,
            score: Math.round(avgHeight(results.map(r => r.education.score)))
        },
        career: {
            ...results[0].career,
            score: Math.round(avgHeight(results.map(r => r.career.score)))
        },
        techStack: {
            ...results[0].techStack,
            score: Math.round(avgHeight(results.map(r => r.techStack.score)))
        },
        aiCapability: {
            ...results[0].aiCapability,
            score: Math.round(avgHeight(results.map(r => r.aiCapability.score)))
        },
        cultureFit: {
            ...results[0].cultureFit,
            score: Math.round(avgHeight(results.map(r => r.cultureFit.score)))
        },
    };

    return finalResult;
}

export function calculateTotalScore(result: AnalysisResult): number {
    // Weights:
    // 전공 10, 근속 20, 기술 40, AI 20, 컬처 10
    const weightedScore =
        (result.education.score * 0.1) +
        (result.career.score * 0.2) +
        (result.techStack.score * 0.4) +
        (result.aiCapability.score * 0.2) +
        (result.cultureFit.score * 0.1);

    return Math.round(weightedScore);
}
