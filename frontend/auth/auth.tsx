import type { Auth } from "firebase/auth";
import { PropsWithChildren, useEffect, useState } from "react";

import { AuthProvider, FirebaseAppProvider } from "@fe/auth/context";
import { getAuth } from "@fe/auth/utils";

interface FirebaseConfig {
  apiKey: string;
  appId: string;
  authDomain: string;
  messagingSenderId: string;
  projectId: string;
  storageBucket: string;
}

const firebaseConfigJson: string | undefined =
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
if (!firebaseConfigJson) {
  throw Error(
    "Cannot load firebase config - NEXT_PUBLIC_FIREBASE_CONFIG missing.",
  );
}

const WrappedAuthProvider: React.FunctionComponent<PropsWithChildren> = ({ children }) => {
  const [SDK, setSDK] = useState<Auth | null>(null);
  useEffect(() => {
    (async () => {
      const auth = await getAuth();
      setSDK(auth);
    })();
  });
  if (SDK == null) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  return <AuthProvider sdk={SDK}>{children}</AuthProvider>;
};

const firebaseConfig = JSON.parse(firebaseConfigJson) as FirebaseConfig;

/*
const AppProvider: React.FC = ({ children }) => (
  <FirebaseAppProvider firebaseConfig={firebaseConfig}>
    {children}
  </FirebaseAppProvider>
);
*/
const AppProvider: React.FC<PropsWithChildren> = ({ children }) => (
  <FirebaseAppProvider firebaseConfig={firebaseConfig}>
    <WrappedAuthProvider>{children}</WrappedAuthProvider>
  </FirebaseAppProvider>
);

export default AppProvider;
