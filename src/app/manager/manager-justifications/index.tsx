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

interface EmployeeSummary {
  employee: string;
  totalJustifications: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  justifications: Justification[];
  lastJustificationDate: string;
}

const STATUS_COLORS: Record<Status, string> = {
  pendente: "#F4C542",
  aprovada: "#4BB543", 
  recusada: "#FF6B6B",
};

const STATUS_ICONS: Record<Status, string> = {
  pendente: "time-outline",
  aprovada: "checkmark-circle",
  recusada: "close-circle",
};

const STATUS_LABELS: Record<Status, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  recusada: "Rejeitada",
};

const { width } = Dimensions.get("window");

export default function ManagerJustificationsScreen() {
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeSummary[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [selectedJustification, setSelectedJustification] = useState<Justification | null>(null);
  const [justificationsModalVisible, setJustificationsModalVisible] = useState(false);
  const [justificationModalVisible, setJustificationModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const mapJustificationStatus = (item: any): Status => {
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

  const organizeJustificationsByEmployee = (justifications: Justification[]): EmployeeSummary[] => {
    const employeeMap = new Map<string, Justification[]>();

    justifications.forEach(justification => {
      const employee = justification.employee;
      if (!employeeMap.has(employee)) {
        employeeMap.set(employee, []);
      }
      employeeMap.get(employee)?.push(justification);
    });

    const summaries: EmployeeSummary[] = [];
    employeeMap.forEach((justifications, employee) => {
      const pendingCount = justifications.filter(j => j.status === "pendente").length;
      const approvedCount = justifications.filter(j => j.status === "aprovada").length;
      const rejectedCount = justifications.filter(j => j.status === "recusada").length;
      
      const sortedJustifications = justifications.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      summaries.push({
        employee,
        totalJustifications: justifications.length,
        pendingCount,
        approvedCount,
        rejectedCount,
        justifications: sortedJustifications,
        lastJustificationDate: sortedJustifications[0]?.date || "N/A"
      });
    });

    return summaries.sort((a, b) => {
      if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
      if (a.pendingCount === 0 && b.pendingCount > 0) return 1;
      if (a.pendingCount > 0 && b.pendingCount > 0) {
        return b.pendingCount - a.pendingCount;
      }
      return new Date(b.lastJustificationDate).getTime() - new Date(a.lastJustificationDate).getTime();
    });
  };

  const fetchJustifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/justification/");
      console.log("Resposta completa da API:", response.data);
      
      if (response.status === 200) {
        const justifications = response.data.map((item: any) => ({
          id: item.id ? item.id.toString() : "N/A",
          employee: item.user || item.employee || "Desconhecido",
          reason: item.reason || "Sem motivo",
          date: item.date || (item.created_at ? item.created_at.split("T")[0] : "N/A"),
          status: mapJustificationStatus(item),
          details: item.reason || item.details || "Sem detalhes",
        }));
        
        const organizedData = organizeJustificationsByEmployee(justifications);
        setEmployeeSummaries(organizedData);
        console.log("Justificativas organizadas:", organizedData);
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
      
      if (response.status === 200) {
        updateJustificationStatus(id, "aprovada");
        Alert.alert("✅ Sucesso", "Justificativa aprovada com sucesso!");
        setTimeout(fetchJustifications, 1000);
      } else {
        throw new Error(`Status inesperado: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ao aprovar justificativa:", error);
      Alert.alert("❌ Erro", "Falha ao aprovar a justificativa. Verifique suas permissões ou tente novamente.");
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
      
      if (response.status === 200) {
        updateJustificationStatus(id, "recusada");
        Alert.alert("✅ Sucesso", "Justificativa rejeitada com sucesso!");
        setTimeout(fetchJustifications, 1000);
      } else {
        throw new Error(`Status inesperado: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ao reprovar justificativa:", error);
      Alert.alert("❌ Erro", "Falha ao reprovar a justificativa. Verifique suas permissões ou tente novamente.");
    } finally {
      setActionLoading(null);
    }
  };

  const updateJustificationStatus = (id: string, newStatus: Status) => {
    setEmployeeSummaries(prev => prev.map(emp => ({
      ...emp,
      justifications: emp.justifications.map(j => 
        j.id === id ? { ...j, status: newStatus } : j
      ),
      pendingCount: emp.justifications.filter(j => 
        j.id === id ? newStatus === "pendente" : j.status === "pendente"
      ).length,
      approvedCount: emp.justifications.filter(j => 
        j.id === id ? newStatus === "aprovada" : j.status === "aprovada"
      ).length,
      rejectedCount: emp.justifications.filter(j => 
        j.id === id ? newStatus === "recusada" : j.status === "recusada"
      ).length,
    })));

    if (selectedEmployee) {
      setSelectedEmployee(prev => prev ? {
        ...prev,
        justifications: prev.justifications.map(j => 
          j.id === id ? { ...j, status: newStatus } : j
        )
      } : null);
    }

    if (selectedJustification && selectedJustification.id === id) {
      setSelectedJustification(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const openJustificationsModal = (employee: EmployeeSummary) => {
    setSelectedEmployee(employee);
    setJustificationsModalVisible(true);
  };

  const openJustificationDetails = (justification: Justification) => {
    setSelectedJustification(justification);
    setJustificationModalVisible(true);
  };

  const closeJustificationsModal = () => {
    setJustificationsModalVisible(false);
    setSelectedEmployee(null);
  };

  const closeJustificationModal = () => {
    setJustificationModalVisible(false);
    setSelectedJustification(null);
  };

  const renderEmployeeItem = ({ item }: { item: EmployeeSummary }) => (
    <View style={styles.employeeCard}>
      <View style={styles.employeeHeader}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.employee}</Text>
          <Text style={styles.employeeSubtitle}>
            {item.totalJustifications} justificativa{item.totalJustifications !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.lastDate}>Última: {item.lastJustificationDate}</Text>
        </View>
        
        {item.pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{item.pendingCount}</Text>
            <Text style={styles.pendingBadgeLabel}>Pendente{item.pendingCount !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      <View style={styles.statusSummary}>
        <View style={styles.statusItem}>
          <Text style={[styles.statusCount, { color: STATUS_COLORS.pendente }]}>{item.pendingCount}</Text>
          <Text style={styles.statusLabel}>Pendente{item.pendingCount !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusCount, { color: STATUS_COLORS.aprovada }]}>{item.approvedCount}</Text>
          <Text style={styles.statusLabel}>Aprovada{item.approvedCount !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusCount, { color: STATUS_COLORS.recusada }]}>{item.rejectedCount}</Text>
          <Text style={styles.statusLabel}>Rejeitada{item.rejectedCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.viewJustificationsButton} 
        onPress={() => openJustificationsModal(item)}
      >
        <Ionicons name="eye-outline" size={18} color="#0A1F44" />
        <Text style={styles.viewJustificationsButtonText}>Ver Justificativas</Text>
      </TouchableOpacity>
    </View>
  );

  const renderJustificationItem = ({ item }: { item: Justification }) => (
    <TouchableOpacity style={styles.justificationCard} onPress={() => openJustificationDetails(item)}>
      <View style={styles.justificationHeader}>
        <Text style={styles.justificationReason} numberOfLines={2}>{item.reason}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>
      <View style={styles.justificationFooter}>
        <Ionicons name="calendar-outline" size={12} color="#B0B3C7" />
        <Text style={styles.justificationDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F4C542" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Justificativas de Terceirizados</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4C542" />
          <Text style={styles.loadingText}>Carregando justificativas...</Text>
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
        <Text style={styles.headerTitle}>Justificativas</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchJustifications}>
          <Ionicons name="refresh" size={20} color="#F4C542" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={employeeSummaries}
        keyExtractor={(item) => item.employee}
        renderItem={renderEmployeeItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#B0B3C7" />
            <Text style={styles.emptyTitle}>Nenhuma justificativa encontrada</Text>
            <Text style={styles.emptySubtitle}>As justificativas dos funcionários aparecerão aqui</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={fetchJustifications}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de justificativas do funcionário */}
      <Modal
        visible={justificationsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeJustificationsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEmployee && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="person-outline" size={20} color="#F4C542" />
                    <Text style={styles.modalTitle}>{selectedEmployee.employee}</Text>
                  </View>
                  <TouchableOpacity onPress={closeJustificationsModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#B0B3C7" />
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{selectedEmployee.totalJustifications}</Text>
                    <Text style={styles.statusLabel}>Total</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: STATUS_COLORS.pendente }]}>{selectedEmployee.pendingCount}</Text>
                    <Text style={styles.statusLabel}>Pendentes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: STATUS_COLORS.aprovada }]}>{selectedEmployee.approvedCount}</Text>
                    <Text style={styles.statusLabel}>Aprovadas</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: STATUS_COLORS.recusada }]}>{selectedEmployee.rejectedCount}</Text>
                    <Text style={styles.statusLabel}>Rejeitadas</Text>
                  </View>
                </View>

                <Text style={styles.justificationsListTitle}>Justificativas:</Text>

                <FlatList
                  data={selectedEmployee.justifications}
                  keyExtractor={(item) => item.id}
                  renderItem={renderJustificationItem}
                  style={styles.justificationsList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={styles.emptyJustifications}>Nenhuma justificativa encontrada</Text>
                  }
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de detalhes da justificativa */}
      <Modal
        visible={justificationModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeJustificationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedJustification && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="document-text-outline" size={20} color="#F4C542" />
                    <Text style={styles.modalTitle}>Detalhes da Justificativa</Text>
                  </View>
                  <TouchableOpacity onPress={closeJustificationModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#B0B3C7" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="person-outline" size={16} color="#F4C542" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Funcionário</Text>
                      <Text style={styles.detailValue}>{selectedJustification.employee}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="calendar-outline" size={16} color="#F4C542" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Data</Text>
                      <Text style={styles.detailValue}>{selectedJustification.date}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="information-circle-outline" size={16} color="#F4C542" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedJustification.status] }]}>
                        <Text style={styles.statusBadgeText}>{STATUS_LABELS[selectedJustification.status]}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailColumn}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="chatbubble-outline" size={16} color="#F4C542" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Motivo da Justificativa</Text>
                      <Text style={styles.detailValueMultiline}>{selectedJustification.reason}</Text>
                    </View>
                  </View>
                </View>

                {selectedJustification.status === "pendente" && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(selectedJustification.id)}
                      disabled={actionLoading === selectedJustification.id}
                    >
                      {actionLoading === selectedJustification.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      )}
                      <Text style={styles.actionButtonText}>Aprovar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(selectedJustification.id)}
                      disabled={actionLoading === selectedJustification.id}
                    >
                      {actionLoading === selectedJustification.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="close-circle" size={20} color="#fff" />
                      )}
                      <Text style={styles.actionButtonText}>Rejeitar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedJustification.status !== "pendente" && (
                  <View style={styles.processedInfo}>
                    <Ionicons 
                      name={selectedJustification.status === "aprovada" ? "checkmark-circle" : "close-circle"} 
                      size={24} 
                      color={STATUS_COLORS[selectedJustification.status]} 
                    />
                    <Text style={[styles.processedText, { color: STATUS_COLORS[selectedJustification.status] }]}>
                      Justificativa {selectedJustification.status}
                    </Text>
                  </View>
                )}
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
    paddingBottom: 16,
    backgroundColor: "#142850",
    borderBottomWidth: 1,
    borderBottomColor: "#1A2A4F",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F4C542",
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#B0B3C7",
    fontSize: 16,
    marginTop: 12,
  },
  listContainer: {
    padding: 16,
  },
  employeeCard: {
    backgroundColor: "#142850",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A2A4F",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  employeeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F4C542",
    marginBottom: 6,
  },
  employeeSubtitle: {
    fontSize: 14,
    color: "#B0B3C7",
    marginBottom: 4,
  },
  lastDate: {
    fontSize: 12,
    color: "#8A8D9A",
    fontStyle: "italic",
  },
  pendingBadge: {
    backgroundColor: "#F4C542",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 60,
  },
  pendingBadgeText: {
    color: "#0A1F44",
    fontSize: 18,
    fontWeight: "bold",
  },
  pendingBadgeLabel: {
    color: "#0A1F44",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  statusSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1A2A4F",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  statusCount: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusLabel: {
    color: "#B0B3C7",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
  viewJustificationsButton: {
    backgroundColor: "#F4C542",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viewJustificationsButtonText: {
    color: "#0A1F44",
    fontSize: 14,
    fontWeight: "bold",
  },
  justificationCard: {
    backgroundColor: "#1A2A4F",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#243B5E",
  },
  justificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  justificationReason: {
    color: "#FFFFFF",
    fontSize: 14,
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  statusBadgeText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "bold",
  },
  justificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  justificationDate: {
    fontSize: 12,
    color: "#B0B3C7",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#B0B3C7",
    fontSize: 14,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: "#142850",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2A4F",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  modalTitle: {
    color: "#F4C542",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1A2A4F",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  justificationsListTitle: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  justificationsList: {
    maxHeight: 300,
  },
  emptyJustifications: {
    color: "#B0B3C7",
    textAlign: "center",
    fontSize: 14,
    padding: 20,
    fontStyle: "italic",
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingVertical: 8,
  },
  detailColumn: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingVertical: 8,
  },
  detailIcon: {
    width: 32,
    alignItems: "center",
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
    marginLeft: 8,
  },
  detailLabel: {
    color: "#B0B3C7",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  detailValueMultiline: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: "#1A2A4F",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#243B5E",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  approveButton: {
    backgroundColor: "#4BB543",
  },
  rejectButton: {
    backgroundColor: "#FF6B6B",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  processedInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A2A4F",
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#243B5E",
  },
  processedText: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});