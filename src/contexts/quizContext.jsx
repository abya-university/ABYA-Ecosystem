import { createContext, useEffect, useState } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { client } from "../services/client";
import { defineChain, getContract, readContract } from "thirdweb";

const EcosystemDiamondAddress = import.meta.env
  .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const QuizContext = createContext();

const QuizProvider = ({ children }) => {
  const [quizzes, setQuizzes] = useState([]);

  const fetchQuizzes = async () => {
    console.log("Starting fetchQuizzes...");

    // Use client directly instead of undefined 'signer'
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

        const quizzesData = await readContract({
          contract,
          method:
            "function getAllQuizzes() view returns ((uint256 lessonId, uint256 quizId, string quizTitle, (uint256 quizId, uint256 questionId, string questionText, (string option, bool isCorrect)[] choices)[] questions, bool exists, uint256 lockTime)[])",
          params: [],
        });

        console.log("Raw quizzes data:", quizzesData);

        const quizzesArray = quizzesData.map((quiz) => ({
          lessonId: Number(quiz.lessonId),
          quizId: Number(quiz.quizId),
          quizTitle: quiz.quizTitle,
          exists: quiz.exists,
          lockTime: Number(quiz.lockTime), // Added missing lockTime property
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
    if (client) {
      fetchQuizzes();
    }
  }, [client]);

  return (
    <QuizContext.Provider value={{ quizzes, fetchQuizzes, setQuizzes }}>
      {children}
    </QuizContext.Provider>
  );
};

export { QuizContext };
export default QuizProvider;
