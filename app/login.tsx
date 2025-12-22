import { biometricLogin } from '@/app/auth/biometricLogin';
import { emailLogin, emailSignUp } from '@/app/auth/emailLogin';
import { useGoogleLogin } from '@/app/auth/googleLogin';
import { VoiceButton } from '@/components/voice-button';
import { EyewayColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type LoginMethod = 'fingerprint' | 'google' | 'email';

export default function LoginScreen() {
  const { token, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { login: googleLogin, loading: googleLoading } = useGoogleLogin();

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Redirect to home if already authenticated
  if (!authLoading && token) {
    return <Redirect href="/(tabs)" />;
  }

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && enrolled);
    } catch (error) {
      setBiometricAvailable(false);
    }
  };

  const handleFingerprintLogin = async () => {
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await biometricLogin();
      // Success - the useAuth hook will detect the auth state change
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Fingerprint authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await googleLogin();
      // Success - the useAuth hook will detect the auth state change
    } catch (error: any) {
      console.error('Google login error:', error);
      let errorMessage = 'Google login failed';
      let errorTitle = 'Google Login Failed';
      
      if (error.message?.includes('cancelled')) {
        errorMessage = 'Google login was cancelled';
      } else if (error.message?.includes('operation-not-allowed')) {
        errorTitle = 'Google Sign-In Not Enabled';
        errorMessage = 'Google Sign-In is not enabled in Firebase Console.\n\nTo enable it:\n1. Go to Firebase Console\n2. Select your project\n3. Navigate to Authentication → Sign-in method\n4. Click on Google\n5. Enable it and add your OAuth client IDs\n6. Click Save';
      } else if (error.message?.includes('access denied') || error.message?.includes('access_denied')) {
        errorTitle = 'Access Denied';
        errorMessage = 'Google OAuth access denied. This usually means:\n\n1. Google Sign-In is not enabled in Firebase Console\n2. OAuth client IDs are not configured correctly\n3. Redirect URI is not authorized in Google Cloud Console\n\nPlease check your Firebase and Google Cloud Console settings.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password length validation
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Try to sign in
      const result = await emailLogin(email.trim(), password);
      // Success - the useAuth hook will detect the auth state change
    } catch (error: any) {
      console.error('Email login error:', error);
      let errorMessage = 'Email login failed';
      let errorTitle = 'Login Failed';
      
      // Handle Firebase Auth error codes
      if (error.code === 'auth/operation-not-allowed') {
        errorTitle = 'Authentication Not Enabled';
        errorMessage = 'Email/Password authentication is not enabled in Firebase Console.\n\nTo enable it:\n1. Go to Firebase Console\n2. Select your project\n3. Navigate to Authentication → Sign-in method\n4. Click on Email/Password\n5. Enable it and click Save';
        Alert.alert(errorTitle, errorMessage);
        return;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // User doesn't exist, try to create account
        try {
          await emailSignUp(email.trim(), password);
          Alert.alert('Welcome!', 'Your account has been created successfully.');
          return; // Success, exit early
        } catch (signUpError: any) {
          console.error('Sign up error:', signUpError);
          if (signUpError.code === 'auth/email-already-in-use') {
            errorMessage = 'An account with this email already exists. Please try signing in again.';
          } else if (signUpError.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters';
          } else if (signUpError.code === 'auth/operation-not-allowed') {
            errorTitle = 'Authentication Not Enabled';
            errorMessage = 'Email/Password authentication is not enabled in Firebase Console.\n\nTo enable it:\n1. Go to Firebase Console\n2. Select your project\n3. Navigate to Authentication → Sign-in method\n4. Click on Email/Password\n5. Enable it and click Save';
            Alert.alert(errorTitle, errorMessage);
            return;
          } else {
            errorMessage = signUpError.message || 'Failed to create account';
          }
          Alert.alert('Sign Up Failed', errorMessage);
          return;
        }
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `Error: ${error.code}. Please check Firebase Console settings.`;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <LinearGradient
        colors={[EyewayColors.backgroundStart, EyewayColors.backgroundEnd]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EyewayColors.accentBlue} />
          <Text style={styles.loadingText}>Signing in...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[EyewayColors.backgroundStart, EyewayColors.backgroundEnd]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Eyeway</Text>
            <View style={styles.voiceIcon}>
              <Ionicons name="mic" size={24} color={EyewayColors.textPrimary} />
            </View>
          </View>
          <Text style={styles.tagline}>Your voice-guided companion</Text>
          <Text style={styles.welcomeText}>Sign in to continue</Text>
        </View>

        {/* Login Options */}
        <View style={styles.content}>
          {loginMethod === 'email' ? (
            <View style={styles.emailForm}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={EyewayColors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={EyewayColors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setLoginMethod(null);
                    setEmail('');
                    setPassword('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <VoiceButton
                  title="Sign In"
                  onPress={handleEmailLogin}
                  variant="primary"
                  style={styles.emailButton}
                />
              </View>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              {biometricAvailable && (
                <View style={styles.buttonWithIcon}>
                  <Ionicons name="finger-print" size={24} color={EyewayColors.textPrimary} style={styles.icon} />
                  <VoiceButton
                    title="Fingerprint"
                    onPress={handleFingerprintLogin}
                    variant="primary"
                    style={styles.button}
                  />
                </View>
              )}

              <View style={styles.buttonWithIcon}>
                <Ionicons name="logo-google" size={24} color={EyewayColors.textPrimary} style={styles.icon} />
                <VoiceButton
                  title="Sign in with Google"
                  onPress={handleGoogleLogin}
                  variant="secondary"
                  style={styles.button}
                  disabled={googleLoading}
                />
              </View>

              <View style={styles.buttonWithIcon}>
                <Ionicons name="mail" size={24} color={EyewayColors.textPrimary} style={styles.icon} />
                <VoiceButton
                  title="Sign in with Email"
                  onPress={() => setLoginMethod('email')}
                  variant="secondary"
                  style={styles.button}
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: EyewayColors.textPrimary,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: EyewayColors.textPrimary,
    letterSpacing: 1,
  },
  voiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: EyewayColors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontSize: 16,
    color: EyewayColors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    color: EyewayColors.textPrimary,
    fontWeight: '600',
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    marginVertical: 4,
  },
  emailForm: {
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: EyewayColors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: EyewayColors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  emailButton: {
    flex: 2,
  },
  buttonWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    marginLeft: 8,
  },
});

