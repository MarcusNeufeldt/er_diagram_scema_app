const { createClient } = require('@libsql/client');
const AIService = require('./ai-service');

function createDbClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

function generateId() {
  return 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

module.exports = async (req, res) => {
  const { id: diagramId } = req.query;
  
  if (!diagramId) {
    return res.status(400).json({ error: 'Diagram ID is required as query parameter' });
  }
  
  const client = createDbClient();
  
  try {
    if (req.method === 'GET') {
      console.log(`📜 Fetching chat history for diagram: ${diagramId}`);
      
      // Fetch the chat history for the diagram
      const result = await client.execute({
        sql: 'SELECT id, role, content, createdAt FROM ChatMessage WHERE diagramId = ? ORDER BY createdAt ASC',
        args: [diagramId]
      });
      
      const messages = result.rows.map(row => ({
        id: row.id,
        role: row.role,
        content: row.content,
        createdAt: row.createdAt,
        timestamp: new Date(row.createdAt) // For frontend compatibility
      }));
      
      console.log(`✅ Found ${messages.length} chat messages`);
      return res.status(200).json(messages);
      
    } else if (req.method === 'DELETE') {
      console.log(`🗑️ Clearing chat history for diagram: ${diagramId}`);
      
      // Delete all chat messages for this diagram
      const result = await client.execute({
        sql: 'DELETE FROM ChatMessage WHERE diagramId = ?',
        args: [diagramId]
      });
      
      console.log(`✅ Deleted ${result.rowsAffected || 0} chat messages`);
      return res.status(200).json({ 
        success: true, 
        message: `Chat history cleared for diagram ${diagramId}`,
        deletedCount: result.rowsAffected || 0
      });
      
    } else if (req.method === 'POST') {
      const { message, currentSchema } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      console.log(`💬 Processing new chat message for diagram: ${diagramId}`);
      console.log(`📝 Message: ${message.substring(0, 100)}...`);
      
      const now = new Date().toISOString();
      const userMessageId = generateId();
      
      // 1. Save the user's message
      await client.execute({
        sql: 'INSERT INTO ChatMessage (id, diagramId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)',
        args: [userMessageId, diagramId, 'user', message, now]
      });
      
      console.log('💾 User message saved to database');
      
      // 2. Fetch the recent conversation history for context (last 15 messages)
      const historyResult = await client.execute({
        sql: 'SELECT role, content FROM ChatMessage WHERE diagramId = ? ORDER BY createdAt DESC LIMIT 15',
        args: [diagramId]
      });
      
      // Reverse to get chronological order for AI context
      const conversationHistory = historyResult.rows.reverse().map(row => ({
        role: row.role,
        content: row.content
      }));
      
      console.log(`📚 Retrieved ${conversationHistory.length} messages for context`);
      
      // 3. Call the AI service with full context
      const aiService = new AIService();
      const aiResponse = await aiService.chatAboutSchema(message, currentSchema, conversationHistory);
      
      console.log('🤖 AI response received');
      console.log('🔍 Response type:', aiResponse.type);
      
      // 4. Handle AI response and execute tools if needed
      let finalResponse = aiResponse;
      let responseContent = null;
      
      if (aiResponse.type === 'message') {
        // Direct text response
        responseContent = aiResponse.content;
        finalResponse = { content: responseContent };
      } else if (aiResponse.type === 'tool_call') {
        console.log('🔧 Processing tool call:', aiResponse.tool_call.function.name);
        // Tool call response - execute the tool and return result
        const toolCall = aiResponse.tool_call;
        
        if (toolCall.function.name === 'analyze_current_schema') {
          console.log('🔍 Executing schema analysis');
          // Execute schema analysis
          const analysis = await aiService.analyzeSchema(currentSchema);
          console.log('📊 Analysis result length:', analysis?.length || 0);
          responseContent = analysis;
          finalResponse = { content: analysis };
        } else if (toolCall.function.name === 'generate_database_schema') {
          console.log('🏗️ Executing schema generation');
          // Execute schema generation
          const args = JSON.parse(toolCall.function.arguments);
          console.log('⚙️ Generation args:', args);
          const schema = await aiService.generateSchema(args.description);
          console.log('✅ Generated schema tables count:', schema?.tables?.length || 0);
          responseContent = 'I\'ve generated a new database schema for you.';
          finalResponse = { schema, content: responseContent };
        } else if (toolCall.function.name === 'modify_existing_schema') {
          console.log('🔄 Executing schema modification');
          // Execute schema modification
          const args = JSON.parse(toolCall.function.arguments);
          console.log('⚙️ Modification args:', args);
          const modifiedSchema = await aiService.generateSchema(`${args.modification_type}: ${args.description}`, currentSchema);
          console.log('✅ Modified schema tables count:', modifiedSchema?.tables?.length || 0);
          responseContent = `I've modified your schema. Changes: ${args.description}`;
          finalResponse = { schema: modifiedSchema, content: responseContent };
        } else {
          // Unknown tool call
          responseContent = `Tool execution not implemented: ${toolCall.function.name}`;
          finalResponse = { content: responseContent };
        }
      }
      
      // 5. Save the final response content to the database
      if (responseContent) {
        const assistantMessageId = generateId();
        await client.execute({
          sql: 'INSERT INTO ChatMessage (id, diagramId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)',
          args: [assistantMessageId, diagramId, 'assistant', responseContent, new Date().toISOString()]
        });
        
        console.log('💾 AI response saved to database');
      }
      
      console.log('✅ Chat processing complete');
      return res.status(200).json(finalResponse);
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error(`❌ Chat API Error for diagram ${diagramId}:`, error);
    res.status(500).json({ error: 'Failed to process chat message', details: error.message });
  } finally {
    client.close();
  }
};