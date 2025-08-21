import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "../../../services/api"; 
import { ComponentProps } from "react";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';

type IconName = ComponentProps<typeof Ionicons>["name"];

export default function WorkerReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState("mes");
  const [reportData, setReportData] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periods: { id: string; label: string; icon: IconName }[] = [
    { id: "hoje", label: "Dia", icon: "calendar-outline" },
    { id: "mes", label: "Mês", icon: "calendar" },
    { id: "ano", label: "Ano", icon: "calendar-clear-outline" },
  ];

  const fetchReportData = async (period: string) => {
      setLoading(true);
      setError(null);
      try {
          const response = await api.get(`/attendance/me/?period=${period}`);
          setReportData(response.data);
          setAttendances(response.data.attendances || []); 
      } catch (err: any) {
          console.error("Erro ao buscar dados do relatório:", err.response?.data || err.message);
          setError("Erro ao carregar dados do relatório.");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchReportData(selectedPeriod);
  }, [selectedPeriod]);

  const generatePdf = async () => {
    setLoading(true);
    try {
      const userName = reportData?.user || 'N/A';
      const userCpf = reportData?.stats?.cpf || 'N/A';
      const userRole = reportData?.stats?.role || 'N/A';

      const htmlContent = `
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
          <h1>Meu Relatório de Atendimentos</h1>
          <h2>Informações do Funcionário</h2>
          <p><strong>Nome:</strong> ${userName}</p>
          <p><strong>CPF:</strong> ${userCpf}</p>
          <p><strong>Função:</strong> ${userRole}</p>

          <h2>Estatísticas do Período (${selectedPeriod === 'mes' ? 'Mês' : selectedPeriod === 'ano' ? 'Ano' : 'Dia'})</h2>
          <div style="display: flex; flex-wrap: wrap; justify-content: space-around;">
            <div class="summary-card" style="border-color: #F4C542;">
              <p class="summary-value">${reportData.stats?.dias_trabalhados || 0}</p>
              <p class="summary-label">Dias Trabalhados</p>
            </div>
            <div class="summary-card" style="border-color: #4CAF50;">
              <p class="summary-value">${reportData.stats?.total_pontos_registrados || 0}</p>
              <p class="summary-label">Pontos Registrados</p>
            </div>
            <div class="summary-card" style="border-color: #2196F3;">
              <p class="summary-value">${reportData.stats?.total_justificativas || 0}</p>
              <p class="summary-label">Justificativas</p>
            </div>
            <div class="summary-card" style="border-color: #F4C542;">
              <p class="summary-value">${reportData.stats?.horas_trabalhadas_total || 0}</p>
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

      const fileName = `Meu_Relatorio_Atendimentos_${(reportData?.user || 'User').replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

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
          Alert.alert("Sucesso", `PDF salvo. Você pode acessá-lo usando um gerenciador de arquivos.`);
        } else {
          Alert.alert("Erro", "Permissão negada para acessar o diretório.");
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri);
        Alert.alert("Sucesso", "PDF gerado e pronto para salvar ou compartilhar.");
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Alert.alert("Erro", "Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const generateCsv = async () => {
    setLoading(true);
    try {
      let csvContent = `Informações do Funcionário\nNome:,${reportData?.user || 'N/A'}\nCPF:,${reportData?.stats?.cpf || 'N/A'}\nFunção:,${reportData?.stats?.role || 'N/A'}\n\nEstatísticas do Período (${selectedPeriod === 'mes' ? 'Mês' : selectedPeriod === 'ano' ? 'Ano' : 'Dia'})\n`;
      csvContent += `Dias Trabalhados:,${reportData.stats?.dias_trabalhados || 0}\n`;
      csvContent += `Pontos Registrados:,${reportData.stats?.total_pontos_registrados || 0}\n`;
      csvContent += `Justificativas:,${reportData.stats?.total_justificativas || 0}\n`;
      csvContent += `Horas Trabalhadas:,${reportData.stats?.horas_trabalhadas_total || 0}\n\n`;

      if (attendances.length > 0) {
        csvContent += "Registros de Ponto Detalhados\n";
        csvContent += "Data,Entrada,Almoco,Saida,Status,Observacao\n";
        attendances.forEach(r => {
          csvContent += `${r.date || ''},${r.entrada || ''},${r.entrada_almoco || ''},${r.saida || ''},${r.status || ''},"${r.observacao ? r.observacao.replace(/"/g, '""') : ''}"\n`;
        });
      }

      const fileName = `Meu_Relatorio_Atendimentos_${(reportData?.user || 'User').replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'text/csv'
          );
          await FileSystem.writeAsStringAsync(uri, csvContent);
          Alert.alert("Sucesso", `CSV salvo. Você pode acessá-lo usando um gerenciador de arquivos.`);
        } else {
          Alert.alert("Erro", "Permissão negada para acessar o diretório.");
        }
      } else {
        const tempPath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(tempPath, csvContent);
        await Sharing.shareAsync(tempPath);
        Alert.alert("Sucesso", "CSV gerado e pronto para salvar ou compartilhar.");
      }
    } catch (error) {
      console.error('Erro ao gerar CSV:', error);
      Alert.alert("Erro", "Não foi possível gerar o CSV. Tente novamente.");
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
        <Text style={styles.header}>Meu Relatório</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.periodFilter}>
          <Text style={styles.filterTitle}>Período:</Text>
          <View style={styles.periodButtons}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.id && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period.id)}
              >
                <Ionicons 
                  name={period.icon} 
                  size={16} 
                  color={selectedPeriod === period.id ? "#0A1F44" : "#F4C542"} 
                />
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period.id && styles.periodButtonTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Carregando relatório...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : reportData ? (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Informações do Funcionário</Text>
              <Text style={styles.infoText}>Nome: {reportData.user || 'N/A'}</Text>
              <Text style={styles.infoText}>CPF: {reportData.stats?.cpf || 'N/A'}</Text>
              <Text style={styles.infoText}>Função: {reportData.stats?.role || 'N/A'}</Text>
            </View>

            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Estatísticas do {selectedPeriod === 'mes' ? 'Mês' : selectedPeriod === 'ano' ? 'Ano' : 'Dia'}</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="time-outline" size={24} color="#F4C542" />
                  <Text style={styles.statNumber}>{reportData.stats?.dias_trabalhados || 0}</Text>
                  <Text style={styles.statLabel}>Dias Trabalhados</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
                  <Text style={styles.statNumber}>{reportData.stats?.total_pontos_registrados || 0}</Text>
                  <Text style={styles.statLabel}>Pontos Registrados</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="alert-circle-outline" size={24} color="#FF9800" />
                  <Text style={styles.statNumber}>{reportData.stats?.total_justificativas || 0}</Text>
                  <Text style={styles.statLabel}>Justificativas</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="calendar-outline" size={24} color="#2196F3" />
                  <Text style={styles.statNumber}>{reportData.stats?.horas_trabalhadas_total || 0}</Text>
                  <Text style={styles.statLabel}>Horas Trabalhadas</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>Nenhum dado de relatório disponível.</Text>
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/help" as any)}>
          <Ionicons name="help-circle-outline" size={24} color="#F4C542" />
          <Text style={styles.actionButtonText}>Ajuda</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.exportBtn} onPress={() => Alert.alert(
          "Exportar Relatório",
          "Selecione o formato de exportação",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "PDF", onPress: generatePdf },
            { text: "CSV", onPress: generateCsv },
          ]
        )} activeOpacity={0.85}>
          <Ionicons name="download-outline" size={22} color="#0A1F44" style={{ marginRight: 8 }} />
          <Text style={styles.exportBtnText}>Exportar Relatório</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  periodFilter: {
    marginBottom: 20,
  },
  filterTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: "row",
    gap: 12,
  },
  periodButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#142850",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#1A2A4F",
    gap: 6,
  },
  periodButtonActive: {
    backgroundColor: "#F4C542",
    borderColor: "#F4C542",
  },
  periodButtonText: {
    color: "#F4C542",
    fontSize: 14,
    fontWeight: "600",
  },
  periodButtonTextActive: {
    color: "#0A1F44",
  },
  infoCard: {
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  infoTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  infoText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 6,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: "#B0B3C7",
    fontSize: 12,
    textAlign: "center",
  },
  noDataText: {
    color: "#B0B3C7",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    color: "#FF6347",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#F4C542",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4C542",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
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
});