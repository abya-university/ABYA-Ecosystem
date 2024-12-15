import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import Providers from "./providers/Providers.jsx";
import CourseProvider from "./contexts/courseContext.jsx";
import ChapterProvider from "./contexts/chapterContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <CourseProvider>
          <ChapterProvider>
            <App />
          </ChapterProvider>
        </CourseProvider>
      </BrowserRouter>
    </Providers>
  </StrictMode>
);
