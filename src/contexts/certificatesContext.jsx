import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import Ecosystem3FacetABI from "../artifacts/contracts/DiamondProxy/Ecosystem3Facet.sol/Ecosystem3Facet.json";
import { useEthersSigner } from "../components/useClientSigner";

const CertificatesContext = createContext();

export const useCertificates = () => {
  return useContext(CertificatesContext);
};

export const CertificatesProvider = ({ children }) => {
  const [certificates, setCertificates] = useState([]);
  const { address } = useAccount();
  const EcosystemDiamondAddress = import.meta.env
    .VITE_APP_DIAMOND_CONTRACT_ADDRESS;
  const signerPromise = useEthersSigner();

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!address) return;

      try {
        const signer = await signerPromise;
        const contract = new ethers.Contract(
          EcosystemDiamondAddress,
          Ecosystem3FacetABI.abi,
          signer
        );

        const certificates = await contract.getCertificates(address);
        setCertificates(
          certificates.map((cert) => ({
            certificateId: cert[0].toString(),
            courseId: cert[1].toString(),
            learner: cert[2],
            cert_issuer: cert[3],
            issue_date: cert[4].toString(),
            courseName: cert[5],
            owner: cert[6],
          }))
        );
        console.log("Context Certificates:", certificates);
      } catch (error) {
        console.error("Error fetching certificates:", error);
      }
    };

    fetchCertificates();
  }, [address, EcosystemDiamondAddress, signerPromise]);

  return (
    <CertificatesContext.Provider value={{ certificates }}>
      {children}
    </CertificatesContext.Provider>
  );
};
