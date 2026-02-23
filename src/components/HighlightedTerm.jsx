import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";

/**
 * HighlightedTerm Component
 * 
 * Renders a highlighted term with:
 * - Subtle underline styling
 * - Hover tooltip with definition
 * - "Ask Dr. Kwame" button to open chatbot with term context
 * 
 * @param {string} term - The term to highlight
 * @param {string} definition - Brief definition of the term
 * @param {function} onAskAbout - Callback when user clicks "Ask Dr. Kwame about this"
 */
const HighlightedTerm = ({ term, definition, onAskAbout }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const termRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (showTooltip && termRef.current && tooltipRef.current) {
      const termRect = termRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Position tooltip above the term, centered
      const top = termRect.top - tooltipRect.height - 10;
      const left = termRect.left + termRect.width / 2 - tooltipRect.width / 2;
      
      setTooltipPosition({ top, left });
    }
  }, [showTooltip]);

  return (
    <>
      {/* Highlighted term */}
      <span
        ref={termRef}
        className="relative inline-block font-semibold text-blue-600 dark:text-blue-400 cursor-help
                   border-b-2 border-dashed border-blue-300 dark:border-blue-500
                   hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1 rounded transition-colors duration-150"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setTimeout(() => setShowTooltip(false), 1000)}
      >
        {term}
        <HelpCircle className="inline w-3 h-3 ml-1 opacity-60" />
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-40 bg-gradient-to-br from-gray-900 to-gray-800 text-white 
                     px-4 py-3 rounded-lg shadow-2xl border border-gray-700 max-w-xs
                     animate-in fade-in duration-200"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: "translateX(-50%)",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Definition */}
          <p className="text-sm text-gray-100 mb-3 pr-6">
            {definition}
          </p>

          {/* Ask Dr. Kwame button */}
          {onAskAbout && (
            <button
              onClick={() => {
                onAskAbout(term, definition);
                setShowTooltip(false);
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold 
                         py-2 px-3 rounded transition-colors duration-150 text-sm flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Ask Dr. Kwame about this
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default HighlightedTerm;
