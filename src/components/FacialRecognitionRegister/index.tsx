import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView, Linking } from "react-native";
import { CameraView, useCameraPermissions, CameraPictureOptions } from "expo-camera";
import { ButtonLogin } from "../ButtonLogin"; 
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { saveUserType } from "../../utils/userType";
import api from "../../services/api";
import { AxiosError } from "axios";

const { width } = Dimensions.get("window");

interface UserData {
  username: string;
  email: string;
  cpf: string;
  phone_number: string;
  password: string;
  confirm_password: string;
  role: string;
}

export default function FacialRecognitionRegister() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraType, setCameraType] = useState<"front" | "back">("front");
  const params = useLocalSearchParams();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    if (params.userData) {
      try {
        const data = JSON.parse(params.userData as string);
        const requiredFields = ["username", "email", "cpf", "phone_number", "password", "confirm_password", "role"];
        const missingFields = requiredFields.filter((field) => !data[field]);
        if (missingFields.length > 0) {
          throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(", ")}`);
        }
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
    if (!permission?.granted) {
      Alert.alert("Erro", "Permissão de câmera não concedida.", [
        { text: "Abrir Configurações", onPress: () => Linking.openSettings() },
        { text: "OK" },
      ]);
      return;
    }

    if (!cameraRef.current) {
      Alert.alert("Erro", "Câmera não inicializada.");
      return;
    }

    if (!userData) {
      Alert.alert("Erro", "Dados do usuário não encontrados.");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setFaceDetected(false);

    try {
      const options: CameraPictureOptions = { base64: true, quality: 0.8 };
      const photo = await cameraRef.current.takePictureAsync(options);

      if (!photo) {
        throw new Error("Falha ao capturar a imagem.");
      }

      const formData = new FormData();
      formData.append("face_image", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "face_image.jpg",
      } as any);
      formData.append("username", userData.username);
      formData.append("email", userData.email);
      formData.append("cpf", userData.cpf);
      formData.append("phone_number", userData.phone_number.replace(/\D/g, ""));
      formData.append("password", userData.password);
      formData.append("confirm_password", userData.confirm_password);
      formData.append("role", userData.role || "user");

      const response = await api.post("/register/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFaceDetected(true);
      setUserData({
        username: response.data.user.username,
        email: response.data.user.email,
        cpf: response.data.user.cpf,
        phone_number: response.data.user.phone_number,
        password: userData.password,
        confirm_password: userData.confirm_password,
        role: response.data.user.role,
      });

      handleScanComplete();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("Erro ao registrar usuário:", error.response?.data || error.message);
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.password?.[0] ||
          error.response?.data?.face_image?.[0] ||
          "Falha ao registrar usuário.";
        Alert.alert("Erro", errorMessage);
      } else {
        console.error("Erro desconhecido:", error);
        Alert.alert("Erro", "Erro inesperado ao registrar usuário.");
      }
      setIsScanning(false);
    }

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
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

    console.log("Dados do usuário registrados:", userData);
    console.log("Foto facial capturada e processada");

    Alert.alert(
      "Reconhecimento Concluído",
      "Seu rosto foi registrado com sucesso!",
      [
        {
          text: "OK",
          onPress: () => {
            console.log("Salvando tipo de usuário:", userData.role, "para email:", userData.email);
            saveUserType(userData.email, userData.role);

            Alert.alert(
              "Conta Criada",
              `Conta criada com sucesso para ${userData.username}!`,
              [
                {
                  text: "OK",
                  onPress: () => {
                    console.log("Redirecionando para login após reconhecimento facial");
                    router.replace("/manager/profile");
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleToggleCamera = () => setCameraType((prev) => (prev === "front" ? "back" : "front"));

  const handleBackToHome = () => router.back();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registro Facial</Text>
        <View style={{ width: 40 }} />
      </View>

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
          <Text style={styles.userInfoText}>Nome de Usuário: {userData.username}</Text>
          <Text style={styles.userInfoText}>Email: {userData.email}</Text>
          <Text style={styles.userInfoText}>CPF: {userData.cpf}</Text>
          <Text style={styles.userInfoText}>Telefone: {userData.phone_number}</Text>
          <Text style={styles.userInfoText}>Função: {userData.role}</Text>
        </View>
      )}

      <View style={styles.scanArea}>
        <TouchableOpacity style={styles.flipButton} onPress={handleToggleCamera}>
          <Ionicons name="camera-reverse-outline" size={24} color="#F4C542" />
        </TouchableOpacity>
        <CameraView
          ref={cameraRef}
          style={styles.cameraFrame}
          facing={cameraType}
          ratio="4:3"
        />
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instruções:</Text>
        {[
          "Mantenha o rosto bem iluminado",
          "Olhe diretamente para a câmera",
          "Mantenha-se a uma distância adequada",
        ].map((instruction, i) => (
          <View style={styles.instructionItem} key={i}>
            <Ionicons name="checkmark-circle" size={14} color="#F4C542" />
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ))}
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
          </View>
        ) : (
          <View style={styles.scanningButton}>
            <Ionicons name="scan" size={20} color="#F4C542" />
            <Text style={styles.scanningButtonText}>Processando...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F44",
  },
  scrollContent: {
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
  flipButton: {
    alignSelf: "center",
    marginBottom: 10,
    backgroundColor: "#1A2A4F",
    padding: 10,
    borderRadius: 30,
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