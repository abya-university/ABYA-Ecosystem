import React, { createContext, useEffect, useState } from "react";
import Ecosystem2ABI from "../artifacts/contracts/Ecosystem Contracts/Ecosystem2.sol/Ecosystem2.json";
import { useEthersSigner } from "../components/useClientSigner";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

const Ecosystem2ContractAddress = import.meta.env
  .VITE_APP_ECOSYSTEM2_CONTRACT_ADDRESS;
const Ecosystem2_ABI = Ecosystem2ABI.abi;

const QuizContext = createContext();

const QuizProvider = ({ children }) => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const [quizzes, setQuizzes] = useState([]);

  const fetchQuizzes = async () => {
    console.log("Starting fetchQuizzes...");
    const resolvedSigner = await signer;
    console.log("ResolvedSigner: ", resolvedSigner);

    if (resolvedSigner) {
      try {
        const contract = new ethers.Contract(
          Ecosystem2ContractAddress,
          Ecosystem2_ABI,
          resolvedSigner
        );
        console.log("Contract instance created");

        // Log the contract address to verify
        console.log("Contract address:", Ecosystem2ContractAddress);

        // Call the function to get lessons from the mapping
        const quizzesData = await contract.getAllQuizzes();
        console.log("Raw quizzes data:", quizzesData);

        const quizzesArray = quizzesData.map((quiz) => ({
          quizId: Number(quiz.quizId),
          quizTitle: quiz.quizTitle,
        }));
        console.log("Processed quizzes array:", quizzesArray);

        setQuizzes(quizzesArray);
        return quizzesArray;
      } catch (fetchError) {
        console.error("Error fetching quizzes - Full error:", fetchError);
      }
    } else {
      console.warn("No signer available");
    }
  };

  useEffect(() => {
    if (signer) {
      fetchQuizzes();
    }
  }, [signer, address]);

  return (
    <QuizContext.Provider value={{ quizzes, fetchQuizzes, setQuizzes }}>
      {children}
    </QuizContext.Provider>
  );
};

export { QuizContext };
export default QuizProvider;
