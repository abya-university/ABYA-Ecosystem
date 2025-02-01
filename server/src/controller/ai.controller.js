// server/src/api/controllers/ai.controller.js
const openAIService = require('../../services/openai.service');
const { validationResult } = require('express-validator');

exports.generateCompletion = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prompt, model } = req.body;
    const completion = await openAIService.generateCompletion(prompt, model);
    
    res.json({ 
      success: true,
      data: completion 
    });
  } catch (error) {
    console.error('Controller Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};