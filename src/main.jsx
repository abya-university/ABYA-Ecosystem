import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import Providers from "./providers/Providers.jsx";
import CourseProvider from "./contexts/courseContext.jsx";
import ChapterProvider from "./contexts/chapterContext.jsx";
import LessonProvider from "./contexts/lessonContext.jsx";
import QuizProvider from "./contexts/quizContext.jsx";
import { UserProvider } from "./contexts/userContext.jsx";
import { CertificatesProvider } from "./contexts/certificatesContext.jsx";
import { CommunityEventsProvider } from "./contexts/communityEventsContext.jsx";
import { CommunityMembersProvider } from "./contexts/communityMembersContext.jsx";
import { ProjectProposalsProvider } from "./contexts/projectProposalsContext.jsx";
import { AirdropProposalProvider } from "./contexts/airdropProposalContext.jsx";
import { DidProvider } from "./contexts/DidContext.jsx";
import { ProfileProvider } from "./contexts/ProfileContext.jsx";
import { UserPositionProvider } from "./contexts/fake-liquidity-test-contexts/userPositionContext.jsx";
import { TransactionHistoryProvider } from "./contexts/fake-liquidity-test-contexts/historyContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Render WalletConnection globally */}
    <DidProvider>
      <ProfileProvider>
        <Providers>
          <BrowserRouter>
            <CourseProvider>
              <ChapterProvider>
                <LessonProvider>
                  <QuizProvider>
                    <UserProvider>
                      <CertificatesProvider>
                        <CommunityEventsProvider>
                          <CommunityMembersProvider>
                            <ProjectProposalsProvider>
                              <AirdropProposalProvider>
                                <TransactionHistoryProvider>
                                  <UserPositionProvider>
                                    <App />
                                  </UserPositionProvider>
                                </TransactionHistoryProvider>
                              </AirdropProposalProvider>
                            </ProjectProposalsProvider>
                          </CommunityMembersProvider>
                        </CommunityEventsProvider>
                      </CertificatesProvider>
                    </UserProvider>
                  </QuizProvider>
                </LessonProvider>
              </ChapterProvider>
            </CourseProvider>
          </BrowserRouter>
        </Providers>
      </ProfileProvider>
    </DidProvider>
  </StrictMode>
);
