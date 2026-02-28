// src/pages/SharePresentation.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Copy, Printer, Download, QrCode } from "lucide-react";

/**
 * Bold, modern "authentication" viewer for a shared VP.
 * - verifies the presentation when user clicks "Verify"
 * - large badge with clear valid/invalid state
 * - printable / download JSON
 * - copy link / QR code
 *
 * Expects GET http://localhost:3000/share/view/:token
 * and POST http://localhost:3000/presentation/verify
 */

// base64url decode helper
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

function Skeleton({ className = "h-5 rounded bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" }) {
  return <div className={className} />;
}

export default function SharePresentation() {
  const { token } = useParams();

  const [raw, setRaw] = useState(null);
  const [data, setData] = useState(null); // normalized
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // verification state
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null); // null | true | false
  const [verifyDetails, setVerifyDetails] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    setRaw(null);
    setData(null);

    (async () => {
      try {
        const res = await fetch(`http://localhost:3000/share/view/${encodeURIComponent(token)}`);
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
        if (typeof presentation === "string" && presentation.split(".").length === 3) {
          const payload = decodeJwtPayloadSafe(presentation);
          presentation = payload?.vp || payload || presentation;
        }

        // pick VC
        let vcCandidate = null;
        if (presentation?.verifiableCredential) {
          if (Array.isArray(presentation.verifiableCredential)) vcCandidate = presentation.verifiableCredential[0];
          else vcCandidate = presentation.verifiableCredential;
        } else if (json.rawVerifiableCredentials?.length) {
          vcCandidate = json.rawVerifiableCredentials[0];
        } else if (json.verifiableCredentials?.length) {
          try { vcCandidate = JSON.parse(json.verifiableCredentials[0]); } catch { vcCandidate = json.verifiableCredentials[0]; }
        }

        if (typeof vcCandidate === "string" && vcCandidate.split(".").length === 3) {
          const payload = decodeJwtPayloadSafe(vcCandidate);
          vcCandidate = payload?.vc || payload || vcCandidate;
        }

        // convert to W3C-looking object if needed
        let credentialObject = vcCandidate;
        if (vcCandidate && typeof vcCandidate === "object" && !vcCandidate.credentialSubject) {
          credentialObject = {
            credentialSubject: {
              id: vcCandidate.subjectDID || vcCandidate.owner || vcCandidate.subject || undefined,
              name: vcCandidate.subject || vcCandidate.name || undefined,
              course: vcCandidate.course,
              credentialID: vcCandidate.credentialID || vcCandidate.id,
              owner: vcCandidate.owner,
            },
            issuer: vcCandidate.issuerDID ? { id: vcCandidate.issuerDID } : (vcCandidate.issuer ? { id: vcCandidate.issuer } : undefined),
            issuanceDate: vcCandidate.issuanceDate ? (String(vcCandidate.issuanceDate).length > 12 ? new Date(Number(vcCandidate.issuanceDate)).toISOString() : new Date(Number(vcCandidate.issuanceDate) * 1000).toISOString()) : undefined,
          };
        }

        const normalized = {
          presentation,
          vc: credentialObject,
          presentationId: json.presentationId || (presentation && presentation.id) || null,
          ownerDid: json.ownerDid || null,
          holderDid: json.holderDid || presentation?.holder || null,
          issuerDid: json.issuerDid || (credentialObject && credentialObject.issuer?.id) || null,
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

  const handleCopy = (text) => navigator.clipboard?.writeText(text);

  async function handleVerifyPresentation() {
    if (!data?.presentation) return;
    setVerifying(true);
    setVerified(null);
    setVerifyDetails(null);
    try {
      const res = await fetch(`http://localhost:3000/presentation/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentation: data.presentation }),
      });
      const j = await res.json();
      // store raw result + set verified flag heuristically
      setVerifyDetails(j);
      const ok = res.ok && j?.verification && (!j.verification.errors || j.verification.errors.length === 0);
      setVerified(Boolean(ok));
    } catch (e) {
      setVerified(false);
      setVerifyDetails({ error: e.message });
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-neutral-900 p-6">
        <div className="rounded-2xl bg-white/6 backdrop-blur-md p-8 max-w-xl w-full text-center border border-white/6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 mb-4 shadow-lg">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-white text-2xl font-bold">Loading credential snapshot</h2>
          <p className="mt-2 text-sm text-slate-300">Retrieving and preparing the presentation for verification…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-neutral-900 p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full text-center border">
          <h3 className="text-lg font-semibold text-red-500">Unable to load credential</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error || "Unknown error"}</p>
          <div className="mt-4">
            <Link to="/" className="px-4 py-2 bg-amber-500 text-white rounded-md">Return home</Link>
          </div>
        </div>
      </div>
    );
  }

  // present values
  const vc = data.vc || {};
  const subject = vc.credentialSubject || {};
  const course = subject.course || "—";
  const credId = subject.credentialID || "—";
  const ownerDid = subject.id || data.ownerDid || "—";
  const ownerName = subject.name || "—";
  const issuerDid = data.issuerDid || (vc.issuer && vc.issuer.id) || "—";
  const issued = vc.issuanceDate ? new Date(vc.issuanceDate).toLocaleString() : "—";
  const presentationId = data.presentationId || "—";
  const expiresAt = data.expiresAt ? new Date(data.expiresAt).toLocaleString() : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-white dark:from-neutral-900 dark:to-neutral-800 p-6 flex items-center justify-center">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Credential Authentication</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Read-only verification page — confirm issuer & student details</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCopy(window.location.href)}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-white dark:bg-gray-800 border hover:brightness-95"
              title="Copy share URL"
            >
              <Copy className="w-4 h-4" /><span className="text-xs">Copy link</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500 text-white hover:brightness-95"
              title="Print credential"
            >
              <Printer className="w-4 h-4" /><span className="text-xs">Print</span>
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-emerald-200 dark:border-gray-800">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left: big certificate UI */}
            <div className="mt-12 md:col-span-2 bg-gradient-to-b from-white to-amber-50 dark:from-gray-900 dark:to-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-800 relative">
              {/* ribbon / seal */}
              <div className="absolute -top-5 left-6 flex items-center gap-3">
                <div className="bg-amber-500 text-white font-semibold px-3 py-1 rounded-full shadow-md">ABYA</div>
                <div className="text-xs text-gray-500 hidden sm:block">Official Certificate</div>
              </div>

              {/* verification badge */}
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${verified === true ? "bg-emerald-100 text-emerald-700" : verified === false ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                    {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : verified === true ? <CheckCircle className="w-5 h-5" /> : verified === false ? <XCircle className="w-5 h-5" /> : <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>}
                    <div className="text-xs font-medium">
                      {verifying ? "Verifying…" : verified === true ? "Verified" : verified === false ? "Not verified" : "Verification"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{course}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Course Completion Credential</p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Credential ID</div>
                    <div className="text-sm font-mono text-gray-800 dark:text-gray-200">{credId}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Issued</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{issued}</div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-6">
                  <div>
                    <div className="text-xs text-gray-500">Owner</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{ownerName}</div>
                    <div className="text-xs font-mono text-gray-500 break-all">{ownerDid}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Issuer</div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{issuerDid}</div>
                    <div className="text-xs text-gray-400">ABYA University</div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleVerifyPresentation}
                    disabled={verifying}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md shadow hover:brightness-95"
                    title="Verify cryptographic signature and VC"
                  >
                    {verifying ? "Verifying…" : "Verify credential"}
                  </button>

                  <button
                    onClick={() => handleCopy(JSON.stringify(data.raw || {}, null, 2))}
                    className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                    title="Copy JSON"
                  >
                    <span className="inline-flex items-center gap-2"><Download className="w-4 h-4" />JSON</span>
                  </button>

                  <button
                    onClick={() => {
                      // open small popup with QR
                      const q = window.open("", "_blank", "width=360,height=420");
                      q.document.write(`<html><body style="display:flex;align-items:center;justify-content:center;height:100vh">${window.location.href}</body></html>`);
                    }}
                    className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                    title="Open QR / link"
                  >
                    <QrCode className="w-4 h-4 inline-block mr-1" /> Link
                  </button>
                </div>

                {/* verification details */}
                {verified !== null && verifyDetails && (
                  <div className={`mt-4 p-3 rounded-md ${verified ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                    <div className="text-xs font-medium">{verified ? "Signature & structure verified" : "Verification failed"}</div>
                    <pre className="mt-2 text-xs max-h-32 overflow-auto whitespace-pre-wrap">{JSON.stringify(verifyDetails, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Right: metadata & raw preview */}
            <aside className="mt-12 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="text-xs text-gray-500 mb-2">Snapshot</div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400">Presentation ID</div>
                  <div className="font-mono text-sm break-all">{presentationId}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">Holder DID</div>
                  <div className="font-mono text-sm break-all">{data.holderDid || "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">Expires</div>
                  <div className="text-sm font-mono">{expiresAt}</div>
                </div>

                <details className="mt-2 text-xs text-gray-500">
                  <summary className="cursor-pointer">Raw JSON</summary>
                  <pre className="mt-2 max-h-48 overflow-auto p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">{JSON.stringify(data.raw || {}, null, 2)}</pre>
                </details>
              </div>
            </aside>
          </div>

          <footer className="px-6 py-4 bg-white/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
            Rendered by <strong>ABYA Veramo Viewer</strong> • {presentationId} • {expiresAt}
          </footer>
        </div>
      </div>
    </div>
  );
}