import React from "react";
import {
  BookOpen,
  Trophy,
  Star,
  Clock,
  ChevronRight,
  Lock,
  Check,
  Users,
  Rocket,
} from "lucide-react";

const LearningPath = () => {
  const paths = [
    {
      title: "Blockchain Fundamentals",
      level: "Beginner",
      enrolled: 1234,
      courses: [
        {
          name: "Introduction to Blockchain",
          duration: 2, // weeks
          totalModules: 4,
          completedModules: 4,
          completed: true,
        },
        {
          name: "Cryptography Basics",
          duration: 2,
          totalModules: 4,
          completedModules: 3,
          completed: true,
        },
        {
          name: "Consensus Mechanisms",
          duration: 2,
          totalModules: 4,
          completedModules: 1,
          completed: false,
        },
        {
          name: "Blockchain Architecture",
          duration: 2,
          totalModules: 4,
          completedModules: 0,
          locked: true,
        },
      ],
    },
    {
      title: "Smart Contract Development",
      level: "Intermediate",
      enrolled: 856,
      courses: [
        {
          name: "Solidity Fundamentals",
          duration: 3,
          totalModules: 6,
          completedModules: 6,
          completed: true,
        },
        {
          name: "Smart Contract Security",
          duration: 3,
          totalModules: 6,
          completedModules: 2,
          completed: false,
        },
        {
          name: "DApp Development",
          duration: 3,
          totalModules: 6,
          completedModules: 0,
          locked: true,
        },
        {
          name: "Testing and Deployment",
          duration: 3,
          totalModules: 6,
          completedModules: 0,
          locked: true,
        },
      ],
    },
    {
      title: "Web3 Innovation",
      level: "Advanced",
      enrolled: 542,
      locked: true,
      courses: [
        {
          name: "DeFi Protocols",
          duration: 2,
          totalModules: 4,
          completedModules: 0,
          locked: true,
        },
        {
          name: "NFT Development",
          duration: 3,
          totalModules: 6,
          completedModules: 0,
          locked: true,
        },
        {
          name: "DAO Architecture",
          duration: 2,
          totalModules: 4,
          completedModules: 0,
          locked: true,
        },
        {
          name: "Web3 Project Management",
          duration: 3,
          totalModules: 6,
          completedModules: 0,
          locked: true,
        },
      ],
    },
  ];

  const calculatePathProgress = (courses) => {
    const totalWeeks = courses.reduce(
      (sum, course) => sum + course.duration,
      0
    );
    const totalModules = courses.reduce(
      (sum, course) => sum + course.totalModules,
      0
    );
    const completedModules = courses.reduce(
      (sum, course) => sum + course.completedModules,
      0
    );

    // Calculate weighted progress (50% based on weeks, 50% based on modules)
    const weekProgress =
      courses.reduce(
        (sum, course) => sum + (course.completed ? course.duration : 0),
        0
      ) / totalWeeks;
    const moduleProgress = completedModules / totalModules;

    const overallProgress = ((weekProgress + moduleProgress) / 2) * 100;

    return {
      progress: Math.round(overallProgress),
      totalWeeks,
      completedModules,
      totalModules,
    };
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "Beginner":
        return "text-green-500";
      case "Intermediate":
        return "text-yellow-500";
      case "Advanced":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 min-h-screen p-4 md:p-6 transition-colors duration-300 pt-16 md:pt-[100px]">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold dark:text-yellow-400 text-yellow-500">
              Learning Paths
            </h1>
            <p className="text-sm dark:text-gray-400 text-gray-600 mt-1 md:mt-0">
              Structured pathways to master blockchain development
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-300 text-sm md:text-base w-full sm:w-auto justify-center">
              <Rocket className="w-4 h-4" />
              Start New Path
            </button>
          </div>
        </div>

        {/* Learning Paths */}
        <div className="space-y-4 md:space-y-6">
          {paths.map((path, index) => {
            const progress = !path.locked
              ? calculatePathProgress(path.courses)
              : null;
            return (
              <div
                key={index}
                className={`p-4 md:p-6 rounded-xl shadow-lg dark:bg-gray-800 bg-white border dark:border-gray-700 border-gray-200 transition-all duration-300 ${
                  path.locked ? "opacity-75" : "hover:shadow-xl"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 mb-4 md:mb-6">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h2 className="text-lg md:text-xl font-semibold dark:text-white text-gray-900">
                        {path.title}
                      </h2>
                      <span
                        className={`text-xs md:text-sm font-medium ${getLevelColor(
                          path.level
                        )} self-start sm:self-center`}
                      >
                        {path.level}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm dark:text-gray-400 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        {progress ? `${progress.totalWeeks} weeks` : "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 md:w-4 md:h-4" />
                        {path.enrolled} enrolled
                      </span>
                      {progress && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
                          {progress.completedModules}/{progress.totalModules}{" "}
                          modules
                        </span>
                      )}
                    </div>
                  </div>
                  {path.locked ? (
                    <Lock className="w-5 h-5 md:w-6 md:h-6 text-gray-400 flex-shrink-0" />
                  ) : (
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 md:w-5 md:h-5 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </div>

                {!path.locked && progress && (
                  <div className="mb-4 md:mb-6">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs md:text-sm dark:text-gray-400 text-gray-600 text-right">
                      {progress.progress}% Complete
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                  {path.courses.map((course, courseIndex) => (
                    <div
                      key={courseIndex}
                      className={`p-3 md:p-4 rounded-lg ${
                        course.locked
                          ? "dark:bg-gray-700/50 bg-gray-50"
                          : course.completed
                          ? "dark:bg-gray-700 bg-gray-50 border-green-500"
                          : "dark:bg-gray-700 bg-gray-50"
                      } flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        {course.locked ? (
                          <Lock className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                        ) : course.completed ? (
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium dark:text-white text-gray-900 text-sm md:text-base truncate">
                            {course.name}
                          </p>
                          <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm dark:text-gray-400 text-gray-600 flex-wrap">
                            <span>{course.duration} weeks</span>
                            {!course.locked && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span>
                                  {course.completedModules}/
                                  {course.totalModules} modules
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {!course.locked && (
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 dark:text-gray-400 text-gray-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  ))}
                </div>

                {!path.locked && (
                  <div className="mt-4 md:mt-6 flex justify-end">
                    <button className="px-3 py-2 md:px-4 md:py-2 text-xs md:text-sm dark:text-yellow-400 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors duration-300 w-full sm:w-auto text-center">
                      Continue Path
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
