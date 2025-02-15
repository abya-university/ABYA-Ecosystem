// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../DiamondInterfaces/IDiamondCut.sol";
import "./EcosystemLib.sol";

error NoSelectorsProvidedForFacetForCut(address _facetAddress);
error IncorrectFacetCutAction(uint8 _action);
error CannotReplaceFunctionWithTheSameFunctionFromTheSameFacet(bytes4 _selector);
error CannotReplaceFunctionsFromFacetWithZeroAddress(bytes4[] _selectors);
error CannotReplaceImmutableFunction(bytes4 _selector);
error CannotReplaceFunctionThatDoesNotExists(bytes4 _selector);
error RemoveFacetAddressMustBeZeroAddress(address _facetAddress);
error CannotRemoveFunctionThatDoesNotExist(bytes4 _selector);
error CannotRemoveImmutableFunction(bytes4 _selector);

library LibDiamond {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.standard.diamond.storage");
    bytes32 constant ECOSYSTEM_STORAGE_POSITION = keccak256("ecosystem.base.storage");
    bytes32 constant ECOSYSTEM2_STORAGE_POSITION = keccak256("ecosystem2.base.storage");
    bytes32 constant ECOSYSTEM3_STORAGE_POSITION = keccak256("ecosystem3.base.storage");
    bytes32 constant ECOSYSTEM_DATA_STORAGE_POSITION = keccak256("diamond.ecosystem.data.storage");
    bytes32 constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 constant COURSE_OWNER_ROLE = keccak256("COURSE_OWNER_ROLE");

    uint256 public constant MAX_SUPPLY = 10000000000 * 10 ** 18;
    uint256 public constant ECOSYSTEM_POOL = (MAX_SUPPLY * 15) / 100;
    uint256 public constant CREATE_COURSE_REWARD = 5 * 10 ** 18;
    uint256 public constant ENROLLMENT_REWARD = 2 * 10 ** 18;
    uint256 public constant REQUIRED_APPROVALS = 2;
    uint256 public constant MAX_SCORE = 100;
    uint256 public constant MIN_APPROVAL_SCORE = 80;
    uint256 public constant COURSE_COMPLETION_REWARD = 2 * 10 ** 18;
    uint256 public constant QUIZ_COMPLETION_REWARD = 1 * 10 ** 18;

    struct FacetAddressAndPosition {
        address facetAddress;
        uint96 functionSelectorPosition;
    }

    struct FacetFunctionSelectors {
        bytes4[] functionSelectors; // Array of function selectors
    }

     struct FacetAddressAndSelectorPosition {
        address facetAddress;
        uint16 selectorPosition;
    }

    struct DiamondStorage {
        mapping(bytes4 => address) facets;
        address owner;
        address contractOwner;
         bytes4[] selectors;
        address[] facetAddresses;
        mapping(address => bool) authorizedFacets;
        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;
        mapping(bytes4 => FacetAddressAndSelectorPosition) facetAddressAndSelectorPosition;
        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition; // Ensure this line is correctly placed
        mapping(address => uint256) facetAddressPosition; // Added this line
        mapping(address => bytes4[]) facetToSelectors; // Added this line
        mapping(bytes4 => bool) supportedInterfaces; // Added this line
        mapping(bytes32 => mapping(address => bool)) roles;
    }

    //Struct to Hold EcosystemLib.Data
    struct EcosystemDataStorage {
        EcosystemLib.Data data;
    }

    //Ecosystem1Facet Storage
    struct EcosystemStorage {
        uint256 ecosystemPoolSupply;
        uint256 courseCount;
        uint256 nextCourseId;
        address[] reviewerPool;
        mapping(address => bool) isInReviewerPool;

        mapping(uint256 => Course) courseObject;
        mapping(uint256 => mapping(address => Review)) reviews;
        mapping(address => Account) accountCourses;
        mapping(uint256 => mapping(address => bool)) approvals;
        mapping(uint256 => Course) courses;
        mapping(uint256 => Review[]) courseReviews;
        mapping(uint256 => address[]) courseReviewers;
        mapping(address => uint256[]) userCourses;
        mapping(uint256 => mapping(address => bool)) courseApprovals;
        
        Course[] listOfCourses;
    }

    //Ecosystem2Facet Storage
    struct Ecosystem2Storage {
        mapping(uint256 => mapping(address => bool)) lessonRead;
        mapping(address => uint256[]) userCompletedLessons;
        mapping(address => mapping(uint256 => uint256[])) userCompletedLessonsByCourse;
        mapping(uint256 => Chapter) chapter;
        mapping(uint256 => Chapter[]) courseChapters;
        mapping(uint256 => Lesson) lesson;
        mapping(uint256 => string[]) chapterLessons;
        mapping(uint256 => Quiz) quizzes;
        mapping(uint256 => Question) questions;
        mapping(uint256 => mapping(address => bool)) isEnrolled;
        mapping(uint256 => mapping(address => bool)) completedQuizzes;
        mapping(address => mapping(uint256 => uint256[])) userCompletedQuizzesByCourse;
        mapping(address => mapping(uint256 => uint256)) userScores;

        Course[] listOfCourses;
        Chapter[] listOfChapters;
        Lesson[] listOfLessons;
        Resource[] listOfResources;
        Quiz[] listOfQuizzes;
        Question[] listOfQuestions;
        Choice[] listOfChoices;
    }

    struct Course {
        uint256 courseId;
        string courseName;
        string description;
        bool approved;
        uint256 approvalCount;
        address creator;
        bool exists;
        address[] enrolledStudents;
        DifficultyLevel difficultyLevel;
    }

    enum DifficultyLevel { Beginner, Intermediate, Advanced }

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
        uint256 courseId;
        uint256 chapterId;
        string chapterName;
        uint256 duration; // Duration in weeks
        bool exists;
    }

    struct Lesson {
        uint256 chapterId;
        uint256 lessonId;
        string lessonName;
        string lessonContent;
        Resource[10] additionalResources;
        uint256 resourceCount;
        bool exists;
    }

    enum ContentType { Video, Image, Document }

    struct Resource {
        ContentType contentType;
        string url;
        string name;
    }

    struct Quiz {
        uint256 lessonId;
        uint256 quizId;
        string quizTitle;
        Question[] questions;
        bool exists;
    }

    struct Question {
        uint256 quizId;
        uint256 questionId;
        string questionText;
        Choice[] choices;
    }

    struct Choice {
        string option;
        bool isCorrect;
    }

    //Ecosystem3Facet Storage
    struct Ecosystem3Storage {
        mapping(uint256 => mapping(address => bool)) courseCompleted;
        mapping(address => mapping(uint256 => uint256)) userScores;
        mapping(uint256 => mapping(address => bool)) completedQuizzes;
        mapping(uint256 => Certificate) certificates;

        Certificate[] listOfCertificates;
    }

    struct Certificate {
        uint256 certId;
        uint256 courseId;
        string learner;
        string cert_issuer;
        uint issue_date;
        string courseName;
        address owner;
    }

function diamondStorage() internal pure returns (DiamondStorage storage ds) {
    bytes32 position = DIAMOND_STORAGE_POSITION;
    assembly {
        ds.slot := position
    }
}


    function ecosystemStorage() internal pure returns (EcosystemStorage storage es) {
        bytes32 position = ECOSYSTEM_STORAGE_POSITION;
        assembly {
            es.slot := position
        }
    }

    function ecosystem2Storage() internal pure returns (Ecosystem2Storage storage es) {
        bytes32 position = ECOSYSTEM2_STORAGE_POSITION;
        assembly {
            es.slot := position
        }
    }

    function ecosystem3Storage() internal pure returns (Ecosystem3Storage storage es) {
        bytes32 position = ECOSYSTEM3_STORAGE_POSITION;
        assembly {
            es.slot := position
        }
    }

    function ecosystemDataStorage() internal pure returns (EcosystemDataStorage storage eds) { 
        bytes32 position = ECOSYSTEM_DATA_STORAGE_POSITION;
        assembly {
            eds.slot := position
        }
    }

    function initializeEcosystemData() internal {
        EcosystemDataStorage storage eds = ecosystemDataStorage();
        EcosystemLib.initialize(eds.data); // Call EcosystemLib's initialize function
    }

    function enforceIsContractOwner() internal view {
        require(msg.sender == diamondStorage().owner, "LibDiamond: Must be contract owner");
    }

    function setContractOwner(address _newOwner) internal {
        DiamondStorage storage ds = diamondStorage();
        ds.owner = _newOwner;
    }

     // Helper function to get reviewerPool length
    function getReviewerPoolLength() internal view returns (uint256) {
        return ecosystemStorage().reviewerPool.length;
    }

    // Helper function to check if address is in reviewer pool
    function isInReviewerPool(address reviewer) internal view returns (bool) {
        return ecosystemStorage().isInReviewerPool[reviewer];
    }

    function contractOwner() internal view returns (address contractOwner_) {
        contractOwner_ = diamondStorage().contractOwner;
    }

    function grantRole(bytes32 role, address account) internal {
        DiamondStorage storage ds = diamondStorage();
        ds.roles[role][account] = true;
    }

    function hasRole(bytes32 role, address account) internal view returns (bool) {
        DiamondStorage storage ds = diamondStorage();
        return ds.roles[role][account];
    }

    function diamondCut(
    IDiamondCut.FacetCut[] memory _diamondCut,
    address _init,
    bytes memory _calldata
) internal {
    for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
        bytes4[] memory functionSelectors = _diamondCut[facetIndex].functionSelectors;
        address facetAddress = _diamondCut[facetIndex].facetAddress;
        if(functionSelectors.length == 0) {
            revert NoSelectorsProvidedForFacetForCut(facetAddress);
        }
        if (facetAddress == address(0)) {
            revert CannotReplaceFunctionsFromFacetWithZeroAddress(functionSelectors);
        }
        IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;
        if (action == IDiamondCut.FacetCutAction.Add) {
            addFunctions(facetAddress, functionSelectors);
        } else if (action == IDiamondCut.FacetCutAction.Replace) {
            replaceFunctions(facetAddress, functionSelectors);
        } else if (action == IDiamondCut.FacetCutAction.Remove) {
            removeFunctions(facetAddress, functionSelectors);
        } else {
            revert IncorrectFacetCutAction(uint8(action));
        }
    }
    emit IDiamondCut.DiamondCut(_diamondCut, _init, _calldata);
    initializeDiamondCut(_init, _calldata);
}

    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        require(_functionSelectors.length > 0, "LibDiamondCut: No selectors in facet to cut");
        DiamondStorage storage ds = diamondStorage();
        require(_facetAddress != address(0), "LibDiamondCut: Add facet can't be address(0)");
        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);
        if (selectorPosition == 0) {
            addFacet(_facetAddress);
        }
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress == address(0), "LibDiamondCut: Can't add function that already exists");
            ds.selectorToFacetAndPosition[selector].facetAddress = _facetAddress;
            ds.selectorToFacetAndPosition[selector].functionSelectorPosition = selectorPosition;
            ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(selector);
            ds.facetToSelectors[_facetAddress].push(selector); // Add this line to update facetToSelectors
            selectorPosition++;
        }
    }

    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {        
        DiamondStorage storage ds = diamondStorage();
        if(_facetAddress == address(0)) {
            revert CannotReplaceFunctionsFromFacetWithZeroAddress(_functionSelectors);
        }
        enforceHasContractCode(_facetAddress, "LibDiamondCut: Replace facet has no code");
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.facetAddressAndSelectorPosition[selector].facetAddress;
            // can't replace immutable functions -- functions defined directly in the diamond in this case
            if(oldFacetAddress == address(this)) {
                revert CannotReplaceImmutableFunction(selector);
            }
            if(oldFacetAddress == _facetAddress) {
                revert CannotReplaceFunctionWithTheSameFunctionFromTheSameFacet(selector);
            }
            if(oldFacetAddress == address(0)) {
                revert CannotReplaceFunctionThatDoesNotExists(selector);
            }
            // replace old facet address
            ds.facetAddressAndSelectorPosition[selector].facetAddress = _facetAddress;
        }
    }

    function addFacet(address _facetAddress) internal {
        DiamondStorage storage ds = diamondStorage();
        enforceHasContractCode(_facetAddress, "LibDiamondCut: New facet has no code");
        ds.facetAddresses.push(_facetAddress);
        ds.authorizedFacets[_facetAddress] = true;
    }

    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {        
        DiamondStorage storage ds = diamondStorage();
        uint256 selectorCount = ds.selectors.length;
        if(_facetAddress != address(0)) {
            revert RemoveFacetAddressMustBeZeroAddress(_facetAddress);
        }        
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            FacetAddressAndSelectorPosition memory oldFacetAddressAndSelectorPosition = ds.facetAddressAndSelectorPosition[selector];
            if(oldFacetAddressAndSelectorPosition.facetAddress == address(0)) {
                revert CannotRemoveFunctionThatDoesNotExist(selector);
            }
            
            
            // can't remove immutable functions -- functions defined directly in the diamond
            if(oldFacetAddressAndSelectorPosition.facetAddress == address(this)) {
                revert CannotRemoveImmutableFunction(selector);
            }
            // replace selector with last selector
            selectorCount--;
            if (oldFacetAddressAndSelectorPosition.selectorPosition != selectorCount) {
                bytes4 lastSelector = ds.selectors[selectorCount];
                ds.selectors[oldFacetAddressAndSelectorPosition.selectorPosition] = lastSelector;
                ds.facetAddressAndSelectorPosition[lastSelector].selectorPosition = oldFacetAddressAndSelectorPosition.selectorPosition;
            }
            // delete last selector
            ds.selectors.pop();
            delete ds.facetAddressAndSelectorPosition[selector];
        }
    }

    function initializeDiamondCut(address _init, bytes memory _calldata) internal {
        if (_init == address(0)) {
            require(_calldata.length == 0, "LibDiamondCut: _init is address(0) but_calldata is not empty");
        } else {
            require(_calldata.length > 0, "LibDiamondCut: _calldata is empty but _init is not address(0)");
            if (_init != address(this)) {
                enforceHasContractCode(_init, "LibDiamondCut: _init address has no code");
            }
            (bool success, bytes memory error) = _init.delegatecall(_calldata);
            if (!success) {
                if (error.length > 0) {
                    // bubble up the error
                    assembly {
                        let returndata_size := mload(error)
                        revert(add(32, error), returndata_size)
                    }
                } else {
                    revert("LibDiamondCut: _init function reverted");
                }
            }
        }
    }

    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(_contract)
        }
        require(contractSize > 0, _errorMessage);
    }
}
