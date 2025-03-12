import React, { useState } from "react";
import { X, Coins, FileCode, Layers, Calendar, Code2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../index.css";
import { ethers } from "ethers";
import { useEthersSigner } from "./useClientSigner";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";

const Community_ABI = CommunityABI.abi;
const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;

const ProjectFundingRequestModal = ({ setShowProjectFundingModal }) => {
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    techStack: "",
    blockchain: "",
    requestedAmount: "",
    timeline: "",
    stage: "MVP", // Default value
  });

  const [isLoading, setIsLoading] = useState(false);
  const signerPromise = useEthersSigner();

  const projectStageMapping = {
    IDEA: 0,
    PLANNING: 1,
    MVP: 2,
    ALPHA: 3,
    BETA: 4,
    PRODUCTION: 5,
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const signer = await signerPromise;
      const communityContract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      // Convert tech stack string to array
      const techStackArray = projectData.techStack
        .split(",")
        .map((tech) => tech.trim());

      // Convert timeline to days (assuming input is in days)
      const timelineDays = parseInt(projectData.timeline);

      console.log(
        "Project Data: ",
        projectData.name,
        projectData.description,
        techStackArray,
        projectData.blockchain,
        projectData.requestedAmount,
        timelineDays,
        projectData.stage
      );

      const tx = await communityContract.createProjectFundingProposal(
        projectData.name,
        projectData.description,
        techStackArray,
        projectData.blockchain,
        projectData.requestedAmount,
        timelineDays,
        projectStageMapping[projectData.stage]
      );

      await tx.wait();
      toast.success("Project proposal submitted successfully!");

      setTimeout(() => {
        setProjectData({
          name: "",
          description: "",
          techStack: "",
          blockchain: "",
          requestedAmount: "",
          timeline: "",
          stage: "MVP",
        });
        setShowProjectFundingModal(false);
      }, 2000);
    } catch (error) {
      toast.error(
        "Error submitting project proposal. Please try again.",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
      <ToastContainer position="bottom-right" theme="colored" />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl p-6 transform transition-all duration-300 ease-in-out scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Request Project Funding
          </h3>
          <button
            onClick={() => setShowProjectFundingModal(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectData.name}
              onChange={(e) =>
                setProjectData({
                  ...projectData,
                  name: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., DeFi Yield Aggregator"
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Description
            </label>
            <textarea
              value={projectData.description}
              onChange={(e) =>
                setProjectData({
                  ...projectData,
                  description: e.target.value,
                })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Describe your project and its goals..."
            />
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <div className="flex items-center">
                <Code2 className="w-4 h-4 mr-2" />
                Tech Stack
              </div>
            </label>
            <input
              type="text"
              value={projectData.techStack}
              onChange={(e) =>
                setProjectData({
                  ...projectData,
                  techStack: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., React, Solidity, Hardhat (comma separated)"
            />
          </div>

          {/* Blockchain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <div className="flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Target Blockchain
              </div>
            </label>
            <input
              type="text"
              value={projectData.blockchain}
              onChange={(e) =>
                setProjectData({
                  ...projectData,
                  blockchain: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Ethereum, Polygon, Arbitrum"
            />
          </div>

          {/* Two columns for amount and timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Requested Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <div className="flex items-center">
                  <Coins className="w-4 h-4 mr-2" />
                  Requested Amount (ABYTKN)
                </div>
              </label>
              <input
                type="text"
                value={projectData.requestedAmount}
                onChange={(e) =>
                  setProjectData({
                    ...projectData,
                    requestedAmount: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., 1000"
              />
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Timeline (days)
                </div>
              </label>
              <input
                type="number"
                value={projectData.timeline}
                onChange={(e) =>
                  setProjectData({
                    ...projectData,
                    timeline: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., 90"
                min="1"
              />
            </div>
          </div>

          {/* Development Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <div className="flex items-center">
                <FileCode className="w-4 h-4 mr-2" />
                Development Stage
              </div>
            </label>
            <select
              value={projectData.stage}
              onChange={(e) =>
                setProjectData({
                  ...projectData,
                  stage: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="IDEA">Idea</option>
              <option value="PLANNING">Planning</option>
              <option value="MVP">MVP</option>
              <option value="ALPHA">Alpha</option>
              <option value="BETA">Beta</option>
              <option value="PRODUCTION">Production</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-cyan-950 font-medium rounded-lg transition-colors duration-300 flex items-center justify-center mt-4"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-950"></div>
            ) : (
              <>
                <Coins className="w-5 h-5 mr-2" />
                Submit Funding Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectFundingRequestModal;
