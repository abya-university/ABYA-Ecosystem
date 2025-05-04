import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
// import Navbar from "./components/Navbar";
import MasterPage from "./pages/MasterPage"
import CourseCreationPipeline from "./components/courseCreationPipeline";
import ProfileDash from "./pages/ProfileDash"
import ProfileForm from "./pages/ProfileForm"
import ConnectProfile from "./pages/ConnectProfile"
import VcForm from "./pages/VcForm";
import VerifyVc from "./pages/VerifyVc";
import NotFoundPage from "./pages/404Page";

function App() {
  return (
    <>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mainpage" element={<MasterPage />} />
        <Route path="create-course" element={<CourseCreationPipeline />} />
        <Route path="/ProfileDash" element={<ProfileDash />} />
        <Route path="/ProfileForm" element={<ProfileForm />} />
        <Route path="/ConnectProfile" element={<ConnectProfile />} />
        <Route path="/VcForm" element={<VcForm />} />
        <Route path="/VerifyVc" element={<VerifyVc />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
