import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/courses")
      .then(res => res.json())
      .then(data => {
        setCourses(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

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
