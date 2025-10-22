export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'ANTHROPIC_API_KEY não configurada',
        hasKey: false
      });
    }

    // Teste específico para flashcards
    const prompt = `Crie 3 flashcards educativos sobre "Teorema de Pitágoras".

INSTRUÇÕES:
- Crie exatamente 3 flashcards
- Cada flashcard deve ter uma pergunta específica e uma resposta detalhada
- Foque em conceitos importantes, definições, aplicações
- Use linguagem clara e educativa
- Seja específico sobre o tema "Teorema de Pitágoras"

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional.

JSON:
{
  "flashcards": [
    {
      "question": "Pergunta específica sobre Teorema de Pitágoras",
      "answer": "Resposta detalhada e educativa"
    }
  ]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const responseText = await response.text();
    const data = JSON.parse(responseText);
    
    res.status(200).json({ 
      success: true,
      status: response.status,
      statusText: response.statusText,
      hasKey: true,
      keyPrefix: apiKey.substring(0, 10) + '...',
      rawResponse: data,
      content: data.content[0].text
    });

  } catch (error) {
    console.error('❌ Erro no teste de flashcards:', error);
    res.status(500).json({ 
      error: error.message,
      hasKey: !!process.env.ANTHROPIC_API_KEY
    });
  }
}
