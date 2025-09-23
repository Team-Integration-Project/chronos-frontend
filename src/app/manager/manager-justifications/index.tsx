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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";

type Status = "pendente" | "aprovada" | "recusada";

interface AttachmentInfo {
  name: string;
  size: number;
  type?: string;
  uri?: string;
}

interface Justification {
  id: string;
  employee: string;
  reason: string;
  date: string;
  status: Status;
  details: string;
  attachment?: AttachmentInfo;
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

// Novo estado para controlar os pop-ups personalizados
interface CustomPopupState {
  visible: boolean;
  type: 'approve' | 'reject' | 'success' | 'error';
  title: string;
  message: string;
  justificationId?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const STATUS_COLORS: Record<Status, string> = {
  pendente: "#F4C542",
  aprovada: "#4BB543",
  recusada: "#FF6B6B",
};

const STATUS_LABELS: Record<Status, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  recusada: "Rejeitada",
};

// Definir os ícones válidos para Ionicons
type IconName =
  | "time-outline"
  | "checkmark-circle"
  | "close-circle"
  | "document-text-outline"
  | "document-outline"
  | "image-outline"
  | "videocam-outline"
  | "musical-notes-outline"
  | "attach-outline"
  | "person-outline"
  | "arrow-back"
  | "refresh"
  | "calendar-outline"
  | "eye-outline"
  | "close"
  | "checkmark"
  | "download-outline"
  | "warning"
  | "alert-circle";

const { width } = Dimensions.get("window");

export default function ManagerJustificationsScreen() {
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeSummary[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [selectedJustification, setSelectedJustification] = useState<Justification | null>(null);
  const [justificationsModalVisible, setJustificationsModalVisible] = useState(false);
  const [justificationModalVisible, setJustificationModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Novo estado para o pop-up personalizado
  const [customPopup, setCustomPopup] = useState<CustomPopupState>({
    visible: false,
    type: 'approve',
    title: '',
    message: '',
    justificationId: undefined,
    onConfirm: undefined,
    onCancel: undefined,
  });

  const mapJustificationStatus = (item: any): Status => {
    if (item.status === "aprovada" || item.status === "approved") {
      return "aprovada";
    } else if (item.status === "recusada" || item.status === "rejected") {
      return "recusada";
    } else if (item.approval === true || item.approved === true) {
      return "aprovada";
    } else if (item.approval === false || item.approved === false) {
      return "recusada";
    } else {
      return "pendente";
    }
  };

  const getFileIcon = (fileName: string): IconName => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "document-text-outline";
      case "doc":
      case "docx":
        return "document-outline";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "image-outline";
      case "mp4":
      case "avi":
      case "mov":
        return "videocam-outline";
      case "mp3":
      case "wav":
        return "musical-notes-outline";
      default:
        return "attach-outline";
    }
  };

  const getFileTypeLabel = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "Documento PDF";
      case "doc":
      case "docx":
        return "Documento Word";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "Imagem";
      case "mp4":
      case "avi":
      case "mov":
        return "Vídeo";
      case "mp3":
      case "wav":
        return "Áudio";
      default:
        return "Arquivo";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const organizeJustificationsByEmployee = (justifications: Justification[]): EmployeeSummary[] => {
    const employeeMap = new Map<string, Justification[]>();

    justifications.forEach((justification) => {
      const employee = justification.employee;
      if (!employeeMap.has(employee)) {
        employeeMap.set(employee, []);
      }
      employeeMap.get(employee)?.push(justification);
    });

    const summaries: EmployeeSummary[] = [];
    employeeMap.forEach((justifications, employee) => {
      const pendingCount = justifications.filter((j) => j.status === "pendente").length;
      const approvedCount = justifications.filter((j) => j.status === "aprovada").length;
      const rejectedCount = justifications.filter((j) => j.status === "recusada").length;

      const sortedJustifications = justifications.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      summaries.push({
        employee,
        totalJustifications: justifications.length,
        pendingCount,
        approvedCount,
        rejectedCount,
        justifications: sortedJustifications,
        lastJustificationDate: sortedJustifications[0]?.date || "N/A",
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
        const justifications = response.data.map((item: any) => {
          console.log("Item da API:", item);
          console.log("Campos de attachment:", {
            attachment: item.attachment,
            attachmentInfo: item.attachmentInfo,
            attachment_url: item.attachment_url,
            file: item.file,
            document: item.document,
            media: item.media,
          });

          let attachment = undefined;

          if (item.attachment) {
            attachment = {
              name: item.attachment.name || item.attachment.filename || "arquivo_anexo",
              size: item.attachment.size || 0,
              type: item.attachment.type || item.attachment.contentType || item.attachment.mimeType,
              uri: item.attachment.uri || item.attachment.url || item.attachment.path,
            };
          } else if (item.attachmentInfo) {
            attachment = {
              name: item.attachmentInfo.name || item.attachmentInfo.filename || "arquivo_anexo",
              size: item.attachmentInfo.size || 0,
              type: item.attachmentInfo.type || item.attachmentInfo.contentType,
              uri: item.attachmentInfo.uri || item.attachmentInfo.url,
            };
          } else if (item.file) {
            attachment = {
              name: item.file.name || item.file.filename || "arquivo_anexo",
              size: item.file.size || 0,
              type: item.file.type || item.file.contentType,
              uri: item.file.uri || item.file.url || item.file.path,
            };
          } else if (item.document) {
            attachment = {
              name: item.document.name || item.document.filename || "documento",
              size: item.document.size || 0,
              type: item.document.type || item.document.contentType,
              uri: item.document.uri || item.document.url || item.document.path,
            };
          } else if (item.attachment_url) {
            const filename = item.attachment_url.split("/").pop() || "arquivo_anexo";
            attachment = {
              name: filename,
              size: 0,
              type: undefined,
              uri: item.attachment_url,
            };
          }

          console.log("Attachment processado:", attachment);

          return {
            id: item.id ? item.id.toString() : "N/A",
            employee: item.user || item.employee || "Desconhecido",
            reason: item.reason || "Sem motivo",
            date: item.date || (item.created_at ? item.created_at.split("T")[0] : "N/A"),
            status: mapJustificationStatus(item),
            details: item.reason || item.details || "Sem detalhes",
            attachment: attachment,
          };
        });

        const organizedData = organizeJustificationsByEmployee(justifications);
        setEmployeeSummaries(organizedData);
        console.log("Justificativas organizadas com attachments:", organizedData);
      } else {
        showCustomPopup('error', 'Erro', 'Falha ao carregar as justificativas.');
      }
    } catch (error) {
      console.error("Erro ao buscar justificativas:", error);
      showCustomPopup('error', 'Erro de Conexão', 'Não foi possível carregar as justificativas. Verifique sua conexão ou permissões.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJustifications();
  }, []);

  // Função para mostrar o pop-up personalizado
  const showCustomPopup = (
    type: CustomPopupState['type'],
    title: string,
    message: string,
    justificationId?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    setCustomPopup({
      visible: true,
      type,
      title,
      message,
      justificationId,
      onConfirm,
      onCancel,
    });
  };

  // Função para fechar o pop-up personalizado
  const hideCustomPopup = () => {
    setCustomPopup(prev => ({ ...prev, visible: false }));
  };

  // Função modificada para aprovar com confirmação
  const showApproveConfirmation = (id: string, employeeName: string) => {
    showCustomPopup(
      'approve',
      'Confirmar Aprovação',
      `Deseja aprovar a justificativa de ${employeeName}?`,
      id,
      () => executeApproval(id),
      hideCustomPopup
    );
  };

  // Função modificada para rejeitar com confirmação
  const showRejectConfirmation = (id: string, employeeName: string) => {
    showCustomPopup(
      'reject',
      'Confirmar Rejeição',
      `Deseja rejeitar a justificativa de ${employeeName}?`,
      id,
      () => executeRejection(id),
      hideCustomPopup
    );
  };

  // Executar aprovação
  const executeApproval = async (id: string) => {
    try {
      setActionLoading(id);
      hideCustomPopup();
      console.log(`Tentando aprovar justificativa ${id}`);

      const response = await api.post(`/justification/${id}/approve/`, {
        approved: true,
        approval: true,
      });

      if (response.status === 200) {
        updateJustificationStatus(id, "aprovada");
        showCustomPopup('success', '✅ Aprovado!', 'Justificativa aprovada com sucesso!');
        setTimeout(() => {
          hideCustomPopup();
          fetchJustifications();
        }, 2000);
      } else {
        throw new Error(`Status inesperado: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ao aprovar justificativa:", error);
      showCustomPopup('error', '❌ Erro', 'Falha ao aprovar a justificativa. Verifique suas permissões ou tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  // Executar rejeição
  const executeRejection = async (id: string) => {
    try {
      setActionLoading(id);
      hideCustomPopup();
      console.log(`Tentando reprovar justificativa ${id}`);

      const response = await api.post(`/justification/${id}/approve/`, {
        approved: false,
        approval: false,
      });

      if (response.status === 200) {
        updateJustificationStatus(id, "recusada");
        showCustomPopup('success', '✅ Rejeitado!', 'Justificativa rejeitada com sucesso!');
        setTimeout(() => {
          hideCustomPopup();
          fetchJustifications();
        }, 2000);
      } else {
        throw new Error(`Status inesperado: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ao reprovar justificativa:", error);
      showCustomPopup('error', '❌ Erro', 'Falha ao reprovar a justificativa. Verifique suas permissões ou tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  // Funções originais modificadas para usar as novas confirmações
  const handleApprove = async (id: string) => {
    const justification = selectedJustification;
    if (justification) {
      showApproveConfirmation(id, justification.employee);
    }
  };

  const handleReject = async (id: string) => {
    const justification = selectedJustification;
    if (justification) {
      showRejectConfirmation(id, justification.employee);
    }
  };

  const updateJustificationStatus = (id: string, newStatus: Status) => {
    setEmployeeSummaries((prev) =>
      prev.map((emp) => ({
        ...emp,
        justifications: emp.justifications.map((j) => (j.id === id ? { ...j, status: newStatus } : j)),
        pendingCount: emp.justifications.filter((j) =>
          j.id === id ? newStatus === "pendente" : j.status === "pendente"
        ).length,
        approvedCount: emp.justifications.filter((j) =>
          j.id === id ? newStatus === "aprovada" : j.status === "aprovada"
        ).length,
        rejectedCount: emp.justifications.filter((j) =>
          j.id === id ? newStatus === "recusada" : j.status === "recusada"
        ).length,
      }))
    );

    if (selectedEmployee) {
      setSelectedEmployee((prev) =>
        prev
          ? {
              ...prev,
              justifications: prev.justifications.map((j) =>
                j.id === id ? { ...j, status: newStatus } : j
              ),
            }
          : null
      );
    }

    if (selectedJustification && selectedJustification.id === id) {
      setSelectedJustification((prev) => (prev ? { ...prev, status: newStatus } : null));
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

  const handleDownloadAttachment = async (attachment: AttachmentInfo) => {
    try {
      if (attachment.uri) {
        const canOpen = await Linking.canOpenURL(attachment.uri);
        if (canOpen) {
          await Linking.openURL(attachment.uri);
        } else {
          showCustomPopup('error', 'Anexo Indisponível', 'Não foi possível abrir o anexo. O arquivo pode ter sido movido ou deletado.');
        }
      } else {
        showCustomPopup(
          'error',
          'Informações do Anexo',
          `Nome: ${attachment.name}\nTamanho: ${formatFileSize(attachment.size)}${
            attachment.type ? `\nTipo: ${attachment.type}` : ""
          }`
        );
      }
    } catch (error) {
      console.error("Erro ao abrir anexo:", error);
      showCustomPopup('error', 'Erro', 'Não foi possível abrir o anexo.');
    }
  };

  // Componente do Pop-up Personalizado
  const CustomPopupModal = () => {
    if (!customPopup.visible) return null;

    const getPopupIcon = (): IconName => {
      switch (customPopup.type) {
        case 'approve':
          return 'checkmark-circle';
        case 'reject':
          return 'close-circle';
        case 'success':
          return 'checkmark-circle';
        case 'error':
          return 'alert-circle';
        default:
          return 'warning';
      }
    };

    const getPopupIconColor = (): string => {
      switch (customPopup.type) {
        case 'approve':
        case 'success':
          return '#4BB543';
        case 'reject':
        case 'error':
          return '#FF6B6B';
        default:
          return '#F4C542';
      }
    };

    const isConfirmationPopup = customPopup.type === 'approve' || customPopup.type === 'reject';

    return (
      <Modal
        visible={customPopup.visible}
        transparent
        animationType="fade"
        onRequestClose={hideCustomPopup}
      >
        <View style={styles.customPopupOverlay}>
          <View style={styles.customPopupContainer}>
            <View style={styles.customPopupContent}>
              <View style={styles.customPopupIconContainer}>
                <Ionicons 
                  name={getPopupIcon()} 
                  size={48} 
                  color={getPopupIconColor()} 
                />
              </View>
              
              <Text style={styles.customPopupTitle}>{customPopup.title}</Text>
              <Text style={styles.customPopupMessage}>{customPopup.message}</Text>
              
              <View style={styles.customPopupButtons}>
                {isConfirmationPopup ? (
                  <>
                    <TouchableOpacity
                      style={[styles.customPopupButton, styles.customPopupCancelButton]}
                      onPress={customPopup.onCancel || hideCustomPopup}
                      disabled={actionLoading !== null}
                    >
                      <Text style={styles.customPopupCancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.customPopupButton,
                        customPopup.type === 'approve' 
                          ? styles.customPopupApproveButton 
                          : styles.customPopupRejectButton
                      ]}
                      onPress={customPopup.onConfirm || hideCustomPopup}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === customPopup.justificationId ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.customPopupConfirmButtonText}>
                          {customPopup.type === 'approve' ? 'Aprovar' : 'Rejeitar'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.customPopupButton, styles.customPopupOkButton]}
                    onPress={hideCustomPopup}
                  >
                    <Text style={styles.customPopupConfirmButtonText}>OK</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEmployeeItem = ({ item }: { item: EmployeeSummary }) => (
    <View style={styles.employeeCard}>
      <View style={styles.employeeHeader}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.employee}</Text>
          <Text style={styles.employeeSubtitle}>
            {item.totalJustifications} justificativa{item.totalJustifications !== 1 ? "s" : ""}
          </Text>
          <Text style={styles.lastDate}>Última: {item.lastJustificationDate}</Text>
        </View>

        {item.pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{item.pendingCount}</Text>
            <Text style={styles.pendingBadgeLabel}>
              Pendente{item.pendingCount !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statusSummary}>
        <View style={styles.statusItem}>
          <Text style={[styles.statusCount, { color: STATUS_COLORS.pendente }]}>{item.pendingCount}</Text>
          <Text style={styles.statusLabel}>Pendente{item.pendingCount !== 1 ? "s" : ""}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusCount, { color: STATUS_COLORS.aprovada }]}>{item.approvedCount}</Text>
          <Text style={styles.statusLabel}>Aprovada{item.approvedCount !== 1 ? "s" : ""}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusCount, { color: STATUS_COLORS.recusada }]}>{item.rejectedCount}</Text>
          <Text style={styles.statusLabel}>Rejeitada{item.rejectedCount !== 1 ? "s" : ""}</Text>
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
        <View style={styles.justificationContent}>
          <Text style={styles.justificationReason} numberOfLines={2}>
            {item.reason}
          </Text>
          {item.attachment && (
            <View style={styles.attachmentIndicator}>
              <Ionicons name="attach" size={12} color="#F4C542" />
              <Text style={styles.attachmentText}>Anexo</Text>
            </View>
          )}
        </View>
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

      <Modal
        visible={justificationsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeJustificationsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.compactModal]}>
            {selectedEmployee && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="person-outline" size={18} color="#F4C542" />
                    <Text style={styles.modalTitle}>{selectedEmployee.employee}</Text>
                  </View>
                  <TouchableOpacity onPress={closeJustificationsModal} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color="#B0B3C7" />
                  </TouchableOpacity>
                </View>

                <View style={styles.compactSummaryStats}>
                  <View style={styles.statusItem}>
                    <Text style={styles.compactStatNumber}>{selectedEmployee.totalJustifications}</Text>
                    <Text style={styles.compactStatusLabel}>Total</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={[styles.compactStatNumber, { color: STATUS_COLORS.pendente }]}>
                      {selectedEmployee.pendingCount}
                    </Text>
                    <Text style={styles.compactStatusLabel}>Pendentes</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={[styles.compactStatNumber, { color: STATUS_COLORS.aprovada }]}>
                      {selectedEmployee.approvedCount}
                    </Text>
                    <Text style={styles.compactStatusLabel}>Aprovadas</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={[styles.compactStatNumber, { color: STATUS_COLORS.recusada }]}>
                      {selectedEmployee.rejectedCount}
                    </Text>
                    <Text style={styles.compactStatusLabel}>Rejeitadas</Text>
                  </View>
                </View>

                <FlatList
                  data={selectedEmployee.justifications}
                  keyExtractor={(item) => item.id}
                  renderItem={renderJustificationItem}
                  style={styles.compactJustificationsList}
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

      <Modal
        visible={justificationModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeJustificationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.compactModal]}>
            {selectedJustification && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Ionicons name="document-text-outline" size={18} color="#F4C542" />
                    <Text style={styles.compactModalTitle}>Detalhes</Text>
                  </View>
                  <TouchableOpacity onPress={closeJustificationModal} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color="#B0B3C7" />
                  </TouchableOpacity>
                </View>

                <View style={styles.compactDetailsContainer}>
                  <View style={styles.compactDetailRow}>
                    <Text style={styles.compactDetailLabel}>Funcionário:</Text>
                    <Text style={styles.compactDetailValue}>{selectedJustification.employee}</Text>
                  </View>

                  <View style={styles.compactDetailRow}>
                    <Text style={styles.compactDetailLabel}>Data:</Text>
                    <Text style={styles.compactDetailValue}>{selectedJustification.date}</Text>
                  </View>

                  <View style={styles.compactDetailRow}>
                    <Text style={styles.compactDetailLabel}>Status:</Text>
                    <View style={[styles.compactStatusBadge, { backgroundColor: STATUS_COLORS[selectedJustification.status] }]}>
                      <Text style={styles.statusBadgeText}>{STATUS_LABELS[selectedJustification.status]}</Text>
                    </View>
                  </View>

                  <View style={styles.compactDetailColumn}>
                    <Text style={styles.compactDetailLabel}>Motivo:</Text>
                    <Text style={styles.compactDetailValueMultiline}>{selectedJustification.reason}</Text>
                  </View>

                  {selectedJustification.attachment && (
                    <View style={styles.compactDetailColumn}>
                      <Text style={styles.compactDetailLabel}>Anexo:</Text>
                      <TouchableOpacity
                        style={styles.attachmentContainer}
                        onPress={() => handleDownloadAttachment(selectedJustification.attachment!)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.attachmentIconContainer}>
                          <Ionicons
                            name={getFileIcon(selectedJustification.attachment.name)}
                            size={28}
                            color="#F4C542"
                          />
                        </View>
                        <View style={styles.attachmentInfo}>
                          <Text style={styles.attachmentName} numberOfLines={1}>
                            {selectedJustification.attachment.name}
                          </Text>
                          <Text style={styles.attachmentDetails}>
                            {getFileTypeLabel(selectedJustification.attachment.name)} •{" "}
                            {formatFileSize(selectedJustification.attachment.size)}
                          </Text>
                        </View>
                        <Ionicons name="download-outline" size={20} color="#F4C542" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {selectedJustification.status === "pendente" && (
                  <View style={styles.compactActionButtons}>
                    <TouchableOpacity
                      style={[styles.compactActionButton, styles.approveButton]}
                      onPress={() => handleApprove(selectedJustification.id)}
                      disabled={actionLoading === selectedJustification.id}
                    >
                      {actionLoading === selectedJustification.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                      <Text style={styles.compactActionButtonText}>Aprovar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.compactActionButton, styles.rejectButton]}
                      onPress={() => handleReject(selectedJustification.id)}
                      disabled={actionLoading === selectedJustification.id}
                    >
                      {actionLoading === selectedJustification.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="close" size={16} color="#fff" />
                      )}
                      <Text style={styles.compactActionButtonText}>Rejeitar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedJustification.status !== "pendente" && (
                  <View style={styles.compactProcessedInfo}>
                    <Ionicons
                      name={selectedJustification.status === "aprovada" ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={STATUS_COLORS[selectedJustification.status]}
                    />
                    <Text
                      style={[styles.compactProcessedText, { color: STATUS_COLORS[selectedJustification.status] }]}
                    >
                      {STATUS_LABELS[selectedJustification.status]}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Pop-up Personalizado */}
      <CustomPopupModal />
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
  justificationContent: {
    flex: 1,
    marginRight: 12,
  },
  justificationReason: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: 4,
  },
  attachmentIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  attachmentText: {
    color: "#F4C542",
    fontSize: 11,
    fontWeight: "600",
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
  compactModal: {
    maxHeight: "80%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
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
    fontSize: 16,
    fontWeight: "bold",
  },
  compactModalTitle: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  compactSummaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1A2A4F",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  compactStatNumber: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  compactStatusLabel: {
    color: "#B0B3C7",
    fontSize: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  compactJustificationsList: {
    maxHeight: 250,
  },
  emptyJustifications: {
    color: "#B0B3C7",
    textAlign: "center",
    fontSize: 14,
    padding: 20,
    fontStyle: "italic",
  },
  compactDetailsContainer: {
    marginBottom: 16,
  },
  compactDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 4,
  },
  compactDetailColumn: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  compactDetailLabel: {
    color: "#B0B3C7",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  compactDetailValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  compactDetailValueMultiline: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    backgroundColor: "#1A2A4F",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#243B5E",
  },
  compactStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  attachmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2A4F",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A3D66",
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  attachmentIconContainer: {
    backgroundColor: "#2A3D66",
    borderRadius: 8,
    padding: 8,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  attachmentDetails: {
    color: "#B0B3C7",
    fontSize: 12,
    fontWeight: "500",
  },
  compactActionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  compactActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
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
  compactActionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  compactProcessedInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A2A4F",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#243B5E",
  },
  compactProcessedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Estilos do Pop-up Personalizado
  customPopupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  customPopupContainer: {
    backgroundColor: "#142850", // Fundo azul do sistema
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F4C542", // Borda amarela do sistema
    width: "90%",
    maxWidth: 350,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  customPopupContent: {
    padding: 24,
    alignItems: "center",
  },
  customPopupIconContainer: {
    marginBottom: 16,
    backgroundColor: "#1A2A4F",
    borderRadius: 50,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F4C542",
  },
  customPopupTitle: {
    color: "#F4C542", // Amarelo do sistema
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  customPopupMessage: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  customPopupButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  customPopupButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  customPopupCancelButton: {
    backgroundColor: "#1A2A4F",
    borderWidth: 1,
    borderColor: "#F4C542",
  },
  customPopupApproveButton: {
    backgroundColor: "#4BB543",
  },
  customPopupRejectButton: {
    backgroundColor: "#FF6B6B",
  },
  customPopupOkButton: {
    backgroundColor: "#F4C542",
  },
  customPopupCancelButtonText: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "bold",
  },
  customPopupConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});