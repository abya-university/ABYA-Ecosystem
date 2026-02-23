/**
 * parseLessonContent.js
 * 
 * Utility to parse lesson content and extract highlighted terms
 * Syntax: [[term:definition]] - marks a term for highlighting
 * Example: "[[Smart Contracts:Self-executing code on blockchain]]"
 */

/**
 * Parse lesson content and extract terms that should be highlighted
 * 
 * @param {string} content - The lesson content string
 * @returns {Array} Array of { originalText, term, definition, index }
 */
export const extractHighlightedTerms = (content) => {
  const regex = /\[\[([^:]+):([^\]]+)\]\]/g;
  const terms = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    terms.push({
      originalText: match[0], // [[term:definition]]
      term: match[1].trim(), // term
      definition: match[2].trim(), // definition
      index: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return terms;
};

/**
 * Clean content by removing the markup but keeping the terms
 * Converts [[term:definition]] to just term
 * 
 * @param {string} content - Content with markup
 * @returns {string} Content without markup
 */
export const cleanLessonContent = (content) => {
  return content.replace(/\[\[([^:]+):[^\]]+\]\]/g, "$1");
};

/**
 * Check if content has any highlighted terms
 * 
 * @param {string} content - The lesson content
 * @returns {boolean} True if content contains highlighted terms
 */
export const hasHighlightedTerms = (content) => {
  return /\[\[[^\]]+:[^\]]+\]\]/g.test(content);
};
