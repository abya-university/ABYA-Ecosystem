// src/contexts/DidContext.jsx
import React, { createContext, useContext, useState } from 'react';

const DidContext = createContext();
export const DidProvider = ({ children }) => {
  const [ethrDid, setEthrDid] = useState('');
  return (
    <DidContext.Provider value={{ ethrDid, setEthrDid }}>
      {children}
    </DidContext.Provider>
  );
};
export const useDid = () => useContext(DidContext);
