const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const AIService = require('./ai-service');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Initialize AI service
const aiService = new AIService();

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes for diagram management (without database for MVP)
let diagrams = new Map(); // In-memory storage for MVP

app.get('/api/diagrams', (req, res) => {
  const diagramList = Array.from(diagrams.entries()).map(([id, diagram]) => ({
    id,
    name: diagram.name,
    createdAt: diagram.createdAt,
    updatedAt: diagram.updatedAt
  }));
  res.json(diagramList);
});

app.get('/api/diagrams/:id', (req, res) => {
  const diagram = diagrams.get(req.params.id);
  if (!diagram) {
    return res.status(404).json({ error: 'Diagram not found' });
  }
  res.json(diagram);
});

app.post('/api/diagrams', (req, res) => {
  const { name } = req.body;
  const id = `diagram-${Date.now()}`;
  const diagram = {
    id,
    name: name || 'Untitled Diagram',
    nodes: [],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  diagrams.set(id, diagram);
  res.json(diagram);
});

app.put('/api/diagrams/:id', (req, res) => {
  const diagram = diagrams.get(req.params.id);
  if (!diagram) {
    return res.status(404).json({ error: 'Diagram not found' });
  }
  
  const updatedDiagram = {
    ...diagram,
    ...req.body,
    id: req.params.id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString()
  };
  
  diagrams.set(req.params.id, updatedDiagram);
  res.json(updatedDiagram);
});

// AI Integration endpoints
app.post('/api/ai/generate-schema', async (req, res) => {
  try {
    const { prompt, existingSchema } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const schema = await aiService.generateSchema(prompt, existingSchema);
    res.json({ schema });
  } catch (error) {
    console.error('Schema generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, currentSchema, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await aiService.chatAboutSchema(message, currentSchema, conversationHistory);
    res.json({ response });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/analyze-schema', async (req, res) => {
  try {
    const { schema } = req.body;
    
    if (!schema) {
      return res.status(400).json({ error: 'Schema is required' });
    }

    const analysis = await aiService.analyzeSchema(schema);
    res.json({ analysis });
  } catch (error) {
    console.error('Schema analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Global rooms map
const rooms = new Map();

// WebSocket server for Yjs collaboration
const wss = new WebSocketServer({ 
  server,
  path: '/collaboration'
});

// Simple WebSocket setup for Yjs
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  // Extract room name from URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomName = url.searchParams.get('room') || 'default';
  
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  
  const room = rooms.get(roomName);
  room.add(ws);
  
  console.log(`Client joined room: ${roomName} (${room.size} clients)`);
  
  ws.on('message', (message) => {
    // Broadcast message to all clients in the same room except sender
    room.forEach(client => {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  });
  
  ws.on('close', () => {
    room.delete(ws);
    console.log(`Client left room: ${roomName} (${room.size} clients remaining)`);
    if (room.size === 0) {
      rooms.delete(roomName);
      console.log(`Room ${roomName} deleted - no clients remaining`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/collaboration`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
