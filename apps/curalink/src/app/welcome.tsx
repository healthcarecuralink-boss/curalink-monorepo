import { useRef, useState, useMemo } from "react";
import { router } from "expo-router";
import { ArrowRight, HeartHandshake, House, ShieldCheck } from "lucide-react-native";
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, type ListRenderItem } from "react-native";
import { Button, curalinkFonts, useTheme } from "@curalink/ui";

const { width } = Dimensions.get("window");

interface Slide {
  key: string;
  title: string;
  body: string;
  Icon: typeof House;
  iconColor: string;
}

export default function WelcomeScreen() {
  const { colors } = useTheme();

  const slides: Slide[] = [
    {
      key: "home",
      title: "Care that comes home",
      body: "Qualified nurses, doctors and physios at your doorstep, anywhere in Hyderabad.",
      Icon: House,
      iconColor: colors.primary,
    },
    {
      key: "verified",
      title: "Verified, every single one",
      body: "Background-checked, licensed professionals — with reviews from families like yours.",
      Icon: ShieldCheck,
      iconColor: colors.navy2 ?? colors.ink2,
    },
    {
      key: "family",
      title: "For everyone you love",
      body: "Amma, Appa, the kids — even Simba. One app for the whole family's care.",
      Icon: HeartHandshake,
      iconColor: colors.primary,
    },
  ];
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    skip: {
      position: "absolute",
      top: 60,
      right: 20,
      zIndex: 1,
    },
    skipText: {
      fontSize: 13.5,
      fontWeight: "600",
      color: colors.muted,
    },
    list: {
      flex: 1,
      marginTop: 90,
    },
    slide: {
      alignItems: "center",
      paddingHorizontal: 32,
    },
    iconChip: {
      width: 88,
      height: 88,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    title: {
      fontFamily: curalinkFonts.heading,
      fontSize: 24,
      color: colors.ink,
      textAlign: "center",
      marginBottom: 12,
    },
    body: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 21,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 44,
      gap: 16,
      width: "100%",
    },
    dots: {
      flexDirection: "row",
      gap: 6,
      alignSelf: "center",
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      width: 22,
      backgroundColor: colors.primary,
    },
    loginLink: {
      fontSize: 13.5,
      fontWeight: "600",
      color: colors.muted,
      alignSelf: "center",
    },
        }),
      [colors],
    );
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const isLast = index === slides.length - 1;

  function goNext() {
    if (isLast) {
      router.push("/signup");
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconChip, { backgroundColor: "#E9FBF3" }]}>
        <item.Icon size={40} color={item.iconColor} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.skip} onPress={() => router.push("/login")}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={styles.list}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <View key={slide.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button
          label={isLast ? "Get started" : "Next"}
          onPress={goNext}
          icon={<ArrowRight size={18} color="#FFFFFF" />}
        />
        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.loginLink}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}
