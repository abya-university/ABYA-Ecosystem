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
} from "lucide-react";
import { CourseContext } from "../contexts/courseContext";
import { useUser } from "../contexts/userContext";
import { ChapterContext } from "../contexts/chapterContext";
import { LessonContext } from "../contexts/lessonContext";
import { QuizContext } from "../contexts/quizContext";
import Ecosystem1FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import { ethers } from "ethers";
import { useEthersSigner } from "../components/useClientSigner";
import { useAccount } from "wagmi";

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
const Ecosystem1Facet_ABI = Ecosystem1FacetABI.abi;

const CoursesPage = ({ onCourseSelect }) => {
  const { courses } = useContext(CourseContext);
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
  const { address, isConnected } = useAccount();
  const signerPromise = useEthersSigner();
  const [requestSent, setRequestSent] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [unEnrolled, setUnEnrolled] = useState(false);

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

  const requestReview = async (courseId) => {
    try {
      const signer = await signerPromise;
      const diamondContract = new ethers.Contract(
        EcosystemDiamondAddress,
        Ecosystem1Facet_ABI,
        signer
      );

      console.log("Course ID: ", courseId);

      console.log("Requesting review for courseId:", courseId); // Debug log
      const courseIdNumber = parseInt(courseId, 10);
      console.log("Course ID Type: ", typeof courseIdNumber);
      await diamondContract.selectCourseReviewers(courseId);
      setRequestSent(true);
    } catch (error) {
      console.error("Error requesting review:", error);
      setRequestSent(false);
    }
  };

  const enroll = async (courseId) => {
    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        ContractAddress,
        ContractABI,
        signer
      );
      const tx = await contract.enroll(courseId);
      await tx.wait();
      console.log(`Transaction Receipt: ${tx.hash}`);
      setEnrolled(true);
      setSuccess(`Enrolled into course ${courseId} successfully!`);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      setError("Error enrolling in course. Please try again!");
      setEnrolled(false);
    }
  };

  const unEnroll = async (courseId) => {
    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        ContractAddress,
        ContractABI,
        signer
      );
      const tx = await contract.unEnroll(courseId);
      await tx.wait();
      console.log(`Transaction Receipt: ${tx.hash}`);
      setUnEnrolled(true);
      setSuccess(`Unenrolled into course ${courseId} successfully!`);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      setError("Error enrolling in course. Please try again!");
      setUnEnrolled(false);
    }
  };

  const getEnrolledStudentsCount = (enrolledStudentsString) => {
    // If empty or undefined, return 0
    if (!enrolledStudentsString) return 0;

    // If it's a single address, return 1
    if (
      enrolledStudentsString.startsWith("0x") &&
      !enrolledStudentsString.includes(",")
    ) {
      return 1;
    }

    // If multiple addresses, split and count
    return enrolledStudentsString.split(",").length;
  };

  return (
    <div className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 min-h-screen p-6 transition-colors duration-300 pt-[100px]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Book className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold dark:text-yellow-400 text-yellow-500">
              Available Courses
            </h1>
          </div>
          <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors">
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
                className="relative p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000"
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
                    {(role === "ADMIN" ||
                      role === "Course Owner" ||
                      role === "Reviewer") && (
                      <button
                        onClick={() => viewCourse(course.courseId)}
                        className="flex-1 bg-yellow-500 text-sm text-black py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
                      >
                        <Eye className="w-5 h-5 mr-2" />
                        View Course
                      </button>
                    )}
                    {(role === "ADMIN" ||
                      (role === "Reviewer" &&
                        !course.approved &&
                        course.creator === address)) && (
                      <button
                        onClick={() => requestReview(course.courseId)}
                        className={`flex-1 bg-gray-800 text-white px-1 dark:bg-gray-300 text-sm dark:text-black py-2 rounded-lg ${
                          requestSent ? "" : "hover:bg-gray-600"
                        } transition-colors flex items-center justify-center`}
                        disabled={requestSent}
                      >
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Request Review
                      </button>
                    )}
                    {role === "USER" && !course.approved && address && (
                      <>
                        {/* {course.enrolledStudents?.includes(address) ? ( */}
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
                            className="flex-1 bg-red-700 mt-3 text-white text-sm py-2 px-1 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                          >
                            <WifiOff className="w-5 h-5 mr-2" />
                            Unenroll
                          </button>
                        </>
                        {/* ) : (
                          <button
                            onClick={() => enroll(course.courseId)}
                            className="flex-1 bg-gray-700 mt-3 text-white text-sm py-2 px-1 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
                          >
                            <Wifi className="w-5 h-5 mr-2" />
                            Enroll
                          </button>
                        )} */}
                      </>
                    )}
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
            className="fixed w-80 dark:bg-gray-900 bg-gray-100 dark:text-gray-100 text-gray-800 rounded-lg h-[400px] overflow-x-hidden shadow-xl p-4 z-50 dark:border dark:border-gray-700 border-none"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-yellow-500">
                Course Details
              </h3>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader className="w-8 h-8 text-yellow-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-yellow-500">Course Name</h4>
                  <p className="dark:text-gray-300 text-gray-700">
                    {selectedCourse.courseName}
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
                    {getDifficultyLabel(selectedCourse.difficulty_level)}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-500">Description</h4>
                  <p className="dark:text-gray-300 text-gray-700">
                    {selectedCourse.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-yellow-500">Chapters</h4>
                    <p className="dark:text-gray-300 text-gray-700">
                      {/* {
                        chapters.filter(
                          (chapter) =>
                            chapter.courseId === selectedCourse.courseId
                        ).length
                      } */}
                      {chapters?.length}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-500">Lessons</h4>
                    <p className="dark:text-gray-300 text-gray-700">
                      {/* {courseStats.totalLessons} */}
                      {lessons?.length}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-500">Quizzes</h4>
                    <p className="dark:text-gray-300 text-gray-700">
                      {/* {courseStats.totalQuizzes} */}
                      {quizzes?.length}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-500">Duration</h4>
                    <p className="dark:text-gray-300 text-gray-700">
                      {calculateTotalDuration(selectedCourse.courseId)} Weeks
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-500">
                      Prerequisites
                    </h4>
                    <p className="dark:text-gray-300 text-gray-700">None</p>
                  </div>
                  <div className="flex gap-2 flex-col">
                    <h4 className="font-semibold text-yellow-500">Enrolled</h4>
                    <span>
                      {/* {selectedCourse?.enrolledStudents || 0} Learners */}
                      {getEnrolledStudentsCount(
                        selectedCourse?.enrolledStudents
                      ) || 0}{" "}
                      Student(s)
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-yellow-500">Creator</h4>
                  <p className="dark:text-gray-300 text-gray-700 truncate w-[250px]">
                    {selectedCourse.creator}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
