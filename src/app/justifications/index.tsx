import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const JUSTIFICATION_TYPES = [
  { id: "atraso", title: "Atraso", icon: "time-outline", description: "Cheguei atrasado(a)" },
  { id: "falta", title: "Falta", icon: "close-circle-outline", description: "Faltei ao trabalho" },
  { id: "saida", title: "Saída antecipada", icon: "exit-outline", description: "Saí mais cedo" },
  { id: "esquecimento", title: "Esquecimento", icon: "alert-circle-outline", description: "Esqueci de bater ponto" },
  { id: "outro", title: "Outro", icon: "ellipsis-horizontal-circle-outline", description: "Outro motivo" },
];

export default function JustificationTypeScreen() {
  const handleSelect = (type: typeof JUSTIFICATION_TYPES[0]) => {
    router.push({ pathname: "/justifications/detail", params: { type: type.id } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', left: 0, paddingLeft: 16, zIndex: 2 }}>
          <Ionicons name="arrow-back" size={28} color="#F4C542" />
        </TouchableOpacity>
        <Ionicons name="person-remove-outline" size={28} color="#F4C542" style={{ marginRight: 6 }} />
        <Text style={styles.headerText}>Justificativas</Text>
      </View>
      <Text style={styles.subtitle}>Selecione o motivo da sua justificativa:</Text>
      <FlatList
        data={JUSTIFICATION_TYPES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)} activeOpacity={0.85}>
            <Ionicons name={item.icon as any} size={28} color="#F4C542" style={styles.itemIcon} />
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#B0B3C7" />
          </TouchableOpacity>
        )}
      />
      {/* Ajuda Sênior */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/justifications/help")}> 
          <Ionicons name="help-circle-outline" size={24} color="#F4C542" />
          <Text style={styles.actionButtonText}>Ajuda</Text>
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
    marginBottom: 24,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  itemIcon: {
    marginRight: 16,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 2,
  },
  itemDesc: {
    color: "#B0B3C7",
    fontSize: 14,
  },
  helpArea: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  helpContainer: {
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  helpText: {
    color: "#B0B3C7",
    fontSize: 16,
    textAlign: "center",
  },
  helpLink: {
    color: "#F4C542",
    textDecorationLine: "underline",
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  actionButtonText: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 17,
    marginLeft: 10,
  },
}); 