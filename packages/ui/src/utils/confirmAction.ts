import { Alert, Platform } from "react-native";

// Alert.alert is a native-only API -- react-native-web doesn't implement it,
// so a bare Alert.alert() call silently no-ops on the web build. Route
// through window.confirm there instead so destructive actions (sign out,
// delete) always get a real confirmation on every platform this app ships to.
export function confirmAction(options: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}): void {
  const { title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive = true, onConfirm } = options;

  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    const win = (globalThis as { confirm?: (message: string) => boolean }).confirm;
    if (!win || win(text)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel" },
    { text: confirmLabel, style: destructive ? "destructive" : "default", onPress: onConfirm },
  ]);
}
