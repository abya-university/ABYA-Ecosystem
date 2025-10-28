import { useProjectProposals } from "../contexts/projectProposalsContext";
import { useEffect, useState } from "react";
import { useUser } from "../contexts/userContext";
import CommunityGovernanceFacet from "../artifacts/contracts/CommunityGovernanceFacet.sol/CommunityGovernanceFacet.json";
import { toast } from "react-toastify";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import CONTRACT_ADDRESSES from "../constants/addresses";
import {
  X,
  Clock,
  User,
  Code,
  // Blockchain,
  Coins,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Blocks,
} from "lucide-react";

const DiamondAddress = CONTRACT_ADDRESSES.diamondAddress;
const CommunityGovernanceFacet_ABI = CommunityGovernanceFacet.abi;

const ProjectDetails = () => {
  const { proposals, fetchProposals } = useProjectProposals();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { role } = useUser();
  const account = useActiveAccount();
  const address = account?.address;
  const [isApproveLoading, setIsApproveLoading] = useState(false);
  const [isRejectLoading, setIsRejectLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowModal(true);
    setShowReasonInput(false);
    setRejectReason("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProject(null);
    setShowReasonInput(false);
    setRejectReason("");
  };

  const getStageLabel = (stageNumber) => {
    const stages = {
      0: "💡 IDEA",
      1: "📋 Planning",
      2: "🚀 MVP",
      3: "🔬 Alpha",
      4: "🧪 Beta",
      5: "🏆 Production",
    };
    return stages[stageNumber] || "Unknown";
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return "No description provided";
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  };

  const getStatusLabel = (project) => {
    if (project.isApproved) return "Approved";
    if (project.isRejected) return "Rejected";
    return "Pending Review";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "Rejected":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    }
  };

  const formatTechStack = (techStack) => {
    if (!techStack) return [];
    if (typeof techStack === "string") {
      return techStack
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech.length > 0);
    }
    if (Array.isArray(techStack)) {
      return techStack;
    }
    return [];
  };

  const formatAddress = (address) => {
    if (!address) return "Unknown";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const handleApprove = async () => {
    if (!selectedProject) return;

    setIsApproveLoading(true);
    setError("");
    try {
      const communityContract = getContract({
        address: DiamondAddress,
        abi: CommunityGovernanceFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = prepareContractCall({
        contract: communityContract,
        method: "approveProjectProposal",
        params: [BigInt(selectedProject.id)],
      });

      await sendTransaction({ transaction, account });
      toast.success("🎉 Project approved successfully!");
      fetchProposals();
      closeModal();
    } catch (err) {
      console.error("Error approving project:", err);
      setError(err.message || "Failed to approve project");
      toast.error("Failed to approve project");
    } finally {
      setIsApproveLoading(false);
    }
  };

  const handleRejectClick = () => {
    setShowReasonInput(true);
  };

  const handleReject = async () => {
    if (!selectedProject || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setIsRejectLoading(true);
    setError("");
    try {
      const communityContract = getContract({
        address: DiamondAddress,
        abi: CommunityGovernanceFacet_ABI,
        client,
        chain: defineChain(11155111),
      });

      const transaction = prepareContractCall({
        contract: communityContract,
        method: "rejectProjectProposal",
        params: [BigInt(selectedProject.id), rejectReason.trim()],
      });

      await sendTransaction({ transaction, account });
      toast.success("Project rejected successfully");
      fetchProposals();
      closeModal();
    } catch (err) {
      console.error("Error rejecting project:", err);
      setError(err.message || "Failed to reject project");
      toast.error("Failed to reject project");
    } finally {
      setIsRejectLoading(false);
    }
  };

  const canApproveReject =
    role === "Reviewer" ||
    role === "Multisig Approver" ||
    role === "Community Manager" ||
    role === "ADMIN";

  return (
    <>
      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {proposals.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Code className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No Project Proposals Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Be the first to submit an innovative project proposal to the
                community!
              </p>
            </div>
          </div>
        ) : (
          proposals.map((project) => (
            <div
              key={project.id}
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:scale-105 hover:border-yellow-300 dark:hover:border-yellow-600"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white line-clamp-2 flex-1 pr-2">
                  {project.name}
                </h3>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap">
                  {getStageLabel(project.stage)}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 text-sm leading-relaxed">
                {truncateText(project.description)}
              </p>

              {/* Project Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Coins className="w-4 h-4" />
                    <span>Requested</span>
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {project.requestedAmount} ETH
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Timeline</span>
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {project.timeline} days
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>Creator</span>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatAddress(project.creator)}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                    getStatusLabel(project)
                  )}`}
                >
                  {getStatusLabel(project)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {project.id}
                </span>
              </div>

              {/* View Details Button */}
              <button
                onClick={() => handleViewDetails(project)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-cyan-950 font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group-hover:scale-105"
              >
                <ExternalLink className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {/* Project Details Modal */}
      {showModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 pr-8">
                  {selectedProject.name}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {getStageLabel(selectedProject.stage)}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                      getStatusLabel(selectedProject)
                    )}`}
                  >
                    {getStatusLabel(selectedProject)}
                  </span>
                  {selectedProject.blockchain && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      <Blocks className="w-3 h-3 inline mr-1" />
                      {selectedProject.blockchain}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                      <Code className="w-5 h-5 text-blue-500" />
                      Project Description
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                        {selectedProject.description ||
                          "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Tech Stack */}
                  {formatTechStack(selectedProject.techStack).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <Code className="w-5 h-5 text-green-500" />
                        Technology Stack
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {formatTechStack(selectedProject.techStack).map(
                          (tech, index) => (
                            <span
                              key={index}
                              className="px-3 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg text-sm font-medium"
                            >
                              {tech}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar - Project Details */}
                <div className="space-y-6">
                  {/* Funding & Timeline */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <Coins className="w-5 h-5 text-blue-500" />
                      Funding Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">
                          Requested Amount
                        </span>
                        <span className="text-lg font-bold text-gray-800 dark:text-white">
                          {selectedProject.requestedAmount} ETH
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">
                          Timeline
                        </span>
                        <span className="text-lg font-bold text-gray-800 dark:text-white">
                          {selectedProject.timeline} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">
                          Approvals
                        </span>
                        <span className="text-lg font-bold text-gray-800 dark:text-white">
                          {selectedProject.approvalCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-500" />
                      Project Info
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          Creator
                        </span>
                        <p className="font-mono text-sm bg-gray-100 dark:bg-gray-600 p-2 rounded-lg break-all mt-1">
                          {selectedProject.creator}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          Project ID
                        </span>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {selectedProject.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedProject.isRejected &&
                selectedProject.rejectionReason && (
                  <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Rejection Reason
                    </h3>
                    <p className="text-red-700 dark:text-red-300">
                      {selectedProject.rejectionReason}
                    </p>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  Project ID: {selectedProject.id}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {canApproveReject &&
                    !selectedProject.isApproved &&
                    !selectedProject.isRejected && (
                      <>
                        {!showReasonInput ? (
                          <>
                            <button
                              onClick={handleApprove}
                              disabled={isApproveLoading}
                              className="flex-1 sm:flex-none py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                              {isApproveLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Approve Project
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleRejectClick}
                              className="flex-1 sm:flex-none py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-5 h-5" />
                              Reject Project
                            </button>
                          </>
                        ) : (
                          <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-3">
                              Provide Rejection Reason
                            </h4>
                            <textarea
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
                              placeholder="Please provide a detailed reason for rejecting this project..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              rows={3}
                            />
                            <div className="flex flex-col sm:flex-row gap-2 mt-3">
                              <button
                                onClick={() => setShowReasonInput(false)}
                                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-medium rounded-lg transition-colors duration-300"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleReject}
                                disabled={
                                  isRejectLoading || !rejectReason.trim()
                                }
                                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isRejectLoading ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : null}
                                {isRejectLoading
                                  ? "Rejecting..."
                                  : "Confirm Rejection"}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                  <button
                    onClick={closeModal}
                    className="flex-1 sm:flex-none py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Close
                  </button>
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
