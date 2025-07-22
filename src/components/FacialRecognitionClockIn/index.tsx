import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from "react-native";
import { ButtonLogin } from "../ButtonLogin";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function FacialRecognitionClockIn() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [clockInType, setClockInType] = useState<"entrada" | "saida" | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);

  const handleStartScan = (type: "entrada" | "saida") => {
    setClockInType(type);
    setIsScanning(true);
    setScanProgress(0);
    setFaceDetected(false);
    setEmployeeData(null);
    
    setTimeout(() => {
      setFaceDetected(true);
      setEmployeeData({
        nome: "João Silva",
        cpf: "123.456.789-00",
        funcao: "Chefe de Obra",
        matricula: "2024001",
        empresa: "Construtora ABC Ltda"
      });
    }, 2000);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          handleScanComplete(type);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleScanComplete = (type: "entrada" | "saida") => {
    const currentTime = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    const currentDate = new Date().toLocaleDateString("pt-BR");

    Alert.alert(
      "Ponto Registrado",
      `${type === "entrada" ? "Entrada" : "Saída"} registrada com sucesso!\n\nData: ${currentDate}\nHorário: ${currentTime}`,
      [
        {
          text: "OK",
          onPress: () => {
            console.log(`Ponto ${type} registrado: ${currentDate} ${currentTime}`);
            router.replace("/manager/home");
          }
        }
      ]
    );
  };

  const handleBackToHome = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bater Ponto</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.title}>Reconhecimento Facial</Text>
      <Text style={styles.subtitle}>Posicione seu rosto na área indicada</Text>
      
      {faceDetected && employeeData ? (
        <View style={styles.userInfoContainer}>
          <View style={styles.faceDetectedHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.faceDetectedText}>Rosto Detectado</Text>
          </View>
          <Text style={styles.userInfoTitle}>Dados do Funcionário:</Text>
          <Text style={styles.userInfoText}>Nome: {employeeData.nome}</Text>
          <Text style={styles.userInfoText}>CPF: {employeeData.cpf}</Text>
          <Text style={styles.userInfoText}>Função: {employeeData.funcao}</Text>
          <Text style={styles.userInfoText}>Matrícula: {employeeData.matricula}</Text>
          <Text style={styles.userInfoText}>Empresa: {employeeData.empresa}</Text>
        </View>
      ) : (
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoTitle}>Aguardando Detecção:</Text>
          <Text style={styles.userInfoText}>Posicione seu rosto na área da câmera</Text>
          <Text style={styles.userInfoText}>Aguarde o reconhecimento facial...</Text>
        </View>
      )}

      <View style={styles.scanArea}>
        <View style={styles.cameraFrame}>
          {isScanning ? (
            <View style={styles.scanningContainer}>
              <Ionicons name="scan-outline" size={50} color="#F4C542" />
              <Text style={styles.scanningText}>Escaneando...</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${scanProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{scanProgress}%</Text>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera-outline" size={60} color="#B0B3C7" />
              <Text style={styles.placeholderText}>Área da Câmera</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instruções:</Text>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={14} color="#F4C542" />
          <Text style={styles.instructionText}>Mantenha o rosto bem iluminado</Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={14} color="#F4C542" />
          <Text style={styles.instructionText}>Olhe diretamente para a câmera</Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={14} color="#F4C542" />
          <Text style={styles.instructionText}>Mantenha-se a uma distância adequada</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {!isScanning ? (
          <View style={styles.clockInButtons}>
            <ButtonLogin
              icon="log-in-outline"
              title="Bater Entrada"
              onPress={() => handleStartScan("entrada")}
              backgroundColor="#4CAF50"
              textColor="#FFFFFF"
              iconColor="#FFFFFF"
            />
            
            <ButtonLogin
              icon="log-out-outline"
              title="Bater Saída"
              onPress={() => handleStartScan("saida")}
              backgroundColor="#F44336"
              textColor="#FFFFFF"
              iconColor="#FFFFFF"
            />
          </View>
        ) : (
          <View style={styles.scanningButton}>
            <Ionicons name="scan" size={20} color="#F4C542" />
            <Text style={styles.scanningButtonText}>
              Processando {clockInType === "entrada" ? "entrada" : "saída"}...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F44",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#F4C542",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#B0B3C7",
    textAlign: "center",
    marginBottom: 12,
  },
  userInfoContainer: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  faceDetectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  faceDetectedText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  userInfoTitle: {
    color: "#F4C542",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  userInfoText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginBottom: 3,
  },
  scanArea: {
    alignItems: "center",
    marginBottom: 16,
  },
  cameraFrame: {
    width: width * 0.8,
    height: width * 0.6,
    backgroundColor: "#142850",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F4C542",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  scanningContainer: {
    alignItems: "center",
    padding: 16,
  },
  scanningText: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 16,
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#1A2A4F",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F4C542",
    borderRadius: 4,
  },
  progressText: {
    color: "#F4C542",
    fontSize: 14,
    fontWeight: "600",
  },
  placeholderContainer: {
    alignItems: "center",
    padding: 16,
  },
  placeholderText: {
    color: "#B0B3C7",
    fontSize: 14,
    marginTop: 8,
  },
  instructionsContainer: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  instructionsTitle: {
    color: "#F4C542",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 8,
  },
  buttonContainer: {
    alignItems: "center",
  },
  clockInButtons: {
    width: "100%",
    gap: 12,
  },
  scanningButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#142850",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#F4C542",
  },
  scanningButtonText: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
}); 