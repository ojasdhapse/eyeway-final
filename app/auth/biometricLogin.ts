import * as LocalAuthentication from 'expo-local-authentication';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/app/config/firebase.config';

export async function biometricLogin() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) throw new Error('No biometric hardware');

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Login with fingerprint',
    fallbackLabel: 'Use device passcode',
  });

  if (!result.success) throw new Error('Fingerprint failed');

  // 🔑 Firebase anonymous user (persistent)
  if (auth.currentUser) return auth.currentUser;

  const cred = await signInAnonymously(auth);
  return cred.user;
}
