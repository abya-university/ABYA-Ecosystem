import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CourseContext } from "../contexts/courseContext";
import { ArrowLeft, RefreshCw, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const CourseMetricsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const {
    courses,
    latestReviews,
    courseReviews,
    courseFeedback,
    getCourseData,
  } = useContext(CourseContext);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Find the course from context
      const foundCourse = courses.find((c) => c.courseId === courseId);
      if (foundCourse) {
        setCourse(foundCourse);
      }

      // Ensure we have the latest metrics data
      await getCourseData(courseId);
      setLoading(false);
    };

    fetchData();
  }, [courseId, courses, getCourseData, latestReviews]);

  // Helper function to transform metrics data for charts
  const getMetricsData = () => {
    if (!latestReviews[courseId]) return [];

    const review = latestReviews[courseId];
    return [
      { name: "Learner Agency", value: review.learnerAgency, fullMark: 100 },
      {
        name: "Critical Thinking",
        value: review.criticalThinking,
        fullMark: 100,
      },
      {
        name: "Collaborative Learning",
        value: review.collaborativeLearning,
        fullMark: 100,
      },
      {
        name: "Reflective Practice",
        value: review.reflectivePractice,
        fullMark: 100,
      },
      {
        name: "Adaptive Learning",
        value: review.adaptiveLearning,
        fullMark: 100,
      },
      {
        name: "Authentic Learning",
        value: review.authenticLearning,
        fullMark: 100,
      },
      {
        name: "Technology Integration",
        value: review.technologyIntegration,
        fullMark: 100,
      },
      { name: "Learner Support", value: review.learnerSupport, fullMark: 100 },
      {
        name: "Assessment for Learning",
        value: review.assessmentForLearning,
        fullMark: 100,
      },
      {
        name: "Engagement and Motivation",
        value: review.engagementAndMotivation,
        fullMark: 100,
      },
    ];
  };

  // For bar chart, sort metrics by value
  const getSortedMetricsData = () => {
    const data = getMetricsData();
    return [...data].sort((a, b) => b.value - a.value);
  };

  // For color coding based on value
  const getBarColor = (value) => {
    if (value >= 80) return "#10B981"; // Green
    if (value >= 70) return "#FBBF24"; // Yellow
    return "#EF4444"; // Red
  };

  // Calculate overall score
  const calculateOverallScore = () => {
    if (!latestReviews[courseId]) return 0;

    const review = latestReviews[courseId];
    const values = [
      review.learnerAgency,
      review.criticalThinking,
      review.collaborativeLearning,
      review.reflectivePractice,
      review.adaptiveLearning,
      review.authenticLearning,
      review.technologyIntegration,
      review.learnerSupport,
      review.assessmentForLearning,
      review.engagementAndMotivation,
    ];

    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  if (loading || !course) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
          <p>Loading course metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{course.courseName}</h1>
              <p className="text-gray-400">Course Evaluation Metrics</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Score Card */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-500 mb-4">
                Evaluation Summary
              </h2>

              <div className="flex justify-center mb-6">
                <div className="relative w-48 h-48">
                  {/* Circular Progress */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke="#374151"
                      strokeWidth="10"
                    />

                    {/* Progress Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke={
                        course.approvalCount >= 80 ? "#10B981" : "#EF4444"
                      }
                      strokeWidth="10"
                      strokeDasharray={`${
                        (2 * Math.PI * 45 * course.approvalCount) / 100
                      } ${
                        (2 * Math.PI * 45 * (100 - course.approvalCount)) / 100
                      }`}
                      strokeDashoffset={2 * Math.PI * 45 * 0.25} // Start from top
                      transform="rotate(-90 50 50)"
                    />

                    {/* Text in center */}
                    <text
                      x="50"
                      y="45"
                      fontFamily="sans-serif"
                      fontSize="20"
                      fontWeight="bold"
                      textAnchor="middle"
                      fill="white"
                    >
                      {course.approvalCount}%
                    </text>
                    <text
                      x="50"
                      y="65"
                      fontFamily="sans-serif"
                      fontSize="10"
                      textAnchor="middle"
                      fill="gray"
                    >
                      {course.approvalCount >= 80 ? "PASSED" : "FAILED"}
                    </text>
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <h3 className="text-sm text-gray-400">Course ID</h3>
                  <p className="font-medium">{courseId}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400">Status</h3>
                  <p
                    className={`font-medium ${
                      course.approved ? "text-green-500" : "text-yellow-500"
                    }`}
                  >
                    {course.approved ? "Approved" : "Pending"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400">Category</h3>
                  <p className="font-medium text-yellow-500">
                    Emerging Technologies
                  </p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400">Pass Mark</h3>
                  <p className="font-medium">80%</p>
                </div>
              </div>
            </div>

            {/* Feedback Card */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-500 mb-4">
                Evaluation Feedback
              </h2>
              {courseFeedback[courseId] ? (
                <p className="text-gray-300">{courseFeedback[courseId]}</p>
              ) : (
                <p className="text-gray-500 italic">No feedback available</p>
              )}
            </div>
          </div>

          {/* Right Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Radar Chart */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-500 mb-4">
                Metrics Overview
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius="80%" data={getMetricsData()}>
                    <PolarGrid />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: "white", fontSize: 10 }}
                    />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Metrics"
                      dataKey="value"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Pass Mark"
                      dataKey={() => 70}
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.1}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-500 mb-4">
                Performance Breakdown
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getSortedMetricsData()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" name="Score" radius={[0, 4, 4, 0]}>
                      {getSortedMetricsData().map((entry, index) => (
                        <cell
                          key={`cell-${index}`}
                          fill={getBarColor(entry.value)}
                        />
                      ))}
                    </Bar>
                    {/* Reference line at 70% */}
                    <ReferenceLine
                      x={70}
                      stroke="#FBBF24"
                      strokeDasharray="3 3"
                      label={{
                        value: "Min Pass",
                        fill: "#FBBF24",
                        position: "insideTopRight",
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseMetricsPage;
