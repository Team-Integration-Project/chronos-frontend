import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ButtonLogin } from "../components/ButtonLogin";
import { router } from "expo-router";
import { getUserType, saveUserType } from "../utils/userType";
import { Ionicons } from "@expo/vector-icons";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

    const userType = getUserType(email);
    
    if (userType === "Chefe de Obra") {
      router.replace("/manager/home" as any);
    } else if (userType === "Terceirizado") {
      router.replace("/worker/home" as any);
    } else {
      const isManager = email.includes('manager') || email.includes('chefe') || email.includes('admin') || email.includes('gerente');
      const isWorker = email.includes('worker') || email.includes('terceirizado') || email.includes('funcionario') || email.includes('operario');
      
      if (isManager) {
        router.replace("/manager/home" as any);
      } else if (isWorker) {
        router.replace("/worker/home" as any);
      } else {
        router.replace("/manager/home" as any);
      }
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
        />

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Senha"
            placeholderTextColor="#B0B3C7"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
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