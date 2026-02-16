import React, { createContext, useEffect, useState } from "react";
import Ecosystem1FacetABI from "../artifacts/contracts/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import { defineChain } from "thirdweb/chains";
import { useActiveAccount } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";
import { client } from "../services/client";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem1Facet_ABI = Ecosystem1FacetABI.abi;

const CourseContext = createContext();

const CourseProvider = ({ children }) => {
  const account = useActiveAccount();
  const address = account?.address || null;
  const [courses, setCourses] = useState([]);
  const [courseReviews, setCourseReviews] = useState({});
  const [latestReviews, setLatestReviews] = useState({});
  const [courseFeedback, setCourseFeedback] = useState({});

  useEffect(() => {
    const fetchCourses = async () => {
      console.log("🔍 fetchCourses called, client:", client);
      console.log("🔍 DiamondAddress:", DiamondAddress);

      if (!client) {
        console.error(
          "❌ Client is not available. Check VITE_APP_THIRDWEB_CLIENT_ID",
        );
        return;
      }

      if (!DiamondAddress) {
        console.error("❌ Diamond contract address is not configured");
        return;
      }

      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: Ecosystem1Facet_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });

        console.log("✅ Contract instance created:", contract);

        try {
          // Use readContract directly
          const coursesData = await readContract({
            contract,
            method: "getAllCourses",
            params: [],
          });

          console.log("✅ Raw Courses Data:", coursesData);

          const formattedCourses = Array.isArray(coursesData)
            ? coursesData.map((course) => {
                const enrolledStudents = Array.isArray(course.enrolledStudents)
                  ? course.enrolledStudents
                  : [];

                return {
                  courseId: course.courseId.toString(),
                  courseName: course.courseName,
                  description: course.description,
                  approved: course.approved,
                  score: course.score.toString(),
                  creator: course.creator,
                  enrolledStudents: enrolledStudents.map((student) =>
                    student.toString(),
                  ),
                  difficulty_level: Number(course.difficultyLevel),
                  creationTime: course.creationTime.toString(),
                  priceUSDC: course?.priceUSDC?.toString?.() ?? "0",
                  imageURL: course?.imageURL || "",
                };
              })
            : [];

          console.log("✅ Formatted Courses:", formattedCourses);
          setCourses(formattedCourses);

          // Fetch reviews and feedback for each course
          for (const course of formattedCourses) {
            await fetchCourseReviews(contract, course.courseId);
            await fetchLatestReview(contract, course.courseId);
            await fetchCourseFeedback(contract, course.courseId);
          }
        } catch (fetchError) {
          console.error("❌ Error fetching courses:", fetchError);
          console.error(
            "❌ Error details:",
            fetchError.message,
            fetchError.stack,
          );
        }
      } catch (contractError) {
        console.error("❌ Error creating contract instance:", contractError);
        console.error("❌ Contract error details:", contractError.message);
      }
    };

    fetchCourses();
  }, []);

  // Function to fetch all reviews for a course
  const fetchCourseReviews = async (contract, courseId) => {
    if (!courseId) {
      console.warn("Invalid courseId passed to fetchCourseReviews");
      return;
    }

    try {
      console.log(`Fetching all reviews for course ${courseId}`);

      // Use readContract directly
      const reviews = await readContract({
        contract,
        method: "getAllCourseReviews",
        params: [courseId],
      });

      console.log("Raw reviews data:", reviews);

      if (!reviews || reviews.length === 0) {
        console.log("No reviews found for this course");
        setCourseReviews((prev) => ({
          ...prev,
          [courseId]: [],
        }));
        return;
      }

      const formattedReviews = reviews.map((review) => ({
        learnerAgency: Number(review.learnerAgency),
        criticalThinking: Number(review.criticalThinking),
        collaborativeLearning: Number(review.collaborativeLearning),
        reflectivePractice: Number(review.reflectivePractice),
        adaptiveLearning: Number(review.adaptiveLearning),
        authenticLearning: Number(review.authenticLearning),
        technologyIntegration: Number(review.technologyIntegration),
        learnerSupport: Number(review.learnerSupport),
        assessmentForLearning: Number(review.assessmentForLearning),
        engagementAndMotivation: Number(review.engagementAndMotivation),
        isSubmitted: Boolean(review.isSubmitted),
        category: review.category,
        score: Number(review.score),
        passed: Boolean(review.passed),
      }));

      setCourseReviews((prev) => ({
        ...prev,
        [courseId]: formattedReviews,
      }));
    } catch (error) {
      console.error(`Error fetching reviews for course ${courseId}:`, error);
      setCourseReviews((prev) => ({
        ...prev,
        [courseId]: [],
      }));
    }
  };

  // Function to fetch latest review for a course
  const fetchLatestReview = async (contract, courseId) => {
    if (!courseId) {
      console.warn("Invalid courseId passed to fetchLatestReview");
      return;
    }

    try {
      console.log(`Fetching latest review for course ${courseId}`);

      // Use readContract directly
      const latestReview = await readContract({
        contract,
        method:
          "function getLatestCourseReview(uint256 courseId) view returns ((uint256 learnerAgency, uint256 criticalThinking, uint256 collaborativeLearning, uint256 reflectivePractice, uint256 adaptiveLearning, uint256 authenticLearning, uint256 technologyIntegration, uint256 learnerSupport, uint256 assessmentForLearning, uint256 engagementAndMotivation, bool isSubmitted, string category, uint256 score, bool passed))",
        params: [courseId],
      });

      console.log("Raw latest review data:", latestReview);

      const formattedReview = {
        learnerAgency: Number(latestReview.learnerAgency),
        criticalThinking: Number(latestReview.criticalThinking),
        collaborativeLearning: Number(latestReview.collaborativeLearning),
        reflectivePractice: Number(latestReview.reflectivePractice),
        adaptiveLearning: Number(latestReview.adaptiveLearning),
        authenticLearning: Number(latestReview.authenticLearning),
        technologyIntegration: Number(latestReview.technologyIntegration),
        learnerSupport: Number(latestReview.learnerSupport),
        assessmentForLearning: Number(latestReview.assessmentForLearning),
        engagementAndMotivation: Number(latestReview.engagementAndMotivation),
        isSubmitted: Boolean(latestReview.isSubmitted),
        category: latestReview.category,
        score: Number(latestReview.score),
        passed: Boolean(latestReview.passed),
      };

      console.log("Formatted latest review data:", formattedReview);

      setLatestReviews((prev) => ({
        ...prev,
        [courseId]: formattedReview,
      }));
    } catch (error) {
      console.error(
        `Error fetching latest review for course ${courseId}:`,
        error,
      );
      setLatestReviews((prev) => ({
        ...prev,
        [courseId]: {},
      }));
    }
  };

  // Function to fetch feedback for a course
  const fetchCourseFeedback = async (contract, courseId) => {
    if (!courseId) {
      console.warn("Invalid courseId passed to fetchCourseFeedback");
      return;
    }

    try {
      // Use readContract directly
      const feedback = await readContract({
        contract,
        method:
          "function getCourseFeedback(uint256 courseId) view returns (string)",
        params: [courseId],
      });

      console.log(`Feedback for course ${courseId}:`, feedback);

      setCourseFeedback((prev) => ({
        ...prev,
        [courseId]: feedback,
      }));
    } catch (error) {
      console.error(`Error fetching feedback for course ${courseId}:`, error);
    }
  };

  // Function to fetch on demand for a specific course
  const getCourseData = async (courseId) => {
    if (!courseId || !client) return;

    try {
      const contract = getContract({
        address: DiamondAddress,
        abi: Ecosystem1Facet_ABI,
        client,
        chain: defineChain(11155111), // Sepolia
      });

      await Promise.all([
        fetchCourseReviews(contract, courseId),
        fetchLatestReview(contract, courseId),
        fetchCourseFeedback(contract, courseId),
      ]);
    } catch (error) {
      console.error(
        `Error fetching complete data for course ${courseId}:`,
        error,
      );
    }
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        courseReviews,
        latestReviews,
        courseFeedback,
        setCourseFeedback,
        setLatestReviews,
        getCourseData,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export { CourseContext };
export default CourseProvider;
