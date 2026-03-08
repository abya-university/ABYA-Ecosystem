import { AlertCircle, CheckCircle, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { useContext } from "react";
import { CourseContext } from "../../contexts/courseContext";
import { ChapterContext } from "../../contexts/chapterContext";

const ChapterCreation = () => {
  const [chapterName, setChapterName] = useState("");
  const [duration, setDuration] = useState("");
  const [chapters, setChapters] = useState([]);
  const [durations, setDurations] = useState([]);
  const [courseId, setCourseId] = useState("");
  const account = useActiveAccount();
  const address = account?.address || "";
  const isConnected = !!address;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const { courses } = useContext(CourseContext);
  const { createChapters } = useContext(ChapterContext);

  console.log("Coursess: ", courses);

  const createChapter = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!courseId) {
      toast.warning("Please select a course");
      return;
    }

    if (chapters.length === 0) {
      toast.warning("Please add at least one chapter");
      return;
    }

    if (chapters.length !== durations.length) {
      toast.warning("Number of chapters and durations must match");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating chapters...");
    try {
      toast.update(toastId, {
        render: "Processing transaction...",
        isLoading: true,
      });

      await createChapters(courseId, chapters, durations);

      toast.update(toastId, {
        render: "Chapters created successfully!",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      setChapters([]);
      setDurations([]);
      setCourseId("");
    } catch (err) {
      toast.update(toastId, {
        render: `Failed to create chapters: ${err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addChapter = () => {
    if (!chapterName.trim()) {
      toast.warning("Please enter a chapter name");
      return;
    }

    if (!duration) {
      toast.warning("Please enter a duration");
      return;
    }

    if (Number(duration) <= 0) {
      toast.warning("Duration must be greater than 0");
      return;
    }

    setChapters([...chapters, chapterName.trim()]);
    setDurations([...durations, Number(duration)]);
    setChapterName("");
    setDuration("");
    toast.success(`Chapter "${chapterName.trim()}" added!`);
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-yellow-500">
        Create Chapters/Modules
      </h2>

      {(success || error) && (
        <div
          className={`mb-4 p-3 md:p-4 rounded-lg flex items-center ${
            success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-700"
          }`}
        >
          {success ? (
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          ) : (
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          )}
          <span className="text-sm md:text-base">{success || error}</span>
        </div>
      )}

      {/* Chapter Input Form */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <input
          type="text"
          placeholder="Chapter Name"
          className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base dark:bg-gray-800 dark:text-white text-gray-900 bg-white border-gray-300 dark:border-gray-600"
          value={chapterName}
          onChange={(e) => setChapterName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Duration in Weeks"
          className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base dark:bg-gray-800 dark:text-white text-gray-900 bg-white border-gray-300 dark:border-gray-600"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <button
          onClick={addChapter}
          className="bg-yellow-500 text-black px-3 py-2 md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-600 transition-colors text-sm md:text-base w-full sm:w-auto"
        >
          <Plus size={18} className="md:w-5 md:h-5" />
          <span>Add Chapter</span>
        </button>
      </div>

      {/* Course Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Course
        </label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm md:text-base dark:bg-gray-800 dark:text-white text-gray-900 bg-white border-gray-300 dark:border-gray-600"
        >
          <option value="">Choose a course</option>
          {courses.map(
            (course) =>
              course.creator === address && (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseName}
                </option>
              ),
          )}
        </select>
      </div>

      {/* Added Chapters List */}
      {chapters.length > 0 && (
        <div className="mt-4 md:mt-6">
          <h3 className="font-semibold mb-3 dark:text-gray-300 text-lg md:text-xl">
            Added Chapters:
          </h3>
          <div className="space-y-3">
            {chapters.map((chapter, index) => (
              <div
                key={index}
                className="bg-gray-100 dark:bg-gray-800 p-3 md:p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 md:gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {chapter}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Duration: {durations[index]} weeks
                  </p>
                </div>
                <button
                  onClick={() => {
                    setChapters(chapters.filter((_, i) => i !== index));
                    setDurations(durations.filter((_, i) => i !== index));
                  }}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm md:text-base px-3 py-1 border border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors self-start sm:self-center"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Create Chapters Button */}
          <button
            onClick={createChapter}
            disabled={loading}
            className={`rounded-lg bg-yellow-500 mt-4 md:mt-6 py-2 px-4 md:px-6 hover:bg-yellow-600 transition-colors text-sm md:text-base w-full sm:w-auto ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating..." : "Create Chapters"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChapterCreation;
