import React, { useCallback, useMemo } from "react";
import HighlightedTerm from "../components/HighlightedTerm";
import { extractHighlightedTerms } from "../utils/parseLessonContent";

/**
 * LessonContentRenderer Component
 * 
 * Renders lesson content with inline highlighted terms and definitions
 * 
 * Supports markdown-like syntax:
 * [[term:definition]] - highlights the term with hover tooltip
 * 
 * @param {string} content - The lesson content with optional [[term:definition]] markup
 * @param {function} onTermClick - Callback when user clicks "Ask ABYA about this"
 *                                  Receives (term, definition) as params
 * @param {string} className - Optional CSS classes for the paragraph
 */
const LessonContentRenderer = ({ 
  content, 
  onTermClick,
  className = "text-gray-700 dark:text-gray-300 mb-4"
}) => {
  // Extract all highlighted terms
  const highlightedTerms = useMemo(() => {
    return extractHighlightedTerms(content);
  }, [content]);

  // Build the rendered content
  const renderedContent = useMemo(() => {
    if (highlightedTerms.length === 0) {
      // No highlighted terms, return plain content
      return content;
    }

    // Sort terms by index to process them in order
    const sortedTerms = [...highlightedTerms].sort((a, b) => a.index - b.index);
    const elements = [];
    let lastIndex = 0;

    sortedTerms.forEach((termData) => {
      // Add text before the term
      if (lastIndex < termData.index) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, termData.index)}
          </span>
        );
      }

      // Add the highlighted term
      elements.push(
        <HighlightedTerm
          key={`term-${termData.index}`}
          term={termData.term}
          definition={termData.definition}
          onAskAbout={onTermClick}
        />
      );

      lastIndex = termData.endIndex;
    });

    // Add remaining text after last term
    if (lastIndex < content.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  }, [content, highlightedTerms, onTermClick]);

  return (
    <p className={className}>
      {renderedContent}
    </p>
  );
};

export default LessonContentRenderer;
