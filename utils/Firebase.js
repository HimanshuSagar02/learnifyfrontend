import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const isDev = Boolean(import.meta.env.DEV);

const readEnv = (key) => String(import.meta.env[key] || "").trim();

const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_APIKEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTHDOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECTID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGEBUCKET"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGINGSENDERID"),
  appId: readEnv("VITE_FIREBASE_APPID"),
  measurementId: readEnv("VITE_FIREBASE_MEASUREMENTID"),
};

const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);
const analyticsEnabled = readEnv("VITE_ENABLE_FIREBASE_ANALYTICS") === "true";

let app = null;
let auth = null;
let provider = null;
let analytics = null;

try {
  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase config keys: ${missingKeys.join(", ")}`);
  }

  if (!firebaseConfig.apiKey.startsWith("AIzaSy")) {
    throw new Error("Invalid Firebase API key format.");
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  // Analytics triggers Firebase Installations; keep it opt-in.
  if (typeof window !== "undefined" && analyticsEnabled && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  if (isDev) {
    console.error("[Firebase] Initialization error:", error);
  }

  app = null;
  auth = null;
  provider = null;
  analytics = null;
}

export { app, auth, provider, analytics };
