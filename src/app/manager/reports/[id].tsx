import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import api from "@/services/api";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";

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
    total_justificativas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justifications, setJustifications] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [justificationsLoading, setJustificationsLoading] = useState(false);

  // Função para converter horas decimais para HH:MM
  const formatDecimalToHours = (decimalHours: number) => {
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const getCurrentPeriodDates = () => {
    const today = new Date();
    let start: Date, end: Date;

    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    switch (period) {
      case "hoje":
        start = new Date(today);
        end = new Date(today);
        break;
      case "semana":
        const dayOfWeek = today.getDay();
        start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        end = new Date(today);
        end.setDate(today.getDate() + (6 - dayOfWeek));
        break;
      case "mes":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "ano":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return { start: formatDate(start), end: formatDate(end) };
  };

  const fetchUserJustifications = async () => {
    try {
      setJustificationsLoading(true);
      console.log(`Buscando justificativas para usuário ${userId} (${name})`);
      const response = await api.get("/justification/");

      if (response.status === 200) {
        const allJustifications = response.data;

        const userJustifications = allJustifications.filter(
          (item: any) =>
            item.user === name ||
            item.employee === name ||
            item.user_id === userId ||
            (item.user && item.user.toString() === name.toString()) ||
            (item.employee && item.employee.toString() === name.toString())
        );

        const { start, end } = getCurrentPeriodDates();

        const filteredJustifications = userJustifications.filter((item: any) => {
          const itemDate = item.date || (item.created_at ? item.created_at.split("T")[0] : null);
          if (!itemDate) return false;

          return itemDate >= start && itemDate <= end;
        });

        const formattedJustifications = filteredJustifications.map((item: any) => ({
          id: item.id ? item.id.toString() : "N/A",
          reason: item.reason || "Sem motivo",
          date: item.date || (item.created_at ? item.created_at.split("T")[0] : "N/A"),
          status: mapJustificationStatus(item),
          details: item.reason || item.details || "Sem detalhes",
        }));

        setJustifications(formattedJustifications);
        console.log("Justificativas filtradas do usuário:", formattedJustifications);
      }
    } catch (error) {
      console.error("Erro ao buscar justificativas:", error);
      Alert.alert("Erro", "Não foi possível carregar as justificativas.");
    } finally {
      setJustificationsLoading(false);
    }
  };

  const mapJustificationStatus = (item: any) => {
    if (item.status === "aprovada" || item.status === "approved") {
      return "aprovada";
    } else if (item.status === "recusada" || item.status === "rejected") {
      return "recusada";
    } else if (item.approval === true || item.approved === true) {
      return "aprovada";
    } else if (item.approval === false || item.approved === false) {
      return "recusada";
    } else {
      return "pendente";
    }
  };

  const openJustificationsModal = () => {
    fetchUserJustifications();
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovada":
        return "#4BB543";
      case "recusada":
        return "#FF6B6B";
      case "pendente":
        return "#F4C542";
      default:
        return "#B0B3C7";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovada":
        return "checkmark-circle";
      case "recusada":
        return "close-circle";
      case "pendente":
        return "time-outline";
      default:
        return "help-circle-outline";
    }
  };

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
        } else if (period === "hoje") {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(today.getDate()).padStart(2, "0");
          const formattedDate = `${year}-${month}-${day}`;
          queryParams.push(`start_date=${formattedDate}`);
          queryParams.push(`end_date=${formattedDate}`);
        } else {
          queryParams.push(`period=${period}`);
        }

        if (queryParams.length > 0) {
          apiUrl += `?${queryParams.join("&")}`;
        }

        const response = await api.get(apiUrl);
        console.log("Resposta da API:", response.data);

        const { attendances: data, total_attendances, stats: newStats } = response.data;

        if (data) {
          setAttendances(data);
        } else {
          console.warn("Dados de attendances não encontrados na resposta");
          setAttendances([]);
        }

        if (total_attendances !== undefined) {
          setTotalAttendances(total_attendances);
        } else {
          setTotalAttendances(0);
        }

        if (newStats && typeof newStats === "object") {
          const updatedStats = {
            horas_trabalhadas_total: newStats.horas_trabalhadas_total || 0,
            total_faltas: newStats.total_faltas || 0,
            total_atrasos: newStats.total_atrasos || 0,
            total_justificativas: newStats.total_justificativas || 0,
          };
          setStats(updatedStats);
          console.log("Stats atualizadas:", updatedStats);
        } else {
          console.warn("Stats não encontradas na resposta, usando valores padrão");
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
      console.error("UserId não fornecido");
      setError("ID do usuário não encontrado");
      setLoading(false);
    }
  }, [userId, period, startDate, endDate]);

  const generatePdf = async () => {
    setLoading(true);
    try {
      const userName = Array.isArray(name) ? name[0] : name;
      const currentDate = new Date().toLocaleDateString("pt-BR");
      const currentTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      // Converter horas trabalhadas para formato HH:MM
      const formattedHours = formatDecimalToHours(stats.horas_trabalhadas_total);

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
              max-width: 1000px;
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
                <div class="stat-value">${formattedHours}</div>
                <div class="stat-label">Horas Trabalhadas</div>
              </div>
              <div class="stat-card absences">
                <div class="stat-value">${stats.total_faltas}</div>
                <div class="stat-label">Faltas Registradas</div>
              </div>
              <div class="stat-card delays">
                <div class="stat-value">${stats.total_atrasos}</div>
                <div class="stat-label">Atrasos (Após 07:00)</div>
              </div>
              <div class="stat-card justifications">
                <div class="stat-value">${stats.total_justificativas}</div>
                <div class="stat-label">Justificativas</div>
              </div>
            </div>

            <div class="table-section">
              <h2 class="table-title">Registros de Ponto</h2>
              ${
                attendances.length > 0
                  ? `
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
                    ${attendances
                      .map(
                        (r) => `
                      <tr>
                        <td><strong>${r.date || "—"}</strong></td>
                        <td>${r.entrada || "—"}</td>
                        <td>${r.entrada_almoco || "—"}</td>
                        <td>${r.saida || "—"}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              `
                  : `
                <div class="no-data">
                  📅 Nenhum registro de ponto encontrado para o período selecionado
                </div>
              `
              }
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

      const fileName = `Relatorio_Ponto_${userName.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

      if (Platform.OS === "android") {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            "application/pdf"
          );
          const { uri: tempUri } = await Print.printToFileAsync({
            html: htmlContent,
            base64: false,
          });
          const fileContent = await FileSystem.readAsStringAsync(tempUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await FileSystem.writeAsStringAsync(uri, fileContent, {
            encoding: FileSystem.EncodingType.Base64,
          });
          Alert.alert("Sucesso", `PDF salvo com sucesso! Você pode acessá-lo usando um gerenciador de arquivos.`);
        } else {
          Alert.alert("Erro", "Permissão negada para acessar o diretório.");
        }
      } else {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        await Sharing.shareAsync(uri);
        Alert.alert("Sucesso", "PDF gerado com sucesso e pronto para salvar ou compartilhar!");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const generateCsv = async () => {
    setLoading(true);
    try {
      const userName = Array.isArray(name) ? name[0] : name;
      
      // Cabeçalho do CSV sem as colunas removidas
      let csvContent = "Data,Entrada,Saida_Almoco,Entrada_Almoco,Saida\n";
      
      // Adicionar dados das linhas
      attendances.forEach((r) => {
        csvContent += `${r.date || ""},${r.entrada || ""},${r.saida_almoco || ""},${r.entrada_almoco || ""},${r.saida || ""}\n`;
      });

      const fileName = `Relatorio_Ponto_${userName.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;

      if (Platform.OS === "android") {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            "text/csv"
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
      console.error("Erro ao gerar CSV:", error);
      Alert.alert("Erro", "Não foi possível gerar o CSV. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={true} style={styles.scrollContainer}>
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
            label="Justificativa"
            value={stats.total_justificativas || 0}
            color="#2196F3"
            icon="document-text-outline"
            subtitle="total enviadas"
            onPress={openJustificationsModal}
            isClickable={true}
          />
        </View>

        <View style={styles.filtersSection}>
          <Text style={styles.filterLabel}>Filtrar visualização da tabela:</Text>
          <View style={styles.filterRow}>
            <FilterBtn
              label="Hoje"
              active={period === "hoje" && !startDate}
              onPress={() => {
                setPeriod("hoje");
                setStartDate(null);
                setEndDate(null);
              }}
            />
            <FilterBtn
              label="Semana"
              active={period === "semana" && !startDate}
              onPress={() => {
                setPeriod("semana");
                setStartDate(null);
                setEndDate(null);
              }}
            />
            <FilterBtn
              label="Mês"
              active={period === "mes" && !startDate}
              onPress={() => {
                setPeriod("mes");
                setStartDate(null);
                setEndDate(null);
              }}
            />
            <FilterBtn
              label="Ano"
              active={period === "ano" && !startDate}
              onPress={() => {
                setPeriod("ano");
                setStartDate(null);
                setEndDate(null);
              }}
            />
          </View>
        </View>

        {attendances && attendances.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={{ marginHorizontal: 12, marginTop: 10 }}
            contentContainerStyle={styles.contentContainer}
          >
            <View style={styles.tableSection}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { minWidth: 100 }]}>Data</Text>
                <Text style={[styles.tableCell, { minWidth: 90 }]}>Entrada</Text>
                <Text style={[styles.tableCell, { minWidth: 110 }]}>Almoço</Text>
                <Text style={[styles.tableCell, { minWidth: 90 }]}>Saída</Text>
              </View>
              {attendances.map((r, idx) => (
                <View key={r.id || idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, { minWidth: 100 }]}>{r.date || "—"}</Text>
                  <Text style={[styles.tableCell, { minWidth: 90 }]}>{r.entrada || "—"}</Text>
                  <Text style={[styles.tableCell, { minWidth: 110 }]}>{r.entrada_almoco || "—"}</Text>
                  <Text style={[styles.tableCell, { minWidth: 90 }]}>{r.saida || "—"}</Text>
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
          <DownloadBtn label="Gerar PDF" icon="document-outline" color="#F4C542" onPress={generatePdf} />
          <DownloadBtn label="Gerar Excel" icon="grid-outline" color="#4CAF50" onPress={generateCsv} />
        </View>
      </ScrollView>

      {/* Modal de Justificativas */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Justificativas de {name}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#B0B3C7" />
              </TouchableOpacity>
            </View>

            {justificationsLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#F4C542" />
                <Text style={styles.modalLoadingText}>Carregando justificativas...</Text>
              </View>
            ) : (
              <FlatList
                data={justifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.justificationItem}>
                    <View style={styles.justificationHeader}>
                      <Text style={styles.justificationDate}>{item.date}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Ionicons name={getStatusIcon(item.status)} size={12} color="#333" />
                        <Text style={styles.statusText}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.justificationReason}>{item.reason}</Text>
                  </View>
                )}
                style={styles.justificationsList}
                ListEmptyComponent={
                  <View style={styles.emptyJustifications}>
                    <Ionicons name="document-text-outline" size={48} color="#B0B3C7" />
                    <Text style={styles.emptyJustificationsText}>
                      Nenhuma justificativa encontrada para o período selecionado
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
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
  onPress?: () => void;
  isClickable?: boolean;
};

function SummaryCard({
  label,
  value,
  color,
  icon,
  suffix = "",
  subtitle,
  onPress,
  isClickable = false,
}: SummaryCardProps) {
  const displayValue = typeof value === "number" ? value : 0;

  let formattedValue: string;
  let currentSuffix = suffix;

  if (label === "Horas") {
    const totalMinutes = Math.round(displayValue * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    formattedValue = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    currentSuffix = "";
  } else {
    formattedValue = displayValue.toString();
  }

  const CardComponent = isClickable ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[styles.summaryCard, { borderColor: color }, isClickable && styles.clickableCard]}
      onPress={onPress}
      activeOpacity={isClickable ? 0.7 : 1}
    >
      <Ionicons name={icon} size={22} color={color} style={{ marginBottom: 4 }} />
      <Text style={styles.summaryValue}>
        {formattedValue}
        {currentSuffix}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
      {isClickable && <Ionicons name="eye-outline" size={16} color="#B0B3C7" style={{ marginTop: 4 }} />}
    </CardComponent>
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
    <TouchableOpacity
      style={[styles.downloadBtn, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {icon && <Ionicons name={icon} size={20} color="#0A1F44" style={{ marginRight: 8 }} />}
      <Text style={styles.downloadBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A1F44",
  },
  scrollContainer: {
    flex: 1,
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
    width: (width - 46) / 4,
    backgroundColor: "#142850",
    minHeight: 95,
  },
  clickableCard: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 2,
  },
  summaryLabel: {
    color: "#B0B3C7",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
  },
  summarySubtitle: {
    color: "#8A8FA3",
    fontSize: 9,
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
    paddingBottom: 20,
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
    minHeight: 200,
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
  contentContainer: {
    flexGrow: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#142850",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#F4C542",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  modalLoading: {
    alignItems: "center",
    paddingVertical: 40,
  },
  modalLoadingText: {
    color: "#B0B3C7",
    fontSize: 16,
    marginTop: 12,
  },
  justificationsList: {
    maxHeight: 400,
  },
  justificationItem: {
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  justificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  justificationDate: {
    color: "#B0B3C7",
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    minWidth: 80,
    justifyContent: "center",
  },
  statusText: {
    color: "#333",
    fontSize: 11,
    fontWeight: "bold",
  },
  justificationReason: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
  },
  emptyJustifications: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyJustificationsText: {
    color: "#B0B3C7",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },
});