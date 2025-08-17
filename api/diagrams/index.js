const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      // List all diagrams with owner info
      const diagrams = await prisma.diagram.findMany({
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
      
      return res.json(diagrams);
      
    } else if (req.method === 'POST') {
      // Create new diagram
      const { name, nodes, edges, ownerId, ownerName, ownerEmail } = req.body;
      
      if (!name || !ownerId) {
        return res.status(400).json({ error: 'Name and ownerId are required' });
      }
      
      // First, ensure the user exists (upsert)
      const defaultEmail = ownerEmail || `${ownerId}@local.user`;
      await prisma.user.upsert({
        where: { id: ownerId },
        update: {
          // Update name and email if provided (allowing for profile updates)
          ...(ownerName && { name: ownerName }),
          ...(ownerEmail && { email: ownerEmail }),
        },
        create: {
          id: ownerId,
          name: ownerName || 'Anonymous User',
          email: defaultEmail,
        },
      });
      
      // Create the diagram
      const diagram = await prisma.diagram.create({
        data: {
          name,
          nodes: nodes || [],
          edges: edges || [],
          ownerId,
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      
      return res.status(201).json(diagram);
      
    } else if (req.method === 'DELETE') {
      // Delete diagram by ID (from query params)
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Diagram ID is required' });
      }
      
      try {
        await prisma.diagram.delete({
          where: { id },
        });
        
        return res.status(200).json({ success: true, message: 'Diagram deleted successfully' });
      } catch (error) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Diagram not found' });
        }
        throw error;
      }
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
};