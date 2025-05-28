import { useProjectProposals } from "../contexts/projectProposalsContext";
import { useEffect, useState } from "react";
import { useUser } from "../contexts/userContext";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import { useEthersSigner } from "../components/useClientSigner";
import { toast } from "react-toastify";

const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;
const Community_ABI = CommunityABI.abi;

const ProjectDetails = () => {
  const { proposals, fetchProposals } = useProjectProposals();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { role } = useUser();
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const [isApproveLoading, setIsApproveLoading] = useState(false);
  const [isRejectLoading, setIsRejectLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProposals();
  }, []); // Remove proposals from dependency array to avoid infinite loop

  // Function to handle opening modal with project details
  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  // Function to close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedProject(null);
  };

  // Helper function to get stage name from number
  const getStageLabel = (stageNumber) => {
    const stages = {
      0: "IDEA",
      1: "Planning",
      2: "MVP",
      3: "Alpha",
      4: "Beta",
      5: "Production",
    };
    return stages[stageNumber] || "Unknown";
  };

  // Function to truncate long text
  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  };

  // Get approval status
  const getStatusLabel = (project) => {
    if (project.isApproved) return "Approved";
    if (project.isRejected) return "Rejected";
    return "Pending";
  };

  // Format tech stack array to string
  const formatTechStack = (techStack) => {
    if (!techStack) return "N/A";
    if (typeof techStack === "string") return techStack;

    // Check if it's an array-like object with numeric keys
    if (techStack[0] && typeof techStack === "object") {
      return Object.values(techStack).join(", ");
    }

    return "N/A";
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return "Unknown";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const handleApprove = async () => {
    setIsApproveLoading(true);
    try {
      const signer = await signerPromise;
      const communityContract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );

      const tx = await communityContract.approveProjectProposal(
        selectedProject.id
      );
      await tx.wait();
      toast.success("Project approved successfully");
      setIsApproveLoading(false);
      closeModal();
    } catch (err) {
      setError("Error approving project", err);
      toast.error("Error approving project");
    }
  };

  const handleRejectClick = () => {
    setShowReasonInput(true);
  };

  const handleReject = async () => {
    setIsRejectLoading(true);
    try {
      const signer = await signerPromise;
      const communityContract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );
      console.log("Payload: ", selectedProject.id, rejectReason);
      const tx = await communityContract.rejectProjectProposal(
        selectedProject.id,
        rejectReason
      );
      await tx.wait();
      toast.success("Project rejected successfully");
      setIsRejectLoading(false);
      setRejectReason("");
      closeModal();
    } catch (err) {
      setError("Error rejecting project", err);
      toast.error("Error rejecting project", err);
    }
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        {proposals.length === 0 ? (
          <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-10">
            No project proposals found!
          </div>
        ) : (
          proposals.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-transform duration-500"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{project.name}</h3>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {getStageLabel(project.stage)}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4 h-24 overflow-hidden">
                {truncateText(project.description)}
              </p>

              <div className="flex flex-col gap-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Requested:
                  </span>
                  <span className="font-medium">
                    {project.requestedAmount} ETH
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Status:
                  </span>
                  <span
                    className={`font-medium ${
                      getStatusLabel(project) === "Approved"
                        ? "text-green-500"
                        : getStatusLabel(project) === "Rejected"
                        ? "text-red-500"
                        : "text-blue-500"
                    }`}
                  >
                    {getStatusLabel(project)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Creator:
                  </span>
                  <span className="font-medium">
                    {formatAddress(project.creator)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleViewDetails(project)}
                className="mt-2 w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-cyan-950 font-medium rounded-lg transition-colors duration-300"
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal for project details */}
      {showModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {error && (
                <div className="text-red-500 text-normal p-2">{error}</div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {getStageLabel(selectedProject.stage)}
                  </span>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {selectedProject.blockchain}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <div className="text-gray-600 dark:text-gray-300 whitespace-pre-line bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    {selectedProject.description}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Project Details Section */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                      Project Details
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Requested Amount
                          </span>
                        </div>
                        <span className="font-medium text-lg">
                          {selectedProject.requestedAmount} ETH
                        </span>
                      </li>
                      <li>
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Timeline
                          </span>
                        </div>
                        <span className="font-medium text-lg">
                          {selectedProject.timeline} days
                        </span>
                      </li>
                      <li>
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Status
                          </span>
                        </div>
                        <span
                          className={`font-medium text-lg ${
                            getStatusLabel(selectedProject) === "Approved"
                              ? "text-green-500"
                              : getStatusLabel(selectedProject) === "Rejected"
                              ? "text-red-500"
                              : "text-yellow-500"
                          }`}
                        >
                          {getStatusLabel(selectedProject)}
                        </span>
                      </li>
                      <li>
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Approvals
                          </span>
                        </div>
                        <span className="font-medium text-lg">
                          {selectedProject.approvalCount}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Technical Info Section */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                      Technical Info
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Tech Stack
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedProject.techStack &&
                          typeof selectedProject.techStack === "string" ? (
                            selectedProject.techStack
                              .split(",")
                              .map((tech, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-md"
                                >
                                  {tech.trim()}
                                </span>
                              ))
                          ) : Array.isArray(selectedProject.techStack) ? (
                            selectedProject.techStack.map((tech, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-md"
                              >
                                {tech.trim ? tech.trim() : tech}
                              </span>
                            ))
                          ) : (
                            <span className="font-medium">
                              {formatTechStack
                                ? formatTechStack(selectedProject.techStack)
                                : selectedProject.techStack?.toString() ||
                                  "Not specified"}
                            </span>
                          )}
                        </div>
                      </li>
                      <li>
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Blockchain
                          </span>
                        </div>
                        <span className="font-medium">
                          {selectedProject.blockchain}
                        </span>
                      </li>
                      <li>
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Creator
                          </span>
                        </div>
                        <span className="font-medium text-sm break-all bg-gray-100 dark:bg-gray-600 p-1 rounded block">
                          {selectedProject.creator}
                        </span>
                      </li>
                      <li>
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Project ID
                          </span>
                        </div>
                        <span className="font-medium">
                          {selectedProject.id}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {selectedProject.isRejected &&
                  selectedProject.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">
                        Rejection Reason
                      </h3>
                      <p className="text-red-700 dark:text-red-300">
                        {selectedProject.rejectionReason}
                      </p>
                    </div>
                  )}

                <div className="flex flex-col pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between mb-4">
                    {(role === "Reviewer" ||
                      role === "Multisig Approver" ||
                      role === "Community Manager" ||
                      role === "ADMIN") && (
                      <div className="flex space-x-3">
                        {!selectedProject.isApproved &&
                        !selectedProject.isRejected ? (
                          <>
                            <button
                              onClick={handleApprove}
                              disabled={isApproveLoading}
                              className="py-2 px-6 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-300 relative"
                            >
                              {isApproveLoading ? (
                                <>
                                  <span className="opacity-0">Approve</span>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  </div>
                                </>
                              ) : (
                                "Approve"
                              )}
                            </button>
                            <button
                              onClick={handleRejectClick}
                              className="py-2 px-6 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-300"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <div className="py-2 px-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            Status:{" "}
                            {selectedProject.isApproved ? (
                              <span className="font-medium text-lg text-green-500 p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                Approved
                              </span>
                            ) : (
                              <span className="font-medium text-lg text-red-500 p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                Rejected
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={closeModal}
                      className="py-2 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-medium rounded-lg transition-colors duration-300"
                    >
                      Close
                    </button>
                  </div>

                  {/* Rejection reason panel - appears when showReasonInput is true */}
                  {showReasonInput && (
                    <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Rejection Reason
                      </h4>
                      <textarea
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                        placeholder="Please provide a reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => setShowReasonInput(false)}
                          className="py-2 px-4 mr-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-medium rounded-lg transition-colors duration-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleReject}
                          className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-300 flex items-center"
                          disabled={isRejectLoading}
                        >
                          {isRejectLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          )}
                          {isRejectLoading ? "Rejecting..." : "Confirm Reject"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectDetails;
