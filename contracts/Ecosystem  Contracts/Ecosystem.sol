//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { LMSToken } from "../LMS Token.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { EcosystemLib } from "./EcosystemLib.sol";

contract Ecosystem is LMSToken, ReentrancyGuard {
    using EcosystemLib for EcosystemLib.Data;
    EcosystemLib.Data private data;
    
    uint256 public constant ECOSYSTEM_POOL = (MAX_SUPPLY * 15) / 100;
    uint256 public constant CREATE_COURSE_REWARD = 5 * 10 ** 18;
    uint256 public constant ENROLLMENT_REWARD = 2 * 10 ** 18;
    uint256 public constant REQUIRED_APPROVALS = 2;
    uint256 public constant MAX_SCORE = 100; 
    uint256 public constant MIN_APPROVAL_SCORE = 80;

    bytes32 public constant COURSE_OWNER_ROLE = keccak256("COURSE_OWNER_ROLE");

    uint256 public ecosystemPoolSupply;

    uint256 public courseCount;

    uint256 public nextCourseId;

    uint256 public nextChapterId;

    uint256 public nextLessonId;

    uint256 public nextQuizId;

    uint256 public nextQuestionId;

    uint256 public nextChoiceId;

    struct Course {
        uint256 courseId;
        string courseName;
        string description;
        bool approved;
        uint256 approvalCount;
        address creator;
    }

    struct Review {
        uint256 learnerAgency;
        uint256 criticalThinking;
        uint256 collaborativeLearning;
        uint256 reflectivePractice;
        uint256 adaptiveLearning;
        uint256 authenticLearning;
        uint256 technologyIntegration;
        uint256 learnerSupport;
        uint256 assessmentForLearning;
        uint256 engagementAndMotivation;
        bool isSubmitted;
    }

    struct Account {
        uint256 courseCount;
    }

    struct Chapter {
        uint256 chapterId;
        string chapterName;
    }

    struct Lesson {
        uint256 lessonId;
        string lessonName;
        string lessonContent;
        Resource[10] additionalResources;
        uint256 resourceCount;
    }

    struct Resource {
        string contentType; // "video" or "document"
        string url;
        string description;
    }

    struct Quiz {
        uint256 quizId;
        string quizTitle;
        Question[] questions;
    }

    struct Question {
        uint256 questionId;
        string questionText;
        Choice[] choices;
    }

    struct Choice {
        string option;
        bool isCorrect;
    }


    mapping(uint256 => Course) public courseObject;
    mapping(uint256 => mapping(address => Review)) public reviews;
    mapping(address => Account) public accountCourses;
    mapping(address => mapping(uint256 => bool)) public approvals;
    mapping(uint256 => Chapter) public chapter;
    mapping(uint256 => string[]) public courseChapters;
    mapping(uint256 => Lesson) public lesson;
    mapping(uint256 => string[]) public chapterLessons;
    mapping(uint256 => Quiz) public quizzes;
    mapping(uint256 => Question) public questions;
    mapping(uint256 => mapping(address => bool)) public isEnrolled;


    Course[] public listOfCourses;
    Chapter[] public listOfChapters;
    Lesson[] public listOfLessons;
    Resource[] public listOfResource;
    Quiz[] public listOfQuizzes;
    Question[] public listOfQuestions;


    event CourseCreationSuccess(uint256 indexed _courseID, string indexed _courseName, bool _approved);
    event EnrollmentSuccess(uint256 indexed _courseId, address indexed _by);
    event unEnrollmentSuccess(uint256 indexed _courseId, address indexed _by);
    event ChaptersAddedSuccessfully(uint256 indexed _courseId, uint256 indexed numberOfChapters);
    event LessonCreationSuccess(uint256 indexed _lessonId, string indexed _lessonName, uint256 indexed _additonalResources);
    event ResourceAddSuccess(uint256 indexed _lessonId, uint256 indexed resourceCount);
    event EcosystemPoolUpdate(address indexed _to, uint256 indexed _amount);


    constructor(address[] memory _admins) LMSToken(_admins) ReentrancyGuard() {
        data.initialize();
    }

    function nextCourseIdd() public view returns (uint256) {
        return data.nextCourseId;
    }

    //function to mint token
    function mintToken(address to, uint256 amount) internal override  returns(bool){
        require(amount + getCurrentEcosystemPoolSupply() <= ECOSYSTEM_POOL, "Limit Exceeded!");
        super.mintToken(to, amount);
        ecosystemPoolSupply += amount;

        emit EcosystemPoolUpdate(to, amount);

        return true;
    }

    //function to burn tokens
    function burn(address account, uint256 amount) internal override  {
        super.burn(account, amount);
        // Update ecosystem pool supply
        ecosystemPoolSupply -= amount;
    }

    //function to get the ecosystem pool total supply
    function getCurrentEcosystemPoolSupply() public view returns(uint256) {
        return ecosystemPoolSupply;
    }


    // function to create course
    function createCourse(string memory _courseName, string memory _description) external returns(bool) {
        // require(nextCourseId > 0, "All course IDs have been assigned");
        require(courseObject[nextCourseId].creator == address(0), "Course ID already exists");

        Course memory newCourse = Course(nextCourseId,_courseName, _description, false, 0, msg.sender);
        courseObject[nextCourseId] = newCourse;

        listOfCourses.push(newCourse);

        courseCount++;
        accountCourses[msg.sender].courseCount += 1;
        nextCourseId++;

        _grantRole(COURSE_OWNER_ROLE, msg.sender);

        emit CourseCreationSuccess(nextCourseId - 1, _courseName, courseObject[nextCourseId - 1].approved);

        return true;
    }

    //function to get all courses
    function getAllCourses() external view returns(Course[] memory) {
        Course[] memory courses = new Course[](listOfCourses.length);
        for (uint i = 0; i < listOfCourses.length; i++) {
            courses[i] = Course(
                listOfCourses[i].courseId,
                listOfCourses[i].courseName,
                listOfCourses[i].description,
                listOfCourses[i].approved,
                listOfCourses[i].approvalCount,
                listOfCourses[i].creator
            );
        }
        return courses;
    }

    //function to submit review
    function submitReview(
        uint256 courseId,
        uint256 learnerAgency,
        uint256 criticalThinking,
        uint256 collaborativeLearning,
        uint256 reflectivePractice,
        uint256 adaptiveLearning,
        uint256 authenticLearning,
        uint256 technologyIntegration,
        uint256 learnerSupport,
        uint256 assessmentForLearning,
        uint256 engagementAndMotivation
    ) public onlyRole(ADMIN_ROLE) {
        require(!reviews[courseId][msg.sender].isSubmitted, "Review already submitted by this reviewer.");
        require(learnerAgency <= 10 && criticalThinking <= 10 && collaborativeLearning <= 10 && reflectivePractice <= 10 &&
                adaptiveLearning <= 10 && authenticLearning <= 10 && technologyIntegration <= 10 &&
                learnerSupport <= 10 && assessmentForLearning <= 10 && engagementAndMotivation <= 10, "Scores must be between 1 and 10.");

        reviews[courseId][msg.sender] = Review({
            learnerAgency: learnerAgency,
            criticalThinking: criticalThinking,
            collaborativeLearning: collaborativeLearning,
            reflectivePractice: reflectivePractice,
            adaptiveLearning: adaptiveLearning,
            authenticLearning: authenticLearning,
            technologyIntegration: technologyIntegration,
            learnerSupport: learnerSupport,
            assessmentForLearning: assessmentForLearning,
            engagementAndMotivation: engagementAndMotivation,
            isSubmitted: true
        });

        if (getTotalScore(reviews[courseId][msg.sender]) >= MIN_APPROVAL_SCORE) {
            approveCourse(courseId);
        }
    }

    function getTotalScore(Review storage review) internal view returns (uint256) {
        return review.learnerAgency + review.criticalThinking + review.collaborativeLearning + review.reflectivePractice + 
               review.adaptiveLearning + review.authenticLearning + review.technologyIntegration + review.learnerSupport + 
               review.assessmentForLearning + review.engagementAndMotivation;
    }

    function approveCourse(uint256 _courseId) public onlyRole(ADMIN_ROLE) {
        Course storage course = courseObject[_courseId];
        require(!course.approved, "Course already approved");
        require(!approvals[msg.sender][_courseId], "You have already approved this course");

        approvals[msg.sender][_courseId] = true;
        course.approvalCount++;

        if (course.approvalCount >= REQUIRED_APPROVALS) {
            course.approved = true;
            mintToken(course.creator, CREATE_COURSE_REWARD);
        }
    }

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

    //function to add a chapter
    function addChapters(uint256 _courseId, string[] memory _chapters) external returns(bool) {
        require(courseObject[_courseId].creator != address(0), "Course does not exist!");

        for (uint i = 0; i < _chapters.length; i++) {
            Chapter memory newChapter = Chapter(nextChapterId, _chapters[i]);
            listOfChapters.push(newChapter);

            uint256 _chapterId = nextChapterId;
            chapter[_chapterId] = newChapter;

            nextChapterId++;
        }

        // Clear the existing chapters for the course
        delete courseChapters[_courseId];

        // Copy each chapter from memory to storage
        for (uint i = 0; i < _chapters.length; i++) {
            courseChapters[_courseId].push(_chapters[i]);
        }

        emit ChaptersAddedSuccessfully(_courseId, _chapters.length);

        return true;
    }
    
}