import { AlertCircle, CheckCircle, Plus } from "lucide-react";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import Ecosystem1FacetABI from "../../artifacts/contracts/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import Ecosystem2FacetABI from "../../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import CONTRACT_ADDRESSES from "../../constants/addresses";
import { useState } from "react";
import { defineChain } from "thirdweb/chains";
import { toast, ToastContainer } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../../services/client";
import { useContext } from "react";
import { LessonContext } from "../../contexts/lessonContext";
import { QuizContext } from "../../contexts/quizContext";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem1Facet_ABI = Ecosystem1FacetABI.abi;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const QuizCreation = () => {
  const [quizTitle, setQuizTitle] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [quizId, setQuizId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const { lessons } = useContext(LessonContext);
  const { quizzes } = useContext(QuizContext);
  const [quizSuccess, setQuizSuccess] = useState("");
  const [quizError, setQuizError] = useState("");
  const [questionSuccess, setQuestionSuccess] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [quizLoading, setQuizLoading] = useState(false);
  const account = useActiveAccount();
  const address = account?.address || "";
  const isConnected = !!address;
  const [loading, setLoading] = useState(false);

  const createQuiz = async () => {
    if (!isConnected || !address) {
      throw new Error("Please connect to a blockchain network");
    }
    setQuizLoading(true);
    try {
      const diamondContract = await getContract({
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
      await sendTransaction({ transaction: tx, account });
      toast.success(`${quizTitle} created successfully!!`);
      setLessonId("");
      setQuizTitle("");
    } catch (error) {
      console.error("Error creating quiz: ", error);
      toast.error("Error creating quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  const createQuestion = async () => {
    const hasQuestion = question.trim();
    const hasFilledOptions = options.every((option) => option.text?.trim());
    const correctOptionIndex = options.findIndex((option) => option.isCorrect);
    const hasOneCorrectOption = correctOptionIndex !== -1;

    if (hasQuestion && hasFilledOptions && hasOneCorrectOption) {
      setQuestions([
        ...questions,
        {
          question: question.trim(),
          options: options.map((option) => ({
            text: option.text.trim(),
            isCorrect: option.isCorrect,
          })),
        },
      ]);

      if (!isConnected || !address) {
        throw new Error("Please connect to a blockchain network");
      }
      setLoading(true);
      try {
        const diamondContract = await getContract({
          address: DiamondAddress,
          abi: Ecosystem2Facet_ABI,
          client,
          chain: defineChain(11155111),
        });

        const tx = await prepareContractCall({
          contract: diamondContract,
          method: "createQuestionWithChoices",
          params: [
            quizId,
            question,
            options.map((option) => option.text),
            correctOptionIndex,
          ],
        });
        await sendTransaction({ transaction: tx, account });
        toast.success("Question created successfully!!");

        setQuestion("");
        setOptions([
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ]);
      } catch (err) {
        toast.error("Error creating question");
      } finally {
        setLoading(false);
      }
    } else {
      alert(
        "Please ensure: \n- Question is filled\n- All options are filled\n- Exactly one option is marked as correct"
      );
    }
  };

  const updateOption = (index, field, value) => {
    setOptions((prev) =>
      prev.map((option, i) =>
        i === index
          ? { ...option, [field]: value }
          : field === "isCorrect"
          ? { ...option, isCorrect: false }
          : option
      )
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-yellow-500">
        Create Quiz
      </h2>

      {/* Quiz Success/Error Messages */}
      {(quizSuccess || quizError) && (
        <div
          className={`mb-4 p-3 md:p-4 rounded-lg flex items-center ${
            quizSuccess
              ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {quizSuccess ? (
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          ) : (
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          )}
          <span className="text-sm md:text-base">
            {quizSuccess || quizError}
          </span>
        </div>
      )}

      <div className="grid gap-3 md:gap-4">
        {/* Quiz Title */}
        <input
          type="text"
          placeholder="Quiz Title"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
        />

        {/* Lesson Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Lesson
          </label>
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
          >
            <option value="" className="text-gray-500 dark:text-gray-400">
              Choose a lesson
            </option>
            {lessons.map((lesson) => (
              <option
                key={lesson.lessonId}
                value={lesson.lessonId}
                className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              >
                {lesson.lessonName}
              </option>
            ))}
          </select>
        </div>

        {/* Create Quiz Button */}
        <button
          onClick={createQuiz}
          disabled={quizLoading || !quizTitle.trim() || !lessonId}
          className={`rounded-lg bg-yellow-500 text-gray-900 py-2 px-4 hover:bg-yellow-600 transition-colors text-sm md:text-base font-medium w-full sm:w-[140px] ${
            quizLoading || !quizTitle.trim() || !lessonId
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {quizLoading ? "Creating..." : "Create Quiz"}
        </button>

        {/* Question Success/Error Messages */}
        {(questionSuccess || questionError) && (
          <div
            className={`mb-4 p-3 md:p-4 rounded-lg flex items-center ${
              questionSuccess
                ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {questionSuccess ? (
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            )}
            <span className="text-sm md:text-base">
              {questionSuccess || questionError}
            </span>
          </div>
        )}

        {/* Quiz Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Quiz
          </label>
          <select
            value={quizId}
            onChange={(e) => setQuizId(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
          >
            <option value="" className="text-gray-500 dark:text-gray-400">
              Choose a Quiz
            </option>
            {quizzes.map((quiz) => (
              <option
                key={quiz.quizId}
                value={quiz.quizId}
                className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              >
                {quiz.quizTitle}
              </option>
            ))}
          </select>
        </div>

        {/* Question Input Section */}
        <div className="space-y-3 md:space-y-4">
          <input
            type="text"
            placeholder="Question"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          {/* Options with Radio Buttons */}
          <div className="space-y-3">
            {options.map((option, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3"
              >
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base"
                  value={option.text}
                  onChange={(e) => updateOption(index, "text", e.target.value)}
                />
                <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg sm:w-32 justify-center sm:justify-start">
                  <input
                    type="radio"
                    id={`correct-${index}`}
                    name="correctOption"
                    checked={option.isCorrect}
                    onChange={() => updateOption(index, "isCorrect", true)}
                    className="text-yellow-500 focus:ring-yellow-500"
                  />
                  <label
                    className="text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap"
                    htmlFor={`correct-${index}`}
                  >
                    Correct
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Create Question Button */}
          <button
            onClick={createQuestion}
            disabled={
              loading ||
              !question.trim() ||
              !quizId ||
              options.some((opt) => !opt.text.trim()) ||
              !options.some((opt) => opt.isCorrect)
            }
            className={`rounded-lg bg-yellow-500 text-gray-900 mt-3 md:mt-4 py-2 px-4 md:px-6 hover:bg-yellow-600 transition-colors text-sm md:text-base font-medium w-full sm:w-auto ${
              loading ||
              !question.trim() ||
              !quizId ||
              options.some((opt) => !opt.text.trim()) ||
              !options.some((opt) => opt.isCorrect)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {loading ? "Creating..." : "Create Question"}
          </button>

          {/* Added Questions List */}
          {questions.length > 0 && (
            <div className="mt-4 md:mt-6">
              <h3 className="font-semibold mb-3 dark:text-gray-200 text-gray-800 text-lg md:text-xl">
                Added Questions:
              </h3>
              <div className="space-y-3">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 dark:bg-gray-800 p-3 md:p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg mb-2">
                        {q.question}
                      </h3>
                      <ul className="space-y-1">
                        {q.options.map((option, optIndex) => (
                          <li
                            key={optIndex}
                            className={`text-sm md:text-base ${
                              option.isCorrect
                                ? "text-green-600 dark:text-green-400 font-bold"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {option.text} {option.isCorrect && "(Correct)"}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() =>
                        setQuestions(questions.filter((_, i) => i !== index))
                      }
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm md:text-base px-3 py-1 border border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors self-start sm:self-center"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCreation;
