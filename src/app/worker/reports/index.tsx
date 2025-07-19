import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function WorkerReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState("mes");

  const periods = [
    { id: "dia", label: "Dia", icon: "calendar-outline" },
    { id: "mes", label: "Mês", icon: "calendar" },
    { id: "ano", label: "Ano", icon: "calendar-clear-outline" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.header}>Meu Relatório</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Filtros de período */}
        <View style={styles.periodFilter}>
          <Text style={styles.filterTitle}>Período:</Text>
          <View style={styles.periodButtons}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.id && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period.id)}
              >
                <Ionicons 
                  name={period.icon} 
                  size={16} 
                  color={selectedPeriod === period.id ? "#0A1F44" : "#F4C542"} 
                />
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period.id && styles.periodButtonTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Informações do Funcionário</Text>
          <Text style={styles.infoText}>Nome: João Silva</Text>
          <Text style={styles.infoText}>CPF: 123.456.789-00</Text>
          <Text style={styles.infoText}>Função: Terceirizado</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Estatísticas do Mês</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color="#F4C542" />
              <Text style={styles.statNumber}>22</Text>
              <Text style={styles.statLabel}>Dias Trabalhados</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>20</Text>
              <Text style={styles.statLabel}>Pontos Registrados</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="alert-circle-outline" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Justificativas</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>176</Text>
              <Text style={styles.statLabel}>Horas Trabalhadas</Text>
            </View>
          </View>
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.activityTitle}>Atividade Recente</Text>
          
          <View style={styles.activityItem}>
            <Ionicons name="time" size={16} color="#F4C542" />
            <Text style={styles.activityText}>Entrada: 08:00 - 15/12/2024</Text>
          </View>
          
          <View style={styles.activityItem}>
            <Ionicons name="time" size={16} color="#F4C542" />
            <Text style={styles.activityText}>Saída: 17:00 - 15/12/2024</Text>
          </View>
          
          <View style={styles.activityItem}>
            <Ionicons name="document-text" size={16} color="#FF9800" />
            <Text style={styles.activityText}>Justificativa enviada - 10/12/2024</Text>
          </View>
          
          <View style={styles.activityItem}>
            <Ionicons name="time" size={16} color="#F4C542" />
            <Text style={styles.activityText}>Entrada: 08:15 - 14/12/2024</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/help" as any)}>
          <Ionicons name="help-circle-outline" size={24} color="#F4C542" />
          <Text style={styles.actionButtonText}>Ajuda</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.exportBtn} onPress={() => {}} activeOpacity={0.85}>
          <Ionicons name="download-outline" size={22} color="#0A1F44" style={{ marginRight: 8 }} />
          <Text style={styles.exportBtnText}>Exportar Relatório</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 8,
  },
  header: {
    color: "#F4C542",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  periodFilter: {
    marginBottom: 20,
  },
  filterTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: "row",
    gap: 12,
  },
  periodButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#142850",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#1A2A4F",
    gap: 6,
  },
  periodButtonActive: {
    backgroundColor: "#F4C542",
    borderColor: "#F4C542",
  },
  periodButtonText: {
    color: "#F4C542",
    fontSize: 14,
    fontWeight: "600",
  },
  periodButtonTextActive: {
    color: "#0A1F44",
  },
  infoCard: {
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  infoTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  infoText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 6,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: "#B0B3C7",
    fontSize: 12,
    textAlign: "center",
  },
  recentActivity: {
    marginBottom: 20,
  },
  activityTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#142850",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  activityText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 12,
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  actionButton: {
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
    alignSelf: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#F4C542",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4C542",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  exportBtnText: {
    color: "#0A1F44",
    fontWeight: "bold",
    fontSize: 16,
  },
}); 