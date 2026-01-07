import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth0();

  // While auth state is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-sm">
        Checking authentication…
      </div>
    );
  }

  // If not logged in → redirect to home
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If logged in → allow access
  return children;
}