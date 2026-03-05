import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  Users,
  User,
  Loader2,
  GitBranch,
  DollarSign,
  TrendingUp,
  Award,
  Crown,
  GraduationCap,
  Zap,
  Network,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { useAmbassadorNetwork } from "../../contexts/ambassadorNetworkContext";
import { useActiveAccount } from "thirdweb/react";

// Tree connection lines component
const TreeConnections = ({ leftExists, rightExists, darkMode }) => {
  return (
    <svg
      className="absolute top-0 left-1/2 w-full h-16 -translate-x-1/2 pointer-events-none"
      style={{ zIndex: 5 }}
    >
      {/* Vertical line from parent */}
      <line
        x1="50%"
        y1="0"
        x2="50%"
        y2="40"
        stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Horizontal branch line */}
      <line
        x1="25%"
        y1="40"
        x2="75%"
        y2="40"
        stroke={darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Left leg connection */}
      {leftExists && (
        <line
          x1="25%"
          y1="40"
          x2="25%"
          y2="80"
          stroke={darkMode ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.4)"}
          strokeWidth="2"
        />
      )}

      {/* Right leg connection */}
      {rightExists && (
        <line
          x1="75%"
          y1="40"
          x2="75%"
          y2="80"
          stroke={darkMode ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.4)"}
          strokeWidth="2"
        />
      )}
    </svg>
  );
};

// Recursive component for tree nodes with real tree structure
const TreeNode = ({
  address,
  ambassadorData,
  depth = 0,
  darkMode,
  isLeft,
  isRight,
  x,
  y,
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Expand first 2 levels by default
  const nodeRef = useRef(null);
  const ambassador = ambassadorData[address];

  if (!ambassador) {
    return null;
  }

  const hasLeftChild =
    ambassador.leftLeg &&
    ambassador.leftLeg !== "0x0000000000000000000000000000000000000000";
  const hasRightChild =
    ambassador.rightLeg &&
    ambassador.rightLeg !== "0x0000000000000000000000000000000000000000";
  const hasChildren = hasLeftChild || hasRightChild;

  // Determine node color based on tier and position
  const getNodeColors = () => {
    if (ambassador.tier === 2) {
      return {
        bg: "from-yellow-500 to-amber-600",
        bgLight:
          "from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30",
        border: "border-yellow-500/30 dark:border-yellow-500/50",
        text: "text-yellow-700 dark:text-yellow-300",
        icon: Crown,
        shadow: "shadow-yellow-500/25",
      };
    } else if (ambassador.tier === 1) {
      return {
        bg: "from-green-500 to-emerald-600",
        bgLight:
          "from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30",
        border: "border-green-500/30 dark:border-green-500/50",
        text: "text-green-700 dark:text-green-300",
        icon: GraduationCap,
        shadow: "shadow-green-500/25",
      };
    } else {
      return {
        bg: "from-blue-500 to-indigo-600",
        bgLight:
          "from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30",
        border: "border-blue-500/30 dark:border-blue-500/50",
        text: "text-blue-700 dark:text-blue-300",
        icon: User,
        shadow: "shadow-blue-500/25",
      };
    }
  };

  const colors = getNodeColors();
  const IconComponent = colors.icon;

  // Position class for left/right legs
  const positionClass = isLeft
    ? "ml-auto mr-4"
    : isRight
    ? "ml-4 mr-auto"
    : "mx-auto";
  const justifyClass = isLeft
    ? "justify-end"
    : isRight
    ? "justify-start"
    : "justify-center";

  return (
    <div className="relative flex flex-col items-center" ref={nodeRef}>
      {/* Connection lines for children */}
      {hasChildren && isExpanded && (
        <TreeConnections
          leftExists={hasLeftChild}
          rightExists={hasRightChild}
          darkMode={darkMode}
        />
      )}

      {/* Node Container */}
      <div
        className={`relative group ${positionClass}`}
        style={{ width: "280px" }}
      >
        {/* Animated background glow */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${colors.bg} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`}
        />

        {/* Main Node Card */}
        <div
          className={`relative rounded-2xl border-2 ${colors.border} bg-gradient-to-br ${colors.bgLight} p-5 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${colors.shadow}`}
        >
          {/* Top decoration */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div
              className={`h-1 w-12 rounded-full bg-gradient-to-r ${colors.bg}`}
            />
          </div>

          {/* Header with icon and address */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl bg-gradient-to-r ${colors.bg} p-2.5 shadow-lg`}
              >
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}
                  >
                    {ambassador.tier === 2
                      ? "Founding"
                      : ambassador.tier === 1
                      ? "General"
                      : "Member"}
                  </span>
                  {ambassador.level > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${colors.bg} text-white font-semibold`}
                    >
                      Lvl {ambassador.level}
                    </span>
                  )}
                </div>
                <p className="font-mono text-sm font-semibold mt-1">
                  {address.substring(0, 8)}...{address.substring(36)}
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div
              className={`h-2 w-2 rounded-full ${
                ambassador.isActive
                  ? "bg-green-500 animate-pulse"
                  : "bg-slate-400"
              } shadow-lg`}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl bg-white/50 dark:bg-slate-800/50 p-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Sales
                </span>
              </div>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                ${(Number(ambassador.totalDownlineSales) / 1e6).toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl bg-white/50 dark:bg-slate-800/50 p-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Comms
                </span>
              </div>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                ${(Number(ambassador.lifetimeCommissions) / 1e6).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 p-1.5 shadow-lg hover:scale-110 transition-transform duration-200"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-white" />
              ) : (
                <ChevronRight className="h-4 w-4 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Leg Labels */}
        {hasChildren && isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-16">
            <div className="flex justify-between px-8">
              {hasLeftChild && (
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                  Left Leg
                </span>
              )}
              {hasRightChild && (
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                  Right Leg
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Children Tree */}
      {hasChildren && isExpanded && (
        <div className="relative mt-24 w-full">
          <div className={`flex ${justifyClass} gap-8`}>
            {/* Left Leg */}
            {hasLeftChild && (
              <div className="relative flex-1 max-w-[300px]">
                <TreeNode
                  address={ambassador.leftLeg}
                  ambassadorData={ambassadorData}
                  depth={depth + 1}
                  darkMode={darkMode}
                  isLeft={true}
                />
              </div>
            )}

            {/* Right Leg */}
            {hasRightChild && (
              <div className="relative flex-1 max-w-[300px]">
                <TreeNode
                  address={ambassador.rightLeg}
                  ambassadorData={ambassadorData}
                  depth={depth + 1}
                  darkMode={darkMode}
                  isRight={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main component with pan and zoom
export default function BinaryTreeVisualization({ darkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ambassadorData, setAmbassadorData] = useState({});
  const [rootAddress, setRootAddress] = useState(null);
  const [treeStats, setTreeStats] = useState({
    totalNodes: 0,
    totalLevels: 0,
    activeNodes: 0,
  });

  // Pan and zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const { getAllAmbassadors } = useAmbassadorNetwork();
  const account = useActiveAccount();

  useEffect(() => {
    if (isOpen && account?.address) {
      loadNetworkTree();
    }
  }, [isOpen, account?.address]);

  const loadNetworkTree = async () => {
    setLoading(true);
    try {
      const ambassadors = await getAllAmbassadors();
      if (ambassadors && ambassadors.length > 0) {
        // Create a map of address -> ambassador details
        const dataMap = {};
        let totalActive = 0;

        ambassadors.forEach((amb) => {
          dataMap[amb.address] = amb;
          if (amb.isActive) totalActive++;
        });

        setAmbassadorData(dataMap);
        setTreeStats((prev) => ({
          ...prev,
          totalNodes: ambassadors.length,
          activeNodes: totalActive,
        }));

        // Find the root (user's address or first ambassador with no valid sponsor)
        const userAmbassador = ambassadors.find(
          (amb) => amb.address.toLowerCase() === account.address.toLowerCase(),
        );

        if (userAmbassador) {
          setRootAddress(userAmbassador.address);
        } else {
          // Fallback to first root ambassador
          const root = ambassadors.find(
            (amb) =>
              !amb.sponsor ||
              amb.sponsor === "0x0000000000000000000000000000000000000000",
          );
          setRootAddress(root ? root.address : ambassadors[0].address);
        }

        // Reset view when loading new tree
        resetView();
      }
    } catch (error) {
      console.error("Error loading network tree:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing";
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab";
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 3));
    }
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-3xl border shadow-xl transition-all duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50"
          : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70"
      } ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
      style={{ height: isFullscreen ? "100vh" : "auto" }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-green-500/5 blur-3xl" />
      </div>

      {/* Header */}
      <div
        className="relative flex items-center justify-between cursor-pointer p-6 z-10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-3">
            <Network className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Network Tree Visualization
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Drag to pan • Ctrl+Scroll to zoom • Click and hold to move around
            </p>
          </div>
        </div>

        {/* Stats Preview */}
        {!isOpen && treeStats.totalNodes > 0 && (
          <div className="flex items-center gap-4 mr-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">
                {treeStats.totalNodes}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold">
                {treeStats.activeNodes}
              </span>
            </div>
          </div>
        )}

        <button className="rounded-xl p-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          {isOpen ? (
            <ChevronDown className="h-6 w-6" />
          ) : (
            <ChevronRight className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Tree Content with Pan and Zoom */}
      {isOpen && (
        <div className="relative border-t border-slate-200 dark:border-slate-700">
          {/* Controls Bar */}
          <div className="flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm">
            {/* Network Stats */}
            {!loading && rootAddress && (
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-500/20 p-2">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total Network
                    </p>
                    <p className="text-lg font-bold">{treeStats.totalNodes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-green-500/20 p-2">
                    <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Active
                    </p>
                    <p className="text-lg font-bold">{treeStats.activeNodes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-yellow-500/20 p-2">
                    <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Founding
                    </p>
                    <p className="text-lg font-bold">
                      {
                        Object.values(ambassadorData).filter(
                          (a) => a.tier === 2,
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Zoom and Pan Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={resetView}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Reset view"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Zoom out (Ctrl+Scroll)"
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Zoom in (Ctrl+Scroll)"
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2" />
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Canvas Area with Pan and Zoom */}
          <div
            ref={canvasRef}
            className="relative overflow-hidden"
            style={{
              height: isFullscreen ? "calc(100vh - 140px)" : "600px",
              cursor: isDragging ? "grabbing" : "grab",
              background: darkMode
                ? "radial-gradient(circle at 50% 50%, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.8) 100%)"
                : "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5) 0%, rgba(241,245,249,0.8) 100%)",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-500 dark:border-slate-600 dark:border-t-blue-400"></div>
                  <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-500/20"></div>
                </div>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Loading network tree...
                </p>
              </div>
            ) : rootAddress && Object.keys(ambassadorData).length > 0 ? (
              <div
                className="absolute transition-transform duration-100 ease-out"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: "0 0",
                  minWidth: "100%",
                  minHeight: "100%",
                }}
              >
                <div className="flex justify-center items-start min-h-full py-8">
                  <TreeNode
                    address={rootAddress}
                    ambassadorData={ambassadorData}
                    depth={0}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                <div className="relative inline-block">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <div className="absolute inset-0 animate-ping">
                    <Users className="h-16 w-16 mx-auto opacity-20" />
                  </div>
                </div>
                <p className="text-lg font-semibold mb-2">
                  No Network Data Available
                </p>
                <p className="text-sm">
                  Start building your network to see the tree visualization
                </p>
              </div>
            )}

            {/* Pan Instructions Overlay */}
            {!loading && rootAddress && (
              <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 text-xs text-slate-500 dark:text-slate-400 shadow-lg">
                <div className="flex items-center gap-2">
                  <Move className="h-3 w-3" />
                  <span>Drag to pan</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <ZoomIn className="h-3 w-3" />
                  <span>Ctrl+Scroll to zoom</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
