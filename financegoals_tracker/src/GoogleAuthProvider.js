import React, { createContext, useContext, useState, useEffect } from "react";

const CLIENT_ID = "533987858905-v7lj69i6ctto8jioq7omiami9ks4nptb.apps.googleusercontent.com";
// NOTE: Ensure this CLIENT_ID matches exactly with the one configured in your Google Cloud Console > Credentials.
// Typos or use of wrong OAuth client will cause sign-in/auth errors.
// If you update this ID, update the Google Console (Web client) and check restrictions/redirect URIs match frontend deployment.

const SCOPES = [
  // calendar.events: Add/view events in Google Calendar
  "https://www.googleapis.com/auth/calendar.events",
  // userinfo.profile, openid, email: Standard user identity info
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
  "email"
].join(" ");
// Checklist:
//  - Do NOT add nonstandard or excess scopes (e.g., calendar.readonly, drive, etc. are not needed for this app)
//  - spelling and URLs must be exact as per Google documentation (see https://developers.google.com/identity/protocols/oauth2/scopes).
//  - see https://developers.google.com/identity/protocols/oauth2/scopes for options.

const API_DISCOVERY = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
// No hardcoded redirect_uri present in this code. The Google Auth2 client will, by default, use the app's own window.location.origin + "/".

// TIP for deploy: In Google Console, set all of the following as valid redirect URIs as per your use case:
//   - http://localhost:3000/
//   - http://localhost:5173/
//   - https://<your_production_domain>/

/**
 * Loads the Google API client library and initializes it.
 * Returns a Promise that resolves when gapi is ready.
 */
/**
 * Loads the gapi client *after* script tags present in HTML.
 * Waits for gapi global, then loads client:auth2.
 */
function loadGapiClient() {
  return new Promise((resolve) => {
    if (window.gapi && window.gapi.auth2) {
      resolve();
      return;
    }
    // Wait until gapi is available (script tag may not be loaded instantly)
    function waitForGapi() {
      if (window.gapi && window.gapi.load) {
        window.gapi.load("client:auth2", resolve);
      } else {
        setTimeout(waitForGapi, 50);
      }
    }
    waitForGapi();
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
    let isUnmounted = false;
    async function init() {
      try {
        await loadGapiClient();
        // Defensive: only initialize client if not already initialized
        if (!window.gapi.client || !window.gapi.client.init) {
          // Defensive check; possible gapi script loaded late
          setTimeout(init, 80);
          return;
        }
        await window.gapi.client.init({
          clientId: CLIENT_ID,
          discoveryDocs: [API_DISCOVERY],
          scope: SCOPES,
        });
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (isUnmounted) return;
        setAuth(authInstance);
        setGapiLoaded(true);
        // Set user if already signed in
        if (authInstance.isSignedIn.get()) {
          setUser(authInstance.currentUser.get().getBasicProfile());
        }
        // Listen to sign-in state changes
        authInstance.isSignedIn.listen(signedIn => {
          if (signedIn) {
            setUser(authInstance.currentUser.get().getBasicProfile());
          } else {
            setUser(null);
          }
        });
      } catch (err) {
        // Could log: initialization or client load failure
        setGapiLoaded(false);
        setAuth(null);
      }
    }
    init();
    return () => {
      isUnmounted = true;
    };
  }, []);

  // PUBLIC_INTERFACE
  const signIn = async () => {
    if (!auth) return;
    try {
      await auth.signIn();
      setUser(auth.currentUser.get().getBasicProfile());
    } catch (err) {
      // Optionally, alert or log error
    }
  };

  // PUBLIC_INTERFACE
  const signOut = () => {
    if (!auth) return;
    auth.signOut();
    setUser(null);
  };

  // PUBLIC_INTERFACE
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
