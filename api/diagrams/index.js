const { createClient } = require('@libsql/client');

function createDbClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

module.exports = async (req, res) => {
  const client = createDbClient();
  
  try {
    if (req.method === 'GET') {
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
      
    } else if (req.method === 'POST') {
      // Create new diagram
      const { name, nodes, edges, ownerId, ownerName, ownerEmail } = req.body;
      
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
      
    } else if (req.method === 'DELETE') {
      // Delete diagram by ID (from query params)
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Diagram ID is required' });
      }
      
      await client.execute({
        sql: 'DELETE FROM Diagram WHERE id = ?',
        args: [id]
      });
      
      return res.status(200).json({ success: true, message: 'Diagram deleted successfully' });
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.close();
  }
};