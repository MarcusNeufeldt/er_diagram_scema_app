const express = require('express');
const { lockDiagram } = require('./diagrams/lock');
const { unlockDiagram } = require('./diagrams/unlock');
const { getDiagram, updateDiagram } = require('./diagrams/[id]');

const router = express.Router();

// Diagram locking endpoints
router.post('/diagrams/:id/lock', lockDiagram);
router.post('/diagrams/:id/unlock', unlockDiagram);

// Diagram CRUD endpoints  
router.get('/diagrams/:id', getDiagram);
router.put('/diagrams/:id', updateDiagram);

module.exports = router;