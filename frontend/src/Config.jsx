// Production builds set VITE_API_BASE_URL to an empty string so the
// browser calls the same host Nginx is serving. Local dev falls back
// to the API on port 8001.
const configured = import.meta.env.VITE_API_BASE_URL;
export const BASE_URL =
  configured === undefined ? "http://127.0.0.1:8001" : configured;
