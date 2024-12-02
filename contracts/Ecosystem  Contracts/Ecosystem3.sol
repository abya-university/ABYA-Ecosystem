//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { Ecosystem } from "./Ecosystem.sol";

contract Ecosystem2 is Ecosystem {
    uint256 public constant COURSE_COMPLETION_REWARD = 2 * 10 ** 18;
    uint256 public constant QUIZ_COMPLETION_REWARD = 1 * 10 ** 18;

    struct Certificate {
        uint256 certId;
        uint256 courseId;
        string learner;
        string cert_issuer;
        uint issue_date;
        string courseName;
        address owner;
    }

    mapping(uint256 => mapping(address => bool)) public courseCompleted;
    mapping(uint256 => mapping(address => bool)) public lessonRead;
    mapping(address => mapping(uint256 => uint256)) public userScores;
    mapping(uint256 => mapping(address => bool)) public completedQuizzes;
    mapping(uint256 => Certificate) public certificates;


    event CourseDeleteSuccess(uint256 indexed _courseId, address owner);
    event LessonMarkedAsRead(uint256 indexed _chapterId, uint256 indexed _lessonId, address learner);
    event ChapterDeletedSuccess(uint256 indexed _courseId, uint256 indexed _chaterId);
    event LessonDeleted(uint256 indexed _chapterId, uint256 indexed _lessonId);
    event QuizDeleted(uint256 indexed _lessonId, uint256 indexed _quizId);
    event QuestionDeleted(uint256 indexed _quizId, uint256 indexed _questionId);
    event CertificateIssued(uint256 certificateId, string courseName, string cert_issuer, string learner);
    event QuizSubmitted(address indexed learner, uint256 quizId, uint256 score);
    event CourseEdited(uint256 indexed _courseId, string _courseName);
    event ChapterEdited(uint256 indexed _courseId, uint256 indexed _chapterId, string _chapterName);
    event LessonEdited(uint256 indexed _lessonId, string _lessonName);
    event QuizEdited(uint256 indexed _lessonId, uint256 indexed _quizId, string _quizTitle);


    constructor(address[] memory _admins) Ecosystem(_admins) {}

    //function to delete a course
    function deleteCourse(uint256 _courseId) external onlyRole(COURSE_OWNER_ROLE) returns(bool) {
        require(courseObject[_courseId].courseId != 0, "Course doesn't exist!");

        for(uint256 i = 0; i <= listOfCourses.length; i++) {
            if(listOfCourses[i].courseId == _courseId) {
                listOfCourses[i] = listOfCourses[listOfCourses.length - 1];
                listOfCourses.pop();
            }

        }

        delete(courseObject[_courseId]);

        emit CourseDeleteSuccess(_courseId, msg.sender);

        return true;
    }

    //function to mark lesson as read
    function markAsRead(uint256 _chapterId, uint256 _lessonId) external returns(bool) {
        require(!lessonRead[_lessonId][msg.sender], "You have already marked this lesson as read");
        require(lesson[_lessonId].lessonId != 0, "Lesson doesn't exist");

        lessonRead[_lessonId][msg.sender] = true;

        emit LessonMarkedAsRead(_chapterId, _lessonId, msg.sender);

        return true;
    }

    //function to take/submit quiz
    function submitQuiz(uint256 _quizId, uint256[] memory _answers) public returns (uint256 score) {
        Quiz storage quiz = quizzes[_quizId];
        uint256 totalQuestions = quiz.questions.length;
        uint256 correctAnswers = 0;

        // Ensure the number of answers matches the number of questions
        require(_answers.length == totalQuestions, "Number of answers must match the number of questions");

        // Iterate through all the questions in the quiz
        for (uint256 i = 0; i < totalQuestions; i++) {
            Question storage question = quiz.questions[i];
            uint256 selectedChoiceId = _answers[i];
        
            // Ensure the selected choice is valid
            require(selectedChoiceId < question.choices.length, "Invalid choice selected");

            // Check if the selected choice is correct
            if (question.choices[selectedChoiceId].isCorrect) {
                correctAnswers++;
            }
        }

        // Calculate the score 
        score = (correctAnswers * 100) / totalQuestions;

        if(score >= 75) {
            completedQuizzes[_quizId][msg.sender] = true;
            userScores[msg.sender][_quizId] = score;

            mintToken(msg.sender, QUIZ_COMPLETION_REWARD);
        }

        emit QuizSubmitted(msg.sender, _quizId, score);

        return score;
    }

    //function to edit course
    function editCourse(uint256 _courseId, string memory _courseName) external onlyRole(COURSE_OWNER_ROLE) returns(bool) {
        require(courseObject[_courseId].courseId != 0, "Course does not exist");
        courseObject[_courseId].courseName = _courseName;

        emit CourseEdited(_courseId, _courseName);

        return true;
    }

    //function to edit module
    function editChapter(uint256 _courseId, uint256 _chapterId, string memory _chapterName) external onlyRole(COURSE_OWNER_ROLE) returns(bool) {
        require(chapter[_chapterId].chapterId != 0, "Chapter doesn't not exist");

        chapter[_chapterId].chapterName = _chapterName;

        emit ChapterEdited(_courseId, _chapterId, _chapterName);

        return true;
    }

    //function to edit quiz
    function editQuiz(uint256 _lessonId, uint256 _quizId, string memory _quizTitle) external onlyRole(COURSE_OWNER_ROLE) {
        require(quizzes[_quizId].quizId != 0, "QUiz does not exist");
        require(quizzes[_quizId].quizId == _quizId, "Not exact quiz");

        quizzes[_quizId].quizTitle = _quizTitle;

        emit QuizEdited(_lessonId, _quizId, _quizTitle);
    }

    // function to edit a lesson
    function editLesson(uint256 _lessonId, string memory _lessonName, string memory _lessonContent, Resource[] memory _additionalResources) external onlyRole(COURSE_OWNER_ROLE) returns (bool) {
        require(lesson[_lessonId].lessonId != 0, "Lesson does not exist");

        lesson[_lessonId].lessonName = _lessonName;
        lesson[_lessonId].lessonContent = _lessonContent;

        // Update additional resources if provided
        if (_additionalResources.length > 0) {
            require(_additionalResources.length <= 10, "Resource count exceeds maximum allowed");

            for (uint256 i = 0; i < _additionalResources.length; i++) {
                lesson[_lessonId].additionalResources[i] = _additionalResources[i];
            }

            // Update the resource count
            lesson[_lessonId].resourceCount = _additionalResources.length;
        }

        emit LessonEdited( _lessonId, _lessonName);

        return true;
    }


    //funtion to delete chapter/module
    function deleteChapter(uint256 _courseId, uint256 _chapterId) onlyRole(COURSE_OWNER_ROLE) external onlyRole(COURSE_OWNER_ROLE) returns(bool){
        require(courseObject[_courseId].courseId != 0, "Course doesn't exist");
        require(chapter[_chapterId].chapterId != 0, "Chapter doesn't exist");
        
        for(uint256 i = 0; i <= listOfChapters.length; i++){
            if(chapter[i].chapterId == _chapterId){
                listOfChapters[i] = listOfChapters[listOfChapters.length - 1];
                listOfChapters.pop();
            }
        }

        delete(chapter[_chapterId]);

        emit ChapterDeletedSuccess(_courseId, _chapterId);

        return true;
    }

    //funtion to delete lesson
    function deleteLesson(uint256 _chapterId, uint256 _lessonId) external onlyRole(COURSE_OWNER_ROLE) returns(bool){
        require(chapter[_chapterId].chapterId != 0, "Chapter doesn't exist");
        require(lesson[_lessonId].lessonId != 0, "Lesson doesn't exist");

        for(uint256 i = 0; i <= listOfChapters.length; i++){
            if(lesson[i].lessonId == _lessonId){
                listOfLessons[i] = listOfLessons[listOfLessons.length - 1];
                listOfLessons.pop();
            }
        }

        delete(lesson[_lessonId]);

        emit LessonDeleted(_chapterId, _lessonId);

        return true;
    }

    //funtion to delete quiz
    function deleteQuiz(uint256 _lessonId, uint256 _quizId) external onlyRole(COURSE_OWNER_ROLE) returns(bool){
        require(lesson[_lessonId].lessonId != 0, "Lesson doesn't exist");
        require(quizzes[_quizId].quizId != 0, "Quiz doesn't exist");

        for(uint256 i = 0; i <= listOfChapters.length; i++){
            if(quizzes[_quizId].quizId == _quizId) {
                listOfQuizzes[i] = listOfQuizzes[listOfQuizzes.length - 1];
                listOfQuizzes.pop();
            }
        }

        delete(quizzes[_quizId]);

        emit QuizDeleted(_lessonId, _quizId);

        return true;
    }

    // Delete a Specific Question from a Quiz
    function deleteQuestion(uint256 _quizId, uint256 _questionId) external onlyRole(COURSE_OWNER_ROLE) returns(bool){
        require(quizzes[_quizId].quizId != 0, "Quiz does not exist");
        require(questions[_questionId].questionId != 0, "Question not found in this quiz");

        // Find and remove the specific question
        for (uint256 i = 0; i < listOfQuestions.length; i++) {
            if (listOfQuestions[i].questionId == _questionId) {
                listOfQuestions[i] = listOfQuestions[listOfQuestions.length - 1];
                listOfQuestions.pop();
            }
        }

        delete(questions[_questionId]);
        
        emit QuestionDeleted(_quizId, _questionId);

        return true;
    }

    //function to award/issue certificate
    function issueCertificate(uint256 _courseId, string memory learner, string memory courseName, string memory cert_issuer, uint issue_date) public returns (uint256, Certificate memory) {
        require(isEnrolled[_courseId][msg.sender], "You must be enrolled in the course to complete it");
        require(!courseCompleted[_courseId][msg.sender], "You have already completed this course");

        // Mark course as completed
        courseCompleted[_courseId][msg.sender] = true;
    
        // Award tokens for course completion
        mintToken(msg.sender, COURSE_COMPLETION_REWARD);

        // Generate a unique certificate ID using a hash and convert it to uint256
        uint256 certificateId = uint256(keccak256(abi.encodePacked(_courseId, learner, courseName, cert_issuer, issue_date, block.timestamp)));

        // Create and store the certificate
        Certificate memory newCert = Certificate({
            certId: certificateId,
            learner: learner,
            courseId: _courseId,
            courseName: courseName,
            cert_issuer: cert_issuer,
            issue_date: issue_date,
            owner: msg.sender
        });

        certificates[certificateId] = newCert;

         emit CertificateIssued(certificateId, courseName, cert_issuer, learner);

        // Return the certificate details and the unique certificate ID
        return (certificateId, newCert);
}

}