import { getGeminiModel } from "./gemini";
import { SYSTEM_PROMPT, ANALYSIS_SYNTHESIS_PROMPT } from "./system-prompt";
import { anthropic, callClaude } from "./anthropic";

export interface AnalysisResult {
    education: { score: number; summary: string };
    career: { score: number; totalYears: number; summary: string };
    techStack: { score: number; summary: string };
    aiCapability: { score: number; summary: string };
    cultureFit: { score: number; summary: string };
    basicInfo: {
        finalEducation: string;
        major: string; // Added field for v1.5
        gpa: string;
        birthYear: string;
        totalCareerParams: string;
    };
    overallReview: string | string[];
    pros: string[];
    cons: string[];
    interviewQuestions: string[];
}

// Function to analyze a single text chunk (resume content)
async function analyzeResumeText(text: string, modelName: string): Promise<AnalysisResult> {
    const prompt = `
    다음 이력서 내용을 분석해 주세요.
    
    ---
    ${text}
    ---
    `;

    let responseText = "";

    if (modelName.startsWith('claude')) {
        // Claude Analysis
        responseText = await callClaude(modelName, SYSTEM_PROMPT, prompt);

        // Extract JSON from Claude response (sometimes it wraps in ```json ... ```)
        if (responseText.includes('```json')) {
            responseText = responseText.split('```json')[1].split('```')[0].trim();
        } else if (responseText.includes('```')) {
            responseText = responseText.split('```')[1].split('```')[0].trim();
        }
    } else {
        // Gemini Analysis (Default)
        const model = getGeminiModel(modelName);
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT + "\n" + prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });
        responseText = result.response.text();
    }

    try {
        return JSON.parse(responseText) as AnalysisResult;
    } catch (e) {
        console.error("Failed to parse AI response as JSON:", responseText);
        throw new Error("AI 응답 형식이 올바르지 않습니다 (JSON 파싱 실패).");
    }
}

/**
 * 3회분의 분석 결과를 하나로 통합하는 최종 요약 라운드 (Synthesis Round)
 */
async function synthesizeResults(results: AnalysisResult[], finalScores: any, modelName: string): Promise<AnalysisResult> {
    const synthesisInput = {
        finalScores,
        analysisRounds: results
    };

    const prompt = `
    다음은 동일한 지원자에 대한 3회의 분석 결과입니다. 이를 바탕으로 가독성이 높고 풍부한 최종 통합 리포트를 작성해 주세요.
    
    데이터:
    ${JSON.stringify(synthesisInput, null, 2)}
    `;

    let responseText = "";

    try {
        if (modelName.startsWith('claude')) {
            responseText = await callClaude(modelName, ANALYSIS_SYNTHESIS_PROMPT, prompt);
            if (responseText.includes('```json')) {
                responseText = responseText.split('```json')[1].split('```')[0].trim();
            } else if (responseText.includes('```')) {
                responseText = responseText.split('```')[1].split('```')[0].trim();
            }
        } else {
            const model = getGeminiModel(modelName);
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: ANALYSIS_SYNTHESIS_PROMPT + "\n" + prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });
            responseText = result.response.text();
        }

        const finalResult = JSON.parse(responseText) as AnalysisResult;

        // 최종 점수는 AI가 임의로 변경하지 못하도록 사전에 계산된 평균값으로 강제 고정
        finalResult.education.score = finalScores.education;
        finalResult.career.score = finalScores.career;
        finalResult.techStack.score = finalScores.techStack;
        finalResult.aiCapability.score = finalScores.aiCapability;
        finalResult.cultureFit.score = finalScores.cultureFit;

        return finalResult;
    } catch (e) {
        console.error("Synthesis round failed:", e);
        throw e;
    }
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
            const msg = (error.message || "").toLowerCase();

            // Check for Gemini/Claude specific error patterns
            if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('rate_limit')) {
                lastError = "토큰 사용량(RPM/TPM) 한도에 도달했습니다. 잠시 후 다시 시도하거나 다른 모델을 선택해 주세요.";
            } else if (msg.includes('credit balance') || msg.includes('billing')) {
                lastError = "Anthropic API 잔액이 부족합니다. 크레딧을 충전하거나 다른 모델을 선택해 주세요.";
            } else if (msg.includes('overloaded') || msg.includes('503')) {
                lastError = "AI 서버가 혼잡합니다. 잠시 후 다시 시도해 주세요.";
            } else if (msg.includes('authentication') || msg.includes('invalid api key') || msg.includes('401')) {
                lastError = "API 키가 올바르지 않거나 활성화되지 않았습니다. 설정을 확인해 주세요.";
            } else {
                lastError = error.message || "Unknown error";
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

    // 3. 점수 평균 계산
    const avgScore = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

    const finalScores = {
        education: avgScore(results.map(r => r.education.score)),
        career: avgScore(results.map(r => r.career.score)),
        techStack: avgScore(results.map(r => r.techStack.score)),
        aiCapability: avgScore(results.map(r => r.aiCapability.score)),
        cultureFit: avgScore(results.map(r => r.cultureFit.score)),
    };
    const totalScore = calculateTotalScore({ ...results[0], ...finalScores } as any);

    // 4. 최종 통합 라운드 (Synthesis Round) 진행
    console.log(`Starting synthesis round for final report...`);
    try {
        const synthesizedResult = await synthesizeResults(results, { ...finalScores, totalScore }, modelName);
        console.log("Synthesis completed successfully.");
        return synthesizedResult;
    } catch (e) {
        console.warn("Synthesis failed, falling back to first result with averaged scores.", e);
        // Fallback: 통합 실패 시 첫 번째 분석 결과에 평균 점수만 입혀서 반환
        return {
            ...results[0],
            education: { ...results[0].education, score: finalScores.education },
            career: { ...results[0].career, score: finalScores.career },
            techStack: { ...results[0].techStack, score: finalScores.techStack },
            aiCapability: { ...results[0].aiCapability, score: finalScores.aiCapability },
            cultureFit: { ...results[0].cultureFit, score: finalScores.cultureFit },
        };
    }
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
