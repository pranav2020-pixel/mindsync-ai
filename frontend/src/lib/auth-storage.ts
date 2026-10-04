import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "mindsync_access_token";
const REFRESH_TOKEN_KEY = "mindsync_refresh_token";

export const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const cookieVal = Cookies.get("accessToken");
  if (cookieVal) return cookieVal;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || null;
  } catch {
    return null;
  }
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const cookieVal = Cookies.get("refreshToken");
  if (cookieVal) return cookieVal;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
};

export const setStoredTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;
  const isHttps = window.location.protocol === "https:";

  const cookieOptions: Cookies.CookieAttributes = {
    path: "/",
    expires: 90, // Persist for 90 days (standard for modern mobile/PWA apps)
    sameSite: "lax",
    secure: isHttps,
  };

  try {
    Cookies.set("accessToken", accessToken, cookieOptions);
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } catch (e) {
    console.warn("[AuthStorage] Could not persist accessToken to storage:", e);
  }

  if (refreshToken) {
    try {
      Cookies.set("refreshToken", refreshToken, cookieOptions);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {
      console.warn("[AuthStorage] Could not persist refreshToken to storage:", e);
    }
  }
};

export const clearStoredTokens = () => {
  if (typeof window === "undefined") return;
  try {
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
  } catch (e) {
    console.warn("[AuthStorage] Could not clear cookies:", e);
  }

  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.warn("[AuthStorage] Could not clear localStorage:", e);
  }
};
