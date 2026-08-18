import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import Profile from "./pages/Profile";
import CourseDetails from "./pages/CourseDetails";
import Explore from "./pages/Explore";
import Certificate from "./pages/Certificate";
import Review from "./pages/Review";
import StudyRoom from "./pages/StudyRoom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthButtons from "./components/AuthButtons";
import UserProfile from "./components/UserProfile";
import MultiplayerOverlay from "./components/MultiplayerOverlay";
import MobileMenu from "./components/MobileMenu";
import Navbar from "./components/Navbar";
import RoomStatusWidget from "./components/RoomStatusWidget";
import { setGetTokenSilently, setLogoutFn, syncUserAPI } from "./services/api";

export default function App() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently, logout } = useAuth0();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Set the token function immediately during render so children can use it in their effects
  if (getAccessTokenSilently) {
    setGetTokenSilently(getAccessTokenSilently);
    setLogoutFn(logout);
  }

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    syncUserAPI({
      email: user.email,
      name: user.name,
      picture: user.picture,
    }).catch(err => {
      console.warn("Failed to sync user:", err);
      // Optional: Handle token expiration if it fails with 401
      if (err.message && err.message.toLowerCase().includes('unauthorized')) {
        logout({ logoutParams: { returnTo: window.location.origin } });
      }
    });
  }, [isAuthenticated, user?.sub, logout]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white flex flex-col">

        <Navbar onMenuClick={() => setMobileOpen(true)} />

        <MobileMenu
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        
        <MultiplayerOverlay />
        <RoomStatusWidget />

        <div className="flex-1">
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

            <Route
              path="/review"
              element={
                <ProtectedRoute>
                  <Review />
                </ProtectedRoute>
              }
            />
            
            <Route path="/room" element={<StudyRoom />} />
            <Route path="/room/:roomCode" element={<StudyRoom />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}