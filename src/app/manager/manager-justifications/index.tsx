import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";

type Status = "pendente" | "aprovada" | "recusada";

interface Justification {
  id: string;
  employee: string;
  reason: string;
  date: string;
  status: Status;
  details: string;
}

const STATUS_COLORS: Record<Status, string> = {
  pendente: "#F4C542",
  aprovada: "#4BB543",
  recusada: "#FF6B6B",
};

const { width } = Dimensions.get("window");

export default function ManagerJustificationsScreen() {
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [selected, setSelected] = useState<Justification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const mapJustificationStatus = (item: any): Status => {
    console.log(`Mapeando status para item ${item.id}:`, {
      approval: item.approval,
      approved: item.approved,
      status: item.status
    });

    if (item.status === 'aprovada' || item.status === 'approved') {
      return "aprovada";
    } else if (item.status === 'recusada' || item.status === 'rejected') {
      return "recusada";
    } else if (item.approval === true || item.approved === true) {
      return "aprovada";
    } else if (item.approval === false || item.approved === false) {
      return "recusada";
    } else {
      return "pendente";
    }
  };

  const fetchJustifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/justification/");
      console.log("Resposta completa da API:", response.data);
      
      if (response.status === 200) {
        const data = response.data.map((item: any) => {
          const mappedItem = {
            id: item.id ? item.id.toString() : "N/A",
            employee: item.user || item.employee || "Desconhecido",
            reason: item.reason || "Sem motivo",
            date: item.date || (item.created_at ? item.created_at.split("T")[0] : "N/A"),
            status: mapJustificationStatus(item),
            details: item.reason || item.details || "Sem detalhes",
          };
          
          console.log(`Item ${item.id} mapeado:`, mappedItem);
          return mappedItem;
        });
        
        setJustifications(data);
        console.log("Justificativas carregadas:", data);
      } else {
        Alert.alert("Erro", "Falha ao carregar as justificativas.");
      }
    } catch (error) {
      console.error("Erro ao buscar justificativas:", error);
      Alert.alert("Erro", "Não foi possível carregar as justificativas. Verifique sua conexão ou permissões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJustifications();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      console.log(`Tentando aprovar justificativa ${id}`);
      
      const response = await api.post(`/justification/${id}/approve/`, { 
        approved: true,
        approval: true
      });
      
      console.log("Resposta de aprovação:", response.data);
      
      if (response.status === 200) {
        setJustifications((prev) =>
          prev.map((j) => (j.id === id ? { ...j, status: "aprovada" } : j))
        );
        
        if (selected && selected.id === id) {
          setSelected({ ...selected, status: "aprovada" });
        }
        
        Alert.alert("Sucesso", "Justificativa aprovada com sucesso!");
        
        setTimeout(fetchJustifications, 1000);
        
      } else {
        throw new Error(`Status inesperado: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ao aprovar justificativa:", error);
      Alert.alert("Erro", "Falha ao aprovar a justificativa. Verifique suas permissões ou tente novamente.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      console.log(`Tentando reprovar justificativa ${id}`);
      
      const response = await api.post(`/justification/${id}/approve/`, { 
        approved: false,
        approval: false
      });
      
      console.log("Resposta de reprovação:", response.data);
      
      if (response.status === 200) {
        setJustifications((prev) =>
          prev.map((j) => (j.id === id ? { ...j, status: "recusada" } : j))
        );
        
        if (selected && selected.id === id) {
          setSelected({ ...selected, status: "recusada" });
        }
        
        Alert.alert("Sucesso", "Justificativa reprovada com sucesso!");
        
        setTimeout(fetchJustifications, 1000);
        
      } else {
        throw new Error(`Status inesperado: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ao reprovar justificativa:", error);
      Alert.alert("Erro", "Falha ao reprovar a justificativa. Verifique suas permissões ou tente novamente.");
    } finally {
      setActionLoading(null);
    }
  };



  const openDetails = (item: Justification) => {
    setSelected(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelected(null);
  };

  const renderItem = ({ item }: { item: Justification }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetails(item)}>
      <Text style={styles.employee}>{item.employee}</Text>
      <View style={styles.rowBetween}>
        <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
        <View style={[styles.status, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.date}>{item.date}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F4C542" />
          </TouchableOpacity>
          <Text style={styles.headerTitleYellow}>Justificativas Recebidas</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#F4C542" />
          <Text style={{ color: "#B0B3C7", fontSize: 16, marginTop: 12 }}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.headerTitleYellow}>Justificativas Recebidas</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={justifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#B0B3C7" />
            <Text style={styles.empty}>Nenhuma justificativa recebida.</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={fetchJustifications}
      />

      <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/help" as any)}>
        <Ionicons name="help-circle-outline" size={24} color="#F4C542" />
        <Text style={styles.actionButtonText}>Ajuda</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selected && (
              <>
                <Text style={styles.modalTitle}>Detalhes da Justificativa</Text>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Funcionário:</Text>
                  <Text style={styles.modalValue}>{selected.employee}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Motivo:</Text>
                  <Text style={styles.modalValue}>{selected.reason}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Data:</Text>
                  <Text style={styles.modalValue}>{selected.date}</Text>
                </View>
                <View style={styles.modalStatusRow}>
                  <Text style={styles.modalLabel}>Status:</Text>
                  <View style={[styles.statusModal, { backgroundColor: STATUS_COLORS[selected.status] }]}>
                    <Text style={styles.statusTextModal}>
                      {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {selected.status === "pendente" && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: "#4BB543", opacity: actionLoading === selected.id ? 0.7 : 1 }]} 
                      onPress={() => handleApprove(selected.id)}
                      disabled={actionLoading === selected.id}
                    >
                      {actionLoading === selected.id ? (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                      ) : (
                        <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
                      )}
                      <Text style={styles.actionText}>Aprovar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: "#FF6B6B", opacity: actionLoading === selected.id ? 0.7 : 1 }]} 
                      onPress={() => handleReject(selected.id)}
                      disabled={actionLoading === selected.id}
                    >
                      {actionLoading === selected.id ? (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                      ) : (
                        <Ionicons name="close-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
                      )}
                      <Text style={styles.actionText}>Reprovar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selected.status !== "pendente" && (
                  <View style={styles.processedInfo}>
                    <Text style={styles.processedInfoText}>
                      Justificativa {selected.status === "aprovada" ? "aprovada" : "reprovada"}
                    </Text>
                  </View>
                )}



                <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                  <Ionicons name="close" size={20} color="#B0B3C7" />
                  <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 10,
    backgroundColor: "#142850",
    borderBottomWidth: 1,
    borderBottomColor: "#1A2A4F",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerTitleYellow: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F4C542",
    textAlign: "center",
    flex: 1,
  },
  card: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  employee: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F4C542",
    marginBottom: 8,
  },
  status: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    marginLeft: 8,
  },
  statusText: {
    color: "#333",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  reason: {
    fontSize: 15,
    color: "#FFFFFF",
    flex: 1,
    marginRight: 12,
  },
  date: {
    fontSize: 13,
    color: "#B0B3C7",
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  empty: {
    color: "#B0B3C7",
    textAlign: "center",
    marginTop: 12,
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
    marginBottom: 20,
  },
  modalTitle: {
    color: "#F4C542",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    color: "#B0B3C7",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 10,
    flexShrink: 0,
  },
  modalValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  modalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 20,
    width: "100%",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#1A2A4F",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  closeText: {
    color: "#B0B3C7",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },
  statusModal: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    borderRadius: 10,
  },
  statusTextModal: {
    color: "#333",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
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
    marginTop: 16,
    marginBottom: 24,
  },
  actionButtonText: {
    color: "#F4C542",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  processedInfo: {
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  processedInfoText: {
    color: "#B0B3C7",
    fontSize: 14,
    fontWeight: "600",
  },
});
