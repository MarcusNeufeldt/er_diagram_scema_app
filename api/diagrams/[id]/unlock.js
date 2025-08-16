const { createClient } = require('@libsql/client');

function createDbClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

// Vercel serverless function for POST /api/diagrams/[id]/unlock
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
    res.status(200).json({ success: true, message: 'No lock to release' });
  } catch (error) {
    console.error('Unlock diagram error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.close();
  }
};