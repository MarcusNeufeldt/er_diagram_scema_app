const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import existing AI service from server directory
const AIService = require('./server/ai-service');
// Import new API routes
const apiRouter = require('./api/index');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/api', apiRouter);

// Existing AI endpoints (migrated from server/server.js)
const aiService = new AIService();

app.post('/generate-schema', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('🎯 Generating schema for:', prompt);
    
    const schema = await aiService.generateSchema(prompt);
    console.log('✅ Schema generated successfully');
    
    res.json(schema);
  } catch (error) {
    console.error('❌ Schema generation failed:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate schema',
      details: error.message 
    });
  }
});

app.post('/chat', async (req, res) => {
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
});

app.post('/modify-schema', async (req, res) => {
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
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      ai: 'ready',
      database: 'ready'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log('🚀 Persistence server running on port', port);
  console.log('🤖 AI Service ready');
  console.log('🔒 Diagram locking system ready');
  console.log('📚 Database persistence ready');
});

module.exports = app;