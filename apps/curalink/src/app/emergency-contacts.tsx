import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, Plus, Star, Trash2 } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  createEmergencyContact,
  deleteEmergencyContact,
  fetchEmergencyContacts,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, EmptyState, Skeleton, TextField, curalinkFonts, useTheme } from "@curalink/ui";


export default function EmergencyContactsScreen() {
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
    title: { fontFamily: curalinkFonts.heading, fontSize: 20, color: colors.ink, flex: 1 },
    addButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "#E9FBF3",
      alignItems: "center",
      justifyContent: "center",
    },
    contactRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    contactName: { fontFamily: curalinkFonts.headingSemibold, fontSize: 14, color: colors.ink },
    contactMeta: { fontSize: 11.5, color: colors.muted2, marginTop: 2 },
        }),
      [colors],
    );
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const { data: contacts } = useQuery({
    queryKey: ["emergencyContacts", userId],
    queryFn: () => fetchEmergencyContacts(userId as string),
    enabled: Boolean(userId),
  });

  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleAdd() {
    if (!userId || !fullName.trim() || !phone.trim()) return;
    setIsSaving(true);
    try {
      await createEmergencyContact({ owner_id: userId, full_name: fullName, relation: relation || "Contact", phone });
      void queryClient.invalidateQueries({ queryKey: ["emergencyContacts", userId] });
      setFullName("");
      setRelation("");
      setPhone("");
      setShowForm(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteEmergencyContact(id);
    void queryClient.invalidateQueries({ queryKey: ["emergencyContacts", userId] });
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
        <Text style={styles.title}>Emergency contacts</Text>
        <Pressable style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
          <Plus size={18} color={colors.primary} strokeWidth={2} />
        </Pressable>
      </View>

      {showForm ? (
        <Card style={{ gap: 12 }}>
          <TextField label="Full name" placeholder="Vaibhav Nair" value={fullName} onChangeText={setFullName} />
          <TextField label="Relation" placeholder="Brother" value={relation} onChangeText={setRelation} />
          <TextField label="Phone" placeholder="+91 98765 00001" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <Button label={isSaving ? "Saving..." : "Save contact"} disabled={isSaving} onPress={() => void handleAdd()} />
        </Card>
      ) : null}

      {contacts === undefined ? (
        <Skeleton height={70} borderRadius={16} />
      ) : contacts.length === 0 ? (
        <EmptyState icon={<Phone size={26} color={colors.primary} strokeWidth={1.6} />} title="No emergency contacts yet" />
      ) : (
        <View style={{ gap: 10 }}>
          {contacts.map((contact) => (
            <Card key={contact.id} style={styles.contactRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.contactName}>{contact.full_name}</Text>
                  {contact.is_primary ? <Star size={13} color={colors.star} fill={colors.star} /> : null}
                </View>
                <Text style={styles.contactMeta}>
                  {contact.relation} · {contact.phone}
                </Text>
              </View>
              <Pressable onPress={() => void handleDelete(contact.id)} hitSlop={8}>
                <Trash2 size={17} color={colors.muted} strokeWidth={1.8} />
              </Pressable>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
