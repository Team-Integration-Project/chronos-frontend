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
          let apiUrl = `/attendance/me/`;
          const queryParams = [];

          if (period === "hoje") {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            queryParams.push(`start_date=${formattedDate}`);
            queryParams.push(`end_date=${formattedDate}`);
          } else {
            queryParams.push(`period=${period}`);
          }

          if (queryParams.length > 0) {
            apiUrl += `?${queryParams.join('&')}`;
          }

          const response = await api.get(apiUrl);
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
      const currentDate = new Date().toLocaleDateString('pt-BR');
      const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6;
              color: #333;
              background: #f8f9fa;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              background: white;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #0A1F44;
            }
            
            .header h1 {
              color: #0A1F44;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 10px;
            }
            
            .header .subtitle {
              color: #666;
              font-size: 16px;
              font-weight: 400;
            }
            
            .employee-info {
              background: linear-gradient(135deg, #0A1F44 0%, #142850 100%);
              color: white;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 30px;
              text-align: center;
            }
            
            .employee-info h2 {
              font-size: 24px;
              margin-bottom: 8px;
              color: #F4C542;
            }
            
            .employee-info .meta {
              font-size: 14px;
              opacity: 0.9;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            
            .stat-card {
              background: white;
              border: 2px solid;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.07);
              transition: transform 0.2s;
            }
            
            .stat-card.hours { border-color: #4CAF50; }
            .stat-card.absences { border-color: #FF6B6B; }
            .stat-card.delays { border-color: #FF9800; }
            .stat-card.justifications { border-color: #2196F3; }
            
            .stat-value {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 5px;
              color: #0A1F44;
            }
            
            .stat-card.hours .stat-value { color: #4CAF50; }
            .stat-card.absences .stat-value { color: #FF6B6B; }
            .stat-card.delays .stat-value { color: #FF9800; }
            .stat-card.justifications .stat-value { color: #2196F3; }
            
            .stat-label {
              font-size: 14px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 600;
            }
            
            .table-section {
              margin-top: 30px;
            }
            
            .table-title {
              color: #0A1F44;
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
            }
            
            .table-title::before {
              content: "📋";
              margin-right: 10px;
              font-size: 22px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            }
            
            th {
              background: linear-gradient(135deg, #0A1F44 0%, #142850 100%);
              color: #F4C542;
              padding: 16px 12px;
              text-align: center;
              font-weight: 600;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            td {
              padding: 14px 12px;
              text-align: center;
              border-bottom: 1px solid #e9ecef;
              font-size: 14px;
            }
            
            tbody tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            
            tbody tr:hover {
              background-color: #e3f2fd;
            }
            
            .no-data {
              text-align: center;
              padding: 40px;
              color: #666;
              font-style: italic;
            }
            
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e9ecef;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            
            .footer .generated-info {
              margin-bottom: 10px;
              font-weight: 500;
            }
            
            @media print {
              body { background: white; }
              .container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Relatório de Ponto Eletrônico</h1>
              <div class="subtitle">Sistema de Controle de Frequência</div>
            </div>

            <div class="employee-info">
              <h2>${userName}</h2>
              <div class="meta">Relatório gerado em ${currentDate} às ${currentTime}</div>
            </div>

            <div class="stats-grid">
              <div class="stat-card hours">
                <div class="stat-value">${reportData.stats?.horas_trabalhadas_total?.toFixed(1) || 0}h</div>
                <div class="stat-label">Horas Trabalhadas</div>
              </div>
              <div class="stat-card absences">
                <div class="stat-value">${reportData.stats?.total_faltas || 0}</div>
                <div class="stat-label">Faltas Registradas</div>
              </div>
              <div class="stat-card delays">
                <div class="stat-value">${reportData.stats?.total_atrasos || 0}</div>
                <div class="stat-label">Atrasos (Após 07:00)</div>
              </div>
              <div class="stat-card justifications">
                <div class="stat-value">${reportData.stats?.total_justificativas || 0}</div>
                <div class="stat-label">Justificativas</div>
              </div>
            </div>

            <div class="table-section">
              <h2 class="table-title">Registros de Ponto</h2>
              ${attendances.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Entrada</th>
                      <th>Almoço</th>
                      <th>Saída</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${attendances.map(r => `
                      <tr>
                        <td><strong>${r.date || '—'}</strong></td>
                        <td>${r.entrada || '—'}</td>
                        <td>${r.entrada_almoco || '—'}</td>
                        <td>${r.saida || '—'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `
                <div class="no-data">
                  📅 Nenhum registro de ponto encontrado para o período selecionado
                </div>
              `}
            </div>

            <div class="footer">
              <div class="generated-info">
                Relatório gerado automaticamente pelo Sistema de Ponto Eletrônico
              </div>
              <div>Data de geração: ${currentDate} • Horário: ${currentTime}</div>
            </div>
          </div>
        </body>
        </html>
      `;

      const fileName = `Meu_Relatorio_Ponto_${userName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/pdf'
          );
          const { uri: tempUri } = await Print.printToFileAsync({ 
            html: htmlContent,
            base64: false
          });
          const fileContent = await FileSystem.readAsStringAsync(tempUri, { encoding: FileSystem.EncodingType.Base64 });
          await FileSystem.writeAsStringAsync(uri, fileContent, { encoding: FileSystem.EncodingType.Base64 });
          Alert.alert("Sucesso", `PDF salvo com sucesso! Você pode acessá-lo usando um gerenciador de arquivos.`);
        } else {
          Alert.alert("Erro", "Permissão negada para acessar o diretório.");
        }
      } else {
        const { uri } = await Print.printToFileAsync({ 
          html: htmlContent,
          base64: false
        });
        await Sharing.shareAsync(uri);
        Alert.alert("Sucesso", "PDF gerado com sucesso e pronto para salvar ou compartilhar!");
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
      const userName = reportData?.user || 'N/A';
      const userCpf = reportData?.stats?.cpf || 'N/A';
      const userRole = reportData?.stats?.role || 'N/A';
      const currentDate = new Date().toLocaleDateString('pt-BR');
      const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      let csvContent = `Informações do Funcionário\nNome:,${userName}\nCPF:,${userCpf}\nFunção:,Terceirizado\n\n`

      csvContent += `Estatísticas do Período (${selectedPeriod === 'mes' ? 'Mês' : selectedPeriod === 'ano' ? 'Ano' : 'Dia'})\n`;
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

      const fileName = `Meu_Relatorio_Ponto_${userName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'text/csv'
          );
          await FileSystem.writeAsStringAsync(uri, csvContent);
          Alert.alert("Sucesso", `CSV salvo com sucesso! Você pode acessá-lo usando um gerenciador de arquivos.`);
        } else {
          Alert.alert("Erro", "Permissão negada para acessar o diretório.");
        }
      } else {
        const tempPath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(tempPath, csvContent);
        await Sharing.shareAsync(tempPath);
        Alert.alert("Sucesso", "CSV gerado com sucesso e pronto para salvar ou compartilhar!");
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
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
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
              <Text style={styles.infoText}>Função: Terceirizado </Text>
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
  contentContainer: {
    flexGrow: 1,
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