import axios from "axios";
import Cookies from "js-cookie";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
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
      try {
        const refreshToken = Cookies.get("refreshToken");
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken } = response.data.data;
        Cookies.set("accessToken", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        Cookies.remove("accessToken"); Cookies.remove("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
export default api;
