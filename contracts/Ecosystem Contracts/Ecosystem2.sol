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
        
        isEnrolled[_courseId][msg.sender] = true;

        mintToken(msg.sender, ENROLLMENT_REWARD);

        emit EnrollmentSuccess(_courseId, msg.sender);

        return true;
    }

    //function to unEnroll from a course
    function unEnroll(uint256 _courseId) external nonReentrant returns(bool) {
        require(isEnrolled[_courseId][msg.sender], "You are not enrolled in this course!");

        isEnrolled[_courseId][msg.sender] = false;

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
        Chapter memory newChapter = Chapter(nextChapterId, _chapters[i], true);
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

    //function to add a lesson
    function addLesson(uint256 _chapterId, string memory _lessonName, string memory _lessonContent) external {
        uint256 lessonId = nextLessonId;
        require(chapter[_chapterId].exists, "Chapter does not exist!");

        // Initialize a new Lesson directly in storage
        Lesson storage newLesson = lesson[lessonId];
        newLesson.lessonId = lessonId;
        newLesson.lessonName = _lessonName;
        newLesson.lessonContent = _lessonContent;
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
        require(lesson[_lessonId].lessonId != 0, "Lesson Does not exist!");
        Quiz storage newQuiz = quizzes[_quizId];
        newQuiz.quizId = _quizId;
        newQuiz.quizTitle = _title;

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
        require(quizzes[_quizId].quizId != 0, "Quiz does not exist");
        require(_options.length > 0 && _options.length <= 4, "Invalid number of choices");
        require(_correctChoiceIndex < _options.length, "Invalid correct choice index");

        // Create question
        uint256 _questionId = nextQuestionId;
        Question storage newQuestion = quizzes[_quizId].questions.push();
        newQuestion.questionId = _questionId;
        newQuestion.questionText = _questionText;

        // Add question to other mappings
        questions[_questionId] = newQuestion;
        nextQuestionId++;

        listOfQuestions.push(newQuestion);

        emit QuestionAdded(_quizId, _questionId, _questionText);

        // Add choices
        for (uint8 i = 0; i < _options.length; i++) {
            uint256 _choiceId = nextChoiceId;
            Choice memory newChoice = Choice({
                option: _options[i],
                isCorrect: (i == _correctChoiceIndex)
            });

            // Push choices directly to storage
            newQuestion.choices.push(newChoice);
            questions[_questionId].choices.push(newChoice);
        
            nextChoiceId++;
            emit ChoiceAdded(_questionId, _choiceId, _options[i]);
        }
    }

     // Retrieve quiz details
    function getQuiz(uint256 _quizId) external view returns (Quiz memory) {
        require(quizzes[_quizId].quizId != 0, "Quiz does not exist");
        return quizzes[_quizId];
    }

    //function to add resources
    function addResourcesToLesson(uint256 _lessonId, Resource[] calldata _resources) external {
        Lesson storage lessonStorage = lesson[_lessonId];
        require(lessonStorage.lessonId != 0, "Lesson does not exist!");

        uint256 currentCount = lessonStorage.resourceCount;
        require(currentCount + _resources.length <= 10, "Exceeds maximum resources!");

        // Copy resources individually
        for (uint256 i = 0; i < _resources.length; i++) {
            lessonStorage.additionalResources[currentCount] = Resource({
                contentType: _resources[i].contentType,
                url: _resources[i].url,
                description: _resources[i].description
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