import React, { createContext, useEffect, useState } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { useEthersSigner } from "../components/useClientSigner";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

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
          EcosystemDiamondAddress,
          Ecosystem2Facet_ABI,
          resolvedSigner
        );
        console.log("Contract instance created");

        // Call the function to get lessons from the mapping
        const quizzesData = await contract.getAllQuizzes();
        console.log("Raw quizzes data:", quizzesData);

        const quizzesArray = quizzesData.map((quiz) => ({
          lessonId: Number(quiz.lessonId),
          quizId: Number(quiz.quizId),
          quizTitle: quiz.quizTitle,
          questions: quiz.questions.map((question) => ({
            quizId: Number(question.quizId),
            questionId: Number(question.questionId),
            questionText: question.questionText,
            choices: question.choices.map((choice) => ({
              option: choice.option,
              isCorrect: choice.isCorrect,
            })),
          })),
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
  }, [signer, address, quizzes]);

  return (
    <QuizContext.Provider value={{ quizzes, fetchQuizzes, setQuizzes }}>
      {children}
    </QuizContext.Provider>
  );
};

export { QuizContext };
export default QuizProvider;
