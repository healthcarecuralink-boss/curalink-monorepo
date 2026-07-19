import { useMemo, useState } from "react";
import { router } from "expo-router";
import { Phone } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { fetchFamilyMembers, getErrorMessage, updatePhoneNumber, useSessionStore } from "@curalink/api-client";
import { Button, TextField, curalinkFonts, useTheme } from "@curalink/ui";

// Shown once, right after a Google sign-in, if the profile has no phone on
// file yet -- optional (README/product call: phone is contact info here,
// not a second auth factor, so this never blocks access to the app).
export default function AddPhoneScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
          paddingHorizontal: 24,
          paddingTop: 100,
          alignItems: "center",
        },
        iconChip: {
          width: 60,
          height: 60,
          borderRadius: 20,
          backgroundColor: "#E9FBF3",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        },
        title: {
          fontFamily: curalinkFonts.heading,
          fontSize: 25,
          color: colors.ink,
          textAlign: "center",
        },
        subtitle: {
          fontSize: 14,
          color: colors.muted,
          marginTop: 8,
          textAlign: "center",
          paddingHorizontal: 8,
        },
        form: {
          alignSelf: "stretch",
          marginTop: 32,
          gap: 16,
        },
        error: {
          color: colors.error,
          fontSize: 12.5,
        },
        skip: {
          marginTop: 18,
          alignSelf: "center",
        },
        skipText: {
          fontSize: 13.5,
          color: colors.muted,
          fontWeight: "600",
        },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function proceed(userId: string) {
    const familyMembers = await fetchFamilyMembers(userId);
    router.replace(familyMembers.length > 0 ? "/(tabs)/home" : "/care-setup");
  }

  async function handleSave() {
    const userId = session?.user.id;
    if (!userId) return;
    setError(null);
    if (!phone.trim()) {
      setError("Enter your mobile number, or skip for now.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePhoneNumber(userId, phone);
      await proceed(userId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkip() {
    const userId = session?.user.id;
    if (!userId) return;
    void proceed(userId);
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconChip}>
        <Phone size={26} color={colors.navy} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Add your phone number</Text>
      <Text style={styles.subtitle}>
        So a nurse or doctor headed to your home can reach you. You can always add this later from your profile.
      </Text>

      <View style={styles.form}>
        <TextField
          label="Mobile number"
          placeholder="98480 12345"
          phonePrefix="+91"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={isSubmitting ? "Saving..." : "Save"} disabled={isSubmitting} onPress={() => void handleSave()} />
      </View>

      <Text style={styles.skip} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Text>
    </View>
  );
}
