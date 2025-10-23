import { createContext, useEffect, useState } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { client } from "../services/client";
import { defineChain, getContract, readContract } from "thirdweb";
import CONTRACT_ADDRESSES from "../constants/addresses";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const QuizContext = createContext();

const QuizProvider = ({ children }) => {
  const [quizzes, setQuizzes] = useState([]);

  const fetchQuizzes = async () => {
    console.log("Starting fetchQuizzes...");

    if (client) {
      try {
        const contract = getContract({
          address: DiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
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
