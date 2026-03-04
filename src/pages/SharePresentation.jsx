import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Printer,
  Download,
  QrCode,
  /* using lucide icons already present */
} from "lucide-react";
import VantaNetBG from "../components/Homepage Components/VantaJS";

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

export default function SharePresentation() {
  const { token } = useParams();

  const [raw, setRaw] = useState(null);
  const [data, setData] = useState(null); // normalized
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // verification state
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null); // null | true | false
  const [verifyMessage, setVerifyMessage] = useState(null);

  // darkMode detector
  const [darkMode, setDarkMode] = useState(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setDarkMode(e.matches);
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange);
    };
  }, []);

  // UI: mobile menu + QR modal + snackbar
  const [menuOpen, setMenuOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [snack, setSnack] = useState(null); // { msg, timeoutId }

  const navList = [
    { name: "Explore", href: "/" },
    { name: "Courses", href: "#" },
    { name: "Community", href: "#" },
    { name: "About", href: "#" },
  ];

  // helper to show transient snack
  function showSnack(msg = "Done", ms = 2200) {
    if (snack?.timeoutId) clearTimeout(snack.timeoutId);
    const timeoutId = setTimeout(() => setSnack(null), ms);
    setSnack({ msg, timeoutId });
  }

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
          vcCandidate = Array.isArray(presentation.verifiableCredential)
            ? presentation.verifiableCredential[0]
            : presentation.verifiableCredential;
        } else if (json.rawVerifiableCredentials?.length) {
          vcCandidate = json.rawVerifiableCredentials[0];
        } else if (json.verifiableCredentials?.length) {
          try {
            vcCandidate = JSON.parse(json.verifiableCredentials[0]);
          } catch {
            vcCandidate = json.verifiableCredentials[0];
          }
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
            issuanceDate: vcCandidate.issuanceDate
              ? (String(vcCandidate.issuanceDate).length > 12
                ? new Date(Number(vcCandidate.issuanceDate)).toISOString()
                : new Date(Number(vcCandidate.issuanceDate) * 1000).toISOString())
              : undefined,
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

  async function handleVerifyPresentation() {
    if (!data?.presentation) return;
    setVerifying(true);
    setVerified(null);
    setVerifyMessage(null);
    try {
      const res = await fetch(`http://localhost:3000/presentation/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentation: data.presentation }),
      });
      const j = await res.json();

      // set a concise, non-sensitive message only
      const success = res.ok && j?.verification && (!j.verification.errors || j.verification.errors.length === 0);
      setVerified(Boolean(success));

      if (success) setVerifyMessage("Signature, issuer and structure validated");
      else if (j?.verification?.errors && j.verification.errors.length) setVerifyMessage(j.verification.errors[0].message || "Verification failed");
      else if (j?.error) setVerifyMessage(j.error);
      else setVerifyMessage("Verification could not confirm the credential");
      showSnack(success ? "Verification completed" : "Verification finished");
    } catch (e) {
      setVerified(false);
      setVerifyMessage(e.message || "Verification failed");
      showSnack("Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  function copyPublicSnapshot() {
    if (!data) return;
    const snapshot = {
      presentationId: data.presentationId || null,
      holderDid: data.holderDid || null,
      issuerDid: data.issuerDid || null,
      course: data.vc?.credentialSubject?.course || null,
      ownerName: data.vc?.credentialSubject?.name || null,
      verified: verified === null ? "unknown" : verified,
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard?.writeText(JSON.stringify(snapshot, null, 2));
    showSnack("Snapshot copied");
  }

  function downloadProof() {
    if (!data) return;
    const proof = {
      presentationId: data.presentationId || null,
      verified: verified === null ? "unknown" : verified,
      message: verifyMessage || null,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abya-proof-${data.presentationId || "snapshot"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showSnack("Proof downloaded");
  }

  // Build QR image URL (quick integration using a public chart API)
  // NOTE: you can swap to an in-app generator (qrcode.react or 'qrcode' library) if you prefer
  function qrImageUrl(text) {
    const t = encodeURIComponent(text || window.location.href);
    // Google Chart API (lightweight, no additional dependencies)
    return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${t}&chld=L|1`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-neutral-900 p-6">
        <div className="rounded-3xl bg-gradient-to-tr from-violet-800/40 to-cyan-800/30 backdrop-blur-md p-10 max-w-lg w-full text-center border border-white/6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 to-rose-500 mb-4 shadow-2xl">
            <QrCode className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-white text-3xl font-extrabold tracking-tight">Preparing credential</h2>
          <p className="mt-2 text-sm text-slate-300">Securely fetching and normalizing the presentation…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-neutral-900 p-6">
        <div className="bg-white/3 rounded-2xl p-8 max-w-md w-full text-center border border-red-600/20">
          <h3 className="text-lg font-semibold text-red-400">Unable to load credential</h3>
          <p className="mt-2 text-sm text-gray-300">{error || "Unknown error"}</p>
          <div className="mt-4">
            <Link to="/" className="px-4 py-2 bg-amber-500 text-white rounded-md">Return home</Link>
          </div>
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
  const issued = vc.issuanceDate ? new Date(vc.issuanceDate).toLocaleString() : "—";
  const presentationId = data.presentationId || "—";
  const expiresAt = data.expiresAt ? new Date(data.expiresAt).toLocaleString() : "—";

  return (
    <VantaNetBG>
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="w-full max-w-7xl">
          {/* Desktop nav (centered) */}
          <nav className="hidden lg:flex space-x-8 fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] lg:w-[70%]" aria-label="Primary">
            <div className="backdrop-blur-md rounded-2xl border bg-white/10 border-white/10 shadow-2xl w-full px-6 py-2 flex items-center justify-center space-x-10">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <img
                  src="/abya_logo.jpg"
                  alt="ABYA Logo"
                  className="w-24 h-10 rounded-lg"
                />
              </div>

              <div className="hidden lg:flex space-x-8">
                {navList.map((item) => (
                  <Link key={item.name} to={item.href} className="font-medium transition-all duration-300 hover:text-yellow-500">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Mobile header with hamburger */}
          <div className="flex items-center justify-between mb-6 lg:mt-6">
            <div>
              <h1 className="text-3xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                Credential Authentication
              </h1>
              <p className="text-md font-bold text-gray-500 mt-1">Read-only verification view — minimal public snapshot</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={copyPublicSnapshot}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/6 hover:brightness-110"
                  title="Copy public snapshot"
                >
                  <Copy className="w-4 h-4" /><span className="text-xs">Snapshot</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:brightness-105"
                  title="Print credential"
                >
                  <Printer className="w-4 h-4" /><span className="text-xs font-bold">Print</span>
                </button>
              </div>

              {/* hamburger for mobile */}
              <button
                onClick={() => setMenuOpen((s) => !s)}
                aria-expanded={menuOpen}
                aria-label="Open navigation"
                className="inline-flex items-center justify-center p-2 rounded-md bg-white/6 hover:bg-white/8 sm:hidden"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile drawer */}
          {menuOpen && (
            <div className="sm:hidden fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-16 left-4 right-4 bg-slate-900/80 backdrop-blur-md rounded-xl p-4 border border-white/6 shadow-xl">
                <div className="flex flex-col gap-3">
                  {navList.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="px-3 py-2 rounded-md font-medium hover:bg-white/5"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-2 border-t border-white/6 mt-2 flex gap-2">
                    <button onClick={() => { copyPublicSnapshot(); setMenuOpen(false); }} className="flex-1 px-3 py-2 rounded-md bg-white/5">Copy snapshot</button>
                    <button onClick={() => { setQrOpen(true); setMenuOpen(false); }} className="flex-1 px-3 py-2 rounded-md bg-white/5">QR</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card */}
          <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-amber-600/20">
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Left / main */}
              <div className="md:col-span-2 relative p-6 rounded-2xl border border-gray-800/10 mt-6">
                <div className="absolute -top-6 left-6 flex items-center gap-3">
                  <div className="bg-gradient-to-tr from-amber-400 to-rose-500 text-white font-semibold px-3 py-1 rounded-full shadow-xl">ABYA</div>
                  <div className="text-xs text-slate-500 hidden sm:block">Official Certificate</div>
                </div>

                {/* verification badge */}
                <div className="flex items-center justify-end">
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-full ring-1 ${verified === true ? "ring-emerald-300 bg-emerald-600/40 text-green-600" : verified === false ? "ring-rose-500 bg-rose-900/20 text-rose-200" : "ring-slate-500 bg-slate-900/20 text-slate-300"}`}>
                    <div className="relative w-12 h-12 rounded-full flex items-center justify-center bg-white border border-white/5">
                      {verifying ? <Loader2 className="w-6 h-6 animate-spin" aria-hidden /> : verified === true ? <CheckCircle className="w-6 h-6" aria-hidden /> : verified === false ? <XCircle className="w-6 h-6" aria-hidden /> : <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" /></svg>}
                      <span className={`absolute inset-0 rounded-full ${verified === true ? "animate-pulse" : ""}`} />
                    </div>

                    <div className="text-left">
                      <div className="text-xs uppercase tracking-wide">Status</div>
                      <div className="text-sm font-semibold">{verifying ? "Verifying…" : verified === true ? "Verified" : verified === false ? "Not verified" : "Unknown"}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-3xl font-bold text-gray-800">{course}</h2>
                  <p className="text-sm text-slate-500 mt-1">Course Completion Credential</p>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500">Credential ID</div>
                      <div className="text-sm font-mono text-gray-800 truncate">{credId}</div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">Issued</div>
                      <div className="text-sm text-gray-800">{issued}</div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-14 text-gray-800 overflow-x-auto">
                    <div>
                      <div className="text-xs text-slate-500">Owner</div>
                      <div className="text-sm font-semibold">{ownerName}</div>
                      <div className="text-xs font-mono text-slate-500 truncate max-w-xs">{ownerDid}</div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">Issuer</div>
                      <div className="text-sm font-semibold">{issuerDid}</div>
                      <div className="text-xs text-slate-500">ABYA University</div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <button
                      onClick={handleVerifyPresentation}
                      disabled={verifying}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-white rounded-full font-semibold shadow-lg hover:brightness-105"
                      title="Verify cryptographic signature and VC"
                    >
                      {verifying ? "Verifying…" : "Verify credential"}
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
                    onClick={() => { navigator.clipboard?.writeText(window.location.href); showSnack("Link copied"); }}
                    className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Copy className="inline w-4 h-4 mr-2" />Copy link
                  </button>

                  <button
                    onClick={() => { /* optionally trigger native share if available */
                      if (navigator.share) {
                        navigator.share({ title: "ABYA Credential", text: course, url: window.location.href }).catch(() => { });
                      } else {
                        navigator.clipboard?.writeText(window.location.href);
                        showSnack("Link copied");
                      }
                    }}
                    className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 flex items-center gap-2"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Snackbar */}
        {snack && (
          <div className="fixed left-1/2 transform -translate-x-1/2 bottom-8 z-60">
            <div className="bg-black/80 text-white px-4 py-2 rounded-md shadow-lg">{snack.msg}</div>
          </div>
        )}
      </div>
      <footer className="px-6 py-4 bg-black/20 border-t border-cyan-600/5 text-sm text-slate-900 flex items-center justify-between">
        <div>powered by <strong>ABYA University</strong></div>
        <div className="font-mono">Support • Email: support@abyauniversity.edu • Call: +254 700 000 000</div>
      </footer>
    </VantaNetBG>
  );
}