import { useProjectProposals } from "../contexts/projectProposalsContext";
import { useEffect, useState } from "react";

const ProjectDetails = () => {
  const { proposals, fetchProposals } = useProjectProposals();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
      0: "Proposal",
      1: "Under Review",
      2: "Approved",
      3: "Funding",
      4: "Development",
      5: "Completed",
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

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        {proposals.length === 0 ? (
          <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-10">
            No proposals found
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

              <div className="space-y-4">
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
                  <div className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {selectedProject.description}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Project Details
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Requested Amount:
                        </span>
                        <span className="font-medium">
                          {selectedProject.requestedAmount} ETH
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Timeline:
                        </span>
                        <span className="font-medium">
                          {selectedProject.timeline} days
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Status:
                        </span>
                        <span
                          className={`font-medium ${
                            getStatusLabel(selectedProject) === "Approved"
                              ? "text-green-500"
                              : getStatusLabel(selectedProject) === "Rejected"
                              ? "text-red-500"
                              : "text-blue-500"
                          }`}
                        >
                          {getStatusLabel(selectedProject)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Approvals:
                        </span>
                        <span className="font-medium">
                          {selectedProject.approvalCount}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Technical Info</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Tech Stack:
                        </span>
                        <span className="font-medium">
                          {formatTechStack(selectedProject.techStack)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Blockchain:
                        </span>
                        <span className="font-medium">
                          {selectedProject.blockchain}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Creator:
                        </span>
                        <span className="font-medium text-sm break-all">
                          {selectedProject.creator}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Project ID:
                        </span>
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

                <div className="flex justify-end pt-4">
                  <button
                    onClick={closeModal}
                    className="py-2 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-medium rounded-lg transition-colors duration-300"
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
