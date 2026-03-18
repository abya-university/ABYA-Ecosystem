import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Printer,
  Download,
  QrCode,
  Shield,
  Award,
  Calendar,
  User,
  Building,
  Hash,
  ExternalLink,
  Eye,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Fingerprint,
  Lock,
  Globe,
  Clock,
  FileCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useDarkMode } from "../contexts/themeContext";

// base64url decode helper (unchanged)
function b64UrlDecode(input = "") {
  try {
    input = input.replace(/-/g, "+").replace(/_/g, "/");
    while (input.length % 4) input += "=";
    return atob(input);
  } catch {
    return null;
  }
}

function decodeJwtPayloadSafe(jwt) {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const raw = b64UrlDecode(parts[1]);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Verification steps for the progress loader
const VERIFICATION_STEPS = [
  {
    id: "structure",
    label: "Checking presentation structure",
    icon: FileCheck,
  },
  {
    id: "signature",
    label: "Verifying cryptographic signatures",
    icon: Fingerprint,
  },
  { id: "issuer", label: "Validating issuer credentials", icon: Building },
  { id: "holder", label: "Confirming holder identity", icon: User },
  { id: "expiry", label: "Checking expiration status", icon: Clock },
  { id: "revocation", label: "Checking revocation status", icon: Shield },
];

function Skeleton({
  className = "h-5 rounded bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse",
}) {
  return <div className={className} />;
}

const QR_MAX_TEXT_LENGTH = 1800;

function truncateString(value, maxLength = 400) {
  if (typeof value !== "string") return value;
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}…`;
}

function buildCompactCredentialPayload(data) {
  const presentation = data?.presentation;
  const vc =
    data?.vc ||
    (Array.isArray(presentation?.verifiableCredential)
      ? presentation?.verifiableCredential[0]
      : presentation?.verifiableCredential);

  const compactPresentation =
    typeof presentation === "string"
      ? truncateString(presentation, 1100)
      : presentation
      ? {
          id: presentation.id,
          type: presentation.type,
          holder: presentation.holder,
        }
      : undefined;

  const compactVc =
    typeof vc === "string"
      ? truncateString(vc, 1100)
      : vc
      ? {
          id: vc.id,
          type: vc.type,
          issuer: typeof vc.issuer === "string" ? vc.issuer : vc.issuer?.id,
          issuanceDate: vc.issuanceDate,
          expirationDate: vc.expirationDate,
          credentialSubject: vc.credentialSubject
            ? {
                id: vc.credentialSubject.id,
                name: vc.credentialSubject.name,
                course: vc.credentialSubject.course,
                credentialID: vc.credentialSubject.credentialID,
              }
            : undefined,
        }
      : undefined;

  return {
    schema: "abya.share.qr.v1",
    presentation: compactPresentation,
    verifiableCredential: compactVc,
  };
}

function buildQrPayload(data) {
  const candidates = [
    {
      schema: "abya.share.qr.v1",
      presentation: data?.presentation,
    },
    {
      schema: "abya.share.qr.v1",
      verifiableCredential: data?.vc,
    },
    buildCompactCredentialPayload(data),
  ];

  for (const candidate of candidates) {
    const serialized = JSON.stringify(candidate);
    if (serialized.length <= QR_MAX_TEXT_LENGTH) {
      return serialized;
    }
  }

  return JSON.stringify({
    schema: "abya.share.qr.v1",
    presentation: {
      id: data?.presentation?.id,
      holder: data?.presentation?.holder,
    },
    verifiableCredential: {
      id: data?.vc?.id,
      issuer:
        typeof data?.vc?.issuer === "string"
          ? data?.vc?.issuer
          : data?.vc?.issuer?.id,
      credentialSubject: {
        id: data?.vc?.credentialSubject?.id,
        course: data?.vc?.credentialSubject?.course,
        credentialID: data?.vc?.credentialSubject?.credentialID,
      },
    },
  });
}

export default function SharePresentation() {
  const { darkMode } = useDarkMode();
  const { token } = useParams();

  const [raw, setRaw] = useState(null);
  const [data, setData] = useState(null); // normalized
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // verification state
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null); // null | true | false
  const [verifyDetails, setVerifyDetails] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState({});

  // UI state
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    setRaw(null);
    setData(null);

    (async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_VERAMO_AGENT_URL
          }/share/view/${encodeURIComponent(token)}`,
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => res.statusText || "Failed");
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!json.success) throw new Error("Invalid share link");

        if (!mounted) return;

        setRaw(json);

        // Normalization (decode JWTs or use rawVerifiableCredentials)
        let presentation = json.presentation;
        if (
          typeof presentation === "string" &&
          presentation.split(".").length === 3
        ) {
          const payload = decodeJwtPayloadSafe(presentation);
          presentation = payload?.vp || payload || presentation;
        }

        // pick VC
        let vcCandidate = null;
        if (presentation?.verifiableCredential) {
          if (Array.isArray(presentation.verifiableCredential))
            vcCandidate = presentation.verifiableCredential[0];
          else vcCandidate = presentation.verifiableCredential;
        } else if (json.rawVerifiableCredentials?.length) {
          vcCandidate = json.rawVerifiableCredentials[0];
        } else if (json.verifiableCredentials?.length) {
          try {
            vcCandidate = JSON.parse(json.verifiableCredentials[0]);
          } catch {
            vcCandidate = json.verifiableCredentials[0];
          }
        }

        if (
          typeof vcCandidate === "string" &&
          vcCandidate.split(".").length === 3
        ) {
          const payload = decodeJwtPayloadSafe(vcCandidate);
          vcCandidate = payload?.vc || payload || vcCandidate;
        }

        // convert to W3C-looking object if needed
        let credentialObject = vcCandidate;
        if (
          vcCandidate &&
          typeof vcCandidate === "object" &&
          !vcCandidate.credentialSubject
        ) {
          credentialObject = {
            credentialSubject: {
              id:
                vcCandidate.subjectDID ||
                vcCandidate.owner ||
                vcCandidate.subject ||
                undefined,
              name: vcCandidate.subject || vcCandidate.name || undefined,
              course: vcCandidate.course,
              credentialID: vcCandidate.credentialID || vcCandidate.id,
              owner: vcCandidate.owner,
            },
            issuer: vcCandidate.issuerDID
              ? { id: vcCandidate.issuerDID }
              : vcCandidate.issuer
              ? { id: vcCandidate.issuer }
              : undefined,
            issuanceDate: vcCandidate.issuanceDate
              ? String(vcCandidate.issuanceDate).length > 12
                ? new Date(Number(vcCandidate.issuanceDate)).toISOString()
                : new Date(
                    Number(vcCandidate.issuanceDate) * 1000,
                  ).toISOString()
              : undefined,
          };
        }

        const normalized = {
          presentation,
          vc: credentialObject,
          presentationId:
            json.presentationId || (presentation && presentation.id) || null,
          ownerDid: json.ownerDid || null,
          holderDid: json.holderDid || presentation?.holder || null,
          issuerDid:
            json.issuerDid ||
            (credentialObject && credentialObject.issuer?.id) ||
            null,
          expiresAt: json.expiresAt || null,
          raw: json,
        };

        setData(normalized);
      } catch (e) {
        setError(e.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleVerifyPresentation() {
    if (!data?.presentation) return;

    setVerifying(true);
    setVerified(null);
    setVerifyDetails(null);
    setCurrentStep(0);
    setStepStatus({});

    // Simulate step-by-step verification progress
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < VERIFICATION_STEPS.length - 1) {
          setStepStatus((status) => ({
            ...status,
            [VERIFICATION_STEPS[prev].id]: "completed",
          }));
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_VERAMO_AGENT_URL}/presentation/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ presentation: data.presentation }),
        },
      );
      const j = await res.json();

      clearInterval(stepInterval);

      // Mark all steps as completed
      const allCompleted = {};
      VERIFICATION_STEPS.forEach((step) => {
        allCompleted[step.id] = "completed";
      });
      setStepStatus(allCompleted);
      setCurrentStep(VERIFICATION_STEPS.length);

      // store raw result + set verified flag heuristically
      setVerifyDetails(j);
      const ok =
        res.ok &&
        j?.verification &&
        (!j.verification.errors || j.verification.errors.length === 0);
      setVerified(Boolean(ok));
    } catch (e) {
      clearInterval(stepInterval);
      setVerified(false);
      setVerifyDetails({ error: e.message });

      // Mark current step as failed
      setStepStatus((status) => ({
        ...status,
        [VERIFICATION_STEPS[currentStep]?.id]: "failed",
      }));
    } finally {
      setVerifying(false);
    }
  }

  // Modern card styles
  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 flex items-center justify-center">
        <div
          className={`max-w-md w-full rounded-3xl border p-8 text-center ${glassCardStyle}`}
        >
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="absolute inset-0 animate-ping">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20" />
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent mb-2">
            Loading Credential
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Retrieving and preparing the presentation for verification...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 flex items-center justify-center">
        <div
          className={`max-w-md w-full rounded-3xl border p-8 text-center ${glassCardStyle}`}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            Unable to load credential
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            {error || "Unknown error"}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
          >
            Return home
          </Link>
        </div>
      </div>
    );
  }

  // present values (minimal, non-sensitive)
  const vc = data.vc || {};
  const subject = vc.credentialSubject || {};
  const course = subject.course || "—";
  const credId = subject.credentialID || "—";
  const ownerDid = subject.id || data.ownerDid || "—";
  const ownerName = subject.name || "—";
  const issuerDid = data.issuerDid || (vc.issuer && vc.issuer.id) || "—";
  const issued = vc.issuanceDate
    ? new Date(vc.issuanceDate).toLocaleString()
    : "—";
  const presentationId = data.presentationId || "—";
  const expiresAt = data.expiresAt
    ? new Date(data.expiresAt).toLocaleString()
    : "—";
  const qrPayload = buildQrPayload(data);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-6 transition-colors duration-300 pt-20 md:pt-[100px]">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-yellow-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:p-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                  <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
                  Credential Authentication
                </h1>
              </div>
              <p className="text-sm lg:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Read-only verification page — confirm issuer & student details
                with cryptographic proof
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(window.location.href)}
                className="group relative flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                title="Copy share URL"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Copy link</span>
                {copied && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Copied!
                  </span>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-medium hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
                title="Print credential"
              >
                <Printer className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Certificate Card - spans 2 columns */}
          <div className="lg:col-span-2">
            <div
              className={`relative overflow-hidden rounded-3xl border shadow-xl transition-all duration-300 hover:shadow-2xl ${cardStyle}`}
            >
              {/* Decorative ribbon */}
              <div className="absolute top-6 left-0">
                <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-1 rounded-r-full shadow-lg flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-semibold">
                    ABYA Certificate
                  </span>
                </div>
              </div>

              {/* Verification Status Badge */}
              <div className="absolute top-6 right-6">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                    verified === true
                      ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                      : verified === false
                      ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                      : "bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {verifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : verified === true ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : verified === false ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {verifying
                      ? "Verifying..."
                      : verified === true
                      ? "Verified"
                      : verified === false
                      ? "Verification Failed"
                      : "Not Verified"}
                  </span>
                </div>
              </div>

              <div className="p-8">
                {/* Course Title */}
                <div className="mt-8 mb-6 text-center">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {course}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Course Completion Credential
                  </p>
                </div>

                {/* Verification Progress */}
                {verifying && (
                  <div className="mb-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verification in Progress
                    </h4>
                    <div className="space-y-2">
                      {VERIFICATION_STEPS.map((step, index) => {
                        const StepIcon = step.icon;
                        const status = stepStatus[step.id];
                        const isActive = index === currentStep && !status;
                        const isCompleted = status === "completed";
                        const isFailed = status === "failed";

                        return (
                          <div
                            key={step.id}
                            className="flex items-center gap-2"
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isCompleted
                                  ? "bg-green-500/20 text-green-600"
                                  : isFailed
                                  ? "bg-red-500/20 text-red-600"
                                  : isActive
                                  ? "bg-blue-500/20 text-blue-600 animate-pulse"
                                  : "bg-slate-500/10 text-slate-400"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : isFailed ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <StepIcon className="w-3 h-3" />
                              )}
                            </div>
                            <span
                              className={`text-xs flex-1 ${
                                isCompleted
                                  ? "text-green-600"
                                  : isFailed
                                  ? "text-red-600"
                                  : isActive
                                  ? "text-blue-600 font-medium"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {step.label}
                            </span>
                            {isActive && (
                              <div className="w-16 h-1 bg-blue-500/20 rounded-full overflow-hidden">
                                <div className="h-full w-1/2 bg-blue-500 rounded-full animate-pulse" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Credential Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border ${glassCardStyle}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Credential ID
                        </span>
                      </div>
                      <p className="text-sm font-mono break-all">{credId}</p>
                    </div>

                    <div className={`p-4 rounded-xl border ${glassCardStyle}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Issued On
                        </span>
                      </div>
                      <p className="text-sm">{issued}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border ${glassCardStyle}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Owner
                        </span>
                      </div>
                      <p className="text-sm font-semibold">
                        {ownerName || "Anonymous"}
                      </p>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all mt-1">
                        {ownerDid}
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl border ${glassCardStyle}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Issuer
                        </span>
                      </div>
                      <p className="text-sm font-mono break-all">{issuerDid}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleVerifyPresentation}
                    disabled={verifying}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Verify Credential
                      </>
                    )}
                  </button>

                    <button onClick={copyPublicSnapshot} className="px-4 py-2 border rounded-full bg-white/5 hover:bg-gray-500/10" title="Copy public snapshot">
                      <span className="inline-flex items-center gap-2"><Copy className="w-4 h-4" />Snapshot</span>
                    </button>

                    <button onClick={downloadProof} className="px-4 py-2 border rounded-full bg-white/5 hover:bg-gray-500/10" title="Download verification proof (minimal)">
                      <span className="inline-flex items-center gap-2"><Download className="w-4 h-4" />Proof</span>
                    </button>

                    <button onClick={() => setQrOpen(true)} className="px-3 py-2 border rounded-full bg-white/5 hover:bg-gray-500/10" title="Open QR / link">
                      <QrCode className="w-4 h-4 inline-block mr-1" /> Link
                    </button>
                  </div>

                  {verifyMessage && (
                    <div className={`mt-5 p-3 rounded-full text-center ${verified ? "bg-emerald-500/80 text-emerald-100" : "bg-rose-900/40 text-rose-200"}`}>
                      <div className="text-sm font-medium">{verifyMessage}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right metadata */}
              <aside className="p-6 mt-6 rounded-2xl border border-cyan-600/10 shadow-lg backdrop-blur-md">
                <div className="text-md font-bold text-amber-500 mb-3">Snapshot</div>
                <div className="space-y-4 text-slate-200">
                  <div>
                    <div className="text-xs text-slate-500">Presentation ID</div>
                    <div className="font-mono text-sm text-gray-900 truncate">{presentationId}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Holder DID</div>
                    <div className="font-mono text-sm text-gray-900 truncate">{data.holderDid || "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Expires</div>
                    <div className="text-sm font-mono text-gray-900">{expiresAt}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Last action</div>
                    <div className="text-sm text-gray-900">{verified === null ? 'No verification performed' : verified ? 'Last verification: success' : 'Last verification: failed'}</div>
                  </div>
                </div>
              </aside>
            </div>

            <footer className="px-6 py-4 bg-black/20 border-t border-cyan-600/5 text-xs text-slate-900 flex items-center justify-between">
              <div>Rendered by <strong>ABYA Passport</strong></div>
              <div className="font-mono">{presentationId} • {expiresAt}</div>
            </footer>
          </div>
        </div>

        {/* QR Modal */}
        {qrOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setQrOpen(false)} />
            <div className="relative bg-white/30 backdrop-blur-lg rounded-2xl p-6 w-[92%] max-w-md border border-white/10">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-white">Share link</h3>
                <button aria-label="Close QR" onClick={() => setQrOpen(false)} className="text-white/80">✕</button>
              </div>

              <div className="mt-4 flex flex-col items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 1200 1200"><path fill="#fff" d="M0 0v1200h1200V573.486l-196.875 208.739v220.898h-806.25v-806.25h396.68V0zm857.861 0v225.977c-205.254.005-579.542 2.254-579.542 641.895c42.436-427.736 237.375-430.415 579.542-430.42v246.776L1200 342.09z" /></svg>
                <div className="text-xs text-slate-300 text-center break-words overflow-hidden">{window.location.href}</div>

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      handleCopy(JSON.stringify(data.raw || {}, null, 2))
                    }
                    className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download JSON
                  </button>

                  <button
                    onClick={() => setShowQrModal(true)}
                    className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    Show QR
                  </button>
                </div>

                {/* Verification Result Details */}
                {verified !== null && verifyDetails && (
                  <div
                    className={`mt-6 p-4 rounded-xl border ${
                      verified
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {verified ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <h4
                        className={`text-sm font-semibold ${
                          verified ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {verified
                          ? "Verification Successful"
                          : "Verification Failed"}
                      </h4>
                    </div>
                    <pre className="text-xs max-h-32 overflow-auto whitespace-pre-wrap bg-slate-100 dark:bg-slate-800 p-2 rounded">
                      {JSON.stringify(verifyDetails, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Metadata & Raw Preview */}
          <div className="lg:col-span-1">
            <div className={`sticky top-24 space-y-4`}>
              {/* Metadata Card */}
              <div className={`rounded-2xl border p-5 ${glassCardStyle}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Presentation Details
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Presentation ID
                    </p>
                    <p className="text-xs font-mono break-all bg-slate-100 dark:bg-slate-800 p-2 rounded">
                      {presentationId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Holder DID
                    </p>
                    <p className="text-xs font-mono break-all">
                      {data.holderDid || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Expiration
                    </p>
                    <p className="text-sm font-mono">{expiresAt}</p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="text-sm font-medium">Raw JSON</span>
                      {showRawJson ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showRawJson && (
                      <pre className="mt-2 max-h-48 overflow-auto p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                        {JSON.stringify(data.raw || {}, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className={`rounded-2xl border p-5 ${glassCardStyle}`}>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      window.open(
                        `https://etherscan.io/address/${ownerDid
                          .split(":")
                          .pop()}`,
                        "_blank",
                      )
                    }
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                    <Globe className="w-4 h-4" />
                    <span>View on Blockchain</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </button>

                  <button
                    onClick={() => handleCopy(ownerDid)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Owner DID</span>
                  </button>

                  <button
                    onClick={() => handleCopy(issuerDid)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Issuer DID</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          className={`mt-8 p-4 rounded-xl border text-center text-xs text-slate-500 dark:text-slate-400 ${glassCardStyle}`}
        >
          <span className="font-semibold text-yellow-600 dark:text-yellow-400">
            ABYA Veramo Viewer
          </span>{" "}
          • {presentationId} • {expiresAt}
        </footer>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`max-w-md w-full rounded-2xl border shadow-2xl overflow-hidden ${glassCardStyle}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Share Credential
                </h3>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white p-8 rounded-xl flex items-center justify-center">
                <div className="w-48 h-48 rounded-lg flex items-center justify-center">
                  <QRCode
                    value={qrPayload}
                    size={176}
                    bgColor="#FFFFFF"
                    fgColor="#111827"
                    level="M"
                  />
                </div>
              </div>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
                Scan this QR code to view the credential
              </p>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => handleCopy(window.location.href)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
