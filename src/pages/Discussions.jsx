import React, { useState } from "react";
import { MessageSquare, ThumbsUp, Share2, ArrowUp } from "lucide-react";

const DiscussionsPage = () => {
  const [discussions, setDiscussions] = useState([
    {
      id: 1,
      author: "EthereumEnthusiast",
      timestamp: "2h ago",
      content:
        "What are everyone's thoughts on the latest Layer 2 scaling solutions?",
      likes: 42,
      comments: 15,
      tags: ["Ethereum", "Scaling", "Technology"],
    },
    {
      id: 2,
      author: "BlockchainBaker",
      timestamp: "5h ago",
      content:
        "Just deployed my first smart contract! Any tips for optimizing gas fees?",
      likes: 27,
      comments: 8,
      tags: ["SmartContracts", "Solidity", "GasFees"],
    },
    {
      id: 3,
      author: "CryptoArchitect",
      timestamp: "1d ago",
      content:
        "Decentralization is more than just a buzzword - it's a fundamental shift in how we think about trust and infrastructure.",
      likes: 89,
      comments: 23,
      tags: ["Decentralization", "Philosophy", "Web3"],
    },
  ]);

  const [newDiscussion, setNewDiscussion] = useState("");

  const handlePostDiscussion = () => {
    if (newDiscussion.trim()) {
      const newPost = {
        id: discussions.length + 1,
        author: "CurrentUser",
        timestamp: "Just now",
        content: newDiscussion,
        likes: 0,
        comments: 0,
        tags: [],
      };
      setDiscussions([newPost, ...discussions]);
      setNewDiscussion("");
    }
  };

  return (
    <div
      className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900
      min-h-screen p-6 transition-colors duration-300 pt-[100px]"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center mb-8 space-x-4">
          <div>
            <h1
              className="text-3xl font-bold 
              dark:text-yellow-400 text-yellow-500"
            >
              Discussions
            </h1>
            <p
              className="
              text-sm 
              dark:text-gray-400 text-gray-600"
            >
              Your discussions page.
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <textarea
            value={newDiscussion}
            onChange={(e) => setNewDiscussion(e.target.value)}
            placeholder="Start a new discussion..."
            className="w-full p-3 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-800 dark:text-white"
            rows={4}
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handlePostDiscussion}
              className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Post Discussion
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {discussions.map((discussion) => (
            <div
              key={discussion.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-cyan-950 dark:bg-yellow-500 text-white rounded-full flex items-center justify-center">
                    {discussion.author[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {discussion.author}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {discussion.timestamp}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {discussion.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-gray-800 dark:text-gray-200 mb-4">
                {discussion.content}
              </p>

              <div className="flex justify-between items-center border-t dark:border-gray-700 pt-4">
                <div className="flex space-x-4">
                  <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <ThumbsUp size={18} />
                    <span>{discussion.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <MessageSquare size={18} />
                    <span>{discussion.comments}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <Share2 size={18} />
                  </button>
                </div>
                <button className="text-yellow-500 hover:text-yellow-600 flex items-center">
                  <ArrowUp size={18} />
                  <span className="ml-1">Upvote</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscussionsPage;
