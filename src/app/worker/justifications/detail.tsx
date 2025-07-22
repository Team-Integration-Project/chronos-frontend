import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

const TYPE_LABELS: Record<string, { title: string; icon: any }> = {
  atraso: { title: "Atraso", icon: "time-outline" },
  falta: { title: "Falta", icon: "close-circle-outline" },
  saida: { title: "Saída antecipada", icon: "exit-outline" },
  esquecimento: { title: "Esquecimento", icon: "alert-circle-outline" },
  outro: { title: "Outro", icon: "ellipsis-horizontal-circle-outline" },
};

export default function JustificationDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const typeInfo = TYPE_LABELS[type || "outro"] || TYPE_LABELS["outro"];

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, detalhe o motivo da justificativa.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      router.replace({ pathname: "/worker/justifications/confirmation", params: { type } });
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Ionicons name={typeInfo.icon} size={28} color="#F4C542" style={{ marginRight: 6 }} />
          <Text style={styles.headerText}>{typeInfo.title}</Text>
        </View>
        <Text style={styles.subtitle}>Descreva o motivo da sua justificativa:</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite aqui..."
          placeholderTextColor="#B0B3C7"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={5}
          editable={!submitting}
        />
        <TouchableOpacity
          style={[styles.submitBtn, { opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Ionicons name="send" size={20} color="#0A1F44" style={{ marginRight: 6 }} />
          <Text style={styles.submitBtnText}>{submitting ? "Enviando..." : "Enviar justificativa"}</Text>
        </TouchableOpacity>
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/help" as any)}> 
            <Ionicons name="help-circle-outline" size={24} color="#F4C542" />
            <Text style={styles.actionButtonText}>Ajuda</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A1F44",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 16,
  },
  headerText: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 22,
    letterSpacing: 1.2,
  },
  subtitle: {
    color: "#B0B3C7",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#142850",
    color: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 110,
    marginHorizontal: 18,
    marginBottom: 24,
    textAlignVertical: "top",
  },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: "#F4C542",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginHorizontal: 18,
    marginTop: 8,
  },
  submitBtnText: {
    color: "#0A1F44",
    fontWeight: "bold",
    fontSize: 16,
  },
  helpArea: {
    marginTop: 20,
    marginHorizontal: 18,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#142850",
    borderRadius: 12,
    alignItems: "center",
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpText: {
    color: "#B0B3C7",
    fontSize: 14,
    textAlign: "center",
  },
  helpLink: {
    color: "#F4C542",
    textDecorationLine: "underline",
  },
  actionsSection: {
    marginTop: 20,
    marginHorizontal: 18,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#142850",
    borderRadius: 12,
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#2A3D66",
  },
  actionButtonText: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
}); 