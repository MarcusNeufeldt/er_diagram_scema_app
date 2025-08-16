const AIService = require('./ai-service');
require('dotenv').config();

async function testSchemaGeneration() {
  const aiService = new AIService();
  
  console.log('🔧 Testing Direct Schema Generation');
  console.log('Model:', process.env.DEFAULT_AI_MODEL);
  
  try {
    const schema = await aiService.generateSchema("simple blog with users and posts", null);
    console.log('✅ Schema generated successfully!');
    console.log(JSON.stringify(schema, null, 2));
  } catch (error) {
    console.error('❌ Schema generation failed:', error.message);
    console.error('Full error:', error);
  }
}

testSchemaGeneration();