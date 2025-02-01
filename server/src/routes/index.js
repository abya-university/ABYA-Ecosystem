// src/api/routes/index.js
const express = require('express');
const router = express.Router();
const aiRoutes = require('../routes/ai.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Mount routes
router.use('/ai', aiRoutes);
module.exports = router;