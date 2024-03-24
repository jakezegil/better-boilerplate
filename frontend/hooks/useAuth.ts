import { getAuth } from "@fe/auth/utils";
import type { Auth } from "firebase/auth";
import { useEffect, useState } from "react";

// This prevents the useEffect identify call from being triggered every single
// time a new component in the tree accesses auth via useAuth
let cachedIdx: string;

const useAuth = () => {
  const [auth, setAuth] = useState<Auth | null>(null);
  useEffect(() => {
    (async () => {
      if (auth == null) {
        const realAuth = await getAuth();
        setAuth(realAuth);
      }
    })();
  }, [auth, auth?.currentUser]);
  const authenticated = !!auth?.currentUser;
  const loading = false;

  const idx = auth?.currentUser?.email;

  useEffect(() => {
    if (idx && idx !== cachedIdx) {
      cachedIdx = idx;
    }
  }, [idx]);

  return {
    /**
     * The Firebase Auth instance
     */
    auth,
    /**
     * Indicates if the user is authenticated
     */
    authenticated,
    /**
     * The email associated with the authenticated user in Firebase.
     */
email: auth?.currentUser?.email,
    
    /**
     * Returns a JSON Web Token (JWT) used to identify the user to Firebase. If
     * the token is five minutes or less from expiry (or has already expired),
     * it will be refreshed a new one will be returned.
     */
getToken: async () => {
      if (!authenticated || !auth.currentUser) {
        // eslint-disable-next-line no-console
        console.warn("Attempted to get token while unauthenticated");

        return null;
      }

      return auth.currentUser?.getIdToken();
    },
    
loading,
    
    logIn: async ({ email, password }: { email: string; password: string }) => {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      return signInWithEmailAndPassword(auth!, email, password);
    },
    /**
     * Logs out the authenticated user, and redirect them to the home page.
     */
logOut: async () => {
      if (typeof window !== "undefined") {
        window.sessionStorage.clear();
      }
      await auth?.signOut();
    },
    
    register: async (email: string, password: string) => {
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      return createUserWithEmailAndPassword(auth!, email, password);
    },
  };
};

export default useAuth;
