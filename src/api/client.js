const API_URL = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("token");
}

function clearAuthAndRedirectToLogin(expired = false) {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  const q = expired ? "?expired=1" : "";
  window.location.href = `/login${q}`;
}

export async function api(method, path, body, options = {}) {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    ...(body != null && { body: JSON.stringify(body) }),
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      console.error("[client] 401 on:", path);
      if (!options.skipAuthRedirect) {
        clearAuthAndRedirectToLogin(true);
      }
      const err = new Error(data.error || "Session expired");
      err.status = 401;
      throw err;
    }
    if (res.status === 403) {
      clearAuthAndRedirectToLogin();
      const err = new Error(data.error || "Forbidden");
      err.status = 403;
      err.data = data;
      throw err;
    }
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const get  = (path) => api("GET",    path);
export const post = (path, body) => api("POST",   path, body);
export const put  = (path, body) => api("PUT",    path, body);
export const del  = (path) => api("DELETE", path);
