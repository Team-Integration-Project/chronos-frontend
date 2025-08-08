import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../services/api";

const formatCPF = (cpf: string) => {
  if (!cpf) return "";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length > 11) return cleaned.slice(0, 11);
  return cleaned
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatPhoneNumber = (phone: string) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length > 11) return cleaned.slice(0, 11);
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return cleaned
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const unformat = (value: string) => value.replace(/\D/g, "");

export default function WorkerProfileScreen() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    cpf: "",
    phone_number: "",
    role: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ phone_number: "", cpf: "" });
  const [displayData, setDisplayData] = useState({ phone_number: "", cpf: "" });
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/profile/");
      const userData = response.data;
      const rawCpf = userData.cpf || "";
      const rawPhone = userData.phone_number || "";
      setUser({
        name: userData.username || "Não informado",
        email: userData.email || "Não informado",
        cpf: rawCpf || "Não informado",
        phone_number: rawPhone || "Não informado",
        role: userData.role === "admin" ? "Administrador" : "Tercerizado",
      });
      setFormData({
        cpf: rawCpf,
        phone_number: rawPhone,
      });
      setDisplayData({
        cpf: formatCPF(rawCpf),
        phone_number: formatPhoneNumber(rawPhone),
      });
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil. Verifique sua conexão ou tente novamente.");
      setLoading(false);
    }
  };

  const validateForm = () => {
    const cleanedCpf = unformat(formData.cpf);
    const cleanedPhone = unformat(formData.phone_number);

    if (cleanedCpf && !/^\d{11}$/.test(cleanedCpf)) {
      Alert.alert("Erro", "CPF deve conter 11 dígitos numéricos.");
      return false;
    }
    if (cleanedPhone && !/^\d{10,11}$/.test(cleanedPhone)) {
      Alert.alert("Erro", "Telefone deve conter 10 ou 11 dígitos numéricos.");
      return false;
    }
    return true;
  };

  const updateProfile = async () => {
    if (!validateForm()) return;

    try {
      const cleanedFormData = {
        cpf: unformat(formData.cpf),
        phone_number: unformat(formData.phone_number),
      };
      const response = await api.put("/profile/", cleanedFormData);
      const userData = response.data;
      const rawCpf = userData.cpf || "";
      const rawPhone = userData.phone_number || "";
      setUser({
        ...user,
        cpf: rawCpf || "Não informado",
        phone_number: rawPhone || "Não informado",
      });
      setFormData({
        cpf: rawCpf,
        phone_number: rawPhone,
      });
      setDisplayData({
        cpf: formatCPF(rawCpf),
        phone_number: formatPhoneNumber(rawPhone),
      });
      setEditMode(false);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert("Erro", "Não foi possível atualizar o perfil. Tente novamente.");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("accessToken");
      router.replace("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Alert.alert("Erro", "Não foi possível realizar o logout.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.header}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.header}>Meu Perfil</Text>
        <TouchableOpacity onPress={() => {
          setEditMode(!editMode);
          if (!editMode) {
            setDisplayData({
              cpf: formatCPF(formData.cpf),
              phone_number: formatPhoneNumber(formData.phone_number),
            });
          }
        }}>
          <Ionicons name={editMode ? "close" : "pencil"} size={24} color="#F4C542" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#F4C542" />
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userFunction}>{user.role}</Text>
        </View>

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
                {editMode ? (
                  <TextInput
                    style={styles.input}
                    value={displayData.cpf}
                    onChangeText={(text) => {
                      const cleaned = unformat(text);
                      setFormData({ ...formData, cpf: cleaned });
                      setDisplayData({ ...displayData, cpf: formatCPF(cleaned) });
                    }}
                    placeholder="Digite seu CPF"
                    keyboardType="numeric"
                    maxLength={14} 
                  />
                ) : (
                  <Text style={styles.infoValue}>{formatCPF(user.cpf)}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#F4C542" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefone</Text>
                {editMode ? (
                  <TextInput
                    style={styles.input}
                    value={displayData.phone_number}
                    onChangeText={(text) => {
                      const cleaned = unformat(text);
                      setFormData({ ...formData, phone_number: cleaned });
                      setDisplayData({ ...displayData, phone_number: formatPhoneNumber(cleaned) });
                    }}
                    placeholder="Digite seu telefone"
                    keyboardType="phone-pad"
                    maxLength={15} 
                  />
                ) : (
                  <Text style={styles.infoValue}>{formatPhoneNumber(user.phone_number)}</Text>
                )}
              </View>
            </View>

            {editMode && (
              <TouchableOpacity style={styles.saveButton} onPress={updateProfile}>
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/help")}>
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

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { color: "#F44336" }]}>Sair</Text>
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
  input: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    borderBottomWidth: 1,
    borderBottomColor: "#F4C542",
    paddingVertical: 4,
  },
  saveButton: {
    backgroundColor: "#F4C542",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#0A1F44",
    fontSize: 16,
    fontWeight: "bold",
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
    color: "#F44336",
    fontWeight: "bold",
    fontSize: 16,
  },
});