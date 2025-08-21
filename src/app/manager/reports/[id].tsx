import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import api from "@/services/api";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';

const { width } = Dimensions.get("window");

export default function ReportIndividualScreen() {
  const params = useLocalSearchParams();
  const name = params.name || "Funcionário";
  const userId = params.id as string;
  const [period, setPeriod] = useState("mes");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [totalAttendances, setTotalAttendances] = useState(0);
  const [stats, setStats] = useState({ 
    horas_trabalhadas_total: 0, 
    total_faltas: 0, 
    total_atrasos: 0, 
    total_justificativas: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAttendance = async () => {
      try {
        setLoading(true);
        setError(null); 
        
        console.log(`Buscando dados para usuário ${userId} com período ${period}`);
        
        let apiUrl = `/attendance/${userId}/`;
        const queryParams = [];

        if (startDate && endDate) {
          queryParams.push(`start_date=${startDate}`);
          queryParams.push(`end_date=${endDate}`);
        } else {
          queryParams.push(`period=${period}`);
        }

        if (queryParams.length > 0) {
          apiUrl += `?${queryParams.join('&')}`;
        }

        const response = await api.get(apiUrl);
        console.log('Resposta da API:', response.data);
        
        const { attendances: data, total_attendances, stats: newStats } = response.data;
        
        if (data) {
          setAttendances(data);
        } else {
          console.warn('Dados de attendances não encontrados na resposta');
          setAttendances([]);
        }
        
        if (total_attendances !== undefined) {
          setTotalAttendances(total_attendances);
        } else {
          setTotalAttendances(0);
        }
        
        if (newStats && typeof newStats === 'object') {
          const updatedStats = {
            horas_trabalhadas_total: newStats.horas_trabalhadas_total || 0,
            total_faltas: newStats.total_faltas || 0,
            total_atrasos: newStats.total_atrasos || 0,
            total_justificativas: newStats.total_justificativas || 0
          };
          setStats(updatedStats);
          console.log('Stats atualizadas:', updatedStats);
          
          console.log(`📊 Estatísticas CUMULATIVAS (desde primeiro ponto):`);
          console.log(`   ⏰ ${updatedStats.horas_trabalhadas_total}h trabalhadas no total`);
          console.log(`   ❌ ${updatedStats.total_faltas} faltas acumuladas`);
          console.log(`   ⚠️ ${updatedStats.total_atrasos} atrasos (após 07:00)`);
          console.log(`   📄 ${updatedStats.total_justificativas} justificativas`);
          
          if (updatedStats.total_atrasos > 0) {
            console.log(`⚠️ ${updatedStats.total_atrasos} atraso(s) detectado(s) (entrada após 07:00)`);
          }
        } else {
          console.warn('Stats não encontradas na resposta, usando valores padrão');
          setStats({ horas_trabalhadas_total: 0, total_faltas: 0, total_atrasos: 0, total_justificativas: 0 });
        }
        
      } catch (error: any) {
        console.error("Erro ao buscar atendimentos:", error);
        
        let errorMessage = "Falha ao carregar os atendimentos. Tente novamente.";
        if (error.response?.status === 404) {
          errorMessage = "Usuário não encontrado.";
        } else if (error.response?.status === 500) {
          errorMessage = "Erro interno do servidor.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserAttendance();
    } else {
      console.error('UserId não fornecido');
      setError('ID do usuário não encontrado');
      setLoading(false);
    }
  }, [userId, period, startDate, endDate]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4C542" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#F4C542" />
          </TouchableOpacity>
          <Text style={styles.header}>Erro</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryBtn} 
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
          >
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const generatePdf = async () => {
    setLoading(true);
    try {
      const userName = Array.isArray(name) ? name[0] : name;
      const htmlContent = `
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #0A1F44; text-align: center; }
            h2 { color: #333; margin-top: 20px; }
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
          <h1>Relatório de Atendimentos</h1>
          <h2>Detalhes do Usuário: ${userName}</h2>

          <h2>Estatísticas Gerais</h2>
          <div style="display: flex; flex-wrap: wrap; justify-content: space-around;">
            <div class="summary-card" style="border-color: #4CAF50;">
              <p class="summary-value">${stats.horas_trabalhadas_total.toFixed(1)}h</p>
              <p class="summary-label">Horas Trabalhadas</p>
            </div>
            <div class="summary-card" style="border-color: #FF6B6B;">
              <p class="summary-value">${stats.total_faltas}</p>
              <p class="summary-label">Faltas</p>
            </div>
            <div class="summary-card" style="border-color: #FF9800;">
              <p class="summary-value">${stats.total_atrasos}</p>
              <p class="summary-label">Atrasos</p>
            </div>
            <div class="summary-card" style="border-color: #2196F3;">
              <p class="summary-value">${stats.total_justificativas}</p>
              <p class="summary-label">Justificativas</p>
            </div>
          </div>

          <h2>Registros de Ponto</h2>
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
        </body>
        </html>
      `;

      const fileName = `Relatorio_Atendimentos_${userName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

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
      const userName = Array.isArray(name) ? name[0] : name;
      let csvContent = "Data,Entrada,Almoco,Saida,Status,Observacao\n";
      attendances.forEach(r => {
        csvContent += `${r.date || ''},${r.entrada || ''},${r.entrada_almoco || ''},${r.saida || ''},${r.status || ''},"${r.observacao ? r.observacao.replace(/"/g, '""') : ''}"\n`;
      });

      const fileName = `Relatorio_Atendimentos_${userName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F4C542" />
        </TouchableOpacity>
        <Text style={styles.header}>{name}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.summaryRow}>
        <SummaryCard 
          label="Horas" 
          value={stats.horas_trabalhadas_total || 0} 
          color="#4CAF50" 
          icon="time-outline" 
          suffix="h"
          subtitle="total acumulado"
        />
        <SummaryCard 
          label="Faltas" 
          value={stats.total_faltas || 0} 
          color="#FF6B6B" 
          icon="close-circle-outline" 
          subtitle="total geral"
        />
        <SummaryCard 
          label="Atrasos" 
          value={stats.total_atrasos || 0} 
          color="#FF9800" 
          icon="alert-circle-outline" 
          subtitle="após 07:00"
        />
        <SummaryCard 
          label="Justificativas" 
          value={stats.total_justificativas || 0} 
          color="#2196F3" 
          icon="document-text-outline" 
          subtitle="total enviadas"
        />
      </View>
      

      
      <View style={styles.filtersSection}>
        <Text style={styles.filterLabel}>Filtrar visualização da tabela:</Text>
        <View style={styles.filterRow}>
          <FilterBtn label="Hoje" active={period === "hoje" && !startDate} onPress={() => { setPeriod("hoje"); setStartDate(null); setEndDate(null); }} />
          <FilterBtn label="Semana" active={period === "semana" && !startDate} onPress={() => { setPeriod("semana"); setStartDate(null); setEndDate(null); }} />
          <FilterBtn label="Mês" active={period === "mes" && !startDate} onPress={() => { setPeriod("mes"); setStartDate(null); setEndDate(null); }} />
          <FilterBtn label="Ano" active={period === "ano" && !startDate} onPress={() => { setPeriod("ano"); setStartDate(null); setEndDate(null); }} />

        </View>
      </View>
      
      {attendances && attendances.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true} 
          style={{ marginHorizontal: 12, marginTop: 10 }} 
          contentContainerStyle={{ minWidth: 900, paddingBottom: 32 }}
        >
          <View style={styles.tableSection}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { minWidth: 100 }]}>Data</Text>
              <Text style={[styles.tableCell, { minWidth: 90 }]}>Entrada</Text>
              <Text style={[styles.tableCell, { minWidth: 110 }]}>Almoço</Text>
              <Text style={[styles.tableCell, { minWidth: 110 }]}>Saída</Text>
              <Text style={[styles.tableCell, { minWidth: 110 }]}>Status</Text>
              <Text style={[styles.tableCell, { minWidth: 180 }]}>Observação</Text>
            </View>
            {attendances.map((r, idx) => (
              <View key={r.id || idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, { minWidth: 100 }]}>{r.date || '-'}</Text>
                <Text style={[styles.tableCell, { minWidth: 90 }]}>{r.entrada || '-'}</Text>
                <Text style={[styles.tableCell, { minWidth: 110 }]}>{r.entrada_almoco || '-'}</Text>
                <Text style={[styles.tableCell, { minWidth: 110 }]}>{r.saida || '-'}</Text>
                <Text style={[styles.tableCell, { minWidth: 110 }]}>
                  <StatusBadge status={r.status || 'Pendente'} />
                </Text>
                <Text 
                  style={[styles.tableCell, { minWidth: 180 }]} 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {r.observacao || '-'}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#B0B3C7" />
          <Text style={styles.emptyText}>
            Nenhum registro encontrado para o período selecionado
          </Text>
        </View>
      )}
      
      <View style={styles.downloadSection}>
        <DownloadBtn label="PDF" icon="document-outline" color="#F4C542" onPress={generatePdf} />
        <DownloadBtn label="Excel" icon="logo-microsoft" color="#4CAF50" onPress={generateCsv} />
      </View>
    </SafeAreaView>
  );
}

type SummaryCardProps = { 
  label: string; 
  value: number; 
  color: string; 
  icon: any; 
  suffix?: string; 
  subtitle?: string;
};
function SummaryCard({ label, value, color, icon, suffix = "", subtitle }: SummaryCardProps) {
  const displayValue = typeof value === 'number' ? value : 0;
  const formattedValue = label === "Horas" ? displayValue.toFixed(1) : displayValue.toString();
  
  return (
    <View style={[styles.summaryCard, { borderColor: color }]}>
      <Ionicons name={icon} size={22} color={color} style={{ marginBottom: 4 }} />
      <Text style={styles.summaryValue}>
        {formattedValue}{suffix}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      {subtitle && (
        <Text style={styles.summarySubtitle}>{subtitle}</Text>
      )}
    </View>
  );
}

type FilterBtnProps = { label: string; active: boolean; onPress: () => void };
function FilterBtn({ label, active, onPress }: FilterBtnProps) {
  return (
    <TouchableOpacity
      style={[styles.filterBtn, active && styles.filterBtnActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

type DownloadBtnProps = { label: string; color: string; icon: any; onPress: () => void };
function DownloadBtn({ label, color, icon, onPress }: DownloadBtnProps) {
  return (
    <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.85}>
      {icon && <Ionicons name={icon} size={20} color="#0A1F44" style={{ marginRight: 8 }} />}
      <Text style={styles.downloadBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

type StatusBadgeProps = { status: string };
function StatusBadge({ status }: StatusBadgeProps) {
  let color = '#B0B3C7';
  let bg = '#222B44';
  let label = status || 'Pendente';
  
  switch (status) {
    case 'Aprovado':
      color = '#fff';
      bg = '#4CAF50';
      break;
    case 'Atraso':
      color = '#fff';
      bg = '#FF9800'; 
      break;
    case 'Falta':
      color = '#fff';
      bg = '#FF6B6B';
      break;
    case 'Pendente':
      color = '#0A1F44';
      bg = '#F4C542';
      break;
    default:
      color = '#B0B3C7';
      bg = '#222B44';
  }
  
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
    </View>
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
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 10,
  },
  header: {
    color: "#F4C542",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    marginTop: 2,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  summaryCard: {
    borderWidth: 2,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    flex: 1,
    maxWidth: 85,
    backgroundColor: "#142850",
    minHeight: 95,
  },
  summaryValue: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
  },
  summaryLabel: {
    color: "#B0B3C7",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  summarySubtitle: {
    color: "#8A8FA3",
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
    fontStyle: "italic",
  },
  filtersSection: {
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    marginHorizontal: 12,
  },
  filterLabel: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 4,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  },
  filterBtnActive: {
    backgroundColor: "#F4C542",
    borderColor: "#F4C542",
  },
  filterBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  filterBtnTextActive: {
    color: "#0A1F44",
  },
  tableSection: {
    marginHorizontal: 12,
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#F4C542",
    paddingBottom: 8,
    marginBottom: 8,
    backgroundColor: "#142850",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2A4F",
    minHeight: 48,
  },
  tableRowAlt: {
    backgroundColor: "#1A2A4F",
  },
  tableCell: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
    minWidth: 70,
  },
  downloadSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginVertical: 16,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  downloadBtnText: {
    color: "#0A1F44",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#B0B3C7",
    fontSize: 16,
    marginTop: 12,
  },
  emptyText: {
    color: "#B0B3C7",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  retryBtn: {
    backgroundColor: "#F4C542",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  retryBtnText: {
    color: "#0A1F44",
    fontWeight: "bold",
    fontSize: 16,
  },
  backBtn: {
    padding: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    alignSelf: 'center',
  },
  statusBadgeText: {
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
});