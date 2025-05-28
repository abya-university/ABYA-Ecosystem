// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { LibDiamond } from "./DiamondLibrary/LibDiamond.sol";
import { EcosystemLib } from "./DiamondLibrary/EcosystemLib.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Ecosystem1Facet is ReentrancyGuard {
    using EcosystemLib for EcosystemLib.Data;
    EcosystemLib.Data private data;
    LibDiamond.DiamondStorage private diamondStorage;
    ReentrancyGuard private reentrancyGuard;


    // Events
    event CourseCreationSuccess(uint256 indexed _courseID, string indexed _courseName, bool _approved);
    event EcosystemPoolUpdate(address indexed _to, uint256 indexed _amount);
    event CourseCreated(uint256 indexed courseId, string courseName, address creator);
    event CourseApproved(uint256 indexed courseId, bool approved);
    event CourseRejected(uint256 indexed courseId, string reason);
    event CourseEligibilityChecked(uint256 indexed courseId, bool eligible);
    event CourseFeedbackAdded(uint256 indexed courseId, string feedback);
    event CourseEdited(uint256 indexed _courseId, string _courseName);
    event CourseDeleteSuccess(uint256 indexed _courseId, address owner);
    event DebugRoleCheck(address account, bytes32 role, bool hasRole);
    event DebugStorageAccess(address account, bytes32 role, bool roleValue);
    event DebugLog(string message, uint256 courseId, uint256 value);

    // Course validation constants
    uint256 constant MIN_CHAPTERS = 1;
    uint256 constant MIN_LESSONS = 1;
    uint256 constant MIN_QUIZZES = 1;
    uint256 constant APPROVAL_THRESHOLD = 50; // 50% threshold
    uint256 constant ELIGIBILITY_CHECK_DELAY = 10 minutes; // 10 minutes delay for eligibility check

    // Course feedback reasons
    string constant MISSING_CHAPTERS = "Course needs at least one chapter";
    string constant MISSING_LESSONS = "Course needs at least one lesson";
    string constant MISSING_QUIZZES = "Course needs at least one quiz";
    string constant LOW_QUALITY_CONTENT = "Course content quality is below threshold";

    //Ecosystem1Facet Storage Pointer
    function ecosystemStorage() internal pure returns (LibDiamond.EcosystemStorage storage es) {
        return LibDiamond.ecosystemStorage();
    }

    modifier onlyRole(bytes32 role) {
        require(LibDiamond.hasRole(role, msg.sender), "Caller doesn't have required role");
        _;
    }

    function checkRole(address account, bytes32 role) public view returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.roles[role][account];
    }

    function getRoleStatus(address account, bytes32 role) public view returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.roles[role][account];
    }
    
    function createCourse(string memory _courseName, string memory _description, LibDiamond.DifficultyLevel _difficultyLevel) external returns(bool) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    
    require(!es.courseObject[es.nextCourseId].exists, "Course already exists");

    LibDiamond.Course memory newCourse = LibDiamond.Course(
        es.nextCourseId, 
        _courseName, 
        _description, 
        false, 
        0, 
        msg.sender, 
        true, 
        new address[](0), 
        _difficultyLevel,
        block.timestamp
    );

    es.courseObject[es.nextCourseId] = newCourse;
    es.listOfCourses.push(newCourse);

    es.courseCount++;
    es.accountCourses[msg.sender].courseCount += 1;
    
    // Grant the role
    LibDiamond.grantRole(LibDiamond.COURSE_OWNER_ROLE, msg.sender);
    
    // Verify role was granted
    bool roleGranted = LibDiamond.hasRole(LibDiamond.COURSE_OWNER_ROLE, msg.sender);
    require(roleGranted, "Failed to grant COURSE_OWNER_ROLE");
    
    // Record creation time for eligibility checking
    es.courseCreationTime[es.nextCourseId] = block.timestamp;
    
    // Emit debug event
    emit DebugRoleCheck(msg.sender, LibDiamond.COURSE_OWNER_ROLE, roleGranted);
    
    es.nextCourseId++;

    emit CourseCreationSuccess(es.nextCourseId - 1, _courseName, false);
    emit CourseCreated(es.nextCourseId - 1, _courseName, msg.sender);

    return true;
}

    // Update the hasRole check to use Diamond storage
    function hasCourseOwnerRole(address account) public view returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.roles[LibDiamond.COURSE_OWNER_ROLE][account];
    }

    function onlyRoleCheck(bytes32 role) public view returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.roles[role][msg.sender];
    }

    function getAllCourses() external view returns (LibDiamond.Course[] memory) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        LibDiamond.Course[] memory courses = new LibDiamond.Course[](es.listOfCourses.length);
        
        for (uint i = 0; i < es.listOfCourses.length; i++) {
            courses[i] = LibDiamond.Course(
                es.listOfCourses[i].courseId,
                es.listOfCourses[i].courseName,
                es.listOfCourses[i].description,
                es.listOfCourses[i].approved,
                es.listOfCourses[i].score,
                es.listOfCourses[i].creator,
                es.listOfCourses[i].exists,
                es.listOfCourses[i].enrolledStudents,
                es.listOfCourses[i].difficultyLevel,
                es.listOfCourses[i].creationTime
            );
        }
        return courses;
    }

    function getCourse(uint256 courseId) external view returns (LibDiamond.Course memory) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        require(es.courseObject[courseId].exists, "Course does not exist");
        return es.courseObject[courseId];
    }

    // Token Minting and Burning Functions
    function mintToken(address to, uint256 amount) internal returns(bool) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        require(amount + es.ecosystemPoolSupply <= LibDiamond.ECOSYSTEM_POOL, "Limit Exceeded!");
        
        es.ecosystemPoolSupply += amount;

        // TODO: Implement actual token minting logic
        // This is currently a recursive call which would fail
        // Replace with actual token minting implementation
        
        emit EcosystemPoolUpdate(to, amount);

        return true;
    }

    function burn(address account, uint256 amount) internal {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        // This is currently a recursive call which would fail
        // Replace with actual token burning implementation
        
        es.ecosystemPoolSupply -= amount;
    }

    function getCurrentEcosystemPoolSupply() public view returns(uint256) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        return es.ecosystemPoolSupply;
    }

    // New function to check course eligibility criteria
    function checkCourseEligibility(uint256 courseId) public view returns (bool, string memory) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        require(es.courseObject[courseId].exists, "Course does not exist");
        
        // Check if the course has required components
        // Note: You'll need to adapt this to your actual course structure
        if (es.courseChapters[courseId].length < MIN_CHAPTERS) {
            return (false, MISSING_CHAPTERS);
        }
        
        // if (es.courseLessons[courseId].length < MIN_LESSONS) {
        //     return (false, MISSING_LESSONS);
        // }
        
        // if (es.courseQuizzes[courseId].length < MIN_QUIZZES) {
        //     return (false, MISSING_QUIZZES);
        // }
        
        return (true, "Course meets eligibility criteria");
    }

    // Function to mark course eligibility status
    function checkCourseEligibilityAfterDelay(uint256 courseId) public {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    
    require(es.courseObject[courseId].exists, "Course does not exist");
    require(block.timestamp >= es.courseCreationTime[courseId] + ELIGIBILITY_CHECK_DELAY, 
            "Eligibility check only available after 1 hour");
    require(!es.courseEligibilityChecked[courseId], "Eligibility already checked");
    
    (bool eligible, string memory reason) = checkCourseEligibility(courseId);
    
    // Store eligibility status
    es.courseEligibility[courseId] = eligible;
    es.courseEligibilityChecked[courseId] = true;
    
    if (!eligible) {
        // Add feedback for ineligible course
        addCourseFeedback(courseId, reason);
    }
    
    emit CourseEligibilityChecked(courseId, eligible);
}

    function isCourseReadyForEligibilityCheck(uint256 courseId) public view returns (bool) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    
    if (!es.courseObject[courseId].exists) {
        return false;
    }
    
    return (block.timestamp >= es.courseCreationTime[courseId] + ELIGIBILITY_CHECK_DELAY) && 
           !es.courseEligibilityChecked[courseId];
}

    // Function to approve course after off-chain AI review
    function approveCourse(uint256 _courseId, uint256 score, 
    LibDiamond.Review memory review
    ) public {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();

    require(es.courseObject[_courseId].exists, "Course does not exist");
    require(!es.courseObject[_courseId].approved, "Course already approved");

    // If eligibility not checked yet and time has passed, check it now
    if (!es.courseEligibilityChecked[_courseId] && 
        block.timestamp >= es.courseCreationTime[_courseId] + ELIGIBILITY_CHECK_DELAY) {
    
        (bool eligible, string memory reason) = checkCourseEligibility(_courseId);
        es.courseEligibility[_courseId] = eligible;
        es.courseEligibilityChecked[_courseId] = true;
    
        if (!eligible) {
            addCourseFeedback(_courseId, reason);
            emit CourseEligibilityChecked(_courseId, eligible);
            emit CourseRejected(_courseId, reason);
            return;
        }
    
        emit CourseEligibilityChecked(_courseId, eligible);
    }

    require(es.courseEligibilityChecked[_courseId], "Course eligibility not checked yet");
    require(es.courseEligibility[_courseId], "Course did not pass eligibility check");
    
    es.courseReviews[_courseId].push(review);
    
    if ((review.score) >= APPROVAL_THRESHOLD * 100) {
        // Course passed the threshold
        es.courseObject[_courseId].approved = true;
        es.courseObject[_courseId].score = score;

        // Update the listOfCourses array
        for (uint256 i = 0; i < es.listOfCourses.length; i++) {
            if (es.listOfCourses[i].courseId == _courseId) {
                es.listOfCourses[i].approved = true;
                es.listOfCourses[i].score = score;
                break;
            }
        }
    
        // Reward the course creator
        // address creator = es.courseObject[courseId].creator;
        // mintToken(creator, LibDiamond.CREATE_COURSE_REWARD);
    
        emit CourseApproved(_courseId, true);
    } else {
        // Course failed the threshold
        string memory reason = "Course needs improvement in the following areas: ";
        
        // Add feedback based on lowest scores
        if (review.learnerAgency < 70) reason = string(abi.encodePacked(reason, "Learner Agency, "));
        if (review.criticalThinking < 70) reason = string(abi.encodePacked(reason, "Critical Thinking, "));
        if (review.collaborativeLearning < 70) reason = string(abi.encodePacked(reason, "Collaborative Learning, "));
        if (review.reflectivePractice < 70) reason = string(abi.encodePacked(reason, "Reflective Practice, "));
        if (review.adaptiveLearning < 70) reason = string(abi.encodePacked(reason, "Adaptive Learning, "));
        if (review.authenticLearning < 70) reason = string(abi.encodePacked(reason, "Authentic Learning, "));
        if (review.technologyIntegration < 70) reason = string(abi.encodePacked(reason, "Technology Integration, "));
        if (review.learnerSupport < 70) reason = string(abi.encodePacked(reason, "Learner Support, "));
        if (review.assessmentForLearning < 70) reason = string(abi.encodePacked(reason, "Assessment for Learning, "));
        if (review.engagementAndMotivation < 70) reason = string(abi.encodePacked(reason, "Engagement and Motivation, "));
        
        // Add general feedback
        reason = string(abi.encodePacked(reason, "Final score: ", uint2str(score), "%"));
        addCourseFeedback(_courseId, reason);
    
        emit CourseRejected(_courseId, reason);
    }
}

    // For retrieving the latest review
function getLatestCourseReview(uint256 courseId) public view returns (LibDiamond.Review memory) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    
    require(es.courseObject[courseId].exists, "Course does not exist");
    require(es.courseReviews[courseId].length > 0, "No reviews for this course");
    
    return es.courseReviews[courseId][es.courseReviews[courseId].length - 1];
}

// For retrieving all reviews
function getAllCourseReviews(uint256 courseId) public view returns (LibDiamond.Review[] memory) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    
    require(es.courseObject[courseId].exists, "Course does not exist");
    
    return es.courseReviews[courseId];
}

    // Helper function to convert uint to string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }

    // Function to add feedback for rejected courses
    function addCourseFeedback(uint256 courseId, string memory feedback) internal {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        es.courseFeedback[courseId] = feedback;
        
        emit CourseFeedbackAdded(courseId, feedback);
    }

    // Function to allow admin to provide feedback for a course
    function provideFeedback(uint256 courseId, string memory feedback) public {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        require(es.courseObject[courseId].exists, "Course does not exist");
        
        addCourseFeedback(courseId, feedback);
    }

    // Function to get course feedback
    function getCourseFeedback(uint256 courseId) public view returns (string memory) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        require(es.courseObject[courseId].exists, "Course does not exist");
        
        return es.courseFeedback[courseId];
    }

    //function to edit course
    function editCourse(uint256 _courseId, string memory _courseName) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) returns(bool) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();

        require(es.courseObject[_courseId].courseId != 0, "Course does not exist");
        require(es.courseObject[_courseId].creator == msg.sender, "Only course creator can edit the course");
        
        es.courseObject[_courseId].courseName = _courseName;

        // Reset approval status if the course was already approved
        if (es.courseObject[_courseId].approved) {
            es.courseObject[_courseId].approved = false;
            es.courseObject[_courseId].score = 0;
            es.courseEligibility[_courseId] = false;
            es.courseFeedback[_courseId] = "Course edited and requires new review";
        }

        emit CourseEdited(_courseId, _courseName);

        return true;
    }

    //function to delete a course
    function deleteCourse(uint256 _courseId) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) returns(bool) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();

        require(es.courseObject[_courseId].courseId != 0, "Course doesn't exist!");
        require(es.courseObject[_courseId].creator == msg.sender, "Only course creator can delete the course");

        for(uint256 i = 0; i < es.listOfCourses.length; i++) {
            if(es.listOfCourses[i].courseId == _courseId) {
                es.listOfCourses[i] = es.listOfCourses[es.listOfCourses.length - 1];
                es.listOfCourses.pop();
                break;
            }
        }

        // Clean up related data
        delete es.courseEligibility[_courseId];
        delete es.courseFeedback[_courseId];
        delete es.courseObject[_courseId];

        emit CourseDeleteSuccess(_courseId, msg.sender);

        return true;
    }
}