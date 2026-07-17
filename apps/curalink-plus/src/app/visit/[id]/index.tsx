import { useState, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Check } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchJobDetail, updateVisitFields, type Json } from "@curalink/api-client";
import { Button, TextField, curalinkPlusFonts, useTheme } from "@curalink/ui";

const tabs = ["Vitals", "Notes", "Medications", "Labs", "Photos"] as const;
type Tab = (typeof tabs)[number];

interface VitalsForm {
  bp: string;
  hr: string;
  temp: string;
  spo2: string;
  glucose: string;
}

export default function VisitInProgressScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
      () =>
        StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 60, paddingHorizontal: 20 },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 16, color: colors.ink },
    subtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
    tabScroll: { marginTop: 16, flexGrow: 0 },
    tabRow: { paddingHorizontal: 20, gap: 8 },
    tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { fontSize: 12.5, fontWeight: "700", color: colors.muted },
    tabTextActive: { color: "#FFFFFF" },
    body: { flex: 1, marginTop: 16 },
    bodyContent: { paddingHorizontal: 20, paddingBottom: 30, gap: 14 },
    medItem: { fontSize: 13, color: colors.ink },
    photoTile: {
      width: 140,
      height: 140,
      borderRadius: 16,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    photoTileText: { fontSize: 11, color: colors.muted, textAlign: "center", paddingHorizontal: 10 },
    photoNote: { fontSize: 11, color: colors.muted, textAlign: "center" },
    savedBanner: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" },
    savedText: { fontSize: 12, fontWeight: "600", color: colors.primary },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
    dietPlanButton: {},
        }),
      [colors],
    );
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("Vitals");
  const [savedTab, setSavedTab] = useState<Tab | null>(null);

  const { data: detail } = useQuery({
    queryKey: ["jobDetail", id],
    queryFn: () => fetchJobDetail(id),
    enabled: Boolean(id),
  });

  const [vitals, setVitals] = useState<VitalsForm>({ bp: "", hr: "", temp: "", spo2: "", glucose: "" });
  const [notes, setNotes] = useState("");
  const [medName, setMedName] = useState("");
  const [meds, setMeds] = useState<string[]>([]);
  const [labNote, setLabNote] = useState("");
  const [photosNoted, setPhotosNoted] = useState(0);

  async function saveVitals() {
    await updateVisitFields(id, { vitals: vitals as unknown as Json });
    setSavedTab("Vitals");
    void queryClient.invalidateQueries({ queryKey: ["jobDetail", id] });
  }

  async function saveNotes() {
    await updateVisitFields(id, { notes });
    setSavedTab("Notes");
  }

  async function saveMeds() {
    const nextMeds = medName.trim() ? [...meds, medName.trim()] : meds;
    setMeds(nextMeds);
    setMedName("");
    await updateVisitFields(id, { meds_given: nextMeds.map((name) => ({ name })) as unknown as Json });
    setSavedTab("Medications");
  }

  async function saveLabs() {
    await updateVisitFields(id, { lab_reports: [{ note: labNote }] as unknown as Json });
    setSavedTab("Labs");
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <View>
          <Text style={styles.title}>Visit in progress</Text>
          {detail?.patientName ? <Text style={styles.subtitle}>{detail.patientName}</Text> : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {tabs.map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {tab === "Vitals" ? (
          <View style={{ gap: 14 }}>
            <TextField label="Blood pressure" placeholder="120/80" value={vitals.bp} onChangeText={(v) => setVitals((s) => ({ ...s, bp: v }))} />
            <TextField label="Heart rate (bpm)" keyboardType="number-pad" value={vitals.hr} onChangeText={(v) => setVitals((s) => ({ ...s, hr: v }))} />
            <TextField label="Temperature (°F)" keyboardType="decimal-pad" value={vitals.temp} onChangeText={(v) => setVitals((s) => ({ ...s, temp: v }))} />
            <TextField label="SpO2 (%)" keyboardType="number-pad" value={vitals.spo2} onChangeText={(v) => setVitals((s) => ({ ...s, spo2: v }))} />
            <TextField label="Glucose (mg/dL)" keyboardType="number-pad" value={vitals.glucose} onChangeText={(v) => setVitals((s) => ({ ...s, glucose: v }))} />
            <Button label="Save vitals" onPress={() => void saveVitals()} />
          </View>
        ) : null}

        {tab === "Notes" ? (
          <View style={{ gap: 14 }}>
            <TextField label="Visit notes" placeholder="How the visit went..." multiline value={notes} onChangeText={setNotes} />
            <Button label="Save notes" onPress={() => void saveNotes()} />
          </View>
        ) : null}

        {tab === "Medications" ? (
          <View style={{ gap: 14 }}>
            <TextField label="Medication given" placeholder="e.g. Paracetamol 500mg" value={medName} onChangeText={setMedName} />
            <Button label="Add medication" onPress={() => void saveMeds()} />
            {meds.map((med, i) => (
              <Text key={i} style={styles.medItem}>
                • {med}
              </Text>
            ))}
          </View>
        ) : null}

        {tab === "Labs" ? (
          <View style={{ gap: 14 }}>
            <TextField label="Lab notes" placeholder="Samples collected, tests ordered..." multiline value={labNote} onChangeText={setLabNote} />
            <Button label="Save lab notes" onPress={() => void saveLabs()} />
          </View>
        ) : null}

        {tab === "Photos" ? (
          <View style={{ gap: 14, alignItems: "center" }}>
            <Pressable style={styles.photoTile} onPress={() => setPhotosNoted((n) => n + 1)}>
              <Camera size={24} color={colors.muted} strokeWidth={1.6} />
              <Text style={styles.photoTileText}>Tap to attach a photo</Text>
            </Pressable>
            <Text style={styles.photoNote}>
              {photosNoted} photo{photosNoted === 1 ? "" : "s"} noted (real camera-roll upload lands with the profile
              documents work)
            </Text>
          </View>
        ) : null}

        {savedTab === tab ? (
          <View style={styles.savedBanner}>
            <Check size={14} color={colors.primary} />
            <Text style={styles.savedText}>Saved</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {detail?.booking.patient_id ? (
          <Button
            label="Add diet plan"
            variant="secondary"
            style={styles.dietPlanButton}
            onPress={() =>
              router.push({ pathname: "/diet-plan-writer", params: { patientId: detail.booking.patient_id as string, bookingId: id } })
            }
          />
        ) : null}
        <Button label="Complete visit" onPress={() => router.push(`/visit/${id}/complete`)} />
      </View>
    </View>
  );
}
