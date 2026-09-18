import axios from "axios";

export function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

axios.interceptors.request.use(
  (config) => {
    const t = localStorage.getItem("token");
    if (t) {
      config.headers["Authorization"] = `Bearer ${t}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
