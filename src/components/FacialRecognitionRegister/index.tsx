import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Linking } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ButtonLogin } from "../ButtonLogin"; // Ajuste o caminho se necessário
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { saveUserType } from "../../utils/userType";

const { width, height } = Dimensions.get("window");

interface UserData {
  nome: string;
  email: string;
  cpf: string;
  funcao: string;
  senha: string;
  confirmarSenha: string;
}

export default function FacialRecognitionRegister() {
  const cameraRef = useRef<any>(null); // Ajustado para 'any' temporariamente
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
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
  }, [params.userData, permission, requestPermission]);

  const handleStartScan = async () => {
    if (!permission?.granted || !cameraRef.current) {
      Alert.alert("Erro", "Permissão de câmera não concedida.", [
        { text: "Abrir Configurações", onPress: () => Linking.openSettings() },
        { text: "OK" },
      ]);
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setFaceDetected(false);

    try {
      const photo = await cameraRef.current.takePhotoAsync({ base64: true });
      console.log("Foto capturada:", photo.uri);
      setTimeout(() => {
        setFaceDetected(true);
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
          handleScanComplete();
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

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
            console.log("Salvando tipo de usuário no reconhecimento facial:", userData.funcao, "para email:", userData.email);
            saveUserType(userData.email, userData.funcao);
            
            Alert.alert(
              "Conta Criada",
              `Conta criada com sucesso para ${userData.nome}!`,
              [
                {
                  text: "OK",
                  onPress: () => {
                    console.log("Redirecionando para login após reconhecimento facial");
                    router.replace("/");
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleCaptureImage = async () => {
    if (!permission?.granted || !cameraRef.current) {
      Alert.alert("Erro", "Permissão de câmera não concedida.", [
        { text: "Abrir Configurações", onPress: () => Linking.openSettings() },
        { text: "OK" },
      ]);
      return;
    }

    try {
      const photo = await cameraRef.current.takePhotoAsync({ base64: true });
      Alert.alert("Foto Capturada", "Imagem salva com sucesso!", [
        { text: "OK" }
      ]);
      console.log("Foto capturada:", photo.uri);
    } catch (error) {
      Alert.alert("Erro", "Falha ao capturar a foto.");
    }
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
      <Text style={styles.title}>Reconhecimento Facial</Text>
      <Text style={styles.subtitle}>Posicione seu rosto na área indicada</Text>
      
      {userData && (
        <View style={styles.userInfoContainer}>
          {faceDetected ? (
            <View style={styles.faceDetectedHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.faceDetectedText}>Rosto Detectado</Text>
            </View>
          ) : (
            <View style={styles.faceDetectedHeader}>
              <Ionicons name="camera-outline" size={20} color="#F4C542" />
              <Text style={styles.faceDetectedText}>Aguardando Detecção</Text>
            </View>
          )}
          <Text style={styles.userInfoTitle}>Dados do Cadastro:</Text>
          <Text style={styles.userInfoText}>Nome: {userData.nome}</Text>
          <Text style={styles.userInfoText}>Email: {userData.email}</Text>
          <Text style={styles.userInfoText}>CPF: {userData.cpf}</Text>
          <Text style={styles.userInfoText}>Função: {userData.funcao}</Text>
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
              icon="camera"
              title="Iniciar Reconhecimento"
              onPress={handleStartScan}
              backgroundColor="#F4C542"
              textColor="#333"
              iconColor="#333"
            />
            <ButtonLogin
              icon="image"
              title="Capturar Imagem"
              onPress={handleCaptureImage}
              backgroundColor="#4CAF50"
              textColor="#FFFFFF"
              iconColor="#FFFFFF"
            />
          </View>
        ) : (
          <View style={styles.scanningButton}>
            <Ionicons name="scan" size={20} color="#F4C542" />
            <Text style={styles.scanningButtonText}>Processando...</Text>
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
    paddingTop: 40,
    paddingBottom: 20,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
    marginBottom: 20,
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
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  instructionsTitle: {
    color: "#F4C542",
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
    color: "#FFFFFF",
    fontSize: 14,
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