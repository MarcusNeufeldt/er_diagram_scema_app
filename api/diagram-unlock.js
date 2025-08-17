const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST /api/diagram-unlock?id={id}
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
    // Find the diagram
    const diagram = await prisma.diagram.findUnique({
      where: { id },
      select: {
        id: true,
        lockedByUserId: true,
      },
    });

    if (!diagram) {
      return res.status(404).json({ success: false, message: 'Diagram not found' });
    }

    // Only unlock if the current user has the lock
    if (diagram.lockedByUserId === userId) {
      await prisma.diagram.update({
        where: { id },
        data: {
          lockedByUserId: null,
          lockExpiresAt: null,
        },
      });
      return res.status(200).json({ success: true, message: 'Lock released' });
    }

    // If user doesn't have the lock, still return success (no action needed)
    res.status(200).json({ success: true, message: 'No lock to release' });
  } catch (error) {
    console.error('Unlock diagram error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
};