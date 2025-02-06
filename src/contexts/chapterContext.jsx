import React, { createContext, useEffect, useState } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { useEthersSigner } from "../components/useClientSigner";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const ChapterContext = createContext();

const ChapterProvider = ({ children }) => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const [chapters, setChapters] = useState([]);

  const fetchChapters = async () => {
    const resolvedSigner = await signer;

    if (resolvedSigner) {
      try {
        const contract = new ethers.Contract(
          EcosystemDiamondAddress,
          Ecosystem2Facet_ABI,
          resolvedSigner
        );

        // Call the function to get chapters from the mapping
        const chaptersData = await contract.getAllChapters();

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
        return formattedChapters; // Return the formatted chapters
      } catch (fetchError) {
        console.error("Error fetching chapters:", fetchError);
        return null;
      }
    } else {
      console.warn("No signer available");
      return null;
    }
  };

  return (
    <ChapterContext.Provider value={{ chapters, fetchChapters, setChapters }}>
      {children}
    </ChapterContext.Provider>
  );
};

export { ChapterContext };
export default ChapterProvider;
