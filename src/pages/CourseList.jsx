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
import Ecosystem1FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import Ecosystem2FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem2Facet.sol/Ecosystem2Facet.json";
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

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
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

  const latestReview = latestReviews[courseId] || {};
  const allReviews = courseReviews[courseId] || [];
  const feedback = courseFeedback[courseId];

  console.log("Courses in courselist:", courses);

  console.log("Latest Review for course", courseId, ":", latestReview);
  console.log("All Reviews for course", courseId, ":", allReviews);
  console.log("Feedback for course", courseId, ":", feedback);

  const { data: chainMetadata } = useChainMetadata(defineChain(1020352220));

  console.log("Name:", chainMetadata?.name);
  console.log("Faucets:", chainMetadata?.faucets);
  console.log("Explorers:", chainMetadata?.explorers);

  const [activeTab, setActiveTab] = useState("details");

  const [filteredChapters, setFilteredChapters] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // const customChain = defineChain({
  //   id: 1020352220,
  //   name: "Skale Titan Hub Testnet",
  //   rpc: `https://1020352220.rpc.thirdweb.com/${
  //     import.meta.env.VITE_APP_THIRDWEB_CLIENT_ID
  //   }`,
  //   nativeCurrency: {
  //     name: "SKALE",
  //     symbol: "SKL",
  //     decimals: 18,
  //   },
  //   blockExplorers: [
  //     {
  //       name: "Blockscout",
  //       url: import.meta.env.VITE_APP_BROCK_EXPLORER,
  //     },
  //   ],
  // });

  const skaleTitanTestnet = defineChain({
    id: 1020352220,
    rpc: `https://1020352220.rpc.thirdweb.com/${
      import.meta.env.VITE_APP_THIRDWEB_CLIENT_ID
    }`,
    name: "SKALE Titan Hub Testnet",
    nativeCurrency: { name: "sFUEL", symbol: "sFUEL", decimals: 18 },
    blockExplorers: [
      { name: "SKALE Explorer", url: "https://staging-explorer.skale.network" },
    ],
  });

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

    console.log("Course ID:", numericCourseId);
    console.log("Filtered Chapters:", courseChapters);
    console.log("Total Duration:", totalDuration);

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

  console.log("Courses:", courses);
  console.log("Address:", address);
  console.log("Role:", role);

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
        address: EcosystemDiamondAddress,
        abi: Ecosystem1Facet_ABI,
        client,
        chain: defineChain(1020352220),
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

      const finalScore = Math.floor(
        (evaluationResult.finalScore || evaluationResult.score || 0) * 100
      );
      const category = evaluationResult.category || "General";
      const passed =
        evaluationResult.passed === "Yes" || evaluationResult.passed === true;

      // 5. Prepare review object for blockchain
      const ensureValidNumber = (value) => {
        const num = Number(value);
        return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100); // Clamp between 0-100
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
        score: finalScore,
        passed: passed,
      };

      console.log("Review object for blockchain:", review);

      // 6. Send to blockchain
      const contract = getContract({
        address: EcosystemDiamondAddress,
        abi: Ecosystem1Facet_ABI,
        client,
        chain: defineChain(1020352220),
      });

      const transaction = prepareContractCall({
        contract,
        method:
          "function approveCourse(uint256 _courseId, uint256 score, (uint256 learnerAgency, uint256 criticalThinking, uint256 collaborativeLearning, uint256 reflectivePractice, uint256 adaptiveLearning, uint256 authenticLearning, uint256 technologyIntegration, uint256 learnerSupport, uint256 assessmentForLearning, uint256 engagementAndMotivation, bool isSubmitted, string category, uint256 score, bool passed) review)",
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
            // const signer = await signerPromise;
            // const diamondContract = new ethers.Contract(
            //   EcosystemDiamondAddress,
            //   Ecosystem1Facet_ABI,
            //   signer
            // );

            const contract = await getContract({
              address: EcosystemDiamondAddress,
              abi: Ecosystem1Facet_ABI,
              client,
              chain: defineChain(1020352220),
            });

            // Check if eligibility check is ready
            const isReadyForCheck =
              // await diamondContract.isCourseReadyForEligibilityCheck(
              //   course.courseId
              // );
              await readContract({
                contract,
                method:
                  "function isCourseReadyForEligibilityCheck(uint256 courseId) view returns (bool)",
                params: [courseId],
              });

            if (isReadyForCheck) {
              console.log(
                `Course ${course.courseId} is ready for eligibility check`
              );
              // await diamondContract.checkCourseEligibilityAfterDelay(
              //   course.courseId
              // );
              await prepareContractCall({
                contract,
                method:
                  "function checkCourseEligibilityAfterDelay(uint256 courseId)",
                params: [courseId],
              });

              // Wait a bit for the eligibility check to process
              await new Promise((resolve) => setTimeout(resolve, 15000));

              // If eligibility check passes, submit for AI review
              // const feedback = await diamondContract.getCourseFeedback(
              //   course.courseId
              // );
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

  const fetchCourseFeedback = async (courseId) => {
    try {
      setFeedbackLoading(true);

      const contract = getContract({
        address: EcosystemDiamondAddress,
        abi: Ecosystem1Facet_ABI,
        client,
        chain: defineChain(1020352220),
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
        address: EcosystemDiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: skaleTitanTestnet,
      });

      const transaction = prepareContractCall({
        contract,
        method: "function enroll(uint256 _courseId) returns (bool)",
        params: [courseId],
        gas: 500000n,
        gasPrice: 0n, // SKALE uses 0 gas price
        value: 0n,
      });

      // Add timeout to sendTransaction
      const transactionPromise = sendTransaction(transaction);
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Transaction timeout")), 30000) // 30 second timeout
      );

      const transactionHash = await Promise.race([
        transactionPromise,
        timeoutPromise,
      ]);

      console.log("Enrollment transaction hash:", transactionHash);

      if (transactionHash) {
        setEnrolled(true);
        toast.success(
          `Enrolled into course ${courseId} successfully! Transaction: ${transactionHash.slice(
            0,
            8
          )}...`
        );

        // Optional: Wait for confirmation with shorter timeout
        try {
          const receiptPromise = waitForReceipt(client, transactionHash);
          const receiptTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Receipt timeout")), 15000)
          );

          const receipt = await Promise.race([receiptPromise, receiptTimeout]);
          console.log("Transaction confirmed:", receipt);
        } catch (receiptError) {
          console.warn(
            "Transaction sent but confirmation failed:",
            receiptError
          );
          // Transaction was still sent, just confirmation failed
        }
      } else {
        throw new Error("Transaction failed - no transaction hash returned");
      }
    } catch (error) {
      console.error("Error enrolling in course:", error);

      // More specific error messages
      if (error.message.includes("timeout")) {
        toast.error(
          "Transaction timed out. Please try again with a faster connection."
        );
      } else if (error.message.includes("gas")) {
        toast.error("Gas estimation failed. Please try again.");
      } else {
        toast.error("Error enrolling in course. Please try again!");
      }
    } finally {
      setLoading(false);
    }
  };

  const unEnroll = async (courseId) => {
    try {
      setLoading(true);
      const contract = getContract({
        address: EcosystemDiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(1020352220),
      });

      const transaction = prepareContractCall({
        contract,
        method: "function unEnroll(uint256 _courseId)",
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
    <div className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 min-h-screen p-6 transition-colors duration-300 pt-[100px]">
      <ToastContainer position="bottom-right" theme="colored" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Book className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold dark:text-yellow-400 text-yellow-500">
              Available Courses
            </h1>
          </div>
          <button
            onClick={() =>
              onNavigateToCreateCourse && onNavigateToCreateCourse()
            }
            className="bg-yellow-500 text-black px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Create New Course
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

        {/* Courses Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {courses?.length > 0 ? (
            courses.map((course) => (
              <div
                key={course.courseId}
                className="relative p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000 mb-5"
              >
                {/* Info Icon */}
                <button
                  onClick={(e) => openCourseDetails(course, e)}
                  className="absolute bottom-4 right-4 z-10 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-yellow-500 hover:bg-gray-400 mt-3 dark:hover:bg-gray-600 transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>

                {/* Course Image */}
                <div className="relative">
                  <img
                    src="/Vision.jpg"
                    alt={course.courseName}
                    className="w-full h-48 object-cover rounded-xl"
                    style={{ opacity: 0.75 }}
                  />

                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    {/* Difficulty Level Tag */}
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${getDifficultyColor(
                        course.difficulty_level
                      )}`}
                    >
                      {getDifficultyLabel(course.difficulty_level)}
                    </div>

                    {/* Approval Status Badge */}
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center ${getApprovalStatusStyle(
                        course.approved
                      )}`}
                    >
                      {!course.approved ? (
                        <>
                          <Clock className="w-4 h-4 mr-1" />
                          <span>Pending</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          <span>Approved</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="p-5">
                  <h2 className="text-xl font-bold mb-2 text-yellow-500 truncate w-[300px]">
                    {course.courseName}
                  </h2>
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Course Meta Information */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-500">
                      <span className="mr-2 flex items-center">
                        <Book className="inline-block w-4 h-4 mr-1 -mt-1" />
                        <span className="truncate w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {course.creator}
                        </span>
                      </span>
                      <span>
                        <Clock className="inline-block w-4 h-4 mr-1 -mt-1" />
                        {calculateTotalDuration(course.courseId)} Weeks
                      </span>
                    </div>
                    <div className="text-yellow-500 font-semibold">10 ETH</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {/* {(role === "ADMIN" ||
                      role === "Course Owner" ||
                      role === "Reviewer") && (
                      <button
                        onClick={() => viewCourse(course.courseId)}
                        className="flex-1 bg-yellow-500 text-sm text-black py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
                      >
                        <Eye className="w-5 h-5 mr-2" />
                        View Course
                      </button>
                    )} */}
                    {!course.approved && course.creator === address && (
                      <button
                        onClick={async () => approveCourse(course)}
                        className={`flex-1 bg-gray-800 text-white px-1 dark:bg-gray-300 text-sm dark:text-black py-2 rounded-lg 
        ${
          isLoading || course.approved
            ? "opacity-70 cursor-not-allowed"
            : "hover:bg-gray-600"
        } 
        transition-colors flex items-center justify-center`}
                        disabled={isLoading || course.approved}
                      >
                        {isLoading ? (
                          <Loader className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <AlertCircle className="w-5 h-5 mr-2" />
                        )}
                        {course.approved
                          ? "Already Approved"
                          : "Request Review"}
                      </button>
                    )}
                    {/* Enroll/Unenroll Buttons */}
                    {/* role === "USER" && */}
                    {course.approved && address && (
                      <>
                        {(() => {
                          const userEnrolled = isUserEnrolled(
                            course.enrolledStudents,
                            address
                          );
                          console.log(
                            `RENDER: Course ${course.courseId} - User ${address} enrolled:`,
                            userEnrolled
                          );
                          return userEnrolled;
                        })() ? (
                          <>
                            <button
                              onClick={() => viewCourse(course.courseId)}
                              className="flex-1 bg-yellow-500 mt-3 text-gray-800 text-sm py-2 px-1 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
                            >
                              <Eye className="w-5 h-5 mr-2" />
                              View Course
                            </button>

                            <button
                              onClick={() => unEnroll(course.courseId)}
                              disabled={loading}
                              className={`flex-1 bg-red-700 mt-3 text-white text-sm py-2 px-1 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center ${
                                loading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <WifiOffIcon className="w-5 h-5 mr-2" />
                              {loading ? "Unenrolling..." : "Unenroll"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => enroll(course.courseId)}
                              disabled={loading}
                              className={`flex-1 bg-gray-700 mt-3 text-white text-sm py-2 px-1 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center ${
                                loading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <Wifi className="w-5 h-5 mr-2" />
                              {loading ? "Enrolling..." : "Enroll"}
                            </button>
                            {/* <div className="text-xs text-gray-500 mt-1">
                              Debug: Not enrolled - showing enroll button
                            </div> */}
                          </>
                        )}
                      </>
                    )}
                    {/* Debug info - remove this later */}
                    {/* {role === "USER" && (
                      <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        Debug Info:
                        <br />
                        Role: {role}
                        <br />
                        Approved: {course.approved ? "Yes" : "No"}
                        <br />
                        Address: {address ? "Connected" : "Not connected"}
                        <br />
                        Enrolled:{" "}
                        {isUserEnrolled(course.enrolledStudents, address)
                          ? "Yes"
                          : "No"}
                        <br />
                        EnrolledStudents:{" "}
                        {JSON.stringify(course.enrolledStudents)}
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-900 dark:text-gray-300 text-normal">
              No courses available!
            </div>
          )}
        </div>

        {/* Absolute Course Details Panel */}
        {selectedCourse && (
          <div
            ref={detailsRef}
            style={{
              top: `${detailsPosition.top}px`,
              left: `${detailsPosition.left}px`,
            }}
            className="fixed w-80 dark:bg-gray-900 bg-gray-100 dark:text-gray-100 text-gray-800 rounded-lg overflow-x-hidden shadow-xl p-4 z-50 dark:border dark:border-gray-700 border-none"
          >
            {/* Panel Tabs */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-3 py-1 text-sm font-medium rounded-t-lg ${
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
                      // Fetch metrics data if not already loaded
                      if (!latestReviews[selectedCourse.courseId]) {
                        getCourseData(selectedCourse.courseId);
                      }
                    }}
                    className={`px-3 py-1 text-sm font-medium rounded-t-lg ${
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
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8 text-yellow-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* DETAILS TAB */}
                {activeTab === "details" && (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div>
                      <h4 className="font-semibold text-yellow-500">
                        Course Name
                      </h4>
                      <p className="dark:text-gray-300 text-gray-700">
                        {selectedCourse.courseName || ""}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-500">
                        Difficulty Level
                      </h4>
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getDifficultyColor(
                          selectedCourse.difficulty_level
                        )}`}
                      >
                        {getDifficultyLabel(selectedCourse.difficulty_level) ||
                          ""}
                      </div>
                    </div>

                    {/* Approval Status Section */}
                    <div>
                      <h4 className="font-semibold text-yellow-500">Status</h4>
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                          selectedCourse.approved
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {selectedCourse.approved ? "Approved" : "Pending"}
                      </div>
                    </div>

                    {/* Score Section - Only show if course has been reviewed */}
                    {selectedCourse.approvalCount > 0 && (
                      <div>
                        <h4 className="font-semibold text-yellow-500">
                          Review Score
                        </h4>
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                            selectedCourse.approvalCount >= 80
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {selectedCourse.approvalCount}%
                        </div>
                      </div>
                    )}

                    {/* Feedback Section - Only visible to course owner or admin */}
                    {(selectedCourse.creator === address || role === "ADMIN") &&
                      !selectedCourse.approved && (
                        <div>
                          <h4 className="font-semibold text-yellow-500">
                            Feedback
                          </h4>
                          <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            {feedbackLoading ? (
                              <div className="flex justify-center py-2">
                                <Loader className="w-4 h-4 text-yellow-500 animate-spin" />
                              </div>
                            ) : courseFeedback ? (
                              <p className="text-sm dark:text-gray-300 text-gray-700">
                                {typeof courseFeedback === "string"
                                  ? courseFeedback
                                  : JSON.stringify(courseFeedback)}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                No feedback available yet
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    <div>
                      <h4 className="font-semibold text-yellow-500">
                        Description
                      </h4>
                      <p className="dark:text-gray-300 text-gray-700">
                        {selectedCourse.description || ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-yellow-500">
                          Chapters
                        </h4>
                        <p className="dark:text-gray-300 text-gray-700">
                          {chapters?.length || 0}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-500">
                          Lessons
                        </h4>
                        <p className="dark:text-gray-300 text-gray-700">
                          {lessons?.length || 0}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-500">
                          Quizzes
                        </h4>
                        <p className="dark:text-gray-300 text-gray-700">
                          {quizzes?.length || 0}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-500">
                          Duration
                        </h4>
                        <p className="dark:text-gray-300 text-gray-700">
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
                        <h4 className="font-semibold text-yellow-500">
                          Prerequisites
                        </h4>
                        <p className="dark:text-gray-300 text-gray-700">None</p>
                      </div>
                      <div className="flex gap-2 flex-col">
                        <h4 className="font-semibold text-yellow-500">
                          Enrolled
                        </h4>
                        <span className="dark:text-gray-300 text-gray-700">
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
                      <h4 className="font-semibold text-yellow-500">Creator</h4>
                      <p className="dark:text-gray-300 text-gray-700 truncate w-64">
                        {selectedCourse.creator || ""}
                      </p>
                    </div>

                    {/* View Metrics Button - Shows only for approved courses */}
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab("metrics")}
                        className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <ChartBar className="w-5 h-5" />
                        <span>View Course Metrics</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* METRICS TAB */}
                {activeTab === "metrics" && (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-yellow-500">
                        Course Metrics
                      </h3>
                      <button
                        onClick={() => setActiveTab("details")}
                        className="text-yellow-500 hover:text-yellow-600 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back</span>
                      </button>
                    </div>

                    {!latestReviews[selectedCourse.courseId] ? (
                      <div className="flex justify-center items-center h-64">
                        <Loader className="w-8 h-8 text-yellow-500 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Evaluation Summary */}
                        <div className="dark:bg-gray-800 bg-gray-200 rounded-lg p-4">
                          <h4 className="text-yellow-500 font-medium mb-3">
                            Evaluation Summary
                          </h4>
                          {/* Circular Progress for Evaluation Summary */}
                          <div className="flex justify-center py-4">
                            <div className="relative w-32 h-32">
                              {/* Circular Progress */}
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
                                      {/* Background circle */}
                                      <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="transparent"
                                        stroke="#f3f4f6"
                                        strokeWidth="10"
                                      />

                                      {/* Progress arc */}
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
                                      <span className="text-2xl font-bold text-yellow-500 dark:text-yellow-500">
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
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-gray-400">Category:</span>
                              <p className="text-yellow-500 truncate w-full">
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
                        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="text-yellow-500 font-medium mb-4">
                            Performance Breakdown
                          </h4>

                          {/* Safely handle latestReviews data */}
                          {latestReviews[selectedCourse.courseId] &&
                          Object.keys(latestReviews[selectedCourse.courseId])
                            .length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
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
                                    <span className="text-xs dark:text-gray-300 text-gray-700">
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
                                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div
                                      className={`h-2.5 rounded-full ${
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
                            <div className="text-center py-4 text-gray-400">
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
