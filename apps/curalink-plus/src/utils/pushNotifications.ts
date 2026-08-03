import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerPushToken } from "@curalink/api-client";

// Web push needs its own VAPID key setup (separate from FCM's server key,
// which is mobile-only) that hasn't been done -- skip cleanly there rather
// than crash. This project's primary dev/test environment is Expo web (see
// memory), so this guard matters in practice, not just in theory.
// Read-only check (no prompt) for whether push is already granted on this
// device -- lets the UI show accurate state on mount instead of assuming
// "off" every time the screen remounts, regardless of prior registration.
export async function isPushAlreadyEnabled(): Promise<boolean> {
  if (Platform.OS === "web" || !Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

export async function registerForPushNotificationsAsync(profileId: string): Promise<string | null> {
  if (Platform.OS === "web" || !Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  const platform = Platform.OS === "ios" ? "ios" : "android";
  await registerPushToken(profileId, token, platform);
  return token;
}
