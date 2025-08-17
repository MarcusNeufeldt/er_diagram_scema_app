const AIService = require('./ai-service');
const aiService = new AIService();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { schema } = req.body;
    if (!schema || !schema.tables || schema.tables.length === 0) {
      return res.status(400).json({ error: 'Schema is required and must not be empty.' });
    }

    console.log('🔬 Analyzing schema...');
    const analysis = await aiService.analyzeSchema(schema);
    console.log('✅ Analysis complete.');
    
    // The key here is sending the analysis back in a JSON object with the 'content' key
    res.json({ content: analysis });

  } catch (error) {
    console.error('❌ Schema analysis failed:', error.message);
    res.status(500).json({ error: 'Failed to analyze schema', details: error.message });
  }
};