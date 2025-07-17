import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";

const { width } = Dimensions.get("window");

const ACTIONS = [
  { id: "1", title: "Relatórios", icon: "document-text-outline", route: "/reports" },
  { id: "2", title: "Justificativas", icon: "person-remove-outline", route: "/manager-justifications" },
  { id: "3", title: "Bater Ponto", icon: "scan-circle-outline", route: "/clock-in" },
  { id: "4", title: "Perfil", icon: "person-circle-outline", route: "/profile" },
];

const SUPPORT_EMAIL = "mailto:suporte@chronos.com";

const userService = {
  getCurrentUser: (): Promise<{ name: string }> =>
    new Promise((resolve) => setTimeout(() => resolve({ name: "João" }), 800)),
};
const authService = {
  logout: (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 400)),
};

export default function HomeScreen() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    userService.getCurrentUser().then((u) => setUser(u)).finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color="#F4C542" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <Text style={styles.greeting}>Erro ao carregar dados.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Ionicons name="scan-circle-outline" size={28} color="#F4C542" style={{ marginRight: 6 }} />
          <Text style={styles.logoText}>CHRONOS</Text>
        </View>
      </View>

      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>
          Olá, <Text style={styles.greetingBold}>{user.name}</Text> 👋
        </Text>
        <Text style={styles.greetingSub}>Bem-vindo ao sistema de ponto digital</Text>
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <ActionButton {...ACTIONS[0]} />
          <ActionButton {...ACTIONS[1]} />
        </View>
        <View style={styles.gridRow}>
          <ActionButton {...ACTIONS[2]} />
          <ActionButton {...ACTIONS[3]} />
        </View>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/help" as any)}>
          <Ionicons name="help-circle-outline" size={24} color="#F4C542" />
          <Text style={styles.actionButtonText}>Ajuda</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ActionButton({ title, icon, route }: { title: string; icon: any; route: string }) {
  return (
<TouchableOpacity style={styles.actionBtn} onPress={() => router.push(route as Href)} activeOpacity={0.85}>
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={32} color="#F4C542" />
      </View>
      <Text style={styles.actionBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

const BTN_SIZE = (width - 64) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A1F44",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 40,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 22,
    letterSpacing: 1.2,
  },
  greetingContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  greeting: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "400",
    textAlign: "center",
    marginBottom: 6,
  },
  greetingBold: {
    fontWeight: "bold",
    color: "#F4C542",
  },
  greetingSub: {
    color: "#B0B3C7",
    fontSize: 15,
    textAlign: "center",
  },
  gridContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    gap: 24,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  actionBtn: {
    backgroundColor: "#142850",
    borderRadius: 18,
    width: BTN_SIZE,
    height: BTN_SIZE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconWrap: {
    backgroundColor: "#1A2A4F",
    borderRadius: 50,
    padding: 16,
    marginBottom: 10,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  helpArea: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  helpContainer: {
    alignItems: "center",
  },
  helpText: {
    color: "#B0B3C7",
    fontSize: 14,
    textAlign: "center",
  },
  helpLink: {
    color: "#F4C542",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  bottomActions: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#142850",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#F4C542",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: "#F4C542",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
});