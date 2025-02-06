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

    bytes32 public constant COURSE_OWNER_ROLE = keccak256("COURSE_OWNER_ROLE");


    // Events
    event CourseCreationSuccess(uint256 indexed _courseID, string indexed _courseName, bool _approved);
    event EcosystemPoolUpdate(address indexed _to, uint256 indexed _amount);
    event CourseCreated(uint256 indexed courseId, string courseName, address creator);
    event CourseApproved(uint256 indexed courseId, uint256 approvalCount);
    event ReviewSubmitted(uint256 indexed courseId, address reviewer);
    event ReviewersAssigned(uint256 indexed courseId, address[] reviewers);
    event CourseEdited(uint256 indexed _courseId, string _courseName);
    event CourseDeleteSuccess(uint256 indexed _courseId, address owner);
    event RoleGranted(address indexed account, bytes32 indexed role);
    event DebugRoleCheck(address account, bytes32 role, bool hasRole);
    event DebugStorageAccess(address account, bytes32 role, bool roleValue);

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

    function grantRole(bytes32 role, address account) public {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.roles[role][account] = true; // Ensure the role is granted correctly
        emit RoleGranted(account, role); // Emit event for role granting
        emit RoleGranted(account, role);
        
        // Debug event
        emit DebugRoleCheck(account, role, ds.roles[role][account]);
    }


    function createCourse(string memory _courseName, string memory _description, LibDiamond.DifficultyLevel _difficultyLevel) external returns(bool) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        
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
        
        // Grant the COURSE_OWNER_ROLE using Diamond storage
        ds.roles[COURSE_OWNER_ROLE][msg.sender] = true;
        emit DebugStorageAccess(msg.sender, COURSE_OWNER_ROLE, ds.roles[COURSE_OWNER_ROLE][msg.sender]);
        
        // Also try library method
        LibDiamond.grantRole(COURSE_OWNER_ROLE, msg.sender);
        
        // Verify role assignment
        bool hasRole = checkRole(msg.sender, COURSE_OWNER_ROLE);
        emit DebugRoleCheck(msg.sender, COURSE_OWNER_ROLE, hasRole);
        
        es.nextCourseId++;

        emit CourseCreationSuccess(es.nextCourseId - 1, _courseName, false); // Emit course creation success event
        emit RoleGranted(msg.sender, COURSE_OWNER_ROLE); // Emit event for role granted
        emit RoleGranted(msg.sender, COURSE_OWNER_ROLE);

        return true;
    }

    // Update the hasRole check to use Diamond storage
    function hasCourseOwnerRole(address account) public view returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.roles[COURSE_OWNER_ROLE][account];
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

    // Token Minting and Burning Functions
    function mintToken(address to, uint256 amount) internal returns(bool) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        require(amount + es.ecosystemPoolSupply <= LibDiamond.ECOSYSTEM_POOL, "Limit Exceeded!");
        
        // TODO: Implement actual token minting logic
        mintToken(to, amount);
        
        // es.ecosystemPoolSupply += amount; // Commented out as unreachable code

        emit EcosystemPoolUpdate(to, amount);

        return true;
    }

    function burn(address account, uint256 amount) internal {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        burn(account, amount);
        
        // es.ecosystemPoolSupply -= amount; // Commented out as unreachable code
    }

    function getCurrentEcosystemPoolSupply() public view returns(uint256) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        return es.ecosystemPoolSupply;
    }


function submitReview(uint256 courseId, uint256[10] memory scores) public onlyRole(LibDiamond.REVIEWER_ROLE) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    
    require(isReviewer(courseId, msg.sender), "Not a reviewer for this course");
    require(scores.length == 10, "Scores array must have 10 elements");
    
    validateScores(scores[0], scores[1], scores[2], scores[3], scores[4], 
                   scores[5], scores[6], scores[7], scores[8], scores[9]);

    // Create the review directly in storage
    LibDiamond.Review storage newReview = es.courseReviews[courseId].push();
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
    
    emit ReviewSubmitted(courseId, msg.sender);

    if (getTotalScore(newReview) >= LibDiamond.MIN_APPROVAL_SCORE) {
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

function selectCourseReviewers(uint256 courseId) public onlyRole(COURSE_OWNER_ROLE) {
    LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
    
    require(es.courseReviewers[courseId].length == 0, "Reviewers already selected");
    require(es.reviewerPool.length >= 3, "Not enough reviewers in the pool");

    for (uint256 i = 0; i < 3; i++) {
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp, 
                    block.prevrandao, 
                    es.reviewerPool.length, 
                    i
                )
            )
        ) % es.reviewerPool.length;
    
        address selectedReviewer = es.reviewerPool[randomIndex];
    
        bool alreadySelected = false;
        for (uint256 j = 0; j < es.courseReviewers[courseId].length; j++) {
            if (es.courseReviewers[courseId][j] == selectedReviewer) {
                alreadySelected = true;
                break;
            }
        }
    
        if (!alreadySelected) {
            es.courseReviewers[courseId].push(selectedReviewer);
        }
    }

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
    function editCourse(uint256 _courseId, string memory _courseName) external onlyRole(COURSE_OWNER_ROLE) returns(bool) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();

        require(es.courseObject[_courseId].courseId != 0, "Course does not exist");
        es.courseObject[_courseId].courseName = _courseName;

        emit CourseEdited(_courseId, _courseName);

        return true;
    }

    //function to delete a course
    function deleteCourse(uint256 _courseId) external onlyRole(COURSE_OWNER_ROLE) returns(bool) {
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
