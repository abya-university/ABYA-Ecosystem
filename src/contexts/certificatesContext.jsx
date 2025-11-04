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
  const [loading, setLoading] = useState(false);
  const account = useActiveAccount();
  const address = account?.address;

  // Create contract instance once
  const contract = getContract({
    address: DiamondAddress,
    abi: Ecosystem3Facet_ABI,
    client,
    chain: defineChain(11155111),
  });

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!address) {
        console.log("No address available, clearing certificates");
        setCertificates([]);
        return;
      }

      setLoading(true);
      try {
        console.log("Fetching certificates for address:", address);

        const certificates = await readContract({
          contract,
          method: "getCertificates",
          params: [address],
        });

        console.log("Raw certificates from contract:", certificates);

        if (
          !certificates ||
          !Array.isArray(certificates) ||
          certificates.length === 0
        ) {
          console.log("No certificates found for address:", address);
          setCertificates([]);
          return;
        }

        const read = (certItem, name, idx) => {
          const val = certItem?.[name] ?? certItem?.[idx];
          if (val === undefined || val === null) return undefined;
          if (typeof val === "bigint") return val.toString();
          if (typeof val === "object" && typeof val.toString === "function")
            return val.toString();
          return val;
        };

        const formattedCertificates = certificates.map((cert, index) => {
          const formattedCert = {
            certificateId: read(cert, "certId", 0) ?? index.toString(),
            courseId: read(cert, "courseId", 1) ?? "0",
            learner: read(cert, "learner", 2) ?? "",
            cert_issuer: read(cert, "cert_issuer", 3) ?? "",
            issue_date: read(cert, "issue_date", 4) ?? "0",
            courseName: read(cert, "courseName", 5) ?? "",
            owner: read(cert, "owner", 6) ?? address ?? "",
          };
          console.log(`Certificate ${index}:`, formattedCert);
          return formattedCert;
        });

        console.log("Formatted certificates:", formattedCertificates);
        setCertificates(formattedCertificates);
      } catch (error) {
        console.error("Error fetching certificates:", error);
        console.error("Error details:", error.message);
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [address, contract]);

  const value = {
    certificates,
    loading,
  };

  return (
    <CertificatesContext.Provider value={value}>
      {children}
    </CertificatesContext.Provider>
  );
};
