import React, { createContext, useEffect, useState } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { defineChain } from "thirdweb/chains";
import { getContract, readContract } from "thirdweb";
import { client } from "../services/client";

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const ChapterContext = createContext();

const ChapterProvider = ({ children }) => {
  const [chapters, setChapters] = useState([]);

  const fetchChapters = async () => {
    const resolvedSigner = await client;

    if (resolvedSigner) {
      try {
        const contract = getContract({
          address: EcosystemDiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(1020352220),
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

  // Optional: Add useEffect to fetch chapters on component mount
  useEffect(() => {
    fetchChapters();
  }, []);

  return (
    <ChapterContext.Provider value={{ chapters, fetchChapters, setChapters }}>
      {children}
    </ChapterContext.Provider>
  );
};

export { ChapterContext };
export default ChapterProvider;
