const AIService = require('./ai-service');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Debug endpoint called');
    console.log('🌐 Environment check:');
    console.log('- OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY);
    console.log('- OPENROUTER_BASE_URL:', process.env.OPENROUTER_BASE_URL);
    console.log('- DEFAULT_AI_MODEL:', process.env.DEFAULT_AI_MODEL);
    
    const aiService = new AIService();
    
    res.json({
      success: true,
      config: {
        hasApiKey: !!process.env.OPENROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL,
        defaultModel: process.env.DEFAULT_AI_MODEL,
        enableReasoning: process.env.ENABLE_REASONING,
        reasoningEffort: process.env.REASONING_EFFORT
      }
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      details: error.message 
    });
  }
};