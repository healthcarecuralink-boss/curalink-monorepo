import { useMemo } from "react";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { EmptyState, curalinkPlusFonts, useTheme } from "@curalink/ui";


export function StubScreen({ title, icon, note }: { title: string; icon: ReactNode; note: string }) {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 110, gap: 16 },
    title: { fontFamily: curalinkPlusFonts.heading, fontSize: 22, color: colors.ink },
        }),
      [colors],
    );
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <EmptyState icon={icon} title="Coming soon" body={note} />
    </ScrollView>
  );
}
