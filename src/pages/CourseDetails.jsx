import {
  useContext,
  useEffect,
  useState,
  memo,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { CourseContext } from "../contexts/courseContext";
import { ChapterContext } from "../contexts/chapterContext";
import { LessonContext } from "../contexts/lessonContext";
import { QuizContext } from "../contexts/quizContext";
import {
  Youtube,
  Image as ImageIcon,
  FileText,
  File,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Book,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import ReviewModal from "../components/ReviewModal";
import { useUser } from "../contexts/userContext";
import PropTypes from "prop-types";
import ProgressBar from "../components/progressBar";
import Ecosystem2FacetABI from "../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import Ecosystem3FacetABI from "../artifacts/contracts/Ecosystem3Facet.sol/Ecosystem3Facet.json";
import Certificate from "../components/Certificate";
import { useCertificates } from "../contexts/certificatesContext";
import { useProfile } from "../contexts/ProfileContext";
import { CSSTransition } from "react-transition-group";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";
import CONTRACT_ADDRESSES from "../constants/addresses";
import { toast } from "react-toastify";
import { useProgress } from "../contexts/progressContext";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;
const Ecosystem3Facet_ABI = Ecosystem3FacetABI.abi;

// Separate Video component to prevent re-renders
const VideoResource = memo(({ url, name }) => (
  <div className="mt-2">
    <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${url}`}
        title={name}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
    <span className="italic text-gray-700 text-sm dark:text-gray-300 mt-2 block">
      {name}
    </span>
  </div>
));

VideoResource.displayName = "VideoResource";

// Separate Image component
const ImageResource = memo(({ url, name, metadata }) => (
  <div className="mt-2">
    <div className="rounded-xl overflow-hidden">
      <img
        src={`https://gateway.pinata.cloud/ipfs/${metadata?.file || url}`}
        alt={name}
        className="w-full h-auto"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/placeholder-image.jpg";
        }}
      />
    </div>
    <span className="italic text-gray-700 text-sm dark:text-gray-300 mt-2 block">
      {name}
    </span>
  </div>
));

ImageResource.displayName = "ImageResource";

// Separate Document component
const DocumentResource = memo(({ url, name, metadata, contentType }) => (
  <div className="mt-2">
    <a
      href={`https://gateway.pinata.cloud/ipfs/${metadata?.file || url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 border border-gray-700/20 dark:border-gray-700"
    >
      {contentType === 2 ? (
        <FileText className="w-5 h-5 text-green-500" />
      ) : (
        <File className="w-5 h-5" />
      )}
      <span className="text-gray-700 dark:text-gray-300">{name}</span>
    </a>
  </div>
));

DocumentResource.displayName = "DocumentResource";

const Resource = memo(({ resource }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    const fetchMetadata = async () => {
      // Skip fetch for video content
      if (resource.contentType === 0) {
        return;
      }

      // Skip if we already have metadata
      if (metadata) {
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://gateway.pinata.cloud/ipfs/${resource.url}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch resource");
        }
        const data = await response.json();
        if (isSubscribed) {
          setMetadata(data);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err.message);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchMetadata();

    return () => {
      isSubscribed = false;
    };
  }, [resource.url, resource.contentType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">Failed to load resource: {error}</div>
    );
  }

  switch (resource.contentType) {
    case 0:
      return <VideoResource url={resource.url} name={resource.name} />;
    case 1:
      return (
        <ImageResource
          url={resource.url}
          name={resource.name}
          metadata={metadata}
        />
      );
    case 2:
      return (
        <DocumentResource
          url={resource.url}
          name={resource.name}
          metadata={metadata}
          contentType={resource.contentType}
        />
      );
    default:
      return <div className="text-gray-500 p-4">Unsupported resource type</div>;
  }
});

Resource.displayName = "Resource";

// Quiz component with navigation and scoring
const Quiz = memo(({ quiz, courseId }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockEndTime, setLockEndTime] = useState(null);
  const account = useActiveAccount();
  const address = account?.address;
  const { quizzes } = useContext(QuizContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completedQuizIds, addCompletedQuiz } = useProgress();

  useEffect(() => {
    const checkQuizLock = async () => {
      try {
        const contract = await getContract({
          address: DiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(11155111),
        });

        const lockTime = await readContract({
          contract,
          method: "getQuizLockTime",
          params: [quiz.quizId, address],
        });

        if (lockTime > 0) {
          const sixHoursInSeconds = BigInt(6 * 60 * 60);
          const currentTime = BigInt(Math.floor(Date.now() / 1000));

          if (currentTime - lockTime < sixHoursInSeconds) {
            setIsLocked(true);
          }
        }
      } catch (error) {
        console.error("Error checking quiz lock:", error);
      }
    };

    checkQuizLock();
  }, [quiz.quizId, client, address]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, quiz.questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const calculateScore = useCallback(() => {
    let correctAnswers = 0;
    quiz.questions.forEach((question) => {
      const selectedAnswer = selectedAnswers[question.questionId];
      if (
        selectedAnswer !== undefined &&
        question.choices[selectedAnswer].isCorrect
      ) {
        correctAnswers++;
      }
    });
    return (correctAnswers / quiz.questions.length) * 100;
  }, [quiz.questions, selectedAnswers]);

  // First, let's modify the validation function to better handle course IDs
  const validateQuizData = (courseId, quizId, answers, score) => {
    console.log("Validating quiz data:", { courseId, quizId, answers, score }); // Debug log

    // Check if courseId exists and is valid
    if (courseId === undefined || courseId === null) {
      throw new Error("Course ID is missing");
    }

    // Allow courseId of 0 since array indices start at 0
    if (typeof courseId !== "number" && typeof courseId !== "bigint") {
      throw new Error("Course ID must be a number or BigInt");
    }

    if (!quizId && quizId !== 0) throw new Error("Invalid quiz ID");
    if (!Array.isArray(answers) || !answers.length)
      throw new Error("No answers provided");
    if (score < 0 || score > 100) throw new Error("Invalid score");
  };

  const validateQuizSubmission = () => {
    // Check if all questions are answered
    const unansweredQuestions = quiz.questions.filter(
      (q) => selectedAnswers[q.questionId] === undefined
    );

    if (unansweredQuestions.length > 0) {
      toast.error(
        `Please answer all ${unansweredQuestions.length} remaining questions`
      );
      return false;
    }

    return true;
  };

  // Then update the relevant part of handleSubmit
  const handleSubmit = useCallback(async () => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!validateQuizSubmission()) {
      return;
    }
    setIsSubmitting(true);

    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      setQuizSubmitted(true);

      setAttempts((prevAttempts) => prevAttempts + 1);

      // Only proceed with contract call if score is >= 75%
      if (calculatedScore >= 75) {
        const contract = getContract({
          address: DiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(11155111),
        });

        // Convert IDs to BigInt
        const courseIdBN = BigInt(courseId);
        const quizIdBN = BigInt(quiz.quizId);

        // Prepare answers array - ensure all answers are provided and converted to BigInt
        const answersArray = quiz.questions.map((q) => {
          const answer = selectedAnswers[q.questionId];
          // If no answer selected, default to 0 (or handle as needed)
          return BigInt(answer !== undefined ? answer : 0);
        });

        console.log("Submitting quiz with data:", {
          courseId: courseIdBN.toString(),
          quizId: quizIdBN.toString(),
          answers: answersArray,
          score: calculatedScore,
          answersLength: answersArray.length,
          questionsLength: quiz.questions.length,
        });

        // Validate that we have answers for all questions
        if (answersArray.length !== quiz.questions.length) {
          throw new Error("Not all questions have been answered");
        }

        const transaction = prepareContractCall({
          contract,
          method: "submitQuiz", // Just the method name, not the full signature
          params: [
            courseIdBN,
            quizIdBN,
            answersArray,
            // BigInt(Math.floor(calculatedScore)), // Ensure score is integer
          ],
        });

        // Send transaction with account
        const result = await sendTransaction({
          transaction,
          account,
        });

        console.log("Quiz submitted successfully:", result);
        toast.success(
          `Quiz submitted successfully! Score: ${calculatedScore.toFixed(1)}%`
        );

        // Add to completed quizzes if score is passing
        if (calculatedScore >= 75) {
          addCompletedQuiz(quiz.quizId);
        }

        // Lock quiz if max attempts reached (even if failed)
        if (attempts + 1 >= 3) {
          try {
            const lockTransaction = prepareContractCall({
              contract,
              method: "lockQuiz",
              params: [courseIdBN, quizIdBN],
            });

            await sendTransaction({
              transaction: lockTransaction,
              account,
            });
            console.log("Quiz locked due to max attempts");
            setIsLocked(true);
          } catch (lockError) {
            console.error("Failed to lock quiz:", lockError);
          }
        }
      } else {
        // Score below 75% - just show message, no contract call
        toast.warning(
          `Score ${calculatedScore.toFixed(
            1
          )}% is below passing grade (75%). Please try again.`
        );

        // Still lock if max attempts reached
        if (attempts + 1 >= 3) {
          try {
            const contract = getContract({
              address: DiamondAddress,
              abi: Ecosystem2Facet_ABI,
              client,
              chain: defineChain(11155111),
            });

            const lockTransaction = prepareContractCall({
              contract,
              method: "lockQuiz",
              params: [BigInt(courseId), BigInt(quiz.quizId)],
            });

            await sendTransaction({
              transaction: lockTransaction,
              account,
            });
            setIsLocked(true);
            toast.info("Maximum attempts reached. Quiz locked for 6 hours.");
          } catch (lockError) {
            console.error("Failed to lock quiz:", lockError);
          }
        }
      }
    } catch (error) {
      console.error("Quiz submission error:", error);

      // More specific error messages
      if (error.message?.includes("user rejected")) {
        toast.error("Transaction was rejected");
      } else if (error.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds for transaction");
      } else if (error.message?.includes("execution reverted")) {
        // Try to extract the revert reason
        const revertReason =
          error.data?.message || error.reason || "Contract execution reverted";
        toast.error(`Quiz submission failed: ${revertReason}`);
      } else if (error.message?.includes("Already completed")) {
        toast.error("You have already completed this quiz");
      } else {
        toast.error("Failed to submit quiz. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    calculateScore,
    attempts,
    quiz,
    selectedAnswers,
    client,
    courseId,
    account,
    addCompletedQuiz,
  ]);

  // Helper function to parse errors
  function parseSubmissionError(error) {
    if (error.code === "CALL_EXCEPTION") {
      if (error.data) {
        // Try to decode custom error
        return `Quiz submission failed: ${error.data}`;
      }
      return "Transaction failed. Please check your answers and try again.";
    }
    if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
      return "Unable to estimate gas. Please check your answers and try again.";
    }
    return "An unexpected error occurred. Please try again.";
  }

  const resetQuiz = useCallback(() => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setQuizSubmitted(false);
    setScore(0);
  }, []);

  const handleAnswerSelect = useCallback(
    (questionId, index) => {
      if (!quizSubmitted) {
        setSelectedAnswers((prev) => ({
          ...prev,
          [questionId]: index,
        }));
      }
    },
    [quizSubmitted]
  );

  if (isLocked) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
          Quiz Locked
        </h3>
        <p className="mt-2 text-red-700 dark:text-red-300">
          You've exceeded the maximum attempts. Please try again after{" "}
          {lockEndTime ? new Date(lockEndTime).toLocaleString() : "6 hours"}.
        </p>
      </div>
    );
  }

  if (completedQuizIds.has(quiz.quizId.toString())) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
          Quiz Completed
        </h3>
        <p className="mt-2 text-green-700 dark:text-green-300">
          You have already completed this quiz.
        </p>
      </div>
    );
  }

  if (quizSubmitted) {
    return (
      <div className="p-6">
        <div
          className={`p-4 rounded-lg ${
            score >= 75
              ? "bg-green-50 dark:bg-green-900/20"
              : "bg-yellow-50 dark:bg-yellow-900/20"
          }`}
        >
          <h3
            className={`text-lg font-medium ${
              score >= 75
                ? "text-green-800 dark:text-green-200"
                : "text-yellow-800 dark:text-yellow-200"
            }`}
          >
            Quiz Results
          </h3>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            Your score: {score.toFixed(1)}%
          </p>
          {score >= 80 ? (
            <p className="mt-2 text-green-700 dark:text-green-300">
              Congratulations! You've passed the quiz!
            </p>
          ) : (
            <div>
              <p className="mt-2 text-yellow-700 dark:text-yellow-300">
                You need 75% to pass. Attempts remaining: {3 - attempts}
              </p>
              {attempts < 3 && (
                <button
                  onClick={resetQuiz}
                  className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {quiz.questions.map((question, index) => {
            const selectedAnswer = selectedAnswers[question.questionId];
            const correctAnswer = question.choices.findIndex(
              (choice) => choice.isCorrect
            );

            return (
              <div
                key={question.questionId}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <p className="font-medium text-gray-900 dark:text-white">
                  {index + 1}. {question.questionText}
                </p>
                <div className="mt-2 space-y-2">
                  {question.choices.map((choice, choiceIndex) => (
                    <div
                      key={choiceIndex}
                      className={`p-2 rounded ${
                        choiceIndex === correctAnswer
                          ? "bg-green-100 dark:bg-green-900/20"
                          : choiceIndex === selectedAnswer && !choice.isCorrect
                          ? "bg-red-100 dark:bg-red-900/20"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      {choice.option}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="mt-4">
      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">
            {currentQuestion.questionText}
          </h3>
        </div>

        <div className="space-y-3">
          {currentQuestion.choices.map((choice, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                selectedAnswers[currentQuestion.questionId] === index
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                  : ""
              }`}
              onClick={() =>
                handleAnswerSelect(currentQuestion.questionId, index)
              }
            >
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  selectedAnswers[currentQuestion.questionId] === index
                    ? "border-yellow-500 bg-yellow-500"
                    : "border-gray-300"
                }`}
              />
              <span className="text-gray-700 dark:text-gray-300">
                {choice.option}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center gap-2 p-2 px-4 rounded-lg ${
              currentQuestionIndex === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300 dark:text-gray-900"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={
                Object.keys(selectedAnswers).length !== quiz.questions.length
              }
              className={`p-2 px-4 rounded-lg flex items-center gap-2 ${
                Object.keys(selectedAnswers).length === quiz.questions.length
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-yellow-500 dark:text-gray-900 hover:bg-yellow-600 p-2 px-4 rounded-lg"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

Quiz.displayName = "Quiz";

const LessonContent = memo(
  ({
    lesson,
    quiz,
    isQuizOpen,
    onToggleQuiz,
    role,
    currentCourse,
    address,
    courseId,
  }) => {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 first:border-0 first:pt-0">
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
          {lesson.lessonName}
        </h3>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {lesson.lessonContent}
        </p>

        {/* Additional Resources Section */}
        {lesson.additionalResources?.some((r) => r.url) && (
          <div className="mt-4 space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Additional Resources
            </h4>
            <div className="grid gap-4">
              {lesson.additionalResources
                .filter((r) => r.url)
                .map((resource, index) => (
                  <div key={index}>
                    <Resource resource={resource} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Quiz Section */}
        {quiz && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg dark:text-gray-300">
            <div
              className="w-full flex justify-between cursor-pointer"
              onClick={() => onToggleQuiz(lesson.lessonId)}
            >
              <span className="dark:text-gray-300">{quiz.quizTitle}</span>
              <ChevronRight
                className={`w-4 h-4 dark:text-yellow-500 transform transition-transform ${
                  isQuizOpen ? "rotate-90" : ""
                }`}
              />
            </div>

            <div>{isQuizOpen && <Quiz quiz={quiz} />}</div>
          </div>
        )}
      </div>
    );
  }
);

LessonContent.displayName = "LessonContent";

// PropTypes for better development experience and documentation
LessonContent.propTypes = {
  lesson: PropTypes.shape({
    lessonId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    lessonName: PropTypes.string.isRequired,
    lessonContent: PropTypes.string.isRequired,
    additionalResources: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
        name: PropTypes.string,
        contentType: PropTypes.number,
      })
    ),
  }).isRequired,
  quiz: PropTypes.shape({
    quizTitle: PropTypes.string.isRequired,
    questions: PropTypes.array.isRequired,
  }),
  isQuizOpen: PropTypes.bool.isRequired,
  onToggleQuiz: PropTypes.func.isRequired,
  role: PropTypes.string.isRequired,
  currentCourse: PropTypes.shape({
    approved: PropTypes.bool.isRequired,
    enrolledStudents: PropTypes.array,
  }).isRequired,
  address: PropTypes.string.isRequired,
  courseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};

const CourseDetails = memo(({ courseId }) => {
  const { courses } = useContext(CourseContext);
  const { chapters, fetchChapters, setChapters } = useContext(ChapterContext);
  const { lessons } = useContext(LessonContext);
  const { quizzes } = useContext(QuizContext);
  const [openQuizIds, setOpenQuizIds] = useState(new Set());
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { role } = useUser();
  const account = useActiveAccount();
  const address = account?.address;
  const [completedLessons, setCompletedLessons] = useState(0);
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [learnerName, setLearnerName] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const { certificates } = useCertificates();
  const { profile } = useProfile();
  const [hasCertificate, setHasCertificate] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [markingAsReadIds, setMarkingAsReadIds] = useState(new Set());
  const {
    completedLessonIds,
    completedQuizIds,
    loading: progressLoading,
    refreshProgress,
    addCompletedLesson,
    addCompletedQuiz,
  } = useProgress();

  useEffect(() => {
    if (courseId) {
      refreshProgress(courseId);
    }
  }, [courseId, refreshProgress]);

  const markAsRead = async (courseId, chapterId, lessonId) => {
    // Add lesson to loading state
    const lessonIdStr = lessonId.toString();
    setMarkingAsReadIds((prev) => new Set([...prev, lessonIdStr]));

    try {
      // Convert parameters to BigInts for ethers v6
      const courseIdBN = BigInt(courseId);
      const chapterIdBN = BigInt(chapterId);
      const lessonIdBN = BigInt(lessonId);

      const contract = await getContract({
        address: DiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      try {
        const tx = await prepareContractCall({
          contract,
          method: "markAsRead",
          params: [courseIdBN, chapterIdBN, lessonIdBN],
        });

        console.log("Transaction sent:", tx.hash);

        // Wait for transaction confirmation
        await sendTransaction({ transaction: tx, account });
        toast.success(`Successfully completed lesson ${lessonIdBN}`);
        // Update local state only after confirmation
        addCompletedLesson(lessonId);
      } catch (contractError) {
        console.error("Contract interaction failed:", {
          error: contractError,
          errorMessage: contractError.message,
        });

        if (contractError.message.includes("Already marked")) {
          throw new Error("This lesson has already been marked as read");
        } else if (contractError.message.includes("Lesson doesn't exist")) {
          throw new Error("Invalid lesson ID");
        }

        throw contractError;
      }
    } catch (error) {
      console.error("Error in markAsRead:", error);
      throw error;
    } finally {
      // Remove lesson from loading state
      setMarkingAsReadIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lessonIdStr);
        return newSet;
      });
    }
  };

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

  // Use refs to store previous values
  const prevCourseIdRef = useRef(courseId);
  const prevChaptersRef = useRef(chapters);

  // Memoize current course
  const currentCourse = useMemo(
    () => courses.find((course) => course.courseId === courseId),
    [courses, courseId]
  );

  // Memoize filtered chapters
  const filteredChapters = useMemo(() => {
    const filtered = chapters.filter(
      (chapter) => chapter.courseId?.toString() === courseId?.toString()
    );

    console.log("=== CHAPTER FILTERING DEBUG ===", {
      courseId,
      totalChapters: chapters.length,
      filteredChapters: filtered.length,
      chapters: chapters.map((ch) => ({
        chapterId: ch.chapterId,
        courseId: ch.courseId,
        chapterName: ch.chapterName,
      })),
      filtered: filtered.map((ch) => ({
        chapterId: ch.chapterId,
        courseId: ch.courseId,
        chapterName: ch.chapterName,
      })),
    });

    return filtered;
  }, [chapters, courseId]);

  // Update totalLessons calculation
  const totalLessons = useMemo(() => {
    return lessons.filter((lesson) =>
      filteredChapters.some(
        (chapter) =>
          chapter.chapterId?.toString() === lesson.chapterId?.toString()
      )
    ).length;
  }, [lessons, filteredChapters]);

  // Total quizzes calculation
  const totalQuizzes = useMemo(() => {
    // Get all lesson IDs for the filtered chapters
    const lessonIds = lessons
      .filter((lesson) =>
        filteredChapters.some(
          (chapter) =>
            chapter.chapterId?.toString() === lesson.chapterId?.toString()
        )
      )
      .map((lesson) => lesson.lessonId.toString());

    // Count quizzes that are linked to these lessons
    return quizzes.filter((quiz) =>
      lessonIds.includes(quiz.lessonId.toString())
    ).length;

    // console.log("Total quizzes:", totalQuizzes2);
  }, [quizzes, lessons, filteredChapters]);

  useEffect(() => {
    const hasCertificate = certificates.some(
      (cert) =>
        cert.courseId === currentCourse.courseId.toString() &&
        cert.owner.toLowerCase() === address.toLowerCase()
    );

    console.log("Checking for certificate:", hasCertificate);

    if (hasCertificate) {
      setShowCongratsPopup(false);
      setHasCertificate(true);
      // alert("You have already claimed a certificate for this course.");
    } else {
      setHasCertificate(false);
      // Don't automatically show popup here - only show when course is completed
    }
  }, [certificates, currentCourse.courseId, address]);

  // Fetch chapters only when courseId changes or when chapters are empty
  useEffect(() => {
    const shouldFetchChapters =
      courseId &&
      (prevCourseIdRef.current !== courseId || chapters.length === 0);

    console.log("=== CHAPTER FETCH DEBUG ===", {
      courseId,
      shouldFetchChapters,
      chaptersLength: chapters.length,
      prevCourseId: prevCourseIdRef.current,
    });

    if (shouldFetchChapters) {
      console.log("Fetching chapters for courseId:", courseId);
      fetchChapters(courseId);
      prevCourseIdRef.current = courseId;
    }
  }, [courseId, fetchChapters]);

  // Update chapters only when the chapters array actually changes
  useEffect(() => {
    if (chapters !== prevChaptersRef.current && chapters.length > 0) {
      console.log("Raw chapters received:", chapters);

      // Set first chapter as active only if there's no active chapter
      if (chapters.length > 0 && !activeChapterId) {
        setActiveChapterId(chapters[0].chapterId?.toString());
      }

      prevChaptersRef.current = chapters;
    }
  }, [chapters, activeChapterId]);

  // Memoize lesson filtering function
  const getLessonsForChapter = useCallback(
    (chapterId) =>
      lessons.filter((lesson) => lesson.chapterId.toString() === chapterId),
    [lessons]
  );

  // Memoize quiz finding function
  const getQuizForLesson = useCallback(
    (lessonId) =>
      quizzes.find((quiz) => quiz.lessonId.toString() === lessonId.toString()),
    [quizzes]
  );

  const toggleQuiz = useCallback((lessonId) => {
    setOpenQuizIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  }, []);

  const handleSubmitReview = useCallback((courseId, ratings) => {
    submitReview(
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
  }, []);

  const handleCertificateClick = (cert) => {
    setLoading(true);
    setSelectedCertificate(cert);
    setShowPopup(true);
    setLoading(false);
  };

  const handleCloseCertPopup = () => {
    setShowPopup(false);
    setTimeout(() => setSelectedCertificate(null), 300); // Delay unmounting to allow transition
  };

  // Memoize chapter content rendering
  const renderChapterContent = useCallback(
    (chapter, chapterIndex) => {
      if (chapter.chapterId !== activeChapterId) return null;

      const chapterLessons = getLessonsForChapter(chapter.chapterId);

      return (
        <div key={chapter.chapterId} className="p-6">
          {/* Chapter header */}
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-yellow-500" />
            Module {chapterIndex + 1}: {chapter.chapterName}
          </h2>

          {/* Lessons */}
          <div className="space-y-6">
            {chapterLessons.map((lesson) => {
              const lessonQuiz = getQuizForLesson(lesson.lessonId);
              return (
                <LessonContent
                  key={lesson.lessonId}
                  lesson={lesson}
                  quiz={lessonQuiz}
                  isQuizOpen={
                    openQuizIds.has(lesson.lessonId) && (
                      <Quiz quiz={lessonQuiz} courseId={courseId} />
                    )
                  }
                  onToggleQuiz={toggleQuiz}
                  role={role}
                  currentCourse={currentCourse}
                  address={address}
                  courseId={courseId}
                />
              );
            })}
          </div>
        </div>
      );
    },
    [
      activeChapterId,
      getLessonsForChapter,
      getQuizForLesson,
      openQuizIds,
      toggleQuiz,
      role,
      currentCourse,
      address,
    ]
  );

  //issueCertificate section - only show congratulations popup when course is 100% complete AND user doesn't have certificate
  useEffect(() => {
    const isFullyCompleted =
      completedLessonIds.size + completedQuizIds.size !== 0 &&
      totalLessons + totalQuizzes !== 0 &&
      completedLessonIds.size + completedQuizIds.size ===
        totalLessons + totalQuizzes;

    console.log("=== CERTIFICATE POPUP DEBUG ===", {
      completedItems: completedLessonIds.size + completedQuizIds.size,
      totalItems: totalLessons + totalQuizzes,
      isFullyCompleted,
      hasCertificate,
      shouldShowPopup: isFullyCompleted && !hasCertificate,
    });

    if (isFullyCompleted && !hasCertificate) {
      setShowCongratsPopup(true);
    } else {
      setShowCongratsPopup(false);
    }
  }, [
    completedLessonIds,
    completedQuizIds,
    totalLessons,
    totalQuizzes,
    hasCertificate,
  ]);

  const handleClosePopup = () => {
    setShowCongratsPopup(false);
  };

  //handle claim certificate
  //Leave it for now
  const handleClaimCertificate = async () => {
    try {
      if (!client) {
        throw new Error("No client available");
      }

      // Check if profile is missing
      if (!profile || profile.firstName === null) {
        alert("Profile not found. Please connect your profile first.");
        return;
      }

      // Set learner name from profile
      const fullName = `${profile.firstName} ${profile.secondName}`;
      setLearnerName(fullName);

      // Optional: update learnerName local variable directly if needed
      const learner = fullName;

      // Ensure learner name is provided
      if (!learner.trim()) {
        alert("Profile not found. Please connect your profile first.");
        return;
      }

      const contract = await getContract({
        address: DiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const cert_issuer = "ABYA UNIVERSITY";
      const issue_date = new Date().toISOString();

      // Create certificate data object
      const newCertificateData = {
        learner,
        courseName: currentCourse.courseName,
        issuer: cert_issuer,
        issueDate: issue_date,
        courseId: currentCourse.courseId,
      };

      const tx = await contract.issueCertificate(
        currentCourse.courseId,
        learner,
        currentCourse.courseName,
        cert_issuer,
        Math.floor(Date.now() / 1000),
        { gasLimit: 500000 }
      );

      console.log("Certificate Parameters:", {
        courseId: BigInt(currentCourse.courseId).toString(),
        learner,
        courseName: currentCourse.courseName,
        issuer: cert_issuer,
        timestamp: Math.floor(Date.now() / 1000),
      });

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction Receipt: ", receipt);

      // Set certificate data, close congrats popup and show certificate popup
      setCertificateData(newCertificateData);
      setShowCongratsPopup(false);
      setShowCertificate(true);
    } catch (err) {
      console.error("Error issuing certificate:", err);
      // Extract more error information if possible
      if (err.error && err.error.message) {
        console.error("Contract error message:", err.error.message);
      }
      if (err.receipt) {
        console.error("Transaction receipt:", err.receipt);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-[100px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content Area - Full width on mobile, 80% on lg+ */}
          <div className="w-full lg:w-[80%] mt-2 sm:mt-4">
            {/* Simple Course Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex flex-wrap items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                {/* Simple status badges */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Course
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      currentCourse?.approved
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}
                  >
                    {currentCourse?.approved ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>

              {/* Course Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 leading-tight">
                {currentCourse?.courseName}
              </h1>

              {/* Course Description */}
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {currentCourse?.description}
              </p>
            </div>

            <div className="space-y-6 sm:space-y-8">
              {filteredChapters.map((chapter, chapterIndex) => {
                if (
                  chapter.chapterId?.toString() === activeChapterId?.toString()
                ) {
                  return (
                    <div key={chapter.chapterId} className="p-4 sm:p-6">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                        Module {chapterIndex + 1}: {chapter.chapterName}
                      </h2>

                      <div className="space-y-4 sm:space-y-6">
                        {lessons
                          .filter(
                            (lesson) =>
                              lesson.chapterId?.toString() ===
                              chapter.chapterId?.toString()
                          )
                          .map((lesson) => {
                            const lessonQuiz = quizzes.find(
                              (quiz) =>
                                quiz.lessonId.toString() ===
                                lesson.lessonId.toString()
                            );

                            return (
                              <div
                                key={lesson.lessonId}
                                className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6 first:border-0 first:pt-0"
                              >
                                <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
                                  {lesson.lessonName}
                                </h3>
                                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                                  {lesson.lessonContent}
                                </p>

                                {lesson?.additionalResources?.some(
                                  (r) => r.url
                                ) && (
                                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                                    <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">
                                      Additional Resources
                                    </h4>
                                    <div className="grid gap-3 sm:gap-4">
                                      {lesson?.additionalResources
                                        ?.filter((r) => r.url)
                                        .map((resource, index) => (
                                          <div key={index}>
                                            <Resource resource={resource} />
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {/* Mark as read button */}
                                {currentCourse.approved && address && (
                                  <>
                                    {(() => {
                                      const userEnrolled = isUserEnrolled(
                                        currentCourse.enrolledStudents,
                                        address
                                      );
                                      return userEnrolled;
                                    })() ? (
                                      <div className="flex justify-between items-center mt-3 sm:mt-4">
                                        <button
                                          className={`bg-yellow-500 text-gray-900 p-2 sm:p-3 my-2 sm:my-3 rounded-lg font-normal flex items-center gap-2 text-sm sm:text-base ${
                                            completedLessonIds.has(
                                              lesson.lessonId.toString()
                                            ) ||
                                            markingAsReadIds.has(
                                              lesson.lessonId.toString()
                                            )
                                              ? "opacity-50 cursor-not-allowed"
                                              : "hover:bg-yellow-600"
                                          }`}
                                          onClick={async () => {
                                            if (
                                              !completedLessonIds.has(
                                                lesson.lessonId.toString()
                                              ) &&
                                              !markingAsReadIds.has(
                                                lesson.lessonId.toString()
                                              )
                                            ) {
                                              try {
                                                await markAsRead(
                                                  currentCourse.courseId,
                                                  chapter.chapterId,
                                                  lesson.lessonId
                                                );
                                              } catch (error) {
                                                console.error(
                                                  "Failed to mark lesson as read:",
                                                  error
                                                );
                                              }
                                            }
                                          }}
                                          disabled={
                                            completedLessonIds.has(
                                              lesson.lessonId.toString()
                                            ) ||
                                            markingAsReadIds.has(
                                              lesson.lessonId.toString()
                                            )
                                          }
                                        >
                                          {markingAsReadIds.has(
                                            lesson.lessonId.toString()
                                          ) ? (
                                            <>
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                              <span className="hidden sm:inline">
                                                Marking...
                                              </span>
                                            </>
                                          ) : completedLessonIds.has(
                                              lesson.lessonId.toString()
                                            ) ? (
                                            "Completed"
                                          ) : (
                                            "Mark as Read"
                                          )}
                                        </button>
                                      </div>
                                    ) : null}
                                  </>
                                )}

                                {lessonQuiz && (
                                  <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg dark:text-gray-300">
                                    <div
                                      className="w-full flex justify-between items-center cursor-pointer"
                                      onClick={() =>
                                        toggleQuiz(lesson.lessonId)
                                      }
                                    >
                                      <span className="dark:text-gray-300 text-sm sm:text-base">
                                        {lessonQuiz.quizTitle}
                                      </span>
                                      <ChevronRight
                                        className={`w-4 h-4 dark:text-yellow-500 transform transition-transform ${
                                          openQuizIds.has(lesson.lessonId)
                                            ? "rotate-90"
                                            : ""
                                        }`}
                                      />
                                    </div>
                                    <div>
                                      {openQuizIds.has(lesson.lessonId) && (
                                        <Quiz
                                          quiz={lessonQuiz}
                                          courseId={courseId}
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Right Sidebar Navigation - Hidden on mobile, shown on lg+ */}
          <div className="hidden lg:block w-full lg:w-[20%] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-fit sticky top-24 lg:top-[100px] overflow-hidden">
            {/* Certificate Status Section */}
            {certificates.some(
              (cert) =>
                cert.courseId === currentCourse.courseId.toString() &&
                cert.owner.toLowerCase() === address.toLowerCase()
            ) && (
              <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/30 dark:via-green-900/20 dark:to-teal-900/20 border-b border-emerald-200 dark:border-emerald-700/50">
                <div className="absolute inset-0 opacity-10 dark:opacity-5">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                    fill="none"
                  >
                    <defs>
                      <pattern
                        id="certificate-pattern"
                        x="0"
                        y="0"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="1"
                          fill="currentColor"
                          className="text-emerald-400"
                        />
                      </pattern>
                    </defs>
                    <rect
                      width="100"
                      height="100"
                      fill="url(#certificate-pattern)"
                    />
                  </svg>
                </div>

                <div className="relative p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-lg shadow-md">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                          Certificate Earned
                        </h4>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            CLAIMED
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                        Congratulations! You've successfully completed this
                        course.
                      </p>

                      <button
                        className="mt-3 w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-emerald-700 dark:text-emerald-300 text-xs font-medium py-2 px-3 rounded-lg border border-emerald-200 dark:border-emerald-600 transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2"
                        onClick={() => {
                          const userCertificate = certificates.find(
                            (cert) =>
                              cert.courseId ===
                                currentCourse.courseId.toString() &&
                              cert.owner.toLowerCase() === address.toLowerCase()
                          );
                          if (userCertificate) {
                            handleCertificateClick(userCertificate);
                          }
                        }}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Certificate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Navigation Drawer - Show on small screens */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-40">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowMobileNav(!showMobileNav)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <BookOpen className="w-4 h-4" />
                  Course Navigation
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {Math.round(
                    ((completedLessonIds.size + completedQuizIds.size) /
                      (totalLessons + totalQuizzes)) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="p-4 sm:p-6">
              {/* Progress Section */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Course Progress
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {Math.round(
                      ((completedLessonIds.size + completedQuizIds.size) /
                        (totalLessons + totalQuizzes)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <ProgressBar
                  completedLessons={
                    completedLessonIds.size + completedQuizIds.size
                  }
                  totalLessons={totalLessons + totalQuizzes}
                />
              </div>

              {/* Navigation Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Course Modules
                </h3>

                <div className="space-y-1">
                  {filteredChapters.map((chapter, index) => {
                    const isActive =
                      activeChapterId?.toString() ===
                      chapter.chapterId?.toString();
                    const isCompleted =
                      completedLessonIds.has(chapter.chapterId?.toString()) ||
                      completedQuizIds.has(chapter.chapterId?.toString());

                    return (
                      <div
                        key={chapter.chapterId}
                        onClick={() =>
                          setActiveChapterId(chapter.chapterId?.toString())
                        }
                        className={`group relative p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                          isActive
                            ? "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700/50 shadow-sm"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                              isActive
                                ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm"
                                : isCompleted
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {isCompleted ? (
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              index + 1
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span
                                className={`text-xs font-medium truncate ${
                                  isActive
                                    ? "text-yellow-800 dark:text-yellow-200"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {chapter.chapterName}
                              </span>
                              {isActive && (
                                <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              Module {index + 1}
                            </p>
                          </div>

                          {isCompleted && !isActive && (
                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>

                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 sm:h-6 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-r-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Congratulations Popup - Responsive */}
      {!hasCertificate && showCongratsPopup && (
        <div
          id="popup"
          className="fixed z-50 inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div className="relative bg-white dark:bg-gray-800 w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform animate-scaleIn">
            <div
              className="relative h-24 sm:h-28 lg:h-32 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600"
              style={{
                background: `linear-gradient(135deg, rgba(251, 191, 36, 0.95), rgba(245, 158, 11, 0.95)), url('/congratulations.jpg')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-yellow-600/40"></div>

              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 text-yellow-200 animate-bounce">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>

              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 lg:p-4 rounded-full shadow-lg border-2 sm:border-3 lg:border-4 border-yellow-400">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="pt-10 sm:pt-12 lg:pt-14 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    🎉 Congratulations!
                  </h2>
                  <div className="w-12 sm:w-14 lg:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    You have successfully completed the{" "}
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-xs sm:text-sm">
                      {currentCourse?.courseName}
                    </span>{" "}
                    course.
                  </p>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="bg-blue-500 p-1 rounded-full flex-shrink-0 mt-0.5">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Certificate Information
                        </p>
                        <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                          Certificate will be issued to:
                          <span className="font-semibold text-blue-900 dark:text-blue-100 ml-1">
                            {profile?.firstName} {profile?.secondName}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Click the button below to claim your certificate.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
                <button
                  onClick={handleClaimCertificate}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Claim Certificate</span>
                </button>

                <button
                  onClick={handleClosePopup}
                  className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 border border-gray-300 dark:border-gray-600 text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal - Responsive */}
      {showCertificate && certificateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 overflow-auto p-4">
          <div className="relative bg-white rounded-lg w-full max-w-4xl lg:max-w-7xl max-h-[90vh] overflow-auto p-4 sm:p-6 lg:p-8 shadow-lg">
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <Certificate certificateData={certificateData} />
          </div>
        </div>
      )}
    </div>
  );
});

CourseDetails.displayName = "CourseDetails";

export default CourseDetails;
