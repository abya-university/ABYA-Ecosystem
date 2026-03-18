import React, { useState, useContext } from "react";
import { CourseContext } from "../../contexts/courseContext";
import { ChapterContext } from "../../contexts/chapterContext";
import { LessonContext } from "../../contexts/lessonContext";
import { QuizContext } from "../../contexts/quizContext";
import {
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  FileJson,
  Edit3,
  Save,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Terminal,
  Play,
  RefreshCw,
  Download,
  Copy,
  Eye,
  EyeOff,
  Settings,
  Code,
  List,
  Grid,
  Sparkles,
  Zap,
  Shield,
  Book,
} from "lucide-react";
import { useDarkMode } from "../../contexts/themeContext";
import { toast } from "react-toastify";

// Convert price string to USDC units (preserves decimals)
const parsePriceToUSDCUnits = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return 0;
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  const dollars = Number.parseInt(wholePart, 10);
  const cents = Number.parseInt(`${fractionalPart}00`.slice(0, 2), 10);

  if (!Number.isFinite(dollars) || !Number.isFinite(cents)) {
    return null;
  }

  const totalCents = dollars * 100 + cents;
  return totalCents * 10000;
};

const isValidDurationInWeeks = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }

  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  return /^(\d+)(?:\s*weeks?)?$/i.test(trimmed);
};

const ACCEPTABLE_COURSE_JSON_TEMPLATE = {
  course: {
    name: "DeFi Fundamentals",
    description: "Learn AMMs, DEXs, and liquidity mechanics.",
    difficultyLevel: 1, //(0 - Beginner, 1 - Intermediate, 2 - Advanced),
    priceUSDCUnits: "89.60",
    imageUrl: "https://example.com/course-image.png",
    chapters: [
      {
        name: "Introduction to DeFi",
        duration: "2", // Duration in weeks (can also be "2 weeks")
        lessons: [
          {
            name: "Introduction to Uniswap and AMMs",
            content: "Uniswap uses constant product market makers...",
            quizzes: [
              {
                title: "AMM Basics",
                questions: [
                  {
                    question: "What formula is used in constant product AMMs?",
                    options: ["x + y = k", "x * y = k", "x - y = k"],
                    correctIndex: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

// Template with comments preserved for UI display
const TEMPLATE_STRING_WITH_COMMENTS = `{
  "course": {
    "name": "DeFi Fundamentals",
    "description": "Learn AMMs, DEXs, and liquidity mechanics.",
    "difficultyLevel": 1,  // (0 - Beginner, 1 - Intermediate, 2 - Advanced)
    "priceUSDCUnits": "89.60",  // Price in USD (e.g., "89.60" for $89.60)
    "imageUrl": "https://example.com/course-image.png",
    "chapters": [
      {
        "name": "Introduction to DeFi",
        "duration": "2",  // Duration in weeks (can also be "2 weeks")
        "lessons": [
          {
            "name": "Introduction to Uniswap and AMMs",
            "content": "Uniswap uses constant product market makers...",
            "quizzes": [
              {
                "title": "AMM Basics",
                "questions": [
                  {
                    "question": "What formula is used in constant product AMMs?",
                    "options": ["x + y = k", "x * y = k", "x - y = k"],
                    "correctIndex": 1  // Zero-based index of the correct answer
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}`;

const BulkCourseUpload = ({ onBack }) => {
  const { darkMode } = useDarkMode();
  const { createCourse } = useContext(CourseContext);
  const { createChapters } = useContext(ChapterContext);
  const { createLesson } = useContext(LessonContext);
  const { createQuiz, createQuestionWithChoices } = useContext(QuizContext);

  const [jsonFile, setJsonFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [viewMode, setViewMode] = useState("preview"); // 'preview' or 'json'
  const [courseImageFile, setCourseImageFile] = useState(null);
  const [courseImagePreview, setCourseImagePreview] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [progress, setProgress] = useState({
    currentStep: "",
    percentage: 0,
    logs: [],
    completed: false,
    failed: false,
    startTime: null,
    endTime: null,
  });

  // Toggle section expansion
  const toggleSection = (path) => {
    setExpandedSections((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Modern card styles
  const cardStyle = darkMode
    ? "bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 text-gray-100"
    : "bg-gradient-to-br from-white to-gray-50 border-gray-200 text-gray-900";

  const glassCardStyle = darkMode
    ? "bg-gray-800/40 backdrop-blur-xl border-gray-700/30 text-gray-100"
    : "bg-white/70 backdrop-blur-xl border-gray-200/50 text-gray-900";

  const terminalStyle = darkMode
    ? "bg-gray-950 text-green-400 border-gray-800"
    : "bg-gray-900 text-green-400 border-gray-700";

  // Editable field component
  const EditableField = ({
    value,
    onChange,
    type = "text",
    className = "",
    label,
  }) => (
    <div className="relative group">
      {label && (
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </label>
      )}
      {isEditing ? (
        type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${className}`}
            rows={3}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${className}`}
          />
        )
      ) : (
        <div
          className="px-3 py-2 rounded-lg border border-transparent bg-gray-50 dark:bg-gray-800/50 group-hover:border-indigo-300 dark:group-hover:border-indigo-600 transition-all cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          {value || (
            <span className="text-gray-400 dark:text-gray-500 italic">
              Click to edit
            </span>
          )}
        </div>
      )}
    </div>
  );

  // JSON Schema validation
  const validateJSON = (data) => {
    const errors = [];

    if (!data.course) {
      errors.push('Missing "course" object in root');
      return errors;
    }

    const { course } = data;

    if (!course.name || typeof course.name !== "string") {
      errors.push("Course name is required and must be a string");
    }
    if (!course.description || typeof course.description !== "string") {
      errors.push("Course description is required and must be a string");
    }
    if (
      course.difficultyLevel === undefined ||
      ![0, 1, 2].includes(course.difficultyLevel)
    ) {
      errors.push(
        "Difficulty level must be 0 (Beginner), 1 (Intermediate), or 2 (Advanced)",
      );
    }
    if (
      course.priceUSDCUnits === undefined ||
      course.priceUSDCUnits === null ||
      course.priceUSDCUnits === ""
    ) {
      errors.push("Price is required (e.g., 89.60 for $89.60)");
    } else if (typeof course.priceUSDCUnits === "string") {
      const parsed = parsePriceToUSDCUnits(course.priceUSDCUnits);
      if (parsed === null) {
        errors.push("Price must be a valid number (e.g., 89.60)");
      }
    } else if (typeof course.priceUSDCUnits !== "number") {
      errors.push("Price must be a number or valid price string");
    }
    if (!course.imageUrl || typeof course.imageUrl !== "string") {
      errors.push("Course image URL is required");
    }

    if (
      !course.chapters ||
      !Array.isArray(course.chapters) ||
      course.chapters.length === 0
    ) {
      errors.push("At least one chapter is required");
    } else {
      course.chapters.forEach((chapter, chapterIndex) => {
        if (!chapter.name || typeof chapter.name !== "string") {
          errors.push(`Chapter ${chapterIndex + 1}: name is required`);
        }
        if (!isValidDurationInWeeks(chapter.duration)) {
          errors.push(
            `Chapter ${
              chapterIndex + 1
            }: duration is required in weeks (e.g., 4 or \"4 weeks\")`,
          );
        }

        if (
          !chapter.lessons ||
          !Array.isArray(chapter.lessons) ||
          chapter.lessons.length === 0
        ) {
          errors.push(
            `Chapter ${chapterIndex + 1}: at least one lesson is required`,
          );
        } else {
          chapter.lessons.forEach((lesson, lessonIndex) => {
            if (!lesson.name || typeof lesson.name !== "string") {
              errors.push(
                `Chapter ${chapterIndex + 1}, Lesson ${
                  lessonIndex + 1
                }: name is required`,
              );
            }
            if (!lesson.content || typeof lesson.content !== "string") {
              errors.push(
                `Chapter ${chapterIndex + 1}, Lesson ${
                  lessonIndex + 1
                }: content is required`,
              );
            }

            if (lesson.quizzes && Array.isArray(lesson.quizzes)) {
              lesson.quizzes.forEach((quiz, quizIndex) => {
                if (!quiz.title || typeof quiz.title !== "string") {
                  errors.push(
                    `Chapter ${chapterIndex + 1}, Lesson ${
                      lessonIndex + 1
                    }, Quiz ${quizIndex + 1}: title is required`,
                  );
                }
                if (
                  !quiz.questions ||
                  !Array.isArray(quiz.questions) ||
                  quiz.questions.length === 0
                ) {
                  errors.push(
                    `Chapter ${chapterIndex + 1}, Lesson ${
                      lessonIndex + 1
                    }, Quiz ${
                      quizIndex + 1
                    }: at least one question is required`,
                  );
                } else {
                  quiz.questions.forEach((question, qIndex) => {
                    if (
                      !question.question ||
                      typeof question.question !== "string"
                    ) {
                      errors.push(
                        `Quiz ${quizIndex + 1}, Question ${
                          qIndex + 1
                        }: question text is required`,
                      );
                    }
                    if (
                      !question.options ||
                      !Array.isArray(question.options) ||
                      question.options.length < 2
                    ) {
                      errors.push(
                        `Quiz ${quizIndex + 1}, Question ${
                          qIndex + 1
                        }: at least 2 options are required`,
                      );
                    }
                    if (
                      question.correctIndex === undefined ||
                      typeof question.correctIndex !== "number" ||
                      question.correctIndex < 0 ||
                      question.correctIndex >= (question.options?.length || 0)
                    ) {
                      errors.push(
                        `Quiz ${quizIndex + 1}, Question ${
                          qIndex + 1
                        }: valid correctIndex is required`,
                      );
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    return errors;
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setValidationErrors(["Please upload a valid JSON file"]);
      return;
    }

    setJsonFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const errors = validateJSON(json);

        if (courseImagePreview?.startsWith("blob:")) {
          URL.revokeObjectURL(courseImagePreview);
        }
        setCourseImageFile(null);
        setCourseImagePreview("");

        if (errors.length > 0) {
          setValidationErrors(errors);
          setParsedData(null);
          setShowPreview(false);
          toast.error("Validation failed. Check errors below.");
        } else {
          setParsedData(json);
          setValidationErrors([]);
          setShowPreview(true);
          toast.success("JSON validated successfully!");
        }
      } catch (error) {
        setValidationErrors([`Invalid JSON format: ${error.message}`]);
        setParsedData(null);
        setShowPreview(false);
        toast.error("Invalid JSON format");
      }
    };

    reader.readAsText(file);
  };

  const handleCourseImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (courseImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(courseImagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setCourseImageFile(file);
    setCourseImagePreview(previewUrl);
    toast.success("Course image selected.");
  };

  // Update course data
  const updateCourseData = (path, value) => {
    setParsedData((prev) => {
      const newData = { ...prev };
      const parts = path.split(".");
      let current = newData;

      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;

      return newData;
    });
  };

  // Add log entry with timestamp
  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      message,
      type,
      timestamp,
      icon:
        type === "error"
          ? "❌"
          : type === "success"
          ? "✅"
          : type === "warning"
          ? "⚠️"
          : "ℹ️",
    };

    setProgress((prev) => ({
      ...prev,
      logs: [...prev.logs, logEntry],
    }));

    // Also show toast for important messages
    if (type === "error") {
      toast.error(message);
    } else if (type === "success") {
      toast.success(message);
    } else if (type === "warning") {
      toast.warning(message);
    }
  };

  // Calculate total steps
  const calculateTotalSteps = (data) => {
    let steps = 1; // Course creation
    steps += 1; // Chapters creation (bulk)

    data.course.chapters.forEach((chapter) => {
      steps += chapter.lessons.length; // Lesson creation
      chapter.lessons.forEach((lesson) => {
        if (lesson.quizzes) {
          lesson.quizzes.forEach((quiz) => {
            steps += 1; // Quiz creation
            steps += quiz.questions.length; // Question creation
          });
        }
      });
    });

    return steps;
  };

  // Format time
  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Execute bulk upload
  const executeBulkUpload = async () => {
    if (!parsedData) return;

    setIsUploading(true);
    setShowTerminal(true);
    setTerminalExpanded(true);

    const startTime = Date.now();
    setProgress({
      currentStep: "Initializing deployment...",
      percentage: 0,
      logs: [],
      completed: false,
      failed: false,
      startTime,
      endTime: null,
    });

    addLog("🚀 Starting bulk course deployment...", "info");
    addLog(`📋 Course: "${parsedData.course.name}"`, "info");
    addLog(`📊 Total steps: ${calculateTotalSteps(parsedData)}`, "info");
    addLog("🔍 Validating structure...", "info");

    const totalSteps = calculateTotalSteps(parsedData);
    let currentStepNumber = 0;

    const updateProgress = (step, percentage) => {
      setProgress((prev) => ({
        ...prev,
        currentStep: step,
        percentage,
      }));
    };

    try {
      const { course } = parsedData;

      if (!courseImageFile) {
        throw new Error(
          "Please select a course image in preview before deployment.",
        );
      }

      // Step 1: Create Course
      addLog("📚 Creating course on blockchain...", "info");
      updateProgress(
        "Deploying course contract",
        Math.round((currentStepNumber / totalSteps) * 100),
      );

      const priceUSDCUnits = parsePriceToUSDCUnits(course.priceUSDCUnits);
      if (priceUSDCUnits === null) {
        throw new Error("Invalid price format. Use format like 89.60");
      }

      const courseResult = await createCourse({
        name: course.name,
        description: course.description,
        difficultyLevel: course.difficultyLevel,
        priceUSDCUnits: priceUSDCUnits,
        imageFile: courseImageFile,
      });

      if (!courseResult || !courseResult.courseId) {
        throw new Error("Failed to create course - no course ID returned");
      }

      const courseId = courseResult.courseId;
      currentStepNumber += 1;
      addLog(`✅ Course deployed successfully (ID: ${courseId})`, "success");

      // Step 2: Create Chapters
      addLog(`📖 Creating ${course.chapters.length} chapters...`, "info");
      updateProgress(
        "Creating chapters",
        Math.round((currentStepNumber / totalSteps) * 100),
      );

      const chapterNames = course.chapters.map((ch) => ch.name);
      const chapterDurations = course.chapters.map((ch) => ch.duration);

      const chaptersResult = await createChapters(
        courseId,
        chapterNames,
        chapterDurations,
      );

      if (!chaptersResult || !chaptersResult.chapterIds) {
        throw new Error("Failed to create chapters");
      }

      const chapterIds = chaptersResult.chapterIds;
      currentStepNumber += 1;
      addLog(
        `✅ ${chapterIds.length} chapters created successfully`,
        "success",
      );

      // Step 3+: Create Lessons, Quizzes, Questions
      for (
        let chapterIndex = 0;
        chapterIndex < course.chapters.length;
        chapterIndex++
      ) {
        const chapter = course.chapters[chapterIndex];
        const chapterId = chapterIds[chapterIndex];

        addLog(
          `\n📝 Processing Chapter ${chapterIndex + 1}: "${chapter.name}"`,
          "info",
        );

        for (
          let lessonIndex = 0;
          lessonIndex < chapter.lessons.length;
          lessonIndex++
        ) {
          const lesson = chapter.lessons[lessonIndex];

          // Create Lesson
          addLog(`  ⚙️ Creating lesson: "${lesson.name}"`, "info");
          updateProgress(
            `Chapter ${chapterIndex + 1} - Lesson ${lessonIndex + 1}`,
            Math.round((currentStepNumber / totalSteps) * 100),
          );

          const lessonResult = await createLesson(
            chapterId,
            lesson.name,
            lesson.content,
          );

          if (!lessonResult || !lessonResult.lessonId) {
            throw new Error(`Failed to create lesson: ${lesson.name}`);
          }

          const lessonId = lessonResult.lessonId;
          currentStepNumber += 1;
          addLog(`  ✅ Lesson created (ID: ${lessonId})`, "success");

          // Create Quizzes
          if (lesson.quizzes && lesson.quizzes.length > 0) {
            for (
              let quizIndex = 0;
              quizIndex < lesson.quizzes.length;
              quizIndex++
            ) {
              const quiz = lesson.quizzes[quizIndex];

              addLog(`    📝 Creating quiz: "${quiz.title}"`, "info");
              updateProgress(
                `Quiz: ${quiz.title}`,
                Math.round((currentStepNumber / totalSteps) * 100),
              );

              const quizResult = await createQuiz(lessonId, quiz.title);

              if (!quizResult || !quizResult.quizId) {
                throw new Error(`Failed to create quiz: ${quiz.title}`);
              }

              const quizId = quizResult.quizId;
              currentStepNumber += 1;
              addLog(`    ✅ Quiz created (ID: ${quizId})`, "success");

              // Create Questions
              for (let qIndex = 0; qIndex < quiz.questions.length; qIndex++) {
                const question = quiz.questions[qIndex];

                addLog(`      ❓ Adding question ${qIndex + 1}...`, "info");
                updateProgress(
                  `Quiz ${quizIndex + 1} - Question ${qIndex + 1}`,
                  Math.round((currentStepNumber / totalSteps) * 100),
                );

                await createQuestionWithChoices(
                  quizId,
                  question.question,
                  question.options,
                  question.correctIndex,
                );

                currentStepNumber += 1;
                addLog(`      ✅ Question added`, "success");
              }
            }
          }
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Completion
      updateProgress("Deployment Complete!", 100);
      addLog(
        "\n🎉✨ BULK COURSE DEPLOYMENT COMPLETED SUCCESSFULLY! ✨🎉",
        "success",
      );
      addLog(`⏱️ Total time: ${formatTime(duration)}`, "info");
      addLog(
        `📚 Course URL: https://app.yourplatform.com/courses/${courseId}`,
        "info",
      );

      setProgress((prev) => ({
        ...prev,
        completed: true,
        endTime,
      }));

      toast.success("Course deployed successfully!");
    } catch (error) {
      const endTime = Date.now();
      addLog(`❌ ERROR: ${error.message}`, "error");
      addLog(
        "🔧 Deployment failed. Check the error above and try again.",
        "error",
      );

      setProgress((prev) => ({
        ...prev,
        failed: true,
        endTime,
        currentStep: "Deployment Failed",
      }));

      console.error("Bulk upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Reset state
  const handleReset = () => {
    setJsonFile(null);
    setParsedData(null);
    setValidationErrors([]);
    setShowPreview(false);
    setIsEditing(false);
    if (courseImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(courseImagePreview);
    }
    setCourseImageFile(null);
    setCourseImagePreview("");
    setProgress({
      currentStep: "",
      percentage: 0,
      logs: [],
      completed: false,
      failed: false,
      startTime: null,
      endTime: null,
    });
    setShowTerminal(false);
  };

  // Copy JSON to clipboard
  const copyToClipboard = () => {
    if (parsedData) {
      navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2));
      toast.success("JSON copied to clipboard!");
    }
  };

  // Download JSON
  const downloadJSON = () => {
    if (parsedData) {
      const blob = new Blob([JSON.stringify(parsedData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "course-structure.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON downloaded!");
    }
  };

  const copyTemplateToClipboard = () => {
    navigator.clipboard.writeText(TEMPLATE_STRING_WITH_COMMENTS);
    toast.success("Template JSON copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with enhanced design */}
        <div
          className={`relative overflow-hidden rounded-2xl border mb-6 p-6 ${cardStyle}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <Sparkles className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-yellow-500 dark:text-yellow-400">
                  Bulk Course Deployment
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Upload, preview, edit, and deploy your entire course structure
                  in one go
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  title="Back to method selection"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              {parsedData && (
                <>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Copy JSON"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={downloadJSON}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Download JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Card */}
            {!showPreview && !isUploading && (
              <div className={`rounded-2xl border p-6 ${cardStyle}`}>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Upload JSON File
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag and drop or click to select
                  </p>
                </div>

                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 ${
                    validationErrors.length > 0
                      ? "border-red-300 dark:border-red-700"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  onClick={() => document.getElementById("json-upload").click()}
                >
                  <FileJson className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Click to browse
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Supports .json files up to 10MB
                  </p>
                  <input
                    id="json-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {jsonFile && (
                  <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center gap-3">
                    <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {jsonFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(jsonFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="p-1 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded transition-colors"
                    >
                      <XCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </button>
                  </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
                        Validation Errors ({validationErrors.length})
                      </h4>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {validationErrors.map((error, index) => (
                        <p
                          key={index}
                          className="text-xs text-red-700 dark:text-red-400 flex items-start gap-1"
                        >
                          <span>•</span>
                          <span>{error}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Terminal Window */}
            {showTerminal && (
              <div
                className={`rounded-2xl border overflow-hidden transition-all duration-300 ${cardStyle}`}
              >
                {/* Terminal Header */}
                <div
                  className={`flex items-center justify-between p-3 border-b ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  } bg-gray-100 dark:bg-gray-800`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <Terminal className="w-4 h-4 text-gray-600 dark:text-gray-400 ml-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      deployment-terminal
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTerminalExpanded(!terminalExpanded)}
                      className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                      title={
                        terminalExpanded
                          ? "Collapse terminal"
                          : "Expand terminal"
                      }
                    >
                      {terminalExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terminal Content */}
                <div
                  className={`${
                    terminalExpanded ? "max-h-96" : "h-64"
                  } overflow-y-auto p-4 font-mono text-sm ${terminalStyle}`}
                >
                  {/* Progress Bar */}
                  {progress.percentage > 0 && (
                    <div className="mb-4 sticky top-0 bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg border border-gray-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-indigo-400">
                          $ {progress.currentStep}
                        </span>
                        <span className="text-indigo-400">
                          {progress.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress.failed
                              ? "bg-red-500"
                              : progress.completed
                              ? "bg-green-500"
                              : "bg-indigo-500"
                          }`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Logs */}
                  <div className="space-y-1">
                    {progress.logs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-gray-500 select-none">
                          [{log.timestamp}]
                        </span>
                        <span
                          className={`${
                            log.type === "error"
                              ? "text-red-400"
                              : log.type === "success"
                              ? "text-green-400"
                              : log.type === "warning"
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          {log.icon} {log.message}
                        </span>
                      </div>
                    ))}
                    {isUploading && !progress.completed && !progress.failed && (
                      <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                        <span>$</span>
                        <span>Processing...</span>
                      </div>
                    )}
                    {progress.completed && (
                      <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                        <p className="text-green-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Deployment completed successfully!
                        </p>
                      </div>
                    )}
                    {progress.failed && (
                      <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                        <p className="text-red-400 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Deployment failed. Check errors above.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview/Edit */}
          <div className="lg:col-span-2">
            {!showPreview && !isUploading && (
              <div
                className={`rounded-2xl border overflow-hidden ${cardStyle}`}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Acceptable JSON Format
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Copy this template and fill in your course details.
                    </p>
                  </div>
                  <button
                    onClick={copyTemplateToClipboard}
                    className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-gray-900 transition-colors flex items-center gap-2 text-sm font-semibold"
                    title="Copy template JSON"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Template
                  </button>
                </div>

                <div className="p-6">
                  <pre className="p-4 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-green-400 border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto text-xs max-h-[600px]">
                    {TEMPLATE_STRING_WITH_COMMENTS}
                  </pre>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Notes: <strong>duration</strong> should be in weeks (e.g.,
                    "4 weeks"), and <strong>priceUSDCUnits</strong> can be
                    decimal (e.g., "89.60").
                  </p>
                </div>
              </div>
            )}

            {showPreview && !isUploading && (
              <div
                className={`rounded-2xl border overflow-hidden ${cardStyle}`}
              >
                {/* Preview Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Course Preview</h2>
                    <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode("preview")}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          viewMode === "preview"
                            ? "bg-white dark:bg-gray-600 shadow"
                            : "hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        Preview
                      </button>
                      <button
                        onClick={() => setViewMode("json")}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          viewMode === "json"
                            ? "bg-white dark:bg-gray-600 shadow"
                            : "hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        <Code className="w-4 h-4 inline mr-1" />
                        JSON
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                        isEditing
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Exit Edit Mode
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4" />
                          Edit Course
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  {viewMode === "preview" ? (
                    <div className="space-y-6">
                      {/* Course Info Card */}
                      <div
                        className={`p-6 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 ${glassCardStyle}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                              <Book className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">
                                {parsedData.course.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Course Information
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                parsedData.course.difficultyLevel === 0
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : parsedData.course.difficultyLevel === 1
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {
                                ["Beginner", "Intermediate", "Advanced"][
                                  parsedData.course.difficultyLevel
                                ]
                              }
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              {parsedData.course.priceUSDCUnits} USDC
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <EditableField
                            label="Course Name"
                            value={parsedData.course.name}
                            onChange={(val) =>
                              updateCourseData("course.name", val)
                            }
                          />
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Course Image (required)
                            </label>
                            <div className="rounded-lg border border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-800/50">
                              {(courseImagePreview ||
                                parsedData.course.imageUrl) && (
                                <img
                                  src={
                                    courseImagePreview ||
                                    parsedData.course.imageUrl
                                  }
                                  alt="Course preview"
                                  className="w-full h-32 object-cover rounded-md border border-gray-200 dark:border-gray-700 mb-3"
                                />
                              )}
                              <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium text-sm cursor-pointer transition-colors">
                                <Upload className="w-4 h-4" />
                                {courseImageFile
                                  ? "Change Image"
                                  : "Upload Image"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCourseImageChange}
                                  className="hidden"
                                />
                              </label>
                              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                This image is uploaded to IPFS during
                                deployment.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <EditableField
                            label="Description"
                            value={parsedData.course.description}
                            onChange={(val) =>
                              updateCourseData("course.description", val)
                            }
                            type="textarea"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Price (USD)
                            </label>
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={parsedData.course.priceUSDCUnits}
                                onChange={(e) =>
                                  updateCourseData(
                                    "course.priceUSDCUnits",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g., 89.60"
                                className="w-full px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                              />
                            ) : (
                              <div className="px-3 py-2 rounded-lg border border-transparent bg-gray-50 dark:bg-gray-800/50">
                                ${parsedData.course.priceUSDCUnits}
                              </div>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Converts to{" "}
                              {parsePriceToUSDCUnits(
                                parsedData.course.priceUSDCUnits,
                              )?.toLocaleString()}{" "}
                              USDC units
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Difficulty Level
                            </label>
                            {isEditing ? (
                              <select
                                value={parsedData.course.difficultyLevel}
                                onChange={(e) =>
                                  updateCourseData(
                                    "course.difficultyLevel",
                                    Number(e.target.value),
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                              >
                                <option value={0}>Beginner</option>
                                <option value={1}>Intermediate</option>
                                <option value={2}>Advanced</option>
                              </select>
                            ) : (
                              <div className="px-3 py-2 rounded-lg border border-transparent bg-gray-50 dark:bg-gray-800/50">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                    parsedData.course.difficultyLevel === 0
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      : parsedData.course.difficultyLevel === 1
                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  }`}
                                >
                                  {
                                    ["Beginner", "Intermediate", "Advanced"][
                                      parsedData.course.difficultyLevel
                                    ]
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Chapters */}
                      {parsedData.course.chapters.map((chapter, chIdx) => (
                        <div
                          key={chIdx}
                          className={`p-4 rounded-xl border ${glassCardStyle}`}
                        >
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection(`chapter-${chIdx}`)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                <Book className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold">
                                  Chapter {chIdx + 1}
                                </h4>
                                <EditableField
                                  value={chapter.name}
                                  onChange={(val) =>
                                    updateCourseData(
                                      `course.chapters.${chIdx}.name`,
                                      val,
                                    )
                                  }
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <EditableField
                                label="Duration (weeks)"
                                value={chapter.duration}
                                onChange={(val) =>
                                  updateCourseData(
                                    `course.chapters.${chIdx}.duration`,
                                    val,
                                  )
                                }
                                className="text-sm w-32"
                              />
                              {expandedSections[`chapter-${chIdx}`] ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </div>
                          </div>

                          {expandedSections[`chapter-${chIdx}`] && (
                            <div className="mt-4 ml-8 space-y-4">
                              {chapter.lessons.map((lesson, lIdx) => (
                                <div
                                  key={lIdx}
                                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                  <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() =>
                                      toggleSection(
                                        `chapter-${chIdx}-lesson-${lIdx}`,
                                      )
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      <Play className="w-4 h-4 text-green-500" />
                                      <EditableField
                                        value={lesson.name}
                                        onChange={(val) =>
                                          updateCourseData(
                                            `course.chapters.${chIdx}.lessons.${lIdx}.name`,
                                            val,
                                          )
                                        }
                                        className="text-sm"
                                      />
                                    </div>
                                    {expandedSections[
                                      `chapter-${chIdx}-lesson-${lIdx}`
                                    ] ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </div>

                                  {expandedSections[
                                    `chapter-${chIdx}-lesson-${lIdx}`
                                  ] && (
                                    <div className="mt-3 ml-6 space-y-3">
                                      <EditableField
                                        label="Content"
                                        value={lesson.content}
                                        onChange={(val) =>
                                          updateCourseData(
                                            `course.chapters.${chIdx}.lessons.${lIdx}.content`,
                                            val,
                                          )
                                        }
                                        type="textarea"
                                      />

                                      {lesson.quizzes &&
                                        lesson.quizzes.map((quiz, qIdx) => (
                                          <div
                                            key={qIdx}
                                            className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <EditableField
                                                value={quiz.title}
                                                onChange={(val) =>
                                                  updateCourseData(
                                                    `course.chapters.${chIdx}.lessons.${lIdx}.quizzes.${qIdx}.title`,
                                                    val,
                                                  )
                                                }
                                                className="text-sm font-medium"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              {quiz.questions.map(
                                                (question, qnIdx) => (
                                                  <div
                                                    key={qnIdx}
                                                    className="p-2 bg-white dark:bg-gray-800 rounded"
                                                  >
                                                    <EditableField
                                                      value={question.question}
                                                      onChange={(val) =>
                                                        updateCourseData(
                                                          `course.chapters.${chIdx}.lessons.${lIdx}.quizzes.${qIdx}.questions.${qnIdx}.question`,
                                                          val,
                                                        )
                                                      }
                                                      className="text-sm"
                                                    />
                                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                                      {question.options.map(
                                                        (option, oIdx) => (
                                                          <div
                                                            key={oIdx}
                                                            className="flex items-center gap-2"
                                                          >
                                                            <input
                                                              type="radio"
                                                              name={`q-${chIdx}-${lIdx}-${qIdx}-${qnIdx}`}
                                                              checked={
                                                                oIdx ===
                                                                question.correctIndex
                                                              }
                                                              onChange={() =>
                                                                updateCourseData(
                                                                  `course.chapters.${chIdx}.lessons.${lIdx}.quizzes.${qIdx}.questions.${qnIdx}.correctIndex`,
                                                                  oIdx,
                                                                )
                                                              }
                                                              className="w-4 h-4 text-indigo-600"
                                                            />
                                                            <EditableField
                                                              value={option}
                                                              onChange={(
                                                                val,
                                                              ) => {
                                                                const newOptions =
                                                                  [
                                                                    ...question.options,
                                                                  ];
                                                                newOptions[
                                                                  oIdx
                                                                ] = val;
                                                                updateCourseData(
                                                                  `course.chapters.${chIdx}.lessons.${lIdx}.quizzes.${qIdx}.questions.${qnIdx}.options`,
                                                                  newOptions,
                                                                );
                                                              }}
                                                              className="text-xs flex-1"
                                                            />
                                                          </div>
                                                        ),
                                                      )}
                                                    </div>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // JSON View
                    <pre className="p-4 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-green-400 border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(parsedData, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeBulkUpload}
                    disabled={isUploading}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                  >
                    <Zap className="w-4 h-4" />
                    Deploy Course
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkCourseUpload;
