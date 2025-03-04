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
} from "lucide-react";
import ReviewModal from "../components/ReviewModal";
import { useUser } from "../contexts/userContext";
import { useAccount } from "wagmi";
import PropTypes from "prop-types";
import ProgressBar from "../components/progressBar";
import Ecosystem2FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import Ecosystem3FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem3Facet.sol/Ecosystem3Facet.json";
import { ethers } from "ethers";
import { useEthersSigner } from "../components/useClientSigner";
import Certificate from "../components/Certificate";
import { useCertificates } from "../contexts/certificatesContext";

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
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
  const signerPromise = useEthersSigner();
  const { address } = useAccount();
  const [completedQuizIds, setCompletedQuizIds] = useState(new Set());
  const { quizzes } = useContext(QuizContext);

  useEffect(() => {
    const fetchCompletedQuizzes = async () => {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        EcosystemDiamondAddress,
        Ecosystem2Facet_ABI,
        signer
      );

      const completedQuizzes = await contract.getUserCompletedQuizzesByCourse(
        courseId
      );

      // Special case handling: if the only value is "0" and there's no quiz with ID 0
      if (
        completedQuizzes.length === 1 &&
        completedQuizzes[0].toString() === "0" &&
        !quizzes.some((quiz) => quiz.quizId.toString() === "0")
      ) {
        setCompletedQuizIds(new Set());
        console.log(
          "No completed quizzes (found [0] which isn't a valid quiz ID)"
        );
        return;
      }

      // Split the quiz IDs and filter only valid ones
      const quizIds = completedQuizzes
        .flatMap((quiz) => quiz.toString().split(","))
        .filter((id) => quizzes.some((quiz) => quiz.quizId.toString() === id));

      const completedQuizIdsSet = new Set(quizIds);
      setCompletedQuizIds(completedQuizIdsSet);
      console.log("Completed user quizzes:", Array.from(completedQuizIdsSet));
    };

    fetchCompletedQuizzes();
  }, [courseId, signerPromise, quizzes]);

  useEffect(() => {
    const checkQuizLock = async () => {
      try {
        const signer = await signerPromise;
        const contract = new ethers.Contract(
          EcosystemDiamondAddress,
          Ecosystem2Facet_ABI,
          signer
        );

        const lockTime = await contract.getQuizLockTime(quiz.quizId, address);
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
  }, [quiz.quizId, signerPromise, address]);

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

  // Then update the relevant part of handleSubmit
  const handleSubmit = useCallback(async () => {
    try {
      const calculatedScore = calculateScore();
      setScore(calculatedScore);
      setQuizSubmitted(true);

      setAttempts((prevAttempts) => prevAttempts + 1);

      if (attempts + 1 >= 3) {
        try {
          const signer = await signerPromise;
          const contract = new ethers.Contract(
            EcosystemDiamondAddress,
            Ecosystem2Facet_ABI,
            signer
          );

          const courseIdBN = BigInt(courseId);
          const quizIdBN = BigInt(quiz.quizId);

          console.log("Locking quiz:", {
            courseId: courseIdBN.toString(),
            quizId: quizIdBN.toString(),
          });

          const tx = await contract.lockQuiz(courseIdBN, quizIdBN, {
            gasLimit: 300000,
          });

          await tx.wait();
          console.log("Quiz locked successfully");

          // Update UI to reflect locked state
          setIsLocked(true);
        } catch (lockError) {
          console.error("Failed to lock quiz:", lockError);
        }
      }

      const signer = await signerPromise;
      const contract = new ethers.Contract(
        EcosystemDiamondAddress,
        Ecosystem2Facet_ABI,
        signer
      );

      // Convert IDs to numbers for validation
      const courseIdNum = Number(courseId);
      const quizIdNum = Number(quiz.quizId);

      // Log the values before validation
      console.log("Pre-validation values:", {
        courseId,
        courseIdNum,
        quizId: quiz.quizId,
        quizIdNum,
        selectedAnswers,
        calculatedScore,
      });

      // Validate the data
      validateQuizData(
        courseIdNum,
        quizIdNum,
        Object.values(selectedAnswers),
        calculatedScore
      );

      // After validation passes, convert to BigInt for contract call
      const courseIdBN = BigInt(courseId);
      const quizIdBN = BigInt(quiz.quizId);
      const answersArray = quiz.questions.map((q) =>
        BigInt(selectedAnswers[q.questionId] ?? 0)
      );

      // Proceed with contract call...
      const tx = await contract.submitQuiz(
        courseIdBN,
        quizIdBN,
        answersArray,
        BigInt(calculatedScore),
        {
          gasLimit: 500000,
        }
      );

      await tx.wait();
    } catch (error) {
      console.error("Quiz submission error:", {
        error,
        errorCode: error.code,
        errorData: error.data,
        values: {
          courseId,
          quizId: quiz?.quizId,
          selectedAnswers,
          score: calculateScore(),
        },
      });
      throw error;
    }
  }, [
    calculateScore,
    attempts,
    quiz,
    selectedAnswers,
    signerPromise,
    courseId,
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
              className={`p-2 px-4 rounded-lg ${
                Object.keys(selectedAnswers).length === quiz.questions.length
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Submit Quiz
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
  const { address } = useAccount();
  const [completedLessons, setCompletedLessons] = useState(0);
  const signerPromise = useEthersSigner();
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [completedQuizIds, setCompletedQuizIds] = useState(new Set());
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [learnerName, setLearnerName] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const { certificates } = useCertificates();

  // Update both fetch functions to filter out invalid IDs

  useEffect(() => {
    const fetchCompletedLessons = async () => {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        EcosystemDiamondAddress,
        Ecosystem2Facet_ABI,
        signer
      );

      const completedLessons = await contract.getUserCompletedLessonsByCourse(
        courseId
      );

      // Special case handling: if the only value is "0" and there's no lesson with ID 0
      if (
        completedLessons.length === 1 &&
        completedLessons[0].toString() === "0" &&
        !lessons.some((lesson) => lesson.lessonId.toString() === "0")
      ) {
        setCompletedLessonIds(new Set());
        console.log(
          "No completed lessons (found [0] which isn't a valid lesson ID)"
        );
        return;
      }

      // Split the lesson IDs and filter only valid ones
      const lessonIds = completedLessons
        .flatMap((lesson) => lesson.toString().split(","))
        .filter((id) =>
          lessons.some((lesson) => lesson.lessonId.toString() === id)
        );

      const completedLessonIdsSet = new Set(lessonIds);
      setCompletedLessonIds(completedLessonIdsSet);
      console.log("Completed user lessons:", Array.from(completedLessonIdsSet));
    };

    fetchCompletedLessons();
  }, [courseId, signerPromise, lessons]);

  useEffect(() => {
    const fetchCompletedQuizzes = async () => {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        EcosystemDiamondAddress,
        Ecosystem2Facet_ABI,
        signer
      );

      const completedQuizzes = await contract.getUserCompletedQuizzesByCourse(
        courseId
      );

      // Special case handling: if the only value is "0" and there's no quiz with ID 0
      if (
        completedQuizzes.length === 1 &&
        completedQuizzes[0].toString() === "0" &&
        !quizzes.some((quiz) => quiz.quizId.toString() === "0")
      ) {
        setCompletedQuizIds(new Set());
        console.log(
          "No completed quizzes (found [0] which isn't a valid quiz ID)"
        );
        return;
      }

      // Split the quiz IDs and filter only valid ones
      const quizIds = completedQuizzes
        .flatMap((quiz) => quiz.toString().split(","))
        .filter((id) => quizzes.some((quiz) => quiz.quizId.toString() === id));

      const completedQuizIdsSet = new Set(quizIds);
      setCompletedQuizIds(completedQuizIdsSet);
      console.log("Completed user quizzes:", Array.from(completedQuizIdsSet));
    };

    fetchCompletedQuizzes();
  }, [courseId, signerPromise, quizzes]);

  const markAsRead = async (courseId, chapterId, lessonId) => {
    try {
      // Convert parameters to BigInts for ethers v6
      const courseIdBN = BigInt(courseId);
      const chapterIdBN = BigInt(chapterId);
      const lessonIdBN = BigInt(lessonId);

      console.log("Attempting to mark as read with params:", {
        courseId: courseIdBN.toString(),
        chapterId: chapterIdBN.toString(),
        lessonId: lessonIdBN.toString(),
      });

      const signer = await signerPromise;
      if (!signer) {
        throw new Error("No signer available");
      }

      const contract = new ethers.Contract(
        EcosystemDiamondAddress,
        Ecosystem2Facet_ABI,
        signer
      );

      try {
        // Send transaction with fixed gas limit for now
        const tx = await contract.markAsRead(
          courseIdBN,
          chapterIdBN,
          lessonIdBN,
          {
            gasLimit: 300000, // Fixed gas limit
          }
        );

        console.log("Transaction sent:", tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        // Update local state only after confirmation
        setCompletedLessonIds((prev) => new Set([...prev, lessonId]));
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
    }
  };

  // Use refs to store previous values
  const prevCourseIdRef = useRef(courseId);
  const prevChaptersRef = useRef(chapters);

  // Memoize current course
  const currentCourse = useMemo(
    () => courses.find((course) => course.courseId === courseId),
    [courses, courseId]
  );

  useEffect(() => {
    const hasCertificate = certificates.some(
      (cert) => cert.courseName === currentCourse.courseName
    );
    if (!hasCertificate) {
      setShowCongratsPopup(true);
    }
  }, [certificates, currentCourse.courseName]);

  // Memoize filtered chapters
  const filteredChapters = useMemo(
    () => chapters.filter((chapter) => chapter.courseID === courseId),
    [chapters, courseId]
  );

  // Update totalLessons calculation
  const totalLessons = useMemo(() => {
    return lessons.filter((lesson) =>
      filteredChapters.some(
        (chapter) => chapter.chapterId === lesson.chapterId.toString()
      )
    ).length;
  }, [lessons, filteredChapters]);

  // Total quizzes calculation
  const totalQuizzes = useMemo(() => {
    // Get all lesson IDs for the filtered chapters
    const lessonIds = lessons
      .filter((lesson) =>
        filteredChapters.some(
          (chapter) => chapter.chapterId === lesson.chapterId.toString()
        )
      )
      .map((lesson) => lesson.lessonId.toString());

    // Count quizzes that are linked to these lessons
    return quizzes.filter((quiz) =>
      lessonIds.includes(quiz.lessonId.toString())
    ).length;

    // console.log("Total quizzes:", totalQuizzes2);
  }, [quizzes, lessons, filteredChapters]);

  // Fetch chapters only when courseId changes or when chapters are empty
  useEffect(() => {
    const shouldFetchChapters =
      courseId &&
      (prevCourseIdRef.current !== courseId || chapters.length === 0);

    if (shouldFetchChapters) {
      fetchChapters(courseId);
      prevCourseIdRef.current = courseId;
    }
  }, [courseId, fetchChapters]);

  // Update chapters only when the chapters array actually changes
  useEffect(() => {
    if (chapters !== prevChaptersRef.current) {
      const formattedChapters = chapters.map((chapter) => ({
        courseID: chapter.courseId.toString(),
        chapterId: chapter.chapterId.toString(),
        courseId: chapter.courseId.toString(),
        chapterName: chapter.chapterName,
      }));

      // Only update the state if the formatted chapters are different
      if (JSON.stringify(formattedChapters) !== JSON.stringify(chapters)) {
        setChapters(formattedChapters);
        console.log("Formatted chapters:", formattedChapters);
      }

      // Set first chapter as active only if there's no active chapter
      if (formattedChapters.length > 0 && !activeChapterId) {
        setActiveChapterId(formattedChapters[0].chapterId);
      }

      prevChaptersRef.current = chapters;
    }
  }, [chapters, setChapters, activeChapterId]);

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

  //issueCertificate section
  useEffect(() => {
    if (
      completedLessonIds.size + completedQuizIds.size !== 0 &&
      totalLessons + totalQuizzes !== 0 &&
      completedLessonIds.size + completedQuizIds.size ===
        totalLessons + totalQuizzes
    ) {
      setShowCongratsPopup(true);
    }
  }, [completedLessonIds, completedQuizIds, totalLessons, totalQuizzes]);

  const handleClosePopup = () => {
    setShowCongratsPopup(false);
  };

  //handle claim certificate
  const handleClaimCertificate = async () => {
    try {
      const signer = await signerPromise;
      if (!signer) {
        throw new Error("No signer available");
      }

      // Ensure learner name is provided
      if (!learnerName.trim()) {
        alert("Please enter your name for the certificate");
        return;
      }

      const contract = new ethers.Contract(
        EcosystemDiamondAddress,
        Ecosystem3Facet_ABI,
        signer
      );

      const learner = learnerName;
      const cert_issuer = "ABYA UNIVERSITY";
      const issue_date = new Date().toISOString();

      // Create certificate data object
      const newCertificateData = {
        learner: learnerName,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 pt-[100px]">
      <div className="max-w-7xl mx-auto">
        {/* <ProgressBar
          completedLessons={completedLessons}
          totalLessons={totalLessons}
        /> */}
        <div className="flex gap-8">
          {/* Main Content Area (80%) */}
          <div className="w-[80%] mt-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {currentCourse?.courseName}
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              {currentCourse?.description}
            </p>

            <div className="space-y-8">
              {filteredChapters.map((chapter, chapterIndex) => {
                if (chapter.chapterId === activeChapterId) {
                  return (
                    <div key={chapter.chapterId} className="p-6">
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-yellow-500" />
                        Module {chapterIndex + 1}: {chapter.chapterName}
                      </h2>

                      <div className="space-y-6">
                        {lessons
                          .filter(
                            (lesson) =>
                              lesson.chapterId.toString() === chapter.chapterId
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
                                className="border-t border-gray-200 dark:border-gray-700 pt-6 first:border-0 first:pt-0"
                              >
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                                  {/* <span className="text-lg font-semibold pr-1">
                                    Lesson: {lesson.lessonId}
                                  </span> */}
                                  {lesson.lessonName}
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                  {lesson.lessonContent}
                                </p>

                                {lesson?.additionalResources?.some(
                                  (r) => r.url
                                ) && (
                                  <div className="mt-4 space-y-4">
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                      Additional Resources
                                    </h4>
                                    <div className="grid gap-4">
                                      {lesson?.additionalResources
                                        ?.filter((r) => r.url)
                                        .map((resource, index) => (
                                          <div key={index}>
                                            <Resource resource={resource} />
                                            {/* <span className="italic text-gray-700 text-sm dark:text-gray-300">
                                            {resource.name}
                                          </span> */}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {/* add a mark as read btn */}
                                {role === "USER" ? (
                                  <div className="flex justify-between items-center">
                                    <button
                                      className={`bg-yellow-500 text-gray-900 p-2 my-3 rounded-lg font-normal ${
                                        completedLessonIds.has(
                                          lesson.lessonId.toString()
                                        ) // Ensure lessonId is a string
                                          ? "opacity-50 cursor-not-allowed"
                                          : "hover:bg-yellow-600"
                                      }`}
                                      onClick={async () => {
                                        if (
                                          !completedLessonIds.has(
                                            lesson.lessonId.toString()
                                          )
                                        ) {
                                          try {
                                            await markAsRead(
                                              currentCourse.courseId,
                                              chapter.chapterId,
                                              lesson.lessonId
                                            );
                                            // Show success message
                                          } catch (error) {
                                            // Show error message to user
                                            console.error(
                                              "Failed to mark lesson as read:",
                                              error
                                            );
                                          }
                                        }
                                      }}
                                      disabled={completedLessonIds.has(
                                        lesson.lessonId.toString()
                                      )}
                                    >
                                      {completedLessonIds.has(
                                        lesson.lessonId.toString()
                                      )
                                        ? "Completed"
                                        : "Mark as Read"}
                                    </button>
                                  </div>
                                ) : null}

                                {lessonQuiz && (
                                  <div className="mt-6 p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg dark:text-gray-300">
                                    <div
                                      className="w-full justify-between cursor-pointer"
                                      onClick={() =>
                                        toggleQuiz(lesson.lessonId)
                                      }
                                    >
                                      <span className="dark:text-gray-300">
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
              })}
            </div>
          </div>

          {/* Right Sidebar Navigation (20%) */}
          <div className="w-[20%] bg-white dark:bg-gray-800 p-6 rounded-lg h-fit sticky top-[100px]">
            <ProgressBar
              completedLessons={completedLessonIds.size + completedQuizIds.size}
              totalLessons={totalLessons + totalQuizzes}
            />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pt-2">
              Course Navigation
            </h3>
            <div className="space-y-2">
              {filteredChapters.map((chapter, index) => (
                <div
                  key={chapter.chapterId}
                  onClick={() => setActiveChapterId(chapter.chapterId)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 ${
                    activeChapterId === chapter.chapterId
                      ? "bg-gradient-to-r from-yellow-500/20 to-green-500/20 dark:text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Book className="w-4 h-4" />
                  <span className="text-sm">
                    Module {index + 1}: {chapter.chapterName}
                  </span>
                  {activeChapterId === chapter.chapterId && (
                    <CheckCircle2 className="w-4 h-4 ml-auto text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {role === "Reviewer" && !currentCourse.approved && (
          <button
            onClick={() => {
              // setCourseId(currentCourse.courseId);
              setIsReviewModalOpen(true);
            }}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
          >
            Review Course
          </button>
        )}

        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmit={handleSubmitReview}
          courseId={courseId}
        />
      </div>

      {/* i want a show congratulation popup when user complete all the lessons */}
      {showCongratsPopup && (
        <div
          id="popup"
          className="absolute z-50 inset-0 items-center justify-center bg-black bg-opacity-40 overflow-auto"
        >
          <div
            className="relative bg-cyan-950 text-white lg:w-[30%] w-[380px] h-[400px] lg:h-[40%] mt-[200px] rounded-lg p-4 mx-auto my-auto lg:flex lg:items-center lg:justify-center flex-col"
            style={{
              background: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/congratulations.jpg')`,
            }}
          >
            <div className="flex flex-col gap-4 w-[90%]">
              <h2 className="text-2xl font-bold mb-4 flex mx-auto justify-center items-center text-white">
                Congratulations!
              </h2>
              <p className="text-center">
                You have successfully completed the{" "}
                <span className="text-yellow-400">
                  {currentCourse?.courseName}
                </span>{" "}
                course.
              </p>
              {/* //input field to enter name */}
              <input
                name="learner"
                id="learner"
                onChange={(e) => setLearnerName(e.target.value)}
                value={learnerName}
                className="w-[90%] p-2 text-gray-200 bg-transparent shadow-md shadow-white text-lg items-center mx-auto justify-center mb-4"
                placeholder="Enter your official names.."
              />
              <p>
                Click the "Generate Certificate" button to access your
                Certificate.
              </p>
            </div>
            <div className="flex mx-auto space-x-2 mt-[90px] items-center justify-center">
              <button
                onClick={handleClaimCertificate}
                id="generateCertificate"
                class="bg-yellow-500 text-white rounded-lg px-4 py-2 mt-4 hover:bg-yellow-400"
              >
                Claim Certificate
              </button>
              <button
                onClick={handleClosePopup}
                id="closePopup"
                class="bg-yellow-500 text-white rounded-lg px-4 py-2 mt-4 hover:bg-yellow-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCertificate && certificateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 overflow-auto">
          <div className="relative bg-white rounded-lg max-w-7xl w-full max-h-[80vh] overflow-auto p-8 shadow-lg">
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
