import { auth } from '@/app/config/firebase.config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential
} from 'firebase/auth';

export interface EmailLoginResult {
  user: UserCredential['user'];
  isNewUser: boolean;
}

/**
 * Sign in with email and password
 * Note: This only signs in existing users. Use emailSignUp to create new accounts.
 */
export async function emailLogin(
  email: string, 
  password: string
): Promise<EmailLoginResult> {
  // If someone is already signed in, sign them out so we can login again cleanly.
  // This avoids "already signed in" sessions blocking a fresh email/password login.
  if (auth.currentUser) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Failed to sign out before email login:', err);
    }
  }
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return {
    user: userCred.user,
    isNewUser: false,
  };
}

/**
 * Sign up with email and password
 */
export async function emailSignUp(
  email: string, 
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

