export async function generateFlashcardsWithAI(theme, numberOfCards) {
  console.log('🚀 Gerando flashcards com IA para:', theme);
  
  try {
    // Detectar se está em produção ou desenvolvimento
    const isProduction = window.location.hostname !== 'localhost';
    const apiUrl = isProduction 
      ? '/api/generate-flashcards'  // Usar URL relativa em produção
      : 'http://localhost:3001/api/generate-flashcards';  // URL completa em desenvolvimento
    
    console.log('🔗 URL da API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme: theme,
        numberOfCards: numberOfCards,
      }),
    });

    console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ${response.status}: ${errorData.error}`);
    }

    const data = await response.json();
    console.log('🎉 Flashcards gerados com Claude AI!');
    
    return data.flashcards;
  } catch (error) {
    console.error('Erro na geração de flashcards:', error);
    throw new Error(`Erro ao gerar flashcards: ${error.message}`);
  }
}