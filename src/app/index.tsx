import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ButtonLogin } from "../components/ButtonLogin";
import { router } from "expo-router";
import { saveUserType } from "../utils/userType";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import { AxiosError } from "axios";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Por favor, digite um e-mail válido.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/login/", { email, password });
      const { access, refresh, user } = response.data;
      if (!access || !refresh || !user || !user.role) {
        throw new Error("Resposta da API inválida: dados incompletos.");
      }

      await AsyncStorage.setItem("accessToken", access);
      await AsyncStorage.setItem("refreshToken", refresh);
      console.log("Tokens salvos:", { access, refresh }); // Log pra verificar

      const userRole = user.role.toLowerCase();
      await saveUserType(email, userRole);

      if (userRole === "admin") {
        router.replace("/manager/home");
      } else if (userRole === "user") {
        router.replace("/worker/home");
      } else {
        throw new Error("Papel do usuário inválido.");
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      if (axiosError.response) {
        if (axiosError.response.status === 401) {
          Alert.alert("Erro", axiosError.response.data.error || "Credenciais inválidas. Verifique seu e-mail e senha.");
        } else if (axiosError.response.status === 400) {
          Alert.alert("Erro", axiosError.response.data.error || "Dados inválidos. Verifique os campos informados.");
        } else {
          Alert.alert("Erro", "Ocorreu um erro ao fazer login. Tente novamente.");
        }
      } else {
        Alert.alert("Erro", axiosError.message || "Não foi possível conectar ao servidor. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
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
            editable={!loading}
          />

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Senha"
              placeholderTextColor="#B0B3C7"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#B0B3C7"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => router.push("/auth/forgot-password")}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <ButtonLogin
            icon="log-in-outline"
            title={loading ? "Carregando..." : "Entrar"}
            onPress={handleLogin}
            backgroundColor="#F4C542"
            textColor="#333"
            iconColor="#333"
            disabled={loading}
          />
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