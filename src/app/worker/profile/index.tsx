import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function WorkerProfileScreen() {
  const [user] = useState({
    name: "João Silva",
    email: "joao.silva@empresa.com",
    cpf: "123.456.789-00",
    phone: "(11) 99999-9999",
    function: "Terceirizado",
    company: "Empresa Terceirizada LTDA",
    startDate: "01/03/2024",
  });

  const handleLogout = () => {
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.header}>Meu Perfil</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Foto do usuário */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#F4C542" />
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userFunction}>{user.function}</Text>
        </View>

        {/* Informações pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#F4C542" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>E-mail</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={20} color="#F4C542" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>CPF</Text>
                <Text style={styles.infoValue}>{user.cpf}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#F4C542" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Informações profissionais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Profissionais</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#F4C542" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Empresa</Text>
                <Text style={styles.infoValue}>{user.company}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#F4C542" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Data de Início</Text>
                <Text style={styles.infoValue}>{user.startDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/help" as any)}>
            <Ionicons name="help-circle-outline" size={20} color="#F4C542" />
            <Text style={styles.actionButtonText}>Ajuda</Text>
            <Ionicons name="chevron-forward" size={20} color="#B0B3C7" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Info", "Versão 1.0.0")}>
            <Ionicons name="information-circle-outline" size={20} color="#F4C542" />
            <Text style={styles.actionButtonText}>Sobre o App</Text>
            <Ionicons name="chevron-forward" size={20} color="#B0B3C7" />
          </TouchableOpacity>
        </View>

        {/* Botão de logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { color: '#F44336' }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  profileSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userFunction: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    color: "#B0B3C7",
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
    flex: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#142850",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
  },
}); 