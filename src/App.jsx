import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MasterPage from "./pages/MasterPage";
import CourseCreationPipeline from "./components/courseCreationPipeline";
import ProfileDash from "./pages/ProfileDash";
import NotFoundPage from "./pages/404Page";
import CourseMetricsPage from "./pages/CourseMetricsPage";
import SettingsPage from "./pages/Settings";

function App() {
  return (
    <>
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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
