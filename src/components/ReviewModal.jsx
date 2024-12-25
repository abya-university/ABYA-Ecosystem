import React, { useState } from "react";
import { AlertCircle, CheckCircle, Star, X } from "lucide-react";
import Ecosystem2ABI from "../artifacts/contracts/Ecosystem Contracts/Ecosystem2.sol/Ecosystem2.json";
import { ethers } from "ethers";
import { useEthersSigner } from "./useClientSigner";
import { useAccount } from "wagmi";

const ContractABI = Ecosystem2ABI.abi;
const ContractAddress = import.meta.env.VITE_APP_ECOSYSTEM2_CONTRACT_ADDRESS;

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
  const signerPromise = useEthersSigner();
  const { address, isConnected } = useAccount();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

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

  const handleSubmitReview = async (courseId, ratings) => {
    if (!isConnected || !address) {
      throw new Error("User is not connected");
    }

    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        ContractAddress,
        ContractABI,
        signer
      );
      const transaction = await contract.submitReview(
        courseId,
        ratings.learnerAgency,
        ratings.criticalThinking,
        ratings.collaborativeLearning,
        ratings.reflectivePractice,
        ratings.adaptiveLearning,
        ratings.authenticLearning,
        ratings.technologyIntegration,
        ratings.learnerSupport,
        ratings.assessmentForLearning,
        ratings.engagementAndMotivation
      );
      await transaction.wait();
      setSuccess(`Course ${courseId} reviewed successfully`);
      setReviewSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message);
      setReviewSubmitted(false);
    }
  };

  const handleRatingChange = (metric, value) => {
    setRatings((prev) => ({
      ...prev,
      [metric]: value,
    }));
  };

  const calculateTotal = () => {
    return Object.values(ratings).reduce((a, b) => a + b, 0);
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
        {(success || error) && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center ${
              success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-700"
            }`}
          >
            {success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{success || error}</span>
          </div>
        )}

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
              onClick={() => handleSubmitReview(courseId, ratings)}
              disabled={calculateTotal() === 0 || reviewSubmitted}
              className={`w-full py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg shadow-md transition-colors ${
                reviewSubmitted ? "disabled:bg-gray-400" : "hover:bg-yellow-600"
              } flex items-center justify-center`}
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
