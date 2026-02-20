import Ecosystem1FacetABI from "../../artifacts/contracts/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import Ecosystem2FacetABI from "../../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import CONTRACT_ADDRESSES from "../../constants/addresses";
import { useState } from "react";
import { defineChain } from "thirdweb/chains";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../../services/client";
import { useContext, useEffect } from "react";
import { ChapterContext } from "../../contexts/chapterContext";
import { CourseContext } from "../../contexts/courseContext";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem1Facet_ABI = Ecosystem1FacetABI.abi;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const LessonCreation = () => {
  const [lessonName, setLessonName] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessons, setLessons] = useState([]);
  const [chapterId, setChapterId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [filteredChapters, setFilteredChapters] = useState([]);
  const { chapters } = useContext(ChapterContext);
  const { courses } = useContext(CourseContext);
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const createLesson = async () => {
    if (!lessonName.trim()) {
      toast.warning("Please enter a lesson name");
      return;
    }

    if (!lessonContent.trim()) {
      toast.warning("Please enter lesson content");
      return;
    }

    if (!chapterId) {
      toast.warning("Please select a chapter");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!client) {
      toast.error("Client is required to access the contract");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating lesson...");
    try {
      const diamondContract = await getContract({
        address: DiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      toast.update(toastId, {
        render: "Processing transaction...",
        isLoading: true,
      });

      const tx = await prepareContractCall({
        contract: diamondContract,
        method: "addLesson",
        params: [chapterId.toString(), lessonName, lessonContent],
      });

      toast.update(toastId, {
        render: "Waiting for transaction confirmation...",
        isLoading: true,
      });

      await sendTransaction({ transaction: tx, account });

      toast.update(toastId, {
        render: `${lessonName} lesson created successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      setLessonName("");
      setLessonContent("");
    } catch (err) {
      toast.update(toastId, {
        render: `Failed to create lesson: ${err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      const filtered = chapters.filter(
        (chapter) => Number(chapter.courseId) === Number(courseId),
      );
      setFilteredChapters(filtered);
    } else {
      setFilteredChapters([]);
    }
  }, [courseId, chapters]);

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-yellow-500">
        Create Lessons
      </h2>

      {/* Lesson Inputs */}
      <div className="grid gap-3 md:gap-4">
        <input
          type="text"
          placeholder="Lesson Name"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base"
          value={lessonName}
          onChange={(e) => setLessonName(e.target.value)}
        />
        <textarea
          placeholder="Lesson Content"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 h-24 md:h-32 text-sm md:text-base resize-vertical"
          value={lessonContent}
          onChange={(e) => setLessonContent(e.target.value)}
        />
      </div>

      {/* Course Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Course
        </label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
        >
          <option value="" className="text-gray-500 dark:text-gray-400">
            Choose a course
          </option>
          {courses.map(
            (course) =>
              course.creator === address && (
                <option
                  key={course.courseId}
                  value={course.courseId}
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                >
                  {course.courseName}
                </option>
              ),
          )}
        </select>
      </div>

      {/* Chapter Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Chapter
        </label>
        <select
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
          disabled={!courseId}
        >
          <option value="" className="text-gray-500 dark:text-gray-400">
            {courseId ? "Choose a chapter" : "Select a course first"}
          </option>
          {filteredChapters.map((chapter) => (
            <option
              key={chapter.chapterId}
              value={chapter.chapterId}
              className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            >
              {chapter.chapterName}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={createLesson}
        disabled={
          loading || !lessonName.trim() || !lessonContent.trim() || !chapterId
        }
        className={`rounded-lg bg-yellow-500 text-gray-900 mt-4 py-2 px-4 md:px-6 hover:bg-yellow-600 transition-colors text-sm md:text-base font-medium w-full sm:w-auto ${
          loading || !lessonName.trim() || !lessonContent.trim() || !chapterId
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        {loading ? "Creating..." : "Create Lesson"}
      </button>

      {/* Validation Hint */}
      {(!lessonName.trim() || !lessonContent.trim() || !chapterId) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
          {!lessonName.trim() && "• Lesson name is required"}
          {!lessonContent.trim() && "• Lesson content is required"}
          {!chapterId && "• Please select a chapter"}
        </div>
      )}
    </div>
  );
};

export default LessonCreation;
