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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { theme, numberOfCards } = req.body;

    if (!theme || !numberOfCards) {
      return res.status(400).json({ error: 'Campos obrigatórios: theme, numberOfCards' });
    }

    console.log(`🔍 Gerando ${numberOfCards} flashcards sobre: ${theme}`);

    // Gerar prompt para a IA
    const prompt = `Você é um especialista em educação e criação de flashcards. Crie ${numberOfCards} flashcards sobre o tema "${theme}".

REQUISITOS:
- Crie exatamente ${numberOfCards} flashcards
- Cada flashcard deve ter uma pergunta clara e uma resposta detalhada
- As perguntas devem ser variadas (conceitos, definições, exemplos, aplicações)
- As respostas devem ser educativas e completas
- Use linguagem clara e acessível
- Foque em conceitos importantes do tema

FORMATO DE RESPOSTA (JSON):
{
  "flashcards": [
    {
      "question": "Pergunta do flashcard",
      "answer": "Resposta detalhada"
    }
  ]
}`;

    // Chamar a API da Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta da IA não contém JSON válido');
    }

    let jsonContent = jsonMatch[0];
    let flashcards;

    try {
      flashcards = JSON.parse(jsonContent);
    } catch (firstError) {
      try {
        // Tentar corrigir JSON malformado
        let fixedJson = jsonContent;
        
        // Corrigir vírgulas ausentes
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*(\w+)/g, '$1,\n$2');
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*"(\w+)":/g, '$1,\n"$2":');
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*\]/g, '$1\n]');
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*\}/g, '$1\n}');
        
        flashcards = JSON.parse(fixedJson);
      } catch (secondError) {
        // Fallback: criar flashcards básicos
        flashcards = {
          flashcards: Array.from({ length: numberOfCards }, (_, i) => ({
            question: `Pergunta ${i + 1} sobre ${theme}`,
            answer: `Resposta ${i + 1} sobre ${theme}`
          }))
        };
      }
    }

    console.log(`🎉 ${flashcards.flashcards.length} flashcards gerados com sucesso!`);
    res.status(200).json(flashcards);

  } catch (error) {
    console.error('❌ Erro na geração de flashcards:', error);
    res.status(500).json({ error: error.message });
  }
}
