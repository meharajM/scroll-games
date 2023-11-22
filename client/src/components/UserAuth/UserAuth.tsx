import { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';


const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_APP_FIREBASE_MEASUREMENT_ID
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const analytics = firebase.analytics();

type AuthProps = {
  onLoginComplete: () => void;
}

const UserAuth = ({onLoginComplete}: AuthProps) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
      if (user) {
        firestore.collection('users').doc(user.uid).set({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          // Add your user data here
          globalScore: 0,
          gameSpecificScore: {},
          gamesPlayed: 0,
          gamesWon: 0,
          gamesInstalled: [],
        }, { merge: true });
        analytics.logEvent('user_logged_in');
        onLoginComplete();
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(() => {
        analytics.logEvent('sign_in_with_google');
      })
      .catch((error) => {
        console.error('Error signing in with Google', error);
      });
  };

  const signOut = () => {
    auth.signOut()
      .then(() => {
        analytics.logEvent('sign_out');
      })
      .catch((error) => {
        console.error('Error signing out', error);
      });
  };

  return (
    <div>
      {user ? (
        <button onClick={signOut}>
          Sign out
        </button>
      ) : (
        <button onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      )}
    </div>
  );
};

export default UserAuth;
