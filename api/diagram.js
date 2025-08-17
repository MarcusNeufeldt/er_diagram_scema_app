const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/diagram?id={id}
async function getDiagram(req, res) {
  const { id } = req.query;

  try {
    // Get diagram with owner info
    const diagram = await prisma.diagram.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!diagram) {
      return res.status(404).json({ success: false, message: 'Diagram not found' });
    }

    // Check if lock is expired
    const now = new Date();
    const isLockExpired = diagram.lockExpiresAt && diagram.lockExpiresAt < now;

    if (isLockExpired) {
      // Clear expired lock
      await prisma.diagram.update({
        where: { id },
        data: {
          lockedByUserId: null,
          lockExpiresAt: null,
        },
      });
      diagram.lockedByUserId = null;
      diagram.lockExpiresAt = null;
    }

    res.status(200).json(diagram);
  } catch (error) {
    console.error('Get diagram error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// PUT /api/diagram?id={id}
async function updateDiagram(req, res) {
  const { id } = req.query;
  const { userId, name, nodes, edges } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }

  try {
    // Use transaction to verify lock and update
    const result = await prisma.$transaction(async (tx) => {
      // Find the diagram and verify lock
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

      // Verify user has valid lock
      if (diagram.lockedByUserId !== userId || isLockExpired) {
        throw new Error('Invalid or expired lock');
      }

      // Update the diagram
      const updatedDiagram = await tx.diagram.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(nodes && { nodes }),
          ...(edges && { edges }),
          updatedAt: now,
        },
      });

      return updatedDiagram;
    });

    res.status(200).json({
      success: true,
      message: 'Diagram updated successfully',
    });
  } catch (error) {
    if (error.message === 'Diagram not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Invalid or expired lock') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your editing session has expired. Please reload to get the latest version.' 
      });
    }
    console.error('Update diagram error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// DELETE /api/diagram?id={id}
async function deleteDiagram(req, res) {
  const { id } = req.query;

  try {
    await prisma.diagram.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: 'Diagram deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Diagram not found' });
    }
    console.error('Delete diagram error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      return await getDiagram(req, res);
    } else if (req.method === 'PUT') {
      return await updateDiagram(req, res);
    } else if (req.method === 'DELETE') {
      return await deleteDiagram(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } finally {
    await prisma.$disconnect();
  }
};