// ABYA-Ecosystem/src/pages/Achievements.jsx
import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Star,
  Award,
  BadgeCheck,
  Calendar,
  MapPin,
  Globe,
  Users,
  ChevronRight,
  ExternalLink,
  Grid,
  List,
  Eye,
  Download,
  Share2,
  Lock,
  Sparkles,
  Zap,
  Flame,
  Crown,
  Target,
  Shield,
  CheckCircle,
  Clock,
  FileText,
  Key,
  Verified,
  X,
  Bell,
  Hash,
} from "lucide-react";
import { useCertificates } from "../contexts/certificatesContext";
import { useDid } from "../contexts/DidContext";
import Certificate from "../components/Certificate";
import { CSSTransition } from "react-transition-group";
import "../index.css";
import { useCommunityMembers } from "../contexts/communityMembersContext";
import { useCommunityEvents } from "../contexts/communityEventsContext";
import { useActiveAccount } from "thirdweb/react";
import QRCode from "react-qr-code";

const BADGE_DISPLAY_MAP = {
  0: {
    name: "Newcomer",
    // icon: <Medal className="w-5 h-5" />,
    icon: <img src="/newcomer.jpg" className="" />,
    color: "from-gray-400 to-gray-500",
    border: "border-gray-200",
    lightBg: "bg-gray-50",
    requirements: "Join the community",
  },
  1: {
    name: "Participant",
    // icon: <Star className="w-5 h-5" />,
    icon: <img src="/participant.jpg" className="" />,
    color: "from-amber-400 to-amber-500",
    border: "border-amber-100",
    lightBg: "bg-amber-50",
    requirements: "Complete 1+ Event",
  },
  2: {
    name: "Contributor",
    // icon: <Award className="w-5 h-5" />,
    icon: <img src="/contributor.jpg" className="" />,
    color: "from-blue-400 to-blue-500",
    border: "border-blue-100",
    lightBg: "bg-blue-50",
    requirements: "Complete 3+ Events",
  },
  3: {
    name: "Leader",
    // icon: <Trophy className="w-5 h-5" />,
    icon: <img src="/leader.jpg" className="" />,
    color: "from-yellow-400 to-yellow-500",
    border: "border-yellow-100",
    lightBg: "bg-yellow-50",
    requirements: "Complete 5+ Events",
  },
  4: {
    name: "Champion",
    // icon: <Crown className="w-5 h-5" />,
    icon: <img src="/champion.jpg" className="" />,
    color: "from-purple-400 to-purple-500",
    border: "border-purple-100",
    lightBg: "bg-purple-50",
    requirements: "Complete 10+ Events",
  },
};

const AchievementsPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { certificates, getTokenURI } = useCertificates();
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenURIs, setTokenURIs] = useState({});
  const [tokenMeta, setTokenMeta] = useState({});
  const [selectedSBT, setSelectedSBT] = useState(null);
  const [showSBTPopup, setShowSBTPopup] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [filter, setFilter] = useState("all");
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [verifiableCredentials, setVerifiableCredentials] = useState([]);
  const [vcLoading, setVcLoading] = useState(false);
  const [vcError, setVcError] = useState(null);
  const [selectedVC, setSelectedVC] = useState(null);
  const [showVCDetailPopup, setShowVCDetailPopup] = useState(false);
  const [showVPModal, setShowVPModal] = useState(false);
  const [vpLoading, setVpLoading] = useState(false);
  const [vpError, setVpError] = useState(null);
  const [createdVP, setCreatedVP] = useState(null);

  const [userBadge, setUserBadge] = useState(null);
  const { memberBadgeDetails, fetchMemberBadgeDetails } = useCommunityMembers();
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const currentBadgeLevel = memberBadgeDetails?.currentBadge || 0;
  const badgeInfo = BADGE_DISPLAY_MAP[currentBadgeLevel];
  const { events, fetchEvents } = useCommunityEvents();
  const { members, fetchMembers } = useCommunityMembers();
  const { getVerifiableCredentials, did } = useDid();

  const [showVCPresentationsPopup, setShowVCPresentationsPopup] = useState(false);
  const [vpList, setVpList] = useState([]);
  const [vpListLoading, setVpListLoading] = useState(false);
  const [vpListError, setVpListError] = useState(null);
  const [selectedPresentation, setSelectedPresentation] = useState(null);

  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [shareMap, setShareMap] = useState({});
  const [shareInfo, setShareInfo] = useState(null);
  const [shareTtl, setShareTtl] = useState(3600);
  const [shareCountdown, setShareCountdown] = useState(null);


  // Mock ABYTKN tokens
  const abytkns = [
    {
      id: 1,
      name: "Blockchain Basics",
      value: "250 ABYTKN",
      date: "Jan 20, 2024",
      status: "claimed",
      rarity: "common",
      icon: "🔗",
    },
    {
      id: 2,
      name: "Smart Contract Mastery",
      value: "500 ABYTKN",
      date: "Feb 28, 2024",
      status: "claimed",
      rarity: "rare",
      icon: "⚡",
    },
    {
      id: 3,
      name: "Web3 Security",
      value: "750 ABYTKN",
      date: "Mar 15, 2024",
      status: "pending",
      rarity: "epic",
      icon: "🛡️",
    },
  ];

  const formatVCDate = (seconds) => {
    if (seconds === undefined || seconds === null) return "Unknown";
    const ms = Number(seconds) * 1000;
    if (Number.isNaN(ms)) return "Unknown";
    return new Date(ms).toLocaleDateString();
  };

  useEffect(() => {
    fetchEvents();
    if (address) {
      fetchMemberBadgeDetails(address);
    }
    fetchMembers();
  }, [address]);

  useEffect(() => {
    if (memberBadgeDetails) {
      setUserBadge(memberBadgeDetails.currentBadge);
    }
  }, [memberBadgeDetails]);

  useEffect(() => {
    const fetchVCs = async () => {
      if (!address || !getVerifiableCredentials) return;
      setVcLoading(true);
      setVcError(null);

      try {
        const vcs = await getVerifiableCredentials(address);
        setVerifiableCredentials(Array.isArray(vcs) ? vcs : []);
      } catch (error) {
        console.error("Failed to load VCs:", error);
        setVcError(error?.message || "Failed to load verifiable credentials");
      } finally {
        setVcLoading(false);
      }
    };

    fetchVCs();
  }, [address, getVerifiableCredentials]);

  useEffect(() => {
    const fetchTokenURIs = async () => {
      if (!certificates || certificates.length === 0) return;
      const uris = {};
      for (const cert of certificates) {
        if (cert.certificateId) {
          const uri = await getTokenURI(cert.certificateId);
          if (uri) {
            uris[cert.certificateId] = uri;
          }
        }
      }
      setTokenURIs(uris);
    };
    fetchTokenURIs();
  }, [certificates, getTokenURI]);

  useEffect(() => {
    const fetchMeta = async () => {
      if (!tokenURIs || Object.keys(tokenURIs).length === 0) return;
      const metaMap = {};
      await Promise.all(
        Object.entries(tokenURIs).map(async ([tokenId, uri]) => {
          try {
            const res = await fetch(`https://gateway.pinata.cloud/ipfs/${uri}`);
            if (res.ok) {
              const json = await res.json();
              metaMap[tokenId] = json;
            }
          } catch (err) {
            console.error("Metadata fetch failed:", err);
          }
        }),
      );
      setTokenMeta(metaMap);
    };
    fetchMeta();
  }, [tokenURIs]);

  useEffect(() => {
    if (!showVCPresentationsPopup) return;

    // Build ownerDid: prefer the wallet address (frontend subject DID),
    // fall back to `did` from useDid() if no wallet address available.
    const ownerDidCandidate = address
      ? `did:ethr:sepolia:${address}`
      : did || null;

    if (!ownerDidCandidate) {
      setVpList([]);
      setVpListError("No owner DID available (wallet not connected).");
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchVPs = async () => {
      setVpListLoading(true);
      setVpListError(null);

      try {
        const res = await fetch(
          `http://localhost:3000/vp/owner/${encodeURIComponent(ownerDidCandidate)}`,
          { signal }
        );

        if (!res.ok) {
          // Try to parse error body for better message
          let errText = `Failed to fetch VPs (${res.status})`;
          try {
            const errJson = await res.json();
            errText = errJson.error || errJson.message || errText;
          } catch (e) {
            // ignore parse error
          }
          throw new Error(errText);
        }

        const data = await res.json();

        // server returns: { success: true, count, presentations }
        if (data && Array.isArray(data.presentations)) {
          setVpList(data.presentations);
        } else if (Array.isArray(data)) {
          setVpList(data);
        } else if (data && data.rows && Array.isArray(data.rows)) {
          setVpList(data.rows);
        } else {
          setVpList([]);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          // fetch aborted, ignore
          return;
        }
        console.error("VP List fetch error:", err);
        setVpListError(err.message || "Failed to fetch verifiable presentations");
        setVpList([]);
      } finally {
        setVpListLoading(false);
      }
    };

    fetchVPs();

    // cleanup: abort fetch if popup is closed or effect re-runs
    return () => controller.abort();
  }, [showVCPresentationsPopup, did, address]);

  useEffect(() => {
    if (!shareInfo) {
      setShareCountdown(null);
      return;
    }
    const update = () => {
      const expiresAt = new Date(shareInfo.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setShareCountdown(remaining);
      if (remaining <= 0) {
        // clean up expired share in UI (optionally)
        // you can also refetch shareInfo if desired
      }
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [shareInfo]);

  useEffect(() => {
    // clear UI errors when switching
    setShareError(null);

    if (!selectedPresentation) {
      setShareInfo(null);
      setShareCountdown(null);
      return;
    }

    const pid = selectedPresentation.presentationId;
    const list = shareMap?.[pid] ?? [];

    // choose the most recent share by created order (0 = newest if you push unshift)
    const latest = list.length > 0 ? list[0] : null;
    setShareInfo(latest);

    // reset countdown effect (it already watches shareInfo)
    if (!latest) {
      setShareCountdown(null);
    }
  }, [selectedPresentation, shareMap]);

  const handleSBTSelect = (cert, meta) => {
    const imageCid = meta?.image?.replace("ipfs://", "");
    setSelectedSBT({
      cert,
      meta,
      imageUrl: imageCid
        ? `https://gateway.pinata.cloud/ipfs/${imageCid}`
        : null,
    });
    setShowSBTPopup(true);
  };

  const handleCertificateClick = (cert) => {
    setSelectedCertificate(cert);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setTimeout(() => setSelectedCertificate(null), 300);
  };

  const convertBigIntToString = (obj) => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === "bigint") {
      return obj.toString();
    }

    if (typeof obj === "object") {
      if (Array.isArray(obj)) {
        return obj.map(item => convertBigIntToString(item));
      }
      const converted = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          converted[key] = convertBigIntToString(obj[key]);
        }
      }
      return converted;
    }

    return obj;
  };

  const handleCreateVP = async (vc) => {
    if (!vc) return;

    setVpLoading(true);
    setVpError(null);
    setCreatedVP(null);

    try {
      // Convert BigInt values to strings for JSON serialization
      const convertedVc = convertBigIntToString(vc);

      // Encode the VC as a JWT string for the backend
      const vcJwt = JSON.stringify(convertedVc);

      // Capture the original wallet/subject DID before any auto-generation
      let originalCandidate = did || vc.subjectDID || vc.subject || null;

      // ownerDid is the original subject DID
      let ownerDidToStore = originalCandidate;

      // holderDid starts as the original candidate but may be replaced by agent-managed DID
      let holderDid = originalCandidate;

      const looksLikeWalletDid = (d) => {
        return typeof d === "string" && d.startsWith("did:ethr:") && d.includes("0x");
      };

      // If the selected DID looks wallet-controlled or is null, request agent-managed DID
      if (!holderDid || looksLikeWalletDid(holderDid)) {
        try {
          const genRes = await fetch("http://localhost:3000/did/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: "did:ethr" }),
          });

          if (genRes.ok) {
            const genData = await genRes.json();
            holderDid = genData?.identifier?.did || holderDid;
            console.log("Using agent-managed holder DID:", holderDid);
          } else {
            // fallback to did:key
            const keyRes = await fetch("http://localhost:3000/did/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider: "did:key" }),
            });

            if (keyRes.ok) {
              const keyData = await keyRes.json();
              holderDid = keyData?.identifier?.did || holderDid;
              console.log("Using fallback did:key holder DID:", holderDid);
            } else {
              console.warn("Fallback did:key creation also failed", keyRes.status);
            }
          }
        } catch (e) {
          console.error("Auto-create agent-managed DID failed:", e);
        }
      }

      // Build payload — send both holderDid (agent DID) and ownerDid (original wallet DID)
      const payload = {
        verifiableCredentials: [vcJwt],
        verifiableCredentialsWithJwt: [{ jwt: vcJwt }],
        rawVerifiableCredentials: [convertedVc],
        holderDid,
        ownerDid: ownerDidToStore,        // <-- this is the key change
        jwt: vcJwt,
      };

      console.log("VP Payload:", JSON.stringify(payload, null, 2));

      const res = await fetch("http://localhost:3000/presentation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = `Failed to create Verifiable Presentation (${res.status})`;
        try {
          const errData = await res.json();
          errorMessage = errData.error || errData.message || errorMessage;
        } catch {
          const errText = await res.text();
          errorMessage = errText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Store response in state
      setCreatedVP(data.presentation || data.vp || data);

    } catch (err) {
      console.error("VP Creation Error:", err);
      setVpError(err.message || "Failed to create VP");
    } finally {
      setVpLoading(false);
    }
  };

  const handleEventDetailsClick = (event) => {
    setSelectedEvent(event);
    setShowEventPopup(true);
  };

  const getEventStatus = (startTime, endTime) => {
    const now = Date.now();
    if (now < startTime) return "upcoming";
    if (now > endTime) return "past";
    return "ongoing";
  };

  const getEventStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ongoing":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "past":
        return "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleParticipateInEvent = async (eventId) => {
    // Implement your contract interaction here
    console.log("Participating in event:", eventId);
  };

  const filteredCertificates = certificates.filter((cert) => {
    if (filter === "claimed") return cert.status === "claimed";
    if (filter === "pending") return cert.status === "pending";
    return true;
  });

  const getRarityColor = (rarity) => {
    const colors = {
      legendary: "bg-gradient-to-r from-purple-500 to-pink-500",
      epic: "bg-gradient-to-r from-orange-500 to-red-500",
      rare: "bg-gradient-to-r from-blue-500 to-cyan-500",
      common: "bg-gradient-to-r from-green-500 to-emerald-500",
    };
    return colors[rarity.toLowerCase()] || colors.common;
  };

  const getVCStatusColor = (status) => {
    switch (status) {
      case "valid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "expiring":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "revoked":
        return "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVCTypeIcon = (type) => {
    switch (type) {
      case "Identity":
        return <Shield className="w-4 h-4" />;
      case "Education":
        return <FileText className="w-4 h-4" />;
      case "Professional":
        return <BadgeCheck className="w-4 h-4" />;
      default:
        return <Key className="w-4 h-4" />;
    }
  };

  const normalizePresentationRow = (row) => {
    // row likely contains: { id, presentationId, ownerDid, holderDid, issuerDid, presentation, createdAt }
    const presentationField = row.presentation ?? row.presentationData ?? row.vp ?? null;

    // presentationField might be a JSON string or an object
    let presentationObj = presentationField;
    if (typeof presentationField === "string") {
      try {
        presentationObj = JSON.parse(presentationField);
      } catch (e) {
        // leave as string if not JSON
      }
    }

    return {
      presentationId:
        row.presentationId ||
        row.presentationID ||
        presentationObj?.id ||
        row.id ||
        `vp-${row.id}`,
      ownerDid: row.ownerDid || row.ownerDID || presentationObj?.owner || null,
      holderDid:
        row.holderDid ||
        row.holder ||
        presentationObj?.holder ||
        presentationObj?.holderDid ||
        null,
      issuerDid:
        row.issuerDid ||
        row.issuer ||
        presentationObj?.issuer ||
        presentationObj?.issuerDid ||
        null,
      presentation: presentationObj,
      createdAt:
        row.createdAt ||
        row.created_at ||
        presentationObj?.createdAt ||
        presentationObj?.issuanceDate ||
        new Date().toISOString(),
      raw: row,
    };
  };

  // quick JWT test
  const isJwtString = (s) => {
    return typeof s === "string" && s.split(".").length === 3;
  };

  // Inspect a presentation object/string and produce a small status summary
  const inspectPresentation = (presentation) => {
    const summary = {
      vpIsJwt: false,
      totalVCs: 0,
      vcJwtCount: 0,
      vcNonJwtCount: 0,
      messages: [],
      complete: false, // VP jwt + all VCs jwt
      partial: false, // VP jwt but some VCs not jwt
      incomplete: false, // missing vp or missing vcs
    };

    try {
      // If presentation is a compact JWT string
      if (typeof presentation === "string") {
        if (isJwtString(presentation)) {
          summary.vpIsJwt = true;
          summary.messages.push("Presentation is a compact JWT");
        } else {
          summary.messages.push("Presentation is a string but not a JWT");
        }
        // No nested VCs to inspect in this simple string case
        summary.incomplete = true;
        return summary;
      }

      // If presentation is an object
      if (!presentation || typeof presentation !== "object") {
        summary.messages.push("Presentation missing or invalid type");
        summary.incomplete = true;
        return summary;
      }

      // Detect if object has a JWT form at top-level (some libs return { jwt: '...' })
      if (presentation.jwt && isJwtString(presentation.jwt)) {
        summary.vpIsJwt = true;
        summary.messages.push("Presentation has top-level jwt");
      } else if (presentation.verifiablePresentation && typeof presentation.verifiablePresentation === "string" && isJwtString(presentation.verifiablePresentation)) {
        summary.vpIsJwt = true;
        summary.messages.push("Presentation.verifiablePresentation is a JWT string");
      } else if (presentation.proof && typeof presentation.proof === "object" && presentation.proof.jwt && isJwtString(presentation.proof.jwt)) {
        summary.vpIsJwt = true;
        summary.messages.push("Presentation proof contains jwt");
      } else {
        // Not a VP JWT, that's okay — still inspect VCs if present
        summary.messages.push("Presentation is not a compact VP JWT");
      }

      // Gather possible VC arrays / singletons
      let vcs = presentation.verifiableCredential ?? presentation.verifiableCredentials ?? presentation.vc ?? null;

      // Some presentations wrap VC inside a 'vp' or 'presentation' object: check common locations
      if (!vcs && presentation.vp && (presentation.vp.verifiableCredential || presentation.vp.verifiableCredentials)) {
        vcs = presentation.vp.verifiableCredential ?? presentation.vp.verifiableCredentials;
      }

      // Normalize single VC to array
      if (vcs && !Array.isArray(vcs)) {
        vcs = [vcs];
      }

      if (!vcs || vcs.length === 0) {
        summary.messages.push("No verifiable credentials found inside presentation");
        summary.incomplete = true;
        return summary;
      }

      summary.totalVCs = vcs.length;

      // Inspect each VC entry
      for (const entry of vcs) {
        if (typeof entry === "string") {
          if (isJwtString(entry)) {
            summary.vcJwtCount++;
          } else {
            summary.vcNonJwtCount++;
          }
        } else if (entry && typeof entry === "object") {
          // object might embed JWT at several possible paths
          if (entry.jwt && isJwtString(entry.jwt)) {
            summary.vcJwtCount++;
          } else if (entry.verifiableCredential && typeof entry.verifiableCredential === "string" && isJwtString(entry.verifiableCredential)) {
            summary.vcJwtCount++;
          } else if (entry.vc && typeof entry.vc === "object" && entry.vc.jwt && isJwtString(entry.vc.jwt)) {
            summary.vcJwtCount++;
          } else if (entry.proof && typeof entry.proof === "object" && entry.proof.jwt && isJwtString(entry.proof.jwt)) {
            summary.vcJwtCount++;
          } else if (entry.credential && typeof entry.credential === "object" && entry.credential.proof && entry.credential.proof.jwt && isJwtString(entry.credential.proof.jwt)) {
            summary.vcJwtCount++;
          } else {
            // it's an object W3C credential (JSON-LD) — count as non-JWT W3C VC
            summary.vcNonJwtCount++;
          }
        } else {
          summary.vcNonJwtCount++;
        }
      }

      // Compose final flags
      if (summary.vpIsJwt && summary.vcJwtCount === summary.totalVCs && summary.totalVCs > 0) {
        summary.complete = true;
        summary.messages.push("VP is JWT and all nested VCs are JWTs");
      } else if (summary.vpIsJwt && summary.vcJwtCount > 0) {
        summary.partial = true;
        summary.messages.push(
          `VP is JWT and contains ${summary.vcJwtCount}/${summary.totalVCs} VC JWT(s)`
        );
      } else if (!summary.vpIsJwt && summary.vcJwtCount > 0) {
        summary.partial = true;
        summary.messages.push(
          `VP is not JWT but contains ${summary.vcJwtCount}/${summary.totalVCs} VC JWT(s)`
        );
      } else {
        summary.incomplete = true;
        summary.messages.push("Presentation lacks required JWTs");
      }
    } catch (err) {
      summary.incomplete = true;
      summary.messages.push("Inspection failed: " + (err && err.message));
    }

    return summary;
  };

  // small copy helper
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      // optional: toast or small feedback
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  // safe (non-verifying) JWT payload decoder for display
  const decodeJwtPayloadSafe = (jwt) => {
    try {
      if (!jwt || typeof jwt !== "string") return null;
      const parts = jwt.split(".");
      if (parts.length !== 3) return null;
      // base64url -> base64
      const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
      const json = atob(padded);
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  };

  // return vpJwt (if any) and array of vc entries separated into jwt strings vs objects
  const extractVpAndVcs = (presentation) => {
    const result = { vpJwt: null, vcJwtList: [], vcObjects: [] };

    if (!presentation) return result;

    // if presentation is a compact JWT string
    if (typeof presentation === "string") {
      if (isJwtString(presentation)) result.vpJwt = presentation;
      return result;
    }

    // common vp jwt locations
    if (presentation.jwt && isJwtString(presentation.jwt)) result.vpJwt = presentation.jwt;
    else if (presentation.verifiablePresentation && isJwtString(presentation.verifiablePresentation)) result.vpJwt = presentation.verifiablePresentation;
    else if (presentation.proof && presentation.proof.jwt && isJwtString(presentation.proof.jwt)) result.vpJwt = presentation.proof.jwt;

    // find VCs
    let vcs = presentation.verifiableCredential ?? presentation.verifiableCredentials ?? presentation.vc ?? null;
    if (!vcs && presentation.vp && (presentation.vp.verifiableCredential || presentation.vp.verifiableCredentials)) {
      vcs = presentation.vp.verifiableCredential ?? presentation.vp.verifiableCredentials;
    }
    if (vcs && !Array.isArray(vcs)) vcs = [vcs];

    if (vcs && vcs.length > 0) {
      for (const entry of vcs) {
        if (typeof entry === "string") {
          if (isJwtString(entry)) result.vcJwtList.push(entry);
          else result.vcObjects.push(entry);
        } else if (entry && typeof entry === "object") {
          // check for embedded jwt fields
          if (entry.jwt && isJwtString(entry.jwt)) result.vcJwtList.push(entry.jwt);
          else if (entry.verifiableCredential && typeof entry.verifiableCredential === "string" && isJwtString(entry.verifiableCredential)) result.vcJwtList.push(entry.verifiableCredential);
          else if (entry.vc && entry.vc.jwt && isJwtString(entry.vc.jwt)) result.vcJwtList.push(entry.vc.jwt);
          else result.vcObjects.push(entry);
        } else {
          result.vcObjects.push(entry);
        }
      }
    }

    return result;
  };

  // small UI helper for key/value listing of credentialSubject
  const CredentialSubjectSummary = ({ subject }) => {
    if (!subject || typeof subject !== "object") {
      return <div className="text-sm text-gray-500 dark:text-gray-400">No credentialSubject data</div>;
    }
    // show a few known fields first
    const preferredKeys = ["id", "name", "course", "courseName", "courseTitle", "title", "description"];
    const keys = Array.from(new Set([...preferredKeys.filter(k => subject[k] !== undefined), ...Object.keys(subject)]));
    return (
      <dl className="grid grid-cols-1 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
        {keys.map((k) => (
          <div key={k} className="flex items-start gap-3">
            <dt className="w-28 text-xs text-gray-500 dark:text-gray-400">{k}</dt>
            <dd className="break-all">{typeof subject[k] === "object" ? JSON.stringify(subject[k], null, 2) : String(subject[k])}</dd>
          </div>
        ))}
      </dl>
    );
  };

  const createShareLink = async () => {
    if (!selectedPresentation?.presentationId) {
      setShareError("Select a presentation first");
      return;
    }
    setShareLoading(true);
    setShareError(null);

    try {
      const res = await fetch("http://localhost:3000/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationId: selectedPresentation.presentationId,
          ttlSeconds: shareTtl,
          ownerDid: selectedPresentation.ownerDid,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || `Failed to create share (${res.status})`);
      }
      const data = await res.json();
      const newShare = { token: data.token, shareUrl: data.shareUrl, expiresAt: data.expiresAt };

      setShareMap((prev) => {
        const pid = selectedPresentation.presentationId;
        const arr = prev[pid] ? [...prev[pid]] : [];
        // avoid duplicate tokens if any
        if (!arr.find((s) => s.token === newShare.token)) {
          arr.unshift(newShare);
        }
        return { ...prev, [pid]: arr };
      });

      setShareInfo(newShare);
    } catch (e) {
      console.error("createShareLink error", e);
      setShareError(e.message || "Failed to create share link");
    } finally {
      setShareLoading(false);
    }
  };

  const revokeShare = async (tokenToRevoke) => {
    const token = tokenToRevoke || shareInfo?.token;
    if (!token) return;

    try {
      const res = await fetch("http://localhost:3000/share/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to revoke");
      }

      // remove from shareMap
      setShareMap((prev) => {
        if (!selectedPresentation) return prev;
        const pid = selectedPresentation.presentationId;
        const arr = (prev[pid] || []).filter((s) => s.token !== token);
        const next = { ...prev, [pid]: arr };
        if (arr.length === 0) delete next[pid];
        return next;
      });

      // if the revoked token is the one shown in UI, clear it or show next available
      setShareInfo((current) => (current?.token === token ? null : current));
    } catch (e) {
      console.error("revokeShare error", e);
      setShareError(e.message || "Failed to revoke share");
    }
  };

  const formatRemaining = (s) => {
    if (s == null) return "";
    if (s <= 0) return "expired";
    const days = Math.floor(s / 86400);
    const hrs = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (days) return `${days}d ${hrs}h ${mins}m`;
    if (hrs) return `${hrs}h ${mins}m`;
    if (mins) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Achievements Hub
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Track your progress, collect SBTs, and earn rewards
              </p>
            </div>

            {/* Stats Summary */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900">
                  <BadgeCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Badge</p>
                  <p className="font-semibold">{badgeInfo?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900">
                  <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">SBTs</p>
                  <p className="font-semibold">{certificates.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - SBT Collection & Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* SBT Collection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                      <BadgeCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        Soulbound Tokens
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your non-transferable digital achievements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setViewMode(viewMode === "grid" ? "list" : "grid")
                      }
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title={viewMode === "grid" ? "List view" : "Grid view"}
                    >
                      {viewMode === "grid" ? (
                        <List className="w-5 h-5" />
                      ) : (
                        <Grid className="w-5 h-5" />
                      )}
                    </button>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                    >
                      <option value="all">All SBTs</option>
                      <option value="claimed">Claimed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {certificates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Lock className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      No SBTs yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Complete courses and events to earn your first SBT
                    </p>
                  </div>
                ) : (
                  <div
                    className={`gap-4 ${viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-3"
                      : "space-y-3"
                      }`}
                  >
                    {filteredCertificates.map((cert, index) => {
                      const tokenIdKey = cert.certificateId?.toString();
                      const tokenURI = tokenURIs[tokenIdKey];
                      const meta = tokenMeta[tokenIdKey];
                      const imageCid = meta?.image?.replace("ipfs://", "");
                      const imageUrl = imageCid
                        ? `https://gateway.pinata.cloud/ipfs/${imageCid}`
                        : null;

                      return (
                        <div
                          key={index}
                          className={`group relative cursor-pointer transition-all duration-300 hover:scale-[1.02] ${viewMode === "grid" ? "aspect-square" : ""
                            }`}
                          onClick={() =>
                            imageUrl && handleSBTSelect(cert, meta)
                          }
                        >
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden h-full">
                            {/* NFT Preview */}
                            <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={cert.courseName}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                #{cert.certificateId?.toString().slice(0, 6)}...
                              </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {cert.courseName}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {cert.cert_issuer}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(
                                    Number(cert.issue_date) * 1000,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-800 dark:text-purple-200 rounded-full">
                                  SBT
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Community Events */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        Community Events
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Participate and earn rewards
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {events?.length || 0} events
                  </div>
                </div>
              </div>
              <div className="p-6">
                {!events || events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No upcoming events
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.slice(0, 4).map((event) => {
                      const eventStatus = getEventStatus(
                        event.startTime,
                        event.endTime,
                      );
                      const isUpcoming = eventStatus === "upcoming";
                      const isOngoing = eventStatus === "ongoing";

                      return (
                        <div
                          key={event.id}
                          className="group p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => handleEventDetailsClick(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {event.name}
                                </h3>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getEventStatusColor(
                                    eventStatus,
                                  )}`}
                                >
                                  {eventStatus === "upcoming"
                                    ? "Upcoming"
                                    : eventStatus === "ongoing"
                                      ? "Ongoing"
                                      : "Past"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {event.description ||
                                  "Community gathering event"}
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(
                                    event.startTime,
                                  ).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  {event.isOnline ? (
                                    <Globe className="w-4 h-4" />
                                  ) : (
                                    <MapPin className="w-4 h-4" />
                                  )}
                                  {event.isOnline
                                    ? "Online"
                                    : event.location || "TBD"}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Users className="w-4 h-4" />
                                  {event.currentParticipants}/
                                  {event.maxParticipants}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform ml-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {events && events.length > 4 && (
                  <div className="mt-6 text-center">
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      View all events ({events.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats, Badges, Tokens, VCs */}
          <div className="space-y-6">
            {/* User Stats Card */}
            <div className="dark:bg-gradient-to-br from-gray-900 to-gray-800 dark:text-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Your Progress</h3>
                  <p className="text-sm dark:text-gray-300">
                    Track your achievements
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-300">Current Badge</span>
                  <span className="font-semibold flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full bg-gradient-to-r ${badgeInfo?.color}`}
                    ></div>
                    {badgeInfo?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-300">SBTs Collected</span>
                  <span className="font-semibold">{certificates.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-300">Events Attended</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-300">ABYTKN Balance</span>
                  <span className="font-semibold">1,500</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <Flame className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">
                      Level {currentBadgeLevel + 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Badges */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Badge Journey</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Progress through ranks
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(BADGE_DISPLAY_MAP).map(([level, badge]) => {
                    const levelNum = parseInt(level);
                    const isUnlocked = levelNum <= currentBadgeLevel;
                    const isCurrent = levelNum === currentBadgeLevel;

                    return (
                      <div
                        key={level}
                        className={`relative p-4 rounded-xl border transition-all duration-300 ${isCurrent
                          ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700"
                          : isUnlocked
                            ? "bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                            : "bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUnlocked
                              ? `bg-gradient-to-r ${badge.color}`
                              : "bg-gray-200 dark:bg-gray-700"
                              }`}
                          >
                            <div
                              className={
                                isUnlocked ? "text-white" : "text-gray-400"
                              }
                            >
                              {badge.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`font-semibold ${isCurrent
                                ? "text-yellow-700 dark:text-yellow-300"
                                : ""
                                }`}
                            >
                              {badge.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {badge.requirements}
                            </p>
                          </div>
                          {isUnlocked && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ABYTKN Tokens */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">ABYTKN Rewards</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Earn tokens for participation
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {abytkns.map((token) => (
                    <div
                      key={token.id}
                      className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${token.status === "claimed"
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-100 dark:border-green-800"
                        : "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border-yellow-100 dark:border-yellow-800"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{token.icon}</div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {token.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {token.date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${getRarityColor(
                              token.rarity,
                            )} bg-clip-text text-transparent`}
                          >
                            {token.value}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${token.status === "claimed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              }`}
                          >
                            {token.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* NEW: Verifiable Credentials Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Verified className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      Verifiable Credentials
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your verified identity documents
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {vcLoading && (
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400">
                      Loading verifiable credentials...
                    </div>
                  )}

                  {!vcLoading && vcError && (
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
                      {vcError}
                    </div>
                  )}

                  {!vcLoading &&
                    !vcError &&
                    verifiableCredentials.length === 0 && (
                      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400">
                        No verifiable credentials found for this wallet.
                      </div>
                    )}

                  {verifiableCredentials.map((vc, index) => {
                    const vcType = Array.isArray(vc.credentialType)
                      ? vc.credentialType.find(
                        (t) => t !== "VerifiableCredential",
                      ) || vc.credentialType[0]
                      : vc.credentialType;
                    const vcStatus = "valid";
                    const issuedAt = formatVCDate(vc.issuanceDate);

                    return (
                      <div
                        key={`${vc.credentialID ?? index}-${vc.owner ?? "vc"}`}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex-shrink-0">
                              {getVCTypeIcon(vcType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {vc.course || "Verifiable Credential"}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Issued by {vc.issuer}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                Subject: {vc.subject}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                ID: {vc.credentialID}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getVCStatusColor(
                                    vcStatus,
                                  )}`}
                                >
                                  {vcStatus}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  {vcType || "Credential"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Issued {issuedAt}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedVC(vc);
                              setShowVCDetailPopup(true);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                            title="View full VC details"
                          >
                            <Eye className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* NEW: Verifiable Presentations Section */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Verifiable Presentations
              </h3>

              <button
                onClick={() => setShowVCPresentationsPopup(true)}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View All
              </button>

            </div>

          </div>
        </div>

        {/* Event Details Popup */}
        <CSSTransition
          in={showEventPopup}
          timeout={300}
          classNames="popup"
          unmountOnExit
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative max-w-2xl w-full mx-4">
              {selectedEvent && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedEvent.name}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={`text-sm px-3 py-1 rounded-full ${getEventStatusColor(
                              getEventStatus(
                                selectedEvent.startTime,
                                selectedEvent.endTime,
                              ),
                            )}`}
                          >
                            {getEventStatus(
                              selectedEvent.startTime,
                              selectedEvent.endTime,
                            )}
                          </span>
                          <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            {selectedEvent.isOnline ? "Online" : "In-person"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEventPopup(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Event Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Start Date
                        </p>
                        <p className="font-medium">
                          {new Date(
                            selectedEvent.startTime,
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(
                            selectedEvent.startTime,
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          End Date
                        </p>
                        <p className="font-medium">
                          {new Date(selectedEvent.endTime).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(selectedEvent.endTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Location & Participants */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        {selectedEvent.isOnline ? (
                          <Globe className="w-5 h-5 text-blue-500" />
                        ) : (
                          <MapPin className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Location
                          </p>
                          <p className="font-medium">
                            {selectedEvent.isOnline
                              ? "Online Event"
                              : selectedEvent.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Participants
                          </p>
                          <p className="font-medium">
                            {selectedEvent.currentParticipants} /{" "}
                            {selectedEvent.maxParticipants}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedEvent.description && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Description
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() =>
                          handleParticipateInEvent(selectedEvent.id)
                        }
                        disabled={
                          getEventStatus(
                            selectedEvent.startTime,
                            selectedEvent.endTime,
                          ) !== "ongoing" ||
                          selectedEvent.currentParticipants >=
                          selectedEvent.maxParticipants
                        }
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${getEventStatus(
                          selectedEvent.startTime,
                          selectedEvent.endTime,
                        ) === "ongoing" &&
                          selectedEvent.currentParticipants <
                          selectedEvent.maxParticipants
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                          }`}
                      >
                        {getEventStatus(
                          selectedEvent.startTime,
                          selectedEvent.endTime,
                        ) === "upcoming"
                          ? "Event Starting Soon"
                          : getEventStatus(
                            selectedEvent.startTime,
                            selectedEvent.endTime,
                          ) === "ongoing"
                            ? selectedEvent.currentParticipants >=
                              selectedEvent.maxParticipants
                              ? "Event Full"
                              : "Join Event"
                            : "Event Ended"}
                      </button>
                      <button className="py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CSSTransition>

        {/* Certificate Popup */}
        <CSSTransition
          in={showPopup}
          timeout={300}
          classNames="popup"
          unmountOnExit
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative max-w-6xl w-full mx-4 mt-[60px]">
              <button
                onClick={handleClosePopup}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-red-500 hover:bg-white/20 text-white backdrop-blur-lg"
              >
                <X className="w-6 h-6" />
              </button>
              {selectedCertificate && (
                <Certificate certificateData={selectedCertificate} />
              )}
            </div>
          </div>
        </CSSTransition>

        {/* SBT Popup */}
        <CSSTransition
          in={showSBTPopup}
          timeout={300}
          classNames="popup"
          unmountOnExit
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
              className="relative max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSBTPopup(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-lg"
              >
                <X className="w-6 h-6" />
              </button>

              {selectedSBT && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                  {selectedSBT.imageUrl ? (
                    <div className="relative aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                      <img
                        src={selectedSBT.imageUrl}
                        alt={selectedSBT.cert.courseName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                        #
                        {selectedSBT.cert.certificateId?.toString().slice(0, 8)}
                        ...
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedSBT.cert.courseName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Issued by {selectedSBT.cert.cert_issuer}
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowSBTPopup(false);
                          handleCertificateClick(selectedSBT.cert);
                        }}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        View Certificate
                      </button>
                      <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CSSTransition>

        {/* VC Details Popup */}
        <CSSTransition
          in={showVCDetailPopup}
          timeout={300}
          classNames="popup"
          unmountOnExit
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={() => setShowVCDetailPopup(false)}
                className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {selectedVC && (
                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="mb-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                        {getVCTypeIcon(
                          Array.isArray(selectedVC.credentialType)
                            ? selectedVC.credentialType.find(
                              (t) => t !== "VerifiableCredential",
                            ) || selectedVC.credentialType[0]
                            : selectedVC.credentialType,
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedVC.course || "Verifiable Credential"}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {Array.isArray(selectedVC.credentialType)
                            ? selectedVC.credentialType.join(", ")
                            : selectedVC.credentialType}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grid of details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Issuer Details */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Issuer Information
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Issuer
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedVC.issuer}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Issuer DID
                          </p>
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                            {selectedVC.issuerDID || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Subject Details */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4" />
                        Subject Information
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Subject
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedVC.subject}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Wallet Address
                          </p>
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                            {address || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Subject DID
                          </p>
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                            {selectedVC.subjectDID || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Credential Details */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Credential Details
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Credential ID
                          </p>
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                            {selectedVC.credentialID}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Course
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedVC.course}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Dates
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Issued
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatVCDate(selectedVC.issuanceDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Owner Address
                          </p>
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                            {selectedVC.owner}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => {
                        setShowVPModal(true);
                        setCreatedVP(null);
                        setVpError(null);
                      }}
                      className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Presentation
                    </button>
                    <button
                      onClick={() => setShowVCDetailPopup(false)}
                      className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CSSTransition>

        {/* VP create Modal */}
        <CSSTransition
          in={showVPModal}
          timeout={300}
          classNames="popup"
          unmountOnExit
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-w-xl w-full">
              {/* Close */}
              <button
                onClick={() => setShowVPModal(false)}
                className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {selectedVC && (
                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                      <Verified className="w-6 h-6" />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        VC Presentation
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Create a Verifiable Presentation for sharing with employers or institutions
                      </p>
                    </div>
                  </div>

                  {/* Professional VC Card */}
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedVC.course || "Credential Presentation"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Presentation-ready credential summary
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Verified VC
                      </span>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Issuer
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">
                            {selectedVC.issuer}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Subject
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedVC.subject}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Issued
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatVCDate(selectedVC.issuanceDate)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Subject DID
                        </p>
                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                          {selectedVC.subjectDID || selectedVC.subject}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Issuer DID
                        </p>
                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                          {selectedVC.issuerDID || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Credential ID
                        </p>
                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                          {selectedVC.credentialID}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* VP Status */}
                  <div className="mt-6">
                    {vpError && (
                      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
                        {vpError}
                      </div>
                    )}

                    {createdVP && (
                      <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
                        ✅ Verifiable Presentation created successfully!
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      disabled={vpLoading}
                      onClick={() => handleCreateVP(selectedVC)}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-opacity flex items-center justify-center gap-2 ${vpLoading
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
                        }`}
                    >
                      {vpLoading ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Creating VP...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Create Presentation
                        </>
                      )}
                    </button>

                    {createdVP && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            typeof createdVP === "string"
                              ? createdVP
                              : JSON.stringify(createdVP, null, 2),
                          );
                        }}
                        className="py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Hash className="w-4 h-4" />
                        Copy VP
                      </button>
                    )}
                  </div>

                  {/* Raw VP Display */}
                  {createdVP && (
                    <div className="mt-6">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Generated Verifiable Presentation (VP)
                      </p>
                      <pre className="text-xs p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-60">
                        {typeof createdVP === "string"
                          ? createdVP
                          : JSON.stringify(createdVP, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CSSTransition>

        {/* VP Manager Popup */}
        <CSSTransition
          in={showVCPresentationsPopup}
          timeout={300}
          classNames="popup"
          unmountOnExit
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-7xl w-full max-h-[90vh]">
              {/* Close button */}
              <button
                onClick={() => {
                  setShowVCPresentationsPopup(false);
                  setSelectedPresentation(null);
                }}
                className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 sm:p-8 h-[80vh]">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Verifiable Presentations
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-64px)]">
                  {/* Left column: list */}
                  <div className="md:col-span-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Subject DID</p>
                      <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                        {selectedPresentation?.ownerDid ||
                          (address ? `did:ethr:sepolia:${address}` : null) ||
                          selectedVC?.ownerDid ||
                          did ||
                          "Unknown DID"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {vpList.map((row, idx) => {
                        const p = normalizePresentationRow(row);
                        const inspection = inspectPresentation(p.presentation);
                        const created = new Date(p.createdAt).toLocaleString();

                        const shortId = (p.presentationId || `VP ${idx + 1}`).slice(0, 40);

                        const onSelect = () => {
                          setSelectedPresentation(p);
                          // optional: also update selectedVC for compatibility with other parts of the app
                          setSelectedVC({
                            ...p.presentation,
                            presentationID: p.presentationId,
                            holderDid: p.holderDid,
                            issuerDid: p.issuerDid,
                            ownerDid: p.ownerDid,
                            createdAt: p.createdAt,
                            _rawRow: p.raw,
                          });
                        };

                        let badgeLabel = "Incomplete";
                        let badgeClasses = "bg-red-100 text-red-800";
                        if (inspection.complete) {
                          badgeLabel = "Complete";
                          badgeClasses = "bg-green-100 text-green-800";
                        } else if (inspection.partial) {
                          badgeLabel = "Partial";
                          badgeClasses = "bg-yellow-100 text-yellow-800";
                        } else if (inspection.vpIsJwt && inspection.vcJwtCount === 0 && inspection.totalVCs > 0) {
                          badgeLabel = "VP JWT only";
                          badgeClasses = "bg-indigo-100 text-indigo-800";
                        }

                        return (
                          <button
                            key={p.presentationId || idx}
                            onClick={onSelect}
                            className={`w-full text-left p-3 rounded-lg border ${selectedPresentation?.presentationId === p.presentationId ? "border-blue-400 bg-white dark:bg-gray-800 shadow-sm" : "border-gray-200 bg-gray-50 dark:bg-gray-900"} hover:shadow-md transition`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">{p.presentationId || `VP ${idx + 1}`}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">Issuer: {p.issuerDid || "Unknown"}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">Holder: {p.holderDid || "Unknown"}</p>
                              </div>
                              <div className="ml-3 text-right">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${badgeClasses}`} title={inspection.messages.join("; ")}>
                                  {badgeLabel}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{created}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right column: details (span 2 cols on md) */}
                  <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 overflow-y-auto">
                    {!selectedPresentation ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                        <p className="mb-2">Select a presentation from the list to view details</p>
                        <p className="text-sm">You’ll see owner, issuer, course details, JWTs and raw JSON here.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-all">{selectedPresentation.presentationId}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Owner: <span className="font-mono">{selectedPresentation.ownerDid}</span></p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Holder: <span className="font-mono">{selectedPresentation.holderDid}</span></p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Issuer: <span className="font-mono">{selectedPresentation.issuerDid}</span></p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                // copy link or id
                                copyToClipboard(selectedPresentation.presentationId || "");
                              }}
                              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              Copy ID
                            </button>
                            <button
                              onClick={() => {
                                // open verification modal or action
                                setShowVPModal(true);
                                setSelectedVC({
                                  ...selectedPresentation.presentation,
                                  presentationID: selectedPresentation.presentationId,
                                  holderDid: selectedPresentation.holderDid,
                                  issuerDid: selectedPresentation.issuerDid,
                                  ownerDid: selectedPresentation.ownerDid,
                                  createdAt: selectedPresentation.createdAt,
                                  _rawRow: selectedPresentation.raw,
                                });
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:brightness-95"
                            >
                              Verify
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* left details: course / credentialSubject info */}
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Credential Subject</h4>

                            {/* show a friendly preview of the first VC's credentialSubject */}
                            {(() => {
                              const { vcJwtList, vcObjects } = extractVpAndVcs(selectedPresentation.presentation);
                              // prefer object VC if available, else decode first VC JWT payload and read vc.vc or credentialSubject
                              let subj = null;
                              if (vcObjects.length > 0) {
                                // get credentialSubject from object
                                const first = vcObjects[0];
                                subj = first.credentialSubject || first.vc?.credentialSubject || first;
                              } else if (vcJwtList.length > 0) {
                                const decoded = decodeJwtPayloadSafe(vcJwtList[0]);
                                subj = decoded?.vc?.credentialSubject || decoded?.credentialSubject || decoded?.sub ? { id: decoded.sub, ...decoded } : decoded;
                              }
                              return <CredentialSubjectSummary subject={subj} />;
                            })()}
                          </div>

                          {/* right details: JWT display */}
                          <div className="space-y-3">
                            {/* VP JWT */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Presentation JWT</h4>
                                <div className="flex items-center gap-2">
                                  <button className="px-2 py-0.5 text-xs border rounded" onClick={() => {
                                    const { vpJwt } = extractVpAndVcs(selectedPresentation.presentation);
                                    copyToClipboard(vpJwt || "");
                                  }}>Copy</button>
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                {(() => {
                                  const { vpJwt } = extractVpAndVcs(selectedPresentation.presentation);
                                  if (!vpJwt) return <div className="text-sm text-gray-500">No compact VP JWT found</div>;
                                  const payload = decodeJwtPayloadSafe(vpJwt);
                                  return (
                                    <div className="space-y-2">
                                      <pre className="max-h-36 overflow-auto p-2 bg-white dark:bg-gray-800 rounded text-xs">{JSON.stringify(payload, null, 2)}</pre>
                                      <p className="text-xs text-gray-500">Header & payload only (no signature verification).</p>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* VC JWTs */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Credential JWTs</h4>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{(() => {
                                  const { vcJwtList, vcObjects } = extractVpAndVcs(selectedPresentation.presentation);
                                  return `${vcJwtList.length} JWT(s) • ${vcObjects.length} object(s)`;
                                })()}</div>
                              </div>

                              <div className="mt-2 space-y-2">
                                {(() => {
                                  const { vcJwtList, vcObjects } = extractVpAndVcs(selectedPresentation.presentation);

                                  return (
                                    <>
                                      {vcJwtList.map((j, i) => {
                                        const decoded = decodeJwtPayloadSafe(j);
                                        const subj = decoded?.vc?.credentialSubject || decoded?.credentialSubject || (decoded?.sub ? { id: decoded.sub } : null);
                                        return (
                                          <div key={`vcjwt-${i}`} className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white break-all">VC JWT {i + 1}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Subject: <span className="font-mono">{subj?.id || subj?.sub || "Unknown"}</span></p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <button onClick={() => copyToClipboard(j)} className="px-2 py-0.5 text-xs border rounded">Copy</button>
                                                <button onClick={() => {
                                                  // toggle expanded raw view by writing a small UI state if you want; for brevity, we'll copy the JWT so user can paste elsewhere
                                                  copyToClipboard(JSON.stringify(decoded, null, 2));
                                                }} className="px-2 py-0.5 text-xs border rounded">Copy decoded</button>
                                              </div>
                                            </div>

                                            <details className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                              <summary className="cursor-pointer">Decoded payload (preview)</summary>
                                              <pre className="mt-2 max-h-40 overflow-auto p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">{JSON.stringify(decodeJwtPayloadSafe(j), null, 2)}</pre>
                                            </details>
                                          </div>
                                        );
                                      })}

                                      {/* object VCs */}
                                      {vcObjects.map((obj, i) => (
                                        <div key={`vcobj-${i}`} className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                                          <div className="flex items-start justify-between">
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium text-gray-900 dark:text-white break-all">VC Object {i + 1}</p>
                                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Subject: <span className="font-mono">{(obj.credentialSubject && obj.credentialSubject.id) || obj.subject || "Unknown"}</span></p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button onClick={() => copyToClipboard(JSON.stringify(obj, null, 2))} className="px-2 py-0.5 text-xs border rounded">Copy</button>
                                            </div>
                                          </div>

                                          <details className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                            <summary className="cursor-pointer">Raw</summary>
                                            <pre className="mt-2 max-h-40 overflow-auto p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">{JSON.stringify(obj, null, 2)}</pre>
                                          </details>
                                        </div>
                                      ))}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Raw presentation dropdown */}
                        <div className="mt-4">
                          <details className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">Raw presentation JSON</summary>
                            <pre className="mt-3 max-h-56 overflow-auto p-3 bg-white dark:bg-gray-800 rounded text-xs">{JSON.stringify(selectedPresentation.raw || selectedPresentation.presentation, null, 2)}</pre>
                            <div className="mt-2 flex gap-2">
                              <button onClick={() => copyToClipboard(JSON.stringify(selectedPresentation.raw || selectedPresentation.presentation, null, 2))} className="px-3 py-1 border rounded text-sm">Copy JSON</button>
                              <a
                                href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(selectedPresentation.raw || selectedPresentation.presentation, null, 2))}`}
                                download={`${selectedPresentation.presentationId || "presentation"}.json`}
                                className="px-3 py-1 border rounded text-sm"
                              >
                                Download
                              </a>
                            </div>
                          </details>
                        </div>

                        {/* --- Share panel (QR + expiring link) --- */}
                        <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Share presentation</h4>

                          <div className="flex items-center gap-2 mb-2">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Expires in:</label>
                            <select
                              value={shareTtl}
                              onChange={(e) => setShareTtl(Number(e.target.value))}
                              className="text-sm p-1 border rounded bg-white dark:bg-gray-800"
                            >
                              <option value={3600}>1 hour</option>
                              <option value={86400}>24 hours</option>
                              <option value={604800}>7 days</option>
                              <option value={2592000}>30 days</option>
                            </select>

                            <button
                              onClick={createShareLink}
                              disabled={shareLoading || !selectedPresentation}
                              className="ml-auto px-3 py-1 bg-blue-600 text-white rounded-md hover:brightness-95 disabled:opacity-60"
                            >
                              {shareLoading ? "Generating..." : "Generate link"}
                            </button>
                          </div>

                          {shareError && <div className="text-xs text-red-600 mb-2">{shareError}</div>}

                          {/* Existing shares list for this presentation */}
                          {selectedPresentation && (shareMap[selectedPresentation.presentationId] ?? []).length > 0 && (
                            <div className="mb-3 text-xs">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Existing shares for this presentation:</p>
                              <div className="space-y-2">
                                {shareMap[selectedPresentation.presentationId].map((s) => (
                                  <div key={s.token} className="flex items-center gap-2 p-2 rounded border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => setShareInfo(s)}
                                          className={`text-left truncate text-sm ${shareInfo?.token === s.token ? "font-semibold" : ""}`}
                                        >
                                          {s.shareUrl}
                                        </button>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Expires: {new Date(s.expiresAt).toLocaleString()}</p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button onClick={() => copyToClipboard(s.shareUrl)} className="px-2 py-0.5 border rounded text-xs">Copy</button>
                                      <button onClick={() => window.open(s.shareUrl, "_blank")} className="px-2 py-0.5 border rounded text-xs">Open</button>
                                      <button onClick={() => revokeShare(s.token)} className="px-2 py-0.5 border rounded text-xs text-red-600">Revoke</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Main preview / QR area for the selected shareInfo */}
                          {shareInfo ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                              <div className="md:col-span-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Share URL</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <input readOnly value={shareInfo.shareUrl} className="flex-1 p-2 text-sm rounded border bg-white dark:bg-gray-800" />
                                  <button onClick={() => copyToClipboard(shareInfo.shareUrl)} className="px-2 py-1 border rounded text-sm">Copy</button>
                                  <button onClick={() => window.open(shareInfo.shareUrl, "_blank")} className="px-2 py-1 border rounded text-sm">Open</button>
                                  <button onClick={() => revokeShare(shareInfo.token)} className="px-2 py-1 border rounded text-sm text-red-600">Revoke</button>
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  Expires in: <span className="font-mono">{formatRemaining(shareCountdown)}</span>
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Token: <span className="font-mono">{shareInfo.token}</span></p>
                              </div>

                              <div className="flex items-center justify-center md:col-span-1">
                                <div className="bg-white p-2 rounded">
                                  <QRCode value={shareInfo.shareUrl} size={128} />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Generate an expiring link or QR code to share this presentation.</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CSSTransition>

      </div>
    </div>
  );
};

export default AchievementsPage;