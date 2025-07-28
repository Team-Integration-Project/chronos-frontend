import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Linking } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ButtonLogin } from "../ButtonLogin"; // Ajuste o caminho se necessário
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function FacialRecognitionClockIn() {
  const cameraRef = useRef<any>(null); // Ajustado para 'any' temporariamente
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [clockInType, setClockInType] = useState<"entrada" | "saida" | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleStartScan = async (type: "entrada" | "saida") => {
    if (!permission?.granted || !cameraRef.current) {
      Alert.alert("Erro", "Permissão de câmera não concedida.", [
        { text: "Abrir Configurações", onPress: () => Linking.openSettings() },
        { text: "OK" },
      ]);
      return;
    }

    setClockInType(type);
    setIsScanning(true);
    setScanProgress(0);
    setFaceDetected(false);
    setEmployeeData(null);

    try {
      const photo = await cameraRef.current.takePhotoAsync({ base64: true });
      console.log("Foto capturada:", photo.uri);
      setTimeout(() => {
        setFaceDetected(true);
        setEmployeeData({
          nome: "João Silva",
          cpf: "123.456.789-00",
          funcao: "Chefe de Obra",
          matricula: "2024001",
          empresa: "Construtora ABC Ltda",
        });
      }, 2000);
    } catch (error) {
      Alert.alert("Erro", "Falha ao capturar a foto.");
      setIsScanning(false);
    }

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          if (faceDetected) handleScanComplete(type);
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
      second: "2-digit",
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
          },
        },
      ]
    );
  };

  const handleBackToHome = () => {
    router.back();
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos da sua permissão para usar a câmera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionText}>Conceder Permissão</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.permissionButton, { marginTop: 10 }]}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.permissionText}>Abrir Configurações</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <CameraView
          ref={cameraRef}
          style={styles.cameraFrame}
          facing="front"
          ratio="4:3"
        />
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
  message: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  permissionButton: {
    backgroundColor: "#F4C542",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  permissionText: {
    color: "#0A1F44",
    fontSize: 16,
    fontWeight: "600",
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
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F4C542",
    overflow: "hidden",
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