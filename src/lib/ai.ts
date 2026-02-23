import Groq from 'groq-sdk';

const groqApiKey = process.env.GROQ_API_KEY;

let groqClient: Groq | null = null;

if (groqApiKey) {
  groqClient = new Groq({ apiKey: groqApiKey });
}

export const isAIEnabled = () => !!groqClient;

export async function chat(userMessage: string, context?: string): Promise<string | null> {
  if (!groqClient) return null;

  const systemPrompt = context
    ? `Você é um assistente de gestão de estoque de vinhos. ${context}`
    : 'Você é um assistente de gestão de estoque de vinhos. Responda de forma concisa e direta em português.';

  try {
    const completion = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error('Groq error:', error);
    return null;
  }
}
