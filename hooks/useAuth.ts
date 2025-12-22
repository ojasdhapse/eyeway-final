import { auth } from '@/app/config/firebase.config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in, get the ID token
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          setUser(firebaseUser);
        } else {
          // User is signed out
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { token, loading, user };
}
