import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPublicCoursesAPI } from "../services/api";

export default function Explore() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await getPublicCoursesAPI();
      if (res.success) {
        setCourses(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Failed to fetch public courses");
    } finally {
      setLoading(false);
    }
  };

  // Derived unique values for filters
  const uniqueLevels = useMemo(() => ["All", ...new Set(courses.map(c => c.level))], [courses]);
  const uniqueLanguages = useMemo(() => ["All", ...new Set(courses.map(c => c.language))], [courses]);

  // Filtered and Sorted Courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.topic.toLowerCase().includes(query) || 
        (c.goal && c.goal.toLowerCase().includes(query))
      );
    }

    // Level filter
    if (levelFilter !== "All") {
      result = result.filter(c => c.level === levelFilter);
    }

    // Language filter
    if (languageFilter !== "All") {
      result = result.filter(c => c.language === languageFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === "a-z") {
        return a.topic.localeCompare(b.topic);
      }
      return 0;
    });

    return result;
  }, [courses, searchQuery, levelFilter, languageFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-950 border border-red-900 rounded-lg p-6">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchCourses}
            className="mt-4 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-6">
          Explore Community Courses
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Discover a wide range of AI-generated courses created by other learners. 
          Dive into a topic, complete lessons, and earn XP to level up!
        </p>
      </div>

      {/* Search and Filters Section */}
      {courses.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-10 flex flex-col md:flex-row gap-4 items-end">
          
          {/* Search Bar */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-400 mb-2">Search Courses</label>
            <input 
              type="text" 
              placeholder="Search by topic or goal..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full md:w-auto">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-400 mb-2">Level</label>
              <select 
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition appearance-none"
              >
                {uniqueLevels.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
              <select 
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition appearance-none"
              >
                {uniqueLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition appearance-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="a-z">Topic (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      {courses.length > 0 && (
        <div className="mb-6 text-gray-400">
          Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
        </div>
      )}

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-12 bg-gray-950 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-lg">No public courses available yet. Be the first to generate one!</p>
          <Link to="/" className="inline-block mt-4 text-emerald-400 hover:text-emerald-300">
            Generate a Course
          </Link>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-gray-950 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-lg">No courses found matching your filters.</p>
          <button 
            onClick={() => {
              setSearchQuery("");
              setLevelFilter("All");
              setLanguageFilter("All");
            }}
            className="inline-block mt-4 text-emerald-400 hover:text-emerald-300"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Link
              key={course._id}
              to={`/course/${course._id}`}
              className="bg-gray-950 rounded-xl p-6 border border-gray-800 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300 group flex flex-col h-full cursor-pointer"
            >
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {course.topic}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-gray-900 text-gray-300 text-xs rounded-full border border-gray-800">
                    {course.level}
                  </span>
                  <span className="px-3 py-1 bg-emerald-950 text-emerald-400 text-xs rounded-full border border-emerald-900/50">
                    {course.language}
                  </span>
                </div>
                
                {course.goal && (
                  <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                    {course.goal}
                  </p>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-800/50 mt-auto flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
                <span className="text-sm font-medium text-emerald-400 group-hover:translate-x-1 transition-transform inline-block">
                  Start Learning
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
