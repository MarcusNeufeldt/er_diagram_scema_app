const { createClient } = require('@libsql/client');
const AIService = require('../../ai-service');

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
      
      // 4. Save the AI's response(s) if it's a direct message
      if (aiResponse.type === 'message' && aiResponse.content) {
        const assistantMessageId = generateId();
        await client.execute({
          sql: 'INSERT INTO ChatMessage (id, diagramId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)',
          args: [assistantMessageId, diagramId, 'assistant', aiResponse.content, new Date().toISOString()]
        });
        
        console.log('💾 AI response saved to database');
      }
      
      // For tool calls, we save the result message if it has content
      if (aiResponse.type === 'tool_call' && aiResponse.message) {
        const assistantMessageId = generateId();
        await client.execute({
          sql: 'INSERT INTO ChatMessage (id, diagramId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)',
          args: [assistantMessageId, diagramId, 'assistant', aiResponse.message, new Date().toISOString()]
        });
        
        console.log('💾 AI tool call message saved to database');
      }
      
      console.log('✅ Chat processing complete');
      return res.status(200).json(aiResponse);
      
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