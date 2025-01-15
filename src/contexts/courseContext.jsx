import React, { createContext, useEffect, useState } from "react";
import Ecosystem2ABI from "../artifacts/contracts/Ecosystem Contracts/Ecosystem2.sol/Ecosystem2.json";
import { useEthersSigner } from "../components/useClientSigner";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

const Ecosystem2ContractAddress = import.meta.env
  .VITE_APP_ECOSYSTEM2_CONTRACT_ADDRESS;
const Ecosystem2_ABI = Ecosystem2ABI.abi;

const CourseContext = createContext();

const CourseProvider = ({ children }) => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      // Wait for signer to be fully resolved
      const resolvedSigner = await signer;

      console.log("Resolved Signer:", resolvedSigner);

      if (resolvedSigner) {
        try {
          const contract = new ethers.Contract(
            Ecosystem2ContractAddress,
            Ecosystem2_ABI,
            resolvedSigner
          );

          console.log("Contract instance:", contract);

          try {
            const coursesData = await contract.getAllCourses();
            console.log("Raw Courses Data:", coursesData);

            const formattedCourses = coursesData.map((course) => ({
              courseId: course.courseId.toString(),
              courseName: course.courseName,
              description: course.description,
              approved: course.approved,
              approvalCount: course.approvalCount.toString(),
              creator: course.creator,
            }));

            console.log("Formatted Courses:", formattedCourses);
            setCourses(formattedCourses);
          } catch (fetchError) {
            console.error("Error fetching courses:", fetchError);
          }
        } catch (contractError) {
          console.error("Error creating contract instance:", contractError);
        }
      } else {
        console.warn("No signer available");
      }
    };

    fetchCourses();
  }, [signer, courses]); // Dependency on signer ensures it runs when signer is ready

  return (
    <CourseContext.Provider value={{ courses }}>
      {children}
    </CourseContext.Provider>
  );
};

export { CourseContext };
export default CourseProvider;
