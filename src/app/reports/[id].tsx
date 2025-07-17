import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

const MOCK_REPORTS = [
  { id: "1", date: "01/07/2025", entrada: "07:00", pausaMerenda: "08:30", saidaMerenda: "08:45", entradaAlmoco: "12:00", saidaAlmoco: "13:00", entradaMerenda: "15:30", saida: "17:00", status: "Aprovado", observacao: "" },
  { id: "2", date: "02/07/2025", entrada: "07:00", pausaMerenda: "08:30", saidaMerenda: "08:45", entradaAlmoco: "12:00", saidaAlmoco: "13:00", entradaMerenda: "15:30", saida: "17:00", status: "Aprovado", observacao: "" },
];

const { width } = Dimensions.get("window");

export default function ReportIndividualScreen() {
  const params = useLocalSearchParams();
  const name = params.name || "Funcionário";
  const [period, setPeriod] = useState("mes");

  const totalHoras = 160;
  const totalFaltas = 1;
  const totalAtrasos = 2;
  const totalJustificativas = 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.header}>{name}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.summaryRow}>
        <SummaryCard label="Horas" value={totalHoras} color="#4CAF50" icon="time-outline" />
        <SummaryCard label="Faltas" value={totalFaltas} color="#FF6B6B" icon="close-circle-outline" />
        <SummaryCard label="Atrasos" value={totalAtrasos} color="#F4C542" icon="alert-circle-outline" />
        <SummaryCard label="Justificativas" value={totalJustificativas} color="#F4C542" icon="document-text-outline" />
      </View>
      <View style={styles.filtersSection}>
        <Text style={styles.filterLabel}>Período:</Text>
        <View style={styles.filterRow}>
          <FilterBtn label="Hoje" active={period === "hoje"} onPress={() => setPeriod("hoje")} />
          <FilterBtn label="Semana" active={period === "semana"} onPress={() => setPeriod("semana")} />
          <FilterBtn label="Mês" active={period === "mes"} onPress={() => setPeriod("mes")} />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginHorizontal: 12, marginTop: 10 }} contentContainerStyle={{ minWidth: 1100, paddingBottom: 32 }}>
        <View style={styles.tableSection}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { minWidth: 100 }]}>Data</Text>
            <Text style={[styles.tableCell, { minWidth: 90 }]}>Entrada</Text>
            <Text style={[styles.tableCell, { minWidth: 110 }]}>Merenda</Text>
            <Text style={[styles.tableCell, { minWidth: 110 }]}>Saída</Text>
            <Text style={[styles.tableCell, { minWidth: 110 }]}>Almoço</Text>
            <Text style={[styles.tableCell, { minWidth: 110 }]}>Saída</Text>
            <Text style={[styles.tableCell, { minWidth: 110 }]}>Merenda</Text>
            <Text style={[styles.tableCell, { minWidth: 90 }]}>Saída</Text>
            <Text style={[styles.tableCell, { minWidth: 110 }]}>Status</Text>
            <Text style={[styles.tableCell, { minWidth: 180 }]}>Observação</Text>
          </View>
          {MOCK_REPORTS.map((r, idx) => (
            <View key={r.id} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, { minWidth: 100 }]}>{r.date}</Text>
              <Text style={[styles.tableCell, { minWidth: 90 }]}>{r.entrada}</Text>
              <Text style={[styles.tableCell, { minWidth: 110 }]}>{r.pausaMerenda || '-'}</Text>
              <Text style={[styles.tableCell, { minWidth: 110 }]}>{r.saidaMerenda || '-'}</Text>
              <Text style={[styles.tableCell, { minWidth: 110 }]}>{r.entradaAlmoco || '-'}</Text>
              <Text style={[styles.tableCell, { minWidth: 110 }]}>{r.saidaAlmoco || '-'}</Text>
              <Text style={[styles.tableCell, { minWidth: 110 }]}>{r.entradaMerenda || '-'}</Text>
              <Text style={[styles.tableCell, { minWidth: 90 }]}>{r.saida || '-'}</Text>
              <Text style={[styles.tableCell, { minWidth: 110 }]}><StatusBadge status={r.status} /></Text>
              <Text style={[styles.tableCell, { minWidth: 180 }]} numberOfLines={1} ellipsizeMode="tail">{r.observacao || '-'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.downloadSection}>
        <DownloadBtn label="PDF" icon="document-outline" color="#F4C542" onPress={() => {}} />
        <DownloadBtn label="Excel" icon="logo-microsoft" color="#4CAF50" onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

type SummaryCardProps = { label: string; value: number; color: string; icon: any };
function SummaryCard({ label, value, color, icon }: SummaryCardProps) {
  return (
    <View style={[styles.summaryCard, { borderColor: color }]}> 
      <Ionicons name={icon} size={22} color={color} style={{ marginBottom: 4 }} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}
type FilterBtnProps = { label: string; active: boolean; onPress: () => void };
function FilterBtn({ label, active, onPress }: FilterBtnProps) {
  return (
    <TouchableOpacity
      style={[styles.filterBtn, active && styles.filterBtnActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
type DownloadBtnProps = { label: string; color: string; icon: any; onPress: () => void };
function DownloadBtn({ label, color, icon, onPress }: DownloadBtnProps) {
  return (
    <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.85}>
      {icon && <Ionicons name={icon} size={20} color="#0A1F44" style={{ marginRight: 8 }} />}
      <Text style={styles.downloadBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

type StatusBadgeProps = { status: string };
function StatusBadge({ status }: StatusBadgeProps) {
  let color = '#B0B3C7';
  let bg = '#222B44';
  let label = status;
  if (status === 'Aprovado') { color = '#fff'; bg = '#4CAF50'; label = 'Aprovado'; }
  else if (status === 'Atraso') { color = '#fff'; bg = '#F4C542'; label = 'Atraso'; }
  else if (status === 'Falta') { color = '#fff'; bg = '#FF6B6B'; label = 'Falta'; }
  else if (status === 'Pendente') { color = '#0A1F44'; bg = '#F4C542'; label = 'Pendente'; }
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}> 
      <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A1F44",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 10,
  },
  header: {
    color: "#F4C542",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    marginTop: 2,
    justifyContent: "center",
  },
  summaryCard: {
    borderWidth: 2,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    minWidth: 70,
    marginHorizontal: 2,
    backgroundColor: "#142850",
  },
  summaryValue: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 2,
  },
  summaryLabel: {
    color: "#B0B3C7",
    fontSize: 13,
    textAlign: "center",
  },
  filtersSection: {
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    marginHorizontal: 12,
  },
  filterLabel: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 4,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  filterBtnActive: {
    backgroundColor: "#F4C542",
    borderColor: "#F4C542",
  },
  filterBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  filterBtnTextActive: {
    color: "#0A1F44",
  },
  tableSection: {
    marginHorizontal: 12,
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#F4C542",
    paddingBottom: 8,
    marginBottom: 8,
    backgroundColor: "#142850",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2A4F",
    minHeight: 48,
  },
  tableRowAlt: {
    backgroundColor: "#1A2A4F",
  },
  tableCell: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
    minWidth: 70,
  },
  downloadSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginVertical: 16,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  downloadBtnText: {
    color: "#0A1F44",
    fontWeight: "bold",
    fontSize: 16,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#142850",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#F4C542",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "absolute",
    left: width / 2 - 90,
    bottom: 32,
  },
  helpButtonText: {
    color: "#F4C542",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  helpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 18,
  },
  helpBtnText: {
    color: "#F4C542",
    fontSize: 15,
    marginLeft: 6,
    fontWeight: "bold",
  },
  backBtn: {
    padding: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    alignSelf: 'center',
  },
  statusBadgeText: {
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
}); 