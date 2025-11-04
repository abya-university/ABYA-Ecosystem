import React, { useState, useContext, useRef, useEffect } from "react";
import {
  Book,
  Eye,
  Clock,
  Check,
  AlertCircle,
  Wifi,
  Info,
  X,
  Loader,
  Users,
  CheckCircle,
  WifiOff,
  ChartBar,
  ArrowLeft,
  ExternalLink,
  WifiOffIcon,
} from "lucide-react";
import { CourseContext } from "../contexts/courseContext";
import { useUser } from "../contexts/userContext";
import { ChapterContext } from "../contexts/chapterContext";
import { LessonContext } from "../contexts/lessonContext";
import { QuizContext } from "../contexts/quizContext";
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

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem1Facet_ABI = Ecosystem1FacetABI.abi;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const CoursesPage = ({ onCourseSelect, onNavigateToCreateCourse }) => {
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
  const { role } = useUser();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailsPosition, setDetailsPosition] = useState({ top: 0, left: 0 });
  const detailsRef = useRef(null);
  const { chapters, fetchChapters } = useContext(ChapterContext);
  const { lessons } = useContext(LessonContext);
  const { quizzes } = useContext(QuizContext);
  const [isLoading, setIsLoading] = useState(false);
  const [courseStats, setCourseStats] = useState({
    totalLessons: 0,
    totalQuizzes: 0,
  });
  // const { address, isConnected } = useAccount();
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const [requestSent, setRequestSent] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [unEnrolled, setUnEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  const { certificates } = useCertificates();
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false);
  const [courseToUnenroll, setCourseToUnenroll] = useState(null);
  const [unenrollLoading, setUnenrollLoading] = useState(false);

  const latestReview = latestReviews[courseId] || {};
  const allReviews = courseReviews[courseId] || [];
  const feedback = courseFeedback[courseId];

  console.log("Courses in courselist:", courses);

  const { data: chainMetadata } = useChainMetadata(defineChain(11155111));

  const [activeTab, setActiveTab] = useState("details");

  const [filteredChapters, setFilteredChapters] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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

  useEffect(() => {
    if (courseId) {
      getCourseData(courseId);
    }
  }, [courseId, getCourseData]);

  const getDifficultyColor = (level) => {
    switch (Number(level)) {
      case 0:
        return "text-green-500 bg-green-100";
      case 1:
        return "text-blue-500 bg-blue-100";
      case 2:
        return "text-red-500 bg-red-100";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  // Add this inside the component before the return statement
  const calculateTotalDuration = (courseId) => {
    // Convert courseId to number for comparison since it comes as string from the course object
    const numericCourseId = Number(courseId);

    const courseChapters = chapters.filter(
      (chapter) => chapter.courseId === numericCourseId
    );

    const totalDuration = courseChapters.reduce(
      (total, chapter) => total + Number(chapter.duration),
      0
    );

    return totalDuration;
  };

  console.log("Chapters s:", chapters);

  const calculateCourseStats = (courseChapters) => {
    // Get all lesson IDs that belong to the course chapters
    const courseLessons = lessons.filter((lesson) =>
      courseChapters.some((chapter) => chapter.chapterId === lesson.chapterId)
    );

    // Count quizzes that belong to the course lessons
    const courseQuizzes = quizzes.filter((quiz) =>
      courseLessons.some((lesson) => lesson.lessonId === quiz.lessonId)
    );

    setCourseStats({
      totalLessons: courseLessons.length,
      totalQuizzes: courseQuizzes.length,
    });
  };

  // Debug useEffect to log enrollment status for all courses
  useEffect(() => {
    if (courses && courses.length > 0 && address) {
      console.log("=== ENROLLMENT DEBUG INFO ===");
      console.log("Current user address:", address);
      console.log("Current role:", role);
      courses.forEach((course) => {
        const isEnrolled = isUserEnrolled(course.enrolledStudents, address);
        console.log(`Course ${course.courseId}:`);
        console.log(`  - Name: ${course.courseName}`);
        console.log(`  - Approved: ${course.approved}`);
        console.log(`  - enrolledStudents:`, course.enrolledStudents);
        console.log(`  - User enrolled: ${isEnrolled}`);
        console.log(
          `  - Should show buttons: ${
            role === "USER" && course.approved && address
          }`
        );
        console.log("---");
      });
      console.log("=== END ENROLLMENT DEBUG ===");
    }
  }, [courses, address, role]);

  const getApprovalStatusStyle = (approved) => {
    if (approved) {
      return "bg-green-500/20 text-green-500";
    } else {
      return "bg-yellow-500/20 text-yellow-500";
    }
  };

  const viewCourse = (courseId) => {
    console.log("Viewing course:", courseId);
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
      // Fetch chapters for the selected course
      await fetchChapters(course.courseId);
      // Calculate lessons and quizzes based on the fetched chapters
      const courseChapters = chapters.filter(
        (chapter) => chapter.courseId === course.courseId
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

  // This function checks if a course is ready for eligibility check
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

      // First check if the course is ready for eligibility check
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

        // Get feedback if any
        // const feedback = await diamondContract.getCourseFeedback(courseId);
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
          "Course is not yet ready for eligibility check or has already been checked."
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

      // Step 1: Filter chapters by courseId
      const courseChapters = chapters.filter(
        (chapter) => chapter.courseId === selectedCourse.courseId
      );
      setFilteredChapters(courseChapters);

      // Step 2: Filter lessons by chapterId
      const courseLessons = courseChapters.flatMap((chapter) =>
        lessons.filter((lesson) => lesson.chapterId === chapter.id)
      );
      setFilteredLessons(courseLessons);

      // Step 3: Filter quizzes by lessonId
      const courseQuizzes = courseLessons.flatMap((lesson) =>
        quizzes.filter((quiz) => quiz.lessonId === lesson.id)
      );
      setFilteredQuizzes(courseQuizzes);
    }
  }, [selectedCourse, chapters, lessons, quizzes]);

  // Function to get all course details
  const getCompleteCourseDeatils = async (courseId) => {
    try {
      console.log(`Fetching complete details for course ID: ${courseId}`);
      setIsLoading(true);

      // 1. Find the base course from existing courses
      const course = courses.find(
        (c) => Number(c.courseId) === Number(courseId)
      );
      if (!course) {
        console.error(`Course with ID ${courseId} not found`);
        return null;
      }
      console.log("Base course found:", course);

      // 2. Fetch chapters specifically for this course
      const chapters = await fetchChapters(courseId);
      const courseChapters = chapters.filter(
        (chapter) => Number(chapter.courseId) === Number(courseId)
      );
      console.log(
        `Found ${courseChapters.length} chapters for course:`,
        courseChapters
      );

      console.log("Lessons 4: ", lessons);

      // Fixed function - use chapterId correctly
      const getLessonsForChapter = (chapterId) => {
        // Make sure we're comparing the same types (numbers)
        const lessonsForChapter = lessons.filter(
          (lesson) => Number(lesson.chapterId) === Number(chapterId)
        );
        console.log(
          `Found ${lessonsForChapter.length} lessons for chapter ${chapterId}:`,
          lessonsForChapter
        );
        return lessonsForChapter;
      };

      // Initialize courseLessons as an empty array
      const courseLessons = [];

      // Fixed: Iterate over courseChapters and collect lessons using the correct property
      courseChapters.forEach((chapter) => {
        // Use chapter.chapterId instead of chapter.id
        const lessonsForChapter = getLessonsForChapter(chapter.chapterId);
        courseLessons.push(...lessonsForChapter); // Spread operator to merge arrays
      });

      console.log(
        `Found ${courseLessons.length} lessons for course:`,
        courseLessons
      );

      // 4. Get quizzes for these lessons - fixed to match correctly
      const courseQuizzes = quizzes.filter((quiz) =>
        courseLessons.some(
          (lesson) => Number(lesson.lessonId) === Number(quiz.lessonId)
        )
      );
      console.log(
        `Found ${courseQuizzes.length} quizzes for course:`,
        courseQuizzes
      );

      // 5. Compile everything into one object
      const completeDetails = {
        ...course,
        chapters: courseChapters,
        lessons: courseLessons,
        quizzes: courseQuizzes,
      };

      console.log("Complete course details:", completeDetails);
      return completeDetails;
    } catch (error) {
      console.error(
        `Error fetching complete details for course ${courseId}:`,
        error
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const approveCourse = async (course) => {
    try {
      setIsLoading(true);

      // 1. Get complete course details
      const completeDetails = await getCompleteCourseDeatils(course.courseId);
      if (!completeDetails) {
        toast.error("Failed to load course details for review.");
        return;
      }

      // 2. Generate markdown for AI evaluation
      const courseMarkdown = generateCourseMarkdown(completeDetails);
      console.log("Generated markdown length:", courseMarkdown.length);

      // 3. Send to AI microservice
      const formData = new FormData();
      const courseBlob = new Blob([courseMarkdown], { type: "text/plain" });
      formData.append("file", courseBlob, "course.txt");

      console.log("Sending request to AI microservice...");
      const response = await fetch("http://localhost:5000/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`AI evaluation failed: ${response.statusText}`);
      }

      // 4. Process AI evaluation results
      const evaluationResult = await response.json();
      console.log("AI Evaluation result:", evaluationResult);

      // DEBUG: Check the raw score value
      console.log("Raw score from backend:", evaluationResult.score);
      console.log("Type of score:", typeof evaluationResult.score);

      // Fixed-point arithmetic for blockchain (multiply by 100 to handle decimals)
      const finalScore = Math.floor(Number(evaluationResult.score) * 100);
      const category = evaluationResult.category || "General";
      const passed =
        evaluationResult.passed === "Yes" || evaluationResult.passed === true;

      console.log("Final score for blockchain:", finalScore);

      // 5. Prepare review object for blockchain
      const ensureValidNumber = (value) => {
        const num = Number(value);
        return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100);
      };

      const review = {
        learnerAgency: ensureValidNumber(
          evaluationResult.grades?.learnerAgency
        ),
        criticalThinking: ensureValidNumber(
          evaluationResult.grades?.criticalThinking
        ),
        collaborativeLearning: ensureValidNumber(
          evaluationResult.grades?.collaborativeLearning
        ),
        reflectivePractice: ensureValidNumber(
          evaluationResult.grades?.reflectivePractice
        ),
        adaptiveLearning: ensureValidNumber(
          evaluationResult.grades?.adaptiveLearning
        ),
        authenticLearning: ensureValidNumber(
          evaluationResult.grades?.authenticLearning
        ),
        technologyIntegration: ensureValidNumber(
          evaluationResult.grades?.technologyIntegration
        ),
        learnerSupport: ensureValidNumber(
          evaluationResult.grades?.learnerSupport
        ),
        assessmentForLearning: ensureValidNumber(
          evaluationResult.grades?.assessmentForLearning
        ),
        engagementAndMotivation: ensureValidNumber(
          evaluationResult.grades?.engagementAndMotivation
        ),
        isSubmitted: true,
        category: category,
        score: finalScore, // This will be 5525 for 55.25%
        passed: passed,
      };

      console.log("Review object for blockchain:", review);

      // 6. Debug the account issue
      console.log("Account object:", account);
      console.log("Account ID:", account?.id);
      console.log("Account address:", account?.address);

      // Check if we have a valid account
      if (!account) {
        throw new Error("Account is undefined - please connect your wallet");
      }

      if (!account.address) {
        throw new Error(
          "Account address is missing - wallet may not be properly connected"
        );
      }

      // 7. Send to blockchain
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

      await sendTransaction(transaction);
      toast.success("Course approved successfully!");
    } catch (error) {
      console.error("Error in course approval process:", error);
      toast.error(`Failed to approve course: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate markdown from course data
  const generateCourseMarkdown = (courseData) => {
    console.log("Course data for markdown generation:", courseData);

    if (!courseData) {
      console.error("No course data provided for markdown generation!");
      return "No course data available.";
    }

    if (!courseData.courseName) {
      console.error("Course data is missing courseName!");
      return "Invalid course data - missing course name.";
    }

    const chapters = courseData.chapters || [];
    const lessons = courseData.lessons || [];
    const quizzes = courseData.quizzes || [];

    console.log(
      `Found ${chapters.length} chapters, ${lessons.length} lessons, ${quizzes.length} quizzes`
    );

    let markdown = `# ${courseData.courseName}\n\n`;
    markdown += `## Description\n${
      courseData.description || "No description provided."
    }\n\n`;
    markdown += `## Difficulty Level\n${getDifficultyLabel(
      courseData.difficulty_level
    )}\n\n`;
    markdown += `## Creator\n${courseData.creator || "Unknown"}\n\n`;

    // Add chapters
    if (chapters && chapters.length > 0) {
      markdown += `## Chapters\n`;
      chapters.forEach((chapter, index) => {
        markdown += `### ${index + 1}. ${chapter.chapterName}\n`;
        markdown += `${chapter.description || "No chapter description"}\n\n`;

        // Add lessons for each chapter - fixed to use chapterId
        const chapterLessons = lessons.filter(
          (lesson) => Number(lesson.chapterId) === Number(chapter.chapterId)
        );

        if (chapterLessons.length > 0) {
          markdown += `#### Lessons\n`;
          chapterLessons.forEach((lesson, lessonIndex) => {
            markdown += `##### ${lessonIndex + 1}. ${lesson.lessonName}\n`;
            markdown += `${lesson.lessonContent || "No lesson content"}\n\n`;

            // Add quizzes for each lesson - fixed to match correctly
            const lessonQuizzes = quizzes.filter(
              (quiz) => Number(quiz.lessonId) === Number(lesson.lessonId)
            );
            if (lessonQuizzes.length > 0) {
              markdown += `###### Quizzes\n`;
              lessonQuizzes.forEach((quiz, quizIndex) => {
                markdown += `- ${quiz.quizTitle}\n`;
                // Add quiz questions if available - adjusted for your structure
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

    console.log("Generated markdown preview:", markdown.substring(0, 1000));
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

            // Check if eligibility check is ready
            const isReadyForCheck = await readContract({
              contract,
              method:
                "function isCourseReadyForEligibilityCheck(uint256 courseId) view returns (bool)",
              params: [courseId],
            });

            if (isReadyForCheck) {
              console.log(
                `Course ${course.courseId} is ready for eligibility check`
              );

              await prepareContractCall({
                contract,
                method:
                  "function checkCourseEligibilityAfterDelay(uint256 courseId)",
                params: [courseId],
              });

              // Wait a bit for the eligibility check to process
              await new Promise((resolve) => setTimeout(resolve, 15000));

              const feedback = await readContract({
                contract,
                method:
                  "function getCourseFeedback(uint256 courseId) view returns (string)",
                params: [courseId],
              });
              console.log(
                `Eligibility feedback for course ${course.courseId}: ${feedback}`
              );
              if (!feedback.includes("Course meets eligibility criteria")) {
                console.log(
                  `Course ${course.courseId} failed eligibility check: ${feedback}`
                );
                continue; // Skip AI review if eligibility check failed
              }

              // Submit for AI review
              await submitForAIReview(course.courseId);
            }
          } catch (error) {
            console.error(`Error processing course ${course.courseId}:`, error);
          }
        }
      }
    };

    checkCoursesForApproval();
    const intervalId = setInterval(checkCoursesForApproval, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [courses, isConnected, role]);

  const hasCertificateForCourse = (courseId) => {
    return certificates.some(
      (cert) =>
        cert.courseId.toString() === courseId.toString() &&
        cert.owner.toLowerCase() === address.toLowerCase()
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

      // const feedback = await diamondContract.getCourseFeedback(courseId);
      const feedback = await readContract({
        contract,
        method:
          "function getCourseFeedback(uint256 courseId) view returns (string)",
        params: [courseId],
      });
      console.log(`Fetched feedback for course ${courseId}: ${feedback}`);
      setCourseFeedback(feedback);
    } catch (error) {
      console.error("Error fetching course feedback:", error);
      setCourseFeedback("Error fetching feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const enroll = async (courseId) => {
    try {
      setLoading(true);
      const contract = getContract({
        address: DiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = prepareContractCall({
        contract,
        method: "enroll",
        params: [courseId],
      });

      await sendTransaction(transaction);

      setEnrolled(true);
      toast.success(`Enrolled into course ${courseId} successfully!`);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast.error("Error enrolling in course. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const unEnroll = async (courseId) => {
    try {
      setLoading(true);
      const contract = getContract({
        address: DiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = prepareContractCall({
        contract,
        method: "unEnroll",
        params: [courseId],
      });

      await sendTransaction(transaction);
      setUnEnrolled(true);
      toast.success(`Unenrolled from course ${courseId} successfully!`);
      window.location.reload();
    } catch (error) {
      console.error("Error unenrolling from course:", error);
      toast.error("Error unenrolling from course. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const getEnrolledStudentsCount = (enrolledStudentsString) => {
    // If empty or undefined, return 0
    if (!enrolledStudentsString) return 0;

    // If it's an array, return its length
    if (Array.isArray(enrolledStudentsString)) {
      return enrolledStudentsString.length;
    }

    // Convert to string if it's not already a string
    const studentsStr = String(enrolledStudentsString);

    // If it's a single address, return 1
    if (studentsStr.startsWith("0x") && !studentsStr.includes(",")) {
      return 1;
    }

    // If multiple addresses, split and count
    return studentsStr.split(",").length;
  };

  // Helper function to check if current user is enrolled in a course
  const isUserEnrolled = (enrolledStudents, userAddress) => {
    if (!enrolledStudents || !userAddress) {
      console.log(
        "Missing data - enrolledStudents:",
        enrolledStudents,
        "userAddress:",
        userAddress
      );
      return false;
    }

    // If it's an array, check if it includes the address
    if (Array.isArray(enrolledStudents)) {
      const isEnrolled = enrolledStudents.some(
        (addr) => addr.toLowerCase() === userAddress.toLowerCase()
      );
      console.log(
        "Array check - enrolledStudents:",
        enrolledStudents,
        "userAddress:",
        userAddress,
        "isEnrolled:",
        isEnrolled
      );
      return isEnrolled;
    }

    // Convert to string and check
    const studentsStr = String(enrolledStudents);

    // If it's a single address, check if it matches
    if (studentsStr.startsWith("0x") && !studentsStr.includes(",")) {
      const isEnrolled =
        studentsStr.toLowerCase() === userAddress.toLowerCase();
      console.log(
        "Single address check - studentsStr:",
        studentsStr,
        "userAddress:",
        userAddress,
        "isEnrolled:",
        isEnrolled
      );
      return isEnrolled;
    }

    // If multiple addresses, split and check
    const addressList = studentsStr
      .split(",")
      .map((addr) => addr.trim().toLowerCase());
    const isEnrolled = addressList.includes(userAddress.toLowerCase());
    console.log(
      "Multiple addresses check - addressList:",
      addressList,
      "userAddress:",
      userAddress,
      "isEnrolled:",
      isEnrolled
    );
    return isEnrolled;
  };

  return (
    <div className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 min-h-screen p-4 md:p-6 transition-colors duration-300 pt-20 md:pt-[100px]">
      <ToastContainer position="bottom-right" theme="colored" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div className="flex items-center space-x-3 md:space-x-4">
            <Book className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
            <h1 className="text-2xl md:text-3xl font-bold dark:text-yellow-400 text-yellow-500">
              Available Courses
            </h1>
          </div>
          <button
            onClick={() =>
              onNavigateToCreateCourse && onNavigateToCreateCourse()
            }
            className="w-full sm:w-auto bg-yellow-500 text-black px-4 md:px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm md:text-base"
          >
            Create New Course
          </button>
        </div>

        {/* Status Messages */}
        {(success || error) && (
          <div
            className={`mb-4 p-3 md:p-4 rounded-lg flex items-center ${
              success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-700"
            }`}
          >
            {success ? (
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            )}
            <span className="text-sm md:text-base">{success || error}</span>
          </div>
        )}

        {/* Courses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {courses?.length > 0 ? (
            courses.map((course) => (
              <div
                key={course.courseId}
                className="relative p-4 md:p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000 mb-4 md:mb-5"
              >
                {/* Info Icon */}
                <button
                  onClick={(e) => openCourseDetails(course, e)}
                  className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-10 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-yellow-500 hover:bg-gray-400 mt-2 md:mt-3 dark:hover:bg-gray-600 transition-colors"
                >
                  <Info className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Course Image */}
                <div className="relative">
                  <img
                    src="/Vision.jpg"
                    alt={course.courseName}
                    className="w-full h-40 md:h-48 object-cover rounded-xl"
                    style={{ opacity: 0.75 }}
                  />

                  <div className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 flex justify-between items-start">
                    {/* Difficulty Level Tag */}
                    <div
                      className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium shadow-sm ${getDifficultyColor(
                        course.difficulty_level
                      )}`}
                    >
                      {getDifficultyLabel(course.difficulty_level)}
                    </div>

                    {/* Approval Status Badge */}
                    <div
                      className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium shadow-sm flex items-center ${getApprovalStatusStyle(
                        course.approved
                      )}`}
                    >
                      {!course.approved ? (
                        <>
                          <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          <span>Pending</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          <span>Approved</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="p-3 md:p-5">
                  <h2 className="text-lg md:text-xl font-bold mb-2 text-yellow-500 truncate max-w-[200px] md:max-w-[300px]">
                    {course.courseName}
                  </h2>
                  <p className="text-gray-400 mb-3 md:mb-4 line-clamp-2 text-sm md:text-base">
                    {course.description}
                  </p>

                  {/* Course Meta Information */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 md:mb-4">
                    <div className="text-xs md:text-sm text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <Book className="inline-block w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span className="truncate max-w-[120px] md:max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {course.creator}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="inline-block w-3 h-3 md:w-4 md:h-4 mr-1" />
                        {calculateTotalDuration(course.courseId)} Weeks
                      </div>
                    </div>
                    <div className="text-yellow-500 font-semibold text-sm md:text-base">
                      10 ETH
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                    {!course.approved && course.creator === address && (
                      <button
                        onClick={async () => approveCourse(course)}
                        className={`w-full bg-gray-800 text-white dark:bg-gray-300 dark:text-black py-2 px-2 rounded-lg 
      ${
        isLoading || course.approved
          ? "opacity-70 cursor-not-allowed"
          : "hover:bg-gray-600"
      } 
      transition-colors flex items-center justify-center text-sm`}
                        disabled={isLoading || course.approved}
                      >
                        {isLoading ? (
                          <Loader className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
                        ) : (
                          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        )}
                        {course.approved
                          ? "Already Approved"
                          : "Request Review"}
                      </button>
                    )}

                    {course.approved && address && (
                      <>
                        {(() => {
                          const userEnrolled = isUserEnrolled(
                            course.enrolledStudents,
                            address
                          );
                          const hasCertificate = hasCertificateForCourse(
                            course.courseId
                          );

                          if (userEnrolled) {
                            return (
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <button
                                  onClick={() => viewCourse(course.courseId)}
                                  className="flex-1 bg-yellow-500 text-gray-800 py-2 px-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center text-sm"
                                >
                                  <Eye className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                                  View Course
                                </button>

                                {/* Show "Completed" if user has certificate, otherwise show "Unenroll" */}
                                {hasCertificate ? (
                                  <button
                                    className="flex-1 bg-green-600 text-white py-2 px-2 rounded-lg flex items-center justify-center text-sm cursor-default"
                                    disabled
                                  >
                                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                                    Completed
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setCourseToUnenroll(course);
                                      setShowUnenrollConfirm(true);
                                    }}
                                    disabled={loading}
                                    className={`flex-1 bg-red-700 text-white py-2 px-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center text-sm ${
                                      loading
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  >
                                    <WifiOffIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                                    {loading ? "Unenrolling..." : "Unenroll"}
                                  </button>
                                )}
                              </div>
                            );
                          } else {
                            return (
                              <button
                                onClick={() => enroll(course.courseId)}
                                disabled={loading}
                                className={`w-full bg-gray-700 text-white py-2 px-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center text-sm ${
                                  loading ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                <Wifi className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                                {loading ? "Enrolling..." : "Enroll"}
                              </button>
                            );
                          }
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-900 dark:text-gray-300 text-base md:text-normal py-8">
              No courses available!
            </div>
          )}
        </div>

        {/* Unenrollment Confirmation Popup */}
        {showUnenrollConfirm && courseToUnenroll && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                {/* Warning Icon */}
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                  <WifiOffIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Confirm Unenrollment
                </h3>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to unenroll from{" "}
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                    {courseToUnenroll.courseName}
                  </span>
                  ? You will lose all your progress in this course.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowUnenrollConfirm(false);
                      setCourseToUnenroll(null);
                    }}
                    disabled={unenrollLoading}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setUnenrollLoading(true);
                      try {
                        await unEnroll(courseToUnenroll.courseId);
                        setShowUnenrollConfirm(false);
                        setCourseToUnenroll(null);
                      } catch (error) {
                        console.error("Failed to unenroll:", error);
                      } finally {
                        setUnenrollLoading(false);
                      }
                    }}
                    disabled={unenrollLoading}
                    className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                  >
                    {unenrollLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Unenrolling...
                      </>
                    ) : (
                      "Yes, Unenroll"
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Note: This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Absolute Course Details Panel */}
        {selectedCourse && (
          <div
            ref={detailsRef}
            style={{
              top: `${detailsPosition.top}px`,
              left: `${detailsPosition.left}px`,
            }}
            className="fixed w-11/12 sm:w-80 max-w-sm dark:bg-gray-900 bg-gray-100 dark:text-gray-100 text-gray-800 rounded-lg overflow-x-hidden shadow-xl p-4 z-50 dark:border dark:border-gray-700 border-none mx-4 sm:mx-0"
          >
            {/* Panel Tabs */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-1 md:gap-2">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm font-medium rounded-t-lg ${
                    activeTab === "details"
                      ? "bg-yellow-500 text-white"
                      : "text-yellow-500 hover:bg-yellow-100 dark:hover:bg-gray-800"
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
                    className={`px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm font-medium rounded-t-lg ${
                      activeTab === "metrics"
                        ? "bg-yellow-500 text-white"
                        : "text-yellow-500 hover:bg-yellow-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    Metrics
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-48 md:h-64">
                <Loader className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* DETAILS TAB */}
                {activeTab === "details" && (
                  <div className="space-y-3 md:space-y-4 max-h-80 md:max-h-96 overflow-y-auto">
                    <div>
                      <h4 className="font-semibold text-yellow-500 text-sm md:text-base">
                        Course Name
                      </h4>
                      <p className="dark:text-gray-300 text-gray-700 text-sm">
                        {selectedCourse.courseName || ""}
                      </p>
                    </div>

                    {/* Rest of details content with responsive text sizes */}
                    <div>
                      <h4 className="font-semibold text-yellow-500 text-sm md:text-base">
                        Difficulty Level
                      </h4>
                      <div
                        className={`inline-block px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium mt-1 ${getDifficultyColor(
                          selectedCourse.difficulty_level
                        )}`}
                      >
                        {getDifficultyLabel(selectedCourse.difficulty_level) ||
                          ""}
                      </div>
                    </div>

                    {/* Approval Status */}
                    <div>
                      <h4 className="font-semibold text-yellow-500 text-sm md:text-base">
                        Status
                      </h4>
                      <div
                        className={`inline-block px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium mt-1 ${
                          selectedCourse.approved
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {selectedCourse.approved ? "Approved" : "Pending"}
                      </div>
                    </div>

                    {/* Score Section */}
                    {selectedCourse.approvalCount > 0 && (
                      <div>
                        <h4 className="font-semibold text-yellow-500 text-sm md:text-base">
                          Review Score
                        </h4>
                        <div
                          className={`inline-block px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium mt-1 ${
                            selectedCourse.approvalCount >= 80
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {selectedCourse.approvalCount}%
                        </div>
                      </div>
                    )}

                    {/* Feedback Section */}
                    {(selectedCourse.creator === address || role === "ADMIN") &&
                      !selectedCourse.approved && (
                        <div>
                          <h4 className="font-semibold text-yellow-500 text-sm md:text-base">
                            Feedback
                          </h4>
                          <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            {feedbackLoading ? (
                              <div className="flex justify-center py-2">
                                <Loader className="w-4 h-4 text-yellow-500 animate-spin" />
                              </div>
                            ) : courseFeedback ? (
                              <p className="text-xs md:text-sm dark:text-gray-300 text-gray-700">
                                {typeof courseFeedback === "string"
                                  ? courseFeedback
                                  : JSON.stringify(courseFeedback)}
                              </p>
                            ) : (
                              <p className="text-xs md:text-sm text-gray-500 italic">
                                No feedback available yet
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    <div>
                      <h4 className="font-semibold text-yellow-500 text-sm md:text-base">
                        Description
                      </h4>
                      <p className="dark:text-gray-300 text-gray-700 text-sm">
                        {selectedCourse.description || ""}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <h4 className="font-semibold text-yellow-500 text-xs md:text-sm">
                          Chapters
                        </h4>
                        <p className="dark:text-gray-300 text-gray-700 text-sm">
                          {chapters?.length || 0}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-500 text-xs md:text-sm">
                          Lessons
                        </h4>
                        <p className="dark:text-gray-300 text-gray-700 text-sm">
                          {lessons?.length || 0}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-500 text-xs md:text-sm">
                          Quizzes
                        </h4>
                        <p className="dark:text-gray-300 text-gray-700 text-sm">
                          {quizzes?.length || 0}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-500 text-xs md:text-sm">
                          Duration
                        </h4>
                        <p className="dark:text-gray-300 text-gray-700 text-sm">
                          {typeof calculateTotalDuration(
                            selectedCourse.courseId
                          ) === "object"
                            ? "0"
                            : calculateTotalDuration(
                                selectedCourse.courseId
                              )}{" "}
                          Weeks
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-500 text-xs md:text-sm">
                          Prerequisites
                        </h4>
                        <p className="dark:text-gray-300 text-gray-700 text-sm">
                          None
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-500 text-xs md:text-sm">
                          Enrolled
                        </h4>
                        <span className="dark:text-gray-300 text-gray-700 text-sm">
                          {typeof getEnrolledStudentsCount(
                            selectedCourse?.enrolledStudents
                          ) === "object"
                            ? "0"
                            : getEnrolledStudentsCount(
                                selectedCourse?.enrolledStudents
                              ) || 0}{" "}
                          Student(s)
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-yellow-500 text-sm md:text-base">
                        Creator
                      </h4>
                      <p className="dark:text-gray-300 text-gray-700 text-sm truncate max-w-[200px] md:max-w-64">
                        {selectedCourse.creator || ""}
                      </p>
                    </div>

                    {/* View Metrics Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab("metrics")}
                        className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                      >
                        <ChartBar className="w-4 h-4 md:w-5 md:h-5" />
                        <span>View Course Metrics</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* METRICS TAB - Similar responsive adjustments */}
                {activeTab === "metrics" && (
                  <div className="space-y-3 md:space-y-4 max-h-80 md:max-h-96 overflow-y-auto">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg md:text-xl font-bold text-yellow-500">
                        Course Metrics
                      </h3>
                      <button
                        onClick={() => setActiveTab("details")}
                        className="text-yellow-500 hover:text-yellow-600 flex items-center gap-1 text-sm"
                      >
                        <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Back</span>
                      </button>
                    </div>

                    {!latestReviews[selectedCourse.courseId] ? (
                      <div className="flex justify-center items-center h-40 md:h-64">
                        <Loader className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Evaluation Summary */}
                        <div className="dark:bg-gray-800 bg-gray-200 rounded-lg p-3 md:p-4">
                          <h4 className="text-yellow-500 font-medium mb-2 md:mb-3 text-sm md:text-base">
                            Evaluation Summary
                          </h4>
                          <div className="flex justify-center py-2 md:py-4">
                            <div className="relative w-24 h-24 md:w-32 md:h-32">
                              {/* Circular Progress - same logic but smaller on mobile */}
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
                                        stroke="#f3f4f6"
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
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      <span className="text-lg md:text-2xl font-bold text-yellow-500 dark:text-yellow-500">
                                        {approvalPercentage.toFixed(2)}%
                                      </span>
                                      <span className="text-xs uppercase text-gray-400">
                                        {isPassed ? "PASSED" : "FAILED"}
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs md:text-sm">
                            <div>
                              <span className="text-gray-400">Category:</span>
                              <p className="text-yellow-500 truncate">
                                {latestReviews[selectedCourse.courseId]
                                  ?.category || "General"}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400">Pass Mark:</span>
                              <p className="dark:text-yellow-500 text-gray-700">
                                75%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Performance Breakdown */}
                        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-3 md:p-4">
                          <h4 className="text-yellow-500 font-medium mb-3 text-sm md:text-base">
                            Performance Breakdown
                          </h4>
                          {latestReviews[selectedCourse.courseId] &&
                          Object.keys(latestReviews[selectedCourse.courseId])
                            .length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 md:gap-3">
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
                                <div key={key} className="mb-1">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs dark:text-gray-300 text-gray-700 truncate max-w-[100px] md:max-w-none">
                                      {key}
                                    </span>
                                    <span
                                      className={`text-xs font-medium ${
                                        value >= 70
                                          ? "text-green-400"
                                          : value >= 50
                                          ? "text-yellow-400"
                                          : "text-red-400"
                                      }`}
                                    >
                                      {value}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
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
                            <div className="text-center py-3 md:py-4 text-gray-400 text-sm">
                              No detailed metrics available for this course
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
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
