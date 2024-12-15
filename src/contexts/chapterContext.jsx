import React, { createContext, useEffect, useState } from "react";
import Ecosystem2ABI from "../artifacts/contracts/Ecosystem Contracts/Ecosystem2.sol/Ecosystem2.json";
import { useEthersSigner } from "../components/useClientSigner";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

const Ecosystem2ContractAddress = import.meta.env
  .VITE_APP_ECOSYSTEM2_CONTRACT_ADDRESS;
const Ecosystem2_ABI = Ecosystem2ABI.abi;

const ChapterContext = createContext();

const ChapterProvider = ({ children }) => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChapters = async (courseId) => {
    setLoading(true);
    const resolvedSigner = await signer;

    if (resolvedSigner) {
      try {
        const contract = new ethers.Contract(
          Ecosystem2ContractAddress,
          Ecosystem2_ABI,
          resolvedSigner
        );

        // Call the function to get chapters from the mapping
        const chaptersData = await contract.courseChapters(courseId);
        setChapters(chaptersData);
      } catch (fetchError) {
        console.error("Error fetching chapters:", fetchError);
      } finally {
        setLoading(false);
      }
    } else {
      console.warn("No signer available");
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ChapterContext.Provider value={{ chapters, fetchChapters, setChapters }}>
      {children}
    </ChapterContext.Provider>
  );
};

export { ChapterContext };
export default ChapterProvider;
