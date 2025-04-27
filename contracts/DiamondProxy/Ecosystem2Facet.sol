// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { LibDiamond } from "./DiamondLibrary/LibDiamond.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Ecosystem2Facet is  ReentrancyGuard, AccessControl {
    using LibDiamond for LibDiamond.DiamondStorage;

    // Events (unchanged from original)
    event QuizCreatedSuccess(uint256 indexed _quizId, string indexed _title);
    event QuestionAdded(uint256 quizId, uint256 questionId, string questionText);
    event ChoiceAdded(uint256 questionId, uint256 choiceId, string option);
    event ChaptersAddedSuccessfully(uint256 indexed _courseId, uint256 indexed numberOfChapters);
    event LessonCreationSuccess(uint256 indexed _lessonId, string indexed _lessonName, uint256 indexed _additonalResources);
    event ResourceAddSuccess(uint256 indexed _lessonId, uint256 indexed resourceCount);
    event EnrollmentSuccess(uint256 indexed _courseId, address indexed _by);
    event unEnrollmentSuccess(uint256 indexed _courseId, address indexed _by); 
    event LessonMarkedAsRead(uint256 indexed _chapterId, uint256 indexed _lessonId, address learner);
    event ChapterEdited(uint256 indexed _courseId, uint256 indexed _chapterId, string _chapterName);
    event QuizEdited(uint256 indexed _lessonId, uint256 indexed _quizId, string _quizTitle);
    event ChapterDeletedSuccess(uint256 indexed _courseId, uint256 indexed _chaterId);
    event LessonDeleted(uint256 indexed _chapterId, uint256 indexed _lessonId);
    event LessonEdited(uint256 indexed _lessonId, string _lessonName);
    event QuizDeleted(uint256 indexed _lessonId, uint256 indexed _quizId);
    event QuestionDeleted(uint256 indexed _quizId, uint256 indexed _questionId);
    event QuizSubmitted(address indexed learner, uint256 quizId, uint256 score);
    event EcosystemPoolUpdate(address indexed _to, uint256 indexed _amount);
    event QuizLocked(uint256 indexed _quizId, address indexed _user);



    //Ecosystem2Facet Storage Pointer
    function ecosystem2Storage() internal pure returns (LibDiamond.Ecosystem2Storage storage es) {
        return LibDiamond.ecosystem2Storage();
    }



    function enroll(uint256 _courseId) external nonReentrant returns(bool) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        LibDiamond.EcosystemStorage storage est = LibDiamond.ecosystemStorage();

        require(est.courseObject[_courseId].approved, "Course not yet approved!");
        require(!es.isEnrolled[_courseId][msg.sender], "Already enrolled");
        require(est.courseObject[_courseId].exists, "Course does not exist!");
    
        LibDiamond.Course storage courseFromMapping = est.courseObject[_courseId];
        LibDiamond.Course storage courseFromArray = es.listOfCourses[_courseId];
    
        courseFromMapping.enrolledStudents.push(msg.sender);
        courseFromArray.enrolledStudents.push(msg.sender);
        es.isEnrolled[_courseId][msg.sender] = true;

        mintToken(msg.sender, LibDiamond.ENROLLMENT_REWARD);
        emit EnrollmentSuccess(_courseId, msg.sender);
        return true;
    }

    function unEnroll(uint256 _courseId) external nonReentrant returns(bool) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        LibDiamond.EcosystemStorage storage est = LibDiamond.ecosystemStorage();

        require(es.isEnrolled[_courseId][msg.sender], "Not enrolled!");
    
        LibDiamond.Course storage courseFromMapping = est.courseObject[_courseId];
        LibDiamond.Course storage courseFromArray = est.listOfCourses[_courseId];
    
        // Remove from mapping-based course
        removeStudentFromList(courseFromMapping.enrolledStudents, msg.sender);
        // Remove from array-based course
        removeStudentFromList(courseFromArray.enrolledStudents, msg.sender);
    
        es.isEnrolled[_courseId][msg.sender] = false;
        burn(msg.sender, LibDiamond.ENROLLMENT_REWARD);
        emit unEnrollmentSuccess(_courseId, msg.sender);
        return true;
    }

    function removeStudentFromList(address[] storage students, address student) private {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i] == student) {
                if (i != students.length - 1) {
                    students[i] = students[students.length - 1];
                }
                students.pop();
                break;
            }
        }
    }

    // Function to add a chapter
    function addChapters(uint256 _courseId, string[] memory _chapters, uint256[] memory _durations) external returns (bool) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        LibDiamond.EcosystemStorage storage est = LibDiamond.ecosystemStorage();
        LibDiamond.EcosystemDataStorage storage eds = LibDiamond.ecosystemDataStorage();

        require(est.courseObject[_courseId].creator != address(0), "Course does not exist!");

        for (uint i = 0; i < _chapters.length; i++) {      
            LibDiamond.Chapter memory newChapter = LibDiamond.Chapter(_courseId, eds.data.nextChapterId, _chapters[i], _durations[i], true);
            es.listOfChapters.push(newChapter);

            // uint256 _chapterId = nextChapterId;
            es.chapter[eds.data.nextChapterId] = newChapter;

            // Add the chapter ID to the courseChapters mapping
            es.courseChapters[_courseId].push(newChapter);
            est.courseChapters[_courseId].push(eds.data.nextChapterId);

            eds.data.nextChapterId++;
        }

        emit ChaptersAddedSuccessfully(_courseId, _chapters.length);

        return true;
    }

    //function to get all course chapters
    function getChapters(uint256 _courseId) external view returns (LibDiamond.Chapter[] memory) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        return es.courseChapters[_courseId];
    }

    //function to get all the chapters
    function getAllChapters() external view returns (LibDiamond.Chapter[] memory) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        uint256 chapterCount = es.listOfChapters.length;
        LibDiamond.Chapter[] memory allChapters = new LibDiamond.Chapter[](chapterCount);
    
        for (uint i = 0; i < chapterCount; i++) {
            allChapters[i] = es.listOfChapters[i];
        }
    
        return allChapters;
    }

    function addLesson(uint256 _chapterId, string memory _lessonName, string memory _lessonContent) external {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        LibDiamond.EcosystemDataStorage storage eds = LibDiamond.ecosystemDataStorage();
        LibDiamond.EcosystemStorage storage est = LibDiamond.ecosystemStorage();

        uint256 lessonId = eds.data.nextLessonId;
        require(es.chapter[_chapterId].exists, "Chapter does not exist!");

        // Initialize a new Lesson directly in storage
        LibDiamond.Lesson storage newLesson = es.lesson[lessonId];
        newLesson.chapterId = _chapterId;
        newLesson.lessonId = lessonId;
        newLesson.lessonName = _lessonName;
        newLesson.lessonContent = _lessonContent;
        newLesson.exists = true;
        newLesson.resourceCount = 0;

        // Push a copy to the array
        es.listOfLessons.push(es.lesson[lessonId]);
        est.courseLessons[_chapterId].push(lessonId);
        
        eds.data.nextLessonId++;

        emit LessonCreationSuccess(lessonId, _lessonName, 10); // 10 is the fixed size of additionalResources
    }

    function getAllLessons() external view returns (LibDiamond.Lesson[] memory) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        uint256 lessonCount = es.listOfLessons.length;
        LibDiamond.Lesson[] memory allLessons = new LibDiamond.Lesson[](lessonCount);
    
        for (uint i = 0; i < lessonCount; i++) {
            allLessons[i] = es.listOfLessons[i];
        }
    
        return allLessons;
    }

    //function to add a quiz
    function createQuiz(uint256 _lessonId, string memory _title) external returns(uint256) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        LibDiamond.EcosystemDataStorage storage eds = LibDiamond.ecosystemDataStorage();
        LibDiamond.EcosystemStorage storage est = LibDiamond.ecosystemStorage();

        uint256 _quizId = eds.data.nextQuizId;
        require(es.lesson[_lessonId].exists, "Lesson Does not exist!");
        LibDiamond.Quiz storage newQuiz = es.quizzes[_quizId];
        newQuiz.lessonId = _lessonId;
        newQuiz.quizId = _quizId;
        newQuiz.quizTitle = _title;
        newQuiz.exists = true;

        eds.data.nextQuizId++;
        es.listOfQuizzes.push(newQuiz);
        est.courseQuizzes[_lessonId].push(_quizId);

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
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        LibDiamond.EcosystemDataStorage storage eds = LibDiamond.ecosystemDataStorage();

        require(es.quizzes[_quizId].exists, "Quiz does not exist");
        require(_options.length > 0 && _options.length <= 4, "Invalid number of choices");
        require(_correctChoiceIndex < _options.length, "Invalid correct choice index");

        // Create question
        uint256 _questionId = eds.data.nextQuestionId;
    
        // Create new Question struct in storage
        LibDiamond.Question storage newQuestion = es.questions[_questionId];
        newQuestion.quizId = _quizId;
        newQuestion.questionId = _questionId;
        newQuestion.questionText = _questionText;

        // Add choices to the question
        for (uint8 i = 0; i < _options.length; i++) {
            LibDiamond.Choice memory newChoice = LibDiamond.Choice({
                option: _options[i],
                isCorrect: (i == _correctChoiceIndex)
            });
            newQuestion.choices.push(newChoice);
        }

        // Add question to the quiz's questions array
        es.quizzes[_quizId].questions.push(newQuestion);
    
        // Update question tracking
        eds.data.nextQuestionId++;
        es.listOfQuestions.push(newQuestion);

        // Emit events
        emit QuestionAdded(_quizId, _questionId, _questionText);
    
        // Emit choice events
        for (uint8 i = 0; i < _options.length; i++) {
            emit ChoiceAdded(_questionId, eds.data.nextChoiceId + i, _options[i]);
        }
        eds.data.nextChoiceId += _options.length;
    }

    // Function to get all quizzes
    function getAllQuizzes() external view returns (LibDiamond.Quiz[] memory) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        LibDiamond.EcosystemDataStorage storage eds = LibDiamond.ecosystemDataStorage();

        uint256 quizCount = eds.data.nextQuizId;
        LibDiamond.Quiz[] memory allQuizzes = new LibDiamond.Quiz[](quizCount);
    
        for (uint i = 0; i < quizCount; i++) {
            allQuizzes[i] = es.quizzes[i];
        }
    
        return allQuizzes;
    }

    // Function to get questions for a specific quiz
    function getQuestionsForQuiz(uint256 _quizId) external view returns (LibDiamond.Question[] memory) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        require(es.quizzes[_quizId].exists, "Quiz does not exist");
        return es.quizzes[_quizId].questions;
    }

     // Retrieve quiz details
    function getQuiz(uint256 _quizId) external view returns (LibDiamond.Quiz memory) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        require(es.quizzes[_quizId].exists, "Quiz does not exist");
        return es.quizzes[_quizId];
    }

    //function to add resources
    function addResourcesToLesson(uint256 _lessonId, LibDiamond.ContentType contentType , LibDiamond.Resource[] calldata _resources) external {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        LibDiamond.Lesson storage lessonStorage = es.lesson[_lessonId];
        require(lessonStorage.exists, "Lesson does not exist!");

        uint256 currentCount = lessonStorage.resourceCount;
        require(currentCount + _resources.length <= 10, "Exceeds maximum resources!");

        // Copy resources individually
        for (uint256 i = 0; i < _resources.length; i++) {
            lessonStorage.additionalResources[currentCount] = LibDiamond.Resource({
                contentType: _resources[i].contentType,
                url: _resources[i].url,
                name: _resources[i].name
            });
            currentCount++;
        }

        lessonStorage.resourceCount = currentCount;

        // Update the lesson in the array as well
        for (uint256 i = 0; i < es.listOfLessons.length; i++) {
            if (es.listOfLessons[i].lessonId == _lessonId) {
                es.listOfLessons[i] = lessonStorage;
                break;
            }
        }
    }

    function markAsRead(uint256 _courseId, uint256 _chapterId, uint256 _lessonId) external returns(bool) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        
        require(!es.lessonRead[_lessonId][msg.sender], "Already marked");
        require(es.lesson[_lessonId].exists, "Lesson doesn't exist");

        es.lessonRead[_lessonId][msg.sender] = true;
        es.userCompletedLessons[msg.sender].push(_lessonId);
        es.userCompletedLessonsByCourse[msg.sender][_courseId].push(_lessonId);

        emit LessonMarkedAsRead(_chapterId, _lessonId, msg.sender);
        return true;
    }

    function getUserCompletedLessonsByCourse(uint256 _courseId) external view returns(uint256[] memory) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        uint256[] memory completedLessons = es.userCompletedLessonsByCourse[msg.sender][_courseId];
        return (completedLessons);
    }

    //get usercompleted quizzes by course
    function getUserCompletedQuizzesByCourse(uint256 _courseId) external view returns(uint256[] memory) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        uint256[] memory completedQuizzes = es.userCompletedQuizzesByCourse[msg.sender][_courseId];
        return (completedQuizzes);
    }


    function mintToken(address to, uint256 amount) internal returns(bool) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        require(amount + es.ecosystemPoolSupply <= LibDiamond.ECOSYSTEM_POOL, "Limit Exceeded!");
        
        // TODO: Implement actual token minting logic
        mintToken(to, amount);
        
        es.ecosystemPoolSupply += amount;

        emit EcosystemPoolUpdate(to, amount);

        return true;
    }

    function burn(address account, uint256 amount) internal {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        burn(account, amount);
        
        es.ecosystemPoolSupply -= amount;
    }

    //function to take/submit quiz
    function submitQuiz(uint256 _courseId, uint256 _quizId, uint256[] memory _answers, uint256 _score) public returns(bool) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        // Verify quiz exists
        require(es.quizzes[_quizId].exists, "Quiz does not exist");

        // uint256 totalQuestions = quiz.questions.length;
        // require(_answers.length == totalQuestions, "Invalid number of answers");

        // uint256 correctAnswers = 0;

        // // Iterate through all the questions in the quiz
        // for (uint256 i = 0; i < totalQuestions; i++) {
        //     LibDiamond.Question storage question = quiz.questions[i];
        //     uint256 selectedChoiceId = _answers[i];

        //     // Check if the selected choice is correct
        //     if (question.choices[selectedChoiceId].isCorrect) {
        //         correctAnswers++;
        //     }
        // }

        // Calculate the score
        // score = (correctAnswers * 100) / totalQuestions;

        // Update completion status if the score is 75 or higher
        if (_score >= 75) {
            es.completedQuizzes[_quizId][msg.sender] = true;
            es.userScores[msg.sender][_quizId] = _score;
            es.userCompletedQuizzesByCourse[msg.sender][_courseId].push(_quizId);

            // Try to mint token
            // mintToken(msg.sender, LibDiamond.QUIZ_COMPLETION_REWARD);
        }

        emit QuizSubmitted(msg.sender, _quizId, _score);

        return true;
    }

    //function to check if quiz exists
    function quizExists(uint256 _quizId) external view returns (bool) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        return es.quizzes[_quizId].exists;
    }

    //function to lock quiz
    function lockQuiz(uint256 _courseId, uint256 _quizId) external {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        require(es.quizzes[_quizId].exists, "Quiz does not exist");

        for(uint256 i = 0; i < es.userCompletedQuizzesByCourse[msg.sender][_courseId].length; i++){
            if(es.userCompletedQuizzesByCourse[msg.sender][_courseId][i] == _quizId){
                revert("Quiz already completed");
            }
        }

        // Lock the quiz for the user
        es.userQuizLockTimes[msg.sender][_quizId] = block.timestamp;

        emit QuizLocked(_quizId, msg.sender);
    }

    //return the time a quiz is locked for a specific user
    function getQuizLockTime(uint256 _quizId, address _user) external view returns (uint256) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        require(es.quizzes[_quizId].exists, "Quiz does not exist");
        return es.userQuizLockTimes[_user][_quizId];
    }

    //function to edit module
    function editChapter(uint256 _courseId, uint256 _chapterId, string memory _chapterName) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) returns(bool) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        require(es.chapter[_chapterId].chapterId != 0, "Chapter doesn't not exist");

        es.chapter[_chapterId].chapterName = _chapterName;

        emit ChapterEdited(_courseId, _chapterId, _chapterName);

        return true;
    }

    //funtion to delete chapter/module
    function deleteChapter(uint256 _courseId, uint256 _chapterId) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) returns(bool){
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();
        LibDiamond.EcosystemStorage storage est = LibDiamond.ecosystemStorage();

        require(est.courseObject[_courseId].courseId != 0, "Course doesn't exist");
        require(es.chapter[_chapterId].chapterId != 0, "Chapter doesn't exist");
        
        for(uint256 i = 0; i <= es.listOfChapters.length; i++){
            if(es.chapter[i].chapterId == _chapterId){
                es.listOfChapters[i] = es.listOfChapters[es.listOfChapters.length - 1];
                es.listOfChapters.pop();
            }
        }

        delete(es.chapter[_chapterId]);

        emit ChapterDeletedSuccess(_courseId, _chapterId);

        return true;
    }

    // function to edit a lesson
    function editLesson(uint256 _lessonId, string memory _lessonName, string memory _lessonContent, LibDiamond.Resource[] memory _additionalResources) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) returns (bool) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        require(es.lesson[_lessonId].lessonId != 0, "Lesson does not exist");

        es.lesson[_lessonId].lessonName = _lessonName;
        es.lesson[_lessonId].lessonContent = _lessonContent;

        // Update additional resources if provided
        if (_additionalResources.length > 0) {
            require(_additionalResources.length <= 10, "Exceeds maximum allowed");

            for (uint256 i = 0; i < _additionalResources.length; i++) {
                es.lesson[_lessonId].additionalResources[i] = _additionalResources[i];
            }

            // Update the resource count
            es.lesson[_lessonId].resourceCount = _additionalResources.length;
        }

        emit LessonEdited( _lessonId, _lessonName);

        return true;
    }

    //funtion to delete lesson
    function deleteLesson(uint256 _chapterId, uint256 _lessonId) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) returns(bool){
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        require(es.chapter[_chapterId].chapterId != 0, "Chapter doesn't exist");
        require(es.lesson[_lessonId].lessonId != 0, "Lesson doesn't exist");

        for(uint256 i = 0; i <= es.listOfChapters.length; i++){
            if(es.lesson[i].lessonId == _lessonId){
                es.listOfLessons[i] = es.listOfLessons[es.listOfLessons.length - 1];
                es.listOfLessons.pop();
            }
        }

        delete(es.lesson[_lessonId]);

        emit LessonDeleted(_chapterId, _lessonId);

        return true;
    }

    //function to edit quiz
    function editQuiz(uint256 _lessonId, uint256 _quizId, string memory _quizTitle) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) {
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        require(es.quizzes[_quizId].quizId != 0, "QUiz does not exist");
        require(es.quizzes[_quizId].quizId == _quizId, "Not exact quiz");

        es.quizzes[_quizId].quizTitle = _quizTitle;

        emit QuizEdited(_lessonId, _quizId, _quizTitle);
    }

    //funtion to delete quiz
    function deleteQuiz(uint256 _lessonId, uint256 _quizId) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) returns(bool){
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        require(es.lesson[_lessonId].lessonId != 0, "Lesson doesn't exist");
        require(es.quizzes[_quizId].quizId != 0, "Quiz doesn't exist");

        for(uint256 i = 0; i <= es.listOfChapters.length; i++){
            if(es.quizzes[_quizId].quizId == _quizId) {
                es.listOfQuizzes[i] = es.listOfQuizzes[es.listOfQuizzes.length - 1];
                es.listOfQuizzes.pop();
            }
        }

        delete(es.quizzes[_quizId]);

        emit QuizDeleted(_lessonId, _quizId);

        return true;
    }

    // Delete a Specific Question from a Quiz
    function deleteQuestion(uint256 _quizId, uint256 _questionId) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) returns(bool){
        LibDiamond.Ecosystem2Storage storage es = LibDiamond.ecosystem2Storage();

        require(es.quizzes[_quizId].quizId != 0, "Quiz does not exist");
        require(es.questions[_questionId].questionId != 0, "Question not found in this quiz");

        // Find and remove the specific question
        for (uint256 i = 0; i < es.listOfQuestions.length; i++) {
            if (es.listOfQuestions[i].questionId == _questionId) {
                es.listOfQuestions[i] = es.listOfQuestions[es.listOfQuestions.length - 1];
                es.listOfQuestions.pop();
            }
        }

        delete(es.questions[_questionId]);
        
        emit QuestionDeleted(_quizId, _questionId);

        return true;
    }
}