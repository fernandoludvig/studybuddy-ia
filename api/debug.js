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

    // Teste simples com modelo mais básico
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi'
          }
        ]
      })
    });

    const responseText = await response.text();
    
    res.status(200).json({ 
      success: true,
      status: response.status,
      statusText: response.statusText,
      hasKey: true,
      keyPrefix: apiKey.substring(0, 10) + '...',
      response: responseText
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    res.status(500).json({ 
      error: error.message,
      hasKey: !!process.env.ANTHROPIC_API_KEY
    });
  }
}
