import React from "react";

export function Button({ children, onClick, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md ${className}`}
    >
      {children}
    </button>
  );
}
