import { auth } from "@/app/config/firebase.config";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

// Ensures the authentication session is cleaned up on Android
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  // Use Expo proxy so Google sees an HTTPS redirect (no custom scheme needed in console)
  // This yields: https://auth.expo.io/@<user>/eyeway
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error useProxy is supported at runtime; type is behind
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true, scheme: "eyeway" });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "1020797990754-38eifc6pb33e2h6np24o13gnt2mjkvvv.apps.googleusercontent.com",
    webClientId: "1020797990754-38eifc6pb33e2h6np24o13gnt2mjkvvv.apps.googleusercontent.com",
    androidClientId: "1020797990754-lspubvo9heulim5ce287rioi136qo1bn.apps.googleusercontent.com",
    iosClientId: "1020797990754-9ph2emspif5hur5m7cu4841boj9rq62q.apps.googleusercontent.com",
    redirectUri,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error useProxy is supported at runtime
    useProxy: true,
  });

  const handleGoogleResponse = async () => {
    if (response?.type === "success") {
      const { idToken } = response.authentication!;
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    }
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error useProxy is supported at runtime; type is behind
  const signIn = () => promptAsync({ useProxy: true, redirectUri });

  return { promptAsync: signIn, handleGoogleResponse, request };
}
