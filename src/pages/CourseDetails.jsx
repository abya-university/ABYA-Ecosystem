import {
  useContext,
  useEffect,
  useState,
  memo,
  useCallback,
  useMemo,
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

// Quiz component with navigation
const Quiz = memo(({ quiz }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

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

  const handleSubmit = useCallback(() => {
    console.log("Quiz answers:", selectedAnswers);
  }, [selectedAnswers]);

  const handleAnswerSelect = useCallback((questionId, index) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: index,
    }));
  }, []);

  const currentQuestion = useMemo(
    () => quiz.questions[currentQuestionIndex],
    [quiz.questions, currentQuestionIndex]
  );

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
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() =>
                setSelectedAnswers((prev) => ({
                  ...prev,
                  [currentQuestion.questionId]: index,
                }))
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
          <div
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 bg-gray-200 hover:cursor-pointer dark:text-gray-900 hover:bg-gray-300 rounded-lg p-2 px-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </div>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <div
              onClick={handleSubmit}
              className="bg-green-500 hover:bg-green-600 rounded-lg p-2 px-4 hover:cursor-pointer dark:text-gray-900"
            >
              Submit Quiz
            </div>
          ) : (
            <div
              onClick={handleNext}
              className="flex items-center gap-2 bg-yellow-500 dark:text-gray-900 hover:bg-yellow-600 p-2 px-4 rounded-lg hover:cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Quiz.displayName = "Quiz";

const CourseDetails = ({ courseId }) => {
  const { courses } = useContext(CourseContext);
  const { chapters, fetchChapters, setChapters } = useContext(ChapterContext);
  const { lessons } = useContext(LessonContext);
  const { quizzes } = useContext(QuizContext);
  const [openQuizIds, setOpenQuizIds] = useState(new Set());
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { role } = useUser();
  const { address } = useAccount();

  useEffect(() => {
    if (courseId) {
      fetchChapters(courseId);
      const formattedChapters = chapters.map((chapter) => ({
        courseID: chapter.courseId.toString(),
        chapterId: chapter.chapterId.toString(),
        courseId: chapter.courseId.toString(),
        chapterName: chapter.chapterName,
      }));
      setChapters(formattedChapters);

      // Set the first chapter as active by default
      if (formattedChapters.length > 0 && !activeChapterId) {
        setActiveChapterId(formattedChapters[0].chapterId);
      }
    }
  }, [courseId, fetchChapters]);

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

  const currentCourse = courses.find((course) => course.courseId === courseId);
  const filteredChapters = chapters.filter(
    (chapter) => chapter.courseID === courseId
  );

  const handleSubmitReview = (courseId, ratings) => {
    // Call your smart contract function here with the ratings
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
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 pt-[100px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-8">
          {/* Main Content Area (80%) */}
          <div className="w-[80%]">
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

                                {lesson.additionalResources?.some(
                                  (r) => r.url
                                ) && (
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
                                            {/* <span className="italic text-gray-700 text-sm dark:text-gray-300">
                                            {resource.name}
                                          </span> */}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {/* add a mark as read btn */}
                                {role === "USER" &&
                                currentCourse.approved &&
                                currentCourse.enrolledStudents?.includes(
                                  address
                                ) ? (
                                  <div className="flex justify-between items-center">
                                    <button
                                      className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 p-2 my-3 rounded-lg font-normal"
                                      onClick={() => {}}
                                    >
                                      Mark as Read
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
                                        <Quiz quiz={lessonQuiz} />
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
    </div>
  );
};

export default CourseDetails;
