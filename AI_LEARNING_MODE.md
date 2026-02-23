## 📋 Dr. Kwame Learning Assistant - Hybrid Approach

### **System Overview**

Dr. Kwame is a context-aware AI learning assistant integrated into the course learning experience. The hybrid approach combines:
- **Context-aware chatbot** that understands current course/chapter content
- **Inline term helpers** with definitions and quick context triggers
- **Seamless interaction** between course content and Dr. Kwame's assistance

---

## 🎯 **The Hybrid Approach: Context-Aware Chatbot + Inline Helpers**

---

## 🎨 **Implementation Status**

### **Phase 1: ✅ COMPLETED**
- ✅ Dr. Kwame chatbot with learning mode
- ✅ Context awareness (course/chapter detection)
- ✅ Contextual messaging and UI
- ✅ `/api/student/learning-mode` endpoint integration

### **Phase 2: ✅ COMPLETED**
- ✅ Inline helpers for content highlights
- ✅ HighlightedTerm component with tooltips
- ✅ LessonContentRenderer for marked terms
- ✅ "Ask Dr. Kwame about this" button on every term
- ✅ Term context passed to chatbot

### **Phase 3: 🚀 IN PROGRESS**
- Proactive assistance based on user behavior
- Learning challenges tracking
- Predictive difficulty detection
- Personalized quiz generation

---

## 📝 **How to Upload Lesson Content with Inline Helpers**

### **Syntax Guide**

Use the following syntax to mark important terms in lesson content:

```
[[term:definition]]
```

### **Example**

Instead of plain text:
```
Understanding gas fees requires knowledge of smart contracts.
```

Use marked-up text with Dr. Kwame helpers:
```
Understanding [[Gas Fees:The cost to execute transactions on the blockchain]] requires 
knowledge of [[Smart Contracts:Self-executing code deployed on blockchain that automates actions]].
```

### **Step-by-Step Guide**

#### **1. Create Lesson Content**

When creating or editing lesson content, identify key terms that learners might struggle with:
- Technical terminology
- Concepts specific to the domain
- Words with multiple meanings

#### **2. Mark Terms with Syntax**

Wrap each important term with `[[term:definition]]`:

```markdown
[[Cryptocurrency:Digital currency that uses cryptography for security and operates on blockchain]]
[[Blockchain:Distributed ledger technology that records transactions in blocks]]
[[Smart Contracts:Code that automatically executes when conditions are met]]
```

#### **3. Upload Lesson**

When you create/update a lesson with marked terms:

```javascript
const lessonContent = `
Learning about [[Consensus Mechanisms:Rules that help the network agree on transactions]] is crucial.
Different blockchains use different mechanisms like [[Proof of Work:Solving complex puzzles to validate blocks]]
or [[Proof of Stake:Validators chosen based on their stake in the network]].
`;

// Upload this content to your lesson
```

#### **4. Frontend Automatically Processes**

The `LessonContentRenderer` component automatically:
- Extracts all `[[term:definition]]` markers
- Renders highlighted terms with blue dashed underline
- Shows definition on hover
- Displays "Ask Dr. Kwame about this" button
- Passes term context to chatbot when clicked

### **What Users See**

1. **Normal Reading**
   - They see: "Understanding Gas Fees requires knowledge of Smart Contracts."
   - Important terms are highlighted with subtle blue underline

2. **On Hover**
   - Tooltip appears with definition
   - "Ask Dr. Kwame about this" button visible
   - They can close tooltip without asking

3. **When They Click**
   - Dr. Kwame chatbot opens automatically
   - Chatbot knows exactly which term they need help with
   - Input pre-filled: "Can you explain what [Term] means?"
   - Context sent to `/api/student/learning-mode` endpoint

### **Best Practices**

✅ **DO:**
- Mark 3-5 key terms per lesson section
- Use concise definitions (one sentence max)
- Focus on concepts students find difficult
- Use consistent terminology

❌ **DON'T:**
- Over-mark (don't mark every technical word)
- Use vague definitions
- Mark common words
- Leave definitions blank

### **Example Full Lesson**

```
## Introduction to Blockchain

[[Blockchain:A distributed ledger that records transactions in chronological blocks]] is a 
revolutionary technology that enables secure, transparent, and decentralized transactions.

### How it Works

Each [[Block:A container of transactions linked to the previous block using cryptography]] contains:
- Transaction data
- Timestamp
- Hash (unique identifier)
- Hash of previous block

This creates an immutable [[Chain:A series of blocks linked together chronologically]], hence the name blockchain.

### Why It Matters

[[Decentralization:Distribution of control among multiple participants instead of a single authority]] 
means no single entity controls the network. [[Immutability:Property of data that cannot be altered after creation]] 
ensures transaction history cannot be tampered with.
```

---

## 🛠️ **Technical Architecture**

### **Frontend Components**

1. **Dr. Kwame Chatbot** (`src/components/chatbot.jsx`)
   - ForwardRef support for parent control
   - `askAboutTerm(term, definition)` method
   - Sends learning context to backend
   - Shows term context in header

2. **HighlightedTerm** (`src/components/HighlightedTerm.jsx`)
   - Renders highlighted terms with tooltip
   - Hover/touch support
   - Position-aware tooltip
   - "Ask Dr. Kwame about this" button

3. **LessonContentRenderer** (`src/components/LessonContentRenderer.jsx`)
   - Parses [[term:definition]] syntax
   - Splits content and injects HighlightedTerm components
   - Handles term click callbacks

### **Utility Functions**

`src/utils/parseLessonContent.js`:
- `extractHighlightedTerms(content)` - Extracts all marked terms
- `cleanLessonContent(content)` - Removes markup
- `hasHighlightedTerms(content)` - Checks for marked terms

### **Backend Integration**

```
POST /api/student/learning-mode
├─ wallet_address: user's wallet ID
├─ message: user's question
├─ current_course_id: course ID
└─ learning_context: {
     current_course_id,
     current_chapter_title,
     current_chapter_summary,
     completed_courses
   }
```

---

## ✅ **Current Implementation Notes**

### **Rebranding to Dr. Kwame**
- ✅ Chatbot header: "Dr. Kwame" (not "ABYA AI")
- ✅ Subtitle: "Your Learning Guide"
- ✅ Welcome message includes personality
- ✅ Input placeholder: "Ask Dr. Kwame anything..."
- ✅ Buttons say: "Ask Dr. Kwame about this"

### **Features Implemented**
- ✅ Context-aware chatbot in CourseDetails
- ✅ Inline highlighted terms with tooltips
- ✅ Term definitions on hover
- ✅ Quick access to Dr. Kwame from any term
- ✅ Pre-filled chatbot input with term context
- ✅ Term context indicator in chatbot header

---

## 📊 **Next Steps (Phase 3)**

1. **Proactive Assistance**
   - Track time spent on sections
   - Show "Need help?" hint after 6+ minutes

2. **Learning Challenges Tracking**
   - Record which terms users ask about
   - Store difficulty signals

3. **Predictive Support**
   - Analyze user learning patterns
   - Offer help before user gets stuck

4. **Personalized Content**
   - Adjust explanation depth based on skill level
   - Generate topic-specific quizzes
   - Show related learning resources

---

## 🎓 **Dr. Kwame's Personality**

Dr. Kwame is your AI learning companion with:
- 🧑‍🏫 **Educational Focus** - Explains concepts at learner's level
- 💡 **Supportive** - Encourages progress and celebrates achievements
- 🎯 **Contextual** - Always aware of current chapter and learning path
- 📚 **Knowledgeable** - Synced with all course content
- 🤝 **Personalized** - Adapts to individual learning style