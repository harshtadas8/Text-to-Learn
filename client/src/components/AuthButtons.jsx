import { useAuth0 } from "@auth0/auth0-react";

export default function AuthButtons() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <span className="text-gray-400 text-sm">Loading...</span>;
  }

  if (isAuthenticated) return null;

  return (
    <button
      onClick={() => loginWithRedirect()}
      className="px-4 py-2 rounded-lg
                 bg-gradient-to-r from-emerald-400 to-blue-500
                 text-black font-semibold hover:opacity-90 transition"
    >
      Login
    </button>
  );
}