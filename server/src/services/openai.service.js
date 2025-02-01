// server/src/services/openai.service.js
const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateCompletion(prompt, model = "gpt-4") {
    try {
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
      });

      return completion.choices[0].message;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate AI completion');
    }
  }
}

module.exports = new OpenAIService();