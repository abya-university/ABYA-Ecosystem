import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
// import Navbar from "./components/Navbar";
import MasterPage from "./pages/MasterPage";
import CourseCreationPipeline from "./components/courseCreationPipeline";
import DidForm from "./pages/DidForm";
import OwnerCheck from "./pages/DidOwnerCheck";
import ChangeOwner from "./pages/ChangeOwner";
import AddDelegate from "./pages/AddDelegate";
import CheckDelegate from "./pages/CheckDelegate";
import RevokeDelegate from "./pages/RevokeDelegate";
import NotFoundPage from "./pages/404Page";
import CourseMetricsPage from "./pages/CourseMetricsPage";

function App() {
  return (
    <>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mainpage" element={<MasterPage />} />
        <Route path="create-course" element={<CourseCreationPipeline />} />
        <Route path="/Didpage" element={<DidForm />} />
        <Route path="/Ownercheck" element={<OwnerCheck />} />
        <Route path="/Changeowner" element={<ChangeOwner />} />
        <Route path="/AddDelegate" element={<AddDelegate />} />
        <Route path="/CheckDelegate" element={<CheckDelegate />} />
        <Route path="/RevokeDelegate" element={<RevokeDelegate />} />
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
