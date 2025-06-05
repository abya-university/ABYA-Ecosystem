import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Sparkles, User, Bot } from "lucide-react";

const AbyaChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: "Welcome to the ABYA Chatbot. How can I help you today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;
  
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputMessage,
    };
    setMessages((prev) => [...prev, userMessage]);
  
    // Clear input field
    setInputMessage("");
  
    try {
      // Send API request asynchronously
      const response = await fetch("http://localhost:5000/api/v1/ai/completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputMessage,
          // model: "", // Adjust if needed
        }),
      });
      
  
      const data = await response.json();
      console.log("API Response:", data.data);
  
      if (data.success) {
        const botResponse = {
          id: messages.length + 2,
          type: "bot",
          content: data.data?.content || "Sorry, I couldn't process that.", // Extract the content field
        };
        setMessages((prev) => [...prev, botResponse]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error fetching chatbot response:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: messages.length + 2,
          type: "bot",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    }
  };


  const renderMessageBubble = (message) => {
    return message.type === "user" ? (
      <div className="flex justify-end mb-4">
        <div className="dark:bg-yellow-500/20 bg-yellow-500/20 dark:text-white px-4 py-2 rounded-xl max-w-[70%] relative">
          <div className="absolute right-[-10px] top-0 transform rotate-45 bg-yellow-500/20 w-4 h-4"></div>
          {message.content}
          <User className="absolute right-[-30px] top-0 w-5 h-5 text-yellow-500" />
        </div>
      </div>
    ) : (
      <div className="flex justify-start mb-4">
        <div className="dark:bg-gray-700 bg-gray-200 dark:text-white text-gray-800 px-4 py-2 rounded-xl max-w-[70%] relative">
          <div className="absolute left-[-10px] top-0 transform -rotate-45 dark:bg-gray-700 bg-gray-200 w-4 h-4"></div>
          {message.content}
          <Bot className="absolute left-[-30px] top-0 w-5 h-5 text-yellow-500" />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-16 h-16 rounded-full shadow-2xl transition-all duration-300 
          ${
            isOpen
              ? "bg-yellow-500 text-black"
              : "bg-gradient-to-br from-yellow-500 to-yellow-700 text-white hover:scale-105"
          }
          flex items-center justify-center
        `}
      >
        {isOpen ? (
          <X className="w-8 h-8" />
        ) : (
          <MessageCircle className="w-8 h-8" />
        )}
      </button>

      {/* Chatbot Interface */}
      {isOpen && (
        <div
          className="
            fixed bottom-24 right-6 w-96 h-[500px] dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 
            rounded-xl shadow-2xl border dark:border-gray-800 border-yellow-500 
            flex flex-col overflow-hidden
          "
        >
          {/* Chatbot Header */}
          <div className="dark:bg-gray-800 bg-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="dark:text-white font-semibold text-yellow-500">
                ABYA Chatbot
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5 text-red-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-8 space-y-2">
            {messages.map((message) => renderMessageBubble(message))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="dark:bg-gray-800 bg-gray-200 p-4 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask anything about Web3..."
              className="
                flex-1 dark:bg-gray-900 dark:text-white bg-white text-gray-900 
                px-4 py-2 rounded-full 
                focus:outline-none focus:ring-2 focus:ring-yellow-500
              "
            />
            <button
              onClick={handleSendMessage}
              className="
                bg-yellow-500 text-black 
                w-10 h-10 rounded-full 
                flex items-center justify-center
                hover:bg-yellow-600
              "
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
