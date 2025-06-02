// src/contexts/ProfileContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('profile');
    return saved ? JSON.parse(saved) : {
      did: null,
      firstName: '',
      secondName: '',
      email: '',
    };
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('profile', JSON.stringify(profile));
  }, [profile]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
