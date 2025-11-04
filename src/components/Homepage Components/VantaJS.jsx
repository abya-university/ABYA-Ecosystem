import React, { useRef, useEffect } from "react";

const VantaNetBG = ({ darkMode, children }) => {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    let mounted = true;
    let vantaCleanup = null;
    let threeScript, vantaScript;

    const loadScripts = async () => {
      if (window.THREE && window.VANTA && window.VANTA.NET) return true;

      if (!window.THREE) {
        threeScript = document.createElement("script");
        threeScript.src =
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js";
        threeScript.async = true;
        document.body.appendChild(threeScript);
        await new Promise((res) => {
          threeScript.onload = res;
        });
      }

      if (!window.VANTA || !window.VANTA.NET) {
        vantaScript = document.createElement("script");
        vantaScript.src =
          "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js";
        vantaScript.async = true;
        document.body.appendChild(vantaScript);
        await new Promise((res) => {
          vantaScript.onload = res;
        });
      }
      return true;
    };

    loadScripts().then(() => {
      if (!mounted || !window.VANTA || !window.VANTA.NET) return;
      if (vantaEffect.current) vantaEffect.current.destroy();

      vantaEffect.current = window.VANTA.NET({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        size: 1.0,
        // Updated to use your blue theme
        color: darkMode ? 0x1e40af : 0x064b6d, // blue-700 to blue-600
        color2: darkMode ? 0x3b82f6 : 0x60a5fa, // blue-500 to blue-400
        backgroundColor: darkMode ? 0x0f172a : 0xf8fafc, // gray-900 to gray-50
        points: 12.0,
        maxDistance: 25.0,
        spacing: 20.0,
        showLines: true,
        lineColor: darkMode ? 0x3b82f6 : 0x1d4ed8, // blue-500 to blue-600
        lineAlpha: 0.6,
      });

      vantaCleanup = () => {
        if (vantaEffect.current) vantaEffect.current.destroy();
        vantaEffect.current = null;
      };
    });

    return () => {
      mounted = false;
      if (vantaCleanup) vantaCleanup();
      if (vantaEffect.current) vantaEffect.current.destroy();
    };
  }, [darkMode]);

  return (
    <div className="relative min-h-screen">
      {/* Vanta Background */}
      <div
        ref={vantaRef}
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Content Overlay */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default VantaNetBG;
