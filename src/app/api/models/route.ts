import { NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';

export async function GET() {
    // We use a predefined stable list of models because genAI.listModels() 
    // can be inconsistent across different SDK versions and environments.
    const models = [
        { id: 'gemini-3-flash', displayName: 'Gemini 3 Flash' },
        { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
        { id: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash Lite' },
        { id: 'claude-3-5-sonnet-latest', displayName: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-5-haiku-latest', displayName: 'Claude 3.5 Haiku' },
        { id: 'claude-3-opus-latest', displayName: 'Claude 3 Opus' },
    ];

    return NextResponse.json(models);
}
