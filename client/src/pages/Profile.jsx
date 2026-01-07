import { useAuth0 } from "@auth0/auth0-react";

/* Helpers */
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

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-sm">
        Loading profile…
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-sm">
        Please login to view your profile.
      </div>
    );
  }

  const initials = getInitials(user.name);
  const bgGradient = getAvatarColor(user.name);

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-emerald-400">
          My Profile
        </h1>

        <div
          className="bg-gradient-to-br from-gray-900 to-black
                     border border-gray-800 rounded-2xl
                     p-5 sm:p-8 shadow-xl"
        >
          {/* Avatar + Name */}
          <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div
              className={`flex-shrink-0
                          w-14 h-14 sm:w-20 sm:h-20
                          rounded-full flex items-center justify-center
                          bg-gradient-to-br ${bgGradient}
                          text-black font-bold
                          text-lg sm:text-2xl`}
            >
              {initials}
            </div>

            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-semibold truncate">
                {user.name || "Unnamed User"}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm truncate">
                {user.email}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <span className="text-gray-400">Email</span>
              <span className="truncate max-w-[60%] text-right">
                {user.email}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Auth Provider</span>
              <span className="capitalize text-gray-300">
                {user.sub?.split("|")[0]}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}