import React, { useState } from "react";
import { Loader, Eye, EyeOff } from "lucide-react";
import { ethers } from "ethers";

const VITE_VC_INFURA_URL = "https://sepolia.infura.io/v3/189303beb46d46d8a0327f90f441168d";
const VITE_VC_CONTRACT_ADDRESS = "0xBe203f08DC55566fe826c6aAE8eb29cfE69Ae520";

const contractABI = [
  "function issueCredential(string studentDID, string credentialType, string metadata, string credentialHash, string signature) public",
  "function verifyCredential(uint256 id, string credentialHash) public view returns (bool)",
];

const mockStudentDID = "did:ethr:sepolia:0xa77759E342c83377449B2fB2eCe35b621de40Bf5";

const mockCourses = [
  {
    courseId: "vc-101",
    title: "Introduction to Verifiable Credentials",
    description: "Learn the fundamentals of Verifiable Credentials.",
    instructor: "Dr. Jane Doe",
    duration: "4 weeks",
    level: "Intermediate",
  },
  {
    courseId: "vc-102",
    title: "Blockchain Basics",
    description: "Understand the core principles of blockchain technology.",
    instructor: "Prof. John Smith",
    duration: "6 weeks",
    level: "Beginner",
  },
];

const VCIssuanceForm = () => {
  // States for issuing a credential
  const [issuerPrivateKey, setIssuerPrivateKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [vcDocument, setVcDocument] = useState(null);

  // States for verifying a credential
  const [verificationId, setVerificationId] = useState("");
  const [verificationHash, setVerificationHash] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const toggleCourseSelection = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleIssueCredential = async () => {
    if (!issuerPrivateKey.trim() || selectedCourses.length === 0) {
      setError("Please enter the issuer's private key and select at least one course.");
      return;
    }
    setError("");
    setLoading(true);
    setTxHash("");
    setVcDocument(null);

    try {
      const provider = new ethers.JsonRpcProvider(VITE_VC_INFURA_URL);
      const wallet = new ethers.Wallet(issuerPrivateKey, provider);
      const contract = new ethers.Contract(VITE_VC_CONTRACT_ADDRESS, contractABI, wallet);

      const issuanceDate = new Date().toISOString();
      const issuedCourses = mockCourses.filter((course) => selectedCourses.includes(course.courseId));
      const metadata = JSON.stringify(issuedCourses);
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(metadata));
      const signature = await wallet.signMessage(credentialHash);

      const tx = await contract.issueCredential(
        mockStudentDID,
        "CourseCompletion",
        metadata,
        credentialHash,
        signature
      );

      await tx.wait();
      setTxHash(tx.hash);

      const vcDoc = {
        "@context": "https://www.w3.org/ns/credentials/v2",
        id: `urn:uuid:${Math.random().toString(36).substring(7)}`,
        type: ["VerifiableCredential", "CourseCompletion"],
        issuer: {
          id: "did:example:abya-university",
          name: "ABYA University",
        },
        issuanceDate,
        credentialSubject: {
          id: mockStudentDID,
          courses: issuedCourses,
        },
        proof: {
          type: "EcdsaSecp256k1Signature2019",
          created: issuanceDate,
          proofPurpose: "assertionMethod",
          verificationMethod: "did:ethr:sepolia:0xBe203f08DC55566fe826c6aAE8eb29cfE69Ae520#key-1",
          signatureValue: signature,
        },
      };
      setVcDocument(vcDoc);
    } catch (err) {
      console.error(err);
      setError("Credential issuance failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCredential = async () => {
    if (!verificationId || !verificationHash.trim()) {
      setVerificationError("Please enter a credential ID and its hash for verification.");
      return;
    }
    setVerificationError("");
    setVerificationLoading(true);
    setVerificationResult(null);

    try {
      const provider = new ethers.JsonRpcProvider(VITE_VC_INFURA_URL);
      const contract = new ethers.Contract(VITE_VC_CONTRACT_ADDRESS, contractABI, provider);

      const isValid = await contract.verifyCredential(verificationId, verificationHash);
      setVerificationResult(isValid);
    } catch (err) {
      console.error(err);
      setVerificationError("Verification failed.");
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 space-y-8">
      {/* Credential Issuance Section */}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-semibold mb-6 text-yellow-500 text-center">Issue Verifiable Credential</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Issuer Private Key</label>
          <div className="relative">
            <input
              type={showPrivateKey ? "text" : "password"}
              value={issuerPrivateKey}
              onChange={(e) => setIssuerPrivateKey(e.target.value)}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-yellow-300 focus:border-yellow-300 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="absolute right-2 top-2 text-gray-500 hover:text-yellow-700"
            >
              {showPrivateKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-2">Select Courses</h2>
        {mockCourses.map((course) => (
          <div key={course.courseId} className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={selectedCourses.includes(course.courseId)}
              onChange={() => toggleCourseSelection(course.courseId)}
              className="mr-2"
            />
            <label>{course.title}</label>
          </div>
        ))}
        <button
          onClick={handleIssueCredential}
          className="w-full mt-4 p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          disabled={loading}
        >
          {loading ? <Loader size={20} className="animate-spin mx-auto" /> : "Issue Credential"}
        </button>
        {txHash && <p className="mt-4 p-4 text-green-500 overflow-x-auto">Transaction Hash: {txHash}</p>}
        {vcDocument && (
          <div className="mt-6 p-4 bg-gray-100 border rounded">
            <h3 className="font-semibold">Generated VC Document:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(vcDocument, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Credential Verification Section */}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-semibold mb-6 text-yellow-500 text-center">Verify Credential</h2>
        {verificationError && <p className="text-red-500 mb-4">{verificationError}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Credential ID</label>
          <input
            type="number"
            value={verificationId}
            onChange={(e) => setVerificationId(e.target.value)}
            placeholder="Enter credential ID"
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-yellow-300 focus:border-yellow-300"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Credential Hash</label>
          <input
            type="text"
            value={verificationHash}
            onChange={(e) => setVerificationHash(e.target.value)}
            placeholder="Enter credential hash"
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-yellow-300 focus:border-yellow-300"
          />
        </div>
        <button
          onClick={handleVerifyCredential}
          className="w-full mt-4 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          disabled={verificationLoading}
        >
          {verificationLoading ? <Loader size={20} className="animate-spin mx-auto" /> : "Verify Credential"}
        </button>
        {verificationResult !== null && (
          <p className={`mt-4 p-4 ${verificationResult ? "text-green-500" : "text-red-500"}`}>
            {verificationResult ? "Credential is valid." : "Credential is invalid."}
          </p>
        )}
      </div>
    </div>
  );
};

export default VCIssuanceForm;
