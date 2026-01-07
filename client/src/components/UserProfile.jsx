import { useAuth0 } from "@auth0/auth0-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* Generate initials from user name */
function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return "U";
}

/* Generate consistent background color */
function getAvatarColor(name = "") {
  const colors = [
    "from-emerald-500 to-teal-500",
    "from-blue-500 to-indigo-500",
    "from-purple-500 to-pink-500",
    "from-rose-500 to-red-500",
    "from-amber-500 to-orange-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export default function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth0();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) return null;

  const initials = getInitials(user.name);
  const bgGradient = getAvatarColor(user.name);

  return (
    <div className="relative" ref={ref}>
      {/* Avatar */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`w-9 h-9 rounded-full flex items-center justify-center
                    bg-gradient-to-br ${bgGradient}
                    text-black font-bold text-sm
                    border-2 border-gray-700 hover:border-emerald-400 transition`}
        title={user.name}
      >
        {initials}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-44 rounded-xl
                        bg-gray-900 border border-gray-800
                        shadow-lg overflow-hidden z-50">

          <button
            onClick={() => {
              setOpen(false);
              navigate("/profile"); // placeholder route
            }}
            className="w-full text-left px-4 py-3 text-sm text-gray-300
                       hover:bg-gray-800 hover:text-white transition"
          >
            My Profile
          </button>

          <button
            onClick={() => {
              setOpen(false);
              navigate("/courses");
            }}
            className="w-full text-left px-4 py-3 text-sm text-gray-300
                       hover:bg-gray-800 hover:text-white transition"
          >
            My Courses
          </button>

          <div className="border-t border-gray-800" />

          <button
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
            className="w-full text-left px-4 py-3 text-sm
                       text-red-400 hover:bg-red-500/10 transition"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}