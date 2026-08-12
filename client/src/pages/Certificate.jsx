import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getCourseByIdAPI, downloadCertificatePdfAPI } from "../services/api";

export default function Certificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth0();
  
  const [course, setCourse] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await getCourseByIdAPI(id);
        if (res.success) {
          setCourse(res.data);
        } else {
          console.error("Failed to fetch course for certificate");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      await downloadCertificatePdfAPI(id);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to download PDF. Please try again. " + (err.message || err));
    }
  };

  if (isLoading || fetching) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="text-xl mb-4">Please login to view your certificate.</p>
        <button onClick={() => navigate("/")} className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition">
          Go Home
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="text-xl mb-4">Course not found.</p>
        <button onClick={() => navigate("/courses")} className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4 print:bg-white print:text-black print:py-0 print:px-0">
      
      {/* Controls - Hidden during print */}
      <div className="max-w-4xl w-full flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate(`/course/${id}`)}
          className="px-5 py-2 bg-gray-800 text-gray-300 font-medium rounded-lg hover:bg-gray-700 hover:text-white transition flex items-center"
        >
          Back to Course
        </button>
        <button 
          onClick={handleDownloadPDF}
          className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition"
        >
          Download PDF
        </button>
      </div>

      {/* Certificate Container */}
      <div 
        id="certificate-container"
        className="relative w-full max-w-3xl aspect-[1.414/1] bg-[#0a0a0a] border border-gray-800 p-2 shadow-2xl rounded-sm"
      >
        
        {/* Inner Border */}
        <div className="w-full h-full border border-gray-700 p-6 sm:p-12 flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Background watermark/glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 to-transparent rounded-full pointer-events-none"></div>

          {/* Header */}
          <div className="mb-6 relative z-10">
            <h1 className="text-3xl sm:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 uppercase tracking-[0.2em]">
              Certificate
            </h1>
            <p className="text-xs sm:text-sm text-emerald-400/80 tracking-[0.4em] uppercase mt-2">
              of Completion
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center items-center w-full relative z-10">
            <p className="text-gray-400 text-xs sm:text-sm mb-3">This is to certify that</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-6 border-b border-gray-800 pb-2 min-w-[250px] sm:min-w-[400px] break-all px-4">
              {user.name || "Learner"}
            </h2>

            <p className="text-gray-400 text-xs sm:text-sm mb-3">has successfully completed the AI-generated course</p>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-400 mb-6 max-w-xl">
              {course.topic}
            </h3>

            <p className="text-gray-500 text-xs max-w-lg mx-auto">
              Demonstrating proficiency at the <span className="text-gray-300 font-semibold">{course.level}</span> level in <span className="text-gray-300 font-semibold">{course.language}</span>.
            </p>
          </div>

          {/* Footer */}
          <div className="w-full flex justify-between items-end mt-8 relative z-10 border-t border-gray-800/50 pt-6">
            <div className="text-left">
              <p className="text-white text-base font-bold">Text-to-Learn</p>
              <p className="text-[10px] text-gray-500">AI Learning Platform</p>
            </div>

            <div className="w-16 h-16 rounded-full border border-gray-700 flex items-center justify-center bg-[#0a0a0a]">
              <span className="text-2xl">🏆</span>
            </div>

            <div className="text-right">
              <p className="text-white text-base font-bold">
                {new Date().toLocaleDateString()}
              </p>
              <p className="text-[10px] text-gray-500">Date of Achievement</p>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
