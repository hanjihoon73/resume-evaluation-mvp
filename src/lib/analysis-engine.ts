import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiModel } from "./gemini";
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
async function analyzeResumeText(text: string, modelName: string): Promise<AnalysisResult> {
    const model = getGeminiModel(modelName);
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
export async function analyzeResumeWithRetry(text: string, modelName: string, onProgress?: (round: number) => void): Promise<AnalysisResult> {
    const ROUNDS = 3;
    let lastError = "";

    // Parallel Processing for 3 rounds
    console.log(`Starting parallel analysis (3 rounds) with ${modelName}...`);

    let completedRounds = 0;
    const promises = Array.from({ length: ROUNDS }).map(async (_, i) => {
        try {
            // Add a small stagger delay (e.g., 500ms) to avoid hitting RPM limits aggressively
            if (i > 0) await new Promise(resolve => setTimeout(resolve, i * 800));

            const result = await analyzeResumeText(text, modelName);
            completedRounds++;
            if (onProgress) onProgress(completedRounds);
            return result;
        } catch (error: any) {
            console.error(`Error in parallel round ${i + 1}`, error);
            const msg = error.message || "";
            if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
                lastError = "토큰 사용량(RPM/TPM) 한도에 도달했습니다. 잠시 후 다시 시도하거나 다른 모델을 선택해 주세요.";
            } else {
                lastError = msg || "Unknown error";
            }
            throw error;
        }
    });

    const settledResults = await Promise.allSettled(promises);
    const results = settledResults
        .filter((r): r is PromiseFulfilledResult<AnalysisResult> => r.status === 'fulfilled')
        .map(r => r.value);

    if (results.length === 0) {
        throw new Error(`${modelName} 모델 분석 실패: ${lastError}`);
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
