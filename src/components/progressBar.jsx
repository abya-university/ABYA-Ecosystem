import React from "react";

const ProgressBar = ({ completedLessons, totalLessons }) => {
  const progressPercentage = (completedLessons / totalLessons) * 100;

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-500 mb-4">
      <div
        className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${progressPercentage}%` }}
      ></div>
      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
        {completedLessons} / {totalLessons} Lessons Completed
      </div>
    </div>
  );
};

export default ProgressBar;
