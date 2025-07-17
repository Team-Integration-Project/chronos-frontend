import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const SUPPORT_EMAIL = "mailto:suporte@chronos.com";
const WHATSAPP_LINK = "https://wa.me/5500000000000?text=Olá%20suporte%20Chronos";

const FAQ = [
  {
    q: "Como justifico um atraso?",
    a: "Selecione 'Atraso' na tela de justificativas, explique o motivo e envie.",
  },
  {
    q: "Posso anexar documentos?",
    a: "No momento, o envio de anexos é opcional e pode ser adicionado futuramente.",
  },
  {
    q: "Como entro em contato com o suporte?",
    a: "Use os botões abaixo para enviar um email ou falar no WhatsApp.",
  },
];

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="help-circle-outline" size={32} color="#F4C542" style={{ marginRight: 8 }} />
          <Text style={styles.headerText}>Ajuda & Suporte</Text>
        </View>
        <Text style={styles.subtitle}>Precisa de ajuda? Veja as opções abaixo:</Text>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Perguntas Frequentes</Text>
          {FAQ.map((item, idx) => (
            <View key={idx} style={styles.faqItem}>
              <Text style={styles.faqQ}>{item.q}</Text>
              <Text style={styles.faqA}>{item.a}</Text>
            </View>
          ))}
        </View>

        {/* Contato */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Fale com o suporte</Text>
          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(SUPPORT_EMAIL)}>
            <Ionicons name="mail-outline" size={22} color="#0A1F44" style={{ marginRight: 8 }} />
            <Text style={styles.contactBtnText}>Enviar Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(WHATSAPP_LINK)}>
            <Ionicons name="logo-whatsapp" size={22} color="#0A1F44" style={{ marginRight: 8 }} />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#F4C542" style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A1F44",
  },
  container: {
    padding: 24,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 10,
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
  faqSection: {
    width: "100%",
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 18,
    marginBottom: 28,
  },
  faqTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  faqItem: {
    marginBottom: 14,
  },
  faqQ: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  faqA: {
    color: "#B0B3C7",
    fontSize: 14,
    marginLeft: 6,
    marginTop: 2,
  },
  contactSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 32,
  },
  contactTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4C542",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  contactBtnText: {
    color: "#0A1F44",
    fontWeight: "bold",
    fontSize: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F4C542",
  },
  backBtnText: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 15,
  },
}); 