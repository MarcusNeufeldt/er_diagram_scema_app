const { createClient } = require('@libsql/client');

function createDbClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

// POST /api/diagram-lock?id={id}
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;
  const { userId } = req.body;

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
      const newLockExpiry = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      
      await client.execute({
        sql: 'UPDATE Diagram SET lockedByUserId = ?, lockExpiresAt = ? WHERE id = ?',
        args: [userId, newLockExpiry, id]
      });
      
      return res.status(200).json({ success: true, message: 'Lock acquired' });
    }

    // Case 2: Current user already has the lock - extend it (heartbeat)
    if (diagram.lockedByUserId === userId) {
      const newLockExpiry = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      
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
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.close();
  }
};