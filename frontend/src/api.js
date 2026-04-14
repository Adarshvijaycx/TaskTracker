const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }

  // Local development backend
  if (window.location.hostname === "localhost") {
    return "http://localhost:4000/api";
  }

  // Vercel serverless API route
  return "/api";
};

const API_BASE = getApiBase();

const getAuthHeaders = () => {
  const token = localStorage.getItem("taskflow_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  let data = {};
  if (rawBody) {
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(rawBody);
      } catch {
        data = { message: "Received invalid JSON from server." };
      }
    } else {
      data = { message: rawBody };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
};

export const authApi = {
  register: (payload) => request("/user/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/user/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/user/me", { headers: getAuthHeaders() }),
  updateProfile: (payload) => request("/user/profile", { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(payload) }),
  updatePassword: (payload) => request("/user/password", { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(payload) }),
};

export const taskApi = {
  list: () => request("/tasks", { headers: getAuthHeaders() }),
  progress: () => request("/tasks/gp", { headers: getAuthHeaders() }),
  create: (payload) => request("/tasks", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload) }),
  update: (id, payload) =>
    request(`/tasks/${id}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(payload) }),
  remove: (id) => request(`/tasks/${id}`, { method: "DELETE", headers: getAuthHeaders() }),
};
