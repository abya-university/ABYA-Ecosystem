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
    event CourseApproved(uint256 indexed courseId, uint256 approvalCount);
    event ReviewSubmitted(uint256 indexed courseId, address reviewer);
    event ReviewersAssigned(uint256 indexed courseId, address[] reviewers);
    event CourseEdited(uint256 indexed _courseId, string _courseName);
    event CourseDeleteSuccess(uint256 indexed _courseId, address owner);
    event DebugRoleCheck(address account, bytes32 role, bool hasRole);
    event DebugStorageAccess(address account, bytes32 role, bool roleValue);
    event DebugLog(string message, uint256 courseId, uint256 value);

    //Ecosystem1Facet Storage Pointer
    function ecosystemStorage() internal pure returns (LibDiamond.EcosystemStorage storage es) {
        return LibDiamond.ecosystemStorage();
    }

    modifier onlyRole(bytes32 role) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        require(ds.roles[role][msg.sender], "Caller does not have required role");
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
        _difficultyLevel
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
    
    // Emit debug event
    emit DebugRoleCheck(msg.sender, LibDiamond.COURSE_OWNER_ROLE, roleGranted);
    
    es.nextCourseId++;

    emit CourseCreationSuccess(es.nextCourseId - 1, _courseName, false);

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
                es.listOfCourses[i].approvalCount,
                es.listOfCourses[i].creator,
                es.listOfCourses[i].exists,
                es.listOfCourses[i].enrolledStudents,
                es.listOfCourses[i].difficultyLevel
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
        
        // TODO: Implement actual token minting logic
        mintToken(to, amount);
        
        es.ecosystemPoolSupply += amount; // Commented out as unreachable code

        emit EcosystemPoolUpdate(to, amount);

        return true;
    }

    function burn(address account, uint256 amount) internal {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        burn(account, amount);
        
        es.ecosystemPoolSupply -= amount; // Commented out as unreachable code
    }

    function getCurrentEcosystemPoolSupply() public view returns(uint256) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        return es.ecosystemPoolSupply;
    }


function submitReview(uint256 courseId, uint256[10] memory scores) public onlyRole(LibDiamond.REVIEWER_ROLE) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    
    require(es.courseObject[courseId].exists, "Course does not exist");
    require(es.courseReviewers[courseId].length > 0, "No reviewers assigned to this course");
    require(isReviewer(courseId, msg.sender), "Not a reviewer for this course");
    
    // Check if reviewer has already submitted a review
    require(!es.reviews[courseId][msg.sender].isSubmitted, "Review already submitted");
    
    require(scores.length == 10, "Scores array must have 10 elements");
    
    // Validate each score individually
    for (uint i = 0; i < scores.length; i++) {
        require(scores[i] <= 10 && scores[i] > 0, "Scores must be between 1 and 10");
    }

    // Create the review
    LibDiamond.Review storage newReview = es.reviews[courseId][msg.sender];
    newReview.learnerAgency = scores[0];
    newReview.criticalThinking = scores[1];
    newReview.collaborativeLearning = scores[2];
    newReview.reflectivePractice = scores[3];
    newReview.adaptiveLearning = scores[4];
    newReview.authenticLearning = scores[5];
    newReview.technologyIntegration = scores[6];
    newReview.learnerSupport = scores[7];
    newReview.assessmentForLearning = scores[8];
    newReview.engagementAndMotivation = scores[9];
    newReview.isSubmitted = true;
    
    // Add review to the course reviews array
    es.courseReviews[courseId].push(newReview);
    
    emit ReviewSubmitted(courseId, msg.sender);

    uint256 totalScore = getTotalScore(newReview);
    if (totalScore >= LibDiamond.MIN_APPROVAL_SCORE) {
        approveCourse(courseId);
    }
}


    function validateScores(uint256 learnerAgency,uint256 criticalThinking,uint256 collaborativeLearning,uint256 reflectivePractice,uint256 adaptiveLearning,
        uint256 authenticLearning,uint256 technologyIntegration,uint256 learnerSupport,uint256 assessmentForLearning,uint256 engagementAndMotivation
        ) internal pure {
        require(
            learnerAgency <= 10 && criticalThinking <= 10 && collaborativeLearning <= 10 && reflectivePractice <= 10 &&
            adaptiveLearning <= 10 && authenticLearning <= 10 && technologyIntegration <= 10 &&
            learnerSupport <= 10 && assessmentForLearning <= 10 && engagementAndMotivation <= 10,
            "Scores must be between 1 and 10."
        );
    } 

    function getTotalScore(LibDiamond.Review storage review) internal view returns (uint256) {
        return review.learnerAgency + review.criticalThinking + review.collaborativeLearning + review.reflectivePractice + 
               review.adaptiveLearning + review.authenticLearning + review.technologyIntegration + review.learnerSupport + 
               review.assessmentForLearning + review.engagementAndMotivation;
    }

function isReviewer(uint256 courseId, address reviewer) internal view returns (bool) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    address[] storage reviewers = es.courseReviewers[courseId];
    
    for (uint256 i = 0; i < reviewers.length; i++) {
        if (reviewers[i] == reviewer) {
            return true;
        }
    }
    return false;
}

function reviewerPoolLength() public view returns (uint256) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    return es.reviewerPool.length;
}

function selectCourseReviewers(uint256 courseId) public onlyRole(LibDiamond.COURSE_OWNER_ROLE) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    
    require(es.courseObject[courseId].exists, "Course does not exist");
    require(es.courseObject[courseId].creator == msg.sender, "Only course creator can select reviewers");
    require(es.courseReviewers[courseId].length == 0, "Reviewers already selected");
    require(es.reviewerPool.length >= 3, "Not enough reviewers in the pool");

    uint256 selectedCount = 0;
    uint256 maxAttempts = es.reviewerPool.length * 2; // Prevent infinite loop
    uint256 attempts = 0;
    
    // Create a mapping to track selected reviewers
    mapping(address => bool) storage selectedReviewers = es.courseApprovals[courseId];

    while (selectedCount < 3 && attempts < maxAttempts) {
        attempts++;
        
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    attempts
                )
            )
        ) % es.reviewerPool.length;

        address potentialReviewer = es.reviewerPool[randomIndex];
        
        // Check if reviewer is not already selected and is not the course creator
        if (!selectedReviewers[potentialReviewer] && 
            potentialReviewer != es.courseObject[courseId].creator) {
            
            es.courseReviewers[courseId].push(potentialReviewer);
            selectedReviewers[potentialReviewer] = true;
            selectedCount++;
        }
    }

    require(selectedCount == 3, "Failed to select enough unique reviewers");
    
    emit ReviewersAssigned(courseId, es.courseReviewers[courseId]);
}

function approveCourse(uint256 courseId) public onlyRole(LibDiamond.REVIEWER_ROLE) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    
    LibDiamond.Course storage course = es.courses[courseId];
    require(!course.approved, "Course already approved");
    require(!es.courseApprovals[courseId][msg.sender], "Already approved");

    es.courseApprovals[courseId][msg.sender] = true;
    course.approvalCount++;

    if (course.approvalCount >= LibDiamond.REQUIRED_APPROVALS) {
        course.approved = true;
        
        emit CourseApproved(courseId, course.approvalCount);
        mintToken(course.creator, LibDiamond.CREATE_COURSE_REWARD);
    }
}

function getCourseReviewers(uint256 courseId) public view returns (address[] memory) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    return es.courseReviewers[courseId];
}

    //function to edit course
    function editCourse(uint256 _courseId, string memory _courseName) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) returns(bool) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();

        require(es.courseObject[_courseId].courseId != 0, "Course does not exist");
        es.courseObject[_courseId].courseName = _courseName;

        emit CourseEdited(_courseId, _courseName);

        return true;
    }

    //function to delete a course
    function deleteCourse(uint256 _courseId) external onlyRole(LibDiamond.COURSE_OWNER_ROLE) returns(bool) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();

        require(es.courseObject[_courseId].courseId != 0, "Course doesn't exist!");

        for(uint256 i = 0; i <= es.listOfCourses.length; i++) {
            if(es.listOfCourses[i].courseId == _courseId) {
                es.listOfCourses[i] = es.listOfCourses[es.listOfCourses.length - 1];
                es.listOfCourses.pop();
            }

        }

        delete(es.courseObject[_courseId]);

        emit CourseDeleteSuccess(_courseId, msg.sender);

        return true;
    }
}
