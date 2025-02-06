import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const INFURA_URL = process.env.INFURA_URL;
const provider = new ethers.JsonRpcProvider(INFURA_URL);

export default provider;
