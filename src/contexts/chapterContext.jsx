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

    const tx = await prepareContractCall({
      contract: diamondContract,
      method: "addChapters",
      params: [Number(courseId), chapterNames, chapterDurations],
    });

    const receipt = await sendTransaction({ transaction: tx, account });
    await fetchChapters();
    return receipt;
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
