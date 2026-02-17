import React, { useState, useEffect, useRef, useContext } from "react";
import { MessageCircle, Send, X, Sparkles, User, Bot, Loader2 } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { CourseContext } from "../contexts /courseContext";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_TIMEOUT = 30000; // 30 seconds
const MAX_MESSAGE_LENGTH = 1000;

// Helper function to fetch with timeout
const fetchWithTimeout = (url, options = {}, timeoutMs = API_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
    ),
  ]);
};

const AbyaChatbot = ({ 
  userAddress, 
  currentCourseId, 
  currentChapterTitle, 
  currentChapterSummary,
  completedCourses = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const account = useActiveAccount();
  const walletAddress = userAddress || account?.address;
  const { courses, latestReviews } = useContext(CourseContext);
  
  // Compute completed courses from context
  const computedCompletedCourses = completedCourses.length > 0 
    ? completedCourses 
    : courses
        .filter((course) => {
          // Exclude current course
          if (course.courseId === currentCourseId) return false;
          
          // Check if user is enrolled (in enrolledStudents)
          if (!course.enrolledStudents?.includes(walletAddress)) return false;
          
          // Check if there's a submitted review (indicates completion)
          const courseReview = latestReviews[course.courseId];
          return courseReview?.isSubmitted === true;
        })
        .map((course) => course.courseId);

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: "Welcome to the ABYA Learning Assistant. I'm synced with your current course. How can I help you?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    const trimmedMessage = inputMessage.trim();
    
    // Validation checks
    if (trimmedMessage === "") return;
    if (isLoading) return;
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setMessages((prev) => [...prev, {
        id: Date.now(),
        type: "bot",
        content: `Message too long (max ${MAX_MESSAGE_LENGTH} characters). Please shorten your message.`,
      }]);
      return;
    }

    const userMessageText = trimmedMessage;
    setInputMessage("");
    setIsLoading(true);

    // 1. Add user message to UI
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: userMessageText,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Log the request for debugging
      console.debug("[Chatbot] Sending message:", {
        walletAddress,
        courseId: currentCourseId,
        messageLength: userMessageText.length,
      });

      // 2. Call the Learning Mode API with timeout
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/student/learning-mode`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: walletAddress,
            message: userMessageText,
            current_course_id: currentCourseId,
            learning_context: {
              current_course_id: currentCourseId,
              current_chapter_title: currentChapterTitle || null,
              current_chapter_summary: currentChapterSummary || null,
              completed_courses: computedCompletedCourses
            }
          }),
        },
        API_TIMEOUT
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      console.debug("[Chatbot] Received response:", {
        mode: data.mode,
        responseLength: data.response?.length || 0,
      });

      // 3. Add bot response to UI
      const botResponse = {
        id: Date.now() + 1,
        type: "bot",
        content: data.response || "I received your message but couldn't generate a response.",
        mode: data.mode
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("[Chatbot] Error:", {
        message: error.message,
        stack: error.stack,
      });

      // Provide specific error messages
      let errorMessage = "Sorry, I'm having trouble connecting. Please try again.";
      
      if (error.message === "Request timeout") {
        errorMessage = "The request took too long. The API may be overloaded. Please try again.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = `Connection failed. Check your internet connection and ensure the API is running at ${API_BASE_URL}`;
      } else if (error.message.includes("API Error")) {
        errorMessage = `Server error: ${error.message}`;
      }

      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        type: "bot",
        content: errorMessage,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageBubble = (message) => {
    return message.type === "user" ? (
      <div key={message.id} className="flex justify-end mb-4 pr-8">
        <div className="dark:bg-yellow-500/20 bg-yellow-500/10 dark:text-white px-4 py-2 rounded-xl max-w-[85%] relative border border-yellow-500/30">
          {message.content}
          <User className="absolute right-[-30px] top-0 w-6 h-6 text-yellow-500" />
        </div>
      </div>
    ) : (
      <div key={message.id} className="flex justify-start mb-4 pl-8">
        <div className="dark:bg-gray-800 bg-gray-100 dark:text-white text-gray-800 px-4 py-2 rounded-xl max-w-[85%] relative border dark:border-gray-700 border-gray-200">
          {message.content}
          {message.mode === 'learning' && (
            <span className="block text-[10px] uppercase tracking-widest text-yellow-600 mt-1 font-bold">
              Learning Assistant
            </span>
          )}
          <Bot className="absolute left-[-30px] top-0 w-6 h-6 text-yellow-500" />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
            isOpen ? "bg-yellow-500 text-black" : "bg-gradient-to-br from-yellow-500 to-yellow-700 text-white hover:scale-105"
          }`}
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[550px] dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 rounded-xl shadow-2xl border dark:border-gray-800 border-yellow-500 flex flex-col overflow-hidden">
          <div className="dark:bg-gray-800 bg-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <div>
                <h2 className="dark:text-white font-semibold text-yellow-600 leading-none">ABYA AI</h2>
                <p className="text-[10px] text-gray-500 mt-1">{currentChapterTitle || "General Assistant"}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {messages.map((message) => renderMessageBubble(message))}
            {isLoading && (
              <div className="flex justify-start mb-4 pl-8">
                <div className="dark:bg-gray-800 bg-gray-100 p-3 rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="dark:bg-gray-800 bg-gray-200 p-4 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask about this chapter..."
              disabled={isLoading}
              maxLength={MAX_MESSAGE_LENGTH}
              className="flex-1 dark:bg-gray-900 dark:text-white bg-white text-gray-900 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
              title={`Max ${MAX_MESSAGE_LENGTH} characters`}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || inputMessage.trim() === ""}
              className="bg-yellow-500 text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-yellow-600 disabled:opacity-50"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbyaChatbot;
