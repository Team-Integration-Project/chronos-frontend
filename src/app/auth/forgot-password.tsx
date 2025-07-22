import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ButtonLogin } from "../../components/ButtonLogin";
import { router } from "expo-router";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Erro", "Por favor, digite seu e-mail.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Por favor, digite um e-mail válido.");
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        "E-mail enviado",
        "Verifique sua caixa de entrada para redefinir sua senha.",
        [
          {
            text: "OK",
            onPress: () => router.push("/auth/reset-password")
          }
        ]
      );
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>
      
      <Text style={styles.subtitle}>
        Digite seu e-mail para receber um link de recuperação
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

        <View style={styles.buttonContainer}>
          <ButtonLogin
            icon="mail-outline"
            title="Enviar link de recuperação"
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