import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const MOCK_USERS = [
  { id: "1", name: "Maria Santos" },
  { id: "2", name: "Pedro Costa" },
  { id: "3", name: "Ana Oliveira" },
];

const { width } = Dimensions.get("window");

export default function ReportsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.header}>Relatório de Funcionários</Text>
        <View style={{ width: 32 }} />
      </View>
      <Text style={styles.subHeader}>Toque no olho para ver detalhes</Text>
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 32 }}>
        {MOCK_USERS.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum funcionário encontrado.</Text>
        ) : (
          MOCK_USERS.map(emp => (
            <TouchableOpacity
              key={emp.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/manager/reports/[id]", params: { id: emp.id, name: emp.name } })}
            >
              <Text style={styles.name}>{emp.name}</Text>
              <View style={styles.eyeBtn}>
                <Ionicons name="eye-outline" size={22} color="#0A1F44" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/help" as any)}>
        <Ionicons name="help-circle-outline" size={24} color="#F4C542" />
        <Text style={styles.actionButtonText}>Ajuda</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.exportBtn} onPress={() => {}} activeOpacity={0.85}>
        <Ionicons name="download-outline" size={22} color="#0A1F44" style={{ marginRight: 8 }} />
        <Text style={styles.exportBtnText}>Exportar todos para PDF</Text>
      </TouchableOpacity>
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
  subHeader: {
    color: "#B0B3C7",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#142850",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
  },
  eyeBtn: {
    backgroundColor: "#F4C542",
    borderRadius: 20,
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4C542",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    margin: 18,
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
  emptyText: {
    color: "#B0B3C7",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
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
    marginTop: 24,
    marginBottom: 8,
  },
  actionButtonText: {
    color: "#F4C542",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
}); 