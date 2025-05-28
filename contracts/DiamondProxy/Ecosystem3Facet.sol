// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { LibDiamond } from "./DiamondLibrary/LibDiamond.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Ecosystem3Facet is ReentrancyGuard {
    using LibDiamond for LibDiamond.DiamondStorage;

    uint256 public constant COURSE_COMPLETION_REWARD = 2 * 10 ** 18;
    uint256 public constant QUIZ_COMPLETION_REWARD = 1 * 10 ** 18;

    // events
    event CourseDeleteSuccess(uint256 indexed _courseId, address owner);
    
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
    event EcosystemPoolUpdate(address indexed _to, uint256 indexed _amount);


    //Ecosystem3Facet Storage Pointer
    function ecosystem3Storage() internal pure returns (LibDiamond.Ecosystem3Storage storage es) {
        return LibDiamond.ecosystem3Storage();
    }

    function mintToken(address to, uint256 amount) internal returns(bool) {
        LibDiamond.EcosystemStorage storage es = LibDiamond.ecosystemStorage();
        
        require(amount + es.ecosystemPoolSupply <= LibDiamond.ECOSYSTEM_POOL, "Limit Exceeded!");
        
        // TODO: Implement actual token minting logic
        // mintToken(to, amount);
        
        es.ecosystemPoolSupply += amount;

        emit EcosystemPoolUpdate(to, amount);

        return true;
    }

    //function to award/issue certificate
    function issueCertificate(uint256 _courseId, string memory learner, string memory courseName, string memory cert_issuer, uint issue_date) public returns (uint256, LibDiamond.Certificate memory) {
        LibDiamond.Ecosystem3Storage storage es = ecosystem3Storage();

        // require(es.isEnrolled[_courseId][msg.sender], "You must be enrolled in the course to complete it");
        require(!es.courseCompleted[_courseId][msg.sender], "Already completed this course");

        // Mark course as completed
        es.courseCompleted[_courseId][msg.sender] = true;

        // Generate a unique certificate ID using a hash and convert it to uint256
        uint256 certificateId = uint256(keccak256(abi.encodePacked(_courseId, learner, courseName, cert_issuer, issue_date, block.timestamp)));

        // Create and store the certificate
        LibDiamond.Certificate memory newCert = LibDiamond.Certificate({
            certId: certificateId,
            learner: learner,
            courseId: _courseId,
            courseName: courseName,
            cert_issuer: cert_issuer,
            issue_date: issue_date,
            owner: msg.sender
        });

        es.certificates[certificateId] = newCert;
        es.listOfCertificates.push(newCert);

        // Award tokens for course completion
        // mintToken(msg.sender, LibDiamond.COURSE_COMPLETION_REWARD);

        emit CertificateIssued(certificateId, courseName, cert_issuer, learner);

        // Return the certificate details and the unique certificate ID
        return (certificateId, newCert);
    }

    // Function to get all certificates of a user
function getCertificates(address _owner) public view returns (LibDiamond.Certificate[] memory) {
    LibDiamond.Ecosystem3Storage storage es = ecosystem3Storage();
    
    // First, count the number of certificates owned by this user
    uint256 count = 0;
    for (uint256 i = 0; i < es.listOfCertificates.length; i++) {
        if (es.listOfCertificates[i].owner == _owner) {
            count++;
        }
    }

    // Create an array to hold the certificates
    LibDiamond.Certificate[] memory result = new LibDiamond.Certificate[](count);
    
    // Fill the array with certificates owned by the user
    uint256 index = 0;
    for (uint256 i = 0; i < es.listOfCertificates.length; i++) {
        if (es.listOfCertificates[i].owner == _owner) {
            result[index] = es.listOfCertificates[i];
            index++;
        }
    }

    return result;
}


}