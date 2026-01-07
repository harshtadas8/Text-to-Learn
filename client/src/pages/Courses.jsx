import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function Courses() {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchCourses = async () => {
      try {
        const token = await getAccessTokenSilently();

        const res = await fetch("http://localhost:5000/api/courses/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setCourses(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="mb-4">Please login to view your courses</p>
        <button
          onClick={() => loginWithRedirect()}
          className="px-6 py-2 bg-emerald-500 rounded-lg"
        >
          Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading courses...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-emerald-400">
          My Courses
        </h1>

        {courses.length === 0 ? (
          <p className="text-gray-400">No courses generated yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <div
                key={course._id}
                className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-5 hover:border-emerald-400 transition cursor-pointer"
                onClick={() => navigate(`/course/${course._id}`)}
              >
                <h2 className="text-xl font-semibold mb-2">
                  {course.topic}
                </h2>
                <p className="text-sm text-gray-400">
                  Level: {course.level}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Created: {new Date(course.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
