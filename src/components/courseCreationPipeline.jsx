import React, { useState } from "react";
import {
  Book,
  FileText,
  Plus,
  ChevronRight,
  Image,
  CheckCircle,
} from "lucide-react";

const CourseCreationPipeline = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [courseData, setCourseData] = useState({
    basicInfo: {
      name: "",
      description: "",
      image: null,
    },
    chapters: [],
    lessons: [],
    quizzes: [],
    resources: [],
  });

  // Step Components
  const CourseBasicInfo = () => {
    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      setCourseData((prev) => ({
        ...prev,
        basicInfo: { ...prev.basicInfo, image: file },
      }));
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-yellow-500">
          Course Basic Information
        </h2>
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Course Name"
            className="w-full p-3 border rounded-lg"
            value={courseData.basicInfo.name}
            onChange={(e) =>
              setCourseData((prev) => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, name: e.target.value },
              }))
            }
          />
          <textarea
            placeholder="Course Description"
            className="w-full p-3 border rounded-lg h-32"
            value={courseData.basicInfo.description}
            onChange={(e) =>
              setCourseData((prev) => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, description: e.target.value },
              }))
            }
          />
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 bg-yellow-500 text-black px-4 py-2 rounded-lg cursor-pointer">
              <Image size={20} />
              <span>Upload Course Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            {courseData.basicInfo.image && (
              <span className="text-green-500">Image Selected</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ChapterCreation = () => {
    const [chapterName, setChapterName] = useState("");
    const [chapters, setChapters] = useState([]);
    const [courseId, setCourseId] = useState("");

    const addChapter = () => {
      if (chapterName.trim()) {
        setChapters([...chapters, chapterName.trim()]);
        setChapterName("");
      }
    };

    const courses = [
      { id: "course1", name: "Introduction to Programming" },
      { id: "course2", name: "Data Structures" },
      { id: "course3", name: "Algorithms" },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-yellow-500">
          Create Chapters/Modules
        </h2>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Chapter Name"
            className="flex-grow p-3 border rounded-lg"
            value={chapterName}
            onChange={(e) => setChapterName(e.target.value)}
          />
          <button
            onClick={addChapter}
            className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center"
          >
            <Plus size={20} />
            Add Chapter
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
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {chapters.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 dark:text-gray-300">
              Added Chapters:
            </h3>
            <div className="space-y-2">
              {chapters.map((chapter, index) => (
                <div
                  key={index}
                  className="bg-gray-100 p-2 rounded-lg flex justify-between items-center"
                >
                  {chapter}
                  <button
                    onClick={() =>
                      setChapters(chapters.filter((_, i) => i !== index))
                    }
                    className="text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addChapter}
              className="bg-yellow-500 mt-4 text-black px-4 py-2 rounded-lg flex items-center"
            >
              Create Chapters
            </button>
          </div>
        )}
      </div>
    );
  };

  //Lesson creation
  const LessonCreation = () => {
    const [lessonName, setLessonName] = useState("");
    const [lessonContent, setLessonContent] = useState("");
    const [lessons, setLessons] = useState([]);
    const [chapterId, setChapterId] = useState("");

    const addLesson = () => {
      if (lessonName.trim() && lessonContent.trim()) {
        setLessons([
          ...lessons,
          { name: lessonName.trim(), content: lessonContent.trim() },
        ]);

        setLessonName("");
        setLessonContent("");
      }
    };

    const chapters = [
      { id: "chapter1", name: "Introduction to Programming" },
      { id: "chapter2", name: "Data Structures" },
      { id: "chapter3", name: "Algorithms" },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-yellow-500">Create Lessons</h2>
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Lesson Name"
            className="w-full p-3 border rounded-lg"
            value={lessonName}
            onChange={(e) => setLessonName(e.target.value)}
          />
          <textarea
            placeholder="Lesson Content"
            className="w-full p-3 border rounded-lg h-32"
            value={lessonContent}
            onChange={(e) => setLessonContent(e.target.value)}
          />
        </div>

        {/* Chapter Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Chapter
          </label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Choose a chapter</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={addLesson}
          className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center"
        >
          Create Lesson
        </button>

        {/* {lessons.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Added Lessons:</h3>
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <div
                  key={index}
                  className="bg-gray-100 p-2 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">{lesson.name}</h3>
                    <p>{lesson.content}</p>
                  </div>
                  <button
                    onClick={() =>
                      setLessons(lessons.filter((_, i) => i !== index))
                    }
                    className="text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>
    );
  };

  const QuizCreation = ({ onNextStep }) => {
    const [quizName, setQuizName] = useState("");
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

    // Lessons could be fetched from an API or defined statically
    const lessons = [
      { id: "lesson1", name: "Introduction to Programming" },
      { id: "lesson2", name: "Data Structures" },
      { id: "lesson3", name: "Algorithms" },
    ];

    const quizzes = [
      { id: "quiz1", name: "Introduction to Programming" },
      { id: "quiz2", name: "Data Structures" },
      { id: "quiz3", name: "Algorithms" },
    ];

    const addQuestion = () => {
      // Validate that there's a question, all options are filled, and exactly one correct option
      const hasQuestion = question.trim();
      const hasFilledOptions = options.every((option) => option.text.trim());
      const hasOneCorrectOption =
        options.filter((option) => option.isCorrect).length === 1;

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

        // Reset inputs after adding
        setQuestion("");
        setOptions([
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ]);
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

    const handleNextStep = () => {
      // Validate before moving to next step
      if (!quizName.trim()) {
        alert("Please enter a quiz name");
        return;
      }
      if (!lessonId) {
        alert("Please select a lesson");
        return;
      }
      if (questions.length === 0) {
        alert("Please add at least one question");
        return;
      }

      // If validation passes, call onNextStep with quiz data
      onNextStep({
        quizName,
        lessonId,
        questions,
      });
    };

    return (
      <div className="space-y-6 p-4">
        <h2 className="text-2xl font-bold text-yellow-500">Create Quiz</h2>
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Quiz Title"
            className="w-full p-3 border rounded-lg"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
          />

          {/* Lesson Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Lesson
            </label>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Choose a lesson</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
          </div>

          <button
            // onClick={}
            className="bg-yellow-500 text-black px-4 py-2 w-[120px] rounded-lg flex items-center"
          >
            Create Quiz
          </button>

          {/* Quiz Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Quiz
            </label>
            <select
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Choose a Quiz</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Input */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Question"
              className="w-full p-3 border rounded-lg"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            {/* Options with Radio Buttons */}
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  className="flex-grow p-3 border rounded-lg"
                  value={option.text}
                  onChange={(e) => updateOption(index, "text", e.target.value)}
                />
                <div className="flex items-center">
                  <input
                    type="radio"
                    id={`correct-${index}`}
                    name="correctOption"
                    checked={option.isCorrect}
                    onChange={() => updateOption(index, "isCorrect", true)}
                    className="mr-2"
                  />
                  <label
                    className="dark:text-gray-300"
                    htmlFor={`correct-${index}`}
                  >
                    Correct
                  </label>
                </div>
              </div>
            ))}

            <button
              onClick={addQuestion}
              className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center"
            >
              Add Question
            </button>

            {/* Added Questions List */}
            {questions.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Added Questions:</h3>
                <div className="space-y-2">
                  {questions.map((q, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 p-2 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-semibold">{q.question}</h3>
                        <ul>
                          {q.options.map((option, optIndex) => (
                            <li
                              key={optIndex}
                              className={
                                option.isCorrect
                                  ? "text-green-600 font-bold"
                                  : ""
                              }
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
                        className="text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Step Button */}
            {questions.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={handleNextStep}
                  className="bg-yellow-500 text-black px-4 py-2 rounded-lg w-full"
                >
                  Next Step
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  //add resources
  const ResourcesCreation = () => {
    const [resourceName, setResourceName] = useState("");
    const [resourceLink, setResourceLink] = useState("");
    const [resources, setResources] = useState([]);

    const addResource = () => {
      if (resourceName.trim() && resourceLink.trim()) {
        setResources([
          ...resources,
          { name: resourceName.trim(), link: resourceLink.trim() },
        ]);
        setResourceName("");
        setResourceLink("");
      }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-yellow-500">Add Resources</h2>
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Resource Name"
            className="w-full p-3 border rounded-lg"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Resource Link"
            className="w-full p-3 border rounded-lg"
            value={resourceLink}
            onChange={(e) => setResourceLink(e.target.value)}
          />
          <button
            onClick={addResource}
            className="bg-yellow-500 text-black px-4 py-2 w-[160px] rounded-lg flex items-center"
          >
            <Plus size={20} />
            Add Resource
          </button>
        </div>
        {resources.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Added Resources:</h3>
            <div className="space-y-2">
              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="bg-gray-100 p-2 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">{resource.name}</h3>
                    <a href={resource.link} target="_blank" rel="noreferrer">
                      {resource.link}
                    </a>
                  </div>
                  <button
                    onClick={() =>
                      setResources(resources.filter((_, i) => i !== index))
                    }
                    className="text-red-500"
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

  const ProgressBar = () => {
    const steps = ["Basic Info", "Chapters", "Lessons", "Quizzes", "Resources"];

    return (
      <div className="md:flex md:flex-wrap md:gap-2 lg:flex justify-between items-center mb-8 hidden">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center ${
              currentStep > index
                ? "text-green-500"
                : currentStep === index + 1
                ? "text-yellow-500"
                : "text-gray-300"
            }`}
          >
            {index > 0 && (
              <div
                className={`w-16 h-1 mr-4 ${
                  currentStep > index ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
            <div className="flex items-center space-x-2">
              {currentStep > index ? (
                <CheckCircle size={24} />
              ) : (
                <Book size={24} />
              )}
              <span>{step}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="w-[90%] md:w-[60%] lg:w-[50%] mx-auto p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg mt-[100px]">
      <ProgressBar />

      <div className="mb-8">
        {currentStep === 1 && <CourseBasicInfo />}
        {currentStep === 2 && <ChapterCreation />}
        {currentStep === 3 && <LessonCreation />}
        {currentStep === 4 && <QuizCreation />}
        {currentStep === 5 && <ResourcesCreation />}
      </div>

      <div className="flex justify-between">
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="bg-gray-200 text-black px-6 py-2 rounded-lg"
          >
            Previous
          </button>
        )}
        {currentStep < 5 ? (
          <button
            onClick={nextStep}
            className="bg-yellow-500 text-black px-6 py-2 rounded-lg flex items-center"
          >
            Next Step
            <ChevronRight size={20} className="ml-2" />
          </button>
        ) : (
          <button className="bg-green-500 text-white px-6 py-2 rounded-lg">
            Preview Course
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCreationPipeline;
