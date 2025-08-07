import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDisconnect, useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Power,
  Wallet2Icon,
  UserCircle,
  ChartNetwork,
  Check,
  CopyIcon,
  CopyCheckIcon,
  Wallet,
  Aperture,
} from "lucide-react";
import { createDidFromSigner } from "../services/didService";
import { registerDidOnIpfs } from "../services/ipfsService";
import { useEthersSigner } from "./useClientSigner";
import { useDid } from "../contexts/DidContext";
import { useProfile } from "../contexts/ProfileContext";

const WalletConnection = () => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDidCopied, setIsDidCopied] = useState(false);
  const { ethrDid, setEthrDid } = useDid();
  const dropdownRef = useRef(null);
  const toggleRef = useRef(null);
  const { data: balanceData } = useBalance({ address });
  const signerPromise = useEthersSigner();
  const { clearProfile, profile } = useProfile();

  // Fetch DID on connect
  useEffect(() => {
    if (!isConnected) {
      setEthrDid("");
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const signer = await signerPromise;
        console.log("Signer:", signer);
        const registry = import.meta.env.VITE_APP_DID_REGISTRY_CONTRACT_ADDRESS;
        const did = await createDidFromSigner(
          signer,
          registry,
          "skaleTitanTestnet"
        );
        if (!mounted) return;
        setEthrDid(did);
        await registerDidOnIpfs(did);
      } catch (err) {
        console.error("Error in DID creation or IPFS registration:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isConnected, signerPromise, setEthrDid]);

  // Outside click / ESC
  useEffect(() => {
    const onClick = (e) => {
      if (
        dropdownVisible &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !toggleRef.current.contains(e.target)
      )
        setDropdownVisible(false);
    };
    const onKey = (e) =>
      e.key === "Escape" && dropdownVisible && setDropdownVisible(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownVisible]);

  const copyText = (text, setCopied) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const signOut = () => {
    disconnect();
    setDropdownVisible(false);
    if (profile.did !== null) {
      // If profile is connected, clear it
      clearProfile();
    }
    // navigate("/");
  };

  if (!isConnected) return <ConnectButton />;

  return (
    <div className="relative">
      <button
        ref={toggleRef}
        onClick={() => setDropdownVisible((v) => !v)}
        className="flex items-center space-x-2 bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600"
        aria-haspopup="menu"
        aria-expanded={dropdownVisible}
      >
        <span
          className={`h-3 w-3 rounded-full bg-green-500`}
          aria-label="Connected"
        />
        <Wallet2Icon size={20} />
      </button>

      {dropdownVisible && (
        <div
          ref={dropdownRef}
          role="menu"
          className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="bg-yellow-500/10 p-4 flex items-center space-x-3 border-b dark:border-gray-700">
            <Wallet2Icon className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                Wallet Details
              </h3>
              {/* <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{address}</p> */}
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Status */}
            <div className="flex justify-between">
              <span className="flex items-center space-x-2 dark:text-gray-300">
                <ChartNetwork />
                <span>Status</span>
              </span>
              <span className="flex items-center space-x-1 text-green-500">
                <Check />
                <span>Connected</span>
              </span>
            </div>

            {/* Copy Address */}
            <div className="flex justify-between dark:text-gray-300">
              <button
                onClick={() => copyText(address, setIsCopied)}
                className="flex items-center space-x-1 hover:underline"
              >
                {isCopied ? (
                  <CopyCheckIcon className="w-5 h-5 text-yellow-500" />
                ) : (
                  <CopyIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}{" "}
                <span>Address</span>
              </button>
              <span className="font-semibold text-sm truncate max-w-[150px]">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>

            {/* Copy DID */}
            {ethrDid && (
              <div className="flex justify-between dark:text-gray-300">
                <button
                  onClick={() => copyText(ethrDid, setIsDidCopied)}
                  className="flex items-center space-x-1 hover:underline"
                >
                  {isDidCopied ? (
                    <CopyCheckIcon className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <CopyIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}{" "}
                  <span>DID</span>
                </button>
                <span className="font-semibold text-sm break-all max-w-[200px] dark:text-blue-500">
                  {ethrDid.replace(/^(.{12}).*(.{8})$/, "$1…$2")}
                </span>
              </div>
            )}

            {/* Ether Balance */}
            <div className="flex justify-between dark:text-gray-300">
              <span className="flex items-center space-x-2">
                <Wallet />
                <span>Balance</span>
              </span>
              <span className="font-semibold dark:text-yellow-500">
                {balanceData
                  ? parseFloat(balanceData.formatted).toFixed(5)
                  : "0.00000"}{" "}
                {balanceData?.symbol}
              </span>
            </div>

            {/* Token Balance Placeholder */}
            <div className="flex justify-between dark:text-gray-300">
              <span className="flex items-center space-x-2">
                <Aperture />
                <span>Token Balance</span>
              </span>
              <span className="font-semibold dark:text-purple-600">--</span>
            </div>

            {/* Disconnect */}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 p-2 rounded-lg"
            >
              <Power />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
