import React, { useEffect, useState, useContext } from "react";
import {
  Book,
  FileText,
  Plus,
  ChevronRight,
  Image,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Ecosystem2ABI from "../artifacts/contracts/Ecosystem Contracts/Ecosystem2.sol/Ecosystem2.json";
import { useEthersSigner } from "../components/useClientSigner";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { CourseContext } from "../contexts/courseContext";
import { ChapterContext } from "../contexts/chapterContext";
import { LessonContext } from "../contexts/lessonContext";

const Ecosystem2ContractAddress = import.meta.env
  .VITE_APP_ECOSYSTEM2_CONTRACT_ADDRESS;
const Ecosystem2_ABI = Ecosystem2ABI.abi;

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
  const signerPromise = useEthersSigner();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const { isConnected, address } = useAccount();
  const [loading, setLoading] = useState(false);
  const { courses } = useContext(CourseContext);
  const { chapters, fetchChapters, setChapters } = useContext(ChapterContext);
  const [imagePreview, setImagePreview] = useState(null);

  console.log("Courses Data:", courses);

  const createCourse = async () => {
    if (isConnected && address) {
      console.log("Wallet Connection Details:", {
        isConnected,
        address,
        addressType: typeof address,
        addressLength: address?.length,
      });

      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const signer = await signerPromise;
        if (!signer) {
          throw new Error("Signer is required to access the contract.");
        }

        // Validate and clean the address
        const validatedAddress = ethers.getAddress(address);
        console.log("Validated Contract Address:", validatedAddress);

        const contract = new ethers.Contract(
          Ecosystem2ContractAddress,
          Ecosystem2_ABI,
          signer
        );

        // Safe logging with optional chaining
        console.log("Contract Details:", {
          address: Ecosystem2ContractAddress,
          methods: contract.interface
            ? Object.keys(contract.interface.functions || {})
            : "No interface",
        });

        // Check if the contract method is callable
        if (typeof contract.createCourse !== "function") {
          throw new Error(
            "createCourse method is not available on the contract."
          );
        }

        // Detailed logging before transaction
        console.log("Transaction Params:", {
          name: courseData.basicInfo.name,
          description: courseData.basicInfo.description,
        });

        // Validate input before transaction
        if (!courseData.basicInfo.name || !courseData.basicInfo.description) {
          throw new Error("Course name and description are required");
        }

        const tx = await contract.createCourse(
          courseData.basicInfo.name,
          courseData.basicInfo.description
        );

        console.log("Transaction Sent:", {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
        });

        const receipt = await tx.wait();

        console.log("Transaction Receipt:", {
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          transactionHash: receipt.transactionHash,
        });

        if (receipt.status === 1) {
          setSuccess(`${courseData.basicInfo.name} created successfully!`);
        } else {
          setError("Transaction failed. Please try again.");
        }
      } catch (err) {
        // Comprehensive error logging with fallback values
        console.error("Full Error Details:", {
          name: err.name || "Unknown Error",
          code: err.code || "No Error Code",
          message: err.message || "No Error Message",
          stack: err.stack || "No Stack Trace",
        });

        // More specific error handling
        if (err.code === "INVALID_ARGUMENT") {
          setError("Invalid transaction parameters. Please check your input.");
        } else if (err.code === "UNSUPPORTED_OPERATION") {
          setError(
            "Unsupported network operation. Check your network settings."
          );
        } else {
          setError(
            `Failed to create course: ${err.message || "Unknown error"}`
          );
        }
      } finally {
        setLoading(false);
      }
    } else {
      setError("Wallet is not connected or address is missing.");
    }
  };

  // Step Components
  const CourseBasicInfo = () => {
    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        setCourseData((prev) => ({
          ...prev,
          basicInfo: { ...prev.basicInfo, image: file },
        }));

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-yellow-500 mb-6">
          Course Basic Information
        </h2>

        {(success || error) && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center ${
              success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-700"
            }`}
          >
            {success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{success || error}</span>
          </div>
        )}

        <div className="flex gap-6">
          {/* Left side - Form inputs */}
          <div className="flex-1 space-y-4">
            <input
              type="text"
              placeholder="Course Name"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
              className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={courseData.basicInfo.description}
              onChange={(e) =>
                setCourseData((prev) => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, description: e.target.value },
                }))
              }
            />

            <div className="flex items-center gap-4">
              <label className="inline-flex items-center space-x-2 bg-yellow-500 text-black px-4 py-2 rounded-lg cursor-pointer hover:bg-yellow-600 transition-colors">
                <Image size={20} />
                <span>Upload Course Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>

              <button
                onClick={createCourse}
                className="rounded-lg bg-yellow-500 p-2 px-6 hover:bg-yellow-600 transition-colors"
              >
                Create Course
              </button>
            </div>
          </div>

          {/* Right side - Image preview */}
          <div className="w-64 flex-shrink-0">
            <div className="p-4">
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Course preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <Image className="mx-auto mb-2 h-8 w-8" />
                    <p className="text-sm">Course Image</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ChapterCreation = () => {
    const [chapterName, setChapterName] = useState("");
    const [chapters, setChapters] = useState([]);
    const [courseId, setCourseId] = useState("");

    const createChapter = async () => {
      if (isConnected) {
        try {
          const signer = await signerPromise;
          if (!signer) {
            throw new Error("Signer is required to access the contract.");
          }

          // Ensure courseId is a number
          const parsedCourseId = Number(courseId);

          if (chapters.length === 0) {
            throw new Error("Chapters array cannot be empty");
          }

          const contract = new ethers.Contract(
            Ecosystem2ContractAddress,
            Ecosystem2_ABI,
            signer
          );

          // Verify course exists before adding chapters
          try {
            // Log the raw course object to understand its structure
            const rawCourseObject = await contract.courseObject(parsedCourseId);
            console.log("Raw Course Object:", rawCourseObject);

            // Destructure the course object carefully
            const [
              contractCourseId,
              courseName,
              description,
              approved,
              approvalCount,
              creator,
            ] = rawCourseObject;

            console.log("Extracted Course Details:", {
              courseId: contractCourseId.toString(),
              courseName,
              description,
              approved,
              approvalCount: approvalCount.toString(),
              creator,
            });

            // Optional: Additional validation
            if (contractCourseId.toString() !== parsedCourseId.toString()) {
              throw new Error("Course ID mismatch!");
            }
          } catch (courseCheckError) {
            console.error("Course Verification Error:", courseCheckError);
            setError(`Course verification failed: ${courseCheckError.message}`);
            return;
          }

          const tx = await contract.addChapters(parsedCourseId, chapters);
          const receipt = await tx.wait();
          console.log(receipt);
          setChapters([]);
          setCourseId("");
          setSuccess("Chapters created successfully!");
        } catch (err) {
          console.error("Full Error:", err);
          setError(`Failed to create chapters: ${err.message}`);
        }
      }
    };

    console.log("Course Id: ", courseId);
    console.log("Chapters: ", chapters);

    const addChapter = () => {
      if (chapterName.trim()) {
        setChapters([...chapters, chapterName.trim()]);
        setChapterName("");
      }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-yellow-500">
          Create Chapters/Modules
        </h2>
        {(success || error) && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center ${
              success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-700"
            }`}
          >
            {success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{success || error}</span>
          </div>
        )}
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
              <option key={course.courseId} value={course.courseId}>
                {course.courseName}
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
              onClick={createChapter}
              className="bg-yellow-500 mt-4 text-black px-4 py-2 rounded-lg flex items-center"
            >
              Create Chapters
            </button>
          </div>
        )}
      </div>
    );
  };

  const LessonCreation = () => {
    const [lessonName, setLessonName] = useState("");
    const [lessonContent, setLessonContent] = useState("");
    const [lessons, setLessons] = useState([]);
    const [chapterId, setChapterId] = useState("");
    const [courseId, setCourseId] = useState("");
    const { fetchChapters, chapters, setChapters } = useContext(ChapterContext);
    const { isConnected } = useAccount();
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const createLesson = async () => {
      if (!isConnected) {
        setError("Wallet is not connected");
        return;
      } else {
        try {
          const signer = await signerPromise;
          if (!signer) {
            throw new Error("Signer is required to access the contract.");
          }

          const contract = new ethers.Contract(
            Ecosystem2ContractAddress,
            Ecosystem2_ABI,
            signer
          );
          console.log("Chapter ID: ", chapterId);
          console.log("Lesson Name: ", lessonName);
          console.log("Lesson Content: ", lessonContent);

          const tx = await contract.addLesson(
            chapterId.toString(),
            lessonName,
            lessonContent
          );
          const receipt = await tx.wait();
          console.log(receipt);
          setSuccess("Lessons created successfully!");
        } catch (err) {
          console.error("Full Error:", err);
          setError(`Failed to create lessons: ${err.message}`);
        }
      }
    };

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

    useEffect(() => {
      if (courseId) {
        console.log("Fetching chapters for courseId:", courseId);
        fetchChapters(courseId).then((fetchedChapters) => {
          if (fetchedChapters) {
            const formattedChapters = fetchedChapters.map((chapter) => ({
              chapterId: Number(chapter.chapterId),
              chapterName: chapter.chapterName,
            }));
            setChapters(formattedChapters);
            console.log("Chapters: ", formattedChapters);
          } else {
            setChapters([]);
          }
        });
      }
    }, [courseId, fetchChapters]);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-yellow-500">Create Lessons</h2>
        {(success || error) && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center ${
              success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-700"
            }`}
          >
            {success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{success || error}</span>
          </div>
        )}
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
              <option key={course.courseId} value={course.courseId}>
                {course.courseName}
              </option>
            ))}
          </select>
          <p>{courseId}</p>
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
            {chapters?.map((chapter) => (
              <option key={chapter.chapterId} value={chapter.chapterId}>
                {chapter.chapterName}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={createLesson}
          className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center"
        >
          Create Lesson
        </button>
      </div>
    );
  };

  const QuizCreation = ({ onNextStep }) => {
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
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    console.log("Lessons: ", lessons);

    const quizzes = [
      { id: "quiz1", name: "Introduction to Programming" },
      { id: "quiz2", name: "Data Structures" },
      { id: "quiz3", name: "Algorithms" },
    ];

    const createQuiz = async () => {
      if (!isConnected || !address) {
        throw new Error("Please connect to a blockchain network");
      }

      try {
        // const lesson = lessons.find((lesson) => lesson.lessonId === lessonId);
        const signer = await signerPromise;

        const contract = new ethers.Contract(
          Ecosystem2ContractAddress,
          Ecosystem2_ABI,
          signer
        );

        console.log("Lesson Id: ", lessonId);
        console.log("Quiz Title: ", quizTitle);

        const tx = await contract.createQuiz(lessonId, quizTitle);
        const receipt = await tx.wait();
        console.log("Quiz created: ", receipt);
        setLessonId("");
        setQuizTitle("");
        setSuccess("Quiz created successfully!!");
      } catch (error) {
        console.error("Error creating quiz: ", error);
        setError("Error creating quiz");
      }
    };

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
        {(success || error) && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center ${
              success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-700"
            }`}
          >
            {success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{success || error}</span>
          </div>
        )}
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Quiz Title"
            className="w-full p-3 border rounded-lg"
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
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Choose a lesson</option>
              {lessons.map((lesson) => (
                <option key={lesson.lessonId} value={lesson.lessonId}>
                  {lesson.lessonName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={createQuiz}
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
