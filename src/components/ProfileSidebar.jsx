// ProfileSidebar.jsx
import { Link } from "react-router-dom";
import { IdCardIcon, ChevronDown, ChevronUp, UserPlus2, VerifiedIcon } from "lucide-react";

export default function ProfileSidebar({
  isDidOpen,
  setIsDidOpen,
  isDelegateOpen,
  setIsDelegateOpen,
  isVcOpen,
  setIsVcOpen,
  openModal
}) {
  return (
    <aside className="w-64 border-r border-yellow-300 flex flex-col h-full">
      
      
      {/* Bottom Row: Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 mb-8">
        <h3 className="text-2xl font-bold mt-4 mb-4 tracking-wide text-center text-yellow-500">Profile Kit</h3>
        <ul className="space-y-3">
          
          {/* DID Dropdown */}
          <li>
            <div 
              className="flex items-center justify-between cursor-pointer dark:text-gray-100 hover:text-blue-400 transition transform hover:translate-x-2"
              onClick={() => setIsDidOpen(!isDidOpen)}
            >
              <div className="flex items-center gap-2">
                <IdCardIcon size={20} /> <span>DID</span>
              </div>
              {isDidOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {isDidOpen && (
              <ul className="ml-6 mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                <li className="hover:text-blue-400 cursor-pointer">
                  <button 
                    className="flex items-center gap-2"
                    onClick={() => openModal("DidDoc")}
                  >
                    DID Document
                  </button>
                </li>
                <li className="hover:text-blue-400 cursor-pointer">
                  <button 
                    className="flex items-center gap-2"
                    onClick={() => openModal("lookupDID")}
                  >
                    DID Lookup
                  </button>
                </li>
                <li className="hover:text-blue-400 cursor-pointer">
                  <button 
                    className="flex items-center gap-2"
                    onClick={() => openModal("changeOwner")}
                  >
                    Change Owner
                  </button>
                </li>
              </ul>
            )}
          </li>

          {/* Delegate Dropdown */}
          <li>
            <div 
              className="flex items-center justify-between cursor-pointer dark:text-gray-100 hover:text-blue-400 transition transform hover:translate-x-2"
              onClick={() => setIsDelegateOpen(!isDelegateOpen)}
            >
              <div className="flex items-center gap-2">
                <UserPlus2 size={20} /> <span>Delegate</span>
              </div>
              {isDelegateOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {isDelegateOpen && (
              <ul className="ml-6 mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                <li className="hover:text-blue-400 cursor-pointer">
                  <button 
                    className="flex items-center gap-2"
                    onClick={() => openModal("addDelegate")}
                  >
                    Add Delegate
                  </button>
                </li>
                <li className="hover:text-blue-400 cursor-pointer">
                  <button 
                    className="flex items-center gap-2"
                    onClick={() => openModal("checkDelegate")}
                  >
                    Validity Check
                  </button>
                </li>
                <li className="hover:text-blue-400 cursor-pointer">
                  <button 
                    className="flex items-center gap-2"
                    onClick={() => openModal("revokeDelegate")}
                  >
                    Revoke Delegate
                  </button>
                </li>
              </ul>
            )}
          </li>

          {/* Verifiable Credentials Dropdown */}
          <li>
            <div 
              className="flex items-center justify-between cursor-pointer dark:text-gray-100 hover:text-blue-400 transition transform hover:translate-x-2"
              onClick={() => setIsVcOpen(!isVcOpen)}
            >
              <div className="flex items-center gap-2">
                <VerifiedIcon size={20} /> <span>Verifiable Credentials</span>
              </div>
              {isVcOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {isVcOpen && (
              <ul className="ml-6 mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                <li className="hover:text-blue-400 cursor-pointer">
                  <button 
                    className="flex items-center gap-2"
                    onClick={() => openModal("requestVc")}
                  >
                    Request VC
                  </button>
                </li>
                <li className="hover:text-blue-400 cursor-pointer">Verify Credentials</li>
                <li className="hover:text-blue-400 cursor-pointer">Revoke Credentials</li>
              </ul>
            )}
          </li>
        </ul>
      </div>
    </aside>
  );
}
