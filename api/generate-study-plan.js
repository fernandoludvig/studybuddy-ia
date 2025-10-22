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
    const { subjects, subSubjects, examDate, hoursPerDay, difficulty, goal } = req.body;

    if (!subjects || !examDate || !hoursPerDay) {
      return res.status(400).json({ error: 'Campos obrigatórios: subjects, examDate, hoursPerDay' });
    }

    // Calcular semanas até o exame
    const examDateObj = new Date(examDate);
    const today = new Date();
    const daysUntilExam = Math.ceil((examDateObj - today) / (1000 * 60 * 60 * 24));
    const weeks = Math.max(1, Math.ceil(daysUntilExam / 7));

    // Gerar prompt para a IA
    const prompt = `Você é um especialista em educação e planejamento de estudos. Crie um plano de estudos detalhado e personalizado.

INFORMAÇÕES DO ESTUDANTE:
- Matérias: ${subjects}
${subSubjects ? `- Sub-matérias/Tópicos específicos: ${subSubjects}` : ''}
- Data do exame: ${examDate}
- Horas por dia: ${hoursPerDay}
- Dificuldade: ${difficulty}
- Objetivo: ${goal}
- Semanas disponíveis: ${weeks}

CRIE UM PLANO COM:
- Título motivacional e personalizado
- Visão geral do plano
- Cronograma semanal (${weeks} semanas)
- Distribuição equilibrada das matérias
- Tópicos específicos para estudar (use as sub-matérias quando fornecidas)
- Dicas personalizadas baseadas no objetivo
- Estrutura de revisão
- Estratégias de estudo adaptadas à dificuldade

IMPORTANTE SOBRE SUB-MATÉRIAS:
${subSubjects ? `- Use as sub-matérias fornecidas para criar tópicos mais específicos e detalhados
- Organize o cronograma considerando a progressão lógica das sub-matérias
- Inclua revisões e conexões entre as sub-matérias relacionadas` : '- Foque nos tópicos gerais das matérias principais'}

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título do Plano",
  "overview": "Descrição geral",
  "schedule": [
    {
      "week": 1,
      "focus": "Foco da semana",
      "days": [
        {
          "day": "Segunda-feira",
          "subjects": ["Matéria"],
          "topics": ["Tópico 1", "Tópico 2"],
          "duration": "2h",
          "completed": false
        }
      ]
    }
  ],
  "tips": [
    "Dica 1",
    "Dica 2",
    "Dica 3"
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
        model: 'claude-3-5-sonnet-20240620',
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
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta da IA não contém JSON válido');
    }

    let jsonContent = jsonMatch[0];
    let studyPlan;

    try {
      studyPlan = JSON.parse(jsonContent);
    } catch (firstError) {
      try {
        // Tentar corrigir JSON malformado
        let fixedJson = jsonContent;
        
        // Corrigir vírgulas ausentes
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*(\w+)/g, '$1,\n$2');
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*"(\w+)":/g, '$1,\n"$2":');
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*\]/g, '$1\n]');
        fixedJson = fixedJson.replace(/(\w+)\s*\n\s*\}/g, '$1\n}');
        
        studyPlan = JSON.parse(fixedJson);
      } catch (secondError) {
        // Fallback: criar estrutura básica
        studyPlan = {
          title: `Plano de Estudos - ${subjects}`,
          overview: `Plano personalizado para ${subjects} com foco em ${goal}`,
          schedule: Array.from({ length: weeks }, (_, i) => ({
            week: i + 1,
            focus: `Semana ${i + 1}`,
            days: Array.from({ length: 7 }, (_, j) => ({
              day: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][j],
              subjects: [subjects],
              topics: [`Tópico ${j + 1}`],
              duration: `${hoursPerDay}h`,
              completed: false
            }))
          })),
          tips: [
            'Mantenha uma rotina consistente de estudos',
            'Faça pausas regulares para descansar',
            'Revise o conteúdo regularmente'
          ]
        };
      }
    }

    res.status(200).json(studyPlan);

  } catch (error) {
    console.error('❌ Erro na geração do plano:', error);
    res.status(500).json({ error: error.message });
  }
}
