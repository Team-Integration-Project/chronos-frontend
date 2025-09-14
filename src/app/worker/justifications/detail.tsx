import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import api from "@/services/api";

// Definir os ícones válidos para Ionicons
type IconName =
  | "time-outline"
  | "close-circle-outline"
  | "exit-outline"
  | "alert-circle-outline"
  | "ellipsis-horizontal-circle-outline"
  | "cloud-upload-outline"
  | "document-text-outline"
  | "document-outline"
  | "image-outline"
  | "videocam-outline"
  | "musical-notes-outline"
  | "attach-outline"
  | "close-circle"
  | "send"
  | "help-circle-outline";

const TYPE_LABELS: Record<string, { title: string; icon: IconName }> = {
  atraso: { title: "Atraso", icon: "time-outline" },
  falta: { title: "Falta", icon: "close-circle-outline" },
  saida: { title: "Saída antecipada", icon: "exit-outline" },
  esquecimento: { title: "Esquecimento", icon: "alert-circle-outline" },
  outro: { title: "Outro", icon: "ellipsis-horizontal-circle-outline" },
};

interface SelectedFile {
  name: string;
  size: number;
  type?: string;
  uri: string;
}

export default function JustificationDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  const typeInfo = TYPE_LABELS[type || "outro"] || TYPE_LABELS["outro"];

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size && file.size > maxSize) {
          Alert.alert("Arquivo muito grande", "O arquivo deve ter no máximo 10MB.");
          return;
        }

        setSelectedFile({
          name: file.name,
          size: file.size || 0,
          type: file.mimeType,
          uri: file.uri,
        });
      }
    } catch (error) {
      console.error("Erro ao selecionar arquivo:", error);
      Alert.alert("Erro", "Não foi possível selecionar o arquivo.");
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, detalhe o motivo da justificativa.");
      return;
    }
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("date", new Date().toISOString().split("T")[0]);
      formData.append("reason", reason);

      if (selectedFile) {
        formData.append("attachment", {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type || "application/octet-stream",
        } as any);
      }

      const response = await api.post("/justification/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        router.replace({ pathname: "/worker/justifications/confirmation", params: { type } });
      } else {
        Alert.alert("Erro", "Falha ao enviar a justificativa. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao enviar justificativa:", error);
      Alert.alert("Erro", "Ocorreu um problema ao enviar a justificativa. Verifique sua conexão ou tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

          <View style={styles.uploadSection}>
            <Text style={styles.uploadTitle}>Anexar comprovante (opcional)</Text>

            {!selectedFile ? (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleFilePicker}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={24} color="#F4C542" />
                <Text style={styles.uploadButtonText}>Selecionar arquivo</Text>
                <Text style={styles.uploadHint}>PDF, DOC, IMG até 10MB</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.selectedFileContainer}>
                <View style={styles.fileInfo}>
                  <Ionicons name={getFileIcon(selectedFile.name)} size={24} color="#F4C542" />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={removeSelectedFile}
                  disabled={submitting}
                >
                  <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            )}
          </View>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A1F44",
  },
  scrollView: {
    flex: 1,
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
  uploadSection: {
    marginHorizontal: 18,
    marginBottom: 24,
  },
  uploadTitle: {
    color: "#B0B3C7",
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  uploadButton: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2A3D66",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  uploadHint: {
    color: "#B0B3C7",
    fontSize: 12,
    marginTop: 4,
  },
  selectedFileContainer: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  fileSize: {
    color: "#B0B3C7",
    fontSize: 12,
    marginTop: 2,
  },
  removeFileButton: {
    padding: 4,
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
  actionsSection: {
    marginTop: 20,
    marginBottom: 20,
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