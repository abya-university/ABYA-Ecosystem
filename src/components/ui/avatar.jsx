import React from "react";

export function Avatar({ src, alt = "User Avatar", className = "" }) {
  return (
    <img
      src={src || "https://via.placeholder.com/150"}
      alt={alt}
      className={`h-16 w-16 rounded-full border-2 border-gray-300 ${className}`}
    />
  );
}
