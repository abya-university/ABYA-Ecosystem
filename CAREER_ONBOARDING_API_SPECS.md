# Career Onboarding API Specifications

## Overview

This document describes the updated ProfileSurveyForm submission payload and expected API response format for the career onboarding agent.

## Changes Made to ProfileSurveyForm

### 1. **New Imports**

- Added `useContext` hook
- Imported `CourseContext` to access all platform courses

### 2. **New State Variables**

- `careerRecommendation`: Stores AI agent's analysis response
- `finalCourseId`: Tracks the course ID user wants to enroll in (can be updated based on recommendations)

### 3. **Enhanced Payload**

The form submission now includes two additional fields:

```javascript
{
  // ... all existing fields ...

  // NEW FIELDS:
  "allCourses": [
    {
      "courseId": "1",
      "courseName": "Introduction to Blockchain"
    },
    {
      "courseId": "2",
      "courseName": "Smart Contract Development"
    }
    // ... all courses in the platform
  ],

  "selectedCourse": {
    "courseId": "1",
    "courseName": "Introduction to Blockchain"
  }
}
```

### 4. **New Flow**

- User fills out survey form
- On submission, data is sent to the career onboarding API
- API analyzes user profile and returns recommendations
- User sees their career profile and course suggestions
- User can change their selected course
- User clicks "Continue Enrollment" to finalize

---

## Expected API Response Format

Your backend API should return a JSON response with the following structure:

```javascript
{
  // Required: Career profile summary for the user
  "careerProfile": "Based on your background in software development and interest in blockchain, you have a strong foundation for Web3 development. Your 3 years of experience in JavaScript makes you well-suited for smart contract development.",

  // Required: Analysis of how well the selected course matches the user's profile
  "courseMatchAnalysis": "The course 'Introduction to Blockchain' is an excellent starting point for your career goals. It aligns well with your interest in decentralized systems and provides the foundational knowledge needed for your target role as a Blockchain Developer.",

  // Optional: Array of alternative course recommendations
  "suggestedCourses": [
    {
      "courseId": "2",
      "courseName": "Smart Contract Development",
      "reason": "This course builds on blockchain fundamentals and directly relates to your target role. Given your JavaScript background, you'll find the Solidity syntax familiar."
    },
    {
      "courseId": "5",
      "courseName": "DeFi Development",
      "reason": "Your interest in financial systems and blockchain makes this an ideal next step after completing foundational courses."
    }
  ],

  // Optional: Additional recommendations or notes
  "additionalNotes": "Consider completing the Introduction to Blockchain course first, then progressing to Smart Contract Development within your 3-6 month timeline."
}
```

### Response Field Descriptions

| Field                           | Type   | Required               | Description                                                                         |
| ------------------------------- | ------ | ---------------------- | ----------------------------------------------------------------------------------- |
| `careerProfile`                 | string | Yes                    | A comprehensive analysis of the user's career background, skills, and goals         |
| `courseMatchAnalysis`           | string | Yes                    | Explanation of how well the user's selected course aligns with their career profile |
| `suggestedCourses`              | array  | No                     | List of alternative courses that match the user's profile                           |
| `suggestedCourses[].courseId`   | string | Yes (if array present) | Must match a courseId from the `allCourses` array sent in the request               |
| `suggestedCourses[].courseName` | string | Yes (if array present) | The name of the suggested course                                                    |
| `suggestedCourses[].reason`     | string | No                     | Explanation of why this course is recommended                                       |
| `additionalNotes`               | string | No                     | Any extra guidance or recommendations                                               |

---

## UI Flow

### 1. **Survey Form Submission**

- User completes the career onboarding survey
- Form validates all required fields
- Submits to API with user data, all courses, and selected course

### 2. **Career Recommendation Display**

Shows:

- ✅ Career Profile Summary
- ✅ Selected Course Match Analysis
- ✅ Alternative Course Recommendations (clickable)
- ✅ Confirmation question: "Do you want to continue enrolling in this course?"
- ✅ Current selection display
- ✅ "Continue Enrollment" button

### 3. **User Actions**

- **Click on suggested course**: Updates `finalCourseId` and shows checkmark
- **Click Cancel**: Closes modal without enrolling
- **Click Continue Enrollment**: Proceeds with enrollment using `finalCourseId`

### 4. **Enrollment Completion**

- Shows success animation
- Calls `onFormComplete(finalCourseId)` callback
- Redirects to dashboard

---

## Integration Example

### Backend API Endpoint

```
POST http://localhost:8000/api/career-onboarding
```

### Environment Variable

Set in `.env` file:

```
VITE_CAREER_ONBOARDING_API=http://localhost:8000/api/career-onboarding
```

### Sample Request Payload

```json
{
  "currentStatus": "employed",
  "industryBackground": "Software Development",
  "technicalLevel": "intermediate",
  "programmingLanguages": ["JavaScript", "Python"],
  "hasBlockchainExp": "no",
  "hasAIExp": "yes",
  "targetRole": ["Blockchain Developer", "Smart Contract Engineer"],
  "careerTimeline": "3-6 months",
  "learningStyle": "hands-on",
  "timeCommitment": "5-10 hours/week",
  "shortTermGoal": "Transition into Web3 development",
  "agreeToTerms": true,
  "submittedAt": "2026-02-05T12:00:00.000Z",
  "walletAddress": "0x123...",
  "allCourses": [
    { "courseId": "1", "courseName": "Introduction to Blockchain" },
    { "courseId": "2", "courseName": "Smart Contract Development" },
    { "courseId": "3", "courseName": "DApp Development" }
  ],
  "selectedCourse": {
    "courseId": "1",
    "courseName": "Introduction to Blockchain"
  }
}
```

### Sample Response

```json
{
  "careerProfile": "You have a solid programming foundation with JavaScript and Python, which positions you well for blockchain development. Your intermediate technical level means you can grasp complex concepts with proper guidance.",
  "courseMatchAnalysis": "The Introduction to Blockchain course is perfect for your situation. It provides the foundational knowledge you need before diving into smart contract development, and aligns with your 3-6 month timeline.",
  "suggestedCourses": [
    {
      "courseId": "2",
      "courseName": "Smart Contract Development",
      "reason": "After mastering blockchain basics, this course will leverage your JavaScript knowledge to teach Solidity development."
    }
  ]
}
```

---

## Notes for AI Agent Development

1. **Context Analysis**: Use all survey fields to build a comprehensive career profile
2. **Course Matching**: Compare user skills/goals with course descriptions from `allCourses`
3. **Personalization**: Reference specific details from user's responses in recommendations
4. **Progression Path**: Suggest courses in logical learning order
5. **Skill Gaps**: Identify and recommend courses that address areas user wants to improve
6. **Timeline Alignment**: Consider user's `careerTimeline` and `timeCommitment`

---

## Testing Checklist

- [ ] API receives `allCourses` and `selectedCourse` in payload
- [ ] API returns properly formatted response
- [ ] Career profile displays correctly
- [ ] Course match analysis shows for selected course
- [ ] Suggested courses are clickable and update selection
- [ ] Selected course shows checkmark indicator
- [ ] "Continue Enrollment" button works
- [ ] Final enrollment uses the correct course ID
- [ ] Modal closes properly on completion
- [ ] Toast notifications appear appropriately
