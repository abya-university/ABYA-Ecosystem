// components/ui/Progress.jsx
import PropTypes from 'prop-types';
import React from 'react';

export function Progress({
  value,
  max = 100,
  showLabel = false,
  label = null,
  color = { default: 'bg-blue-500', complete: 'bg-green-500' },
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const progressColor = percentage === 100 ? color.complete : color.default;

  return (
    <div className="w-full">
      {/* Embedded animation styles */}
      <style>{`
        @keyframes pulse-moving {
          0% {
            left: 0%;
            transform: scale(1);
          }
          50% {
            transform: scale(1.5);
          }
          100% {
            left: 100%;
            transform: scale(1);
          }
        }
        .animate-pulse-moving {
          position: absolute;
          animation: pulse-moving 2s infinite;
        }
      `}</style>

      <div
        className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label="Progress"
      >
        <div
          className={`h-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${percentage}%` }}
        ></div>
        <div className="absolute top-0 h-full w-1 rounded-full bg-blue-500 opacity-20 animate-pulse-moving"></div>
      </div>

      {showLabel && (
        <div className="mt-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {label || `${Math.round(percentage)}%`}
        </div>
      )}
    </div>
  );
}

Progress.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  showLabel: PropTypes.bool,
  label: PropTypes.string,
  color: PropTypes.shape({
    default: PropTypes.string,
    complete: PropTypes.string,
  }),
};
