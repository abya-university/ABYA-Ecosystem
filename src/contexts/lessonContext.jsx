import React, { createContext, useEffect, useState } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { useEthersSigner } from "../components/useClientSigner";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const LessonContext = createContext();

const LessonProvider = ({ children }) => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const [lessons, setLessons] = useState([]);

  const fetchLessons = async () => {
    console.log("Starting fetchLessons...");
    const resolvedSigner = await signer;
    console.log("ResolvedSigner: ", resolvedSigner);

    if (resolvedSigner) {
      try {
        const contract = new ethers.Contract(
          EcosystemDiamondAddress,
          Ecosystem2Facet_ABI,
          resolvedSigner
        );
        console.log("Contract instance created");

        // Call the function to get lessons from the mapping
        const lessonsData = await contract.getAllLessons();
        console.log("Raw lessons data:", lessonsData);

        const lessonsArray = lessonsData.map((lesson) => ({
          chapterId: Number(lesson.chapterId),
          lessonId: Number(lesson.lessonId),
          lessonName: lesson.lessonName,
          lessonContent: lesson.lessonContent,
          additionalResources: lesson.additionalResources.map((resource) => ({
            name: resource.name,
            url: resource.url,
            contentType: Number(resource.contentType),
          })),
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

  useEffect(() => {
    if (signer) {
      fetchLessons();
    }
  }, [signer, address]);

  return (
    <LessonContext.Provider value={{ lessons, fetchLessons, setLessons }}>
      {children}
    </LessonContext.Provider>
  );
};

export { LessonContext };
export default LessonProvider;
