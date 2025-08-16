const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST /api/diagrams/{id}/lock
async function lockDiagram(req, res) {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }

  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Find the diagram
      const diagram = await tx.diagram.findUnique({
        where: { id },
        select: {
          id: true,
          lockedByUserId: true,
          lockExpiresAt: true,
        },
      });

      if (!diagram) {
        throw new Error('Diagram not found');
      }

      const now = new Date();
      const lockExpiry = diagram.lockExpiresAt;
      const isLockExpired = !lockExpiry || lockExpiry < now;

      // Case 1: No lock or expired lock - grant the lock
      if (!diagram.lockedByUserId || isLockExpired) {
        await tx.diagram.update({
          where: { id },
          data: {
            lockedByUserId: userId,
            lockExpiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes
          },
        });
        return { success: true, message: 'Lock acquired' };
      }

      // Case 2: Current user already has the lock - extend it (heartbeat)
      if (diagram.lockedByUserId === userId) {
        await tx.diagram.update({
          where: { id },
          data: {
            lockExpiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes
          },
        });
        return { success: true, message: 'Lock extended' };
      }

      // Case 3: Someone else has the lock and it's not expired
      throw new Error('Diagram is locked by another user');
    });

    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Diagram not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Diagram is locked by another user') {
      return res.status(409).json({ success: false, message: error.message });
    }
    console.error('Lock diagram error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { lockDiagram };