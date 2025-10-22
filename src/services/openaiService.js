const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function generateFlashcardsWithAI(theme, numberOfCards) {
  if (!OPENAI_API_KEY) {
    throw new Error('API Key da OpenAI não configurada. Configure no arquivo .env');
  }

  const prompt = `Você é um especialista em educação. Gere exatamente ${numberOfCards} flashcards sobre o tema: "${theme}".

IMPORTANTE:
- Cada flashcard deve ter uma pergunta específica e uma resposta completa e CORRETA
- As respostas devem ser factualmente precisas e educativas
- Varie os tipos de perguntas (definição, exemplos, aplicações, história, etc)
- As respostas devem ter entre 1-3 frases

Retorne APENAS um JSON neste formato (sem markdown, sem \`\`\`json):
[
  {
    "question": "Pergunta aqui?",
    "answer": "Resposta completa e correta aqui."
  }
]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um professor especializado em criar flashcards educativos com informações precisas e corretas.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao chamar API da OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Remove markdown se houver
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const flashcards = JSON.parse(jsonContent);
    return flashcards;
  } catch (error) {
    console.error('Erro detalhado:', error);
    throw new Error(`Erro ao gerar flashcards: ${error.message}`);
  }
}
