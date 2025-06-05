// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import MasterPage from "./pages/MasterPage";
import CourseCreationPipeline from "./components/courseCreationPipeline";
import ProfileDash from "./pages/ProfileDash";
import ProfileForm from "./pages/ProfileForm";
import ConnectProfile from "./pages/ConnectProfile";
import TestProfile from "./pages/TestProfile";
import VcForm from "./pages/VcForm";
import VerifyVc from "./pages/VerifyVc";
import WalletConnection from './components/WalletConnection';
import { DidProvider } from './contexts/DidContext';
import { ProfileProvider } from './contexts/ProfileContext';
import NotFoundPage from "./pages/404Page";
import CourseMetricsPage from "./pages/CourseMetricsPage";

function App() {
  return (
    <DidProvider>
      <ProfileProvider>
      <WalletConnection />
    <Routes>
      
      <Route path="/" element={<Home />} />
      <Route path="/mainpage" element={<MasterPage />} />
      <Route path="create-course" element={<CourseCreationPipeline />} />
      <Route path="/ProfileDash" element={<ProfileDash />} />
      <Route path="/ProfileForm" element={<ProfileForm />} />
      <Route path="/ConnectProfile" element={<ConnectProfile />} />
      <Route path="/TestProfile" element={<TestProfile />} />
      <Route path="/VcForm" element={<VcForm />} />
      <Route path="/VerifyVc" element={<VerifyVc />} />
      <Route
        path="/course-metrics/:courseId"
        element={<CourseMetricsPage />}
      />
      <Route path="*" element={<NotFoundPage />} />
     
    </Routes>
    </ProfileProvider>
    </DidProvider>
  );
}

export default App;
