const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      // List all diagrams
      const diagrams = await prisma.diagram.findMany({
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
      
      return res.json(diagrams);
      
    } else if (req.method === 'POST') {
      // Create new diagram
      const { name, nodes, edges, ownerId } = req.body;
      
      if (!name || !ownerId) {
        return res.status(400).json({ error: 'Name and ownerId are required' });
      }
      
      const diagram = await prisma.diagram.create({
        data: {
          name,
          nodes: nodes || [],
          edges: edges || [],
          ownerId
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      return res.status(201).json(diagram);
      
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