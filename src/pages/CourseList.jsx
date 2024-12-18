import React, { useState } from "react";
import { Book, Eye, Clock, Check, AlertCircle } from "lucide-react";

const CoursesPage = () => {
  const [courses, setCourses] = useState([
    {
      id: 1,
      image: "/Mission.jpg",
      name: "Intro to Web3",
      description:
        "Understand the fundamentals of decentralized technologies and blockchain.",
      instructor: "Alice Blockchain",
      duration: "4 weeks",
      approvalStatus: "pending",
      price: "Free",
    },
    {
      id: 2,
      image: "/landing5.jpg",
      name: "Smart Contract Development",
      description: "Learn to build and deploy smart contracts on Ethereum.",
      instructor: "Bob Solidity",
      duration: "6 weeks",
      approvalStatus: "approved",
      price: "0.1 ETH",
    },
    {
      id: 3,
      image: "/Vision.jpg",
      name: "Decentralized Identity Basics",
      description:
        "Explore the world of DIDs, VCs, and self-sovereign identity.",
      instructor: "Charlie Web3",
      duration: "3 weeks",
      approvalStatus: "pending",
      price: "Free",
    },
    {
      id: 4,
      image: "/landing17.jpg",
      name: "Bitcoin Development",
      description: "Dip dive into the world of Bitcoin Development.",
      instructor: "Pierre Bitcoin",
      duration: "12 weeks",
      approvalStatus: "pending",
      price: "0.15 ETH",
    },
  ]);

  const getApprovalStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-500";
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  return (
    <div
      className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900
      min-h-screen p-6 transition-colors duration-300 pt-[100px]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Book className="w-8 h-8 text-yellow-500" />
            <h1
              className="text-3xl font-bold 
              dark:text-yellow-400 text-yellow-500"
            >
              Available Courses
            </h1>
          </div>
          <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors">
            Create New Course
          </button>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
            >
              {/* Course Image */}
              <div className="relative">
                <img
                  src={course.image}
                  alt={course.name}
                  className="w-full h-48 object-cover rounded-xl"
                />
                {/* Approval Status Badge */}
                <div
                  className={`absolute top-3 right-3 px-3 py-1 bg-opacity-50 bg-black rounded-full text-xs uppercase ${getApprovalStatusStyle(
                    course.approvalStatus
                  )}`}
                >
                  {course.approvalStatus === "pending" ? (
                    <>
                      <Clock className="inline-block w-4 h-4 mr-1 -mt-1" />
                      Approval Pending
                    </>
                  ) : (
                    <>
                      <Check className="inline-block w-4 h-4 mr-1 -mt-1" />
                      Approved
                    </>
                  )}
                </div>
              </div>

              {/* Course Details */}
              <div className="p-5">
                <h2 className="text-xl font-bold mb-2 text-yellow-500">
                  {course.name}
                </h2>
                <p className="text-gray-400 mb-4 line-clamp-2">
                  {course.description}
                </p>

                {/* Course Meta Information */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">
                    <span className="mr-2">
                      <Book className="inline-block w-4 h-4 mr-1 -mt-1" />
                      {course.instructor}
                    </span>
                    <span>
                      <Clock className="inline-block w-4 h-4 mr-1 -mt-1" />
                      {course.duration}
                    </span>
                  </div>
                  <div className="text-yellow-500 font-semibold">
                    {course.price}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="flex-1 bg-yellow-500 text-sm text-black py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center">
                    <Eye className="w-5 h-5 mr-2" />
                    View Course
                  </button>
                  {course.approvalStatus === "pending" && (
                    <button className="flex-1 bg-gray-700 text-white text-sm py-2 px-1 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Request Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
