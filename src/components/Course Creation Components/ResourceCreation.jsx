import { AlertCircle, CheckCircle, Plus } from "lucide-react";
import Ecosystem1FacetABI from "../../artifacts/contracts/Ecosystem1Facet.sol/Ecosystem1Facet.json";
import Ecosystem2FacetABI from "../../artifacts/contracts/Ecosystem2Facet.sol/Ecosystem2Facet.json";
import CONTRACT_ADDRESSES from "../../constants/addresses";
import { useState } from "react";
import { defineChain } from "thirdweb/chains";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../../services/client";
import { useContext } from "react";
import { LessonContext } from "../../contexts/lessonContext";
import {
  uploadFileToPinata,
  uploadMetadataToIPFS,
} from "../../services/pinata";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem1Facet_ABI = Ecosystem1FacetABI.abi;
const Ecosystem2Facet_ABI = Ecosystem2FacetABI.abi;

const ResourcesCreation = () => {
  const [resourceName, setResourceName] = useState("");
  const [resourceLink, setResourceLink] = useState("");
  const [contentType, setContentType] = useState("");
  const [file, setFile] = useState(null);
  const [resources, setResources] = useState([]);
  const { lessons } = useContext(LessonContext);
  const [lessonId, setLessonId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const account = useActiveAccount();
  const address = account?.address || "";
  const isConnected = !!address;

  // Enum mapping matching the contract
  const ContentTypeEnum = {
    Video: 0,
    Image: 1,
    Document: 2,
  };

  const addResource = async () => {
    try {
      if (!lessonId || !contentType || !resourceName) {
        alert("Please fill in all required fields");
        return;
      }

      if (!isConnected || !address) {
        setError("Wallet is not connected");
        return;
      }

      setIsUploading(true);
      let finalLink = "";

      // Handle file upload for Image/Document
      if (contentType !== "Video") {
        if (!file) {
          alert("Please upload a file");
          return;
        }
        // Upload to Pinata
        const fileCid = await uploadFileToPinata(file);
        console.log("File uploaded to Pinata with CID:", fileCid);

        // Create and upload metadata
        const metadata = {
          type: contentType.toLowerCase(),
          file: fileCid,
        };
        finalLink = await uploadMetadataToIPFS(metadata);
      } else {
        finalLink = resourceLink;
      }

      // Create resource object matching contract structure
      const newResource = {
        contentType: ContentTypeEnum[contentType],
        url: finalLink,
        name: resourceName,
      };

      const diamondContract = await getContract({
        address: DiamondAddress,
        abi: Ecosystem2Facet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const tx = await prepareContractCall({
        contract: diamondContract,
        method: "addResourcesToLesson",
        params: [lessonId, ContentTypeEnum[contentType], [newResource]],
      });
      await sendTransaction({ transaction: tx, account });
      // Update local state
      setResources([
        ...resources,
        {
          name: resourceName,
          link: finalLink,
          contentType,
        },
      ]);

      toast.success("Resource added successfully!");

      // Reset form
      setResourceName("");
      setResourceLink("");
      setFile(null);
      setContentType("");
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error("Error adding resource. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-yellow-500">
        Add Resources
      </h2>

      {/* Status Messages */}
      {(success || error) && (
        <div
          className={`mb-4 p-3 md:p-4 rounded-lg flex items-center ${
            success
              ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {success ? (
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          ) : (
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          )}
          <span className="text-sm md:text-base">{success || error}</span>
        </div>
      )}

      <div className="grid gap-3 md:gap-4">
        {/* Lesson Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Lesson
          </label>
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
          >
            <option value="" className="text-gray-500 dark:text-gray-400">
              Choose a lesson
            </option>
            {lessons.map((lesson) => (
              <option
                key={lesson.lessonId}
                value={lesson.lessonId}
                className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              >
                {lesson.lessonName}
              </option>
            ))}
          </select>
        </div>

        {/* Content Type Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
          >
            <option value="" className="text-gray-500 dark:text-gray-400">
              Select content type
            </option>
            <option
              value="Video"
              className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            >
              Video
            </option>
            <option
              value="Image"
              className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            >
              Image
            </option>
            <option
              value="Document"
              className="text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            >
              Document
            </option>
          </select>
        </div>

        {/* Resource Name */}
        <input
          type="text"
          placeholder="Resource Name"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base"
          value={resourceName}
          onChange={(e) => setResourceName(e.target.value)}
        />

        {/* Dynamic Input Based on Content Type */}
        {contentType === "Video" ? (
          <input
            type="text"
            placeholder="YouTube Video URL"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm md:text-base"
            value={resourceLink}
            onChange={(e) => setResourceLink(e.target.value)}
          />
        ) : contentType ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload {contentType}
            </label>
            <input
              type="file"
              accept={
                contentType === "Image"
                  ? "image/*"
                  : "application/pdf,.doc,.docx"
              }
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 text-sm md:text-base"
            />
            {file && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>
        ) : null}

        {/* Add Resource Button */}
        <button
          onClick={addResource}
          disabled={
            isUploading ||
            !lessonId ||
            !contentType ||
            !resourceName ||
            (contentType !== "Video" && !file) ||
            (contentType === "Video" && !resourceLink)
          }
          className={`bg-yellow-500 text-gray-900 px-3 py-2 md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-600 transition-colors text-sm md:text-base font-medium w-full sm:w-[180px] ${
            isUploading ||
            !lessonId ||
            !contentType ||
            !resourceName ||
            (contentType !== "Video" && !file) ||
            (contentType === "Video" && !resourceLink)
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          {isUploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <Plus size={18} className="md:w-5 md:h-5" />
              <span>Add Resource</span>
            </>
          )}
        </button>

        {/* Validation Hint */}
        {(!lessonId ||
          !contentType ||
          !resourceName ||
          (contentType !== "Video" && !file) ||
          (contentType === "Video" && !resourceLink)) && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
            {!lessonId && "• Please select a lesson"}
            {!contentType && "• Please select a content type"}
            {!resourceName && "• Resource name is required"}
            {contentType !== "Video" && !file && "• Please upload a file"}
            {contentType === "Video" &&
              !resourceLink &&
              "• Video URL is required"}
          </div>
        )}
      </div>

      {/* Display Added Resources */}
      {resources.length > 0 && (
        <div className="mt-4 md:mt-6">
          <h3 className="font-semibold mb-3 dark:text-gray-200 text-gray-800 text-lg md:text-xl">
            Added Resources:
          </h3>
          <div className="space-y-3">
            {resources.map((resource, index) => (
              <div
                key={index}
                className="bg-gray-100 dark:bg-gray-800 p-3 md:p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg mb-1">
                    {resource.name}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span>Type: {resource.contentType}</span>
                    <a
                      href={resource.link}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {resource.contentType === "Video"
                        ? "Watch Video"
                        : "View Resource"}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setResources(resources.filter((_, i) => i !== index))
                  }
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm md:text-base px-3 py-1 border border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors self-start sm:self-center"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesCreation;
