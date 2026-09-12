import axios from "axios";
import Cookies from "js-cookie";
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // In browser context, always use relative path to route through the active origin
    return "/api/v1";
  }
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "/api/v1";
};

const API_URL = getBaseURL();

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) {
        Cookies.remove("accessToken", { path: "/" });
        Cookies.remove("refreshToken", { path: "/" });
        if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/register" && window.location.pathname !== "/forgot-password") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken } = response.data.data;
        Cookies.set("accessToken", accessToken, { path: "/", expires: 7 });
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        Cookies.remove("accessToken", { path: "/" });
        Cookies.remove("refreshToken", { path: "/" });
        if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
export default api;
