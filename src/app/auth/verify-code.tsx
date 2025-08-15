import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ButtonLogin } from "../../components/ButtonLogin";
import { router } from "expo-router";
import api from "../../services/api";

export default function VerifyResetCode() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const handleVerifyCode = async () => {
    if (!email.trim() || !code.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Por favor, digite um e-mail válido.");
      return;
    }

    if (code.length !== 6) {
      Alert.alert("Erro", "O código deve ter exatamente 6 dígitos.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/verify-reset-code/", { 
        email: email.trim(), 
        code: code.trim() 
      });

      setIsLoading(false);
      Alert.alert(
        "Código válido",
        "Agora você pode redefinir sua senha.",
        [
          {
            text: "OK",
            onPress: () => router.push({ 
              pathname: "/auth/reset-password", 
              params: { email: email.trim(), code: code.trim() } 
            })
          },
        ]
      );
    } catch (error: any) {
      setIsLoading(false);
      
      let errorMessage = "Erro ao verificar o código. Tente novamente.";
      
      if (error.response?.data) {
        errorMessage = error.response.data.error || 
                     error.response.data.detail || 
                     error.response.data.message || 
                     errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Erro", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificar Código</Text>
      <Text style={styles.subtitle}>
        Digite o e-mail e o código que você recebeu para continuar.
      </Text>

      <View style={styles.form}>
        <TextInput
          placeholder="E-mail"
          placeholderTextColor="#B0B3C7"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Código de 6 dígitos"
          placeholderTextColor="#B0B3C7"
          keyboardType="numeric"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          style={styles.input}
        />

        <View style={styles.buttonContainer}>
          <ButtonLogin
            icon="key-outline"
            title="Verificar Código"
            onPress={handleVerifyCode}
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
  input: {
    backgroundColor: "#142850",
    borderColor: "#1A2A4F",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: "#FFFFFF",
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