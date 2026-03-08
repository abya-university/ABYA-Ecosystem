import { AlertCircle, CheckCircle, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { useContext, useMemo } from "react";
import { LessonContext } from "../../contexts/lessonContext";
import { CourseContext } from "../../contexts/courseContext";
import { ChapterContext } from "../../contexts/chapterContext";
import { QuizContext } from "../../contexts/quizContext";

const ResourcesCreation = () => {
  const [resourceName, setResourceName] = useState("");
  const [resourceLink, setResourceLink] = useState("");
  const [contentType, setContentType] = useState("");
  const [file, setFile] = useState(null);
  const [resources, setResources] = useState([]);
  const { lessons } = useContext(LessonContext);
  const { courses } = useContext(CourseContext);
  const { chapters } = useContext(ChapterContext);
  const { addLessonResource } = useContext(QuizContext);
  const [lessonId, setLessonId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const account = useActiveAccount();
  const address = account?.address || "";
  const isConnected = !!address;

  // Filter lessons to only show those from courses created by the current user
  const userLessons = useMemo(() => {
    if (!address || !courses?.length || !chapters?.length || !lessons?.length) {
      return [];
    }

    // Helper function to normalize IDs
    const normalizeId = (id) => {
      if (typeof id === "bigint") return id.toString();
      if (typeof id === "number") return id.toString();
      return String(id);
    };

    // Get course IDs created by current user
    const userCourses = courses.filter(
      (course) => course.creator?.toLowerCase() === address.toLowerCase(),
    );

    const userCourseIds = userCourses.map((course) =>
      normalizeId(course.courseId),
    );

    // Get chapter IDs from those courses
    const userChapters = chapters.filter((chapter) =>
      userCourseIds.includes(normalizeId(chapter.courseId)),
    );

    const userChapterIds = userChapters.map((chapter) =>
      normalizeId(chapter.chapterId),
    );

    // Filter lessons from those chapters
    const filteredLessons = lessons.filter((lesson) =>
      userChapterIds.includes(normalizeId(lesson.chapterId)),
    );

    return filteredLessons;
  }, [address, courses, chapters, lessons]);

  const addResource = async () => {
    try {
      if (!lessonId || !contentType || !resourceName) {
        toast.warning(
          "Please fill in all required fields: lesson, content type, and resource name",
        );
        return;
      }

      if (!isConnected || !address) {
        toast.error("Please connect your wallet");
        return;
      }

      if (contentType !== "Video" && !file) {
        toast.warning("Please upload a file");
        return;
      }

      if (contentType === "Video" && !resourceLink) {
        toast.warning("Please provide a video URL");
        return;
      }

      setIsUploading(true);
      const toastId = toast.loading("Adding resource...");

      toast.update(toastId, {
        render: "Processing transaction...",
        isLoading: true,
      });

      const { finalLink } = await addLessonResource({
        lessonId,
        contentType,
        resourceName,
        resourceLink,
        file,
      });

      // Update local state
      setResources([
        ...resources,
        {
          name: resourceName,
          link: finalLink,
          contentType,
        },
      ]);

      toast.update(toastId, {
        render: "Resource added successfully!",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      // Reset form
      setResourceName("");
      setResourceLink("");
      setFile(null);
      setContentType("");
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error("Error adding resource. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-yellow-500">
        Add Resources
      </h2>

      {/* Status Messages */}
      {(success || error) && (
        <div
          className={`mb-4 p-3 md:p-4 rounded-lg flex items-center ${
            success
              ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
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

      <div className="grid gap-3 md:gap-4">
        {/* Lesson Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Lesson (from your courses)
          </label>
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
          >
            <option value="" className="text-gray-500 dark:text-gray-400">
              {userLessons.length === 0
                ? "No lessons found - create a course first"
                : "Choose a lesson"}
            </option>
            {userLessons.map((lesson) => (
              <option
                key={lesson.lessonId}
                value={lesson.lessonId}
                className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              >
                {lesson.lessonName}
              </option>
            ))}
          </select>
          {userLessons.length === 0 && address && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              No lessons found from your courses. Make sure you've created
              courses, chapters, and lessons first.
            </p>
          )}
        </div>

        {/* Content Type Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
          >
            <option value="" className="text-gray-500 dark:text-gray-400">
              Select content type
            </option>
            <option
              value="Video"
              className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            >
              Video
            </option>
            <option
              value="Image"
              className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            >
              Image
            </option>
            <option
              value="Document"
              className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            >
              Document
            </option>
          </select>
        </div>

        {/* Resource Name */}
        <input
          type="text"
          placeholder="Resource Name"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base"
          value={resourceName}
          onChange={(e) => setResourceName(e.target.value)}
        />

        {/* Dynamic Input Based on Content Type */}
        {contentType === "Video" ? (
          <input
            type="text"
            placeholder="YouTube Video URL"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base"
            value={resourceLink}
            onChange={(e) => setResourceLink(e.target.value)}
          />
        ) : contentType ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload {contentType}
            </label>
            <input
              type="file"
              accept={
                contentType === "Image"
                  ? "image/*"
                  : "application/pdf,.doc,.docx"
              }
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 text-sm md:text-base"
            />
            {file && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>
        ) : null}

        {/* Add Resource Button */}
        <button
          onClick={addResource}
          disabled={
            isUploading ||
            !lessonId ||
            !contentType ||
            !resourceName ||
            (contentType !== "Video" && !file) ||
            (contentType === "Video" && !resourceLink)
          }
          className={`bg-yellow-500 text-gray-900 px-3 py-2 md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-600 transition-colors text-sm md:text-base font-medium w-full sm:w-[180px] ${
            isUploading ||
            !lessonId ||
            !contentType ||
            !resourceName ||
            (contentType !== "Video" && !file) ||
            (contentType === "Video" && !resourceLink)
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {isUploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <Plus size={18} className="md:w-5 md:h-5" />
              <span>Add Resource</span>
            </>
          )}
        </button>

        {/* Validation Hint */}
        {(!lessonId ||
          !contentType ||
          !resourceName ||
          (contentType !== "Video" && !file) ||
          (contentType === "Video" && !resourceLink)) && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
            {!lessonId && "• Please select a lesson"}
            {!contentType && "• Please select a content type"}
            {!resourceName && "• Resource name is required"}
            {contentType !== "Video" && !file && "• Please upload a file"}
            {contentType === "Video" &&
              !resourceLink &&
              "• Video URL is required"}
          </div>
        )}
      </div>

      {/* Display Added Resources */}
      {resources.length > 0 && (
        <div className="mt-4 md:mt-6">
          <h3 className="font-semibold mb-3 dark:text-gray-200 text-gray-800 text-lg md:text-xl">
            Added Resources:
          </h3>
          <div className="space-y-3">
            {resources.map((resource, index) => (
              <div
                key={index}
                className="bg-gray-100 dark:bg-gray-800 p-3 md:p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg mb-1">
                    {resource.name}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span>Type: {resource.contentType}</span>
                    <a
                      href={resource.link}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {resource.contentType === "Video"
                        ? "Watch Video"
                        : "View Resource"}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setResources(resources.filter((_, i) => i !== index))
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
  );
};

export default ResourcesCreation;
