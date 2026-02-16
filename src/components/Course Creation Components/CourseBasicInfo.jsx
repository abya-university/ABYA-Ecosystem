import { AlertCircle, CheckCircle, Image, Upload } from "lucide-react";
import Ecosystem1FacetABI from "../../artifacts/contracts/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import CONTRACT_ADDRESSES from "../../constants/addresses";
import { useState } from "react";
import { defineChain } from "thirdweb/chains";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../../services/client";
import { uploadFileToPinata } from "../../services/pinata";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem1Facet_ABI = Ecosystem1FacetABI.abi;

const parsePriceToUSDCUnits = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return 0;
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  const dollars = Number.parseInt(wholePart, 10);
  const cents = Number.parseInt(`${fractionalPart}00`.slice(0, 2), 10);

  if (!Number.isFinite(dollars) || !Number.isFinite(cents)) {
    return null;
  }

  const totalCents = dollars * 100 + cents;
  return totalCents * 10000;
};

const CourseBasicInfo = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const account = useActiveAccount();
  const address = account?.address || "";
  const isConnected = !!address;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [courseData, setCourseData] = useState({
    basicInfo: {
      name: "",
      description: "",
      difficulty_level: 0,
      isFree: false,
      priceUSDC: "",
      image: null,
    },
    chapters: [],
    lessons: [],
    quizzes: [],
    resources: [],
  });
  const priceUSDCUnits = parsePriceToUSDCUnits(courseData.basicInfo.priceUSDC);
  const isPriceInvalid =
    !courseData.basicInfo.isFree &&
    courseData.basicInfo.priceUSDC !== "" &&
    priceUSDCUnits === null;

  const createCourse = async () => {
    if (
      !courseData.basicInfo.name.trim() ||
      !courseData.basicInfo.description.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!courseData.basicInfo.image) {
      toast.error("Please upload a course image");
      return;
    }

    if (!courseData.basicInfo.isFree && priceUSDCUnits === null) {
      toast.error("Please enter a valid course price");
      return;
    }

    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const diamondContract = await getContract({
        address: DiamondAddress,
        abi: Ecosystem1Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const imageIpfsHash = await uploadFileToPinata(
        courseData.basicInfo.image,
      );

      const tx = await prepareContractCall({
        contract: diamondContract,
        method: "createCourse",
        params: [
          courseData.basicInfo.name,
          courseData.basicInfo.description,
          courseData.basicInfo.difficulty_level,
          courseData.basicInfo.isFree ? 0 : priceUSDCUnits,
          imageIpfsHash,
        ],
      });

      console.log("Transaction sent:", tx.hash);
      const receipt = await sendTransaction({ transaction: tx, account });
      console.log("Transaction confirmed:", receipt.transactionHash);

      toast.success("Course created successfully!");
      setSuccess("Course created successfully!");
      setCourseData({
        basicInfo: {
          name: "",
          description: "",
          difficulty_level: 0,
          isFree: false,
          priceUSDC: "",
          image: null,
        },
        chapters: [],
        lessons: [],
        quizzes: [],
        resources: [],
      });
      setImagePreview(null);

      // Note: You'll need to import readContract if you want to use this
      // const hasRole = await readContract({
      //   contract: diamondContract,
      //   method: "function hasCourseOwnerRole(address account) view returns (bool)",
      //   params: [account],
      // });
      // console.log("Has COURSE_OWNER_ROLE:", hasRole);
    } catch (err) {
      const message = err?.message || "Unknown error";
      toast.error(`Failed to create course: ${message}`);
      setError(`Failed to create course: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setCourseData((prev) => ({
        ...prev,
        basicInfo: { ...prev.basicInfo, image: file },
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    document.getElementById("course-image-upload").click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-2">
          Create New Course
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
          Start by adding the basic information for your course
        </p>
      </div>

      {/* Status Messages */}
      {(success || error) && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center border-l-4 ${
            success
              ? "bg-green-50 text-green-700 border-green-500 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 border-red-500 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {success ? (
            <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          )}
          <span className="text-sm md:text-base">{success || error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Course Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Introduction to Blockchain"
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base transition-colors"
                  value={courseData.basicInfo.name}
                  onChange={(e) =>
                    setCourseData((prev) => ({
                      ...prev,
                      basicInfo: { ...prev.basicInfo, name: e.target.value },
                    }))
                  }
                />
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Difficulty Level
                </label>
                <select
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base transition-colors"
                  value={courseData.basicInfo.difficulty_level}
                  onChange={(e) =>
                    setCourseData((prev) => ({
                      ...prev,
                      basicInfo: {
                        ...prev.basicInfo,
                        difficulty_level: Number(e.target.value),
                      },
                    }))
                  }
                >
                  <option value={0}>🎓 Beginner</option>
                  <option value={1}>⚡ Intermediate</option>
                  <option value={2}>🚀 Advanced</option>
                </select>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pricing
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="course-price-type"
                      checked={courseData.basicInfo.isFree}
                      onChange={() =>
                        setCourseData((prev) => ({
                          ...prev,
                          basicInfo: {
                            ...prev.basicInfo,
                            isFree: true,
                            priceUSDC: "",
                          },
                        }))
                      }
                    />
                    Free
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="course-price-type"
                      checked={!courseData.basicInfo.isFree}
                      onChange={() =>
                        setCourseData((prev) => ({
                          ...prev,
                          basicInfo: {
                            ...prev.basicInfo,
                            isFree: false,
                          },
                        }))
                      }
                    />
                    Paid
                  </label>
                </div>
              </div>

              {/* priceUSDC */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Price (USDC)
                </label>
                <input
                  type="number"
                  // min="0"
                  // step="0.01"
                  placeholder="Price in USDC (e.g., 19.99)"
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base transition-colors"
                  value={courseData.basicInfo.priceUSDC}
                  disabled={courseData.basicInfo.isFree}
                  onChange={(e) =>
                    setCourseData((prev) => ({
                      ...prev,
                      basicInfo: {
                        ...prev.basicInfo,
                        priceUSDC: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Description *
                </label>
                <textarea
                  placeholder="Describe what students will learn in this course..."
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 h-32 resize-vertical text-base transition-colors"
                  value={courseData.basicInfo.description}
                  onChange={(e) =>
                    setCourseData((prev) => ({
                      ...prev,
                      basicInfo: {
                        ...prev.basicInfo,
                        description: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Image
                </label>

                {/* Image Upload Area */}
                <div
                  onClick={triggerFileInput}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all duration-200 group"
                >
                  <input
                    id="course-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Course preview"
                        className="w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">
                            Click to change image
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Image className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                        Click to upload course image
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Create Course Button */}
              <button
                onClick={createCourse}
                disabled={
                  loading ||
                  !courseData.basicInfo.name.trim() ||
                  !courseData.basicInfo.description.trim() ||
                  isPriceInvalid
                }
                className={`w-full py-4 px-6 rounded-lg font-semibold text-base transition-all duration-200 flex items-center justify-center gap-3 ${
                  loading ||
                  !courseData.basicInfo.name.trim() ||
                  !courseData.basicInfo.description.trim()
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600 text-gray-900 shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    Creating Course...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Create Course
                  </>
                )}
              </button>

              {/* Form Validation Hint */}
              {(!courseData.basicInfo.name.trim() ||
                !courseData.basicInfo.description.trim()) && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p>
                    Please fill in all required fields (*) to create your course
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseBasicInfo;
