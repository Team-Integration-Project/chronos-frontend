import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Linking, Animated, Modal } from "react-native";
import { CameraView, useCameraPermissions, CameraPictureOptions } from "expo-camera";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import api from "../../services/api";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");

interface EmployeeData {
  nome?: string;
  cpf?: string;
  phone_number?: string;
  funcao?: string;
  matricula?: string;
  empresa?: string;
  date?: string;
  last_records?: any[];
  latitude?: number;
  longitude?: number;
  is_valid_location?: boolean;
  distance_from_workplace_meters?: number;
  place_name?: string;
}

interface CustomSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  employeeData: EmployeeData | null;
  clockInType: "entrada" | "saida" | "almoco" | null;
  isError?: boolean;
  errorMessage?: string;
}

const CustomSuccessModal: React.FC<CustomSuccessModalProps> = ({ 
  visible, 
  onClose, 
  employeeData, 
  clockInType, 
  isError = false, 
  errorMessage 
}) => {
  if (!visible) return null;

  const typeText = clockInType === "entrada" ? "Entrada" : clockInType === "saida" ? "Saída" : "Almoço";
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
              {isError ? "Erro no Registro" : "Ponto Registrado"}
            </Text>
            <Text style={[styles.modalSubtitle, isError && styles.errorSubtitle]}>
              {isError ? errorMessage || "Falha ao registrar ponto" : `${typeText} registrada com sucesso!`}
            </Text>
          </View>

          {!isError && (
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
                {employeeData && (employeeData.place_name || employeeData.latitude || employeeData.longitude) && (
                  <View style={styles.timeItem}>
                    <Ionicons name="location-outline" size={16} color="#F4C542" />
                    <Text style={styles.timeText}>
                      Local do Ponto: {employeeData.place_name || `Lat: ${employeeData.latitude?.toFixed(6)}, Lon: ${employeeData.longitude?.toFixed(6)}`} 
                      - {employeeData.is_valid_location ? 'Válido' : 'Fora do raio'}
                      {employeeData.distance_from_workplace_meters ? ` (${employeeData.distance_from_workplace_meters.toFixed(2)}m do local de trabalho)` : ''}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.employeeInfo}>
                <Text style={styles.employeeTitle}>Dados do Funcionário:</Text>
                <View style={styles.employeeItem}>
                  <Ionicons name="person-outline" size={16} color="#F4C542" />
                  <Text style={styles.employeeText}>Nome: {employeeData?.nome || "N/A"}</Text>
                </View>
                <View style={styles.employeeItem}>
                  <Ionicons name="card-outline" size={16} color="#F4C542" />
                  <Text style={styles.employeeText}>CPF: {employeeData?.cpf || "N/A"}</Text>
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

export default function FacialRecognitionClockIn() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [clockInType, setClockInType] = useState<"entrada" | "saida" | "almoco" | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [cameraType, setCameraType] = useState<"front" | "back">("front");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const borderAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) requestPermission();
    if (!locationPermission) requestLocationPermission();
  }, [permission, locationPermission]);

  useEffect(() => {
    if (locationPermission?.granted) {
      (async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setLocation(loc);
          console.log('Coordenadas capturadas:', {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } catch (error) {
          console.error('Erro ao obter localização:', error);
          Alert.alert("Erro", "Falha ao obter localização: " + (error as Error).message);
        }
      })();
    }
  }, [locationPermission]);

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

  const handleStartScan = async (type: "entrada" | "saida" | "almoco") => {
    if (!permission?.granted || !cameraRef.current) {
      Alert.alert("Erro", "Permissão de câmera não concedida.", [
        { text: "Abrir Configurações", onPress: () => Linking.openSettings() },
        { text: "OK" },
      ]);
      return;
    }
    if (!locationPermission?.granted) {
      Alert.alert("Erro", "Permissão de localização não concedida.", [
        { text: "Abrir Configurações", onPress: () => Linking.openSettings() },
        { text: "OK" },
      ]);
      return;
    }
    if (!location) {
      Alert.alert("Erro", "Localização não disponível. Tente novamente.", [
        { text: "Tentar Novamente", onPress: () => requestLocationPermission() },
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
      const options: CameraPictureOptions = { base64: true, quality: 0.8 };
      const photo = await cameraRef.current.takePictureAsync(options);

      const formData = new FormData();
      formData.append("face_image", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "face_image.jpg",
      } as any);
      formData.append("point_type", type);
      formData.append("latitude", location.coords.latitude.toString());
      formData.append("longitude", location.coords.longitude.toString());

      const response = await api.post("/mark-attendance/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFaceDetected(true);
      setEmployeeData({
        nome: response.data.full_name,
        cpf: response.data.cpf,
        phone_number: response.data.phone_number,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        is_valid_location: response.data.is_valid_location,
        distance_from_workplace_meters: response.data.distance_from_workplace_meters,
        place_name: response.data.place_name
      });

      console.log('Dados recebidos do backend:', {
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        is_valid_location: response.data.is_valid_location,
        place_name: response.data.place_name
      });

      handleScanComplete(type);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Erro ao registrar ponto:", error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || "Falha ao registrar ponto");
        setShowErrorModal(true);
      } else {
        console.error("Erro desconhecido:", error);
        setErrorMessage("Erro inesperado ao registrar ponto");
        setShowErrorModal(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanComplete = (type: "entrada" | "saida" | "almoco") => {
    setShowSuccessModal(true);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const handleBackToHome = () => router.back();
  const handleToggleCamera = () => setCameraType((prev) => (prev === "front" ? "back" : "front"));

  if (!permission || !locationPermission) return <View style={styles.container} />;
  if (!permission.granted || !locationPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos da sua permissão para usar a câmera e a localização</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionText}>Conceder Permissão de Câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
          <Text style={styles.permissionText}>Conceder Permissão de Localização</Text>
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

  const scanLineTranslateY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.65 - 4],
  });

  const borderColor = borderAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#F4C542", "#4CAF50", "#F4C542"],
  });

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
          <Text style={styles.userInfoTitle}>Funcionário Reconhecido</Text>
          <Text style={styles.userInfoText}>Ponto registrado com sucesso!</Text>
        </View>
      ) : (
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoTitle}>
            {isScanning ? "Processando..." : "Aguardando Detecção:"}
          </Text>
          <Text style={styles.userInfoText}>
            {isScanning 
              ? `Reconhecendo rosto para ${clockInType === "entrada" ? "entrada" : clockInType === "saida" ? "saída" : "almoço"}...` 
              : "Posicione seu rosto na área da câmera"
            }
          </Text>
          {!isScanning && (
            <Text style={styles.userInfoText}>Selecione uma opção abaixo para iniciar</Text>
          )}
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
            <TouchableOpacity
              style={[styles.compactButton, styles.entradaButton]}
              onPress={() => handleStartScan("entrada")}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.compactButtonText}>Entrada</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.compactButton, styles.almocoButton]}
              onPress={() => handleStartScan("almoco")}
            >
              <Ionicons name="restaurant-outline" size={20} color="#FFFFFF" />
              <Text style={styles.compactButtonText}>Almoço</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.compactButton, styles.saidaButton]}
              onPress={() => handleStartScan("saida")}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.compactButtonText}>Saída</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scanningButton}>
            <Ionicons name="scan" size={20} color="#F4C542" />
            <Text style={styles.scanningButtonText}>
              Processando {clockInType === "entrada" ? "entrada" : clockInType === "saida" ? "saída" : "almoço"}...
            </Text>
          </View>
        )}
      </View>

      <CustomSuccessModal
        visible={showSuccessModal}
        onClose={handleCloseModal}
        employeeData={employeeData}
        clockInType={clockInType}
      />

      <CustomSuccessModal
        visible={showErrorModal}
        onClose={handleCloseErrorModal}
        employeeData={null}
        clockInType={clockInType}
        isError={true}
        errorMessage={errorMessage}
      />
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
  headerTitle: {
    color: "#F4C542",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
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
    alignItems: "center",
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
    textAlign: "center",
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
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: 12,
    overflow: "hidden",
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
    marginHorizontal: 18,
    marginVertical: 10,
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
    marginVertical: 4,
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  clockInButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: width - 36,
    marginHorizontal: 18,
    gap: 8,
  },
  compactButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    minHeight: 70,
  },
  entradaButton: {
    backgroundColor: "#4CAF50",
  },
  almocoButton: {
    backgroundColor: "#FF9800",
  },
  saidaButton: {
    backgroundColor: "#F44336",
  },
  compactButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  scanningButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#142850",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
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
  errorSubtitle: {
    color: "#F44336",
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
  errorButton: {
    backgroundColor: "#F44336",
  },
  modalButtonText: {
    color: "#0A1F44",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorButtonText: {
    color: "#FFFFFF",
  },
  message: {
    color: "#B0B3C7",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: "#F4C542",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 18,
    marginVertical: 5,
  },
  permissionText: {
    color: "#0A1F44",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});