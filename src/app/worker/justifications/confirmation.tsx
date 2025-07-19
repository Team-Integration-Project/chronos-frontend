import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

const TYPE_LABELS: Record<string, { title: string; icon: any }> = {
  atraso: { title: "Atraso", icon: "time-outline" },
  falta: { title: "Falta", icon: "close-circle-outline" },
  saida: { title: "Saída antecipada", icon: "exit-outline" },
  esquecimento: { title: "Esquecimento", icon: "alert-circle-outline" },
  outro: { title: "Outro", icon: "ellipsis-horizontal-circle-outline" },
};

export default function JustificationConfirmationScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const typeInfo = TYPE_LABELS[type || "outro"] || TYPE_LABELS["outro"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.centered}>
        <Ionicons name="checkmark-circle-outline" size={64} color="#F4C542" style={{ marginBottom: 18 }} />
        <Text style={styles.title}>Justificativa enviada!</Text>
        <Text style={styles.desc}>
          Sua justificativa de <Text style={styles.bold}>{typeInfo.title}</Text> foi enviada com sucesso.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace("/worker/home")}
          activeOpacity={0.85}>
          <Ionicons name="home-outline" size={20} color="#0A1F44" style={{ marginRight: 6 }} />
          <Text style={styles.btnText}>Voltar para o início</Text>
        </TouchableOpacity>
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/help" as any)}> 
            <Ionicons name="help-circle-outline" size={24} color="#F4C542" />
            <Text style={styles.actionButtonText}>Ajuda</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A1F44",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 24,
    marginBottom: 10,
  },
  desc: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  bold: {
    fontWeight: "bold",
    color: "#F4C542",
  },
  btn: {
    flexDirection: "row",
    backgroundColor: "#F4C542",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  btnText: {
    color: "#0A1F44",
    fontWeight: "bold",
    fontSize: 16,
  },
  helpArea: {
    marginTop: 20,
    alignItems: "center",
  },
  helpContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#0A1F44",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F4C542",
  },
  helpText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  helpLink: {
    color: "#F4C542",
    textDecorationLine: "underline",
  },
  actionsSection: {
    marginTop: 20,
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A1F44",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#F4C542",
  },
  actionButtonText: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
}); 