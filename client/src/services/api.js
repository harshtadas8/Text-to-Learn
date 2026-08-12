const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.error(
    "❌ VITE_API_BASE_URL is not defined. Check Vercel environment variables."
  );
}

// Auth0 token getter (set from App.jsx)
let getTokenSilentlyFn = null;

export function setGetTokenSilently(fn) {
  getTokenSilentlyFn = fn;
}

async function handleApiError(res, defaultMsg) {
  let errMsg = defaultMsg;
  try {
    const text = await res.text();
    if (text) {
      try {
        const data = JSON.parse(text);
        if (data.message) errMsg = data.message;
        else errMsg = text;
      } catch {
        errMsg = text;
      }
    }
  } catch (err) {
    console.error("Failed to parse error response:", err);
  }
  throw new Error(errMsg);
}

/* ------------------ USER APIs ------------------ */

export async function syncUserAPI(payload) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/users/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to sync user");
  }

  return res.json();
}

// Simple in-memory cache for fast UI navigation
const apiCache = {
  dashboard: null,
  publicCourses: null,
  lastFetched: {}
};

export function clearApiCache() {
  apiCache.dashboard = null;
  apiCache.publicCourses = null;
  apiCache.lastFetched = {};
}

export async function getDashboardAPI(forceRefresh = false) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  // Use cache if available and not explicitly refreshing (cache for 1 min max)
  if (!forceRefresh && apiCache.dashboard && apiCache.lastFetched.dashboard > Date.now() - 60000) {
    // Return a clone to avoid mutation issues
    return JSON.parse(JSON.stringify(apiCache.dashboard));
  }

  const res = await fetch(`${BASE_URL}/users/dashboard`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to load dashboard data");
  }

  const data = await res.json();
  
  // Save to cache
  if (data.success) {
    apiCache.dashboard = data;
    apiCache.lastFetched.dashboard = Date.now();
  }
  
  return data;
}

export async function addXpAPI(amount) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/users/xp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ amount }),
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to add XP");
  }

  return res.json();
}

export async function getCourseProgressAPI(courseId) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/users/progress/${courseId}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to fetch progress");
  }

  return res.json();
}

export async function markLessonProgressAPI(courseId, lessonId, isCompleted) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/users/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ courseId, lessonId, isCompleted }),
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to update progress");
  }

  const data = await res.json();
  if (data.success) {
    clearApiCache();
  }
  return data;
}

/* ------------------ COURSE APIs ------------------ */

export async function generateCourseAPI(payload) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;
  console.log("generateCourseAPI token:", token ? "PRESENT" : "NULL");

  const res = await fetch(`${BASE_URL}/courses/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await handleApiError(res, "Course generation failed");
  }

  const data = await res.json();
  if (data.success) {
    clearApiCache();
  }
  return data;
}

export async function getPublicCoursesAPI(forceRefresh = false) {
  if (!forceRefresh && apiCache.publicCourses && apiCache.lastFetched.publicCourses > Date.now() - 300000) {
    return JSON.parse(JSON.stringify(apiCache.publicCourses));
  }

  const res = await fetch(`${BASE_URL}/courses/public`);

  if (!res.ok) {
    await handleApiError(res, "Failed to fetch public courses");
  }

  const data = await res.json();
  if (data.success) {
    apiCache.publicCourses = data;
    apiCache.lastFetched.publicCourses = Date.now();
  }
  
  return data;
}

export async function getCourseByIdAPI(id) {
  const res = await fetch(`${BASE_URL}/courses/${id}`);

  if (!res.ok) {
    await handleApiError(res, "Failed to fetch course");
  }

  return res.json();
}

/* ------------------ LESSON APIs ------------------ */

export async function generateLessonAPI(payload) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/lessons/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await handleApiError(res, "Lesson generation failed");
  }

  return res.json();
}

export async function getFullCourseAPI(id) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/courses/${id}/full`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to fetch full course");
  }

  return res.json();
}

export async function downloadCoursePdfAPI(id) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/courses/${id}/pdf`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to download course PDF");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Course_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadCertificatePdfAPI(id) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/courses/${id}/certificate`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to download certificate PDF");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Certificate_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/* ------------------ QUIZ APIs ------------------ */

export async function generateQuizAPI(payload) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/quizzes/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await handleApiError(res, "Quiz generation failed");
  }

  return res.json();
}

export async function submitQuizAPI(payload) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/quizzes/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await handleApiError(res, "Quiz submission failed");
  }

  const data = await res.json();
  if (data.success) {
    clearApiCache();
  }
  return data;
}

/* ------------------ TUTOR APIs ------------------ */

export async function chatWithTutorAPI(payload) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/tutor/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await handleApiError(res, "AI Tutor failed to respond");
  }

  return res.json();
}