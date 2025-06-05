//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

library EcosystemLib {
    struct Data {
        uint256 nextCourseId;
        uint256 nextChapterId;
        uint256 nextLessonId;
        uint256 nextQuizId;
        uint256 nextQuestionId;
        uint256 nextChoiceId;
    }

    function initialize(Data storage self) internal {
        self.nextCourseId = 1;
        self.nextChapterId = 1;
        self.nextLessonId = 1;
        self.nextQuizId = 1;
        self.nextQuestionId = 1;
        self.nextChoiceId = 1;
    }
}