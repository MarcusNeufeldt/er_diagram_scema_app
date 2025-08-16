const { createClient } = require('@libsql/client');

function createDbClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

// GET /api/diagrams/{id}
async function getDiagram(req, res) {
  const { id } = req.query;
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

    res.status(200).json(diagram);
  } catch (error) {
    console.error('Get diagram error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.close();
  }
}

// PUT /api/diagrams/{id}
async function updateDiagram(req, res) {
  const { id } = req.query;
  const { userId, name, nodes, edges } = req.body;

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
    const updateData = {
      updatedAt: now.toISOString()
    };
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

    res.status(200).json({
      success: true,
      message: 'Diagram updated successfully'
    });
  } catch (error) {
    console.error('Update diagram error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.close();
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return getDiagram(req, res);
  } else if (req.method === 'PUT') {
    return updateDiagram(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};