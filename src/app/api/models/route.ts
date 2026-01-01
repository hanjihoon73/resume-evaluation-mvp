import { NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';

export async function GET() {
    try {
        // Attempt to list models using the SDK
        const result = await genAI.listModels();

        // Filter for models that support generating content and have 'gemini' in their name
        const geminiModels = result.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent') && m.name.toLowerCase().includes('gemini'))
            .map(m => ({
                id: m.name.split('/')[1] || m.name, // Clean up "models/gemini-..." format
                displayName: m.displayName,
                description: m.description,
            }));

        // If no models found (sometimes listModels returns empty in specific environments), 
        // provide the list the user explicitly mentioned as a fallback.
        if (geminiModels.length === 0) {
            return NextResponse.json([
                { id: 'gemini-3-pro-preview', displayName: 'Gemini 3 Pro Preview' },
                { id: 'gemini-3-flash-preview', displayName: 'Gemini 3 Flash Preview' },
                { id: 'gemini-flash-latest', displayName: 'Gemini Flash Latest' },
                { id: 'gemini-flash-lite-latest', displayName: 'Gemini Flash Lite Latest' },
            ]);
        }

        return NextResponse.json(geminiModels);
    } catch (error) {
        console.error('Failed to list Gemini models:', error);
        // Fallback to manual list provided by user
        return NextResponse.json([
            { id: 'gemini-3-pro-preview', displayName: 'Gemini 3 Pro Preview' },
            { id: 'gemini-3-flash-preview', displayName: 'Gemini 3 Flash Preview' },
            { id: 'gemini-flash-latest', displayName: 'Gemini Flash Latest' },
            { id: 'gemini-flash-lite-latest', displayName: 'Gemini Flash Lite Latest' },
        ]);
    }
}
