/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { FirebaseApp, FirebaseOptions } from "firebase/app";
import { getApps, initializeApp, registerVersion } from "firebase/app";
import type { Auth } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  version,
} from "react";

import { getAuth } from "@fe/auth/utils";

const AuthSdkContext = createContext<Auth | undefined>(undefined);
const FirebaseAppContext = createContext<FirebaseApp | undefined>(undefined);

// Right now (and probably forever) we only support the Firebase Auth SDK
type FirebaseSdks = Auth;

/**
 * @param SdkContext Take a (Firebase Auth) React Context
 * @returns (the Firebase Auth) Provider
 */
function getSdkProvider<Sdk extends FirebaseSdks>(
  SdkContext: React.Context<Sdk | undefined>,
) {
  return function SdkProvider(props: React.PropsWithChildren<{ sdk: Sdk }>) {
    const { sdk } = props;
    const [SDK, setSDK] = useState<Auth | undefined>(sdk);

    useEffect(() => {
      (async () => {
        const fbsdk = await getAuth();
        setSDK(fbsdk);
      })();
    }, []);

    if (!SDK) return null;

    return <SdkContext.Provider value={SDK as Sdk} {...props} />;
  };
}

/**
 * useAuth exposes the auth ref via context. This does not rerender when the auth
 * object is updated.
 */
export const AuthProvider = getSdkProvider<Auth>(AuthSdkContext);

/**
 * Another glorified useContext for our firebase App
 */
export function useFirebaseApp() {
  const firebaseApp = useContext(FirebaseAppContext);
  if (!firebaseApp) {
    throw new Error(
      "Cannot call useFirebaseApp unless your component is within a FirebaseAppProvider",
    );
  }

  return firebaseApp;
}

const shallowEq = <T extends Record<string, any>,>(a: T, b: T) =>
  a === b ||
  (a != null &&
    b != null &&
    typeof a === "object" &&
    typeof b === "object" &&
    [...Object.keys(a), ...Object.keys(b)].every((key) => a[key] === b[key]));

interface FirebaseAppProviderProps {
  firebaseApp?: FirebaseApp;
  firebaseConfig?: FirebaseOptions;
  appName?: string;
}

/**
 * This Provider just memoizes our firebase app.
 */
export function FirebaseAppProvider(
  props: React.PropsWithChildren<FirebaseAppProviderProps>,
) {
  const { firebaseConfig, appName } = props;

  const firebaseApp: FirebaseApp = useMemo(() => {
    const { firebaseApp: currentApp } = props;

    if (currentApp) {
      return currentApp;
    }

    const existingApp = getApps().find(
      (app) => app.name === (appName || "tenet"),
    );
    if (existingApp) {
      if (firebaseConfig && shallowEq(existingApp.options, firebaseConfig)) {
        return existingApp;
      }
      // Whoops?
      throw new Error(
        `Does not match the options already provided to the ${
          appName || "default"
        } firebase app instance, give this new instance a different appName.`,
      );
    }

    if (!firebaseConfig) {
      throw new Error("No firebaseConfig provided");
    }

    const reactVersion = version || "unknown";
    registerVersion("react", reactVersion);
    return initializeApp(firebaseConfig, appName);
  }, [props, firebaseConfig, appName]);

  return <FirebaseAppContext.Provider value={firebaseApp} {...props} />;
}
