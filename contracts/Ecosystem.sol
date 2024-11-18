//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ecosystem is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10000000000 * 10 ** 18;
    uint256 public constant ECOSYSTEM_POOL = (MAX_SUPPLY * 15) / 100;
    uint256 public constant CREATE_COURSE_REWARD = 5 * 10 ** 18;
    uint256 public constant REQUIRED_APPROVALS = 1;
    uint256 public constant MAX_SCORE = 100; 
    uint256 public constant MIN_APPROVAL_SCORE = 80;


    uint256 public ecosystemPoolSupply;

    address public initialOwner;

    uint256 public courseCount;

    uint256 public nextCourseId;

    address[] public admins;

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


    mapping(uint256 => Course) public courseObject;
    mapping(uint256 => mapping(address => Review)) public reviews;
    mapping(address => Account) public accountCourses;
    mapping(address => mapping(uint256 => bool)) public approvals;
    mapping(address => bool) public isAdminMap;

    Course[] public listOfCourses;


    event MintSuccess(address indexed _to, uint256 indexed _amount);
    event CourseCreationSuccess(uint256 indexed _courseID, string indexed _courseName, bool _approved);
    event EcosystemPoolUpdate(address indexed _to, uint256 indexed _amount);
    event BurnSuccess(address indexed _account, uint256 _amount);

    modifier onlyAdmin() {
        require(isAdminMap[msg.sender], "Caller is not an admin");
        _;
    }

    constructor(address[] memory _admins) ERC20("ABYA TOKEN", "ABYTKN") Ownable(initialOwner) {
        initialOwner = msg.sender;
        require(_admins.length >= 2, "At least 2 admins are required");
        admins = _admins;
        for (uint256 i = 0; i < _admins.length; i++) {
            isAdminMap[_admins[i]] = true;
        }
        nextCourseId = 1;
    }

    //function to mint token
    function mintToken(address to, uint256 amount) internal returns(bool){
        require(amount + getCurrentEcosystemPoolSupply() <= ECOSYSTEM_POOL, "Limit Exceeded!");

        _mint(to, amount);

        ecosystemPoolSupply += amount;

        emit MintSuccess(to, amount);
        emit EcosystemPoolUpdate(to, amount);

        return true;
    }

    //burn token function
    function burn(address account, uint256 amount) public virtual {
        require(balanceOf(account) >= amount, "Insufficient balance");
        _burn(account, amount);
    
        // Update ecosystem pool supply
        ecosystemPoolSupply -= amount;
    
        emit BurnSuccess(account, amount);
    }


    //function to get the ecosystem pool total supply
    function getCurrentEcosystemPoolSupply() public view returns(uint256) {
        return ecosystemPoolSupply;
    }


    // function to create course
    function createCourse(string memory _courseName, string memory _description) external returns(bool) {
        require(nextCourseId > 0, "All course IDs have been assigned");
        require(courseObject[nextCourseId].creator == address(0), "Course ID already exists");

        Course memory newCourse = Course(nextCourseId,_courseName, _description, false, 0, msg.sender);
        courseObject[nextCourseId] = newCourse;

        listOfCourses.push(newCourse);

        courseCount++;
        accountCourses[msg.sender].courseCount += 1;
        nextCourseId++;

        emit CourseCreationSuccess(nextCourseId - 1, _courseName, courseObject[nextCourseId - 1].approved);

        return true;
    }

    function addAdmin(address newAdmin) public onlyAdmin {
        require(!isAdminMap[newAdmin], "Address is already an admin");
        admins.push(newAdmin);
        isAdminMap[newAdmin] = true;
    }

    function removeAdmin(address admin) public onlyOwner {
        require(isAdminMap[admin], "Address is not an admin");
        // Find and remove the admin from the array
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == admin) {
                admins[i] = admins[admins.length - 1];
                admins.pop();
                isAdminMap[admin] = false;
                break;
            }
        }
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
    ) public onlyAdmin {
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

    function approveCourse(uint256 _courseId) internal onlyAdmin {
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

}