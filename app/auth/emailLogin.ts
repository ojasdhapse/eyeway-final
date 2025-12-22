import { auth } from '@/app/config/firebase.config';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
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

