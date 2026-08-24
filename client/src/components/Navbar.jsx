import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";
import { useAuth0 } from "@auth0/auth0-react";
import UserProfile from "./UserProfile";
import AuthButtons from "./AuthButtons";
import { getDueCardsAPI } from "../services/api";

export default function Navbar({ onMenuClick }) {
  const { user, isAuthenticated } = useAuth0();
  const location = useLocation();
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    const fetchDueCards = () => {
      if (isAuthenticated && user?.sub) {
        getDueCardsAPI(user.sub).then(res => {
          if (res.success && res.data) {
            setDueCount(res.data.length);
          }
        }).catch(err => console.error("Failed to fetch due cards", err));
      }
    };

    fetchDueCards();

    window.addEventListener("card-reviewed", fetchDueCards);
    return () => window.removeEventListener("card-reviewed", fetchDueCards);
  }, [isAuthenticated, user]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Explore", path: "/explore" },
  ];
  
  if (isAuthenticated) {
    navLinks.push({ name: "My Courses", path: "/courses" });
    navLinks.push({ name: "Study Rooms", path: "/room" });
    navLinks.push({ name: "Daily Review", path: "/review" });
    navLinks.push({ name: "Profile", path: "/profile" });
  }

  return (
    <header className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-800 bg-black sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="sm:hidden text-gray-300 hover:text-white transition text-2xl focus:outline-none"
          >
            ☰
          </button>
          <Link to="/" className="text-xl sm:text-2xl font-bold text-emerald-400 hover:text-emerald-300 transition leading-none">
            Text-to-Learn
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden sm:flex items-center gap-6 ml-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-2 text-base font-medium transition ${
                location.pathname === link.path
                  ? "text-emerald-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.name}
              {link.name === "Daily Review" && dueCount > 0 && (
                <span className="bg-emerald-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {dueCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        {isAuthenticated && <NotificationDropdown />}
        <UserProfile />
        <AuthButtons />
      </div>

      <div className="sm:hidden">
        <AuthButtons />
      </div>


    </header>
  );
}
