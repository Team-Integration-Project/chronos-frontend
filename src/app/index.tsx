import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ButtonLogin } from "../components/ButtonLogin";
import { router } from "expo-router";
import { saveUserType } from "../utils/userType";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import { AxiosError } from "axios";
import MaskInput from "react-native-mask-input";

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    role: string;
  };
}

export default function SignIn() {
  const [cpf, setCpf] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const cpfMask = [
    /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/,
  ];

  const isValidCPF = (cpf: string): boolean => {
    console.log("CPF original:", cpf);

    if (cpf.length !== 14) {
      console.log("CPF inválido: comprimento incorreto");
      return false;
    }

    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(cpf)) {
      console.log("CPF inválido: formato incorreto");
      return false;
    }

    console.log("CPF formato válido");
    return true;
  };

  const handleLogin = async () => {
    if (!cpf.trim() || !password.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    if (!isValidCPF(cpf)) {
      Alert.alert("Erro", "CPF inválido. Use o formato 123.456.789-00.");
      return;
    }

    const cleanCPF = cpf.replace(/[^\d]/g, '');
    console.log("CPF limpo enviado para API:", cleanCPF); 

    setLoading(true);
    try {
      console.log("Enviando para API:", { cpf: cleanCPF, password }); 
      const response = await api.post<LoginResponse>("/login/", { cpf: cleanCPF, password });
      const { access, refresh, user } = response.data;
      if (!access || !refresh || !user || !user.role) {
        throw new Error("Resposta da API inválida: dados incompletos.");
      }

      await AsyncStorage.setItem("accessToken", access);
      await AsyncStorage.setItem("refreshToken", refresh);
      console.log("Tokens salvos:", { access, refresh });

      const userRole = user.role.toLowerCase();
      await saveUserType(cpf, userRole); 
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
        console.log("Erro da API:", axiosError.response.data); 
        if (axiosError.response.status === 401) {
          Alert.alert("Erro", axiosError.response.data.error || "Credenciais inválidas. Verifique seu CPF e senha.");
        } else if (axiosError.response.status === 400) {
          Alert.alert("Erro", axiosError.response.data.error || "Dados inválidos. Verifique os campos informados.");
        } else {
          Alert.alert("Erro", "Ocorreu um erro ao fazer login. Tente novamente.");
        }
      } else {
        console.log("Erro de conexão:", axiosError.message); 
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
          <MaskInput
            placeholder="CPF"
            placeholderTextColor="#B0B3C7"
            keyboardType="numeric"
            style={styles.input}
            value={cpf}
            onChangeText={(masked, unmasked) => {
              console.log("Masked:", masked, "Unmasked:", unmasked); 
              setCpf(masked);
            }}
            mask={cpfMask}
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
});