const AIService = require('./ai-service');

const aiService = new AIService();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, currentSchema, conversationHistory } = req.body;
    console.log('💬 Processing chat message:', message);
    console.log('📊 Current schema exists:', !!currentSchema);
    
    const response = await aiService.chatAboutSchema(message, currentSchema, conversationHistory || []);
    console.log('✅ Chat response generated');
    console.log('🔍 Response type:', response.type);
    console.log('📋 Full response:', JSON.stringify(response, null, 2));
    
    // Handle different response types from AIService
    if (response.type === 'message') {
      console.log('📝 Returning direct message response');
      // Direct text response
      res.json({ content: response.content });
    } else if (response.type === 'tool_call') {
      console.log('🔧 Processing tool call:', response.tool_call.function.name);
      // Tool call response - execute the tool and return result
      const toolCall = response.tool_call;
      
      if (toolCall.function.name === 'analyze_current_schema') {
        console.log('🔍 Executing schema analysis');
        // Execute schema analysis
        const analysis = await aiService.analyzeSchema(currentSchema);
        console.log('📊 Analysis result length:', analysis?.length || 0);
        res.json({ content: analysis });
      } else if (toolCall.function.name === 'generate_database_schema') {
        console.log('🏗️ Executing schema generation');
        // Execute schema generation
        const args = JSON.parse(toolCall.function.arguments);
        console.log('⚙️ Generation args:', args);
        const schema = await aiService.generateSchema(args.description);
        console.log('✅ Generated schema tables count:', schema?.tables?.length || 0);
        res.json({ schema, content: 'I\'ve generated a new database schema for you.' });
      } else if (toolCall.function.name === 'modify_existing_schema') {
        console.log('🔄 Executing schema modification');
        // Execute schema modification
        const args = JSON.parse(toolCall.function.arguments);
        console.log('⚙️ Modification args:', args);
        const modifiedSchema = await aiService.generateSchema(args.description, currentSchema);
        console.log('✅ Modified schema tables count:', modifiedSchema?.tables?.length || 0);
        res.json({ schema: modifiedSchema, content: 'I\'ve modified your database schema.' });
      } else {
        console.log('❓ Unknown tool call, using fallback');
        // Fallback for unknown tool calls
        res.json({ content: response.message || 'I understand your request, but I need more information to proceed.' });
      }
    } else {
      console.log('❓ Unexpected response type, using fallback');
      console.log('🔍 Response content:', response.content);
      console.log('🔍 Response message:', response.message);
      // Fallback for unexpected response types
      res.json({ content: response.content || response.message || 'I received your message.' });
    }
  } catch (error) {
    console.error('❌ Chat failed:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
};