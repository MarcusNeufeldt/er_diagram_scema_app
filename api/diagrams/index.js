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
      const { name, nodes, edges, ownerId } = req.body;
      
      if (!name || !ownerId) {
        return res.status(400).json({ error: 'Name and ownerId are required' });
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