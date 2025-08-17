const AIService = require('./ai-service');

const aiService = new AIService();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = req.body;
    console.log('💬 Processing chat message');
    
    const response = await aiService.chat(message, context);
    console.log('✅ Chat response generated');
    
    res.json({ response });
  } catch (error) {
    console.error('❌ Chat failed:', error.message);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
};