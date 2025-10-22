export async function generateStudyPlan(formData) {
  try {
    // Detectar se está em produção ou desenvolvimento
    const isProduction = window.location.hostname !== 'localhost';
    const apiUrl = isProduction 
      ? '/api/generate-study-plan'  // Usar URL relativa em produção
      : 'http://localhost:3001/api/generate-study-plan';  // URL completa em desenvolvimento
    
    console.log('🚀 Enviando requisição para:', apiUrl);
    console.log('📦 Dados enviados:', formData);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    console.log('📡 Resposta recebida:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      throw new Error(`Erro do servidor: ${response.status} - ${errorText}`);
    }

    const studyPlan = await response.json();
    console.log('✅ Plano recebido:', studyPlan);
    
    // Valida se tem a estrutura básica
    if (!studyPlan.title || !studyPlan.schedule || !Array.isArray(studyPlan.schedule)) {
      throw new Error('Estrutura do plano inválida');
    }
    
    return studyPlan;
  } catch (error) {
    console.error('Erro na geração do plano:', error);
    throw error;
  }
}