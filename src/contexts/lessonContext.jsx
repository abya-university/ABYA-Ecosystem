import { createContext, useEffect, useState } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { defineChain } from "thirdweb/chains";
import { client } from "../services/client";
import { useActiveAccount } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const LessonContext = createContext();

const LessonProvider = ({ children }) => {
  const account = useActiveAccount();
  const address = account?.address || null;
  const [lessons, setLessons] = useState([]);

  const fetchLessons = async () => {
    console.log("Starting fetchLessons...");
    const resolvedSigner = await client;
    console.log("ResolvedSigner: ", resolvedSigner);

    if (resolvedSigner) {
      try {
        const contract = getContract({
          address: EcosystemDiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(1020352220),
        });
        console.log("Contract instance created");

        const lessonsData = await readContract({
          contract,
          method:
            "function getAllLessons() view returns ((uint256 chapterId, uint256 lessonId, string lessonName, string lessonContent, (uint8 contentType, string url, string name)[10] additionalResources, uint256 resourceCount, bool exists)[])",
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

  useEffect(() => {
    if (client) {
      fetchLessons();
    }
  }, [client]);

  return (
    <LessonContext.Provider value={{ lessons, fetchLessons, setLessons }}>
      {children}
    </LessonContext.Provider>
  );
};

export { LessonContext };
export default LessonProvider;
