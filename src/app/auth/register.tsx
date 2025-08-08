import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Modal } from "react-native";
import { ButtonLogin } from "../../components/ButtonLogin";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { saveUserType } from "../../utils/userType";

interface RegisterForm {
  username: string;
  email: string;
  cpf: string;
  phone_number: string;
  funcao: string;
  password: string;
  confirm_password: string;
  [key: string]: string;
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterForm>({
    username: "",
    email: "",
    cpf: "",
    phone_number: "",
    funcao: "",
    password: "",
    confirm_password: "",
  });
  const [showFuncaoModal, setShowFuncaoModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const funcoes = ["Terceirizado", "Chefe de Obra"];

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    updateFormData("cpf", formatted);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    updateFormData("phone_number", formatted);
  };

  const validateForm = () => {
    const requiredFields = ["username", "email", "cpf", "phone_number", "funcao", "password", "confirm_password"];
    const emptyFields = requiredFields.filter((field) => !formData[field]);

    if (emptyFields.length > 0) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios.");
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return false;
    }

    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(formData.cpf)) {
      Alert.alert("Erro", "CPF deve estar no formato: 000.000.000-00");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Erro", "Por favor, digite um e-mail válido.");
      return false;
    }

    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      Alert.alert("Erro", "Telefone deve estar no formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    const role = formData.funcao === "Chefe de Obra" ? "admin" : "user";
    const userData = {
      ...formData,
      role,
    };

    router.push({
      pathname: "/auth/facial-recognition",
      params: { userData: JSON.stringify(userData) },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Sistema de Ponto Digital</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Nome de usuário"
            placeholderTextColor="#B0B3C7"
            autoCapitalize="none"
            value={formData.username}
            onChangeText={(value) => updateFormData("username", value)}
            style={styles.input}
          />

          <TextInput
            placeholder="E-mail"
            placeholderTextColor="#B0B3C7"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => updateFormData("email", value)}
            style={styles.input}
          />

          <TextInput
            placeholder="CPF (000.000.000-00)"
            placeholderTextColor="#B0B3C7"
            keyboardType="numeric"
            value={formData.cpf}
            onChangeText={handleCPFChange}
            style={styles.input}
            maxLength={14}
          />

          <TextInput
            placeholder="Telefone ((XX) XXXXX-XXXX)"
            placeholderTextColor="#B0B3C7"
            keyboardType="phone-pad"
            value={formData.phone_number}
            onChangeText={handlePhoneNumberChange}
            style={styles.input}
            maxLength={15}
          />

          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowFuncaoModal(true)}
          >
            <Text
              style={[
                styles.selectText,
                { color: formData.funcao ? "#FFFFFF" : "#B0B3C7" },
              ]}
            >
              {formData.funcao || "Selecione a função"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#B0B3C7" />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Senha"
              placeholderTextColor="#B0B3C7"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => updateFormData("password", value)}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#B0B3C7"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Confirmar senha"
              placeholderTextColor="#B0B3C7"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirm_password}
              onChangeText={(value) => updateFormData("confirm_password", value)}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#B0B3C7"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <ButtonLogin
              icon="camera-outline"
              title="Fazer Reconhecimento Facial"
              onPress={handleNext}
              backgroundColor="#F4C542"
              textColor="#333"
              iconColor="#333"
            />
          </View>
        </View>
      </View>

      <Modal
        visible={showFuncaoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFuncaoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Função</Text>
              <TouchableOpacity
                onPress={() => setShowFuncaoModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {funcoes.map((funcao) => (
              <TouchableOpacity
                key={funcao}
                style={styles.optionItem}
                onPress={() => {
                  updateFormData("funcao", funcao);
                  setShowFuncaoModal(false);
                }}
              >
                <Text style={styles.optionText}>{funcao}</Text>
                {formData.funcao === funcao && (
                  <Ionicons name="checkmark" size={20} color="#F4C542" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F44",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
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
    marginBottom: 32,
  },
  form: {
    gap: 16,
    marginBottom: 20,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    backgroundColor: "#142850",
    borderColor: "#1A2A4F",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 50,
    height: 56,
    fontSize: 16,
    color: "#FFFFFF",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 18,
  },
  selectInput: {
    backgroundColor: "#142850",
    borderColor: "#1A2A4F",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 16,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#142850",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 300,
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
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#0A1F44",
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});