import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-950 via-gray-900 to-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="relative mb-8">
          {/* Animated Error Code */}
          <div className="absolute -inset-2 bg-yellow-500/20 rounded-full blur-2xl animate-pulse"></div>
          <h1 className="text-[12rem] font-bold text-yellow-500 relative z-10 leading-none">
            404
          </h1>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center mb-4">
            <AlertTriangle
              size={64}
              className="text-yellow-500 animate-bounce"
            />
          </div>

          <h2 className="text-4xl font-bold mb-4">Oops! Page Not Found</h2>

          <p className="text-xl text-gray-300 mb-8">
            The page you're looking for seems to have wandered off into the
            blockchain wilderness. Don't worry, we'll help you find your way
            back to familiar territory.
          </p>

          <div className="flex justify-center space-x-4">
            <Link
              to="/"
              className="bg-yellow-500 text-black px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-yellow-600 transition-colors"
            >
              <Home size={20} />
              <span>Return Home</span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="border border-yellow-500 text-yellow-500 px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-yellow-500 hover:text-black transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Go Back</span>
            </button>
          </div>

          <div className="mt-12 text-gray-400 flex items-center justify-center space-x-2">
            <RefreshCw size={16} className="animate-spin-slow" />
            <span>Reconnecting to the decentralized network...</span>
          </div>
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

export default NotFoundPage;
