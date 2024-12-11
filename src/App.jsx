import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
// import Navbar from "./components/Navbar";
import MasterPage from "./pages/MasterPage";
import CourseCreationPipeline from "./components/courseCreationPipeline";

function App() {
  return (
    <>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mainpage" element={<MasterPage />} />
        <Route path="create-course" element={<CourseCreationPipeline />} />
      </Routes>
    </>
  );
}

export default App;
