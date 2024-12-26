//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { Ecosystem } from "./Ecosystem.sol";

contract Ecosystem2 is Ecosystem {

    event QuizCreatedSuccess(uint256 indexed _quizId, string indexed _title);
    event QuestionAdded(uint256 quizId, uint256 questionId, string questionText);
    event ChoiceAdded(uint256 questionId, uint256 choiceId, string option);
    event ChaptersAddedSuccessfully(uint256 indexed _courseId, uint256 indexed numberOfChapters);
    event LessonCreationSuccess(uint256 indexed _lessonId, string indexed _lessonName, uint256 indexed _additonalResources);
    event ResourceAddSuccess(uint256 indexed _lessonId, uint256 indexed resourceCount);
    event EnrollmentSuccess(uint256 indexed _courseId, address indexed _by);
    event unEnrollmentSuccess(uint256 indexed _courseId, address indexed _by); 

    constructor(address[] memory _reviewers) Ecosystem(_reviewers) {}

    //function to enroll into a course
    function enroll(uint256 _courseId) external nonReentrant returns(bool) {
        require(courseObject[_courseId].approved, "Course not yet approved!");
        require(!isEnrolled[_courseId][msg.sender], "You are already enrolled into this course");
        require(courseObject[_courseId].exists, "Course does not exist!");
        
        isEnrolled[_courseId][msg.sender] = true;
        courseObject[_courseId].enrolledStudents.push(msg.sender);

        mintToken(msg.sender, ENROLLMENT_REWARD);

        emit EnrollmentSuccess(_courseId, msg.sender);

        return true;
    }

    //function to unEnroll from a course
    function unEnroll(uint256 _courseId) external nonReentrant returns(bool) {
        require(isEnrolled[_courseId][msg.sender], "You are not enrolled in this course!");

        isEnrolled[_courseId][msg.sender] = false;
        address[] storage students = courseObject[_courseId].enrolledStudents;
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i] == msg.sender) {
                students[i] = students[students.length - 1];
                students.pop();
                break;
            }
        }

        burn(msg.sender, ENROLLMENT_REWARD);

        emit unEnrollmentSuccess(_courseId, msg.sender);

        return true;
    }


    // Function to add a chapter
    function addChapters(uint256 _courseId, string[] memory _chapters) external returns (bool) {
        require(courseObject[_courseId].creator != address(0), "Course does not exist!");

        // Clear the existing chapters for the course
        // delete courseChapters[_courseId];

        for (uint i = 0; i < _chapters.length; i++) {      
            Chapter memory newChapter = Chapter(_courseId, nextChapterId, _chapters[i], true);
            listOfChapters.push(newChapter);

            // uint256 _chapterId = nextChapterId;
            chapter[nextChapterId] = newChapter;

            // Add the chapter ID to the courseChapters mapping
            courseChapters[_courseId].push(newChapter);

            nextChapterId++;
        }

        emit ChaptersAddedSuccessfully(_courseId, _chapters.length);

        return true;
    }

    //function to get all course chapters
    function getChapters(uint256 _courseId) external view returns (Chapter[] memory) {
        return courseChapters[_courseId];
    }

    //function to get all the chapters
    function getAllChapters() external view returns (Chapter[] memory) {
        uint256 chapterCount = listOfChapters.length;
        Chapter[] memory allChapters = new Chapter[](chapterCount);
    
        for (uint i = 0; i < chapterCount; i++) {
            allChapters[i] = listOfChapters[i];
        }
    
        return allChapters;
    }

    //function to add a lesson
    function addLesson(uint256 _chapterId, string memory _lessonName, string memory _lessonContent) external {
        uint256 lessonId = nextLessonId;
        require(chapter[_chapterId].exists, "Chapter does not exist!");

        // Initialize a new Lesson directly in storage
        Lesson storage newLesson = lesson[lessonId];
        newLesson.chapterId = _chapterId;
        newLesson.lessonId = lessonId;
        newLesson.lessonName = _lessonName;
        newLesson.lessonContent = _lessonContent;
        newLesson.exists = true;
        newLesson.resourceCount = 0;

        // Push a copy to the array
        listOfLessons.push(lesson[lessonId]);
        
        nextLessonId++;

        emit LessonCreationSuccess(lessonId, _lessonName, 10); // 10 is the fixed size of additionalResources
    }

    //function to get all chapter lessons
    function getAllLessons() external view returns (Lesson[] memory) {
        uint256 lessonCount = listOfLessons.length;
        Lesson[] memory allLessons = new Lesson[](lessonCount);
    
        for (uint i = 0; i < lessonCount; i++) {
            allLessons[i] = listOfLessons[i];
        }
    
        return allLessons;
    }

    //function to add a quiz
    function createQuiz(uint256 _lessonId, string memory _title) external returns(uint256) {
        uint256 _quizId = nextQuizId;
        require(lesson[_lessonId].exists, "Lesson Does not exist!");
        Quiz storage newQuiz = quizzes[_quizId];
        newQuiz.lessonId = _lessonId;
        newQuiz.quizId = _quizId;
        newQuiz.quizTitle = _title;
        newQuiz.exists = true;

        nextQuizId++;
        listOfQuizzes.push(newQuiz);

        emit QuizCreatedSuccess(_quizId, _title);

        return _quizId;
    }

    // Function to add questions with choices
    function createQuestionWithChoices(
        uint256 _quizId, 
        string memory _questionText, 
        string[] memory _options, 
        uint8 _correctChoiceIndex
    ) external {
        // Validate quiz exists
        require(quizzes[_quizId].exists, "Quiz does not exist");
        require(_options.length > 0 && _options.length <= 4, "Invalid number of choices");
        require(_correctChoiceIndex < _options.length, "Invalid correct choice index");

        // Create question
        uint256 _questionId = nextQuestionId;
    
        // Create new Question struct in storage
        Question storage newQuestion = questions[_questionId];
        newQuestion.quizId = _quizId;
        newQuestion.questionId = _questionId;
        newQuestion.questionText = _questionText;

        // Add choices to the question
        for (uint8 i = 0; i < _options.length; i++) {
            Choice memory newChoice = Choice({
                option: _options[i],
                isCorrect: (i == _correctChoiceIndex)
            });
            newQuestion.choices.push(newChoice);
        }

        // Add question to the quiz's questions array
        quizzes[_quizId].questions.push(newQuestion);
    
        // Update question tracking
        nextQuestionId++;
        listOfQuestions.push(newQuestion);

        // Emit events
        emit QuestionAdded(_quizId, _questionId, _questionText);
    
        // Emit choice events
        for (uint8 i = 0; i < _options.length; i++) {
            emit ChoiceAdded(_questionId, nextChoiceId + i, _options[i]);
        }
        nextChoiceId += _options.length;
    }

    // Function to get all quizzes
    function getAllQuizzes() external view returns (Quiz[] memory) {
        uint256 quizCount = nextQuizId;
        Quiz[] memory allQuizzes = new Quiz[](quizCount);
    
        for (uint i = 0; i < quizCount; i++) {
            allQuizzes[i] = quizzes[i];
        }
    
        return allQuizzes;
    }

    // Function to get questions for a specific quiz
    function getQuestionsForQuiz(uint256 _quizId) external view returns (Question[] memory) {
        require(quizzes[_quizId].exists, "Quiz does not exist");
        return quizzes[_quizId].questions;
    }

     // Retrieve quiz details
    function getQuiz(uint256 _quizId) external view returns (Quiz memory) {
        require(quizzes[_quizId].exists, "Quiz does not exist");
        return quizzes[_quizId];
    }

    //function to add resources
    function addResourcesToLesson(uint256 _lessonId, ContentType contentType ,Resource[] calldata _resources) external onlyRole(COURSE_OWNER_ROLE) {
        Lesson storage lessonStorage = lesson[_lessonId];
        require(lessonStorage.exists, "Lesson does not exist!");

        uint256 currentCount = lessonStorage.resourceCount;
        require(currentCount + _resources.length <= 10, "Exceeds maximum resources!");

        // Copy resources individually
        for (uint256 i = 0; i < _resources.length; i++) {
            lessonStorage.additionalResources[currentCount] = Resource({
                contentType: _resources[i].contentType,
                url: _resources[i].url,
                name: _resources[i].name
            });
            currentCount++;
        }

        lessonStorage.resourceCount = currentCount;

        // Update the lesson in the array as well
        for (uint256 i = 0; i < listOfLessons.length; i++) {
            if (listOfLessons[i].lessonId == _lessonId) {
                listOfLessons[i] = lessonStorage;
                break;
            }
        }
    }

}