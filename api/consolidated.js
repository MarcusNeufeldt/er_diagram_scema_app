// Import required modules without Express routers
const { createClient } = require('@libsql/client');
const AIService = require('./_lib/ai-service');

function createDbClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

function generateId() {
  return 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Non-destructive schema modification function
function computeFinalSchemaState(currentSchema, newSchema) {
  console.log('🔄 Computing final schema state non-destructively');
  console.log('📊 Current schema tables:', currentSchema?.tables?.length || 0);
  console.log('📊 New schema tables:', newSchema?.tables?.length || 0);
  
  if (!currentSchema || !currentSchema.tables) {
    console.log('📋 No current schema - returning new schema as-is');
    return newSchema;
  }
  
  if (!newSchema || !newSchema.tables) {
    console.log('📋 No new schema - returning current schema as-is');
    return currentSchema;
  }
  
  // Create lookup maps for efficient comparison
  const currentTables = new Map(currentSchema.tables.map(t => [t.name, t]));
  const newTables = new Map(newSchema.tables.map(t => [t.name, t]));
  
  const finalTables = [];
  
  // Process all tables from new schema
  newSchema.tables.forEach(newTable => {
    const currentTable = currentTables.get(newTable.name);
    
    if (currentTable) {
      // Table exists - merge columns while preserving existing column properties
      console.log(`🔧 Merging table: ${newTable.name}`);
      
      const existingColumns = new Map(currentTable.columns.map(col => [col.name, col]));
      const finalColumns = newTable.columns.map(newCol => {
        const existingCol = existingColumns.get(newCol.name);
        
        if (existingCol) {
          // Preserve existing column but update properties from new schema
          console.log(`  ↻ Updating column: ${newCol.name}`);
          return {
            ...existingCol, // Keep existing properties like id, references, etc.
            type: newCol.type,
            isPrimaryKey: newCol.isPrimaryKey,
            isNullable: newCol.isNullable,
            defaultValue: newCol.defaultValue,
            description: newCol.description
          };
        } else {
          // New column
          console.log(`  + Adding column: ${newCol.name}`);
          return {
            id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...newCol,
            isForeignKey: false,
            references: undefined
          };
        }
      });
      
      finalTables.push({
        ...currentTable, // Preserve existing table properties
        ...newTable, // Update with new table properties
        columns: finalColumns
      });
    } else {
      // New table
      console.log(`+ Adding new table: ${newTable.name}`);
      finalTables.push({
        ...newTable,
        columns: newTable.columns.map(col => ({
          id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...col,
          isForeignKey: false,
          references: undefined
        }))
      });
    }
  });
  
  // Handle relationships - preserve existing ones that are still valid
  const currentRelationshipKeys = new Set(
    (currentSchema.relationships || []).map(rel => 
      `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
    )
  );
  
  const newRelationshipKeys = new Set(
    (newSchema.relationships || []).map(rel => 
      `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
    )
  );
  
  const finalRelationships = [];
  
  // Preserve existing relationships that are still present in new schema
  (currentSchema.relationships || []).forEach(rel => {
    const key = `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`;
    if (newRelationshipKeys.has(key)) {
      console.log(`↻ Preserving relationship: ${key}`);
      finalRelationships.push(rel);
    } else {
      console.log(`- Removing relationship: ${key}`);
    }
  });
  
  // Add new relationships
  (newSchema.relationships || []).forEach(rel => {
    const key = `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`;
    if (!currentRelationshipKeys.has(key)) {
      console.log(`+ Adding new relationship: ${key}`);
      finalRelationships.push(rel);
    }
  });
  
  const finalSchema = {
    tables: finalTables,
    relationships: finalRelationships
  };
  
  console.log('✅ Final schema computed:', {
    tables: finalSchema.tables.length,
    relationships: finalSchema.relationships.length
  });
  
  return finalSchema;
}

// Main function that handles all API routes
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const url = req.url || '';
  const method = req.method;
  
  console.log(`🔍 API Request: ${method} ${url}`);
  
  try {
    // Parse JSON body for POST/PUT requests
    let body = {};
    if (method === 'POST' || method === 'PUT') {
      if (req.body) {
        body = req.body;
      } else {
        // Parse body manually if not already parsed
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const rawBody = Buffer.concat(chunks).toString();
        if (rawBody) {
          body = JSON.parse(rawBody);
        }
      }
    }

    // Route: GET /health
    if (method === 'GET' && url.includes('/health')) {
      return res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        services: {
          ai: 'ready',
          database: 'ready'
        }
      });
    }
    
    // Route: GET /debug  
    if (method === 'GET' && url.includes('/debug')) {
      try {
        console.log('🔧 Debug endpoint called');
        const aiService = new AIService();
        
        return res.json({
          success: true,
          config: {
            hasApiKey: !!process.env.OPENROUTER_API_KEY,
            baseURL: process.env.OPENROUTER_BASE_URL,
            defaultModel: process.env.DEFAULT_AI_MODEL,
            enableReasoning: process.env.ENABLE_REASONING,
            reasoningEffort: process.env.REASONING_EFFORT
          }
        });
      } catch (error) {
        console.error('❌ Debug endpoint error:', error);
        return res.status(500).json({ 
          error: 'Debug failed',
          details: error.message 
        });
      }
    }
    
    // Route: POST /generate-schema
    if (method === 'POST' && url.includes('/generate-schema')) {
      try {
        const { prompt, existingSchema } = body;
        console.log('🎯 Generating schema for:', prompt);
        console.log('📊 Has existing schema:', !!existingSchema);
        
        const aiService = new AIService();
        const schema = await aiService.generateSchema(prompt, existingSchema);
        console.log('✅ Schema generated successfully');
        
        return res.json({ schema });
      } catch (error) {
        console.error('❌ Schema generation failed:', error.message);
        return res.status(500).json({ 
          error: 'Failed to generate schema',
          details: error.message 
        });
      }
    }
    
    // Route: POST /analyze-schema
    if (method === 'POST' && url.includes('/analyze-schema')) {
      try {
        const { schema } = body;
        if (!schema || !schema.tables || schema.tables.length === 0) {
          return res.status(400).json({ error: 'Schema is required and must not be empty.' });
        }

        console.log('🔬 Analyzing schema...');
        const aiService = new AIService();
        const analysis = await aiService.analyzeSchema(schema);
        console.log('✅ Analysis complete.');
        
        return res.json({ content: analysis });
      } catch (error) {
        console.error('❌ Schema analysis failed:', error.message);
        return res.status(500).json({ error: 'Failed to analyze schema', details: error.message });
      }
    }
    
    // Route: POST /chat
    if (method === 'POST' && url.includes('/chat')) {
      try {
        const { message, currentSchema, conversationHistory } = body;
        console.log('💬 Processing chat message:', message);
        console.log('📊 Current schema exists:', !!currentSchema);
        
        const aiService = new AIService();
        const response = await aiService.chatAboutSchema(message, currentSchema, conversationHistory || []);
        console.log('✅ Chat response generated');
        console.log('🔍 Response type:', response.type);
        
        // Handle different response types from AIService
        if (response.type === 'message') {
          console.log('📝 Returning direct message response');
          return res.json({ content: response.content });
        } else if (response.type === 'tool_call') {
          console.log('🔧 Processing tool call:', response.tool_call.function.name);
          const toolCall = response.tool_call;
          
          if (toolCall.function.name === 'analyze_current_schema') {
            console.log('🔍 Executing schema analysis');
            const analysis = await aiService.analyzeSchema(currentSchema);
            return res.json({ content: analysis });
          } else if (toolCall.function.name === 'generate_database_schema') {
            console.log('🏗️ Executing schema generation');
            const args = JSON.parse(toolCall.function.arguments);
            const schema = await aiService.generateSchema(args.description);
            return res.json({ schema, content: 'I\'ve generated a new database schema for you.' });
          } else if (toolCall.function.name === 'modify_existing_schema') {
            console.log('🔄 Executing schema modification (non-destructive)');
            const args = JSON.parse(toolCall.function.arguments);
            
            // Generate the AI's proposed schema
            const aiGeneratedSchema = await aiService.generateSchema(args.description, currentSchema);
            
            // Use non-destructive merging to preserve existing relationships and IDs
            const finalSchema = computeFinalSchemaState(currentSchema, aiGeneratedSchema);
            
            return res.json({ schema: finalSchema, content: 'I\'ve modified your database schema.' });
          } else {
            console.log('❓ Unknown tool call, using fallback');
            return res.json({ content: response.message || 'I understand your request, but I need more information to proceed.' });
          }
        } else {
          console.log('❓ Unexpected response type, using fallback');
          return res.json({ content: response.content || response.message || 'I received your message.' });
        }
      } catch (error) {
        console.error('❌ Chat failed:', error.message);
        return res.status(500).json({ 
          error: 'Failed to process chat message',
          details: error.message 
        });
      }
    }
    
    // Route: GET /diagrams - List all diagrams
    if (method === 'GET' && url.includes('/diagrams')) {
      const client = createDbClient();
      
      try {
        // List all diagrams with owner info
        const result = await client.execute(`
          SELECT 
            d.id, d.name, d.nodes, d.edges, d.createdAt, d.updatedAt,
            d.lockedByUserId, d.lockExpiresAt, d.ownerId,
            u.name as ownerName, u.email as ownerEmail
          FROM Diagram d
          JOIN User u ON d.ownerId = u.id
          ORDER BY d.updatedAt DESC
        `);
        
        const diagrams = result.rows.map(row => ({
          id: row.id,
          name: row.name,
          nodes: JSON.parse(row.nodes),
          edges: JSON.parse(row.edges),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          lockedByUserId: row.lockedByUserId,
          lockExpiresAt: row.lockExpiresAt,
          ownerId: row.ownerId,
          owner: {
            id: row.ownerId,
            name: row.ownerName,
            email: row.ownerEmail
          }
        }));
        
        return res.json(diagrams);
      } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      } finally {
        client.close();
      }
    }
    
    // Route: POST /diagrams - Create new diagram
    if (method === 'POST' && url.includes('/diagrams')) {
      const client = createDbClient();
      
      try {
        const { name, nodes, edges, ownerId, ownerName, ownerEmail } = body;
        
        if (!name || !ownerId) {
          return res.status(400).json({ error: 'Name and ownerId are required' });
        }
        
        // First, ensure the user exists (upsert)
        const userResult = await client.execute({
          sql: 'SELECT id FROM User WHERE id = ?',
          args: [ownerId]
        });
        
        if (userResult.rows.length === 0) {
          // Create the user if they don't exist
          const defaultEmail = ownerEmail || `${ownerId}@local.user`;
          await client.execute({
            sql: 'INSERT INTO User (id, name, email, createdAt) VALUES (?, ?, ?, ?)',
            args: [ownerId, ownerName || 'Anonymous User', defaultEmail, new Date().toISOString()]
          });
        }
        
        const diagramId = 'diagram-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const now = new Date().toISOString();
        
        await client.execute({
          sql: `INSERT INTO Diagram (id, name, nodes, edges, ownerId, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            diagramId, 
            name, 
            JSON.stringify(nodes || []), 
            JSON.stringify(edges || []), 
            ownerId, 
            now, 
            now
          ]
        });
        
        // Get the created diagram with owner info
        const result = await client.execute({
          sql: `SELECT 
                  d.id, d.name, d.nodes, d.edges, d.createdAt, d.updatedAt,
                  d.lockedByUserId, d.lockExpiresAt, d.ownerId,
                  u.name as ownerName, u.email as ownerEmail
                FROM Diagram d
                JOIN User u ON d.ownerId = u.id
                WHERE d.id = ?`,
          args: [diagramId]
        });
        
        const row = result.rows[0];
        const diagram = {
          id: row.id,
          name: row.name,
          nodes: JSON.parse(row.nodes),
          edges: JSON.parse(row.edges),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          lockedByUserId: row.lockedByUserId,
          lockExpiresAt: row.lockExpiresAt,
          ownerId: row.ownerId,
          owner: {
            id: row.ownerId,
            name: row.ownerName,
            email: row.ownerEmail
          }
        };
        
        return res.status(201).json(diagram);
      } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      } finally {
        client.close();
      }
    }
    
    // Route: GET /diagram?id=... - Get single diagram
    if (method === 'GET' && url.includes('/diagram') && !url.includes('/diagrams') && !url.includes('/diagram-')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const id = urlParams.get('id');
      const client = createDbClient();

      try {
        // Get diagram with owner info
        const result = await client.execute({
          sql: `SELECT 
                  d.id, d.name, d.nodes, d.edges, d.createdAt, d.updatedAt,
                  d.lockedByUserId, d.lockExpiresAt, d.ownerId,
                  u.name as ownerName, u.email as ownerEmail
                FROM Diagram d
                JOIN User u ON d.ownerId = u.id
                WHERE d.id = ?`,
          args: [id]
        });

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Diagram not found' });
        }

        const row = result.rows[0];

        // Check if lock is expired
        const now = new Date();
        const isLockExpired = row.lockExpiresAt && new Date(row.lockExpiresAt) < now;

        if (isLockExpired) {
          // Clear expired lock
          await client.execute({
            sql: 'UPDATE Diagram SET lockedByUserId = NULL, lockExpiresAt = NULL WHERE id = ?',
            args: [id]
          });
          row.lockedByUserId = null;
          row.lockExpiresAt = null;
        }

        const diagram = {
          id: row.id,
          name: row.name,
          nodes: JSON.parse(row.nodes),
          edges: JSON.parse(row.edges),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          lockedByUserId: row.lockedByUserId,
          lockExpiresAt: row.lockExpiresAt,
          owner: {
            id: row.ownerId,
            name: row.ownerName,
            email: row.ownerEmail
          }
        };

        return res.status(200).json(diagram);
      } catch (error) {
        console.error('Get diagram error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      } finally {
        client.close();
      }
    }
    
    // Route: PUT /diagram?id=... - Update diagram
    if (method === 'PUT' && url.includes('/diagram') && !url.includes('/diagrams') && !url.includes('/diagram-')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const id = urlParams.get('id');
      const { userId, name, nodes, edges } = body;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' });
      }

      const client = createDbClient();
      
      try {
        // Find the diagram and verify lock
        const diagramResult = await client.execute({
          sql: 'SELECT id, lockedByUserId, lockExpiresAt FROM Diagram WHERE id = ?',
          args: [id]
        });

        if (diagramResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Diagram not found' });
        }

        const diagram = diagramResult.rows[0];
        const now = new Date();
        const isLockExpired = !diagram.lockExpiresAt || new Date(diagram.lockExpiresAt) < now;

        // Verify user has valid lock
        if (diagram.lockedByUserId !== userId || isLockExpired) {
          return res.status(403).json({ 
            success: false, 
            message: 'Your editing session has expired. Please reload to get the latest version.' 
          });
        }

        // Update the diagram
        const params = [now.toISOString()];
        let sql = 'UPDATE Diagram SET updatedAt = ?';
        
        if (name) {
          sql += ', name = ?';
          params.push(name);
        }
        if (nodes) {
          sql += ', nodes = ?';
          params.push(JSON.stringify(nodes));
        }
        if (edges) {
          sql += ', edges = ?';
          params.push(JSON.stringify(edges));
        }
        
        sql += ' WHERE id = ?';
        params.push(id);

        await client.execute({
          sql,
          args: params
        });

        return res.status(200).json({
          success: true,
          message: 'Diagram updated successfully'
        });
      } catch (error) {
        console.error('Update diagram error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      } finally {
        client.close();
      }
    }
    
    // Route: DELETE /diagram?id=... - Delete diagram
    if (method === 'DELETE' && url.includes('/diagram') && !url.includes('/diagrams') && !url.includes('/diagram-')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const id = urlParams.get('id');
      const client = createDbClient();

      try {
        // Delete the diagram
        await client.execute({
          sql: 'DELETE FROM Diagram WHERE id = ?',
          args: [id]
        });

        return res.status(200).json({ success: true, message: 'Diagram deleted successfully' });
      } catch (error) {
        console.error('Delete diagram error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      } finally {
        client.close();
      }
    }
    
    // Route: POST /diagram-lock?id=...
    if (method === 'POST' && url.includes('/diagram-lock')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const id = urlParams.get('id');
      const { userId } = body;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' });
      }

      const client = createDbClient();
      
      try {
        // Find the diagram with current lock info
        const diagramResult = await client.execute({
          sql: `SELECT d.id, d.lockedByUserId, d.lockExpiresAt, u.name as lockedByUserName
                FROM Diagram d
                LEFT JOIN User u ON d.lockedByUserId = u.id
                WHERE d.id = ?`,
          args: [id]
        });

        if (diagramResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Diagram not found' });
        }

        const diagram = diagramResult.rows[0];
        const now = new Date();
        const lockExpiry = diagram.lockExpiresAt ? new Date(diagram.lockExpiresAt) : null;
        const isLockExpired = !lockExpiry || lockExpiry < now;

        // Case 1: No lock or expired lock - grant the lock
        if (!diagram.lockedByUserId || isLockExpired) {
          const newLockExpiry = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
          
          await client.execute({
            sql: 'UPDATE Diagram SET lockedByUserId = ?, lockExpiresAt = ? WHERE id = ?',
            args: [userId, newLockExpiry, id]
          });
          
          return res.status(200).json({ success: true, message: 'Lock acquired' });
        }

        // Case 2: Current user already has the lock - extend it (heartbeat)
        if (diagram.lockedByUserId === userId) {
          const newLockExpiry = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
          
          await client.execute({
            sql: 'UPDATE Diagram SET lockExpiresAt = ? WHERE id = ?',
            args: [newLockExpiry, id]
          });
          
          return res.status(200).json({ success: true, message: 'Lock extended' });
        }

        // Case 3: Someone else has the lock and it's not expired
        return res.status(409).json({ 
          success: false, 
          message: 'Diagram is locked by another user',
          lockedBy: diagram.lockedByUserName || 'Another user',
          lockExpiresAt: diagram.lockExpiresAt
        });
      } catch (error) {
        console.error('Lock diagram error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      } finally {
        client.close();
      }
    }
    
    // Route: POST /diagram-unlock?id=...
    if (method === 'POST' && url.includes('/diagram-unlock')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const id = urlParams.get('id');
      const { userId } = body;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' });
      }

      const client = createDbClient();

      try {
        // Find the diagram
        const result = await client.execute({
          sql: 'SELECT id, lockedByUserId FROM Diagram WHERE id = ?',
          args: [id]
        });

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Diagram not found' });
        }

        const diagram = result.rows[0];

        // Only unlock if the current user has the lock
        if (diagram.lockedByUserId === userId) {
          await client.execute({
            sql: 'UPDATE Diagram SET lockedByUserId = NULL, lockExpiresAt = NULL WHERE id = ?',
            args: [id]
          });
          return res.status(200).json({ success: true, message: 'Lock released' });
        }

        // If user doesn't have the lock, still return success (no action needed)
        return res.status(200).json({ success: true, message: 'No lock to release' });
      } catch (error) {
        console.error('Unlock diagram error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      } finally {
        client.close();
      }
    }
    
    // Route: GET /diagram-chat?id=... - Get chat history
    if (method === 'GET' && url.includes('/diagram-chat')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const diagramId = urlParams.get('id');
      
      if (!diagramId) {
        return res.status(400).json({ error: 'Diagram ID is required as query parameter' });
      }
      
      const client = createDbClient();
      
      try {
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
        
      } catch (error) {
        console.error(`❌ Chat API Error for diagram ${diagramId}:`, error);
        return res.status(500).json({ error: 'Failed to process chat message', details: error.message });
      } finally {
        client.close();
      }
    }
    
    // Route: POST /diagram-chat?id=... - Send chat message  
    if (method === 'POST' && url.includes('/diagram-chat')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const diagramId = urlParams.get('id');
      const { message, currentSchema, images } = body;
      
      if (!diagramId) {
        return res.status(400).json({ error: 'Diagram ID is required as query parameter' });
      }
      
      if ((!message || !message.trim()) && (!images || images.length === 0)) {
        return res.status(400).json({ error: 'Message or images are required' });
      }
      
      const client = createDbClient();
      
      try {
        console.log(`💬 Processing new chat message for diagram: ${diagramId}`);
        console.log(`📝 Message: ${message ? message.substring(0, 100) + '...' : '[Image only]'}`);
        if (images && images.length > 0) {
          console.log(`🖼️ Images attached: ${images.length}`);
        }
        
        const now = new Date().toISOString();
        const userMessageId = generateId();
        
        // 1. Save the user's message (with image indicator if present)
        const messageToSave = message + (images && images.length > 0 ? ` [User attached ${images.length} image(s)]` : '');
        await client.execute({
          sql: 'INSERT INTO ChatMessage (id, diagramId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)',
          args: [userMessageId, diagramId, 'user', messageToSave, now]
        });
        
        console.log('💾 User message saved to database');
        
        // 2. Fetch the complete conversation history for full context
        const historyResult = await client.execute({
          sql: 'SELECT role, content FROM ChatMessage WHERE diagramId = ? ORDER BY createdAt ASC',
          args: [diagramId]
        });
        
        // Get full conversation history in chronological order for AI context
        const conversationHistory = historyResult.rows.map(row => ({
          role: row.role,
          content: row.content
        }));
        
        console.log(`📚 Retrieved ${conversationHistory.length} messages for context`);
        
        // 3. Call the AI service with full context
        const aiService = new AIService();
        const aiResponse = await aiService.chatAboutSchema(message, currentSchema, conversationHistory, images);
        
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
            // Include more context about what was created
            const tableNames = schema?.tables?.map(t => t.name).join(', ') || '';
            responseContent = `I've successfully analyzed your image and generated a database schema based on what I saw. The schema includes ${schema?.tables?.length || 0} tables: ${tableNames}. This was created from the image you provided showing ${args.description}.`;
            finalResponse = { schema, content: responseContent };
          } else if (toolCall.function.name === 'modify_existing_schema') {
            console.log('🔄 Executing schema modification (non-destructive)');
            // Execute schema modification
            const args = JSON.parse(toolCall.function.arguments);
            console.log('⚙️ Modification args:', args);
            
            // Generate the AI's proposed schema
            const aiGeneratedSchema = await aiService.generateSchema(`${args.modification_type}: ${args.description}`, currentSchema);
            console.log('🤖 AI generated schema tables count:', aiGeneratedSchema?.tables?.length || 0);
            
            // Use non-destructive merging to preserve existing relationships and IDs
            const finalSchema = computeFinalSchemaState(currentSchema, aiGeneratedSchema);
            console.log('✅ Final merged schema tables count:', finalSchema?.tables?.length || 0);
            console.log('✅ Final merged schema relationships count:', finalSchema?.relationships?.length || 0);
            
            responseContent = `I've modified your schema. Changes: ${args.description}`;
            finalResponse = { schema: finalSchema, content: responseContent };
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
        
      } catch (error) {
        console.error(`❌ Chat API Error for diagram ${diagramId}:`, error);
        return res.status(500).json({ error: 'Failed to process chat message', details: error.message });
      } finally {
        client.close();
      }
    }
    
    // Route: DELETE /diagram-chat?id=... - Clear chat history
    if (method === 'DELETE' && url.includes('/diagram-chat')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const diagramId = urlParams.get('id');
      
      if (!diagramId) {
        return res.status(400).json({ error: 'Diagram ID is required as query parameter' });
      }
      
      const client = createDbClient();
      
      try {
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
        
      } catch (error) {
        console.error(`❌ Chat API Error for diagram ${diagramId}:`, error);
        return res.status(500).json({ error: 'Failed to process chat message', details: error.message });
      } finally {
        client.close();
      }
    }
    
    // If no route matches
    return res.status(404).json({ 
      error: 'Route not found', 
      path: url, 
      method: method 
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};