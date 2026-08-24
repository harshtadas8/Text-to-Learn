const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.error(
    "❌ VITE_API_BASE_URL is not defined. Check Vercel environment variables."
  );
}

// Auth0 token getter (set from App.jsx)
let getTokenSilentlyFn = null;
let logoutFn = null;

export function setGetTokenSilently(fn) {
  getTokenSilentlyFn = fn;
}

export function setLogoutFn(fn) {
  logoutFn = fn;
}

async function getSafeToken() {
  if (!getTokenSilentlyFn) return null;
  try {
    return await getTokenSilentlyFn();
  } catch (err) {
    console.error("Auth0 Token Error:", err);
    if (
      err.error === "login_required" ||
      err.error === "consent_required" ||
      (err.message && err.message.toLowerCase().includes("login")) ||
      (err.message && err.message.toLowerCase().includes("missing refresh token"))
    ) {
      console.warn("Session expired. Logging out.");
      if (logoutFn) {
        logoutFn({ logoutParams: { returnTo: window.location.origin } });
      }
    }
    // Throw anyway so the API call fails properly instead of sending a request without a token
    throw err;
  }
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
  const token = await getSafeToken();

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
  const token = await getSafeToken();

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
  const token = await getSafeToken();

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
  const token = await getSafeToken();

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
  const token = await getSafeToken();

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
  const token = await getSafeToken();
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

export async function deleteCourseAPI(id) {
  const token = await getSafeToken();

  const res = await fetch(`${BASE_URL}/courses/${id}`, {
    method: "DELETE",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to delete course");
  }

  const data = await res.json();
  if (data.success) {
    clearApiCache();
  }
  return data;
}

/* ------------------ LESSON APIs ------------------ */

export async function generateLessonAPI(payload) {
  const token = await getSafeToken();

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
  const token = await getSafeToken();

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
  const token = await getSafeToken();

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
  const token = await getSafeToken();

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
  const token = await getSafeToken();

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
  const token = await getSafeToken();

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
  const token = await getSafeToken();

  const res = await fetch(`${BASE_URL}/tutor/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  return res;
}
/* ------------------ SRS APIs ------------------ */

export async function harvestFlashcardsAPI(payload) {
  const token = await getSafeToken();

  const res = await fetch(`${BASE_URL}/srs/harvest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to harvest flashcards");
  }

  return res.json();
}

export async function getDueCardsAPI(userId) {
  const token = await getSafeToken();

  const res = await fetch(`${BASE_URL}/srs/due?userId=${userId}`, {
    method: "GET",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to fetch due flashcards");
  }

  return res.json();
}

export async function reviewCardAPI(payload) {
  const token = await getSafeToken();

  const res = await fetch(`${BASE_URL}/srs/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await handleApiError(res, "Failed to submit flashcard review");
  }

  return res.json();
}


// --- Reconstructed P0 APIs ---

export async function generateDiagnosticQuizAPI(payload) {
  const token = await getSafeToken();
  const res = await fetch(`${BASE_URL}/courses/diagnostic-quiz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleApiError(res, "Failed to generate diagnostic quiz");
  return res.json();
}

export async function uploadMaterialAPI(file) {
  const token = await getSafeToken();
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${BASE_URL}/courses/extract-text`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  if (!res.ok) await handleApiError(res, "Failed to upload material");
  return res.json();
}

export async function generateRefresherAPI(payload) {
  const token = await getSafeToken();
  const res = await fetch(`${BASE_URL}/users/generate-refresher`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleApiError(res, "Failed to generate refresher");
  return res.json();
}

export async function getNotificationsAPI() {
  const token = await getSafeToken();
  const res = await fetch(`${BASE_URL}/notifications`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) await handleApiError(res, "Failed to fetch notifications");
  return res.json();
}

export async function markNotificationReadAPI(id) {
  const token = await getSafeToken();
  const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) await handleApiError(res, "Failed to mark notification read");
  return res.json();
}

export async function markAllNotificationsReadAPI() {
  const token = await getSafeToken();
  const res = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) await handleApiError(res, "Failed to mark all notifications read");
  return res.json();
}

export async function triggerTestDigestAPI() {
  const token = await getSafeToken();
  const res = await fetch(`${BASE_URL}/notifications/trigger-digest`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) await handleApiError(res, "Failed to trigger test digest");
  return res.json();
}

export async function evaluateTeachBackAPI(payload) {
  const token = await getSafeToken();
  const res = await fetch(`${BASE_URL}/teachback/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleApiError(res, "Failed to evaluate teach-back");
  return res.json();
}
