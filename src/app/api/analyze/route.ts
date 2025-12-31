
import { NextRequest, NextResponse } from 'next/server';
import { analyzeResumeWithRetry, calculateTotalScore } from '@/lib/analysis-engine';

// Note: pdf-parse requires a specific version or require syntax in some environments.
// We point directly to the lib to avoid the 'debug mode' check in index.js which can crash Next.js.
const pdf = require('pdf-parse/lib/pdf-parse.js');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. PDF Text Extraction
        let text = "";
        try {
            const data = await pdf(buffer);
            text = data.text;
            if (!text || text.trim().length === 0) {
                return NextResponse.json({
                    error: "Parsing Error",
                    message: "PDF에서 텍스트를 추출할 수 없거나 비어있습니다."
                }, { status: 422 });
            }
        } catch (pdfError: any) {
            return NextResponse.json({
                error: "PDF Parsing Failed",
                message: "PDF 추출 중 오류가 발생했습니다: " + pdfError.message
            }, { status: 500 });
        }

        // 2. AI Analysis (Streaming Response)
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const analysisResult = await analyzeResumeWithRetry(text, (round) => {
                        controller.enqueue(encoder.encode(JSON.stringify({ type: 'round', round }) + "\n"));
                    });
                    const totalScore = calculateTotalScore(analysisResult);
                    controller.enqueue(encoder.encode(JSON.stringify({ type: 'result', result: analysisResult, totalScore }) + "\n"));
                    controller.close();
                } catch (aiError: any) {
                    controller.enqueue(encoder.encode(JSON.stringify({
                        type: 'error',
                        error: "AI Analysis Failed",
                        message: aiError.message
                    }) + "\n"));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'application/x-ndjson' }
        });

    } catch (globalError: any) {
        return NextResponse.json({
            error: "Internal Server Error",
            message: globalError.message || "알 수 없는 글로벌 서버 오류"
        }, { status: 500 });
    }
}
