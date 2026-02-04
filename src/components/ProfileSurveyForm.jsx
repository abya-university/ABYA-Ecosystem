import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  User,
  Code,
  Target,
  Heart,
  BookOpen,
  FileCheck,
  Sparkles,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Zap,
  Loader,
} from "lucide-react";
import { useDarkMode } from "../contexts/themeContext";
import { useActiveAccount } from "thirdweb/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CareerOnboardingForm({ userAddress }) {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const account = useActiveAccount();
  // Use prop if provided, otherwise get from hook
  const walletAddress = userAddress || account?.address;
  const [formData, setFormData] = useState({
    // Current Situation
    currentStatus: "",
    currentRole: "",
    yearsOfExperience: "",
    industryBackground: "",

    // Tech Background
    technicalLevel: "",
    programmingLanguages: [],
    hasBlockchainExp: "",
    hasAIExp: "",

    // Career Goals
    targetRole: [],
    careerTimeline: "",
    geographicPreference: "",

    // Motivation & Interests
    primaryMotivation: [],
    webThreeInterest: "",
    aiInterest: "",

    // Skills & Learning
    strongSkills: [],
    wantToImprove: [],
    learningStyle: "",
    timeCommitment: "",

    // Goals & Constraints
    shortTermGoal: "",
    concerns: "",
    additionalInfo: "",
    agreeToTerms: false,
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState("situationAndTech");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox" && Array.isArray(formData[name])) {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter((item) => item !== value),
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.currentStatus ||
      !formData.industryBackground ||
      !formData.technicalLevel ||
      !formData.hasBlockchainExp ||
      !formData.hasAIExp ||
      !formData.targetRole ||
      formData.targetRole.length === 0 ||
      !formData.careerTimeline ||
      !formData.geographicPreference ||
      !formData.learningStyle ||
      !formData.timeCommitment ||
      !formData.shortTermGoal ||
      !formData.agreeToTerms
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the payload
      const payload = {
        // Current Situation
        currentStatus: formData.currentStatus,
        currentRole: formData.currentRole || null,
        yearsOfExperience: formData.yearsOfExperience || null,
        industryBackground: formData.industryBackground,

        // Tech Background
        technicalLevel: formData.technicalLevel,
        programmingLanguages: formData.programmingLanguages || [],
        hasBlockchainExp: formData.hasBlockchainExp,
        hasAIExp: formData.hasAIExp,

        // Career Goals
        targetRole: formData.targetRole,
        careerTimeline: formData.careerTimeline,
        geographicPreference: formData.geographicPreference,

        // Motivation & Interests
        primaryMotivation: formData.primaryMotivation || [],
        webThreeInterest: formData.webThreeInterest || null,
        aiInterest: formData.aiInterest || null,

        // Skills & Learning
        strongSkills: formData.strongSkills || [],
        wantToImprove: formData.wantToImprove || [],
        learningStyle: formData.learningStyle,
        timeCommitment: formData.timeCommitment,

        // Goals & Constraints
        shortTermGoal: formData.shortTermGoal,
        concerns: formData.concerns || null,
        additionalInfo: formData.additionalInfo || null,
        agreeToTerms: formData.agreeToTerms,

        // Metadata
        submittedAt: new Date().toISOString(),
        walletAddress: walletAddress || null, // User's wallet address if connected
      };
      console.log("Payload:", payload);

      // Get API endpoint from environment variable or use default
      const API_ENDPOINT =
        import.meta.env.VITE_CAREER_ONBOARDING_API ||
        "http://localhost:8000/api/career-onboarding";

      // Send to backend
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Backend response:", result);

      // Show success state
      toast.success("Profile created successfully! 🎉");
      setFormSubmitted(true);

      // Navigate after delay
      setTimeout(() => {
        navigate("/mainpage?section=dashboard");
      }, 2000);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(`Error submitting form: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    "situationAndTech",
    "goalsAndMotivation",
    "learningAndReview",
  ];

  const currentSectionIndex = sections.indexOf(activeSection);
  const isLastSection = currentSectionIndex === sections.length - 1;
  const isFirstSection = currentSectionIndex === 0;

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      setActiveSection(sections[currentSectionIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setActiveSection(sections[currentSectionIndex - 1]);
    }
  };

  if (formSubmitted) {
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <div
          className={`relative rounded-3xl p-8 lg:p-12 text-center max-w-md shadow-2xl overflow-hidden ${
            darkMode
              ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-yellow-500/30"
              : "bg-gradient-to-br from-white via-yellow-50 to-yellow-50 border border-yellow-200"
          }`}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl ${
                darkMode ? "bg-blue-500/20" : "bg-blue-400/30"
              } animate-pulse`}
            ></div>
            <div
              className={`absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl ${
                darkMode ? "bg-purple-500/20" : "bg-purple-400/30"
              } animate-pulse delay-1000`}
            ></div>
          </div>

          <div className="relative mb-6">
            <div className="relative inline-block mb-6">
              <div
                className={`absolute inset-0 rounded-full ${
                  darkMode ? "bg-blue-500/20" : "bg-blue-400/20"
                } animate-ping`}
              ></div>
              <CheckCircle
                size={80}
                className={`relative mx-auto ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
                strokeWidth={2.5}
              />
            </div>
            <h2
              className={`text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r ${
                darkMode
                  ? "from-yellow-400 via-yellow-500 to-yellow-400"
                  : "from-yellow-600 via-yellow-700 to-yellow-600"
              } bg-clip-text text-transparent`}
            >
              Profile Complete! 🎉
            </h2>
            <p
              className={`text-lg mb-3 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Your career profile has been created successfully.
            </p>
            <p
              className={`text-base ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Redirecting to your dashboard...
            </p>
          </div>
          <div className="relative">
            <div
              className={`h-2 rounded-full overflow-hidden ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${
                  darkMode
                    ? "from-yellow-500 via-yellow-600 to-yellow-500"
                    : "from-yellow-500 via-yellow-600 to-yellow-500"
                } animate-pulse`}
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 pt-[30px]">
      <ToastContainer position="top-right" theme="colored" autoClose={3000} />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3 gap-2">
            <Sparkles
              className={`w-6 h-6 ${
                darkMode ? "text-yellow-400" : "text-yellow-500"
              }`}
            />
            <h1
              className={`text-3xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Career Onboarding
            </h1>
            <Sparkles
              className={`w-6 h-6 ${
                darkMode ? "text-yellow-400" : "text-yellow-500"
              }`}
            />
          </div>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Help us understand your background and career goals
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-semibold ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Step {currentSectionIndex + 1} of {sections.length}
            </span>
          </div>
          <div
            className={`h-2 rounded-full overflow-hidden ${
              darkMode ? "bg-gray-700/50" : "bg-gray-200"
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                darkMode
                  ? "from-yellow-500 via-yellow-600 to-yellow-500"
                  : "from-yellow-500 via-yellow-600 to-yellow-500"
              }`}
              style={{
                width: `${
                  ((currentSectionIndex + 1) / sections.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className={`rounded-2xl shadow-xl overflow-hidden ${
            darkMode
              ? "bg-gray-800/50 border border-gray-700"
              : "bg-white border border-gray-200"
          }`}
        >
          <div className="p-6 lg:p-8">
            {/* SLIDE 1: Current Situation & Tech Background */}
            {activeSection === "situationAndTech" && (
              <div className="space-y-6">
                {/* Current Situation */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase
                      className={`w-5 h-5 ${
                        darkMode ? "text-blue-400" : "text-blue-600"
                      }`}
                    />
                    <h2
                      className={`text-lg font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Current Situation
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="currentStatus"
                        value={formData.currentStatus}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                          darkMode
                            ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      >
                        <option value="">Select status</option>
                        <option value="student">Student</option>
                        <option value="employed">Employed (Full-time)</option>
                        <option value="employed-part">
                          Employed (Part-time)
                        </option>
                        <option value="career-change">Career Change</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="freelancer">
                          Freelancer/Self-employed
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Current/Recent Role
                      </label>
                      <input
                        type="text"
                        name="currentRole"
                        value={formData.currentRole}
                        onChange={handleInputChange}
                        placeholder="e.g., Software Engineer"
                        className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                          darkMode
                            ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 hover:border-blue-500/50 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-blue-400 focus:border-blue-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Years of Experience
                      </label>
                      <select
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                          darkMode
                            ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      >
                        <option value="">Select experience</option>
                        <option value="0">0 years</option>
                        <option value="1">0-1 years</option>
                        <option value="2">1-2 years</option>
                        <option value="3">2-3 years</option>
                        <option value="5">3-5 years</option>
                        <option value="10">5-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Industry Background{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="industryBackground"
                        value={formData.industryBackground}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                          darkMode
                            ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      >
                        <option value="">Select background</option>
                        <option value="tech">Tech/Software</option>
                        <option value="finance">Finance</option>
                        <option value="business">Business</option>
                        <option value="science">Science/Engineering</option>
                        <option value="education">Education</option>
                        <option value="other">Other</option>
                        <option value="none">No background</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div
                  className={`my-6 border-t ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                ></div>

                {/* Tech Background */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Code
                      className={`w-5 h-5 ${
                        darkMode ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                    <h2
                      className={`text-lg font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Technical Background
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Technical Level{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="technicalLevel"
                          value={formData.technicalLevel}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select level</option>
                          <option value="beginner">Beginner</option>
                          <option value="beginner-learning">
                            Beginner (Learning)
                          </option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Blockchain Experience{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="hasBlockchainExp"
                          value={formData.hasBlockchainExp}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select option</option>
                          <option value="no">No experience</option>
                          <option value="minimal">Minimal</option>
                          <option value="hands-on">Hands-on</option>
                          <option value="professional">Professional</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          AI/ML Experience{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="hasAIExp"
                          value={formData.hasAIExp}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select option</option>
                          <option value="no">No experience</option>
                          <option value="minimal">Minimal</option>
                          <option value="hands-on">Hands-on</option>
                          <option value="professional">Professional</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-3 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Programming Languages
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "JavaScript/TypeScript",
                          "Python",
                          "Solidity",
                          "Go",
                          "Rust",
                          "Java",
                        ].map((lang) => (
                          <label
                            key={lang}
                            className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all border-2 text-sm ${
                              formData.programmingLanguages.includes(lang)
                                ? darkMode
                                  ? "bg-blue-500/20 border-blue-500 text-blue-300"
                                  : "bg-blue-100 border-blue-400 text-blue-700"
                                : darkMode
                                ? "bg-gray-700/50 border-gray-600 hover:border-blue-500/50 text-gray-300"
                                : "bg-gray-50 border-gray-300 hover:border-blue-400 text-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="programmingLanguages"
                              value={lang}
                              checked={formData.programmingLanguages.includes(
                                lang,
                              )}
                              onChange={handleInputChange}
                              className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                            />
                            <span className="ml-2 text-xs font-medium">
                              {lang}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 2: Career Goals & Motivation */}
            {activeSection === "goalsAndMotivation" && (
              <div className="space-y-6">
                {/* Career Goals */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target
                      className={`w-5 h-5 ${
                        darkMode ? "text-yellow-400" : "text-yellow-600"
                      }`}
                    />
                    <h2
                      className={`text-lg font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Career Goals
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-3 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Target Roles <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          "Smart Contract Developer",
                          "Blockchain Engineer",
                          "DeFi Developer",
                          "AI/ML Engineer",
                          "Full-Stack Web3 Developer",
                          "Not sure yet",
                        ].map((role) => (
                          <label
                            key={role}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all border-2 text-sm ${
                              formData.targetRole.includes(role)
                                ? darkMode
                                  ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                                  : "bg-yellow-100 border-yellow-400 text-yellow-700"
                                : darkMode
                                ? "bg-gray-700/50 border-gray-600 hover:border-yellow-500/50 text-gray-300"
                                : "bg-gray-50 border-gray-300 hover:border-yellow-400 text-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="targetRole"
                              value={role}
                              checked={formData.targetRole.includes(role)}
                              onChange={handleInputChange}
                              className="w-4 h-4 rounded accent-yellow-500 cursor-pointer"
                            />
                            <span className="ml-2 font-medium">{role}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Timeline <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="careerTimeline"
                          value={formData.careerTimeline}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select timeline</option>
                          <option value="3-6">3-6 months</option>
                          <option value="6-12">6-12 months</option>
                          <option value="1-2">1-2 years</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Work Preference{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="geographicPreference"
                          value={formData.geographicPreference}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select preference</option>
                          <option value="remote">Remote</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="on-site">On-site</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div
                  className={`my-6 border-t ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                ></div>

                {/* Motivation */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Heart
                      className={`w-5 h-5 ${
                        darkMode ? "text-pink-400" : "text-pink-600"
                      }`}
                    />
                    <h2
                      className={`text-lg font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Motivation & Interests
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-3 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        What motivates you? (Select all)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          "Learning new tech",
                          "Building decentralized apps",
                          "Financial gain",
                          "Social impact",
                          "Job security",
                          "Freedom & flexibility",
                        ].map((motivation) => (
                          <label
                            key={motivation}
                            className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all border-2 text-sm ${
                              formData.primaryMotivation.includes(motivation)
                                ? darkMode
                                  ? "bg-pink-500/20 border-pink-500 text-pink-300"
                                  : "bg-pink-100 border-pink-400 text-pink-700"
                                : darkMode
                                ? "bg-gray-700/50 border-gray-600 hover:border-pink-500/50 text-gray-300"
                                : "bg-gray-50 border-gray-300 hover:border-pink-400 text-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="primaryMotivation"
                              value={motivation}
                              checked={formData.primaryMotivation.includes(
                                motivation,
                              )}
                              onChange={handleInputChange}
                              className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
                            />
                            <span className="ml-2 font-medium">
                              {motivation}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Web3 Interest
                        </label>
                        <select
                          name="webThreeInterest"
                          value={formData.webThreeInterest}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select area</option>
                          <option value="smart-contracts">
                            Smart Contracts
                          </option>
                          <option value="defi">DeFi & Protocols</option>
                          <option value="nfts">NFTs & Assets</option>
                          <option value="daos">DAOs</option>
                          <option value="all">All areas</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          AI Interest
                        </label>
                        <select
                          name="aiInterest"
                          value={formData.aiInterest}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select area</option>
                          <option value="ml-engineering">ML Engineering</option>
                          <option value="llm-apps">LLM Apps</option>
                          <option value="ai-security">AI Security</option>
                          <option value="data-science">Data Science</option>
                          <option value="all">All areas</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 3: Learning Preferences & Review */}
            {activeSection === "learningAndReview" && (
              <div className="space-y-6">
                {/* Learning Preferences */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen
                      className={`w-5 h-5 ${
                        darkMode ? "text-green-400" : "text-green-600"
                      }`}
                    />
                    <h2
                      className={`text-lg font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Learning Preferences
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Learning Style <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="learningStyle"
                          value={formData.learningStyle}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select style</option>
                          <option value="visual">Visual (Videos)</option>
                          <option value="hands-on">Hands-on (Projects)</option>
                          <option value="reading">Reading & Writing</option>
                          <option value="mentorship">Mentorship</option>
                          <option value="combination">Combination</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Time Commitment{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="timeCommitment"
                          value={formData.timeCommitment}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select hours/week</option>
                          <option value="5-10">5-10 hrs/week</option>
                          <option value="10-15">10-15 hrs/week</option>
                          <option value="15-20">15-20 hrs/week</option>
                          <option value="20+">20+ hrs/week</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Short-term Goal{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="shortTermGoal"
                          value={formData.shortTermGoal}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm ${
                            darkMode
                              ? "bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select goal</option>
                          <option value="fundamentals">
                            Master Fundamentals
                          </option>
                          <option value="portfolio">Build Portfolio</option>
                          <option value="interview-prep">Interview Prep</option>
                          <option value="first-contract">
                            Deploy Contract
                          </option>
                          <option value="explore">Explore Interest</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-3 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Strong Skills (Select all)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "Problem-solving",
                          "Communication",
                          "Leadership",
                          "Creativity",
                          "Fast learner",
                          "Teamwork",
                        ].map((skill) => (
                          <label
                            key={skill}
                            className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all border-2 text-sm ${
                              formData.strongSkills.includes(skill)
                                ? darkMode
                                  ? "bg-green-500/20 border-green-500 text-green-300"
                                  : "bg-green-100 border-green-400 text-green-700"
                                : darkMode
                                ? "bg-gray-700/50 border-gray-600 hover:border-green-500/50 text-gray-300"
                                : "bg-gray-50 border-gray-300 hover:border-green-400 text-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="strongSkills"
                              value={skill}
                              checked={formData.strongSkills.includes(skill)}
                              onChange={handleInputChange}
                              className="w-4 h-4 rounded accent-green-500 cursor-pointer"
                            />
                            <span className="ml-2 font-medium">{skill}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div
                  className={`my-6 border-t ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                ></div>

                {/* Review & Submit */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FileCheck
                      className={`w-5 h-5 ${
                        darkMode ? "text-indigo-400" : "text-indigo-600"
                      }`}
                    />
                    <h2
                      className={`text-lg font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Additional Info
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Any concerns or challenges?
                      </label>
                      <textarea
                        name="concerns"
                        value={formData.concerns}
                        onChange={handleInputChange}
                        placeholder="Tell us about any constraints..."
                        rows="3"
                        className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm resize-none ${
                          darkMode
                            ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 hover:border-blue-500/50 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-blue-400 focus:border-blue-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Anything else we should know?
                      </label>
                      <textarea
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        placeholder="Additional information..."
                        rows="3"
                        className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm resize-none ${
                          darkMode
                            ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 hover:border-blue-500/50 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-blue-400 focus:border-blue-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>

                    <label
                      className={`flex items-start p-4 rounded-lg cursor-pointer transition-all border-2 ${
                        formData.agreeToTerms
                          ? darkMode
                            ? "bg-blue-500/20 border-blue-500"
                            : "bg-blue-50 border-blue-400"
                          : darkMode
                          ? "bg-gray-700/50 border-gray-600 hover:border-blue-500/50"
                          : "bg-gray-50 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        required
                        className="w-4 h-4 rounded mt-1 accent-blue-500 cursor-pointer flex-shrink-0"
                      />
                      <span
                        className={`ml-3 text-sm font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        I agree to be part of this learning community
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div
            className={`px-6 lg:px-8 py-5 border-t ${
              darkMode
                ? "border-gray-700 bg-gray-800/30"
                : "border-gray-200 bg-gray-50"
            } flex items-center justify-between gap-4`}
          >
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isFirstSection}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                isFirstSection
                  ? darkMode
                    ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : darkMode
                  ? "bg-gray-700/50 text-white hover:bg-gray-600 border border-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <div className="flex justify-center gap-1.5">
              {sections.map((section, idx) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className={`rounded-full transition-all ${
                    activeSection === section
                      ? "w-8 h-2 bg-gradient-to-r from-blue-500 to-purple-500"
                      : idx <= currentSectionIndex
                      ? "w-2 h-2 bg-green-500"
                      : darkMode
                      ? "w-2 h-2 bg-gray-600"
                      : "w-2 h-2 bg-gray-300"
                  }`}
                  disabled={idx > currentSectionIndex}
                />
              ))}
            </div>

            {!isLastSection ? (
              <button
                type="button"
                onClick={handleNext}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white transition-all bg-gradient-to-r ${
                  darkMode
                    ? "from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
                    : "from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                } shadow-md hover:shadow-lg`}
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!formData.agreeToTerms || isSubmitting}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm text-white transition-all ${
                  formData.agreeToTerms && !isSubmitting
                    ? `bg-gradient-to-r ${
                        darkMode
                          ? "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          : "from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      } shadow-md hover:shadow-lg`
                    : "bg-gray-500 cursor-not-allowed opacity-50"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Complete
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
