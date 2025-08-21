import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "@/services/api";
import { isAxiosError } from "axios";
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get("window");

export default function ReportsScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log("Enviando requisição para /users-with-attendance/");
        const response = await api.get("/users-with-attendance/");
        setUsers(response.data);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        if (isAxiosError(error)) {
          console.error("Status:", error.response?.status);
          console.error("Data:", error.response?.data);
        }
        setError("Falha ao carregar os usuários. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const generateAllPdfs = async () => {
    setLoading(true);
    Alert.alert("Exportando PDFs", "Gerando relatórios em PDF para todos os funcionários. Isso pode levar um tempo...");
    try {
      for (const user of users) {
        const response = await api.get(`/attendance/${user.id}/?period=all`);
        const { attendances, stats } = response.data;
        const htmlContent = generatePdfContent(user, attendances || [], stats || {}, "total", null, null);
        const fileName = `Relatorio_Atendimentos_${(user.username || 'User').replace(/\s/g, '_')}.pdf`;

        if (Platform.OS === 'android') {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const uri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              'application/pdf'
            );
            const { uri: tempUri } = await Print.printToFileAsync({ html: htmlContent });
            const fileContent = await FileSystem.readAsStringAsync(tempUri, { encoding: FileSystem.EncodingType.Base64 });
            await FileSystem.writeAsStringAsync(uri, fileContent, { encoding: FileSystem.EncodingType.Base64 });
          } else {
            Alert.alert("Erro", `Permissão negada para salvar PDF para ${user.username}.`);
            return; 
          }
        } else {
          const { uri: tempUri } = await Print.printToFileAsync({ html: htmlContent });
          const finalPath = `${FileSystem.documentDirectory}${fileName}`;
          await FileSystem.copyAsync({ from: tempUri, to: finalPath });
          console.log(`PDF para ${user.username} gerado em: ${finalPath}`);
        }
      }
      Alert.alert("Sucesso", "Todos os PDFs foram gerados e salvos.");
    } catch (error) {
      console.error('Erro ao gerar todos os PDFs:', error);
      Alert.alert("Erro", "Não foi possível gerar todos os PDFs. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const generateAllCsvs = async () => {
    setLoading(true);
    Alert.alert("Exportando CSVs", "Gerando relatórios em CSV para todos os funcionários. Isso pode levar um tempo...");
    try {
      for (const user of users) {
        const response = await api.get(`/attendance/${user.id}/?period=all`);
        const { attendances, stats } = response.data;
        const csvContent = generateCsvContent(user, attendances || [], stats || {}, "total", null, null);
        const fileName = `Relatorio_Atendimentos_${(user.username || 'User').replace(/\s/g, '_')}.csv`;

        if (Platform.OS === 'android') {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const uri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              'text/csv'
            );
            await FileSystem.writeAsStringAsync(uri, csvContent);
          } else {
            Alert.alert("Erro", `Permissão negada para salvar CSV para ${user.username}.`);
            return;
          }
        } else {
          const finalPath = `${FileSystem.documentDirectory}${fileName}`;
          await FileSystem.writeAsStringAsync(finalPath, csvContent);
          console.log(`CSV para ${user.username} gerado em: ${finalPath}`);
        }
      }
      Alert.alert("Sucesso", "Todos os CSVs foram gerados e salvos.");
    } catch (error) {
      console.error('Erro ao gerar todos os CSVs:', error);
      Alert.alert("Erro", "Não foi possível gerar todos os CSVs. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.header}>Relatório de Funcionários</Text>
        <View style={{ width: 32 }} />
      </View>
      <Text style={styles.subHeader}>Toque no olho para ver detalhes</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4C542" />
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 32 }}>
          {users.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum funcionário encontrado.</Text>
          ) : (
            users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/manager/reports/[id]",
                    params: { id: user.id, name: user.username },
                  })
                }
              >
                <Text style={styles.name}>{user.username}</Text>
                <View style={styles.eyeBtn}>
                  <Ionicons name="eye-outline" size={22} color="#0A1F44" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
      <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/help" as any)}>
        <Ionicons name="help-circle-outline" size={24} color="#F4C542" />
        <Text style={styles.actionButtonText}>Ajuda</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.exportBtn} onPress={() => Alert.alert(
        "Exportar Relatórios",
        "Deseja exportar relatórios de todos os funcionários?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Exportar PDFs", onPress: generateAllPdfs },
          { text: "Exportar CSVs", onPress: generateAllCsvs },
        ]
      )} activeOpacity={0.85}>
        <Ionicons name="download-outline" size={22} color="#0A1F44" style={{ marginRight: 8 }} />
        <Text style={styles.exportBtnText}>Exportar todos para PDF</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const generatePdfContent = (user: any, attendances: any[], stats: any, period: string, startDate: string | null, endDate: string | null) => {
  const userName = user.username || 'N/A';
  const userCpf = user.cpf || 'N/A';
  const userRole = user.role || 'N/A';
  
  let periodLabel = period === 'mes' ? 'Mês' : period === 'ano' ? 'Ano' : 'Dia';
  if (startDate && endDate) {
    periodLabel = `De ${startDate} a ${endDate}`;
  }

  return `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #0A1F44; text-align: center; }
        h2 { color: #333; margin-top: 20px; }
        p { margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary-card {
          display: inline-block;
          width: 23%; /* Approx 4 cards per row */
          margin-right: 2%;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          box-sizing: border-box;
        }
        .summary-value { font-weight: bold; font-size: 1.2em; }
        .summary-label { font-size: 0.9em; color: #555; }
      </style>
    </head>
    <body>
      <h1>Relatório de Atendimentos - ${userName}</h1>
      <h2>Informações do Funcionário</h2>
      <p><strong>Nome:</strong> ${userName}</p>
      <p><strong>CPF:</strong> ${userCpf}</p>
      <p><strong>Função:</strong> ${userRole}</p>

      <h2>Estatísticas do Período (${periodLabel})</h2>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-around;">
        <div class="summary-card" style="border-color: #F4C542;">
          <p class="summary-value">${stats?.dias_trabalhados || 0}</p>
          <p class="summary-label">Dias Trabalhados</p>
        </div>
        <div class="summary-card" style="border-color: #4CAF50;">
          <p class="summary-value">${stats?.total_pontos_registrados || 0}</p>
          <p class="summary-label">Pontos Registrados</p>
        </div>
        <div class="summary-card" style="border-color: #2196F3;">
          <p class="summary-value">${stats?.total_justificativas || 0}</p>
          <p class="summary-label">Justificativas</p>
        </div>
        <div class="summary-card" style="border-color: #F4C542;">
          <p class="summary-value">${stats?.horas_trabalhadas_total || 0}</p>
          <p class="summary-label">Horas Trabalhadas</p>
        </div>
      </div>

      ${attendances.length > 0 ? `
        <h2>Registros de Ponto Detalhados</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Entrada</th>
              <th>Almoço</th>
              <th>Saída</th>
              <th>Status</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            ${attendances.map(r => `
              <tr>
                <td>${r.date || '-'}</td>
                <td>${r.entrada || '-'}</td>
                <td>${r.entrada_almoco || '-'}</td>
                <td>${r.saida || '-'}</td>
                <td>${r.status || '-'}</td>
                <td>${r.observacao || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p>Nenhum registro de ponto detalhado encontrado para este período.</p>'}
    </body>
    </html>
  `;
};

const generateCsvContent = (user: any, attendances: any[], stats: any, period: string, startDate: string | null, endDate: string | null) => {
  const userName = user.username || 'N/A';
  const userCpf = user.cpf || 'N/A';
  const userRole = user.role || 'N/A';

  let csv = `Informações do Funcionário\nNome:,${userName}\nCPF:,${userCpf}\nFunção:,${userRole}\n\n`;

  let periodLabel = period === 'mes' ? 'Mês' : period === 'ano' ? 'Ano' : 'Dia';
  if (startDate && endDate) {
    periodLabel = `De ${startDate} a ${endDate}`;
  }

  csv += `Estatísticas do Período (${periodLabel})\n`;
  csv += `Dias Trabalhados:,${stats?.dias_trabalhados || 0}\n`;
  csv += `Pontos Registrados:,${stats?.total_pontos_registrados || 0}\n`;
  csv += `Justificativas:,${stats?.total_justificativas || 0}\n`;
  csv += `Horas Trabalhadas:,${stats?.horas_trabalhadas_total || 0}\n\n`;

  if (attendances.length > 0) {
    csv += "Registros de Ponto Detalhados\n";
    csv += "Data,Entrada,Almoco,Saida,Status,Observacao\n";
    attendances.forEach(r => {
      csv += `${r.date || ''},${r.entrada || ''},${r.entrada_almoco || ''},${r.saida || ''},${r.status || ''},"${r.observacao ? r.observacao.replace(/"/g, '""') : ''}"\n`;
    });
  }
  return csv;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A1F44",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 8,
  },
  header: {
    color: "#F4C542",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  subHeader: {
    color: "#B0B3C7",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#142850",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
  },
  eyeBtn: {
    backgroundColor: "#F4C542",
    borderRadius: 20,
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4C542",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    margin: 18,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  exportBtnText: {
    color: "#0A1F44",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyText: {
    color: "#B0B3C7",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
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
    alignSelf: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  actionButtonText: {
    color: "#F4C542",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});