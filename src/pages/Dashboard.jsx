import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  LineChart,
  Layers,
  Trophy,
  BookOpen,
  Book,
  Users,
  Award,
  ExternalLink,
  CheckCircle,
  ClipboardListIcon,
  RefreshCw,
  X,
} from "lucide-react";
import { CourseContext } from "../contexts/courseContext";
import { useProfile } from "../contexts/ProfileContext";
import ProgressBar from "../components/progressBar";
import { ChapterContext } from "../contexts/chapterContext";
import { LessonContext } from "../contexts/lessonContext";
import { QuizContext } from "../contexts/quizContext";
import { useCertificates } from "../contexts/certificatesContext";
import { useUser } from "../contexts/userContext";
import { useProgress } from "../contexts/progressContext";
import { useActiveAccount } from "thirdweb/react";
import CareerOnboardingForm from "../components/ProfileSurveyForm";

const FALLBACK_COURSE_IMAGE = "/Vision.jpg";
const IPFS_GATEWAY_BASE = "https://ipfs.io/ipfs/";

const Dashboard = ({ onCourseSelect }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { courses } = useContext(CourseContext);
  const { role } = useUser();
  const { profile } = useProfile();
  const account = useActiveAccount();
  const address = account?.address;
  const { chapters, fetchChapters } = useContext(ChapterContext);
  const { lessons } = useContext(LessonContext);
  const { quizzes } = useContext(QuizContext);
  const { certificates } = useCertificates();
  const [isShowProfileSurveyForm, setShowProfileSurveyForm] = useState(false);

  // Use the progress context
  const {
    completedLessonIds,
    completedQuizIds,
    loading: progressLoading,
    refreshProgress,
  } = useProgress();

  const refreshInProgressRef = useRef(false);

  console.log("Profile", profile);

  // Helper function to check if current user is enrolled
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

  // Get enrolled courses count
  const enrolledCoursesCount = courses.filter((course) =>
    isUserEnrolled(course.enrolledStudents, address),
  ).length;

  // Stats data using progress context
  const stats = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Total Courses",
      value: enrolledCoursesCount.toString(),
      change: "+0%",
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: "Completed Quizzes",
      value: completedQuizIds.size.toString(),
      change: "+0%",
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Completed Lessons",
      value: completedLessonIds.size.toString(),
      change: "+0%",
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Certificates",
      value: certificates.length.toString(),
      change: "+0%",
    },
  ];

  // Helper function to check if user has claimed certificate for a course
  const hasCertificateForCourse = (courseId) => {
    return certificates.some(
      (cert) =>
        cert.courseId.toString() === courseId.toString() &&
        cert.owner.toLowerCase() === address.toLowerCase(),
    );
  };

  // Helper function to navigate to course details
  const navigateToCourseDetails = (courseId) => {
    if (onCourseSelect) {
      onCourseSelect(courseId);
    } else {
      window.location.href = `/course/${courseId}`;
    }
  };

  const enrolledCourses = courses.filter((course) =>
    isUserEnrolled(course.enrolledStudents, address),
  );

  const getEnrolledStudentsCount = (enrolledStudents) => {
    if (!enrolledStudents || enrolledStudents.length === 0) return 0;
    return enrolledStudents.length;
  };

  // Helper function to get lessons for a specific course (via chapters)
  const getLessonsForCourse = (courseId) => {
    const courseChapters = chapters.filter(
      (chapter) => chapter.courseId.toString() === courseId.toString(),
    );

    const courseLessons = lessons.filter((lesson) =>
      courseChapters.some(
        (chapter) =>
          chapter.chapterId.toString() === lesson.chapterId.toString(),
      ),
    );

    return courseLessons;
  };

  // Helper function to get quizzes for a specific course (via lessons)
  const getQuizzesForCourse = (courseId) => {
    const courseLessons = getLessonsForCourse(courseId);

    const courseQuizzes = quizzes.filter((quiz) =>
      courseLessons.some(
        (lesson) => lesson.lessonId.toString() === quiz.lessonId.toString(),
      ),
    );

    return courseQuizzes;
  };

  // Calculate completion data for a course using the progress context
  const getCourseCompletionData = (courseId) => {
    const courseLessons = getLessonsForCourse(courseId);
    const courseQuizzes = getQuizzesForCourse(courseId);

    const totalLessons = courseLessons.length;
    const totalQuizzes = courseQuizzes.length;

    const completedLessons = courseLessons.filter((lesson) =>
      completedLessonIds.has(lesson.lessonId.toString()),
    ).length;

    const completedQuizzes = courseQuizzes.filter((quiz) =>
      completedQuizIds.has(quiz.quizId.toString()),
    ).length;

    return {
      completedLessons,
      completedQuizzes,
      totalLessons,
      totalQuizzes,
    };
  };

  const handleTakeSurvey = () => {
    setShowProfileSurveyForm(true);
  };
  const handleCloseSurvey = () => {
    setShowProfileSurveyForm(false);
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
  // Generate recent activity from enrolled courses (limited to 3)
  const recentActivity = enrolledCourses
    .map((course) => {
      const completionData = getCourseCompletionData(course.courseId);
      const totalItems =
        completionData.totalLessons + completionData.totalQuizzes;
      const completedItems =
        completionData.completedLessons + completionData.completedQuizzes;
      const progress =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      let status = "Started";
      if (progress === 100) {
        status = "Completed";
      } else if (progress > 0) {
        status = "In Progress";
      }

      return {
        course: course.courseName,
        progress,
        status,
      };
    })
    .slice(0, 3);

  // Improved refresh function with proper loading state
  const handleRefreshProgress = async () => {
    if (enrolledCourses.length === 0 || refreshInProgressRef.current) return;

    console.log("Manually refreshing progress...");
    refreshInProgressRef.current = true;
    setIsRefreshing(true);

    try {
      // Refresh all enrolled courses sequentially to avoid overloading
      for (const course of enrolledCourses) {
        console.log(`Refreshing progress for course: ${course.courseId}`);
        await refreshProgress(course.courseId);
      }
      console.log("Progress refresh completed");
    } catch (error) {
      console.error("Error refreshing progress:", error);
    } finally {
      setIsRefreshing(false);
      refreshInProgressRef.current = false;
    }
  };

  // Effect to fetch chapters and progress for all enrolled courses
  useEffect(() => {
    const fetchInitialData = async () => {
      if (enrolledCourses.length === 0) return;

      // Fetch chapters for all enrolled courses
      for (const course of enrolledCourses) {
        await fetchChapters(course.courseId);
      }

      // Initial progress refresh
      handleRefreshProgress();
    };

    fetchInitialData();
  }, []); // Only run once on mount

  // Effect to refresh progress when address changes
  useEffect(() => {
    if (address && enrolledCourses.length > 0) {
      console.log(
        "Address changed, refreshing progress for all enrolled courses",
      );
      handleRefreshProgress();
    }
  }, [address]);

  // Determine if we should show loading state
  const showLoading = isRefreshing || progressLoading;

  return (
    <div
      className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900
      min-h-screen p-6 transition-colors duration-300 pt-[100px]"
    >
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold dark:text-yellow-400 text-yellow-500">
              ABYA Learning Dashboard
            </h1>
            <p className="text-sm dark:text-gray-400 text-gray-600">
              Your blockchain education journey
            </p>
          </div>
          <div className="lg:flex lg:items-center lg:gap-4 hidden md:flex">
            <button
              onClick={handleTakeSurvey}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-cyan-900
                       text-white rounded-lg hover:from-cyan-900 hover:to-yellow-700
                       transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <ClipboardListIcon className="w-4 h-4" />
              Take Survey
            </button>
            <button
              onClick={handleRefreshProgress}
              disabled={showLoading || enrolledCourses.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600
             text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {showLoading ? "Refreshing..." : "Refresh Progress"}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
            >
              <div className="flex justify-between items-center transition-all duration-1000">
                <div className="space-y-2">
                  <div className="p-2 rounded-full w-12 h-12 flex items-center justify-center dark:bg-yellow-500 bg-opacity-20 dark:text-white bg-yellow-500 text-yellow-600">
                    {stat.icon}
                  </div>
                  <h3 className="text-sm font-medium dark:text-gray-400 text-gray-600">
                    {stat.title}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold dark:text-white text-gray-900">
                    {stat.value}
                  </p>
                  <p
                    className={`text-xs ${
                      stat.change.startsWith("+")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enrolled Courses Section */}
        <div className="mb-8 p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 transition-all duration-1000">
          <h2 className="text-xl font-semibold mb-4 dark:text-white text-gray-900">
            My Enrolled Courses
          </h2>
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-3">
              {enrolledCourses.map((course) => {
                const completionData = getCourseCompletionData(course.courseId);

                const totalItems =
                  completionData.totalLessons + completionData.totalQuizzes;
                const completedItems =
                  completionData.completedLessons +
                  completionData.completedQuizzes;
                const progressPercentage =
                  totalItems > 0
                    ? Math.round((completedItems / totalItems) * 100)
                    : 0;
                const isCompleted = progressPercentage >= 100;
                const hasCertificate = hasCertificateForCourse(course.courseId);

                return (
                  <div
                    key={course.courseId}
                    className="rounded-lg overflow-hidden dark:bg-gray-700 bg-gray-50 hover:shadow-xl shadow-md dark:hover:shadow-sm dark:hover:shadow-white transition-shadow duration-300 relative"
                  >
                    <div className="p-4">
                      {/* Small course image in top-right corner */}
                      <div className="absolute top-2 right-2 w-16 h-16 rounded-lg overflow-hidden shadow-lg border-2 border-white dark:border-gray-600">
                        <img
                          src={getCourseImage(course)}
                          alt={course.courseName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Course title with proper spacing */}
                      <div className="pr-20 mb-3">
                        <h3 className="font-semibold text-lg leading-tight dark:text-white text-gray-900 line-clamp-2">
                          {course.courseName}
                        </h3>
                      </div>

                      <p className="text-sm dark:text-gray-300 text-gray-600 mb-3 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="text-sm font-semibold text-yellow-500 mb-3">
                        {formatPriceUSDC(course.priceUSDC)}
                      </div>
                      <div className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-500 mb-3">
                        <Users className="w-4 h-4" />
                        <span>
                          {getEnrolledStudentsCount(course.enrolledStudents)}{" "}
                          student(s) enrolled
                        </span>
                      </div>
                      <span className="mr-2 flex items-center dark:text-gray-400 text-gray-500">
                        <Book className="inline-block w-4 h-4 mr-1 -mt-1" />
                        <span className="truncate w-[300px] overflow-hidden text-ellipsis  whitespace-nowrap">
                          Course Creator {course.creator}
                        </span>
                      </span>

                      {(() => {
                        if (isCompleted && hasCertificate) {
                          return (
                            <div className="space-y-2">
                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-3 text-center">
                                <div className="flex items-center justify-center mb-2">
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  <span className="text-sm font-semibold">
                                    Course Completed!
                                  </span>
                                </div>
                                <div className="flex items-center justify-center">
                                  <Award className="w-4 h-4 mr-1" />
                                  <span className="text-xs">
                                    Certificate Claimed
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  navigateToCourseDetails(course.courseId)
                                }
                                className="w-full bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-2 rounded text-sm font-medium flex items-center justify-center transition-colors"
                              >
                                <BookOpen className="w-4 h-4 mr-2" />
                                View Course
                                <ExternalLink className="w-3 h-3 ml-2" />
                              </button>
                            </div>
                          );
                        } else if (isCompleted && !hasCertificate) {
                          return (
                            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center mb-2">
                                <Trophy className="w-5 h-5 mr-2" />
                                <span className="text-sm font-semibold">
                                  Ready to Claim!
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  navigateToCourseDetails(course.courseId)
                                }
                                className="bg-white text-yellow-600 hover:text-yellow-700 px-3 py-1 rounded text-xs font-medium flex items-center justify-center w-full transition-colors"
                              >
                                <Award className="w-3 h-3 mr-1" />
                                Claim Certificate
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <div className="space-y-2 flex flex-col">
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                {completedItems} of {totalItems} completed (
                                {progressPercentage}%)
                              </div>
                              <ProgressBar
                                completedLessons={completedItems}
                                totalLessons={totalItems}
                              />
                              <button
                                onClick={() =>
                                  navigateToCourseDetails(course.courseId)
                                }
                                className="w-full bg-yellow-500 mt-5 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center transition-colors"
                              >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Continue Learning
                                <ExternalLink className="w-3 h-3 ml-2" />
                              </button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 dark:bg-gray-700 bg-gray-50 rounded-lg">
              <BookOpen className="w-16 h-16 mx-auto mb-4 dark:text-gray-400 text-gray-500" />
              <h3 className="text-xl font-medium dark:text-white text-gray-900 mb-2">
                No Courses Enrolled
              </h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-4">
                Start your learning journey by enrolling in a course today!
              </p>
              <button className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-300">
                Browse Courses
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 transition-all duration-1000">
          <h2 className="text-xl font-semibold mb-4 dark:text-white text-gray-900">
            Recent Learning Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="p-4 rounded-lg dark:bg-gray-700 bg-opacity-50 bg-gray-100 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium dark:text-white text-gray-900">
                    {activity.course}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 h-2 rounded-full mt-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${activity.progress}%` }}
                    ></div>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    activity.status === "Completed"
                      ? "bg-green-500 bg-opacity-20 text-green-500"
                      : activity.status === "In Progress"
                      ? "bg-yellow-500 bg-opacity-20 text-yellow-500"
                      : "bg-gray-500 bg-opacity-20 text-gray-500"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isShowProfileSurveyForm && (
          <div className="relative z-50">
            {/* Explicit Close Button */}
            <button
              onClick={handleCloseSurvey}
              className="fixed lg:top-24 lg:right-64 top-16 right-4 z-[70] p-3 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-2xl transition-all duration-200 hover:scale-110 flex items-center gap-2 font-medium"
              aria-label="Close survey"
            >
              <X className="w-5 h-5 font-bold" />
            </button>

            <CareerOnboardingForm
              userAddress={address}
              isModal={true}
              onClose={handleCloseSurvey}
            />
          </div>
        )}

        {showLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Updating progress...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
