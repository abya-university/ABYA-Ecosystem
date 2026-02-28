// ABYA-Ecosystem/src/App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MasterPage from "./pages/MasterPage";
import CourseCreationPipeline from "./components/courseCreationPipeline";
import ProfileDash from "./pages/ProfileDash";
import NotFoundPage from "./pages/404Page";
import CourseMetricsPage from "./pages/CourseMetricsPage";
import { ToastContainer } from "react-toastify";
import NetworkMainpage from "./pages/AmbassadorNetworkPages/NetworkMainpage";
import FinanceMainpage from "./pages/LiquidityPages/FinanceMainpage";
import SharePresentation from "./pages/SharePresentation";

function App() {
  return (
    <>
      <ToastContainer
        position="bottom-right"
        theme="colored"
        className="z-[9999]"
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mainpage" element={<MasterPage />} />
        <Route path="create-course" element={<CourseCreationPipeline />} />
        <Route path="/ProfileDash" element={<ProfileDash />} />
        {/* <Route path="/settings" element={<SettingsPage />} /> */}

        <Route
          path="/course-metrics/:courseId"
          element={<CourseMetricsPage />}
        />

        <Route path="/networkMainpage" element={<NetworkMainpage />} />
        <Route path="/share/view/:token" element={<SharePresentation />} />
        <Route path="/liquidityMainpage" element={<FinanceMainpage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
