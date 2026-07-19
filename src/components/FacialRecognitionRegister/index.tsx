import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView, Linking, Animated, Modal } from "react-native";
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

interface CustomSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  employeeData: UserData | null;
  isError?: boolean;
  errorMessage?: string;
}

const CustomSuccessModal: React.FC<CustomSuccessModalProps> = ({
  visible,
  onClose,
  employeeData,
  isError = false,
  errorMessage,
}) => {
  if (!visible) return null;

  const currentTime = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const currentDate = new Date().toLocaleDateString("pt-BR");

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.successIcon}>
              <Ionicons
                name={isError ? "close-circle" : "checkmark-circle"}
                size={40}
                color={isError ? "#F44336" : "#4CAF50"}
              />
            </View>
            <Text style={styles.modalTitle}>
              {isError ? "Erro no Registro" : "Registro Concluído"}
            </Text>
            <Text style={[styles.modalSubtitle, isError && styles.errorSubtitle]}>
              {isError ? errorMessage || "Falha ao registrar usuário" : "Seu rosto foi registrado com sucesso!"}
            </Text>
          </View>

          {!isError && employeeData && (
            <View style={styles.modalContent}>
              <View style={styles.timeInfo}>
                <View style={styles.timeItem}>
                  <Ionicons name="calendar-outline" size={16} color="#F4C542" />
                  <Text style={styles.timeText}>{currentDate}</Text>
                </View>
                <View style={styles.timeItem}>
                  <Ionicons name="time-outline" size={16} color="#F4C542" />
                  <Text style={styles.timeText}>{currentTime}</Text>
                </View>
              </View>

              <View style={styles.employeeInfo}>
                <Text style={styles.employeeTitle}>Dados do Funcionário:</Text>
                <View style={styles.employeeItem}>
                  <Ionicons name="person-outline" size={16} color="#F4C542" />
                  <Text style={styles.employeeText}>Nome: {employeeData?.username || "N/A"}</Text>
                </View>
                <View style={styles.employeeItem}>
                  <Ionicons name="card-outline" size={16} color="#F4C542" />
                  <Text style={styles.employeeText}>CPF: {employeeData?.cpf || "N/A"}</Text>
                </View>
                <View style={styles.employeeItem}>
                  <Ionicons name="call-outline" size={16} color="#F4C542" />
                  <Text style={styles.employeeText}>Telefone: {employeeData?.phone_number || "N/A"}</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.modalButton, isError && styles.errorButton]}
            onPress={onClose}
          >
            <Text style={[styles.modalButtonText, isError && styles.errorButtonText]}>
              {isError ? "Tentar Novamente" : "OK"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function FacialRecognitionRegister() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraType, setCameraType] = useState<"front" | "back">("front");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const params = useLocalSearchParams();
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const borderAnimation = useRef(new Animated.Value(0)).current;

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
        setErrorMessage("Dados do cadastro não encontrados. Volte ao cadastro.");
        setShowErrorModal(true);
      }
    } else {
      setErrorMessage("Dados do cadastro não encontrados. Volte ao cadastro.");
      setShowErrorModal(true);
    }
  }, [params.userData, permission, requestPermission]);

  useEffect(() => {
    if (isScanning) {
      startScanAnimation();
      startPulseAnimation();
      startBorderAnimation();
    } else {
      stopAllAnimations();
    }
  }, [isScanning]);

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startBorderAnimation = () => {
    Animated.loop(
      Animated.timing(borderAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    ).start();
  };

  const stopAllAnimations = () => {
    scanAnimation.stopAnimation();
    pulseAnimation.stopAnimation();
    borderAnimation.stopAnimation();
    scanAnimation.setValue(0);
    pulseAnimation.setValue(1);
    borderAnimation.setValue(0);
  };

  const handleStartScan = async () => {
    if (!permission?.granted) {
      setErrorMessage("Permissão de câmera não concedida.");
      setShowErrorModal(true);
      return;
    }

    if (!cameraRef.current) {
      setErrorMessage("Câmera não inicializada.");
      setShowErrorModal(true);
      return;
    }

    if (!userData) {
      setErrorMessage("Dados do usuário não encontrados.");
      setShowErrorModal(true);
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
      formData.append("cpf", userData.cpf.replace(/\D/g, ""));
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
        setErrorMessage(errorMessage);
        setShowErrorModal(true);
      } else {
        console.error("Erro desconhecido:", error);
        setErrorMessage("Erro inesperado ao registrar usuário.");
        setShowErrorModal(true);
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
      setErrorMessage("Dados do usuário não encontrados.");
      setShowErrorModal(true);
      return;
    }

    console.log("Dados do usuário registrados:", userData);
    console.log("Foto facial capturada e processada");

    setShowSuccessModal(true);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    if (userData && userData.email && userData.role) {
      saveUserType(userData.email, userData.role);
    }
    router.replace("/manager/home");
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
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

  const scanLineTranslateY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.65 - 4],
  });

  const borderColor = borderAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#F4C542", "#4CAF50", "#F4C542"],
  });

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
        
        <View style={styles.cameraContainer}>
          <Animated.View
            style={[
              styles.cameraWrapper,
              {
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          >
            <Animated.View 
              style={[
                styles.cameraFrame,
                {
                  borderColor: isScanning ? borderColor : "#F4C542",
                },
              ]}
            >
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={cameraType}
                ratio="1:1"
                mode="picture"
                zoom={0}
              />
              
              {isScanning && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [{ translateY: scanLineTranslateY }],
                    },
                  ]}
                />
              )}
              
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </Animated.View>
          </Animated.View>
          
          {isScanning && (
            <View style={styles.scanStatus}>
              <View style={styles.scanStatusDots}>
                <View style={[styles.dot, { backgroundColor: '#F4C542' }]} />
                <View style={[styles.dot, { backgroundColor: '#F4C542', opacity: 0.7 }]} />
                <View style={[styles.dot, { backgroundColor: '#F4C542', opacity: 0.4 }]} />
              </View>
              <Text style={styles.scanStatusText}>Analisando rosto...</Text>
            </View>
          )}
        </View>
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

      {/* Modal de Sucesso Personalizado */}
      <CustomSuccessModal
        visible={showSuccessModal}
        onClose={handleCloseModal}
        employeeData={userData}
      />

      {/* Modal de Erro Personalizado */}
      <CustomSuccessModal
        visible={showErrorModal}
        onClose={handleCloseErrorModal}
        employeeData={userData}
        isError={true}
        errorMessage={errorMessage}
      />
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
    flexGrow: 1,
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
  flipButton: {
    alignSelf: "center",
    marginBottom: 10,
    backgroundColor: "#1A2A4F",
    padding: 10,
    borderRadius: 30,
  },
  cameraContainer: {
    position: "relative",
    alignItems: "center",
  },
  cameraWrapper: {
    position: "relative",
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: 12,
    overflow: "hidden",
  },
  cameraFrame: {
    width: "100%",
    height: "100%",
    borderWidth: 4,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#F4C542",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  camera: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  corner: {
    position: "absolute",
    width: 25,
    height: 25,
    borderColor: "#F4C542",
  },
  topLeft: {
    top: 15,
    left: 15,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 5,
  },
  topRight: {
    top: 15,
    right: 15,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 5,
  },
  bottomLeft: {
    bottom: 15,
    left: 15,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 5,
  },
  bottomRight: {
    bottom: 15,
    right: 15,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 5,
  },
  scanStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#142850",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  scanStatusDots: {
    flexDirection: "row",
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  scanStatusText: {
    color: "#F4C542",
    fontSize: 14,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: "#0A1F44E6", 
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 350,
    borderWidth: 2,
    borderColor: "#F4C542",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  successIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#F4C542",
    textAlign: "center",
    fontWeight: "600",
  },
  modalContent: {
    marginBottom: 24,
  },
  timeInfo: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F4C542",
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  employeeInfo: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F4C542",
  },
  employeeTitle: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  employeeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 4,
  },
  employeeText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  modalButton: {
    backgroundColor: "#F4C542",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#F4C542",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonText: {
    color: "#0A1F44",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorSubtitle: {
    color: "#F44336",
  },
  errorButton: {
    backgroundColor: "#F44336",
  },
  errorButtonText: {
    color: "#FFFFFF",
  },
});