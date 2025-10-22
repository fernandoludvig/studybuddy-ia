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
    // Verificar se a chave está configurada
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'ANTHROPIC_API_KEY não configurada',
        message: 'Configure a variável de ambiente ANTHROPIC_API_KEY no Vercel'
      });
    }

    // Testar a API da Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Teste de conexão. Responda apenas "OK".'
          }
        ]
      })
    });

    if (!response.ok) {
      return res.status(500).json({ 
        error: `Anthropic API error: ${response.status}`,
        message: 'Verifique se a chave da API está correta'
      });
    }

    const data = await response.json();
    
    res.status(200).json({ 
      success: true,
      message: 'API funcionando corretamente!',
      response: data.content[0].text
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Erro ao testar a API'
    });
  }
}
