const SESSION_HINT_KEY = "learnify_has_session";

const hasWindow = () => typeof window !== "undefined";
const isDev = typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);

const withSafeStorage = (fn, fallback = undefined) => {
  if (!hasWindow()) return fallback;
  try {
    return fn(window.localStorage);
  } catch (error) {
    if (isDev) {
      // localStorage can throw in strict privacy/browser settings
      console.warn("[sessionHint] localStorage unavailable:", error?.message || error);
    }
    return fallback;
  }
};

export const hasSessionHint = () => {
  return withSafeStorage((storage) => storage.getItem(SESSION_HINT_KEY) === "1", false);
};

export const markSessionHint = () => {
  withSafeStorage((storage) => storage.setItem(SESSION_HINT_KEY, "1"));
};

export const clearSessionHint = () => {
  withSafeStorage((storage) => storage.removeItem(SESSION_HINT_KEY));
};
