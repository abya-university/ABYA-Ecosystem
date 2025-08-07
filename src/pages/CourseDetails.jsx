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
import { useAccount } from "wagmi";
import PropTypes from "prop-types";
import ProgressBar from "../components/progressBar";
import Ecosystem2FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import Ecosystem3FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem3Facet.sol/Ecosystem3Facet.json";
import { ethers } from "ethers";
import { useEthersSigner } from "../components/useClientSigner";
import Certificate from "../components/Certificate";
import { useCertificates } from "../contexts/certificatesContext";
import { useProfile } from "../contexts/ProfileContext";
import { CSSTransition } from "react-transition-group";

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
  const { profile } = useProfile();
  const [hasCertificate, setHasCertificate] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [markingAsReadIds, setMarkingAsReadIds] = useState(new Set());

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
    // Add lesson to loading state
    const lessonIdStr = lessonId.toString();
    setMarkingAsReadIds((prev) => new Set([...prev, lessonIdStr]));

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
        setCompletedLessonIds((prev) => new Set([...prev, lessonIdStr]));
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
  const handleClaimCertificate = async () => {
    try {
      const signer = await signerPromise;
      if (!signer) {
        throw new Error("No signer available");
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

      const contract = new ethers.Contract(
        EcosystemDiamondAddress,
        Ecosystem3Facet_ABI,
        signer
      );

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
                if (
                  chapter.chapterId?.toString() === activeChapterId?.toString()
                ) {
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
                                {currentCourse.approved && address && (
                                  <>
                                    {(() => {
                                      const userEnrolled = isUserEnrolled(
                                        currentCourse.enrolledStudents,
                                        address
                                      );
                                      return userEnrolled;
                                    })() ? (
                                      <div className="flex justify-between items-center">
                                        <button
                                          className={`bg-yellow-500 text-gray-900 p-2 my-3 rounded-lg font-normal flex items-center gap-2 ${
                                            completedLessonIds.has(
                                              lesson.lessonId.toString()
                                            ) ||
                                            markingAsReadIds.has(
                                              lesson.lessonId.toString()
                                            ) // Ensure lessonId is a string
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
                                              Marking...
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
                return null;
              })}
            </div>
          </div>

          {/* Right Sidebar Navigation (20%) */}
          <div className="w-[20%] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-fit sticky top-[100px] overflow-hidden">
            {/* Certificate Status Section */}
            {certificates.some(
              (cert) =>
                cert.courseId === currentCourse.courseId.toString() &&
                cert.owner.toLowerCase() === address.toLowerCase()
            ) && (
              <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/30 dark:via-green-900/20 dark:to-teal-900/20 border-b border-emerald-200 dark:border-emerald-700/50">
                {/* Decorative background pattern */}
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
                    {/* Certificate Icon */}
                    <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-lg shadow-md">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>

                    {/* Certificate Status Content */}
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
                        course and earned your certificate.
                      </p>

                      {/* View Certificate Button */}
                      <button
                        className="mt-3 w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-emerald-700 dark:text-emerald-300 text-xs font-medium py-2 px-3 rounded-lg border border-emerald-200 dark:border-emerald-600 transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2"
                        onClick={() => {
                          // Find the certificate for this course and user
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

            {/* Certificate Popup */}
            <CSSTransition
              in={showPopup}
              timeout={300}
              classNames="popup"
              unmountOnExit
            >
              <div
                className="fixed inset-0 z-50 flex items-center justify-center overflow-auto"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}
              >
                <div className="relative bg-transparent rounded-lg max-w-6xl w-full max-h-[87vh] shadow-lg">
                  <button
                    onClick={handleCloseCertPopup}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full p-1"
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

                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="loader"></div>
                    </div>
                  ) : (
                    <Certificate certificateData={selectedCertificate} />
                  )}
                </div>
              </div>
            </CSSTransition>

            {/* Main Content Area */}
            <div className="p-6">
              {/* Progress Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
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
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                        className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                          isActive
                            ? "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700/50 shadow-sm"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Module Icon */}
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                              isActive
                                ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm"
                                : isCompleted
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {isCompleted ? (
                              <svg
                                className="w-4 h-4"
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

                          {/* Module Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
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
                                <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              Module {index + 1}
                            </p>
                          </div>

                          {/* Status Indicator */}
                          {isCompleted && !isActive && (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>

                        {/* Active indicator line */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-r-full"></div>
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

      {/* i want a show congratulation popup when user complete all the lessons */}
      {!hasCertificate && showCongratsPopup && (
        <div
          id="popup"
          className="fixed z-50 inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div className="relative bg-white dark:bg-gray-800 max-w-lg w-full rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform animate-scaleIn">
            {/* Decorative Header Background */}
            <div
              className="relative h-32 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600"
              style={{
                background: `linear-gradient(135deg, rgba(251, 191, 36, 0.95), rgba(245, 158, 11, 0.95)), url('/congratulations.jpg')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-yellow-600/40"></div>

              {/* Celebration Elements */}
              <div className="absolute top-4 left-4 text-yellow-200 animate-bounce">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="absolute top-6 right-6 text-yellow-200 animate-pulse">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* Trophy Icon */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg border-4 border-yellow-400">
                  <svg
                    className="w-8 h-8 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="pt-12 pb-8 px-8">
              <div className="text-center space-y-6">
                {/* Main Heading */}
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    🎉 Congratulations!
                  </h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>
                </div>

                {/* Success Message */}
                <div className="space-y-4">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    You have successfully completed the{" "}
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                      {currentCourse?.courseName}
                    </span>{" "}
                    course.
                  </p>

                  {/* Certificate Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500 p-1 rounded-full flex-shrink-0 mt-0.5">
                        <svg
                          className="w-4 h-4 text-white"
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
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Certificate Information
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                          Certificate will be issued to:
                          <span className="font-semibold text-blue-900 dark:text-blue-100 ml-1">
                            {profile?.firstName} {profile?.secondName}
                          </span>
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                          If this name is incorrect, please update your profile
                          in Settings before claiming your certificate.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400">
                    Click the "Claim Certificate" button to generate and
                    download your certificate.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={handleClaimCertificate}
                  id="generateCertificate"
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
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
                  id="closePopup"
                  className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-xl transition-all duration-200 border border-gray-300 dark:border-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>

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
