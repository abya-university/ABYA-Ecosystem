import { createContext, useEffect, useState } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { defineChain } from "thirdweb/chains";
import { client } from "../services/client";
import { useActiveAccount } from "thirdweb/react";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const LessonContext = createContext();

const LessonProvider = ({ children }) => {
  const account = useActiveAccount();
  const address = account?.address || null;
  const [lessons, setLessons] = useState([]);

  const fetchLessons = async () => {
    console.log("Starting fetchLessons...");

    if (client) {
      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });
        console.log("Contract instance created");

        const lessonsData = await readContract({
          contract,
          method: "getAllLessons",
          params: [],
        });

        console.log("Raw lessons data:", lessonsData);

        const lessonsArray = lessonsData.map((lesson) => ({
          chapterId: Number(lesson.chapterId),
          lessonId: Number(lesson.lessonId),
          lessonName: lesson.lessonName,
          lessonContent: lesson.lessonContent,
          additionalResources: lesson.additionalResources
            .slice(0, Number(lesson.resourceCount)) // Only take the actual resources
            .map((resource) => ({
              name: resource.name,
              url: resource.url,
              contentType: Number(resource.contentType),
            })),
          exists: lesson.exists,
        }));

        console.log("Processed lessons array:", lessonsArray);
        setLessons(lessonsArray);
        return lessonsArray;
      } catch (fetchError) {
        console.error("Error fetching lessons - Full error:", fetchError);
      }
    } else {
      console.warn("No signer available");
    }
  };

  const createLesson = async (chapterId, lessonName, lessonContent) => {
    if (!account?.address) {
      throw new Error("Please connect your wallet");
    }

    if (!client) {
      throw new Error("Client is required to access the contract");
    }

    const diamondContract = getContract({
      address: DiamondAddress,
      abi: Ecosystem2Facet_ABI,
      client,
      chain: defineChain(11155111),
    });

    const tx = await prepareContractCall({
      contract: diamondContract,
      method: "addLesson",
      params: [chapterId.toString(), lessonName, lessonContent],
    });

    const receipt = await sendTransaction({ transaction: tx, account });

    // Fetch all lessons and filter by chapterId to get the newly created lesson ID
    const contract = getContract({
      address: DiamondAddress,
      abi: Ecosystem2Facet_ABI,
      client,
      chain: defineChain(11155111),
    });

    const allLessonsData = await readContract({
      contract,
      method: "getAllLessons",
      params: [],
    });

    // Filter lessons by chapterId and get the latest one
    const chapterLessons = allLessonsData.filter(
      (lesson) => Number(lesson.chapterId) === Number(chapterId),
    );
    if (!chapterLessons.length) {
      throw new Error(
        "Lesson was created but could not be resolved for this chapter",
      );
    }
    const latestLesson = chapterLessons[chapterLessons.length - 1];
    const lessonId = latestLesson.lessonId.toString();

    await fetchLessons();

    return {
      receipt,
      lessonId,
    };
  };

  useEffect(() => {
    if (client) {
      fetchLessons();
    }
  }, [client]);

  return (
    <LessonContext.Provider
      value={{
        lessons,
        fetchLessons,
        setLessons,
        createLesson,
      }}
    >
      {children}
    </LessonContext.Provider>
  );
};

export { LessonContext };
export default LessonProvider;
