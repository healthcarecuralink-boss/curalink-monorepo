import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, FileDown } from "lucide-react-native";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  fetchMyTeam,
  fetchTeamAllBookings,
  fetchTeamPayoutRecords,
  fetchTeamRosterWithProfiles,
  useSessionStore,
} from "@curalink/api-client";
import { Button, Card, curalinkPlusFonts, useTheme } from "@curalink/ui";

const REPORTS = ["roster", "bookings", "payouts"] as const;
type ReportType = (typeof REPORTS)[number];

const REPORT_LABELS: Record<ReportType, string> = {
  roster: "Team roster",
  bookings: "Bookings",
  payouts: "Payouts",
};

function csvEscape(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export default function ReportsScreen() {
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
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
        chipSelected: { backgroundColor: "#E8F5F0", borderColor: colors.primary },
        chipText: { fontSize: 12, fontWeight: "600", color: colors.muted },
        chipTextSelected: { color: colors.primary },
        previewCard: { gap: 8 },
        previewText: { fontSize: 11, color: colors.ink, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) },
        copyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
        copiedText: { fontSize: 12, fontWeight: "600", color: colors.primary },
      }),
    [colors],
  );

  const session = useSessionStore((s) => s.session);
  const adminId = session?.user.id;
  const [reportType, setReportType] = useState<ReportType>("roster");
  const [copied, setCopied] = useState(false);

  const { data: team } = useQuery({
    queryKey: ["myTeam", adminId],
    queryFn: () => fetchMyTeam(adminId as string),
    enabled: Boolean(adminId),
  });
  const { data: roster } = useQuery({
    queryKey: ["teamRosterWithProfiles", team?.id],
    queryFn: () => fetchTeamRosterWithProfiles(team?.id as string),
    enabled: Boolean(team?.id),
  });

  const allIds = (roster ?? []).map((r) => r.member.professional_id);
  const bookingRoleIds = (roster ?? [])
    .filter((r) => r.member.role !== "pharmacy" && r.member.role !== "ambulance")
    .map((r) => r.member.professional_id);

  const { data: bookings } = useQuery({
    queryKey: ["teamAllBookings", team?.id],
    queryFn: () => fetchTeamAllBookings(bookingRoleIds),
    enabled: Boolean(team?.id) && roster !== undefined && reportType === "bookings",
  });
  const { data: payoutRecords } = useQuery({
    queryKey: ["teamPayoutRecords", team?.id],
    queryFn: () => fetchTeamPayoutRecords(allIds),
    enabled: Boolean(team?.id) && roster !== undefined && reportType === "payouts",
  });

  const csv = useMemo(() => {
    if (reportType === "roster") {
      const rows: (string | number | null)[][] = [["Name", "Role", "Status", "Docs verified", "Joined"]];
      for (const { member, profile } of roster ?? []) {
        rows.push([profile?.full_name ?? "—", member.role, member.status, member.docs_ok ? "Yes" : "No", new Date(member.joined_at).toLocaleDateString("en-IN")]);
      }
      return toCsv(rows);
    }
    if (reportType === "bookings") {
      const rows: (string | number | null)[][] = [["Booking ID", "Scheduled at", "Status", "Price", "Tip"]];
      for (const b of bookings ?? []) {
        rows.push([b.id, new Date(b.scheduled_at).toLocaleString("en-IN"), b.status, b.price, b.tip_amount]);
      }
      return toCsv(rows);
    }
    const rows: (string | number | null)[][] = [["Payout ID", "Amount", "Status", "Paid at"]];
    for (const p of payoutRecords ?? []) {
      rows.push([p.id, p.amount, p.status, p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-IN") : "—"]);
    }
    return toCsv(rows);
  }, [reportType, roster, bookings, payoutRecords]);

  function handleCopy() {
    const nav = (globalThis as { navigator?: { clipboard?: { writeText: (text: string) => Promise<void> } } }).navigator;
    if (Platform.OS === "web" && nav?.clipboard) {
      void nav.clipboard.writeText(csv).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  function handleDownload() {
    if (Platform.OS !== "web") return;
    interface WebAnchor {
      href: string;
      download: string;
      click: () => void;
    }
    const w = globalThis as unknown as {
      document?: { createElement: (tag: string) => WebAnchor };
      URL?: { createObjectURL: (b: unknown) => string };
      Blob?: new (parts: string[], options: { type: string }) => unknown;
    };
    if (!w.document || !w.URL || !w.Blob) return;
    const blob = new w.Blob([csv], { type: "text/csv" });
    const url = w.URL.createObjectURL(blob);
    const link = w.document.createElement("a");
    link.href = url;
    link.download = `curalink-${reportType}-report.csv`;
    link.click();
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
        <Text style={styles.title}>Reports export</Text>
      </View>

      <View style={styles.chipRow}>
        {REPORTS.map((type) => (
          <Pressable key={type} style={[styles.chip, reportType === type && styles.chipSelected]} onPress={() => setReportType(type)}>
            <Text style={[styles.chipText, reportType === type && styles.chipTextSelected]}>{REPORT_LABELS[type]}</Text>
          </Pressable>
        ))}
      </View>

      <Card style={styles.previewCard}>
        <Text style={styles.previewText}>{csv || "No data yet."}</Text>
      </Card>

      <View style={styles.copyRow}>
        {Platform.OS === "web" ? (
          <>
            <Button label="Download CSV" icon={<FileDown size={16} color="#FFFFFF" />} onPress={handleDownload} style={{ flex: 1 }} />
            <Button
              label={copied ? "Copied" : "Copy"}
              variant="secondary"
              icon={copied ? <Check size={16} color={colors.primary} /> : <Copy size={16} color={colors.ink} />}
              onPress={handleCopy}
              style={{ flex: 1 }}
            />
          </>
        ) : (
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Select and copy the text above to share this report — file download and clipboard copy are available on the web app.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
