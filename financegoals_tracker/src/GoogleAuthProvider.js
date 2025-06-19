import React, { createContext, useContext, useState, useEffect } from "react";

const CLIENT_ID = "533987858905-v7lj69i6ctto8jioq7omiami9ks4nptb.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile openid email";
const API_DISCOVERY = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

/**
 * Loads the Google API client library and initializes it.
 * Returns a Promise that resolves when gapi is ready.
 */
function loadGapiClient() {
  return new Promise((resolve) => {
    if (window.gapi && window.gapi.auth2) {
      resolve();
      return;
    }
    // load script tag for gapi
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      window.gapi.load("client:auth2", () => {
        resolve();
      });
    };
    document.body.appendChild(script);
  });
}

/**
 * GoogleAuth Context:
 * Provides authentication state and sign-in/out utilities to the app
 */
const GoogleAuthContext = createContext();

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}

// PUBLIC_INTERFACE
export function GoogleAuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [gapiLoaded, setGapiLoaded] = useState(false);

  // Load gapi client & initialize
  useEffect(() => {
    async function init() {
      await loadGapiClient();
      await window.gapi.client.init({
        clientId: CLIENT_ID,
        discoveryDocs: [API_DISCOVERY],
        scope: SCOPES,
      });
      const authInstance = window.gapi.auth2.getAuthInstance();
      setAuth(authInstance);
      setGapiLoaded(true);
      // Set user if already signed in
      if (authInstance.isSignedIn.get()) {
        setUser(authInstance.currentUser.get().getBasicProfile());
      }
      // Listen to changes
      authInstance.isSignedIn.listen(signedIn => {
        if (signedIn) {
          setUser(authInstance.currentUser.get().getBasicProfile());
        } else {
          setUser(null);
        }
      });
    }
    init();
  }, []);

  // PUBLIC_INTERFACE
  const signIn = async () => {
    if (!auth) return;
    await auth.signIn();
    setUser(auth.currentUser.get().getBasicProfile());
  };

  // PUBLIC_INTERFACE
  const signOut = () => {
    if (!auth) return;
    auth.signOut();
    setUser(null);
  };

  const getAuthToken = () => {
    if (!auth) return "";
    const userObj = auth.currentUser.get();
    if (!userObj) return "";
    return userObj.getAuthResponse().access_token;
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        isSignedIn: !!user,
        user,
        signIn,
        signOut,
        gapiLoaded,
        getAuthToken,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}
