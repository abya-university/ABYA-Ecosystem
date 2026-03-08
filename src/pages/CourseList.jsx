import React, { useState, useContext, useRef, useEffect } from "react";
import {
  Book,
  Eye,
  Clock,
  AlertCircle,
  Wifi,
  Info,
  X,
  Loader,
  Users,
  CheckCircle,
  WifiOff,
  ArrowLeft,
  Search,
  Filter,
  Star,
  TrendingUp,
  GraduationCap,
  ChevronDown,
  Grid,
  List,
  BookOpen,
  Target,
  Globe,
  PlayCircle,
  BarChart3,
  FilePlus,
  FileText as FileTextIcon,
  Lock as LockIcon,
  Video as VideoIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon2,
  Cloud as CloudIcon,
  MapPin as MapPinIcon,
  CircleDashed as CircleDashedIcon,
} from "lucide-react";
import { CourseContext } from "../contexts/courseContext";
import { useUser } from "../contexts/userContext";
import { ChapterContext } from "../contexts/chapterContext";
import { LessonContext } from "../contexts/lessonContext";
import { QuizContext } from "../contexts/quizContext";
import { useRevenueSharing } from "../contexts/RevenueSharingContext";
import CareerOnboardingForm from "../components/ProfileSurveyForm";
import Ecosystem1FacetABI from "../artifacts/contracts/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import Ecosystem2FacetABI from "../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { toast, ToastContainer } from "react-toastify";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { client } from "../services/client";
import {
  getContract,
  prepareContractCall,
  readContract,
  toWei,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { useChainMetadata } from "thirdweb/react";
import CONTRACT_ADDRESSES from "../constants/addresses";
import { useCertificates } from "../contexts/certificatesContext";
import { useDarkMode } from "../contexts/themeContext";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem1Facet_ABI = Ecosystem1FacetABI.abi;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;
const FALLBACK_COURSE_IMAGE = "/Vision.jpg";
const IPFS_GATEWAY_BASE = "https://ipfs.io/ipfs/";

const CoursesPage = ({ onCourseSelect, onNavigateToCreateCourse }) => {
  const { darkMode } = useDarkMode();
  const {
    courses,
    latestReviews,
    courseReviews,
    courseFeedback,
    setCourseFeedback,
    setLatestReviews,
    getCourseData,
  } = useContext(CourseContext);
  const { mutateAsync: sendTransaction, isPending: isSending } =
    useSendTransaction();
  const [courseId, setCourseId] = useState(null);
  const { role, enrolledCourses } = useUser();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailsPosition, setDetailsPosition] = useState({ top: 0, left: 0 });
  const detailsRef = useRef(null);
  const { chapters, fetchChapters } = useContext(ChapterContext);
  const { lessons } = useContext(LessonContext);
  const { quizzes } = useContext(QuizContext);
  const { purchaseCourse, purchaseLoading } = useRevenueSharing();
  const [isLoading, setIsLoading] = useState(false);
  const [courseStats, setCourseStats] = useState({
    totalLessons: 0,
    totalQuizzes: 0,
  });
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const [requestSent, setRequestSent] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [unEnrolled, setUnEnrolled] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [unenrollingCourseId, setUnenrollingCourseId] = useState(null);

  const { certificates } = useCertificates();
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false);
  const [courseToUnenroll, setCourseToUnenroll] = useState(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'popular', 'price-low', 'price-high'
  const [filteredCourses, setFilteredCourses] = useState([]);

  // Survey modal state
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [courseIdPendingEnrollment, setCourseIdPendingEnrollment] =
    useState(null);

  const latestReview = latestReviews[courseId] || {};
  const allReviews = courseReviews[courseId] || [];
  const feedback = courseFeedback[courseId];

  const { data: chainMetadata } = useChainMetadata(defineChain(11155111));

  const [activeTab, setActiveTab] = useState("details");

  const [filteredChapters, setFilteredChapters] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Difficulty options
  const difficultyOptions = [
    { value: "all", label: "All Levels", icon: Globe },
    { value: "0", label: "Beginner", icon: GraduationCap },
    { value: "1", label: "Intermediate", icon: TrendingUp },
    { value: "2", label: "Advanced", icon: Target },
  ];

  // Filter and search courses
  useEffect(() => {
    if (!courses) return;

    let filtered = [...courses];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.courseName?.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query) ||
          course.creator?.toLowerCase().includes(query),
      );
    }

    // Apply difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(
        (course) => course.difficulty_level?.toString() === selectedDifficulty,
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b.courseId || 0) - (a.courseId || 0);
        case "popular":
          const aStudents = getEnrolledStudentsCount(a.enrolledStudents);
          const bStudents = getEnrolledStudentsCount(b.enrolledStudents);
          return bStudents - aStudents;
        case "price-low":
          return (Number(a.priceUSDC) || 0) - (Number(b.priceUSDC) || 0);
        case "price-high":
          return (Number(b.priceUSDC) || 0) - (Number(a.priceUSDC) || 0);
        default:
          return 0;
      }
    });

    setFilteredCourses(filtered);
  }, [courses, searchQuery, selectedDifficulty, sortBy]);

  const getDifficultyLabel = (level) => {
    switch (Number(level)) {
      case 0:
        return "Beginner";
      case 1:
        return "Intermediate";
      case 2:
        return "Advanced";
      default:
        return "Unknown";
    }
  };

  const formatPriceUSDC = (value) => {
    if (value === null || value === undefined) {
      return "Free";
    }

    const numeric = Number(value) / 1_000_000;
    if (!Number.isFinite(numeric) || numeric === 0) {
      return "Free";
    }

    const formatted = numeric.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `${formatted} USDC`;
  };

  const getCourseImage = (course) => {
    const imageUrl = course?.imageURL?.trim();
    if (!imageUrl) {
      return FALLBACK_COURSE_IMAGE;
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    const normalizedHash = imageUrl.startsWith("ipfs://")
      ? imageUrl.slice("ipfs://".length)
      : imageUrl;
    return `${IPFS_GATEWAY_BASE}${normalizedHash}`;
  };

  useEffect(() => {
    if (courseId) {
      getCourseData(courseId);
    }
  }, [courseId, getCourseData]);

  // Fetch chapters/lessons/quizzes for all courses to populate card counts
  useEffect(() => {
    const loadAllCourseData = async () => {
      if (courses && courses.length > 0) {
        try {
          // Fetch chapters for all courses
          for (const course of courses) {
            await fetchChapters(course.courseId);
          }
        } catch (error) {
          console.error("Error loading course data:", error);
        }
      }
    };

    loadAllCourseData();
  }, [courses, fetchChapters]);

  const getDifficultyColor = (level) => {
    switch (Number(level)) {
      case 0:
        return {
          bg: "bg-green-500/10",
          text: "text-green-600 dark:text-green-400",
          border: "border-green-500/20",
          light: "bg-green-50 dark:bg-green-900/20",
        };
      case 1:
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-600 dark:text-blue-400",
          border: "border-blue-500/20",
          light: "bg-blue-50 dark:bg-blue-900/20",
        };
      case 2:
        return {
          bg: "bg-red-500/10",
          text: "text-red-600 dark:text-red-400",
          border: "border-red-500/20",
          light: "bg-red-50 dark:bg-red-900/20",
        };
      default:
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-600 dark:text-gray-400",
          border: "border-gray-500/20",
          light: "bg-gray-50 dark:bg-gray-900/20",
        };
    }
  };

  const calculateTotalDuration = (courseId) => {
    const numericCourseId = Number(courseId);
    const courseChapters = chapters.filter(
      (chapter) => chapter.courseId === numericCourseId,
    );
    const totalDuration = courseChapters.reduce(
      (total, chapter) => total + Number(chapter.duration),
      0,
    );
    return totalDuration;
  };

  const calculateCourseStats = (courseChapters) => {
    const courseLessons = lessons.filter((lesson) =>
      courseChapters.some((chapter) => chapter.chapterId === lesson.chapterId),
    );
    const courseQuizzes = quizzes.filter((quiz) =>
      courseLessons.some((lesson) => lesson.lessonId === quiz.lessonId),
    );
    setCourseStats({
      totalLessons: courseLessons.length,
      totalQuizzes: courseQuizzes.length,
    });
  };

  const getApprovalStatusStyle = (approved) => {
    if (approved) {
      return {
        bg: "bg-green-500/20",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-500/30",
        icon: CheckCircle,
        label: "Approved",
      };
    } else {
      return {
        bg: "bg-yellow-500/20",
        text: "text-yellow-600 dark:text-yellow-400",
        border: "border-yellow-500/30",
        icon: Clock,
        label: "Pending Review",
      };
    }
  };

  const viewCourse = (courseId) => {
    onCourseSelect(courseId);
  };

  const openCourseDetails = async (course, event) => {
    setIsLoading(true);
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    setDetailsPosition({
      top: rect.top + scrollY - 400,
      left: rect.left + scrollX + 40,
    });

    setSelectedCourse(course);
    setCourseId(course.courseId);

    try {
      await fetchChapters(course.courseId);
      const courseChapters = chapters.filter(
        (chapter) => chapter.courseId === course.courseId,
      );
      calculateCourseStats(courseChapters);
    } catch (error) {
      console.error("Error fetching course details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target)) {
        setSelectedCourse(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkCourseEligibility = async (courseId) => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = getContract({
        address: DiamondAddress,
        abi: Ecosystem1Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const isReadyForCheck = await readContract({
        contract,
        method:
          "function isCourseReadyForEligibilityCheck(uint256 courseId) view returns (bool)",
        params: [courseId],
      });

      if (isReadyForCheck) {
        await prepareContractCall({
          contract,
          method: "function checkCourseEligibilityAfterDelay(uint256 courseId)",
          params: [courseId],
        });

        toast.success("Course eligibility check completed!");

        const feedback = await readContract({
          contract,
          method:
            "function getCourseFeedback(uint256 courseId) view returns (string)",
          params: [courseId],
        });
        if (feedback) {
          toast.success(`Course feedback: ${feedback}`);
        }
      } else {
        toast.error(
          "Course is not yet ready for eligibility check or has already been checked.",
        );
      }
    } catch (error) {
      console.error("Error checking course eligibility:", error);
      setError("Failed to check course eligibility. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseFeedback(selectedCourse.courseId);

      const courseChapters = chapters.filter(
        (chapter) => chapter.courseId === selectedCourse.courseId,
      );
      setFilteredChapters(courseChapters);

      const courseLessons = courseChapters.flatMap((chapter) =>
        lessons.filter((lesson) => lesson.chapterId === chapter.id),
      );
      setFilteredLessons(courseLessons);

      const courseQuizzes = courseLessons.flatMap((lesson) =>
        quizzes.filter((quiz) => quiz.lessonId === lesson.id),
      );
      setFilteredQuizzes(courseQuizzes);
    }
  }, [selectedCourse, chapters, lessons, quizzes]);

  const getCompleteCourseDeatils = async (courseId) => {
    try {
      setIsLoading(true);

      const course = courses.find(
        (c) => Number(c.courseId) === Number(courseId),
      );
      if (!course) {
        return null;
      }

      const chapters = await fetchChapters(courseId);
      const courseChapters = chapters.filter(
        (chapter) => Number(chapter.courseId) === Number(courseId),
      );

      const getLessonsForChapter = (chapterId) => {
        return lessons.filter(
          (lesson) => Number(lesson.chapterId) === Number(chapterId),
        );
      };

      const courseLessons = [];
      courseChapters.forEach((chapter) => {
        const lessonsForChapter = getLessonsForChapter(chapter.chapterId);
        courseLessons.push(...lessonsForChapter);
      });

      const courseQuizzes = quizzes.filter((quiz) =>
        courseLessons.some(
          (lesson) => Number(lesson.lessonId) === Number(quiz.lessonId),
        ),
      );

      const completeDetails = {
        ...course,
        chapters: courseChapters,
        lessons: courseLessons,
        quizzes: courseQuizzes,
      };

      return completeDetails;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const approveCourse = async (course) => {
    let toastId = null;
    try {
      setIsLoading(true);
      toastId = toast.loading("Preparing course for review...");

      const completeDetails = await getCompleteCourseDeatils(course.courseId);
      if (!completeDetails) {
        toast.update(toastId, {
          render: "Failed to load course details for review.",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
        return;
      }

      toast.update(toastId, {
        render: "Generating course documentation...",
        isLoading: true,
      });

      const courseMarkdown = generateCourseMarkdown(completeDetails);

      toast.update(toastId, {
        render: "Sending to AI evaluation service...",
        isLoading: true,
      });

      const formData = new FormData();
      const courseBlob = new Blob([courseMarkdown], { type: "text/plain" });
      formData.append("file", courseBlob, "course.txt");

      const response = await fetch("http://localhost:5000/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`AI evaluation failed: ${response.statusText}`);
      }

      toast.update(toastId, {
        render: "Processing evaluation results...",
        isLoading: true,
      });

      const evaluationResult = await response.json();

      const finalScore = Math.floor(Number(evaluationResult.score) * 100);
      const category = evaluationResult.category || "General";
      const passed =
        evaluationResult.passed === "Yes" || evaluationResult.passed === true;

      const ensureValidNumber = (value) => {
        const num = Number(value);
        return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100);
      };

      const review = {
        learnerAgency: ensureValidNumber(
          evaluationResult.grades?.learnerAgency,
        ),
        criticalThinking: ensureValidNumber(
          evaluationResult.grades?.criticalThinking,
        ),
        collaborativeLearning: ensureValidNumber(
          evaluationResult.grades?.collaborativeLearning,
        ),
        reflectivePractice: ensureValidNumber(
          evaluationResult.grades?.reflectivePractice,
        ),
        adaptiveLearning: ensureValidNumber(
          evaluationResult.grades?.adaptiveLearning,
        ),
        authenticLearning: ensureValidNumber(
          evaluationResult.grades?.authenticLearning,
        ),
        technologyIntegration: ensureValidNumber(
          evaluationResult.grades?.technologyIntegration,
        ),
        learnerSupport: ensureValidNumber(
          evaluationResult.grades?.learnerSupport,
        ),
        assessmentForLearning: ensureValidNumber(
          evaluationResult.grades?.assessmentForLearning,
        ),
        engagementAndMotivation: ensureValidNumber(
          evaluationResult.grades?.engagementAndMotivation,
        ),
        isSubmitted: true,
        category: category,
        score: finalScore,
        passed: passed,
      };

      if (!account) {
        throw new Error("Account is undefined - please connect your wallet");
      }

      if (!account.address) {
        throw new Error(
          "Account address is missing - wallet may not be properly connected",
        );
      }

      toast.update(toastId, {
        render: "Sending to blockchain for approval...",
        isLoading: true,
      });

      const contract = getContract({
        address: DiamondAddress,
        abi: Ecosystem1Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = prepareContractCall({
        contract,
        method: "approveCourse",
        params: [course.courseId, finalScore, review],
      });

      toast.update(toastId, {
        render: "Waiting for blockchain confirmation...",
        isLoading: true,
      });

      await sendTransaction(transaction);

      toast.update(toastId, {
        render: "Course submitted for review successfully!",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
    } catch (error) {
      console.error("Error in course approval process:", error);
      if (toastId) {
        toast.update(toastId, {
          render: `Failed to submit course for review: ${error.message}`,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      } else {
        toast.error(`Failed to submit course for review: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateCourseMarkdown = (courseData) => {
    if (!courseData) {
      return "No course data available.";
    }

    if (!courseData.courseName) {
      return "Invalid course data - missing course name.";
    }

    const chapters = courseData.chapters || [];
    const lessons = courseData.lessons || [];
    const quizzes = courseData.quizzes || [];

    let markdown = `# ${courseData.courseName}\n\n`;
    markdown += `## Description\n${
      courseData.description || "No description provided."
    }\n\n`;
    markdown += `## Difficulty Level\n${getDifficultyLabel(
      courseData.difficulty_level,
    )}\n\n`;
    markdown += `## Creator\n${courseData.creator || "Unknown"}\n\n`;

    if (chapters && chapters.length > 0) {
      markdown += `## Chapters\n`;
      chapters.forEach((chapter, index) => {
        markdown += `### ${index + 1}. ${chapter.chapterName}\n`;
        markdown += `${chapter.description || "No chapter description"}\n\n`;

        const chapterLessons = lessons.filter(
          (lesson) => Number(lesson.chapterId) === Number(chapter.chapterId),
        );

        if (chapterLessons.length > 0) {
          markdown += `#### Lessons\n`;
          chapterLessons.forEach((lesson, lessonIndex) => {
            markdown += `##### ${lessonIndex + 1}. ${lesson.lessonName}\n`;
            markdown += `${lesson.lessonContent || "No lesson content"}\n\n`;

            const lessonQuizzes = quizzes.filter(
              (quiz) => Number(quiz.lessonId) === Number(lesson.lessonId),
            );
            if (lessonQuizzes.length > 0) {
              markdown += `###### Quizzes\n`;
              lessonQuizzes.forEach((quiz, quizIndex) => {
                markdown += `- ${quiz.quizTitle}\n`;
                if (quiz.questions && quiz.questions.length > 0) {
                  quiz.questions.forEach((question, qIndex) => {
                    markdown += `  - Q${qIndex + 1}: ${
                      question.questionText
                    }\n`;
                    if (question.choices && question.choices.length > 0) {
                      question.choices.forEach((choice, oIndex) => {
                        markdown += `    - Option ${oIndex + 1}: ${
                          choice.option
                        } ${choice.isCorrect ? "(Correct)" : ""}\n`;
                      });
                    }
                  });
                }
                markdown += `\n`;
              });
            }
          });
        }
      });
    } else {
      markdown += `## Chapters\nNo chapters available for this course.\n\n`;
    }

    return markdown;
  };

  useEffect(() => {
    const checkCoursesForApproval = async () => {
      if (!courses || !isConnected || role !== "ADMIN") return;

      for (const course of courses) {
        if (!course.approved) {
          try {
            const contract = await getContract({
              address: DiamondAddress,
              abi: Ecosystem1Facet_ABI,
              client,
              chain: defineChain(11155111),
            });

            const isReadyForCheck = await readContract({
              contract,
              method:
                "function isCourseReadyForEligibilityCheck(uint256 courseId) view returns (bool)",
              params: [courseId],
            });

            if (isReadyForCheck) {
              await prepareContractCall({
                contract,
                method:
                  "function checkCourseEligibilityAfterDelay(uint256 courseId)",
                params: [courseId],
              });

              await new Promise((resolve) => setTimeout(resolve, 15000));

              const feedback = await readContract({
                contract,
                method:
                  "function getCourseFeedback(uint256 courseId) view returns (string)",
                params: [courseId],
              });
              if (!feedback.includes("Course meets eligibility criteria")) {
                continue;
              }

              await submitForAIReview(course.courseId);
            }
          } catch (error) {
            console.error(`Error processing course ${course.courseId}:`, error);
          }
        }
      }
    };

    checkCoursesForApproval();
    const intervalId = setInterval(checkCoursesForApproval, 60000);

    return () => clearInterval(intervalId);
  }, [courses, isConnected, role]);

  const hasCertificateForCourse = (courseId) => {
    return certificates.some(
      (cert) =>
        cert.courseId.toString() === courseId.toString() &&
        cert.owner.toLowerCase() === address.toLowerCase(),
    );
  };

  const fetchCourseFeedback = async (courseId) => {
    try {
      setFeedbackLoading(true);

      const contract = getContract({
        address: DiamondAddress,
        abi: Ecosystem1Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const feedback = await readContract({
        contract,
        method:
          "function getCourseFeedback(uint256 courseId) view returns (string)",
        params: [courseId],
      });
      setCourseFeedback(feedback);
    } catch (error) {
      console.error("Error fetching course feedback:", error);
      setCourseFeedback("Error fetching feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const enroll = async (courseId) => {
    if (enrolledCourses.length === 0) {
      setShowSurveyModal(true);
      setCourseIdPendingEnrollment(courseId);
      return;
    }

    let toastId = null;
    try {
      setEnrollingCourseId(courseId);

      const course = courses.find((c) => c.courseId === courseId);

      if (!course) {
        toast.error("Course not found");
        setEnrollingCourseId(null);
        return;
      }

      if (course.priceUSDC && Number(course.priceUSDC) > 0) {
        toastId = toast.loading("Processing course purchase...");

        const purchaseResult = await purchaseCourse(
          address,
          course.creator,
          BigInt(courseId),
          BigInt(course.priceUSDC),
          "0x0000000000000000000000000000000000000000",
        );

        if (!purchaseResult.success) {
          setEnrollingCourseId(null);
          return;
        }

        if (toastId) {
          toast.dismiss(toastId);
          toastId = null;
        }
      }

      toastId = toast.loading("Processing enrollment...");

      const contract = getContract({
        address: DiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      toast.update(toastId, {
        render: "Preparing transaction...",
        type: "info",
        isLoading: true,
      });

      const transaction = prepareContractCall({
        contract,
        method: "enroll",
        params: [courseId],
      });

      toast.update(toastId, {
        render: "Sending transaction to blockchain...",
        type: "info",
        isLoading: true,
      });

      await sendTransaction(transaction);

      setEnrolled(true);
      toast.update(toastId, {
        render: `Enrolled into course ${courseId} successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error enrolling in course:", error);
      if (toastId) {
        toast.update(toastId, {
          render: "Error enrolling in course. Please try again!",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.error("Error enrolling in course. Please try again!");
      }
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleSurveyComplete = async (finalCourseId = null) => {
    setShowSurveyModal(false);

    if (!courseIdPendingEnrollment) {
      return;
    }

    const courseToEnroll = finalCourseId || courseIdPendingEnrollment;

    let toastId = null;
    try {
      setEnrollingCourseId(courseToEnroll);

      const course = courses.find((c) => c.courseId === courseToEnroll);

      if (!course) {
        toast.error("Course not found");
        setEnrollingCourseId(null);
        setCourseIdPendingEnrollment(null);
        return;
      }

      if (course.priceUSDC && Number(course.priceUSDC) > 0) {
        toastId = toast.loading("Processing course purchase...");

        const purchaseResult = await purchaseCourse(
          address,
          course.creator,
          BigInt(courseToEnroll),
          BigInt(course.priceUSDC),
          "0x0000000000000000000000000000000000000000",
        );

        if (!purchaseResult.success) {
          setEnrollingCourseId(null);
          setCourseIdPendingEnrollment(null);
          return;
        }

        if (toastId) {
          toast.dismiss(toastId);
          toastId = null;
        }
      }

      toastId = toast.loading("Processing your enrollment...");

      const contract = getContract({
        address: DiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      toast.update(toastId, {
        render: "Preparing your enrollment transaction...",
        type: "info",
        isLoading: true,
      });

      const transaction = prepareContractCall({
        contract,
        method: "enroll",
        params: [courseToEnroll],
      });

      toast.update(toastId, {
        render: "Sending transaction to blockchain...",
        type: "info",
        isLoading: true,
      });

      await sendTransaction(transaction);

      setEnrolled(true);
      toast.update(toastId, {
        render: `Successfully enrolled into your first course! Welcome! 🎓`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error enrolling in course:", error);
      if (toastId) {
        toast.update(toastId, {
          render: "Error enrolling in course. Please try again!",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.error("Error enrolling in course. Please try again!");
      }
    } finally {
      setEnrollingCourseId(null);
      setCourseIdPendingEnrollment(null);
    }
  };

  const unEnroll = async (courseId) => {
    let toastId = null;
    try {
      setUnenrollingCourseId(courseId);
      toastId = toast.loading("Processing unenrollment...");

      const contract = getContract({
        address: DiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      toast.update(toastId, {
        render: "Preparing unenrollment transaction...",
        type: "info",
        isLoading: true,
      });

      const transaction = prepareContractCall({
        contract,
        method: "unEnroll",
        params: [courseId],
      });

      toast.update(toastId, {
        render: "Sending transaction to blockchain...",
        type: "info",
        isLoading: true,
      });

      await sendTransaction(transaction);
      setUnEnrolled(true);
      toast.update(toastId, {
        render: `Unenrolled from course ${courseId} successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (error) {
      console.error("Error unenrolling from course:", error);
      if (toastId) {
        toast.update(toastId, {
          render: "Error unenrolling from course. Please try again!",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.error("Error unenrolling from course. Please try again!");
      }
    } finally {
      setUnenrollingCourseId(null);
    }
  };

  const getEnrolledStudentsCount = (enrolledStudentsString) => {
    if (!enrolledStudentsString) return 0;

    if (Array.isArray(enrolledStudentsString)) {
      return enrolledStudentsString.length;
    }

    const studentsStr = String(enrolledStudentsString);

    if (studentsStr.startsWith("0x") && !studentsStr.includes(",")) {
      return 1;
    }

    return studentsStr.split(",").length;
  };

  const isUserEnrolled = (enrolledStudents, userAddress) => {
    if (!enrolledStudents || !userAddress) {
      return false;
    }

    if (Array.isArray(enrolledStudents)) {
      return enrolledStudents.some(
        (addr) => addr.toLowerCase() === userAddress.toLowerCase(),
      );
    }

    const studentsStr = String(enrolledStudents);

    if (studentsStr.startsWith("0x") && !studentsStr.includes(",")) {
      return studentsStr.toLowerCase() === userAddress.toLowerCase();
    }

    const addressList = studentsStr
      .split(",")
      .map((addr) => addr.trim().toLowerCase());
    return addressList.includes(userAddress.toLowerCase());
  };

  // Modern card style
  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-slate-600/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70 hover:border-slate-300/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6 transition-colors duration-300 pt-20 md:pt-[100px]">
      <ToastContainer
        position="bottom-right"
        theme={darkMode ? "dark" : "light"}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-500/10 via-yellow-400/5 to-transparent p-8 mb-8">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-yellow-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 p-4">
                <Book className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
                  Available Courses
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Explore our curated collection of blockchain and Web3 courses
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                onNavigateToCreateCourse && onNavigateToCreateCourse()
              }
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-3 text-black font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/25"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-2">
                <FilePlus className="w-4 h-4" />
                Create New Course
              </span>
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div
          className={`relative rounded-2xl border p-4 mb-6 ${glassCardStyle}`}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative dark:text-white text-bla">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses by name, description, or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                showFilters
                  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Filter className="w-5 h-5 dark:text-white text-bla" />
              <span className="font-medium dark:text-white text-black">
                Filters
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform dark:text-white text-bla ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* View Toggle */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 transition-all ${
                  viewMode === "grid"
                    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Grid className="w-5 h-5 dark:text-white text-bla" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 transition-all border-l border-slate-200 dark:border-slate-700 ${
                  viewMode === "list"
                    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <List className="w-5 h-5 dark:text-white text-bla" />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex flex-wrap gap-2 dark:text-white text-bla">
                    {difficultyOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedDifficulty === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setSelectedDifficulty(option.value)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
                              : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 dark:text-white text-bla transition-all"
                  >
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                  <div className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Showing{" "}
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        {filteredCourses.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold">{courses?.length || 0}</span>{" "}
                      courses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {(success || error) && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              success
                ? "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
            }`}
          >
            {success ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="text-sm">{success || error}</span>
          </div>
        )}

        {/* Courses Grid/List */}
        {filteredCourses.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredCourses.map((course) => {
              const difficultyColors = getDifficultyColor(
                course.difficulty_level,
              );
              const approvalStatus = getApprovalStatusStyle(course.approved);
              const ApprovalIcon = approvalStatus.icon;
              const userEnrolled = isUserEnrolled(
                course.enrolledStudents,
                address,
              );
              const hasCertificate = hasCertificateForCourse(course.courseId);
              const studentCount = getEnrolledStudentsCount(
                course.enrolledStudents,
              );

              return (
                <div
                  key={course.courseId}
                  className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                    viewMode === "list" ? "flex" : ""
                  } ${cardStyle}`}
                >
                  {/* Course Image - List view adjustment */}
                  <div
                    className={viewMode === "list" ? "w-48 shrink-0" : "w-full"}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getCourseImage(course)}
                        alt={course.courseName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                      {/* Difficulty Badge */}
                      <div
                        className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${difficultyColors.bg} ${difficultyColors.border} border`}
                      >
                        {course.difficulty_level === 0 && (
                          <GraduationCap className="w-3 h-3" />
                        )}
                        {course.difficulty_level === 1 && (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        {course.difficulty_level === 2 && (
                          <Target className="w-3 h-3" />
                        )}
                        <span className={difficultyColors.text}>
                          {getDifficultyLabel(course.difficulty_level)}
                        </span>
                      </div>

                      {/* Approval Status Badge */}
                      <div
                        className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${approvalStatus.bg} ${approvalStatus.border} border`}
                      >
                        <ApprovalIcon
                          className={`w-3 h-3 ${approvalStatus.text}`}
                        />
                        <span className={approvalStatus.text}>
                          {approvalStatus.label}
                        </span>
                      </div>

                      {/* Info Button */}
                      <button
                        onClick={(e) => openCourseDetails(course, e)}
                        className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-yellow-500/80 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className={viewMode === "list" ? "flex-1 p-5" : "p-5"}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold line-clamp-1 text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                        {course.courseName}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                      {course.description}
                    </p>

                    {/* Course Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
                        <BookOpen className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                        <span className="text-xs font-medium block text-slate-900 dark:text-white">
                          {chapters.filter(
                            (c) =>
                              Number(c.courseId) === Number(course.courseId),
                          ).length || 0}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-300">
                          Chapters
                        </span>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
                        <PlayCircle className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <span className="text-xs font-medium block text-slate-900 dark:text-white">
                          {lessons.filter((l) => {
                            const chapterIds = chapters
                              .filter(
                                (c) =>
                                  Number(c.courseId) ===
                                  Number(course.courseId),
                              )
                              .map((c) => c.chapterId);
                            return chapterIds.includes(l.chapterId);
                          }).length || 0}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-300">
                          Lessons
                        </span>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
                        <Users className="w-4 h-4 mx-auto mb-1 text-green-500" />
                        <span className="text-xs font-medium block text-slate-900 dark:text-white">
                          {studentCount}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-300">
                          Students
                        </span>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {calculateTotalDuration(course.courseId)} weeks
                        </span>
                      </div>
                      <div className="font-bold text-yellow-600 dark:text-yellow-400">
                        {formatPriceUSDC(course.priceUSDC)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!course.approved && course.creator === address && (
                        <button
                          onClick={async () => approveCourse(course)}
                          disabled={isLoading || course.approved}
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-black py-2 px-3 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-yellow-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          {course.approved ? "Approved" : "Request Review"}
                        </button>
                      )}

                      {course.approved && address && (
                        <>
                          {userEnrolled ? (
                            <>
                              <button
                                onClick={() => viewCourse(course.courseId)}
                                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-500 text-white py-2 px-3 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Course
                              </button>

                              {hasCertificate ? (
                                <button
                                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-default opacity-75"
                                  disabled
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Completed
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCourseToUnenroll(course);
                                    setShowUnenrollConfirm(true);
                                  }}
                                  disabled={
                                    unenrollingCourseId === course.courseId
                                  }
                                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white py-2 px-3 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                  <WifiOff className="w-4 h-4" />
                                  {unenrollingCourseId === course.courseId
                                    ? "..."
                                    : "Unenroll"}
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => enroll(course.courseId)}
                              disabled={enrollingCourseId === course.courseId}
                              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 px-3 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-white-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Wifi className="w-4 h-4" />
                              {enrollingCourseId === course.courseId
                                ? "Enrolling..."
                                : "Enroll Now"}
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Creator Info */}
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 truncate">
                        Created by:{" "}
                        <span className="font-mono">
                          {course.creator?.slice(0, 6)}...
                          {course.creator?.slice(-4)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={`text-center py-16 rounded-3xl border ${glassCardStyle}`}
          >
            <div className="relative inline-block">
              <Book className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <div className="absolute inset-0 animate-ping">
                <Book className="w-16 h-16 mx-auto opacity-20" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Courses Found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery || selectedDifficulty !== "all"
                ? "Try adjusting your search or filters"
                : "No courses available at the moment"}
            </p>
          </div>
        )}

        {/* Course Details Panel */}
        {selectedCourse && (
          <div
            ref={detailsRef}
            style={{
              top: `${detailsPosition.top}px`,
              left: `${detailsPosition.left}px`,
            }}
            className={`fixed w-96 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl overflow-hidden z-50 ${glassCardStyle}`}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "details"
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 dak:text-white text-black"
                  }`}
                >
                  Details
                </button>
                {selectedCourse.approved && (
                  <button
                    onClick={() => {
                      setActiveTab("metrics");
                      if (!latestReviews[selectedCourse.courseId]) {
                        getCourseData(selectedCourse.courseId);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "metrics"
                        ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-white text-black"
                    }`}
                  >
                    Metrics
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 dark:text-white text-black" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader className="w-8 h-8 text-yellow-500 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Details Tab */}
                  {activeTab === "details" && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-yellow-500 mb-1">
                          Course Name
                        </h4>
                        <p className="text-sm text-slate-900 dark:text-white">
                          {selectedCourse.courseName}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-yellow-500 mb-1">
                          Difficulty Level
                        </h4>
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            getDifficultyColor(selectedCourse.difficulty_level)
                              .bg
                          }`}
                        >
                          {selectedCourse.difficulty_level === 0 && (
                            <GraduationCap className="w-3 h-3" />
                          )}
                          {selectedCourse.difficulty_level === 1 && (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          {selectedCourse.difficulty_level === 2 && (
                            <Target className="w-3 h-3" />
                          )}
                          <span
                            className={
                              getDifficultyColor(
                                selectedCourse.difficulty_level,
                              ).text
                            }
                          >
                            {getDifficultyLabel(
                              selectedCourse.difficulty_level,
                            )}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-yellow-500 mb-1">
                          Status
                        </h4>
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            selectedCourse.approved
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                          }`}
                        >
                          {selectedCourse.approved ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Approved</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Pending Review</span>
                            </>
                          )}
                        </div>
                      </div>

                      {selectedCourse.approvalCount > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-yellow-500 mb-1">
                            Review Score
                          </h4>
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                              selectedCourse.approvalCount >= 80
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}
                          >
                            <Star className="w-3 h-3" />
                            <span>{selectedCourse.approvalCount}%</span>
                          </div>
                        </div>
                      )}

                      {(selectedCourse.creator === address ||
                        role === "ADMIN") &&
                        !selectedCourse.approved && (
                          <div>
                            <h4 className="text-sm font-medium text-yellow-500 mb-1">
                              Feedback
                            </h4>
                            <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white">
                              {feedbackLoading ? (
                                <div className="flex justify-center py-2">
                                  <Loader className="w-4 h-4 text-yellow-500 animate-spin" />
                                </div>
                              ) : courseFeedback ? (
                                <p className="text-slate-900 dark:text-white">
                                  {typeof courseFeedback === "string"
                                    ? courseFeedback
                                    : JSON.stringify(courseFeedback)}
                                </p>
                              ) : (
                                <p className="text-slate-500 dark:text-slate-300 italic">
                                  No feedback available yet
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                      <div>
                        <h4 className="text-sm font-medium text-yellow-500 mb-1">
                          Description
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedCourse.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
                          <p className="text-xs text-slate-500 dark:text-slate-300 mb-1">
                            Chapters
                          </p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {chapters?.filter(
                              (c) =>
                                Number(c.courseId) ===
                                Number(selectedCourse.courseId),
                            ).length || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
                          <p className="text-xs text-slate-500 dark:text-slate-300 mb-1">
                            Lessons
                          </p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {lessons?.length || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
                          <p className="text-xs text-slate-500 dark:text-slate-300 mb-1">
                            Quizzes
                          </p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {quizzes?.length || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
                          <p className="text-xs text-slate-500 dark:text-slate-300 mb-1">
                            Duration
                          </p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {calculateTotalDuration(selectedCourse.courseId)}{" "}
                            weeks
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-yellow-500 mb-1">
                          Creator
                        </h4>
                        <p className="font-mono text-sm bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-lg text-slate-900 dark:text-white">
                          {selectedCourse.creator}
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab("metrics")}
                          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-xl font-medium hover:shadow-lg hover:shadow-yellow-500/25 transition-all flex items-center justify-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          View Course Metrics
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Metrics Tab */}
                  {activeTab === "metrics" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-yellow-500 dark:text-white">
                          Course Metrics
                        </h3>
                        <button
                          onClick={() => setActiveTab("details")}
                          className="text-yellow-500 dark:text-white hover:text-yellow-600 dark:hover:text-slate-300 flex items-center gap-1 text-sm"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          Back
                        </button>
                      </div>

                      {!latestReviews[selectedCourse.courseId] ? (
                        <div className="flex justify-center items-center h-48">
                          <Loader className="w-8 h-8 text-yellow-500 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {/* Evaluation Summary */}
                          <div className="bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-4">
                            <h4 className="text-yellow-500 dark:text-white font-medium mb-3">
                              Evaluation Summary
                            </h4>
                            <div className="flex justify-center py-4">
                              <div className="relative w-32 h-32">
                                {(() => {
                                  const latestReview =
                                    latestReviews[selectedCourse.courseId];
                                  const approvalPercentage = latestReview?.score
                                    ? latestReview.score / 100
                                    : 0;
                                  const isPassed = approvalPercentage >= 50;

                                  return (
                                    <>
                                      <svg
                                        className="w-full h-full"
                                        viewBox="0 0 100 100"
                                      >
                                        <circle
                                          cx="50"
                                          cy="50"
                                          r="45"
                                          fill="transparent"
                                          stroke="#e2e8f0"
                                          strokeWidth="10"
                                        />
                                        <circle
                                          cx="50"
                                          cy="50"
                                          r="45"
                                          fill="transparent"
                                          stroke={
                                            isPassed ? "#22c55e" : "#f43f5e"
                                          }
                                          strokeWidth="10"
                                          strokeDasharray={`${
                                            approvalPercentage * 2.83
                                          } 283`}
                                          strokeDashoffset="0"
                                          transform="rotate(-90 50 50)"
                                          className="transition-all duration-1000"
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold text-yellow-500">
                                          {approvalPercentage.toFixed(2)}%
                                        </span>
                                        <span className="text-xs uppercase text-gray-400 dark:text-slate-400">
                                          {isPassed ? "PASSED" : "FAILED"}
                                        </span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                              <div>
                                <span className="text-gray-400 dark:text-slate-400">
                                  Category:
                                </span>
                                <p className="text-yellow-500 dark:text-white truncate">
                                  {latestReviews[selectedCourse.courseId]
                                    ?.category || "General"}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-400 dark:text-slate-400">
                                  Pass Mark:
                                </span>
                                <p className="text-yellow-500 dark:text-white">
                                  75%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Performance Breakdown */}
                          <div className="bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-4">
                            <h4 className="text-yellow-500 dark:text-white font-medium mb-3">
                              Performance Breakdown
                            </h4>
                            {latestReviews[selectedCourse.courseId] &&
                            Object.keys(latestReviews[selectedCourse.courseId])
                              .length > 0 ? (
                              <div className="space-y-3">
                                {Object.entries({
                                  "Learner Agency":
                                    latestReviews[selectedCourse.courseId]
                                      .learnerAgency || 0,
                                  "Critical Thinking":
                                    latestReviews[selectedCourse.courseId]
                                      .criticalThinking || 0,
                                  "Collaborative Learning":
                                    latestReviews[selectedCourse.courseId]
                                      .collaborativeLearning || 0,
                                  "Reflective Practice":
                                    latestReviews[selectedCourse.courseId]
                                      .reflectivePractice || 0,
                                  "Adaptive Learning":
                                    latestReviews[selectedCourse.courseId]
                                      .adaptiveLearning || 0,
                                  "Authentic Learning":
                                    latestReviews[selectedCourse.courseId]
                                      .authenticLearning || 0,
                                  "Technology Integration":
                                    latestReviews[selectedCourse.courseId]
                                      .technologyIntegration || 0,
                                  "Learner Support":
                                    latestReviews[selectedCourse.courseId]
                                      .learnerSupport || 0,
                                  "Assessment for Learning":
                                    latestReviews[selectedCourse.courseId]
                                      .assessmentForLearning || 0,
                                  "Engagement and Motivation":
                                    latestReviews[selectedCourse.courseId]
                                      .engagementAndMotivation || 0,
                                }).map(([key, value]) => (
                                  <div key={key}>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-xs text-slate-600 dark:text-slate-300">
                                        {key}
                                      </span>
                                      <span
                                        className={`text-xs font-medium ${
                                          value >= 70
                                            ? "text-green-500"
                                            : value >= 50
                                            ? "text-yellow-500"
                                            : "text-red-500"
                                        }`}
                                      >
                                        {value}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                          value >= 70
                                            ? "bg-green-500"
                                            : value >= 50
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                        }`}
                                        style={{ width: `${value}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-400 dark:text-slate-400">
                                No detailed metrics available
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Unenrollment Confirmation Modal */}
        {showUnenrollConfirm && courseToUnenroll && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className={`max-w-md w-full rounded-2xl border shadow-2xl overflow-hidden ${glassCardStyle}`}
            >
              <div className="p-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <WifiOff className="w-8 h-8 text-red-500" />
                  </div>

                  <h3 className="text-xl font-bold mb-2 text-white">
                    Confirm Unenrollment
                  </h3>

                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Are you sure you want to unenroll from{" "}
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {courseToUnenroll.courseName}
                    </span>
                    ? You will lose all your progress.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowUnenrollConfirm(false);
                        setCourseToUnenroll(null);
                      }}
                      disabled={
                        unenrollingCourseId === courseToUnenroll?.courseId
                      }
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium dark:text-white text-black"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await unEnroll(courseToUnenroll.courseId);
                          setShowUnenrollConfirm(false);
                          setCourseToUnenroll(null);
                        } catch (error) {
                          console.error("Failed to unenroll:", error);
                        }
                      }}
                      disabled={
                        unenrollingCourseId === courseToUnenroll?.courseId
                      }
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      {unenrollingCourseId === courseToUnenroll?.courseId ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Unenrolling...
                        </>
                      ) : (
                        "Yes, Unenroll"
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-4">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Survey Modal */}
        {showSurveyModal && (
          <CareerOnboardingForm
            userAddress={account?.address}
            isModal={true}
            onFormComplete={handleSurveyComplete}
            courseIdToEnroll={courseIdPendingEnrollment}
            onClose={() => {
              setShowSurveyModal(false);
              setCourseIdPendingEnrollment(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
