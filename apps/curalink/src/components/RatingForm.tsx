import { useMemo, useState } from "react";
import { Star } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, TextField, curalinkFonts, useTheme } from "@curalink/ui";

export function RatingForm({ onSubmit }: { onSubmit: (rating: number, review: string) => Promise<void> }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: { gap: 12 },
        title: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
        stars: { flexDirection: "row", gap: 6 },
      }),
    [colors],
  );
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(rating, review);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Rate your experience</Text>
      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Pressable key={i} onPress={() => setRating(i + 1)} hitSlop={6}>
            <Star size={26} color={colors.star} fill={i < rating ? colors.star : "transparent"} />
          </Pressable>
        ))}
      </View>
      <TextField placeholder="Write a review (optional)" value={review} onChangeText={setReview} multiline />
      <Button
        label={isSubmitting ? "Submitting..." : "Submit rating"}
        disabled={rating === 0 || isSubmitting}
        onPress={() => void handleSubmit()}
      />
    </Card>
  );
}
