import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react-native";
import { Animated, StyleSheet, Text } from "react-native";

export interface ToastProps {
  message: string;
  visible: boolean;
  bottomOffset?: number;
}

// Dark confirmation toast, 3s auto-dismiss per the design spec -- the
// screen owns the visible/setVisible timer, this component just renders +
// animates the transition.
export function Toast({ message, visible, bottomOffset = 104 }: ToastProps) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: visible ? 0 : 20, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [visible, translateY, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { bottom: bottomOffset, opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <CheckCircle2 size={16} color="#00E392" strokeWidth={2.4} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#0A1628",
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  message: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
