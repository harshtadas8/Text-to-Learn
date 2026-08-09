import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import UserProfile from "./UserProfile";
import AuthButtons from "./AuthButtons";

export default function Navbar({ onMenuClick }) {
  const { isAuthenticated } = useAuth0();
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Explore", path: "/explore" },
  ];
  
  if (isAuthenticated) {
    navLinks.push({ name: "My Courses", path: "/courses" });
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
              className={`text-base font-medium transition ${
                location.pathname === link.path
                  ? "text-emerald-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        <UserProfile />
        <AuthButtons />
      </div>

      <div className="sm:hidden">
        <UserProfile />
      </div>
    </header>
  );
}
