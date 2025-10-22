import useStore from '../store/useStore';

export async function generateFlashcardsWithAI(theme, numberOfCards) {
  const { getCachedResponse, setCachedResponse } = useStore.getState();
  
  // Verifica se já existe no cache
  const cacheKey = `${theme.toLowerCase()}_${numberOfCards}`;
  const cachedResponse = getCachedResponse(theme, numberOfCards);
  
  if (cachedResponse) {
    console.log('🎯 Usando resposta do cache para:', theme);
    return cachedResponse.flashcards;
  }

  console.log('🚀 Chamando servidor local (não encontrado no cache)...');
  
  try {
    const response = await fetch('http://localhost:3001/api/generate-flashcards', {
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
    console.log('🎉 Flashcards gerados com Claude AI via servidor local!');
    
    // Salva no cache
    setCachedResponse(theme, numberOfCards, data.flashcards);
    console.log('💾 Resposta salva no cache!');
    
    return data.flashcards;
  } catch (error) {
    console.error('Erro na geração de flashcards:', error);
    throw new Error(`Erro ao gerar flashcards: ${error.message}`);
  }
}