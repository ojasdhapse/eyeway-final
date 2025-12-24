import { biometricLogin } from '@/app/auth/biometricLogin';
import { emailLogin, emailSignUp } from '@/app/auth/emailLogin';
import AppBackground from '@/components/app-background';
import { VoiceButton } from '@/components/voice-button';
import { EyewayColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { Redirect } from 'expo-router';
import * as Speech from 'expo-speech';
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
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');


  const speakInvalidCredentials = () => {
    Speech.stop();
    Speech.speak('Invalid credentials. Please try again.', {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const speakAccountExists = () => {
    Speech.stop();
    Speech.speak('An account with this email already exists. Please sign in.', {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const speakAccountNotFound = () => {
    Speech.stop();
    Speech.speak('Account not found. Please create an account first.', {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
    });
  };


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



  const handleEmailSubmit = async () => {
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
      if (emailMode === 'signin') {
        await emailLogin(email.trim(), password);
      } else {
        await emailSignUp(email.trim(), password);
        Alert.alert('Welcome!', 'Your account has been created. You can now sign in.');
        setEmailMode('signin');
      }
    } catch (error: any) {
      console.error('Email login error:', error);
      let errorMessage = emailMode === 'signin' ? 'Email login failed' : 'Sign up failed';
      let errorTitle = emailMode === 'signin' ? 'Login Failed' : 'Sign Up Failed';

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
      } else if (emailMode === 'signin' && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
        errorMessage = 'Account not found. Please create an account first.';
        speakAccountNotFound();
      } else if (emailMode === 'signup' && error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in.';
        speakAccountExists();
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
        speakInvalidCredentials();
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
      <AppBackground contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={EyewayColors.accentBlue} />
          <Text style={styles.loadingText}>Signing in...</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground contentContainerStyle={{ paddingTop: 20 }}>
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
          {/* <Text style={styles.welcomeText}>Sign in to continue</Text> */}
        </View>

        {/* Login Options */}
        <View style={styles.content}>
          {loginMethod === 'email' ? (
            <View style={styles.emailFormContainer}>
              <View style={styles.emailFormHeader}>
                <Text style={styles.formTitle}>
                  {emailMode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {emailMode === 'signin'
                    ? 'Welcome back! Sign in to continue'
                    : 'Join Eyeway to get started'}
                </Text>
              </View>

              <View style={styles.emailForm}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="mail-outline" size={20} color={EyewayColors.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={EyewayColors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={EyewayColors.textSecondary} />
                  </View>
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
                </View>

                <Text style={styles.passwordHint}>
                  Password must be at least 6 characters
                </Text>

                <View style={styles.actionColumn}>
                  <VoiceButton
                    title={emailMode === 'signin' ? 'Sign In' : 'Create Account'}
                    onPress={handleEmailSubmit}
                    variant="primary"
                    style={styles.submitButton}
                  />

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEmailMode(emailMode === 'signin' ? 'signup' : 'signin');
                    }}
                    accessibilityRole="button"
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>
                      {emailMode === 'signin'
                        ? "Don't have an account? "
                        : 'Already have an account? '}
                      <Text style={styles.linkTextBold}>
                        {emailMode === 'signin' ? 'Sign Up' : 'Sign In'}
                      </Text>
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLoginMethod(null);
                      setEmail('');
                      setPassword('');
                    }}
                    style={styles.backLink}
                  >
                    <Ionicons name="arrow-back" size={18} color={EyewayColors.textSecondary} />
                    <Text style={styles.backLinkText}>Back to login options</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              {biometricAvailable && (
                <View style={styles.buttonCard}>
                  <View style={styles.buttonIconWrapper}>
                    <Ionicons name="finger-print" size={26} color={EyewayColors.accentBlue} />
                  </View>
                  <VoiceButton
                    title="Fingerprint"
                    onPress={handleFingerprintLogin}
                    variant="primary"
                    style={styles.button}
                  />
                </View>
              )}



              <View style={styles.buttonCard}>
                <View style={styles.buttonIconWrapper}>
                  <Ionicons name="mail" size={26} color={EyewayColors.accentBlue} />
                </View>
                <VoiceButton
                  title="Sign in with Email"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLoginMethod('email');
                  }}
                  variant="secondary"
                  style={styles.button}
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </AppBackground>
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
    marginTop: 20,
    marginBottom: 100,
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
    paddingBottom: 120,
  },
  buttonContainer: {
    gap: 20,
  },
  buttonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 4,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(91, 163, 245, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    marginVertical: 0,
  },
  emailFormContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emailFormHeader: {
    marginBottom: 28,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: EyewayColors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  formSubtitle: {
    fontSize: 15,
    color: EyewayColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailForm: {
    gap: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  inputIconContainer: {
    paddingLeft: 18,
    paddingRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingRight: 18,
    fontSize: 16,
    color: EyewayColors.textPrimary,
    fontWeight: '500',
  },
  actionColumn: {
    gap: 16,
    marginTop: 8,
  },
  submitButton: {
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    color: EyewayColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 16,
    letterSpacing: 0.5,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  linkText: {
    color: EyewayColors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  linkTextBold: {
    color: EyewayColors.accentBlue,
    fontWeight: '700',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 6,
    marginTop: 0,
  },
  backLinkText: {
    color: EyewayColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  passwordHint: {
    color: EyewayColors.textSecondary,
    fontSize: 13,
    marginTop: -4,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
});

