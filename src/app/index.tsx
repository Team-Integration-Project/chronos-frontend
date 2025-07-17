import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ButtonLogin } from "../components/ButtonLogin";
import { router } from "expo-router";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Por favor, digite um e-mail válido.");
      return;
    }

    console.log("Login com:", email, password);
    router.replace("/home");
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Acesso ao Sistema</Text>
        <Text style={styles.subtitle}>Sistema de Ponto Digital</Text>

        <View style={styles.form}>
        <TextInput
          placeholder="E-mail"
          placeholderTextColor="#B0B3C7"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Senha"
          placeholderTextColor="#B0B3C7"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={() => router.push("/auth/forgot-password")}
        >
          <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        <ButtonLogin
          icon="log-in-outline"
          title="Entrar"
          onPress={handleLogin}
          backgroundColor="#F4C542"
          textColor="#333"
          iconColor="#333"
        />

        <View style={styles.signUpContainer}>
          <Text style={styles.noAccountText}>Não tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/register")}>
            <Text style={styles.signUpText}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
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
  forgotPasswordContainer: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    color: "#F4C542",
    fontWeight: "600",
    fontSize: 14,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  noAccountText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  signUpText: {
    color: "#F4C542",
    fontWeight: "700",
    fontSize: 14,
  },
}); 