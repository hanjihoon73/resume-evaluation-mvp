import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY || '';

if (!apiKey && process.env.NODE_ENV === 'production') {
    console.warn('Warning: ANTHROPIC_API_KEY is not set in production.');
}

export const anthropic = new Anthropic({
    apiKey: apiKey,
});

/**
 * Helper to call Claude with a consistent JSON output requirement.
 */
export async function callClaude(modelName: string, systemPrompt: string, userPrompt: string) {
    const message = await anthropic.messages.create({
        model: modelName,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
            { role: 'user', content: userPrompt }
        ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
        return content.text;
    }

    throw new Error('Claude response was not text.');
}
