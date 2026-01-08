
import { NextRequest, NextResponse } from 'next/server';
import { analyzeResumeWithRetry, calculateTotalScore } from '@/lib/analysis-engine';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

// pdfjs-dist 워커 설정 (Node.js 환경에서는 워커 스크립트 경로 설정)
// @ts-ignore - 워커 경로 지정
GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.mjs',
    import.meta.url
).toString();

// PDF 텍스트 추출 함수 (pdfjs-dist 사용)
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    const data = new Uint8Array(buffer);
    const loadingTask = getDocument({ data });
    const pdfDocument = await loadingTask.promise;

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');

        fullText += pageText + '\n';
    }

    return fullText;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const modelName = formData.get('modelName') as string || 'gemini-1.5-flash';

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. PDF Text Extraction (using pdfjs-dist)
        let text = "";
        try {
            text = await extractTextFromPDF(buffer);
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
                    const analysisResult = await analyzeResumeWithRetry(text, modelName, (round) => {
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
