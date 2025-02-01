// server/src/services/openai.service.js
const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.conversationHistory = [];
  }

  async generateCompletion(prompt, model = "gpt-4o-mini") {
    this.conversationHistory.push({ role: "user", content: prompt });
    try {
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
            { role: "system", content: "You are a blockchain expert chatbot. You provide accurate, technical, and insightful answers strictly related to blockchain, cryptocurrencies, smart contracts, and decentralized finance (DeFi)." },
            ...this.conversationHistory.slice(-5) // Keep only the last 5 interactions
          ],
        temperature: 0.3,
        top_p: 0.9,
        stop: ["\n\n"],
      });

      return completion.choices[0].message;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate AI completion');
    }
  }
}

module.exports = new OpenAIService();