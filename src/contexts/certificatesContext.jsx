import { createContext, useContext, useState, useEffect } from "react";
import Ecosystem3FacetABI from "../artifacts/contracts/Ecosystem3Facet.sol/Ecosystem3Facet.json";
import CONTRACT_ADDRESSES from "../constants/addresses";
import { client } from "../services/client";
import { defineChain } from "thirdweb/chains";
import { getContract, readContract } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";

const DiamondAddress = CONTRACT_ADDRESSES.diamond;
const Ecosystem3Facet_ABI = Ecosystem3FacetABI.abi;

const CertificatesContext = createContext();

export const useCertificates = () => {
  return useContext(CertificatesContext);
};

export const CertificatesProvider = ({ children }) => {
  const [certificates, setCertificates] = useState([]);
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!isConnected) {
        throw new Error("User is not connected");
      }

      try {
        const contract = await getContract({
          address: DiamondAddress,
          abi: Ecosystem3Facet_ABI,
          client,
          chain: defineChain(11155111), // Sepolia
        });

        const certificates = await readContract({
          contract,
          method:
            "function getCertificates(address _learner) view returns ((uint256 certificateId, uint256 courseId, address learner, address cert_issuer, uint256 issue_date, string courseName, address owner)[])",
          params: [address],
        });

        const formattedCertificates = certificates.map((cert) => ({
          certificateId: cert.certificateId.toString(),
          courseId: cert.courseId.toString(),
          learner: cert.learner,
          cert_issuer: cert.cert_issuer,
          issue_date: cert.issue_date.toString(),
          courseName: cert.courseName,
          owner: cert.owner,
        }));

        setCertificates(formattedCertificates);
        console.log("Context Certificates:", certificates);
      } catch (error) {
        console.error("Error fetching certificates:", error);
      }
    };

    fetchCertificates();
  }, [address]);

  return (
    <CertificatesContext.Provider value={{ certificates }}>
      {children}
    </CertificatesContext.Provider>
  );
};
