import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const MOCK_JUSTIFICATIONS: Justification[] = [
  {
    id: "1",
    employee: "Carlos Souza",
    reason: "Atraso devido a transporte",
    date: "2024-06-10",
    status: "pendente",
    details: "O ônibus quebrou no caminho e precisei esperar outro.",
  },
  {
    id: "2",
    employee: "Maria Oliveira",
    reason: "Consulta médica",
    date: "2024-06-09",
    status: "aprovada",
    details: "Consulta marcada previamente, trouxe atestado.",
  },
  {
    id: "3",
    employee: "João Lima",
    reason: "Problema familiar",
    date: "2024-06-08",
    status: "recusada",
    details: "Precisei resolver um problema urgente em casa.",
  },
  {
    id: "4",
    employee: "Ana Paula",
    reason: "Atraso devido à chuva",
    date: "2024-06-10",
    status: "pendente",
    details: "Choveu muito forte e o trânsito ficou parado.",
  },
];

type Status = 'pendente' | 'aprovada' | 'recusada';

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
  const [justifications, setJustifications] = useState<Justification[]>(MOCK_JUSTIFICATIONS);
  const [selected, setSelected] = useState<Justification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleApprove = (id: string) => {
    setJustifications((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, status: "aprovada" } : j
      )
    );
    setModalVisible(false);
  };

  const handleReject = (id: string) => {
    setJustifications((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, status: "recusada" } : j
      )
    );
    setModalVisible(false);
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
        <Text style={styles.reason}>{item.reason}</Text>
        <View style={[styles.status, { backgroundColor: STATUS_COLORS[item.status] }]}> 
          <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
        </View>
      </View>
      <Text style={styles.date}>{item.date}</Text>
    </TouchableOpacity>
  );

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
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma justificativa recebida.</Text>}
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
                <Text style={styles.modalLabel}>Funcionário:</Text>
                <Text style={styles.modalValue}>{selected.employee}</Text>
                <Text style={styles.modalLabel}>Motivo:</Text>
                <Text style={styles.modalValue}>{selected.reason}</Text>
                <Text style={styles.modalLabel}>Data:</Text>
                <Text style={styles.modalValue}>{selected.date}</Text>
                <Text style={styles.modalLabel}>Descrição:</Text>
                <Text style={styles.modalValue}>{selected.details}</Text>
                <View style={styles.modalStatusRow}>
                  <Text style={styles.modalLabel}>Status:</Text>
                  <View style={[styles.statusModal, { backgroundColor: STATUS_COLORS[selected.status] }]}> 
                    <Text style={styles.statusTextModal}>{selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}</Text>
                  </View>
                </View>
                {selected.status === "pendente" && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#4BB543" }]} onPress={() => handleApprove(selected.id)}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.actionText}>Aprovar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#FF6B6B" }]} onPress={() => handleReject(selected.id)}>
                      <Ionicons name="close-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.actionText}>Reprovar</Text>
                    </TouchableOpacity>
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
    padding: 16,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#F4C542",
  },
  helpButton: {
    padding: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  employee: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F4C542",
    marginRight: 8,
  },
  status: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    marginLeft: 8,
    height: 24,
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
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: "#B0B3C7",
  },
  empty: {
    color: "#B0B3C7",
    textAlign: "center",
    marginTop: 40,
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
    textAlign: "center",
  },
  modalLabel: {
    color: "#B0B3C7",
    fontSize: 16,
    marginTop: 6,
    fontWeight: "600",
    alignSelf: "flex-start",
  },
  modalValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
    alignSelf: "flex-start",
  },
  modalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: 0,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    alignSelf: "center",
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closeText: {
    color: "#B0B3C7",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },
  statusModal: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 0,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
    marginLeft: 8,
    height: 18,
    marginTop: 4,
  },
  statusTextModal: {
    color: "#333",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    marginBottom: 2,
  },
  statusAlign: {
    marginTop: 18,
  },
  statusCenterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 2,
  },
  statusRightRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 2,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 2,
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
    marginTop: 32,
    marginBottom: 24,
    position: "relative",
    left: 0,
  },
  actionButtonText: {
    color: "#F4C542",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  statusModalWrapper: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 2,
    marginBottom: 8,
    paddingLeft: 0,
  },
}); 