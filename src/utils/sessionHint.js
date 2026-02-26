const SESSION_HINT_KEY = "learnify_has_session";

const hasWindow = () => typeof window !== "undefined";

export const hasSessionHint = () => {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(SESSION_HINT_KEY) === "1";
};

export const markSessionHint = () => {
  if (!hasWindow()) return;
  window.localStorage.setItem(SESSION_HINT_KEY, "1");
};

export const clearSessionHint = () => {
  if (!hasWindow()) return;
  window.localStorage.removeItem(SESSION_HINT_KEY);
};

