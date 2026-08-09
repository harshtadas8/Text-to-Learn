import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Certificate from "./pages/Certificate";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthButtons from "./components/AuthButtons";
import UserProfile from "./components/UserProfile";
import MobileMenu from "./components/MobileMenu";
import Navbar from "./components/Navbar";

import { setGetTokenSilently } from "./services/api";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { getAccessTokenSilently, isAuthenticated, logout, user } = useAuth0();

  useEffect(() => {
    setGetTokenSilently(getAccessTokenSilently);

    // If Auth0 thinks we are authenticated, verify we can actually get a token.
    // If we can't (due to expired session or scope changes), clear the bad state.
    if (isAuthenticated) {
      getAccessTokenSilently()
        .then(() => {
          // Token is valid, sync user with backend
          import("./services/api").then(({ syncUserAPI }) => {
            syncUserAPI({
              email: user.email,
              name: user.name,
              picture: user.picture,
            }).catch(err => console.error("Failed to sync user:", err));
          });
        })
        .catch((err) => {
          console.warn("Session invalid, clearing state:", err);
          logout({ logoutParams: { returnTo: window.location.origin } });
        });
    }
  }, [getAccessTokenSilently, isAuthenticated, logout, user]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white">

        <Navbar onMenuClick={() => setMobileOpen(true)} />

        <MobileMenu
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route path="/explore" element={<Explore />} />
          <Route path="/certificate/:id" element={<Certificate />} />

          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />

          <Route path="/course/:id" element={<CourseDetails />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>

      </div>
    </BrowserRouter>
  );
}