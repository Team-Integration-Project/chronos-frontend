import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Modal, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../../services/api";

interface User {
  username: string;
  email: string;
  cpf: string;
  phone_number: string;
  role: string;
}

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  phone_number: string;
  role: string;
}

const formatCPF = (cpf: string): string => {
  if (!cpf) return "";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length > 11) return cleaned.slice(0, 11);
  return cleaned
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatPhoneNumber = (phone: string): string => {
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

const unformat = (value: string): string => value.replace(/\D/g, "");

export default function ProfileScreen() {
  const [user, setUser] = useState<User>({
    username: "",
    email: "",
    cpf: "",
    phone_number: "",
    role: "",
  });
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [modalEditar, setModalEditar] = useState<boolean>(false);
  const [funcionarioEditar, setFuncionarioEditar] = useState<Funcionario | null>(null);
  const [displayData, setDisplayData] = useState<{ cpf: string; phone_number: string }>({ cpf: "", phone_number: "" });
  const [busca, setBusca] = useState<string>("");
  const [filtroFuncao, setFiltroFuncao] = useState<string>("");
  const [modalRemover, setModalRemover] = useState<boolean>(false);
  const [funcionarioParaRemover, setFuncionarioParaRemover] = useState<{ id: string; nome: string } | null>(null);
  const [snackbar, setSnackbar] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const snackbarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/profile/");
      const userData: User = response.data;
      setUser({
        username: userData.username || "Não informado",
        email: userData.email || "Não informado",
        cpf: userData.cpf || "Não informado",
        phone_number: userData.phone_number || "Não informado",
        role: userData.role === "admin" ? "Chefe de Obra" : "Terceirizado",
      });
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      setSnackbar("Erro ao carregar perfil.");
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
    }
  };

  const fetchFuncionarios = async () => {
    try {
      const response = await api.get("/list-manage/");
      const users: Funcionario[] = response.data.map((user: any) => ({
        id: user.id.toString(),
        nome: user.username || "Não informado",
        email: user.email || "Não informado",
        cpf: user.cpf || "",
        phone_number: user.phone_number || "",
        role: user.role === "admin" ? "Chefe de Obra" : "Terceirizado",
      }));
      setFuncionarios(users);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      setSnackbar("Erro ao carregar funcionários.");
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
      setLoading(false);
    }
  };

  const handleUpdateFuncionario = async () => {
    if (!funcionarioEditar) return;

    const cleanedData = {
      username: funcionarioEditar.nome,
      email: funcionarioEditar.email,
      cpf: unformat(funcionarioEditar.cpf),
      phone_number: unformat(funcionarioEditar.phone_number),
    };

    if (cleanedData.cpf && !/^\d{11}$/.test(cleanedData.cpf)) {
      setSnackbar("CPF deve conter 11 dígitos numéricos.");
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
      return;
    }
    if (cleanedData.phone_number && !/^\d{10,11}$/.test(cleanedData.phone_number)) {
      setSnackbar("Telefone deve conter 10 ou 11 dígitos numéricos.");
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedData.email)) {
      setSnackbar("E-mail inválido.");
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
      return;
    }

    try {
      const response = await api.put(`/list-manage/${funcionarioEditar.id}/`, cleanedData);
      setFuncionarios((prev) =>
        prev.map((f) =>
          f.id === funcionarioEditar.id
            ? {
                ...f,
                nome: response.data.username || "Não informado",
                email: response.data.email || "Não informado",
                cpf: response.data.cpf || "",
                phone_number: response.data.phone_number || "",
                role: response.data.role === "admin" ? "Chefe de Obra" : "Terceirizado",
              }
            : f
        )
      );
      setDisplayData({
        cpf: formatCPF(response.data.cpf),
        phone_number: formatPhoneNumber(response.data.phone_number),
      });
      setModalEditar(false);
      setFuncionarioEditar(null);
      setSnackbar("Funcionário editado com sucesso!");
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
      setSnackbar("Erro ao atualizar funcionário.");
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
    }
  };

  const handleRemoverFuncionario = async (id: string, nome: string) => {
    setFuncionarioParaRemover({ id, nome });
    setModalRemover(true);
  };

  const confirmarRemocaoFuncionario = async () => {
    if (!funcionarioParaRemover) return;

    try {
      await api.delete(`/list-manage/${funcionarioParaRemover.id}/`);
      setFuncionarios((prev) => prev.filter((f) => f.id !== funcionarioParaRemover.id));
      setSnackbar(`Funcionário ${funcionarioParaRemover.nome} removido!`);
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
    } catch (error) {
      console.error("Erro ao remover funcionário:", error);
      setSnackbar("Erro ao remover funcionário.");
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
    } finally {
      setFuncionarioParaRemover(null);
      setModalRemover(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("accessToken");
      router.replace("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setSnackbar("Erro ao realizar logout.");
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
    }
  };

  const funcionariosFiltrados = funcionarios.filter((f) => {
    const buscaLower = busca.toLowerCase();
    return (
      (!busca || f.nome.toLowerCase().includes(buscaLower) || f.email.toLowerCase().includes(buscaLower)) &&
      (!filtroFuncao || (filtroFuncao === "Terceirizado" ? f.role !== "Chefe de Obra" : f.role === filtroFuncao))
    );
  });

  useEffect(() => {
    fetchProfile();
    fetchFuncionarios();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.headerTitle}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil do Usuário</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle-outline" size={90} color="#F4C542" />
          </View>
          <Text style={styles.userName}>{user.username}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
          <Text style={styles.userInfo}>
            CPF: <Text style={styles.userInfoValue}>{formatCPF(user.cpf)}</Text>
          </Text>
          <Text style={styles.userInfo}>
            Telefone: <Text style={styles.userInfoValue}>{formatPhoneNumber(user.phone_number)}</Text>
          </Text>
          <Text style={styles.userInfo}>
            Total de funcionários: <Text style={styles.userInfoValue}>{funcionarios.length}</Text>
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Funcionários</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/auth/register" as const)}>
              <Ionicons name="person-add-outline" size={22} color="#F4C542" />
              <Text style={styles.addBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginBottom: 10 }}>
            <View style={{ flex: 1, backgroundColor: "#1A2A4F", borderRadius: 8, flexDirection: "row", alignItems: "center", paddingHorizontal: 10 }}>
              <Ionicons name="search" size={18} color="#B0B3C7" />
              <TextInput
                style={{ flex: 1, color: "#fff", fontSize: 15, paddingVertical: 8 }}
                placeholder="Buscar por nome ou e-mail"
                placeholderTextColor="#B0B3C7"
                value={busca}
                onChangeText={setBusca}
              />
            </View>
            <TouchableOpacity
              onPress={() => setFiltroFuncao(filtroFuncao ? "" : "Terceirizado")}
              style={{ backgroundColor: filtroFuncao ? "#F4C542" : "#1A2A4F", borderRadius: 8, padding: 8 }}
            >
              <Ionicons name="hammer-outline" size={18} color={filtroFuncao ? "#0A1F44" : "#B0B3C7"} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={funcionariosFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.workerItem, { alignItems: "flex-start", paddingVertical: 14 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workerName}>{item.nome}</Text>
                  <Text style={styles.workerFuncao}>{item.role}</Text>
                  <Text style={styles.workerEmail}>{item.email}</Text>
                  <Text style={styles.workerFuncao}>CPF: {formatCPF(item.cpf)}</Text>
                  <Text style={styles.workerFuncao}>Telefone: {formatPhoneNumber(item.phone_number)}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8, gap: 4 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setFuncionarioEditar({ ...item });
                      setDisplayData({
                        cpf: formatCPF(item.cpf),
                        phone_number: formatPhoneNumber(item.phone_number),
                      });
                      setModalEditar(true);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="create-outline" size={22} color="#1976D2" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoverFuncionario(item.id, item.nome)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="trash-outline" size={22} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum funcionário encontrado.</Text>}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { color: "#F44336" }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalEditar && !!funcionarioEditar}
        transparent
        animationType="slide"
        onRequestClose={() => setModalEditar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: "center", minWidth: 320, maxWidth: 400 }]}>
            <Text style={styles.modalTitle}>Editar Funcionário</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor="#B0B3C7"
              value={funcionarioEditar?.nome || ""}
              onChangeText={(nome) => setFuncionarioEditar((prev: Funcionario | null) => prev && { ...prev, nome })}
            />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#B0B3C7"
              keyboardType="email-address"
              value={funcionarioEditar?.email || ""}
              onChangeText={(email) => setFuncionarioEditar((prev: Funcionario | null) => prev && { ...prev, email })}
            />
            <TextInput
              style={styles.input}
              placeholder="CPF (000.000.000-00)"
              placeholderTextColor="#B0B3C7"
              keyboardType="numeric"
              value={displayData.cpf}
              onChangeText={(text) => {
                const cleaned = unformat(text);
                setFuncionarioEditar((prev: Funcionario | null) => prev && { ...prev, cpf: cleaned });
                setDisplayData({ ...displayData, cpf: formatCPF(cleaned) });
              }}
              maxLength={14}
            />
            <TextInput
              style={styles.input}
              placeholder="Telefone ((00) 00000-0000)"
              placeholderTextColor="#B0B3C7"
              keyboardType="phone-pad"
              value={displayData.phone_number}
              onChangeText={(text) => {
                const cleaned = unformat(text);
                setFuncionarioEditar((prev: Funcionario | null) => prev && { ...prev, phone_number: cleaned });
                setDisplayData({ ...displayData, phone_number: formatPhoneNumber(cleaned) });
              }}
              maxLength={15}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalEditar(false);
                  setFuncionarioEditar(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateFuncionario}>
                <Text style={styles.saveBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalRemover}
        transparent
        animationType="fade"
        onRequestClose={() => setModalRemover(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle-outline" size={40} color="#F44336" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Remover Funcionário</Text>
            <Text style={{ color: "#fff", fontSize: 16, textAlign: "center", marginBottom: 18 }}>
              Tem certeza que deseja remover {funcionarioParaRemover?.nome} da equipe?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalRemover(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#F44336" }]} onPress={confirmarRemocaoFuncionario}>
                <Text style={styles.saveBtnText}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {snackbar ? (
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center", zIndex: 99 }}>
          <View style={{ backgroundColor: "#333", borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 }}>
            <Text style={{ color: "#fff", fontSize: 15 }}>{snackbar}</Text>
          </View>
        </View>
      ) : null}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 10,
    backgroundColor: "#0A1F44",
  },
  backButton: {
    width: 40,
    alignItems: "flex-start",
  },
  headerTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 22,
    letterSpacing: 1.1,
    textAlign: "center",
    flex: 1,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: "#142850",
    margin: 20,
    borderRadius: 18,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    marginBottom: 10,
  },
  userName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 2,
  },
  userEmail: {
    color: "#B0B3C7",
    fontSize: 15,
    marginBottom: 2,
  },
  userRole: {
    color: "#F4C542",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  userInfo: {
    color: "#B0B3C7",
    fontSize: 14,
    marginBottom: 1,
  },
  userInfoValue: {
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  addBtnText: {
    color: "#F4C542",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 14,
  },
  workerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A1F44",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  workerName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  workerEmail: {
    color: "#B0B3C7",
    fontSize: 13,
  },
  workerFuncao: {
    color: "#F4C542",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: "#B0B3C7",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#142850",
    borderRadius: 12,
    paddingVertical: 16,
  },
  logoutText: {
    color: "#F44336",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#142850",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    color: "#F4C542",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#0A1F44",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    width: "100%",
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#B0B3C7",
    fontWeight: "bold",
    fontSize: 15,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#F4C542",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#0A1F44",
    fontWeight: "bold",
    fontSize: 15,
  },
});