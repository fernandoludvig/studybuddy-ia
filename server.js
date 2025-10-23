import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://studybuddy-ia.vercel.app', 'https://studybuddy-ia-git-main-fernandoludvig.vercel.app']
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Endpoint de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!' });
});

// Endpoint para gerar planos de estudo
app.post('/api/generate-study-plan', async (req, res) => {
  try {
    console.log('📨 Requisição de plano recebida:', req.body);
    const { subjects, subSubjects, examDate, hoursPerDay, difficulty, goal } = req.body;
    const ANTHROPIC_API_KEY = process.env.VITE_ANTHROPIC_API_KEY;

    console.log(`🔍 Gerando plano para: ${subjects}`);
    console.log(`🔑 API Key configurada: ${ANTHROPIC_API_KEY ? 'Sim' : 'Não'}`);

    if (!ANTHROPIC_API_KEY) {
      console.error('❌ API Key não configurada');
      return res.status(500).json({ error: 'API Key não configurada' });
    }

    // Calcula quantas semanas até a prova
    const examDateObj = new Date(examDate);
    const today = new Date();
    const timeDiff = examDateObj.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const weeks = Math.max(1, Math.ceil(daysDiff / 7));

    const prompt = `Você é um especialista em educação e planejamento de estudos. Crie um plano de estudos detalhado e personalizado.

DADOS DO ESTUDANTE:
- Matérias: ${subjects}
${subSubjects ? `- Sub-matérias/Tópicos específicos: ${subSubjects}` : ''}
- Data da prova: ${examDate} (${daysDiff} dias restantes)
- Horas disponíveis por dia: ${hoursPerDay}h
- Nível: ${difficulty}
- Objetivo: ${goal}
- Duração do plano: ${weeks} semanas

CRIE UM PLANO COM:
1. Título criativo e motivador
2. Visão geral do plano
3. Cronograma semanal detalhado com:
   - Dias da semana (Segunda a Domingo)
   - Matérias para cada dia
   - Tópicos específicos para estudar (use as sub-matérias quando fornecidas)
   - Horas de estudo por dia
   - Tópicos marcáveis como concluídos
4. Dicas personalizadas baseadas no objetivo

IMPORTANTE SOBRE SUB-MATÉRIAS:
${subSubjects ? `- Use as sub-matérias fornecidas para criar tópicos mais específicos e detalhados
- Organize o cronograma considerando a progressão lógica das sub-matérias
- Inclua revisões e conexões entre as sub-matérias relacionadas` : '- Foque nos tópicos gerais das matérias principais'}

ESTRUTURA DO JSON:
{
  "title": "Título do plano",
  "overview": "Descrição geral",
  "schedule": [
    {
      "week": 1,
      "days": [
        {
          "day": "Segunda-feira",
          "subjects": ["Matéria1", "Matéria2"],
          "topics": ["Tópico 1", "Tópico 2", "Tópico 3"],
          "hours": 4,
          "completed": false,
          "completedTopics": [],
          "notes": ""
        }
      ]
    }
  ],
  "tips": [
    "Dica 1",
    "Dica 2",
    "Dica 3"
  ]
}

IMPORTANTE:
- Distribua as matérias de forma equilibrada
- Crie tópicos específicos e acionáveis
- Considere o nível de dificuldade
- Inclua revisões e pausas
- Seja realista com o tempo disponível
- Use linguagem motivadora

Retorne APENAS o JSON válido:`;

    try {
      console.log('🚀 Chamando API da Anthropic para plano...');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      console.log(`📡 Resposta da API: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro da API:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dados recebidos da Claude API');
      
      const content = data.content[0].text.trim();
      console.log('📝 Conteúdo recebido:', content.substring(0, 200) + '...');
      
      // Limpa o conteúdo para extrair apenas o JSON
      let jsonContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*/, '') // Remove texto antes do primeiro {
        .replace(/[^}]*$/, '') // Remove texto depois do último }
        .trim();
      
      // Se ainda não começar com {, tenta encontrar o objeto
      if (!jsonContent.startsWith('{')) {
        const objectMatch = content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          jsonContent = objectMatch[0];
        }
      }
      
      console.log('🔍 JSON extraído:', jsonContent.substring(0, 100) + '...');
      
      // Tentar corrigir JSON malformado
      let studyPlan;
      
      try {
        // Primeira tentativa: parse direto
        studyPlan = JSON.parse(jsonContent);
        console.log('✅ JSON parseado com sucesso na primeira tentativa');
      } catch (firstError) {
        console.log('⚠️ Primeira tentativa falhou, tentando corrigir JSON...');
        
        try {
          // Segunda tentativa: corrigir JSON malformado
          let fixedJson = jsonContent;
          
          // Corrigir vírgulas faltantes em arrays
          fixedJson = fixedJson.replace(/(\w+)\s*\n\s*(\w+)/g, '$1,\n$2');
          
          // Corrigir vírgulas faltantes em objetos
          fixedJson = fixedJson.replace(/(\w+)\s*\n\s*"(\w+)":/g, '$1,\n"$2":');
          
          // Corrigir vírgulas antes de fechamento de array
          fixedJson = fixedJson.replace(/(\w+)\s*\n\s*\]/g, '$1\n]');
          
          // Corrigir vírgulas antes de fechamento de objeto
          fixedJson = fixedJson.replace(/(\w+)\s*\n\s*\}/g, '$1\n}');
          
          console.log('🔧 JSON corrigido:', fixedJson.substring(0, 200) + '...');
          
          studyPlan = JSON.parse(fixedJson);
          console.log('✅ JSON parseado com sucesso após correção');
        } catch (secondError) {
          console.log('❌ Segunda tentativa falhou, criando estrutura básica...');
          
          // Terceira tentativa: criar estrutura básica
          studyPlan = {
            title: "Plano de Estudos Personalizado",
            overview: "Plano de estudos criado com base nas suas necessidades",
            schedule: [
              {
                week: 1,
                days: [
                  {
                    day: "Segunda-feira",
                    subjects: ["Matemática"],
                    topics: ["Revisão geral", "Exercícios práticos"],
                    hours: 2,
                    completed: false,
                    completedTopics: [],
                    notes: ""
                  }
                ]
              }
            ],
            tips: [
              "Mantenha um cronograma regular de estudos",
              "Faça pausas regulares para descansar",
              "Revise o conteúdo regularmente"
            ]
          };
          
          console.log('✅ Estrutura básica criada como fallback');
        }
      }
      
      // Valida se tem a estrutura básica
      if (!studyPlan.title || !studyPlan.schedule || !Array.isArray(studyPlan.schedule)) {
        throw new Error('Estrutura do plano inválida');
      }

      console.log('🎉 Plano de estudo gerado com sucesso!');
      res.json(studyPlan);
    } catch (error) {
      console.error('❌ Erro no servidor:', error);
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error('❌ Erro geral no endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para gerar flashcards
app.post('/api/generate-flashcards', async (req, res) => {
  try {
    console.log('📨 Requisição recebida:', req.body);
    const { theme, numberOfCards } = req.body;
    const ANTHROPIC_API_KEY = process.env.VITE_ANTHROPIC_API_KEY;

    console.log(`🔍 Gerando ${numberOfCards} flashcards sobre: ${theme}`);
    console.log(`🔑 API Key configurada: ${ANTHROPIC_API_KEY ? 'Sim' : 'Não'}`);

    if (!ANTHROPIC_API_KEY) {
      console.error('❌ API Key não configurada');
      return res.status(500).json({ error: 'API Key não configurada' });
    }

  const prompt = `Você é um especialista em educação. Gere exatamente ${numberOfCards} flashcards sobre o tema: "${theme}".

IMPORTANTE:
- Cada flashcard deve ter uma pergunta específica e uma resposta completa e CORRETA
- As respostas devem ser factualmente precisas e educativas
- Varie os tipos de perguntas
- Use linguagem clara para estudantes brasileiros

Retorne APENAS um array JSON:
[{"question": "...", "answer": "..."}]`;

  try {
    console.log('🚀 Chamando API da Anthropic...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    console.log(`📡 Resposta da API: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Dados recebidos da Claude API');
    
    const content = data.content[0].text.trim();
    console.log('📝 Conteúdo recebido:', content.substring(0, 200) + '...');
    
    // Limpa o conteúdo para extrair apenas o JSON
    let jsonContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^[^{]*/, '') // Remove texto antes do primeiro {
      .replace(/[^}]*$/, '') // Remove texto depois do último }
      .trim();
    
    // Se ainda não começar com [, tenta encontrar o array
    if (!jsonContent.startsWith('[')) {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonContent = arrayMatch[0];
      }
    }
    
    console.log('🔍 JSON extraído:', jsonContent.substring(0, 100) + '...');
    
    const flashcards = JSON.parse(jsonContent);

    console.log(`🎉 ${flashcards.length} flashcards gerados com sucesso!`);
    res.json({ flashcards });
  } catch (error) {
    console.error('❌ Erro no servidor:', error);
    res.status(500).json({ error: error.message });
  }
  } catch (error) {
    console.error('❌ Erro geral no endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para gerar quiz
app.post('/api/generate-quiz', async (req, res) => {
  try {
    console.log('📨 Requisição de quiz recebida:', req.body);
    const { topic, numberOfQuestions = 10 } = req.body;
    const ANTHROPIC_API_KEY = process.env.VITE_ANTHROPIC_API_KEY;

    console.log(`🔍 Gerando quiz de ${numberOfQuestions} questões sobre: ${topic}`);
    console.log(`🔑 API Key configurada: ${ANTHROPIC_API_KEY ? 'Sim' : 'Não'}`);

    if (!ANTHROPIC_API_KEY) {
      console.error('❌ API Key não configurada');
      return res.status(500).json({ error: 'API Key não configurada' });
    }

    const prompt = `Crie ${numberOfQuestions} questões de múltipla escolha sobre o tópico "${topic}".

INSTRUÇÕES:
- Crie exatamente ${numberOfQuestions} questões
- Cada questão deve ter 4 alternativas (A, B, C, D)
- Uma alternativa deve ser a resposta correta
- As questões devem ser claras e específicas sobre "${topic}"
- Use linguagem adequada para estudantes brasileiros
- Varie o nível de dificuldade das questões
- Inclua uma explicação educativa para cada questão

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

    try {
      console.log('🚀 Chamando API da Anthropic para quiz...');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      console.log(`📡 Resposta da API: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro da API:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dados recebidos da Claude API');
      
      const content = data.content[0].text.trim();
      console.log('📝 Conteúdo recebido:', content.substring(0, 200) + '...');
      
      // Limpa o conteúdo para extrair apenas o JSON
      let jsonContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*/, '') // Remove texto antes do primeiro {
        .replace(/[^}]*$/, '') // Remove texto depois do último }
        .trim();
      
      // Se ainda não começar com {, tenta encontrar o objeto
      if (!jsonContent.startsWith('{')) {
        const objectMatch = content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          jsonContent = objectMatch[0];
        }
      }
      
      console.log('🔍 JSON extraído:', jsonContent.substring(0, 100) + '...');
      
      // Tentar corrigir JSON malformado
      let quiz;
      
      try {
        // Primeira tentativa: parse direto
        quiz = JSON.parse(jsonContent);
        console.log('✅ JSON parseado com sucesso na primeira tentativa');
      } catch (firstError) {
        console.log('⚠️ Primeira tentativa falhou, tentando corrigir JSON...');
        
        try {
          // Segunda tentativa: corrigir JSON malformado
          let fixedJson = jsonContent;
          
          // Corrigir vírgulas faltantes em arrays
          fixedJson = fixedJson.replace(/(\w+)\s*\n\s*(\w+)/g, '$1,\n$2');
          
          // Corrigir vírgulas faltantes em objetos
          fixedJson = fixedJson.replace(/(\w+)\s*\n\s*"(\w+)":/g, '$1,\n"$2":');
          
          // Corrigir vírgulas antes de fechamento de array
          fixedJson = fixedJson.replace(/(\w+)\s*\n\s*\]/g, '$1\n]');
          
          // Corrigir vírgulas antes de fechamento de objeto
          fixedJson = fixedJson.replace(/(\w+)\s*\n\s*\}/g, '$1\n}');
          
          console.log('🔧 JSON corrigido:', fixedJson.substring(0, 200) + '...');
          
          quiz = JSON.parse(fixedJson);
          console.log('✅ JSON parseado com sucesso após correção');
        } catch (secondError) {
          console.log('❌ Segunda tentativa falhou, criando estrutura básica...');
          
          // Terceira tentativa: criar estrutura básica
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
          
          console.log('✅ Estrutura básica criada como fallback');
        }
      }
      
      // Valida se tem a estrutura básica
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
      res.json(quiz);
    } catch (error) {
      console.error('❌ Erro no servidor:', error);
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error('❌ Erro geral no endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/generate-flashcards`);
});
