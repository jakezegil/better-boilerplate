import type { FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth as getAuthFromFirebase,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";

let initialized = false;

/**
 * Here we override firebase's native getAuth. The native getAuth function has a `browserPopupRedirectResolver` dependency, which causes
 * a large iframe to load in on the initial fetch on mobile devices. This is a huge performance sink for mobile.
 *
 * Here we explicitly list dependencies on initialization.
 *
 * Assumptions:
 * 1. we don't initialize more than one firebase app
 * 2. we dont need `signInWithPopup` or `signInWithRedirect`
 *
 * If we want to use either of these at some point, instead of reintroducing the mobile iframe, pass in the dependency `browserPopupRedirectResolver`
 * when you call the function.
 *
 * ex. const result = await signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver);
 */
export const getAuth = async (app?: FirebaseApp) => {
  const initialize = async () => {
    const currentApp = await (async () => {
      if (app) return Promise.resolve(app);
      const App = await import("firebase/app");
      return App.getApp();
    })();

    if (!initialized) {
      initialized = true;

      return initializeAuth(currentApp, {
        persistence: [
          indexedDBLocalPersistence,
          browserLocalPersistence,
          browserSessionPersistence,
        ],
      });
    }

    return getAuthFromFirebase(currentApp);
  };

  if (typeof window !== undefined) {
    return initialize();
  }

  /** Auth should only be accessed in a browser context */
  console.error("Error: authentication accessed in a non-browser context!");
  return initialize();
};
