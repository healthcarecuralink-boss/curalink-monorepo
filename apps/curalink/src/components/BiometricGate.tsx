import { useEffect, useState, type ReactNode } from "react";
import { Fingerprint } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSessionStore } from "@curalink/api-client";
import { Button, curalinkFonts, useTheme } from "@curalink/ui";
import { authenticateWithBiometrics, isBiometricLockEnabled } from "../utils/biometricLock";

export function BiometricGate({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const session = useSessionStore((s) => s.session);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    void isBiometricLockEnabled().then(setLockEnabled);
  }, []);

  async function handleUnlock() {
    setIsUnlocking(true);
    try {
      const success = await authenticateWithBiometrics();
      if (success) setIsUnlocked(true);
    } finally {
      setIsUnlocking(false);
    }
  }

  const needsUnlock = Boolean(session) && lockEnabled && !isUnlocked;

  if (!needsUnlock) {
    return <>{children}</>;
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
    iconRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.chipNeutral, alignItems: "center", justifyContent: "center" },
    title: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink },
    body: { fontSize: 13, color: colors.muted2, textAlign: "center" },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconRing}>
        <Fingerprint size={40} color={colors.primary} strokeWidth={1.6} />
      </View>
      <Text style={styles.title}>CuraLink is locked</Text>
      <Text style={styles.body}>Unlock with your fingerprint or face to continue</Text>
      <Button label={isUnlocking ? "Unlocking..." : "Unlock"} disabled={isUnlocking} onPress={() => void handleUnlock()} />
    </View>
  );
}
