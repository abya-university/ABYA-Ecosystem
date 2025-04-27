import React, { createContext, useEffect, useState } from "react";
import Ecosystem1FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import { useEthersSigner } from "../components/useClientSigner";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
const Ecosystem1Facet_ABI = Ecosystem1FacetABI.abi;

const CourseContext = createContext();

const CourseProvider = ({ children }) => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const [courses, setCourses] = useState([]);
  const [courseReviews, setCourseReviews] = useState({});
  const [latestReviews, setLatestReviews] = useState({});
  const [courseFeedback, setCourseFeedback] = useState({});

  useEffect(() => {
    const fetchCourses = async () => {
      // Wait for signer to be fully resolved
      const resolvedSigner = await signer;

      console.log("Resolved Signer:", resolvedSigner);

      if (resolvedSigner) {
        try {
          const contract = new ethers.Contract(
            EcosystemDiamondAddress,
            Ecosystem1Facet_ABI,
            resolvedSigner
          );

          console.log("Contract instance:", contract);

          try {
            const coursesData = await contract.getAllCourses();
            console.log("Raw Courses Data:", coursesData);

            // Debug raw approved values
            coursesData.forEach((course, index) => {
              console.log(
                `Course ${index} raw approved value:`,
                course.approved,
                typeof course.approved
              );
            });

            const formattedCourses = coursesData.map((course) => {
              // For debugging
              console.log(
                `Course ${course.courseId.toString()} approved type:`,
                typeof course.approved
              );
              console.log(
                `Course ${course.courseId.toString()} approved value:`,
                course.approved
              );

              return {
                courseId: course.courseId.toString(),
                courseName: course.courseName,
                description: course.description,
                // More explicit conversion - handle both boolean and BigNumber types
                approved:
                  course.approved === true ||
                  (typeof course.approved === "object" &&
                    !course.approved.isZero()),
                score: course.score.toString(),
                creator: course.creator,
                enrolledStudents: course.enrolledStudents.toString(),
                difficulty_level: Number(course.difficultyLevel),
                creationTime: course.creationTime.toString(),
              };
            });

            console.log("Formatted Courses:", formattedCourses);
            setCourses(formattedCourses);

            // After fetching courses, fetch reviews and feedback for each
            formattedCourses.forEach((course) => {
              fetchCourseReviews(contract, course.courseId);
              fetchLatestReview(contract, course.courseId);
              fetchCourseFeedback(contract, course.courseId);
            });
          } catch (fetchError) {
            console.error("Error fetching courses:", fetchError);
          }
        } catch (contractError) {
          console.error("Error creating contract instance:", contractError);
        }
      } else {
        console.warn("No signer available");
      }
    };

    fetchCourses();
  }, [signer]); // Dependency on signer ensures it runs when signer is ready

  // Function to fetch all reviews for a course
  const fetchCourseReviews = async (contract, courseId) => {
    if (!courseId) {
      console.warn("Invalid courseId passed to fetchCourseReviews");
      return;
    }

    try {
      console.log(`Fetching all reviews for course ${courseId}`);
      const reviews = await contract.getAllCourseReviews(courseId);
      console.log("Raw reviews data:", reviews);

      // Check if we have reviews
      if (!reviews || reviews.length === 0) {
        console.log("No reviews found for this course");
        setCourseReviews((prev) => ({
          ...prev,
          [courseId]: [],
        }));
        return;
      }

      // Format the reviews array, handling different possible formats
      const formattedReviews = [];
      for (let i = 0; i < reviews.length; i++) {
        const review = reviews[i];
        formattedReviews.push({
          learnerAgency: Number(review.learnerAgency || review[0] || 0),
          criticalThinking: Number(review.criticalThinking || review[1] || 0),
          collaborativeLearning: Number(
            review.collaborativeLearning || review[2] || 0
          ),
          reflectivePractice: Number(
            review.reflectivePractice || review[3] || 0
          ),
          adaptiveLearning: Number(review.adaptiveLearning || review[4] || 0),
          authenticLearning: Number(review.authenticLearning || review[5] || 0),
          technologyIntegration: Number(
            review.technologyIntegration || review[6] || 0
          ),
          learnerSupport: Number(review.learnerSupport || review[7] || 0),
          assessmentForLearning: Number(
            review.assessmentForLearning || review[8] || 0
          ),
          engagementAndMotivation: Number(
            review.engagementAndMotivation || review[9] || 0
          ),
          isSubmitted: Boolean(review.isSubmitted || review[10] || false),
          category: review.category || review[11] || "General",
        });
      }

      setCourseReviews((prev) => ({
        ...prev,
        [courseId]: formattedReviews,
      }));
    } catch (error) {
      console.error(`Error fetching reviews for course ${courseId}:`, error);
      if (error.message.includes("No reviews for this course")) {
        setCourseReviews((prev) => ({
          ...prev,
          [courseId]: [],
        }));
      }
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
      const latestReview = await contract.getLatestCourseReview(courseId);
      console.log("Raw latest review data:", latestReview);

      const safeNumber = (value) => {
        if (typeof value === "bigint") return Number(value);
        return Number(value || 0);
      };

      // Create a properly formatted object, handling all possible formats
      const formattedReview = {
        learnerAgency: safeNumber(
          latestReview?.learnerAgency || latestReview[0] || 0
        ),
        criticalThinking: safeNumber(
          latestReview?.criticalThinking || latestReview[1] || 0
        ),
        collaborativeLearning: safeNumber(
          latestReview?.collaborativeLearning || latestReview[2] || 0
        ),
        reflectivePractice: safeNumber(
          latestReview?.reflectivePractice || latestReview[3] || 0
        ),
        adaptiveLearning: safeNumber(
          latestReview?.adaptiveLearning || latestReview[4] || 0
        ),
        authenticLearning: safeNumber(
          latestReview?.authenticLearning || latestReview[5] || 0
        ),
        technologyIntegration: safeNumber(
          latestReview?.technologyIntegration || latestReview[6] || 0
        ),
        learnerSupport: safeNumber(
          latestReview?.learnerSupport || latestReview[7] || 0
        ),
        assessmentForLearning: safeNumber(
          latestReview?.assessmentForLearning || latestReview[8] || 0
        ),
        engagementAndMotivation: safeNumber(
          latestReview?.engagementAndMotivation || latestReview[9] || 0
        ),
        isSubmitted: Boolean(
          latestReview?.isSubmitted || latestReview[10] || false
        ),
        category: latestReview?.category || latestReview[11] || "General",
        score: safeNumber(latestReview?.score || latestReview[12] || 0),
        passed: Boolean(latestReview?.passed || latestReview[13] || false),
      };

      console.log("Formated latest review data:", formattedReview);

      setLatestReviews((prev) => ({
        ...prev,
        [courseId]: formattedReview,
      }));
    } catch (error) {
      console.error(
        `Error fetching latest review for course ${courseId}:`,
        error
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
      const feedback = await contract.getCourseFeedback(courseId);

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
    if (!courseId) {
      console.warn("Invalid courseId passed to getCourseData");
      return;
    }

    if (!signer) return;

    const resolvedSigner = await signer;
    const contract = new ethers.Contract(
      EcosystemDiamondAddress,
      Ecosystem1Facet_ABI,
      resolvedSigner
    );

    try {
      await fetchCourseReviews(contract, courseId);
      await fetchLatestReview(contract, courseId);
      await fetchCourseFeedback(contract, courseId);
    } catch (error) {
      console.error(
        `Error fetching complete data for course ${courseId}:`,
        error
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
