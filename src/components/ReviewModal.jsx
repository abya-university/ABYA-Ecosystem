import React, { useState } from "react";
import { Star, X } from "lucide-react";

const ReviewModal = ({ isOpen, onClose, onSubmit, courseId }) => {
  const [ratings, setRatings] = useState({
    learnerAgency: 0,
    criticalThinking: 0,
    collaborativeLearning: 0,
    reflectivePractice: 0,
    adaptiveLearning: 0,
    authenticLearning: 0,
    technologyIntegration: 0,
    learnerSupport: 0,
    assessmentForLearning: 0,
    engagementAndMotivation: 0,
  });

  const metrics = [
    { key: "learnerAgency", label: "Learner Agency" },
    { key: "criticalThinking", label: "Critical Thinking" },
    { key: "collaborativeLearning", label: "Collaborative Learning" },
    { key: "reflectivePractice", label: "Reflective Practice" },
    { key: "adaptiveLearning", label: "Adaptive Learning" },
    { key: "authenticLearning", label: "Authentic Learning" },
    { key: "technologyIntegration", label: "Technology Integration" },
    { key: "learnerSupport", label: "Learner Support" },
    { key: "assessmentForLearning", label: "Assessment for Learning" },
    { key: "engagementAndMotivation", label: "Engagement and Motivation" },
  ];

  const handleRatingChange = (metric, value) => {
    setRatings((prev) => ({
      ...prev,
      [metric]: value,
    }));
  };

  const calculateTotal = () => {
    return Object.values(ratings).reduce((a, b) => a + b, 0);
  };

  const handleSubmit = () => {
    onSubmit(courseId, ratings);
    onClose();
  };

  const StarRating = ({ value, onChange }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <Star
            key={star}
            size={20}
            className={`cursor-pointer transition-colors ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md transform bg-white dark:bg-gray-800 p-6 shadow-xl transition-transform duration-300 ease-in-out h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Course Review
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {metrics.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </label>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {ratings[key]}/10
                </span>
              </div>
              <StarRating
                value={ratings[key]}
                onChange={(value) => handleRatingChange(key, value)}
              />
            </div>
          ))}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Score
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {calculateTotal()}/100
              </span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Status
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {calculateTotal() / 100 < 85 / 100 ? (
                  <span className="text-red-500">Failed</span>
                ) : (
                  <span className="text-green-500">Passed</span>
                )}
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={calculateTotal() === 0}
              className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 
                       text-white font-semibold rounded-lg shadow-md transition-colors
                       disabled:cursor-not-allowed"
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
