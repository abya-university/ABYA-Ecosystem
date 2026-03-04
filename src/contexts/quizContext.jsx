import { createContext, useEffect, useState } from "react";
import Ecosystem2FacetABI from "../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import { client } from "../services/client";
import {
  defineChain,
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import CONTRACT_ADDRESSES from "../constants/addresses";
import { useActiveAccount } from "thirdweb/react";
import { uploadFileToPinata, uploadMetadataToIPFS } from "../services/pinata";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const QuizContext = createContext();

const QuizProvider = ({ children }) => {
  const account = useActiveAccount();
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

  const createQuiz = async (lessonId, quizTitle) => {
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
      method: "createQuiz",
      params: [lessonId, quizTitle],
    });

    const receipt = await sendTransaction({ transaction: tx, account });
    await fetchQuizzes();
    return receipt;
  };

  const createQuestionWithChoices = async (
    quizId,
    question,
    options,
    correctOptionIndex,
  ) => {
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
      method: "createQuestionWithChoices",
      params: [quizId, question, options, correctOptionIndex],
    });

    const receipt = await sendTransaction({ transaction: tx, account });
    await fetchQuizzes();
    return receipt;
  };

  const ContentTypeEnum = {
    Video: 0,
    Image: 1,
    Document: 2,
  };

  const addLessonResource = async ({
    lessonId,
    contentType,
    resourceName,
    resourceLink,
    file,
  }) => {
    if (!account?.address) {
      throw new Error("Please connect your wallet");
    }

    if (!client) {
      throw new Error("Client is required to access the contract");
    }

    let finalLink = "";

    if (contentType !== "Video") {
      const fileCid = await uploadFileToPinata(file);
      const metadata = {
        type: contentType.toLowerCase(),
        file: fileCid,
      };
      finalLink = await uploadMetadataToIPFS(metadata);
    } else {
      finalLink = resourceLink;
    }

    const newResource = {
      contentType: ContentTypeEnum[contentType],
      url: finalLink,
      name: resourceName,
    };

    const diamondContract = getContract({
      address: DiamondAddress,
      abi: Ecosystem2Facet_ABI,
      client,
      chain: defineChain(11155111),
    });

    const tx = await prepareContractCall({
      contract: diamondContract,
      method: "addResourcesToLesson",
      params: [lessonId, ContentTypeEnum[contentType], [newResource]],
    });

    const receipt = await sendTransaction({ transaction: tx, account });

    return {
      receipt,
      finalLink,
    };
  };

  useEffect(() => {
    if (client) {
      fetchQuizzes();
    }
  }, [client]);

  return (
    <QuizContext.Provider
      value={{
        quizzes,
        fetchQuizzes,
        setQuizzes,
        createQuiz,
        createQuestionWithChoices,
        addLessonResource,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export { QuizContext };
export default QuizProvider;
