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

  // 🔹 Categorization Service
  async categorizeDiscussion(text) {
    const CATEGORIES = ["Solidity", "Rust", "Ethereum", "Solana", "Skale Network"];

    const prompt = `
    Given the following text, classify it into relevant blockchain-related categories. 
    Select up to 3 categories from this list: ${CATEGORIES.join(", ")}.
    If the text is not related to blockchain, return an empty list.

    Text: "${text}"

    Respond ONLY with a JSON array, e.g., ["Solidity", "Ethereum"], or [] if no relevant category exists.
    `;

    try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        });
  
        const tags = JSON.parse(response.choices[0].message.content || "[]");
        return tags;
      } catch (error) {
        console.error("OpenAI API Error:", error);
        throw new Error("Failed to categorize discussion");
      }
    }  
}

module.exports = new OpenAIService();