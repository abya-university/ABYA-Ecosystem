import React, { useEffect, useState, useContext } from "react";
import {
  Book,
  ChevronRight,
  CheckCircle,
  FileText,
  Zap,
  Lock,
} from "lucide-react";
import PreviewCourse from "../pages/PreviewCourse";
import BulkCourseUpload from "./Course Creation Components/BulkCourseUpload";
// import { toast, ToastContainer } from "react-toastify";
import CourseBasicInfo from "./Course Creation Components/CourseBasicInfo";
import ChapterCreation from "./Course Creation Components/ChapterCreation";
import LessonCreation from "./Course Creation Components/LessonCreation";
import QuizCreation from "./Course Creation Components/QuizCreation";
import ResourcesCreation from "./Course Creation Components/ResourceCreation";

const CourseCreationPipeline = () => {
  const [currentStep, setCurrentStep] = useState(0); // 0 for method selection
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const ProgressBar = () => {
    const steps = [
      "Choose Method",
      "Basic Info",
      "Chapters",
      "Lessons",
      "Quizzes",
      "Resources",
    ];

    return (
      <div className="flex flex-col md:flex-row md:flex-wrap justify-between items-center mb-8 gap-3 md:gap-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center transition-all duration-300 ${
              currentStep > index
                ? "text-green-500"
                : currentStep === index
                ? "text-yellow-500 font-semibold"
                : "text-gray-300"
            } ${index === 0 ? "flex-1" : ""}`}
          >
            {index > 0 && (
              <div
                className={`w-6 md:w-10 lg:w-12 h-1 mr-2 md:mr-3 transition-all duration-300 ${
                  currentStep >= index ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
            <div className="flex items-center space-x-2 min-w-0 max-w-[130px] md:max-w-[160px]">
              {currentStep > index ? (
                <CheckCircle
                  size={20}
                  className="md:w-6 md:h-6 flex-shrink-0"
                />
              ) : (
                <div
                  className={`p-1 rounded-full ${
                    currentStep === index
                      ? "bg-yellow-100 dark:bg-yellow-900/30"
                      : ""
                  }`}
                >
                  <Book size={18} className="md:w-5 md:h-5 flex-shrink-0" />
                </div>
              )}
              <span className="text-xs md:text-sm leading-tight break-words text-center">
                {step}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const MethodSelection = () => (
    <div className="text-center py-8 md:py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-2">
        Choose Creation Method
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 md:mb-12 text-sm md:text-base">
        Select how you want to create your course
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
        {/* Step-by-Step Method */}
        <div
          onClick={() => setSelectedMethod("pipeline")}
          className={`p-6 md:p-8 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
            selectedMethod === "pipeline"
              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-yellow-300 hover:shadow-md"
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Step-by-Step Builder
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mb-4">
            Build your course gradually with our guided step-by-step process.
            Perfect for creating structured and organized courses.
          </p>
          <ul className="text-left text-sm text-gray-500 dark:text-gray-400 space-y-2 mb-6">
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Guided step-by-step process
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Real-time validation
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Preview as you build
            </li>
          </ul>
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedMethod === "pipeline"
                ? "bg-yellow-500 text-gray-900"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            {selectedMethod === "pipeline" ? "Selected" : "Choose this method"}
          </div>
        </div>

        {/* JSON Upload Method */}
        <div
          onClick={() => setSelectedMethod("json")}
          className={`p-6 md:p-8 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
            selectedMethod === "json"
              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-yellow-300 hover:shadow-md"
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            JSON Upload
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mb-4">
            Upload your entire course structure in a single JSON file. Fast and
            efficient for bulk course creation.
          </p>
          <ul className="text-left text-sm text-gray-500 dark:text-gray-400 space-y-2 mb-6">
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Single file upload
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Bulk course creation
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              JSON format support
            </li>
          </ul>
          <div className="px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-white text-sm font-medium">
            Open Bulk Upload
          </div>
        </div>
      </div>

      {/* Continue Button */}
      {selectedMethod === "pipeline" && (
        <div className="mt-8 md:mt-12">
          <button
            onClick={() => setCurrentStep(1)}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
          >
            Start Building
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="w-[95%] md:w-[90%] lg:w-[85%] xl:w-[80%] mx-auto p-6 md:p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg mt-20 md:mt-[100px] border border-gray-200 dark:border-gray-700">
      <ProgressBar />
      {/* <ToastContainer position="bottom-right z-60" theme="colored" /> */}

      {showPreview ? (
        <PreviewCourse />
      ) : selectedMethod === "json" ? (
        <div className="mb-8">
          <BulkCourseUpload
            onBack={() => {
              setSelectedMethod(null);
              setCurrentStep(0);
              setShowPreview(false);
            }}
          />
        </div>
      ) : (
        <div className="mb-8">
          {currentStep === 0 && <MethodSelection />}
          {currentStep === 1 && <CourseBasicInfo />}
          {currentStep === 2 && <ChapterCreation />}
          {currentStep === 3 && <LessonCreation />}
          {currentStep === 4 && <QuizCreation />}
          {currentStep === 5 && <ResourcesCreation />}
        </div>
      )}

      {/* Navigation Buttons - Only show when not in method selection and not using JSON upload */}
      {currentStep > 0 && !showPreview && selectedMethod === "pipeline" && (
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={prevStep}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Previous
          </button>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              Next Step
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => setShowPreview(true)}
              className="bg-green-500 hover:bg-green-600 text-white lg:px-8 lg:py-3 md:px-8 md:py-3 px-3 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Preview Course
              <CheckCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseCreationPipeline;
