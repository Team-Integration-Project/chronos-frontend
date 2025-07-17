import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from "react-native";
import { ButtonLogin } from "../../components/ButtonLogin";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface UserData {
  nome: string;
  email: string;
  cpf: string;
  funcao: string;
  senha: string;
  confirmarSenha: string;
}

export default function FacialRecognition() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const params = useLocalSearchParams();

  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          handleScanComplete();
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  useEffect(() => {
    if (params.userData) {
      try {
        const data = JSON.parse(params.userData as string);
        setUserData(data);
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        Alert.alert("Erro", "Dados do cadastro não encontrados. Volte ao cadastro.");
        router.back();
      }
    } else {
      Alert.alert("Erro", "Dados do cadastro não encontrados. Volte ao cadastro.");
      router.back();
    }
  }, [params.userData]);

  const handleScanComplete = () => {
    if (!userData) {
      Alert.alert("Erro", "Dados do usuário não encontrados.");
      return;
    }

    console.log("Dados do usuário para salvar:", userData);
    console.log("Foto facial capturada e processada");

    Alert.alert(
      "Reconhecimento Concluído",
      "Seu rosto foi registrado com sucesso!",
      [
        {
          text: "OK",
          onPress: () => {
            Alert.alert(
              "Conta Criada",
              `Conta criada com sucesso para ${userData.nome}!`,
              [
                {
                  text: "OK",
                  onPress: () => router.replace("/")
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleBackToRegister = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reconhecimento Facial</Text>
      <Text style={styles.subtitle}>Posicione seu rosto na área indicada</Text>
      
      {userData && (
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoTitle}>Dados do Cadastro:</Text>
          <Text style={styles.userInfoText}>Nome: {userData.nome}</Text>
          <Text style={styles.userInfoText}>Email: {userData.email}</Text>
          <Text style={styles.userInfoText}>CPF: {userData.cpf}</Text>
          <Text style={styles.userInfoText}>Função: {userData.funcao}</Text>
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
          <ButtonLogin
            icon="camera"
            title="Iniciar Reconhecimento"
            onPress={handleStartScan}
            backgroundColor="#F4C542"
            textColor="#333"
            iconColor="#333"
          />
        ) : (
          <View style={styles.scanningButton}>
            <Ionicons name="scan" size={20} color="#F4C542" />
            <Text style={styles.scanningButtonText}>Processando...</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToRegister}
        >
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F44",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#B0B3C7",
    textAlign: "center",
    marginBottom: 16,
  },
  userInfoContainer: {
    backgroundColor: "#142850",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  userInfoTitle: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  userInfoText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 4,
  },
  scanArea: {
    alignItems: "center",
    marginBottom: 24,
  },
  cameraFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 3,
    borderColor: "#F4C542",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#142850",
  },

  scanningContainer: {
    alignItems: "center",
  },
  scanningText: {
    color: "#F4C542",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 16,
  },
  progressBar: {
    width: 200,
    height: 8,
    backgroundColor: "#1A2A4F",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F4C542",
    borderRadius: 4,
  },
  progressText: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "600",
  },
  placeholderContainer: {
    alignItems: "center",
  },
  placeholderText: {
    color: "#B0B3C7",
    fontSize: 16,
    marginTop: 16,
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  instructionText: {
    color: "#B0B3C7",
    fontSize: 14,
    marginLeft: 12,
  },
  buttonContainer: {
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  scanningButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#142850",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    width: "90%",
    justifyContent: "center",
  },
  scanningButtonText: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "600",
  },
}); 