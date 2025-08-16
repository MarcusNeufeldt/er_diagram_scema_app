const AIService = require('../server/ai-service');

const aiService = new AIService();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentSchema, modification } = req.body;
    console.log('🔄 Modifying schema:', modification);
    
    const modifiedSchema = await aiService.modifySchema(currentSchema, modification);
    console.log('✅ Schema modified successfully');
    
    res.json(modifiedSchema);
  } catch (error) {
    console.error('❌ Schema modification failed:', error.message);
    res.status(500).json({ 
      error: 'Failed to modify schema',
      details: error.message 
    });
  }
};