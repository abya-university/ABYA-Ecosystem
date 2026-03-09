import { createContext, useEffect, useState } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { defineChain } from "thirdweb/chains";
import { useActiveAccount } from "thirdweb/react";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import { client } from "../services/client";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const ChapterContext = createContext();

const parseDurationToWeeks = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.trunc(value);
    return normalized > 0 ? normalized : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d+)(?:\s*weeks?)?$/i);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const ChapterProvider = ({ children }) => {
  const account = useActiveAccount();
  const [chapters, setChapters] = useState([]);

  const fetchChapters = async () => {
    if (client) {
      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });

        const chaptersData = await readContract({
          contract,
          method:
            "function getAllChapters() view returns ((uint256 courseId, uint256 chapterId, string chapterName, uint256 duration, bool exists)[])",
          params: [],
        });

        // Convert the response to a more manageable format
        const formattedChapters = chaptersData.map((chapter) => ({
          courseId: Number(chapter.courseId),
          chapterId: Number(chapter.chapterId),
          chapterName: chapter.chapterName,
          exists: chapter.exists,
          duration: Number(chapter.duration),
        }));

        console.log("Formatted contract data:", formattedChapters);
        setChapters(formattedChapters);
        return formattedChapters;
      } catch (fetchError) {
        console.error("Error fetching chapters:", fetchError);
        return null;
      }
    } else {
      console.warn("No signer available");
      return null;
    }
  };

  const createChapters = async (courseId, chapterNames, chapterDurations) => {
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

    const normalizedDurations = chapterDurations.map((duration, index) => {
      const parsed = parseDurationToWeeks(duration);
      if (parsed === null) {
        throw new Error(
          `Invalid chapter duration at position ${
            index + 1
          }. Use a positive number of weeks (e.g., 4 or \"4 weeks\")`,
        );
      }
      return parsed;
    });

    const tx = await prepareContractCall({
      contract: diamondContract,
      method:
        "function addChapters(uint256 _courseId, string[] _chapters, uint256[] _durations) returns (bool)",
      params: [Number(courseId), chapterNames, normalizedDurations],
    });

    const receipt = await sendTransaction({ transaction: tx, account });

    // Fetch all chapters and filter by courseId to get the newly created chapter IDs
    const contract = getContract({
      address: DiamondAddress,
      abi: Ecosystem2Facet_ABI,
      client,
      chain: defineChain(11155111),
    });

    const allChaptersData = await readContract({
      contract,
      method:
        "function getAllChapters() view returns ((uint256 courseId, uint256 chapterId, string chapterName, uint256 duration, bool exists)[])",
      params: [],
    });

    // Filter chapters by courseId and get the last N chapter IDs
    const courseChapters = allChaptersData.filter(
      (chapter) => Number(chapter.courseId) === Number(courseId),
    );
    const chapterIds = courseChapters
      .slice(-chapterNames.length)
      .map((chapter) => chapter.chapterId.toString());

    await fetchChapters();

    return {
      receipt,
      chapterIds,
    };
  };

  // Optional: Add useEffect to fetch chapters on component mount
  useEffect(() => {
    fetchChapters();
  }, []);

  return (
    <ChapterContext.Provider
      value={{
        chapters,
        fetchChapters,
        setChapters,
        createChapters,
      }}
    >
      {children}
    </ChapterContext.Provider>
  );
};

export { ChapterContext };
export default ChapterProvider;
