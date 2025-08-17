const AIService = require('./ai-service');

const aiService = new AIService();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, currentSchema, conversationHistory } = req.body;
    console.log('💬 Processing chat message');
    
    const response = await aiService.chatAboutSchema(message, currentSchema, conversationHistory || []);
    console.log('✅ Chat response generated');
    
    // Handle different response types from AIService
    if (response.type === 'message') {
      // Direct text response
      res.json({ content: response.content });
    } else if (response.type === 'tool_call') {
      // Tool call response - execute the tool and return result
      const toolCall = response.tool_call;
      
      if (toolCall.function.name === 'analyze_current_schema') {
        // Execute schema analysis
        const analysis = await aiService.analyzeSchema(currentSchema);
        res.json({ content: analysis });
      } else if (toolCall.function.name === 'generate_database_schema') {
        // Execute schema generation
        const args = JSON.parse(toolCall.function.arguments);
        const schema = await aiService.generateSchema(args.description);
        res.json({ schema, content: 'I\'ve generated a new database schema for you.' });
      } else if (toolCall.function.name === 'modify_existing_schema') {
        // Execute schema modification
        const args = JSON.parse(toolCall.function.arguments);
        const modifiedSchema = await aiService.generateSchema(args.description, currentSchema);
        res.json({ schema: modifiedSchema, content: 'I\'ve modified your database schema.' });
      } else {
        // Fallback for unknown tool calls
        res.json({ content: response.message || 'I understand your request, but I need more information to proceed.' });
      }
    } else {
      // Fallback for unexpected response types
      res.json({ content: response.content || response.message || 'I received your message.' });
    }
  } catch (error) {
    console.error('❌ Chat failed:', error.message);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
};