// server/src/api/routes/ai.routes.js
const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controller/ai.controller');

const router = express.Router();

router.post(
  '/completion',
  [
    body('prompt').notEmpty().withMessage('Prompt is required'),
    body('model').optional().isString()
  ],
  aiController.generateCompletion
);

// added route here for categorizing discissions
router.post(
    '/categorize',
    [
      body('text').notEmpty().withMessage('Text is required')
    ],
    aiController.categorizeDiscussion
  );
module.exports = router;

