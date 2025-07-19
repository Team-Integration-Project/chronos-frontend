import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ButtonLogin } from "../../components/ButtonLogin";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: {
        length: password.length < minLength,
        upperCase: !hasUpperCase,
        lowerCase: !hasLowerCase,
        numbers: !hasNumbers,
        specialChar: !hasSpecialChar,
      }
    };
  };

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert("Erro", "A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    
    // Simulação de chamada à API
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        "Senha redefinida",
        "Sua senha foi redefinida com sucesso!",
        [
          {
            text: "OK",
            onPress: () => router.replace("/")
          }
        ]
      );
    }, 2000);
  };

  const renderPasswordRequirements = () => {
    const validation = validatePassword(password);
    const requirements = [
      { key: "length", text: "Mínimo 8 caracteres", met: !validation.errors.length },
      { key: "upperCase", text: "Pelo menos uma maiúscula", met: !validation.errors.upperCase },
      { key: "lowerCase", text: "Pelo menos uma minúscula", met: !validation.errors.lowerCase },
      { key: "numbers", text: "Pelo menos um número", met: !validation.errors.numbers },
      { key: "specialChar", text: "Pelo menos um caractere especial", met: !validation.errors.specialChar },
    ];

    return (
      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Requisitos da senha:</Text>
        {requirements.map((req) => (
          <View key={req.key} style={styles.requirementItem}>
            <Ionicons
              name={req.met ? "checkmark-circle" : "close-circle"}
              size={16}
              color={req.met ? "#4CAF50" : "#F44336"}
            />
            <Text style={[styles.requirementText, { color: req.met ? "#4CAF50" : "#F44336" }]}>
              {req.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Redefinir Senha</Text>
      
      <Text style={styles.subtitle}>
        Digite sua nova senha
      </Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Nova senha"
            placeholderTextColor="#B0B3C7"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
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
            placeholder="Confirmar nova senha"
            placeholderTextColor="#B0B3C7"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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

        {password.length > 0 && renderPasswordRequirements()}

        <View style={styles.buttonContainer}>
          <ButtonLogin
            icon="lock-closed-outline"
            title="Redefinir senha"
            onPress={handleResetPassword}
            isLoading={isLoading}
            backgroundColor="#F4C542"
            textColor="#333"
            iconColor="#333"
          />
        </View>

        <View style={styles.backToLoginContainer}>
          <Text style={styles.backToLoginText}>Lembrou a senha? </Text>
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Text style={styles.backToLoginLink}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1F44",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#B0B3C7",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    gap: 16,
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
  requirementsContainer: {
    backgroundColor: "#142850",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  requirementsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    marginLeft: 8,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  backToLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  backToLoginText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  backToLoginLink: {
    color: "#F4C542",
    fontWeight: "700",
    fontSize: 14,
  },
}); 