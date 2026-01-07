const BASE_URL = "http://localhost:5000/api";

// Auth0 token getter (set from App.jsx)
let getTokenSilentlyFn = null;

export function setGetTokenSilently(fn) {
  getTokenSilentlyFn = fn;
}

/* ------------------ COURSE APIs ------------------ */

export async function generateCourseAPI(payload) {
  const token = getTokenSilentlyFn ? await getTokenSilentlyFn() : null;

  const res = await fetch(`${BASE_URL}/courses/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Course generation failed");
  }

  return res.json();
}

export async function getCourseByIdAPI(id) {
  const res = await fetch(`${BASE_URL}/courses/${id}`);

  if (!res.ok) {
    throw new Error("Failed to fetch course");
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
    throw new Error("Lesson generation failed");
  }

  return res.json();
}

export async function getFullCourseAPI(id) {
  const res = await fetch(`${BASE_URL}/courses/${id}/full`);
  if (!res.ok) throw new Error("Failed to fetch full course");
  return res.json();
}
