const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

  try {
    // Use transaction for safe lock acquisition
    const result = await prisma.$transaction(async (tx) => {
      // Find the diagram with current lock info
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
      const isLockExpired = !diagram.lockExpiresAt || diagram.lockExpiresAt < now;

      // Case 1: No lock or expired lock - grant the lock
      if (!diagram.lockedByUserId || isLockExpired) {
        const newLockExpiry = new Date(now.getTime() + 5 * 60 * 1000);
        
        await tx.diagram.update({
          where: { id },
          data: {
            lockedByUserId: userId,
            lockExpiresAt: newLockExpiry,
          },
        });
        
        return { success: true, message: 'Lock acquired' };
      }

      // Case 2: Current user already has the lock - extend it (heartbeat)
      if (diagram.lockedByUserId === userId) {
        const newLockExpiry = new Date(now.getTime() + 5 * 60 * 1000);
        
        await tx.diagram.update({
          where: { id },
          data: {
            lockExpiresAt: newLockExpiry,
          },
        });
        
        return { success: true, message: 'Lock extended' };
      }

      // Case 3: Someone else has the lock and it's not expired
      // Get the locked user's name for better error message
      const lockedByUser = await tx.user.findUnique({
        where: { id: diagram.lockedByUserId },
        select: { name: true },
      });

      return {
        success: false,
        status: 409,
        message: 'Diagram is locked by another user',
        lockedBy: lockedByUser?.name || 'Another user',
        lockExpiresAt: diagram.lockExpiresAt,
      };
    });

    if (result.status === 409) {
      return res.status(409).json({
        success: false,
        message: result.message,
        lockedBy: result.lockedBy,
        lockExpiresAt: result.lockExpiresAt,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Diagram not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    console.error('Lock diagram error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
};