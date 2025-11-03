import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useActiveAccount } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "../services/client";
import Ecosystem2FacetABI from "../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
};

export const ProgressProvider = ({ children }) => {
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [completedQuizIds, setCompletedQuizIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const account = useActiveAccount();
  const address = account?.address;

  const contract = getContract({
    address: DiamondAddress,
    abi: Ecosystem2Facet_ABI,
    client,
    chain: defineChain(11155111),
  });

  const fetchCompletedLessons = useCallback(
    async (courseId) => {
      if (!courseId || !address) {
        console.log("Missing courseId or address");
        setCompletedLessonIds(new Set());
        return new Set();
      }

      try {
        console.log("Fetching completed lessons for course:", courseId);

        const completedLessons = await readContract({
          contract,
          method:
            "function getUserCompletedLessonsByCourse(uint256 _courseId) external view returns(uint256[] memory)",
          params: [BigInt(courseId)],
        });

        console.log("Raw completed lessons:", completedLessons);

        if (
          !completedLessons ||
          !Array.isArray(completedLessons) ||
          completedLessons.length === 0
        ) {
          console.log("No completed lessons found in contract");
          const newSet = new Set();
          setCompletedLessonIds(newSet);
          return newSet;
        }

        const lessonIds = completedLessons
          .map((id) => id.toString())
          .filter((id) => id && id !== "0");

        console.log("Processed lesson IDs:", lessonIds);

        const newSet = new Set(lessonIds);
        setCompletedLessonIds(newSet);
        return newSet;
      } catch (error) {
        console.error("Error fetching completed lessons:", error);
        const newSet = new Set();
        setCompletedLessonIds(newSet);
        return newSet;
      }
    },
    [address, contract]
  );

  const fetchCompletedQuizzes = useCallback(
    async (courseId) => {
      if (!courseId || !address) {
        setCompletedQuizIds(new Set());
        return new Set();
      }

      try {
        console.log("Fetching completed quizzes for course:", courseId);

        const completedQuizzes = await readContract({
          contract,
          method:
            "function getUserCompletedQuizzesByCourse(uint256 _courseId) external view returns(uint256[] memory)",
          params: [BigInt(courseId)],
        });

        console.log("Raw completed quizzes:", completedQuizzes);

        if (
          !completedQuizzes ||
          !Array.isArray(completedQuizzes) ||
          completedQuizzes.length === 0
        ) {
          console.log("No completed quizzes found in contract");
          const newSet = new Set();
          setCompletedQuizIds(newSet);
          return newSet;
        }

        const quizIds = completedQuizzes
          .map((id) => id.toString())
          .filter((id) => id && id !== "0");

        console.log("Processed quiz IDs:", quizIds);

        const newSet = new Set(quizIds);
        setCompletedQuizIds(newSet);
        return newSet;
      } catch (error) {
        console.error("Error fetching completed quizzes:", error);
        const newSet = new Set();
        setCompletedQuizIds(newSet);
        return newSet;
      }
    },
    [address, contract]
  );

  const refreshedCoursesRef = useRef(new Set());

  const refreshProgress = useCallback(
    async (courseId = null) => {
      if (!address) {
        console.log("No address available, skipping refresh");
        return;
      }

      setLoading(true);
      try {
        if (courseId) {
          console.log("Refreshing progress for course:", courseId);
          await Promise.all([
            fetchCompletedLessons(courseId),
            fetchCompletedQuizzes(courseId),
          ]);
          refreshedCoursesRef.current.add(courseId);
        } else {
          console.log("No specific course ID provided for refresh");
        }
      } catch (error) {
        console.error("Error refreshing progress:", error);
      } finally {
        setLoading(false);
      }
    },
    [fetchCompletedLessons, fetchCompletedQuizzes, address]
  );

  const addCompletedLesson = useCallback((lessonId) => {
    console.log("Adding completed lesson locally:", lessonId);
    setCompletedLessonIds((prev) => new Set([...prev, lessonId.toString()]));
  }, []);

  const addCompletedQuiz = useCallback((quizId) => {
    console.log("Adding completed quiz locally:", quizId);
    setCompletedQuizIds((prev) => new Set([...prev, quizId.toString()]));
  }, []);

  const value = {
    completedLessonIds,
    completedQuizIds,
    loading,
    fetchCompletedLessons,
    fetchCompletedQuizzes,
    refreshProgress,
    addCompletedLesson,
    addCompletedQuiz,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
