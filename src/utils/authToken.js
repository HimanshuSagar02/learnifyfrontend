import axios from "axios";

const TOKEN_STORAGE_KEY = "Learnify_auth_token";

const hasWindow = () => typeof window !== "undefined";
const isDev = typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);

const withSafeStorage = (fn, fallback = undefined) => {
  if (!hasWindow()) return fallback;
  try {
    return fn(window.localStorage);
  } catch (error) {
    if (isDev) {
      console.warn("[authToken] localStorage unavailable:", error?.message || error);
    }
    return fallback;
  }
};

const applyAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

export const getAuthToken = () =>
  withSafeStorage((storage) => String(storage.getItem(TOKEN_STORAGE_KEY) || "").trim(), "");

export const setAuthToken = (token) => {
  const normalized = String(token || "").trim();
  if (!normalized) {
    applyAuthHeader("");
    return;
  }

  withSafeStorage((storage) => storage.setItem(TOKEN_STORAGE_KEY, normalized));
  applyAuthHeader(normalized);
};

export const clearAuthToken = () => {
  withSafeStorage((storage) => storage.removeItem(TOKEN_STORAGE_KEY));
  applyAuthHeader("");
};

export const initializeAuthToken = () => {
  const token = getAuthToken();
  if (token) {
    applyAuthHeader(token);
  }
  return token;
};


