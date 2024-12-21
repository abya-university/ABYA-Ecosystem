import React, { useContext, useState, useEffect } from "react";
import { CourseContext } from "../contexts/courseContext";
import { ChapterContext } from "../contexts/chapterContext";
import { LessonContext } from "../contexts/lessonContext";
import { QuizContext } from "../contexts/quizContext";
import {
  BookOpen,
  FileText,
  Youtube,
  Image as ImageIcon,
  File,
  ChevronRight,
  Layout,
  BookOpenCheck,
  Timer,
  Users,
} from "lucide-react";

const PreviewCourse = () => {
  const { courses } = useContext(CourseContext);
  const { chapters, setChapters, fetchChapters } = useContext(ChapterContext);
  const { lessons } = useContext(LessonContext);
  const { quizzes } = useContext(QuizContext);
  const [courseId, setCourseId] = useState("");

  const renderResourceIcon = (contentType) => {
    switch (contentType) {
      case 0:
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 1:
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 2:
        return <FileText className="w-5 h-5 text-green-500" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const renderVideo = (url) => {
    return (
      <div className="relative w-full pt-[56.25%] mt-2 rounded-xl overflow-hidden">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${url}`}
          allowFullScreen
        />
      </div>
    );
  };

  const renderResource = (resource) => {
    switch (resource.contentType) {
      case 0: // Video
        return renderVideo(resource.url);
      case 1: // Image
        return (
          <div className="mt-2 rounded-xl overflow-hidden">
            <img
              src={`https://gateway.pinata.cloud/ipfs/${resource.url}`}
              alt={resource.name}
              className="w-full h-auto"
            />
          </div>
        );
      case 2: // Document
        return (
          <a
            href={`https://gateway.pinata.cloud/ipfs/${resource.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 mt-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 border border-gray-700/20 dark:border-gray-700"
          >
            {renderResourceIcon(resource.contentType)}
            <span className="text-gray-700 dark:text-gray-300">
              {resource.name}
            </span>
          </a>
        );
      default:
        return (
          <a
            href={`https://gateway.pinata.cloud/ipfs/${resource.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 mt-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 border border-gray-700/20 dark:border-gray-700"
          >
            {renderResourceIcon(resource.contentType)}
            <span className="text-gray-700 dark:text-gray-300">
              {resource.name}
            </span>
          </a>
        );
    }
  };

  const handleCourseSelect = (id) => {
    setCourseId(id);
  };

  useEffect(() => {
    if (courseId) {
      fetchChapters(courseId);
    }
  }, [courseId, fetchChapters]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Course Header */}
      <div className="max-w-7xl mx-auto mb-12">
        {courses?.map((course) => (
          <div
            key={course.courseId}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-8 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {course?.courseName}
              </h1>
              <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  <span>{chapters?.length} Chapters</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{lessons?.length} Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  <span>~{chapters?.length * 2} Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{course?.enrolledStudents || 0} Students</span>
                </div>
              </div>
              <button
                onClick={() => handleCourseSelect(course.courseId)}
                className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded-lg"
              >
                Select Course
              </button>
            </div>

            {/* Course Description */}
            <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
              <p className="text-gray-700 dark:text-gray-300">
                {course?.courseDescription}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {chapters?.map((chapter, chapterIndex) => (
            <div
              key={chapter.chapterId}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              {/* Chapter Header */}
              <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Chapter {chapterIndex + 1}: {chapter.chapterName}
                </h2>
              </div>

              {/* Chapter Quiz */}
              {quizzes?.find(
                (quiz) => quiz.chapterId === chapter.chapterId
              ) && (
                <div className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpenCheck className="w-5 h-5 text-green-500" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Chapter Quiz
                      </h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Lessons */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {lessons.map((lesson) => (
          <div key={lesson.lessonId} className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <BookOpenCheck className="w-6 h-6 text-blue-500" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                {lesson.lessonName}
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {lesson.lessonContent}
            </p>

            {/* Resources */}
            {lesson.additionalResources?.some((r) => r.url) && (
              <div className="mt-4 space-y-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Additional Resources
                </h4>
                <div className="grid gap-4">
                  {lesson.additionalResources
                    .filter((r) => r.url)
                    .map((resource, index) => (
                      <div key={index}>{renderResource(resource)}</div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewCourse;
