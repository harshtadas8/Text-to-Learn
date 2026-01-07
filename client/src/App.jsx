import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthButtons from "./components/AuthButtons";
import UserProfile from "./components/UserProfile";
import MobileMenu from "./components/MobileMenu";

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white">

        {/* ---------- TOP NAVBAR ---------- */}
        <header className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-800">

          {/* Left: Hamburger (mobile) + Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="sm:hidden text-gray-300 text-2xl"
            >
              ☰
            </button>

            <h1 className="text-lg sm:text-xl font-bold text-emerald-400">
              Text-to-Learn
            </h1>
          </div>

          {/* Right: Desktop actions */}
          <div className="hidden sm:flex items-center gap-4">
            <UserProfile />
            <AuthButtons />
          </div>

          {/* Right: Mobile avatar only */}
          <div className="sm:hidden">
            <UserProfile />
          </div>
        </header>

        {/* ---------- MOBILE DRAWER ---------- */}
        <MobileMenu
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        {/* ---------- ROUTES ---------- */}
        <Routes>
  <Route path="/" element={<Home />} />

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