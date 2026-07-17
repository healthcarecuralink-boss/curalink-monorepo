import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Droplet, HeartHandshake } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import {
  createBloodRequest,
  fetchMyBloodRequests,
  fetchMyDonorProfile,
  fetchOpenBloodRequests,
  respondToBloodRequest,
  upsertDonorProfile,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, StatusPill, TextField, curalinkFonts, useTheme } from "@curalink/ui";

const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export default function DonateScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
        header: { flexDirection: "row", alignItems: "center", gap: 12 },
        backButton: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        title: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink },
        sectionTitle: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
        fieldLabel: { fontSize: 12.5, fontWeight: "600", color: colors.muted, marginBottom: 8 },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
        chipSelected: { backgroundColor: colors.errorTint, borderColor: colors.error },
        chipText: { fontSize: 12.5, fontWeight: "600", color: colors.muted },
        chipTextSelected: { color: colors.error },
        donorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        requestRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
        requestTitle: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        requestMeta: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const profileId = session?.user.id;
  const queryClient = useQueryClient();

  const [donorBloodGroup, setDonorBloodGroup] = useState<string | null>(null);
  const [donorCity, setDonorCity] = useState("");
  const [isSavingDonor, setIsSavingDonor] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [requestBloodGroup, setRequestBloodGroup] = useState<string | null>(null);
  const [units, setUnits] = useState("1");
  const [hospital, setHospital] = useState("");
  const [isPostingRequest, setIsPostingRequest] = useState(false);

  const { data: donorProfile } = useQuery({
    queryKey: ["myDonorProfile", profileId],
    queryFn: () => fetchMyDonorProfile(profileId as string),
    enabled: Boolean(profileId),
  });
  const { data: openRequests } = useQuery({
    queryKey: ["openBloodRequests"],
    queryFn: () => fetchOpenBloodRequests(),
  });
  const { data: myRequests } = useQuery({
    queryKey: ["myBloodRequests", profileId],
    queryFn: () => fetchMyBloodRequests(profileId as string),
    enabled: Boolean(profileId),
  });

  const isAvailable = donorProfile?.is_available ?? false;

  async function handleSaveDonor(group: string) {
    if (!profileId) return;
    setDonorBloodGroup(group);
    setIsSavingDonor(true);
    try {
      await upsertDonorProfile({ profile_id: profileId, blood_group: group, city: donorCity || null, is_available: true });
      void queryClient.invalidateQueries({ queryKey: ["myDonorProfile", profileId] });
    } finally {
      setIsSavingDonor(false);
    }
  }

  async function handleToggleAvailable() {
    if (!profileId || !donorProfile) return;
    await upsertDonorProfile({ profile_id: profileId, blood_group: donorProfile.blood_group, is_available: !isAvailable });
    void queryClient.invalidateQueries({ queryKey: ["myDonorProfile", profileId] });
  }

  async function handlePostRequest() {
    if (!profileId || !requestBloodGroup || !patientName.trim()) return;
    setIsPostingRequest(true);
    try {
      await createBloodRequest({
        requester_id: profileId,
        patient_name: patientName,
        blood_group: requestBloodGroup,
        units_needed: Number(units) || 1,
        hospital: hospital || null,
      });
      setPatientName("");
      setRequestBloodGroup(null);
      setUnits("1");
      setHospital("");
      setShowRequestForm(false);
      void queryClient.invalidateQueries({ queryKey: ["myBloodRequests", profileId] });
      void queryClient.invalidateQueries({ queryKey: ["openBloodRequests"] });
    } finally {
      setIsPostingRequest(false);
    }
  }

  async function handleRespond(requestId: string) {
    if (!profileId) return;
    await respondToBloodRequest(requestId, profileId);
    void queryClient.invalidateQueries({ queryKey: ["openBloodRequests"] });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Donate & blood requests</Text>
      </View>

      <Card style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>
          {donorProfile ? "You're registered as a donor" : "Register as a blood donor"}
        </Text>
        {donorProfile ? (
          <View style={styles.donorRow}>
            <Droplet size={18} color={colors.error} strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text style={styles.requestTitle}>{donorProfile.blood_group}</Text>
              <Text style={styles.requestMeta}>{isAvailable ? "Available to donate" : "Not available right now"}</Text>
            </View>
            <Switch value={isAvailable} onValueChange={() => void handleToggleAvailable()} trackColor={{ true: colors.error, false: colors.border }} />
          </View>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Blood group</Text>
            <View style={styles.chipRow}>
              {bloodGroups.map((group) => (
                <Pressable
                  key={group}
                  style={[styles.chip, donorBloodGroup === group && styles.chipSelected]}
                  disabled={isSavingDonor}
                  onPress={() => void handleSaveDonor(group)}
                >
                  <Text style={[styles.chipText, donorBloodGroup === group && styles.chipTextSelected]}>{group}</Text>
                </Pressable>
              ))}
            </View>
            <TextField label="City (optional)" value={donorCity} onChangeText={setDonorCity} />
          </>
        )}
      </Card>

      {!showRequestForm ? (
        <Button label="Post a blood request" icon={<HeartHandshake size={16} color="#FFFFFF" />} onPress={() => setShowRequestForm(true)} />
      ) : (
        <Card style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Post a request</Text>
          <TextField label="Patient name" value={patientName} onChangeText={setPatientName} />
          <Text style={styles.fieldLabel}>Blood group needed</Text>
          <View style={styles.chipRow}>
            {bloodGroups.map((group) => (
              <Pressable
                key={group}
                style={[styles.chip, requestBloodGroup === group && styles.chipSelected]}
                onPress={() => setRequestBloodGroup(group)}
              >
                <Text style={[styles.chipText, requestBloodGroup === group && styles.chipTextSelected]}>{group}</Text>
              </Pressable>
            ))}
          </View>
          <TextField label="Units needed" keyboardType="number-pad" value={units} onChangeText={setUnits} />
          <TextField label="Hospital" value={hospital} onChangeText={setHospital} />
          <Button
            label={isPostingRequest ? "Posting..." : "Post request"}
            disabled={!requestBloodGroup || !patientName.trim() || isPostingRequest}
            onPress={() => void handlePostRequest()}
          />
        </Card>
      )}

      {myRequests && myRequests.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Your requests</Text>
          <View style={{ gap: 8 }}>
            {myRequests.map((request) => (
              <Card key={request.id} style={styles.requestRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestTitle}>
                    {request.patient_name} · {request.blood_group}
                  </Text>
                  <Text style={styles.requestMeta}>
                    {request.units_needed} unit{request.units_needed === 1 ? "" : "s"} · {request.hospital ?? "No hospital specified"}
                  </Text>
                </View>
                <StatusPill
                  label={request.status}
                  fg={request.status === "open" ? colors.error : colors.muted}
                  bg={request.status === "open" ? (colors.errorTint ?? colors.border) : colors.border}
                />
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Open requests near you</Text>
      {openRequests === undefined ? (
        <Skeleton height={80} borderRadius={16} />
      ) : openRequests.length === 0 ? (
        <EmptyState icon={<Droplet size={26} color={colors.error} strokeWidth={1.6} />} title="No open requests right now" />
      ) : (
        <View style={{ gap: 8 }}>
          {openRequests.map((request) => (
            <Card key={request.id} style={styles.requestRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.requestTitle}>
                  {request.blood_group} · {request.units_needed} unit{request.units_needed === 1 ? "" : "s"}
                </Text>
                <Text style={styles.requestMeta}>
                  {request.hospital ?? "Hospital not specified"} · {request.urgency}
                </Text>
              </View>
              {request.requester_id !== profileId ? (
                <Button label="I can help" variant="secondary" onPress={() => void handleRespond(request.id)} />
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
