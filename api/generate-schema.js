const AIService = require('./ai-service');

const aiService = new AIService();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, existingSchema } = req.body;
    console.log('🎯 Generating schema for:', prompt);
    console.log('📊 Has existing schema:', !!existingSchema);
    
    const schema = await aiService.generateSchema(prompt, existingSchema);
    console.log('✅ Schema generated successfully');
    
    res.json({ schema });
  } catch (error) {
    console.error('❌ Schema generation failed:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate schema',
      details: error.message 
    });
  }
};