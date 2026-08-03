import { useState, useMemo } from "react";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { ArrowLeft, Beaker, FileCheck2 } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchFulfilledLabOrders, fetchPendingLabOrders, uploadLabReport } from "@curalink/api-client";
import { Card, EmptyState, Skeleton, curalinkPlusFonts, useTheme } from "@curalink/ui";

export default function LabOrdersScreen() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 60, gap: 16 },
        header: { flexDirection: "row", alignItems: "center", gap: 12 },
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
        title: { fontFamily: curalinkPlusFonts.heading, fontSize: 20, color: colors.ink },
        note: { fontSize: 12, color: colors.muted, lineHeight: 17 },
        sectionTitle: { fontFamily: curalinkPlusFonts.headingSemibold, fontSize: 14, color: colors.ink },
        orderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        orderTests: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
        orderMeta: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
        uploadButton: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
        },
        uploadButtonLabel: { fontSize: 11.5, fontWeight: "700", color: colors.primary },
        errorText: { fontSize: 11.5, color: colors.error, marginTop: 4 },
      }),
    [colors],
  );

  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  const { data: pending } = useQuery({
    queryKey: ["pendingLabOrders"],
    queryFn: fetchPendingLabOrders,
  });
  const { data: fulfilled } = useQuery({
    queryKey: ["fulfilledLabOrders"],
    queryFn: fetchFulfilledLabOrders,
  });

  async function handleUpload(labOrderId: string, consumerId: string) {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    setErrorById((prev) => ({ ...prev, [labOrderId]: "" }));
    setUploadingId(labOrderId);
    try {
      await uploadLabReport(labOrderId, consumerId, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      });
      void queryClient.invalidateQueries({ queryKey: ["pendingLabOrders"] });
      void queryClient.invalidateQueries({ queryKey: ["fulfilledLabOrders"] });
    } catch {
      setErrorById((prev) => ({ ...prev, [labOrderId]: "Upload failed. Check your connection and try again." }));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Lab orders</Text>
      </View>

      <Text style={styles.note}>
        Upload the report you received from your lab partner for each order below — the consumer sees it appear on
        their side as soon as you do.
      </Text>

      <Text style={styles.sectionTitle}>Needs a report</Text>
      {pending === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : pending.length === 0 ? (
        <EmptyState icon={<Beaker size={26} color={colors.primary} strokeWidth={1.6} />} title="No pending lab orders" />
      ) : (
        <View style={{ gap: 8 }}>
          {pending.map((order) => (
            <Card key={order.id} style={{ gap: 4 }}>
              <View style={styles.orderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTests}>{order.tests.join(", ")}</Text>
                  <Text style={styles.orderMeta}>{new Date(order.created_at).toLocaleString("en-IN")}</Text>
                </View>
                <Pressable
                  style={styles.uploadButton}
                  disabled={uploadingId === order.id}
                  onPress={() => void handleUpload(order.id, order.consumer_id)}
                >
                  {uploadingId === order.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <FileCheck2 size={14} color={colors.primary} strokeWidth={1.8} />
                  )}
                  <Text style={styles.uploadButtonLabel}>Upload report</Text>
                </Pressable>
              </View>
              {errorById[order.id] ? <Text style={styles.errorText}>{errorById[order.id]}</Text> : null}
            </Card>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Recently fulfilled</Text>
      {fulfilled === undefined ? (
        <Skeleton height={70} borderRadius={13} />
      ) : fulfilled.length === 0 ? (
        <EmptyState icon={<FileCheck2 size={26} color={colors.primary} strokeWidth={1.6} />} title="Nothing fulfilled yet" />
      ) : (
        <View style={{ gap: 8 }}>
          {fulfilled.map((order) => (
            <Card key={order.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTests}>{order.tests.join(", ")}</Text>
                <Text style={styles.orderMeta}>{new Date(order.created_at).toLocaleDateString("en-IN")}</Text>
              </View>
              <FileCheck2 size={18} color={colors.primary} strokeWidth={1.8} />
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
