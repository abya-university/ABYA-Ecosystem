# Bulk Course Upload Feature Documentation

## Overview

The Bulk Course Upload feature allows course creators to upload an entire course structure (chapters, lessons, quizzes, resources) at once using a JSON file. The system includes:

- **Sequential execution** with dependency handling
- **Real-time progress tracking** with terminal-like logs
- **Preview validation** before upload
- **Comprehensive error handling**

## Features

### 1. File Upload & Validation

- Upload a JSON file containing complete course structure
- Real-time validation against schema
- Detailed error messages for invalid fields
- Built-in JSON schema documentation in the UI

### 2. Preview Section

- Hierarchical tree view of the entire course structure
- Shows all chapters, lessons, quizzes, questions, and resources
- Easy-to-read formatting with counts and metadata
- Visual verification before execution

### 3. Sequential Execution

The upload process follows a strict sequence to handle dependencies:

```
1. Create Course
   ↓ (returns courseId)
2. Create Chapters (batch)
   ↓ (returns chapterIds[])
3. For each Chapter:
   Create Lessons
   ↓ (returns lessonId)
4. For each Lesson:
   Create Quizzes
   ↓ (returns quizId)
5. For each Quiz:
   Create Questions
6. For each Lesson:
   Create Resources
```

**Important:** If any step fails, the process stops immediately. No subsequent steps will execute.

### 4. Progress Tracking

- Real-time percentage progress bar
- Current step display
- Terminal-like logs with timestamps
- Different log colors for info, success, and error messages
- Scrollable log history

## JSON Format

### Complete Schema

```json
{
  "course": {
    "name": "string (required)",
    "description": "string (required)",
    "difficultyLevel": "number (0=Beginner, 1=Intermediate, 2=Advanced)",
    "priceUSDCUnits": "number (required)",
    "imageUrl": "string (URL, required)",
    "chapters": [
      {
        "name": "string (required)",
        "duration": "string (e.g., '2 hours', required)",
        "lessons": [
          {
            "name": "string (required)",
            "content": "string (required)",
            "quizzes": [
              {
                "title": "string (required)",
                "questions": [
                  {
                    "question": "string (required)",
                    "options": ["string", "string", ...] (minimum 2, required),
                    "correctIndex": "number (0-based, required)"
                  }
                ]
              }
            ],
            "resources": [
              {
                "name": "string (required)",
                "contentType": "Video|Image|Document (required)",
                "link": "string (URL, required)"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Field Validation Rules

| Field                    | Type   | Requirements                          |
| ------------------------ | ------ | ------------------------------------- |
| `course.name`            | String | Required, non-empty                   |
| `course.description`     | String | Required, non-empty                   |
| `course.difficultyLevel` | Number | 0, 1, or 2                            |
| `course.priceUSDCUnits`  | Number | Required, positive                    |
| `course.imageUrl`        | String | Required, valid URL                   |
| `chapter.name`           | String | Required, non-empty                   |
| `chapter.duration`       | String | Required, non-empty (e.g., "2 hours") |
| `lesson.name`            | String | Required, non-empty                   |
| `lesson.content`         | String | Required, non-empty                   |
| `quiz.title`             | String | Required, non-empty                   |
| `question.question`      | String | Required, non-empty                   |
| `question.options`       | Array  | Minimum 2 items                       |
| `question.correctIndex`  | Number | 0 to (options.length - 1)             |
| `resource.name`          | String | Required, non-empty                   |
| `resource.contentType`   | String | "Video", "Image", or "Document"       |
| `resource.link`          | String | Required, valid URL                   |

## Component Hierarchy

The bulk upload component imports and uses functions from multiple contexts:

```
BulkCourseUpload.jsx
├── CourseContext → createCourse()
├── ChapterContext → createChapters()
├── LessonContext → createLesson()
└── QuizContext
    ├── createQuiz()
    ├── createQuestionWithChoices()
    └── addLessonResource()
```

## Context Method Returns

Each context method now returns an object with the required IDs:

### createCourse()

```javascript
{
  receipt: TransactionReceipt,
  imageIpfsHash: string,
  courseId: string  // ← Used in next step
}
```

### createChapters()

```javascript
{
  receipt: TransactionReceipt,
  chapterIds: string[]  // ← Used in next step
}
```

### createLesson()

```javascript
{
  receipt: TransactionReceipt,
  lessonId: string  // ← Used in next step
}
```

### createQuiz()

```javascript
{
  receipt: TransactionReceipt,
  quizId: string  // ← Used in next step
}
```

## Error Handling

The system handles errors at each step:

1. **Validation Errors** - Caught before preview
2. **Connection Errors** - Wallet must be connected
3. **Transaction Errors** - Blockchain transaction failures
4. **Dependency Failures** - If courseId not returned, chapters won't create

Error messages appear in the progress logs with `❌` icon and red text.

## Usage

### Route

Access the bulk upload feature at: `/bulk-course-upload`

### Steps

1. Navigate to the bulk upload page
2. Select a JSON file
3. Review validation results (if any errors, fix and re-upload)
4. Preview the course structure
5. Click "Confirm & Upload"
6. Monitor progress in the terminal-like interface
7. Once complete, upload another course or navigate away

## Sample Course JSON

See `sample-course.json` in the project root for a complete working example with:

- 3 chapters
- Multiple lessons per chapter
- Quizzes with multiple questions
- Various resource types (Video, Image, Document)

## Important Notes

### Image Handling

Current implementation expects the course image URL to be included in the JSON. The backend system will validate and use this URL. For future enhancements, you might:

- Add base64 image encoding in the JSON
- Implement direct file upload within the form
- Use CDN links for images

### Limits and Scalability

- **Chapter Creation:** Uses batch API for efficiency
- **Lesson Creation:** Sequential (one per request) - consider batching if needed
- **Questions:** Multiple requests per quiz
- **Resources:** Multiple requests per lesson

### Large Course Considerations

For very large courses (100+ lessons), consider:

1. Implementing resume functionality
2. Splitting into multiple uploads
3. Showing memory usage in progress
4. Adding timeout/retry logic

## Troubleshooting

| Issue                         | Solution                                         |
| ----------------------------- | ------------------------------------------------ |
| "Invalid JSON format"         | Validate JSON syntax at jsonlint.com             |
| "Missing required field"      | Check field names and types match schema         |
| Upload stops midway           | Check blockchain gas limits and network status   |
| Progress bar stuck            | Check browser console for errors, may need retry |
| Course created but incomplete | Check logs for which step failed                 |

## Future Enhancements

1. **PDF Support**

   - Use PDF parser to extract hierarchical structure
   - Optional AI-powered PDF parsing for unstructured content
   - Manual mapping UI for flexibility

2. **Batch Resume**

   - Save upload state
   - Resume from last successful step
   - Rollback options

3. **Template System**

   - Pre-made course templates
   - Quick-start courses
   - Clone existing courses

4. **Advanced Validation**

   - Spelling and grammar check
   - Content length recommendations
   - Required field highlighting

5. **Metrics Dashboard**
   - Upload statistics
   - Success/failure rates
   - Average upload time
   - Content size analysis

## Security Considerations

1. **File Validation** - JSON structure validated before processing
2. **SQL Injection** - Not applicable (blockchain-based)
3. **XSS** - All user input is treated as data
4. **Transaction Limits** - Each step is a separate transaction
5. **Wallet Security** - Uses thirdweb's secure wallet connection

## Performance Tips

1. **Network Speed** - Use stable internet for uploads
2. **Gas Fees** - Check gas prices before uploading large courses
3. **Concurrent Uploads** - Avoid uploading multiple courses simultaneously
4. **Cache** - Browser caches JSON for faster previews
