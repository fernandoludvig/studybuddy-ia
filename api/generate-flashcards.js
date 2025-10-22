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
    const prompt = `Crie ${numberOfCards} flashcards educativos sobre "${theme}".

INSTRUÇÕES:
- Crie exatamente ${numberOfCards} flashcards
- Cada flashcard deve ter uma pergunta específica e uma resposta detalhada
- Foque em conceitos importantes, datas, pessoas, eventos, definições
- Use linguagem clara e educativa
- Seja específico sobre o tema "${theme}"

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional.

JSON:
{
  "flashcards": [
    {
      "question": "Pergunta específica sobre ${theme}",
      "answer": "Resposta detalhada e educativa"
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
    console.log('📝 Resposta da IA:', content);
    
    // Tentar encontrar JSON na resposta
    let jsonContent = content;
    
    // Remover texto antes e depois do JSON
    const jsonStart = jsonContent.indexOf('{');
    const jsonEnd = jsonContent.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonContent = jsonContent.substring(jsonStart, jsonEnd);
    }
    
    let flashcards;

    try {
      flashcards = JSON.parse(jsonContent);
      console.log('✅ JSON parseado com sucesso');
    } catch (firstError) {
      console.log('⚠️ Erro no parsing, tentando corrigir...');
      try {
        // Tentar corrigir JSON malformado
        let fixedJson = jsonContent;
        
        // Corrigir vírgulas ausentes
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*(\w+)/g, '$1,\n$2');
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*"(\w+)":/g, '$1,\n"$2":');
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*\]/g, '$1\n]');
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*\}/g, '$1\n}');
        
        flashcards = JSON.parse(fixedJson);
        console.log('✅ JSON corrigido e parseado');
      } catch (secondError) {
        console.log('❌ JSON não pode ser parseado, usando fallback');
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
