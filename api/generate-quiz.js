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
    const { topic, numberOfQuestions = 10 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Campo obrigatório: topic' });
    }

    console.log(`🔍 Gerando quiz de ${numberOfQuestions} questões sobre: ${topic}`);

    // Verificar se a API key está disponível
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      console.error('❌ API Key não configurada');
      return res.status(500).json({ error: 'API Key não configurada' });
    }

    // Gerar prompt para a IA
    const prompt = `Crie ${numberOfQuestions} questões de múltipla escolha sobre o tópico "${topic}".

INSTRUÇÕES:
- Crie exatamente ${numberOfQuestions} questões
- Cada questão deve ter 4 alternativas (A, B, C, D)
- Uma alternativa deve ser a resposta correta
- As questões devem ser claras e específicas sobre "${topic}"
- Use linguagem adequada para estudantes brasileiros
- Varie o nível de dificuldade das questões
- Inclua uma explicação educativa para cada questão
- Foque especificamente no contexto histórico da Independência do Brasil (1822)
- Se o tópico mencionar "Independência do Brasil", foque nos aspectos históricos, políticos e sociais desse período

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional.

JSON:
{
  "quiz": [
    {
      "question": "Pergunta específica sobre ${topic}",
      "options": ["A) Primeira alternativa", "B) Segunda alternativa", "C) Terceira alternativa", "D) Quarta alternativa"],
      "correct": 1,
      "explanation": "Explicação detalhada do porquê a resposta está correta"
    }
  ]
}

NOTA: O campo "correct" deve ser o índice da alternativa correta (0=A, 1=B, 2=C, 3=D)`;

    // Chamar a API da Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
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
    
    let quiz;

    try {
      quiz = JSON.parse(jsonContent);
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
        
        quiz = JSON.parse(fixedJson);
        console.log('✅ JSON corrigido e parseado');
      } catch (secondError) {
        console.log('❌ JSON não pode ser parseado, usando fallback');
        // Fallback: criar quiz básico
        quiz = {
          quiz: Array.from({ length: numberOfQuestions }, (_, i) => ({
            question: `Questão ${i + 1} sobre ${topic}`,
            options: [
              `A) Alternativa A da questão ${i + 1}`,
              `B) Alternativa B da questão ${i + 1}`,
              `C) Alternativa C da questão ${i + 1}`,
              `D) Alternativa D da questão ${i + 1}`
            ],
            correct: 1,
            explanation: `Explicação para a questão ${i + 1} sobre ${topic}`
          }))
        };
      }
    }

    // Validar estrutura do quiz
    if (!quiz.quiz || !Array.isArray(quiz.quiz)) {
      throw new Error('Estrutura do quiz inválida');
    }

    // Validar cada questão
    quiz.quiz = quiz.quiz.map((question, index) => {
      if (!question.question || !question.options || !Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error(`Questão ${index + 1} tem estrutura inválida`);
      }
      if (typeof question.correct !== 'number' || question.correct < 0 || question.correct > 3) {
        throw new Error(`Questão ${index + 1} tem índice de resposta correta inválido`);
      }
      return question;
    });

    console.log(`🎉 Quiz de ${quiz.quiz.length} questões gerado com sucesso!`);
    res.status(200).json(quiz);

  } catch (error) {
    console.error('❌ Erro na geração de quiz:', error);
    res.status(500).json({ error: error.message });
  }
}