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

  const fetchCompletedLessons = useCallback(
    async (courseId) => {
      if (!courseId || !address) {
        setCompletedLessonIds(new Set());
        return new Set();
      }

      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(11155111),
        });

        console.log("Fetching completed lessons for course:", courseId);

        const completedLessons = await readContract({
          contract,
          method: "getUserCompletedLessonsByCourse",
          params: [BigInt(courseId)],
        });

        console.log("Raw completed lessons:", completedLessons);

        if (!completedLessons || completedLessons.length === 0) {
          const newSet = new Set();
          setCompletedLessonIds(newSet);
          return newSet;
        }

        const lessonIds = completedLessons
          .map((id) => id.toString())
          .filter((id) => id && id !== "0");
        const newSet = new Set(lessonIds);

        setCompletedLessonIds(newSet);
        console.log("Final completed lessons:", Array.from(newSet));
        return newSet;
      } catch (error) {
        console.error("Error fetching completed lessons:", error);
        const newSet = new Set();
        setCompletedLessonIds(newSet);
        return newSet;
      }
    },
    [address]
  );

  const fetchCompletedQuizzes = useCallback(
    async (courseId) => {
      if (!courseId || !address) {
        setCompletedQuizIds(new Set());
        return new Set();
      }

      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(11155111),
        });

        console.log("Fetching completed quizzes for course:", courseId);

        const completedQuizzes = await readContract({
          contract,
          method: "getUserCompletedQuizzesByCourse",
          params: [BigInt(courseId)],
        });

        console.log("Raw completed quizzes:", completedQuizzes);

        if (!completedQuizzes || completedQuizzes.length === 0) {
          const newSet = new Set();
          setCompletedQuizIds(newSet);
          return newSet;
        }

        const quizIds = completedQuizzes
          .map((id) => id.toString())
          .filter((id) => id && id !== "0");
        const newSet = new Set(quizIds);

        setCompletedQuizIds(newSet);
        console.log("Final completed quizzes:", Array.from(newSet));
        return newSet;
      } catch (error) {
        console.error("Error fetching completed quizzes:", error);
        const newSet = new Set();
        setCompletedQuizIds(newSet);
        return newSet;
      }
    },
    [address]
  );

  const refreshedCoursesRef = useRef(new Set());

  const refreshProgress = useCallback(
    async (courseId = null) => {
      if (!address) return;

      setLoading(true);
      try {
        if (courseId) {
          // Refresh specific course
          await Promise.all([
            fetchCompletedLessons(courseId),
            fetchCompletedQuizzes(courseId),
          ]);
          refreshedCoursesRef.current.add(courseId);
        } else {
          // Refresh all enrolled courses (be more careful here)
          console.log("Refreshing progress for all courses");
          // Don't automatically refresh all courses - let components request specific ones
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
    setCompletedLessonIds((prev) => new Set([...prev, lessonId.toString()]));
  }, []);

  const addCompletedQuiz = useCallback((quizId) => {
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
