import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function MobileMenu({ open, onClose }) {
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const location = useLocation();

  if (!open) return null;

  const isActive = (path) => location.pathname === path;
  const linkClass = (path) => 
    `transition ${isActive(path) ? 'text-emerald-400 font-semibold' : 'hover:text-white'}`;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 h-full w-64 bg-gray-950
                   border-r border-gray-800 z-50 p-5 flex flex-col"
      >
        <h2 className="text-xl font-bold text-emerald-400 mb-8">
          Text-to-Learn
        </h2>

        <nav className="flex flex-col gap-4 text-gray-300 text-sm">

          <Link
            to="/"
            onClick={onClose}
            className={linkClass("/")}
          >
            Home
          </Link>

          <Link
            to="/explore"
            onClick={onClose}
            className={linkClass("/explore")}
          >
            Explore
          </Link>

          {/* -------- LOGGED IN -------- */}
          {isAuthenticated && (
            <>
              <Link
                to="/courses"
                onClick={onClose}
                className={linkClass("/courses")}
              >
                My Courses
              </Link>

              <Link
                to="/room"
                onClick={onClose}
                className={linkClass("/room")}
              >
                Study Rooms
              </Link>

              <Link
                to="/review"
                onClick={onClose}
                className={linkClass("/review")}
              >
                Daily Review
              </Link>

              <Link
                to="/profile"
                onClick={onClose}
                className={linkClass("/profile")}
              >
                My Profile
              </Link>

              <button
                onClick={() => {
                  onClose();
                  logout({
                    logoutParams: {
                      returnTo: window.location.origin,
                    },
                  });
                }}
                className="text-left text-red-400 hover:text-red-300 transition mt-4"
              >
                Logout
              </button>
            </>
          )}

          {/* -------- LOGGED OUT -------- */}
          {!isAuthenticated && (
            <button
              onClick={() => {
                onClose();
                loginWithRedirect();
              }}
              className="text-left text-emerald-400 hover:text-emerald-300 transition mt-4"
            >
              Login
            </button>
          )}
        </nav>
      </div>
    </>
  );
}