import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Zap
} from 'lucide-react';
import { useDarkMode } from '../contexts/themeContext';
import { useActiveAccount } from 'thirdweb/react';

export default function CareerOnboardingForm({ userAddress }) {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const account = useActiveAccount();
  // Use prop if provided, otherwise get from hook
  const walletAddress = userAddress || account?.address;
  const [formData, setFormData] = useState({
    // Current Situation
    currentStatus: '',
    currentRole: '',
    yearsOfExperience: '',
    industryBackground: '',

    // Tech Background
    technicalLevel: '',
    programmingLanguages: [],
    hasBlockchainExp: '',
    hasAIExp: '',

    // Career Goals
    targetRole: [],
    careerTimeline: '',
    geographicPreference: '',

    // Motivation & Interests
    primaryMotivation: [],
    webThreeInterest: '',
    aiInterest: '',

    // Skills & Learning
    strongSkills: [],
    wantToImprove: [],
    learningStyle: '',
    timeCommitment: '',

    // Goals & Constraints
    shortTermGoal: '',
    concerns: '',
    additionalInfo: '',
    agreeToTerms: false,
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState('currentSituation');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox' && Array.isArray(formData[name])) {
      setFormData(prev => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter(item => item !== value)
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.currentStatus ||
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
        !formData.agreeToTerms) {
      alert('Please fill in all required fields');
      return;

    }

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
      const API_ENDPOINT = import.meta.env.VITE_CAREER_ONBOARDING_API ||
                          'http://localhost:8000/api/career-onboarding';

      // Send to backend
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Backend response:', result);

      // Show success state
      setFormSubmitted(true);

      // Navigate after delay
      setTimeout(() => {
        navigate('/mainpage?section=dashboard');
      }, 2000);

    } catch (error) {
      console.error('Form submission error:', error);
      alert(`Error submitting form: ${error.message}. Please try again.`);
      setFormSubmitted(false);
    }
  };

  const sections = [
    'currentSituation',
    'techBackground',
    'careerGoals',
    'motivation',
    'learningPrefs',
    'review'
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
        <div className={`relative rounded-3xl p-8 lg:p-12 text-center max-w-md shadow-2xl overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-blue-500/30'
            : 'bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-blue-200'
        }`}>
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl ${
              darkMode ? 'bg-blue-500/20' : 'bg-blue-400/30'
            } animate-pulse`}></div>
            <div className={`absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl ${
              darkMode ? 'bg-purple-500/20' : 'bg-purple-400/30'
            } animate-pulse delay-1000`}></div>
          </div>

          <div className="relative mb-6">
            <div className="relative inline-block mb-6">
              <div className={`absolute inset-0 rounded-full ${
                darkMode ? 'bg-blue-500/20' : 'bg-blue-400/20'
              } animate-ping`}></div>
              <CheckCircle size={80} className={`relative mx-auto ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={2.5} />
            </div>
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r ${
              darkMode
                ? 'from-blue-400 via-purple-400 to-blue-400'
                : 'from-blue-600 via-purple-600 to-blue-600'
            } bg-clip-text text-transparent`}>
              Profile Complete! 🎉
            </h2>
            <p className={`text-lg mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Your career profile has been created successfully.
            </p>
            <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Redirecting to your dashboard...
            </p>
          </div>
          <div className="relative">
            <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div className={`h-full rounded-full bg-gradient-to-r ${
                darkMode
                  ? 'from-blue-500 via-purple-500 to-blue-500'
                  : 'from-blue-500 via-purple-500 to-blue-500'
              } animate-pulse`} style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sectionIcons = {
    currentSituation: <User className="w-5 h-5" />,
    techBackground: <Code className="w-5 h-5" />,
    careerGoals: <Target className="w-5 h-5" />,
    motivation: <Heart className="w-5 h-5" />,
    learningPrefs: <BookOpen className="w-5 h-5" />,
    review: <FileCheck className="w-5 h-5" />
  };

  const sectionTitles = {
    currentSituation: 'Current Situation',
    techBackground: 'Technical Background',
    careerGoals: 'Career Goals',
    motivation: 'Motivation & Interests',
    learningPrefs: 'Learning Preferences',
    review: 'Review & Submit'
  };

  return (
    <div className="py-6 lg:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with gradient */}
        <div className="text-center mb-8 lg:mb-10 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-64 h-64 rounded-full blur-3xl opacity-20 ${
              darkMode ? 'bg-blue-500' : 'bg-blue-400'
            }`}></div>
          </div>
          <div className="relative">
            <div className="inline-flex items-center justify-center mb-4">
              <Sparkles className={`w-8 h-8 mr-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
              <h1 className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r ${
                darkMode
                  ? 'from-blue-400 via-purple-400 to-blue-400'
                  : 'from-blue-600 via-purple-600 to-blue-600'
              } bg-clip-text text-transparent`}>
                Career Onboarding
              </h1>
              <Sparkles className={`w-8 h-8 ml-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </div>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Help us understand your background and career goals
            </p>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {sectionIcons[activeSection]}
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {sectionTitles[activeSection]}
              </span>
            </div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              darkMode
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-100 text-blue-700'
            }`}>
              Step {currentSectionIndex + 1} of {sections.length}
            </span>
          </div>
          <div className={`h-3 rounded-full overflow-hidden shadow-inner ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-200'
          }`}>
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                darkMode
                  ? 'from-blue-500 via-purple-500 to-blue-500'
                  : 'from-blue-500 via-purple-500 to-blue-500'
              } shadow-lg`}
              style={{ width: `${((currentSectionIndex + 1) / sections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form with enhanced styling */}
        <form className={`relative rounded-3xl p-6 lg:p-10 shadow-2xl overflow-hidden ${
          darkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-blue-500/30'
            : 'bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border border-blue-200/50'
        }`}>
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 ${
              darkMode ? 'bg-blue-500' : 'bg-blue-400'
            }`}></div>
            <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10 ${
              darkMode ? 'bg-purple-500' : 'bg-purple-400'
            }`}></div>
          </div>
          <div className="relative">
        {/* CURRENT SITUATION SECTION */}
        {activeSection === 'currentSituation' && (
          <div className="space-y-6 transition-all duration-300 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${
                darkMode
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Briefcase className="w-6 h-6" />
              </div>
              <h2 className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r ${
                darkMode
                  ? 'from-blue-400 to-purple-400'
                  : 'from-blue-600 to-purple-600'
              } bg-clip-text text-transparent`}>
                Current Situation
              </h2>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <TrendingUp className="w-4 h-4" />
                What is your current status? <span className="text-red-400">*</span>
              </label>
              <select
                name="currentStatus"
                value={formData.currentStatus}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select your status</option>
                <option value="student">Student</option>
                <option value="employed">Employed (Full-time)</option>
                <option value="employed-part">Employed (Part-time)</option>
                <option value="career-change">Career Change</option>
                <option value="unemployed">Unemployed</option>
                <option value="freelancer">Freelancer/Self-employed</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Current/Most Recent Role
              </label>
              <input
                type="text"
                name="currentRole"
                value={formData.currentRole}
                onChange={handleInputChange}
                placeholder="e.g., Software Engineer, Data Analyst, etc."
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-blue-400 shadow-sm'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <TrendingUp className="w-4 h-4" />
                Years of Professional Experience
              </label>
              <select
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select experience level</option>
                <option value="0">0 years (Just starting)</option>
                <option value="1">0-1 years</option>
                <option value="2">1-2 years</option>
                <option value="3">2-3 years</option>
                <option value="5">3-5 years</option>
                <option value="10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <GraduationCap className="w-4 h-4" />
                Industry Background <span className="text-red-400">*</span>
              </label>
              <select
                name="industryBackground"
                value={formData.industryBackground}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select your background</option>
                <option value="tech">Tech/Software</option>
                <option value="finance">Finance</option>
                <option value="business">Business/Entrepreneurship</option>
                <option value="science">Science/Engineering</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
                <option value="none">No professional background</option>
              </select>
            </div>
          </div>
        )}

        {/* TECH BACKGROUND SECTION */}
        {activeSection === 'techBackground' && (
          <div className="space-y-6 transition-all duration-300 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${
                darkMode
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                <Code className="w-6 h-6" />
              </div>
              <h2 className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r ${
                darkMode
                  ? 'from-purple-400 to-blue-400'
                  : 'from-purple-600 to-blue-600'
              } bg-clip-text text-transparent`}>
                Technical Background
              </h2>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Zap className="w-4 h-4" />
                Technical Level <span className="text-red-400">*</span>
              </label>
              <select
                name="technicalLevel"
                value={formData.technicalLevel}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select your level</option>
                <option value="beginner">Beginner (No coding experience)</option>
                <option value="beginner-learning">Beginner (Currently learning)</option>
                <option value="intermediate">Intermediate (Can build basic projects)</option>
                <option value="advanced">Advanced (Professional experience)</option>
                <option value="expert">Expert (10+ years)</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Programming Languages (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['JavaScript/TypeScript', 'Python', 'Solidity', 'Go', 'Rust', 'Java', 'C++', 'Other'].map(lang => (
                  <label key={lang} className={`group flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    formData.programmingLanguages.includes(lang)
                      ? darkMode
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/20'
                        : 'bg-blue-100 border-blue-400 text-blue-700 shadow-md'
                      : darkMode
                        ? 'bg-gray-700/50 border-gray-600 hover:border-purple-500/50 hover:bg-gray-700 text-gray-300'
                        : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 shadow-sm'
                  }`}>
                    <input
                      type="checkbox"
                      name="programmingLanguages"
                      value={lang}
                      checked={formData.programmingLanguages.includes(lang)}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium">{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Code className="w-4 h-4" />
                Blockchain Experience <span className="text-red-400">*</span>
              </label>
              <select
                name="hasBlockchainExp"
                value={formData.hasBlockchainExp}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select option</option>
                <option value="no">No experience</option>
                <option value="minimal">Minimal (Read about it)</option>
                <option value="hands-on">Hands-on experience</option>
                <option value="professional">Professional experience</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Zap className="w-4 h-4" />
                AI/ML Experience <span className="text-red-400">*</span>
              </label>
              <select
                name="hasAIExp"
                value={formData.hasAIExp}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select option</option>
                <option value="no">No experience</option>
                <option value="minimal">Minimal (Used AI tools like ChatGPT)</option>
                <option value="hands-on">Hands-on experience</option>
                <option value="professional">Professional experience</option>
              </select>
            </div>
          </div>
        )}

        {/* CAREER GOALS SECTION */}
        {activeSection === 'careerGoals' && (
          <div className="space-y-6 transition-all duration-300 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${
                darkMode
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                <Target className="w-6 h-6" />
              </div>
              <h2 className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r ${
                darkMode
                  ? 'from-yellow-400 to-orange-400'
                  : 'from-yellow-600 to-orange-600'
              } bg-clip-text text-transparent`}>
                Career Goals & Preferences
              </h2>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Target Roles (Select all that apply) <span className="text-blue-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Smart Contract Developer',
                  'Blockchain Engineer',
                  'DeFi Developer',
                  'Blockchain Analyst',
                  'AI/ML Engineer',
                  'Full-Stack Web3 Developer',
                  'Security Auditor',
                  'Product Manager',
                  'Not sure yet'
                ].map(role => (
                  <label key={role} className={`group flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    formData.targetRole.includes(role)
                      ? darkMode
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 shadow-lg shadow-yellow-500/20'
                        : 'bg-yellow-100 border-yellow-400 text-yellow-700 shadow-md'
                      : darkMode
                        ? 'bg-gray-700/50 border-gray-600 hover:border-yellow-500/50 hover:bg-gray-700 text-gray-300'
                        : 'bg-white border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 text-gray-700 shadow-sm'
                  }`}>
                    <input
                      type="checkbox"
                      name="targetRole"
                      value={role}
                      checked={formData.targetRole.includes(role)}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded accent-yellow-500 cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <TrendingUp className="w-4 h-4" />
                Timeline to Achieve Career Goal <span className="text-red-400">*</span>
              </label>
              <select
                name="careerTimeline"
                value={formData.careerTimeline}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select timeline</option>
                <option value="3-6">3-6 months</option>
                <option value="6-12">6-12 months</option>
                <option value="1-2">1-2 years</option>
                <option value="flexible">Flexible/No deadline</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Briefcase className="w-4 h-4" />
                Work Preference <span className="text-red-400">*</span>
              </label>
              <select
                name="geographicPreference"
                value={formData.geographicPreference}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select preference</option>
                <option value="remote">Remote only</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
                <option value="flexible">Flexible/Open</option>
              </select>
            </div>
          </div>
        )}

        {/* MOTIVATION & INTERESTS SECTION */}
        {activeSection === 'motivation' && (
          <div className="space-y-6 transition-all duration-300 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${
                darkMode
                  ? 'bg-pink-500/20 text-pink-400'
                  : 'bg-pink-100 text-pink-600'
              }`}>
                <Heart className="w-6 h-6" />
              </div>
              <h2 className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r ${
                darkMode
                  ? 'from-pink-400 to-red-400'
                  : 'from-pink-600 to-red-600'
              } bg-clip-text text-transparent`}>
                Motivation & Interests
              </h2>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                What motivates you most? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Learning new technologies',
                  'Building decentralized applications',
                  'Potential financial gain',
                  'Making a social impact',
                  'Job security & opportunities',
                  'Freedom & flexibility'
                ].map(motivation => (
                  <label key={motivation} className={`group flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    formData.primaryMotivation.includes(motivation)
                      ? darkMode
                        ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-lg shadow-pink-500/20'
                        : 'bg-pink-100 border-pink-400 text-pink-700 shadow-md'
                      : darkMode
                        ? 'bg-gray-700/50 border-gray-600 hover:border-pink-500/50 hover:bg-gray-700 text-gray-300'
                        : 'bg-white border-gray-200 hover:border-pink-300 hover:bg-pink-50 text-gray-700 shadow-sm'
                  }`}>
                    <input
                      type="checkbox"
                      name="primaryMotivation"
                      value={motivation}
                      checked={formData.primaryMotivation.includes(motivation)}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded accent-pink-500 cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium">{motivation}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Code className="w-4 h-4" />
                Web3 Area of Greatest Interest
              </label>
              <select
                name="webThreeInterest"
                value={formData.webThreeInterest}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select an area</option>
                <option value="smart-contracts">Smart Contracts</option>
                <option value="defi">DeFi & Protocols</option>
                <option value="nfts">NFTs & Digital Assets</option>
                <option value="daos">DAOs & Governance</option>
                <option value="infrastructure">Infrastructure & L2s</option>
                <option value="security">Security & Auditing</option>
                <option value="all">Interested in all areas</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Zap className="w-4 h-4" />
                AI Area of Greatest Interest
              </label>
              <select
                name="aiInterest"
                value={formData.aiInterest}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select an area</option>
                <option value="ml-engineering">ML Engineering</option>
                <option value="llm-apps">LLM Applications</option>
                <option value="ai-security">AI Security</option>
                <option value="data-science">Data Science</option>
                <option value="ai-agents">AI Agents</option>
                <option value="all">Interested in all areas</option>
              </select>
            </div>
          </div>
        )}

        {/* LEARNING PREFERENCES SECTION */}
        {activeSection === 'learningPrefs' && (
          <div className="space-y-6 transition-all duration-300 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${
                darkMode
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-green-100 text-green-600'
              }`}>
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r ${
                darkMode
                  ? 'from-green-400 to-emerald-400'
                  : 'from-green-600 to-emerald-600'
              } bg-clip-text text-transparent`}>
                Learning Style & Commitment
              </h2>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Your Strong Skills (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Problem-solving',
                  'Communication',
                  'Leadership',
                  'Creativity',
                  'Attention to detail',
                  'Fast learner',
                  'Teamwork',
                  'Self-discipline'
                ].map(skill => (
                  <label key={skill} className={`group flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    formData.strongSkills.includes(skill)
                      ? darkMode
                        ? 'bg-green-500/20 border-green-500 text-green-300 shadow-lg shadow-green-500/20'
                        : 'bg-green-100 border-green-400 text-green-700 shadow-md'
                      : darkMode
                        ? 'bg-gray-700/50 border-gray-600 hover:border-green-500/50 hover:bg-gray-700 text-gray-300'
                        : 'bg-white border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 shadow-sm'
                  }`}>
                    <input
                      type="checkbox"
                      name="strongSkills"
                      value={skill}
                      checked={formData.strongSkills.includes(skill)}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded accent-green-500 cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Skills You Want to Improve (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Technical skills',
                  'Project management',
                  'Communication',
                  'Business acumen',
                  'Networking',
                  'Time management',
                  'Leadership'
                ].map(skill => (
                  <label key={skill} className={`group flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    formData.wantToImprove.includes(skill)
                      ? darkMode
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/20'
                        : 'bg-cyan-100 border-cyan-400 text-cyan-700 shadow-md'
                      : darkMode
                        ? 'bg-gray-700/50 border-gray-600 hover:border-cyan-500/50 hover:bg-gray-700 text-gray-300'
                        : 'bg-white border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 text-gray-700 shadow-sm'
                  }`}>
                    <input
                      type="checkbox"
                      name="wantToImprove"
                      value={skill}
                      checked={formData.wantToImprove.includes(skill)}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <BookOpen className="w-4 h-4" />
                Preferred Learning Style <span className="text-red-400">*</span>
              </label>
              <select
                name="learningStyle"
                value={formData.learningStyle}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select your style</option>
                <option value="visual">Visual (videos, diagrams)</option>
                <option value="hands-on">Hands-on (projects, coding)</option>
                <option value="reading">Reading & writing</option>
                <option value="mentorship">Mentorship & discussion</option>
                <option value="combination">Combination of methods</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <TrendingUp className="w-4 h-4" />
                Weekly Time Commitment <span className="text-red-400">*</span>
              </label>
              <select
                name="timeCommitment"
                value={formData.timeCommitment}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select commitment</option>
                <option value="5-10">5-10 hours/week</option>
                <option value="10-15">10-15 hours/week</option>
                <option value="15-20">15-20 hours/week</option>
                <option value="20+">20+ hours/week</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Target className="w-4 h-4" />
                Short-term Goal (Next 3 months) <span className="text-red-400">*</span>
              </label>
              <select
                name="shortTermGoal"
                value={formData.shortTermGoal}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">Select a goal</option>
                <option value="fundamentals">Master fundamentals</option>
                <option value="portfolio">Build portfolio projects</option>
                <option value="interview-prep">Prepare for interviews</option>
                <option value="first-contract">Deploy first smart contract</option>
                <option value="certification">Get certified</option>
                <option value="explore">Explore & discover interest</option>
              </select>
            </div>
          </div>
        )}

        {/* REVIEW SECTION */}
        {activeSection === 'review' && (
          <div className="space-y-6 transition-all duration-300 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${
                darkMode
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-indigo-100 text-indigo-600'
              }`}>
                <FileCheck className="w-6 h-6" />
              </div>
              <h2 className={`text-2xl lg:text-3xl font-bold bg-gradient-to-r ${
                darkMode
                  ? 'from-indigo-400 to-purple-400'
                  : 'from-indigo-600 to-purple-600'
              } bg-clip-text text-transparent`}>
                Review & Submit
              </h2>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Any Concerns or Challenges?
              </label>
              <textarea
                name="concerns"
                value={formData.concerns}
                onChange={handleInputChange}
                placeholder="Share any concerns, constraints, or challenges you think we should know about..."
                rows="4"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-blue-400 shadow-sm'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Anything Else We Should Know?
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                placeholder="Any additional information that might help us personalize your learning path..."
                rows="4"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none ${
                  darkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 hover:border-blue-500/50'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-blue-400 shadow-sm'
                }`}
              />
            </div>

            <label className={`flex items-start p-5 rounded-xl cursor-pointer transition-all border-2 ${
              formData.agreeToTerms
                ? darkMode
                  ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'bg-blue-50 border-blue-400 shadow-md'
                : darkMode
                  ? 'bg-gray-700/50 border-gray-600 hover:border-blue-500/50 hover:bg-gray-700'
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 shadow-sm'
            }`}>
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                required
                className="w-5 h-5 rounded mt-0.5 accent-blue-500 cursor-pointer flex-shrink-0"
              />
              <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                I agree to be part of this learning community and understand my data will be used to personalize my learning experience
              </span>
            </label>

            {/* Review Summary */}
            <div className={`rounded-2xl p-6 border-2 backdrop-blur-sm ${
              darkMode
                ? 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 border-indigo-500/30 shadow-xl shadow-indigo-500/10'
                : 'bg-gradient-to-br from-blue-50/80 to-purple-50/80 border-indigo-200 shadow-xl'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Summary of Your Profile
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl border ${
                  darkMode
                    ? 'bg-gray-600/50 border-gray-500'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <p className={`text-xs font-semibold mb-2 flex items-center gap-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <User className="w-3 h-3" /> Name
                  </p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {formData.fullName || 'Not provided'}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${
                  darkMode
                    ? 'bg-gray-600/50 border-gray-500'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <p className={`text-xs font-semibold mb-2 flex items-center gap-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Briefcase className="w-3 h-3" /> Status
                  </p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {formData.currentStatus || 'Not selected'}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${
                  darkMode
                    ? 'bg-gray-600/50 border-gray-500'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <p className={`text-xs font-semibold mb-2 flex items-center gap-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Code className="w-3 h-3" /> Tech Level
                  </p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {formData.technicalLevel || 'Not selected'}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${
                  darkMode
                    ? 'bg-gray-600/50 border-gray-500'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <p className={`text-xs font-semibold mb-2 flex items-center gap-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Target className="w-3 h-3" /> Target Role
                  </p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {formData.targetRole.length > 0 ? formData.targetRole.join(', ') : 'Not selected'}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${
                  darkMode
                    ? 'bg-gray-600/50 border-gray-500'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <p className={`text-xs font-semibold mb-2 flex items-center gap-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <TrendingUp className="w-3 h-3" /> Timeline
                  </p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {formData.careerTimeline || 'Not selected'}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${
                  darkMode
                    ? 'bg-gray-600/50 border-gray-500'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <p className={`text-xs font-semibold mb-2 flex items-center gap-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <BookOpen className="w-3 h-3" /> Time Commitment
                  </p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {formData.timeCommitment || 'Not selected'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

          </div>
        </form>

        {/* FORM NAVIGATION */}
        <div className={`mt-8 pt-6 border-t-2 flex flex-col sm:flex-row justify-between items-center gap-6 ${
          darkMode ? 'border-gray-700/50' : 'border-gray-300'
        }`}>
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isFirstSection}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              isFirstSection
                ? darkMode
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border-2 border-gray-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-300'
                : darkMode
                ? 'bg-gray-700/50 text-white hover:bg-gray-600 border-2 border-gray-600 hover:border-blue-500/50 shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-300 hover:border-blue-400 shadow-md'
            }`}
          >
            <ArrowLeft size={18} />
            <span>Previous</span>
          </button>

          <div className="flex justify-center gap-2">
            {sections.map((section, idx) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  activeSection === section
                    ? 'w-12 bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg'
                    : idx <= currentSectionIndex
                    ? 'w-3 bg-green-500 hover:w-4'
                    : darkMode
                    ? 'w-3 bg-gray-600 hover:bg-gray-500'
                    : 'w-3 bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Section ${idx + 1}`}
              />
            ))}
          </div>

          {!isLastSection ? (
            <button
              type="button"
              onClick={handleNext}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 bg-gradient-to-r ${
                darkMode
                  ? 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  : 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
              } shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              <span>Next</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}

              disabled={!formData.agreeToTerms}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                formData.agreeToTerms
                  ? `bg-gradient-to-r ${
                      darkMode
                        ? 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                    } shadow-lg hover:shadow-xl transform hover:scale-105`
                  : 'bg-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                Complete Assessment
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
