import React, { useState, useContext, useEffect } from "react";
import {
  Wallet,
  LineChart,
  Layers,
  Trophy,
  BookOpen,
  Book,
  Users,
  ClipboardList,
  X,
  Award,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { CourseContext } from "../contexts/courseContext";
import { useUser } from "../contexts/userContext";
import { useAccount } from "wagmi";
import ProfileConnection from "../components/ProfileConnection";
import { useProfile } from "../contexts/ProfileContext";
import ProgressBar from "../components/progressBar";
import { ChapterContext } from "../contexts/chapterContext";
import { useEthersSigner } from "../components/useClientSigner";
import { LessonContext } from "../contexts/lessonContext";
import { QuizContext } from "../contexts/quizContext";
import { useCertificates } from "../contexts/certificatesContext";
import { ethers } from "ethers";
import Ecosystem2FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem2Facet.sol/Ecosystem2Facet.json";

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const Dashboard = ({ onCourseSelect }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { courses } = useContext(CourseContext);
  const { role } = useUser();
  const { profile } = useProfile();
  const { address } = useAccount();
  const { chapters, fetchChapters, setChapters } = useContext(ChapterContext);
  const signerPromise = useEthersSigner();
  const { lessons } = useContext(LessonContext);
  const { quizzes } = useContext(QuizContext);
  const { certificates } = useCertificates();

  // Store completion data for each course
  const [courseCompletionData, setCourseCompletionData] = useState({});

  console.log("Profile", profile);

  // Sample stats data (keep as is or modify based on your needs)
  const stats = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Total Courses",
      value: "24",
      change: "+5.2%",
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: "Completed Quizzes",
      value: "42",
      change: "+12.5%",
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Achievement Points",
      value: "1,256",
      change: "+8.7%",
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Learning Streaks",
      value: "14 days",
      change: "+3 days",
    },
  ];

  const recentActivity = [
    {
      course: "Blockchain Basics",
      progress: 75,
      status: "In Progress",
    },
    {
      course: "Smart Contract Development",
      progress: 100,
      status: "Completed",
    },
    {
      course: "Web3 Security",
      progress: 30,
      status: "Started",
    },
  ];

  console.log("Dashboard Courses:", courses);

  const getEnrolledStudentsCount = (enrolledStudents) => {
    // If the array is empty or undefined, return 0
    if (!enrolledStudents || enrolledStudents.length === 0) return 0;

    // Return the length of the array
    return enrolledStudents.length;
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Helper function to check if current user is enrolled (handles both array and string formats)
  const isUserEnrolled = (enrolledStudents, userAddress) => {
    if (!enrolledStudents || !userAddress) {
      return false;
    }

    // If it's an array, check if it includes the address
    if (Array.isArray(enrolledStudents)) {
      return enrolledStudents.some(
        (addr) => addr.toLowerCase() === userAddress.toLowerCase()
      );
    }

    // Convert to string and check
    const studentsStr = String(enrolledStudents);

    // If it's a single address, check if it matches
    if (studentsStr.startsWith("0x") && !studentsStr.includes(",")) {
      return studentsStr.toLowerCase() === userAddress.toLowerCase();
    }

    // If multiple addresses, split and check
    const addressList = studentsStr
      .split(",")
      .map((addr) => addr.trim().toLowerCase());
    return addressList.includes(userAddress.toLowerCase());
  };

  // Helper function to check if user has claimed certificate for a course
  const hasCertificateForCourse = (courseId) => {
    return certificates.some(
      (cert) => cert.courseId.toString() === courseId.toString()
    );
  };

  // Helper function to navigate to course details
  const navigateToCourseDetails = (courseId) => {
    if (onCourseSelect) {
      onCourseSelect(courseId);
    } else {
      // Fallback for direct URL navigation if onCourseSelect is not provided
      window.location.href = `/course/${courseId}`;
    }
  };

  const enrolledCourses = courses.filter((course) =>
    isUserEnrolled(course.enrolledStudents, address)
  );

  // Helper function to get lessons for a specific course (via chapters)
  const getLessonsForCourse = (courseId) => {
    // First, get all chapters for this course
    const courseChapters = chapters.filter(
      (chapter) => chapter.courseId.toString() === courseId.toString()
    );

    // Then get all lessons for these chapters
    const courseLessons = lessons.filter((lesson) =>
      courseChapters.some(
        (chapter) =>
          chapter.chapterId.toString() === lesson.chapterId.toString()
      )
    );

    return courseLessons;
  };

  // Helper function to get quizzes for a specific course (via lessons)
  const getQuizzesForCourse = (courseId) => {
    // Get lessons for this course first
    const courseLessons = getLessonsForCourse(courseId);

    // Then get quizzes associated with these lessons
    const courseQuizzes = quizzes.filter((quiz) =>
      courseLessons.some(
        (lesson) => lesson.lessonId.toString() === quiz.lessonId.toString()
      )
    );

    return courseQuizzes;
  };

  // Function to fetch completion data for a specific course
  const fetchCompletionDataForCourse = async (courseId) => {
    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        EcosystemDiamondAddress,
        Ecosystem2Facet_ABI,
        signer
      );

      // Get lessons and quizzes for this specific course
      const courseLessons = getLessonsForCourse(courseId);
      const courseQuizzes = getQuizzesForCourse(courseId);

      // Fetch completed lessons for this course
      const completedLessons = await contract.getUserCompletedLessonsByCourse(
        courseId
      );

      let completedLessonIds = new Set();
      if (
        !(
          completedLessons.length === 1 &&
          completedLessons[0].toString() === "0" &&
          !courseLessons.some((lesson) => lesson.lessonId.toString() === "0")
        )
      ) {
        const lessonIds = completedLessons
          .flatMap((lesson) => lesson.toString().split(","))
          .filter((id) =>
            courseLessons.some((lesson) => lesson.lessonId.toString() === id)
          );

        completedLessonIds = new Set(lessonIds);
      }

      // Fetch completed quizzes for this course
      const completedQuizzes = await contract.getUserCompletedQuizzesByCourse(
        courseId
      );

      let completedQuizIds = new Set();
      if (
        !(
          completedQuizzes.length === 1 &&
          completedQuizzes[0].toString() === "0" &&
          !courseQuizzes.some((quiz) => quiz.quizId.toString() === "0")
        )
      ) {
        const quizIds = completedQuizzes
          .flatMap((quiz) => quiz.toString().split(","))
          .filter((id) =>
            courseQuizzes.some((quiz) => quiz.quizId.toString() === id)
          );

        completedQuizIds = new Set(quizIds);
      }

      const result = {
        completedLessons: completedLessonIds.size,
        completedQuizzes: completedQuizIds.size,
        totalLessons: courseLessons.length,
        totalQuizzes: courseQuizzes.length,
      };

      console.log(`=== COMPLETION DATA FETCH - Course ID: ${courseId} ===`, {
        courseLessons: courseLessons.length,
        courseQuizzes: courseQuizzes.length,
        completedLessonIds: Array.from(completedLessonIds),
        completedQuizIds: Array.from(completedQuizIds),
        result,
      });

      return result;
    } catch (error) {
      console.error(
        `Error fetching completion data for course ${courseId}:`,
        error
      );
      return {
        completedLessons: 0,
        completedQuizzes: 0,
        totalLessons: 0,
        totalQuizzes: 0,
      };
    }
  };

  // Effect to fetch chapters for all enrolled courses
  useEffect(() => {
    const fetchChaptersForEnrolledCourses = async () => {
      if (enrolledCourses.length === 0) return;

      // Fetch chapters for each enrolled course
      for (const course of enrolledCourses) {
        await fetchChapters(course.courseId);
      }
    };

    fetchChaptersForEnrolledCourses();
  }, [enrolledCourses, fetchChapters]);

  // Effect to fetch completion data for all enrolled courses
  useEffect(() => {
    const fetchAllCompletionData = async () => {
      if (enrolledCourses.length === 0 || chapters.length === 0) return;

      const completionPromises = enrolledCourses.map(async (course) => {
        const completionData = await fetchCompletionDataForCourse(
          course.courseId
        );
        return {
          courseId: course.courseId,
          ...completionData,
        };
      });

      try {
        const completionResults = await Promise.all(completionPromises);

        // Convert array to object for easy lookup
        const completionDataMap = {};
        completionResults.forEach((result) => {
          completionDataMap[result.courseId] = result;
        });

        setCourseCompletionData(completionDataMap);
        console.log("All course completion data:", completionDataMap);
      } catch (error) {
        console.error("Error fetching completion data for courses:", error);
      }
    };

    fetchAllCompletionData();
  }, [enrolledCourses, signerPromise, lessons, quizzes, chapters]);

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
          <div className="flex items-center gap-4">
            <button
              // onClick={() => setShowSurveyModal(true)}
              onClick={() =>
                alert("This feature is under development. Stay tuned!")
              }
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-cyan-900 
                       text-white rounded-lg hover:from-cyan-900 hover:to-yellow-700 
                       transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <ClipboardList className="w-4 h-4" />
              Take Survey
            </button>
            {profile.did === null && <ProfileConnection />}
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
                const completionData = courseCompletionData[
                  course.courseId
                ] || {
                  completedLessons: 0,
                  completedQuizzes: 0,
                  totalLessons: 0,
                  totalQuizzes: 0,
                };

                // Debug logging for each course
                console.log(
                  `=== DASHBOARD PROGRESS DEBUG - Course: ${course.courseName} ===`,
                  {
                    courseId: course.courseId,
                    completionData,
                    totalItems:
                      completionData.totalLessons + completionData.totalQuizzes,
                    completedItems:
                      completionData.completedLessons +
                      completionData.completedQuizzes,
                    progressPercentage:
                      ((completionData.completedLessons +
                        completionData.completedQuizzes) /
                        (completionData.totalLessons +
                          completionData.totalQuizzes)) *
                        100 || 0,
                  }
                );

                return (
                  <div
                    key={course.courseId}
                    className="rounded-lg overflow-hidden dark:bg-gray-700 bg-gray-50 hover:shadow-xl shadow-md dark:hover:shadow-sm dark:hover:shadow-white transition-shadow duration-300 relative"
                  >
                    <div className="p-4">
                      {/* Small course image in top-right corner */}
                      <div className="absolute top-2 right-2 w-16 h-16 rounded-lg overflow-hidden shadow-lg border-2 border-white dark:border-gray-600">
                        <img
                          src="/Vision.jpg"
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
                        const totalItems =
                          completionData.totalLessons +
                          completionData.totalQuizzes;
                        const completedItems =
                          completionData.completedLessons +
                          completionData.completedQuizzes;
                        const progressPercentage =
                          totalItems > 0
                            ? (completedItems / totalItems) * 100
                            : 0;
                        const isCompleted = progressPercentage >= 100;
                        const hasCertificate = hasCertificateForCourse(
                          course.courseId
                        );

                        console.log(
                          `Course ${course.courseId} - Progress: ${progressPercentage}%, HasCertificate: ${hasCertificate}`
                        );

                        if (isCompleted && hasCertificate) {
                          // Course completed and certificate claimed
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
                          // Course completed but certificate not claimed
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
                          // Course in progress - show progress bar and continue button
                          return (
                            <div className="space-y-2 flex flex-col">
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
      </div>
    </div>
  );
};

export default Dashboard;
