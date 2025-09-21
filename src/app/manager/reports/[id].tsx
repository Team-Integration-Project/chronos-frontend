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

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  is_valid_location: boolean | null;
  distance_from_workplace_meters: number | null;
  place_name: string | null;
}

interface AttendanceRecord {
  id?: string;
  date?: string;
  entrada?: string;
  entrada_almoco?: string;
  saida?: string;
  status?: string;
  [key: string]: any; 
}

export default function ReportIndividualScreen() {
  const params = useLocalSearchParams();
  const name = params.name || "Funcionário";
  const userId = params.id as string;
  const [period, setPeriod] = useState("mes");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
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

  const formatDecimalToHours = (decimalHours: number) => {
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const extractLocationData = (attendance: any, pointType: 'entrada' | 'almoco' | 'saida'): LocationData => {
    console.log(`Extraindo dados de localização para ${pointType}:`, attendance);
    
    if (attendance[`location_${pointType}`] && typeof attendance[`location_${pointType}`] === 'object') {
      console.log(`Encontrou estrutura de objeto para ${pointType}:`, attendance[`location_${pointType}`]);
      return {
        latitude: attendance[`location_${pointType}`].latitude,
        longitude: attendance[`location_${pointType}`].longitude,
        altitude: attendance[`location_${pointType}`].altitude,
        accuracy: attendance[`location_${pointType}`].accuracy,
        is_valid_location: attendance[`location_${pointType}`].is_valid_location,
        distance_from_workplace_meters: attendance[`location_${pointType}`].distance_from_workplace_meters,
        place_name: attendance[`location_${pointType}`].place_name,
      };
    }

    const latitude = attendance[`location_${pointType}_latitude`];
    const longitude = attendance[`location_${pointType}_longitude`];
    const altitude = attendance[`location_${pointType}_altitude`];
    const accuracy = attendance[`location_${pointType}_accuracy`];
    const isValid = attendance[`location_${pointType}_is_valid`];
    const distance = attendance[`location_${pointType}_distance`];
    const placeName = attendance[`location_${pointType}_place_name`];

    if (latitude !== undefined || longitude !== undefined) {
      console.log(`Encontrou campos flat para ${pointType}:`, {
        latitude, longitude, altitude, accuracy, isValid, distance, placeName
      });
      return {
        latitude,
        longitude,
        altitude,
        accuracy,
        is_valid_location: isValid,
        distance_from_workplace_meters: distance,
        place_name: placeName,
      };
    }

    if (pointType === 'entrada' && (attendance.latitude || attendance.longitude)) {
      console.log(`Usando campos básicos como fallback para ${pointType}`);
      return {
        latitude: attendance.latitude,
        longitude: attendance.longitude,
        altitude: attendance.altitude,
        accuracy: attendance.accuracy,
        is_valid_location: attendance.is_valid_location,
        distance_from_workplace_meters: attendance.distance_from_workplace_meters,
        place_name: attendance.place_name,
      };
    }

    console.log(`Nenhum dado de localização encontrado para ${pointType}`);
    return {
      latitude: null,
      longitude: null,
      altitude: null,
      accuracy: null,
      is_valid_location: null,
      distance_from_workplace_meters: null,
      place_name: null,
    };
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
            
            .employee-info .meta p {
              margin: 4px 0;
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
              font-size: 14px;
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
              white-space: nowrap;
            }
            
            td {
              padding: 14px 12px;
              text-align: center;
              border-bottom: 1px solid #e9ecef;
              font-size: 14px;
              vertical-align: top;
              line-height: 1.2;
            }
            
            .time-cell {
              white-space: nowrap;
              font-family: monospace;
              font-weight: 600;
            }
            
            .date-cell {
              font-weight: 700;
              color: #0A1F44;
            }
            
            .location-cell {
              font-size: 13px;
              color: #333;
              max-width: 150px;
              word-wrap: break-word;
              text-align: center;
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
              .container { box-shadow: none; max-width: 100%; padding: 20px; }
              table { font-size: 12px; }
              th { font-size: 12px; padding: 12px 8px; }
              td { padding: 10px 8px; font-size: 12px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Relatório de Ponto Eletrônico - ${userName}</h1>
              <div class="subtitle">Sistema de Controle de Frequência</div>
            </div>

            <div class="employee-info">
              <h2>${userName}</h2>
              <div class="meta">
                <p>Período: ${period === 'mes' ? 'Mensal' : period === 'ano' ? 'Anual' : period === 'semana' ? 'Semanal' : 'Diário'}</p>
                <p>Relatório gerado em ${currentDate} às ${currentTime}</p>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card hours">
                <div class="stat-value">${formattedHours}</div>
                <div class="stat-label">Horas Trabalhadas</div>
              </div>
              <div class="stat-card absences">
                <div class="stat-value">${stats.total_faltas || 0}</div>
                <div class="stat-label">Faltas Registradas</div>
              </div>
              <div class="stat-card delays">
                <div class="stat-value">${stats.total_atrasos || 0}</div>
                <div class="stat-label">Atrasos (Após 07:00)</div>
              </div>
              <div class="stat-card justifications">
                <div class="stat-value">${stats.total_justificativas || 0}</div>
                <div class="stat-label">Justificativas</div>
              </div>
            </div>

            <div class="table-section">
              <h2 class="table-title">Registros de Ponto Detalhados</h2>
              ${
                attendances.length > 0
                  ? `
                <table>
                  <thead>
                    <tr>
                      <th style="width: 100px;">Data</th>
                      <th style="width: 80px;">Entrada</th>
                      <th style="width: 180px;">Local Entrada</th>
                      <th style="width: 80px;">Almoço</th>
                      <th style="width: 180px;">Local Almoço</th>
                      <th style="width: 80px;">Saída</th>
                      <th style="width: 180px;">Local Saída</th>
                      <th style="width: 100px;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${attendances
                      .map(
                        (r: AttendanceRecord, index) => {
                        
                          const locationEntrada: LocationData = extractLocationData(r, 'entrada');
                          const locationAlmoco: LocationData = extractLocationData(r, 'almoco');
                          const locationSaida: LocationData = extractLocationData(r, 'saida');
                          
                          const formattedEntrada: string = locationEntrada.place_name || '—';
                          const formattedAlmoco: string = locationAlmoco.place_name || '—';
                          const formattedSaida: string = locationSaida.place_name || '—';
                          
                          return `
                          <tr${index % 2 === 0 ? ' style="background-color: #f8f9fa;"' : ''}>
                            <td class="date-cell">${r.date || "—"}</td>
                            <td class="time-cell">${r.entrada || "—"}</td>
                            <td class="location-cell">${formattedEntrada}</td>
                            <td class="time-cell">${r.entrada_almoco || "—"}</td>
                            <td class="location-cell">${formattedAlmoco}</td>
                            <td class="time-cell">${r.saida || "—"}</td>
                            <td class="location-cell">${formattedSaida}</td>
                            <td style="font-weight: 600; color: ${r.status === 'Aprovado' ? '#4CAF50' : r.status === 'Atraso' ? '#FF9800' : r.status === 'Falta' ? '#FF6B6B' : '#666'};">
                              ${r.status || "—"}
                            </td>
                          </tr>
                        `;
                        }
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
              <div>Total de registros: ${attendances.length} | Data de geração: ${currentDate} • Horário: ${currentTime}</div>
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
      
      let csvContent = "Data,Entrada,Local_Entrada,Almoço,Local_Almoco,Saida,Local_Saida,Status\n";
      
      attendances.forEach((r) => {
        
        const locEntrada = extractLocationData(r, 'entrada');
        const locAlmoco = extractLocationData(r, 'almoco');
        const locSaida = extractLocationData(r, 'saida');
        
        const localEntrada = locEntrada.place_name ? `"${locEntrada.place_name.replace(/"/g, '""')}"` : '';
        const localAlmoco = locAlmoco.place_name ? `"${locAlmoco.place_name.replace(/"/g, '""')}"` : '';
        const localSaida = locSaida.place_name ? `"${locSaida.place_name.replace(/"/g, '""')}"` : '';
        
        csvContent += `"${r.date || ""}","${r.entrada || ""}",${localEntrada},"${r.entrada_almoco || ""}",${localAlmoco},"${r.saida || ""}",${localSaida},"${r.status || ""}"\n`;
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
                <Text style={[styles.tableCell, { minWidth: 140 }]}>Local Entrada</Text>
                <Text style={[styles.tableCell, { minWidth: 90 }]}>Almoço</Text>
                <Text style={[styles.tableCell, { minWidth: 140 }]}>Local Almoço</Text>
                <Text style={[styles.tableCell, { minWidth: 90 }]}>Saída</Text>
                <Text style={[styles.tableCell, { minWidth: 140 }]}>Local Saída</Text>
                <Text style={[styles.tableCell, { minWidth: 100 }]}>Status</Text>
              </View>
              {attendances.map((r, idx) => {
                
                const locationEntrada: LocationData = extractLocationData(r, 'entrada');
                const locationAlmoco: LocationData = extractLocationData(r, 'almoco');
                const locationSaida: LocationData = extractLocationData(r, 'saida');
                
                const formattedEntrada: string = locationEntrada.place_name || '—';
                const formattedAlmoco: string = locationAlmoco.place_name || '—';
                const formattedSaida: string = locationSaida.place_name || '—';
                
                return (
                  <View key={r.id || idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                    <Text style={[styles.tableCell, { minWidth: 100 }]}>{r.date || "—"}</Text>
                    <Text style={[styles.tableCell, { minWidth: 90 }]}>{r.entrada || "—"}</Text>
                    <Text style={[styles.tableCell, { minWidth: 140, fontSize: 14 }]} numberOfLines={2}>{formattedEntrada}</Text>
                    <Text style={[styles.tableCell, { minWidth: 90 }]}>{r.entrada_almoco || "—"}</Text>
                    <Text style={[styles.tableCell, { minWidth: 140, fontSize: 14 }]} numberOfLines={2}>{formattedAlmoco}</Text>
                    <Text style={[styles.tableCell, { minWidth: 90 }]}>{r.saida || "—"}</Text>
                    <Text style={[styles.tableCell, { minWidth: 140, fontSize: 14 }]} numberOfLines={2}>{formattedSaida}</Text>
                    <Text style={[styles.tableCell, { minWidth: 100, fontWeight: '600' as const }]}>
                      <Text style={{ 
                        color: r.status === 'Aprovado' ? '#4CAF50' : 
                                r.status === 'Atraso' ? '#FF9800' : 
                                r.status === 'Falta' ? '#FF6B6B' : '#B0B3C7' 
                      }}>
                        {r.status || "—"}
                      </Text>
                    </Text>
                  </View>
                );
              })}
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
  } as const,
  scrollContainer: {
    flex: 1,
  } as const,
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 10,
  } as const,
  header: {
    color: "#F4C542",
    fontSize: 20,
    fontWeight: "bold" as const,
    textAlign: "center",
  } as const,
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    marginTop: 2,
    justifyContent: "center",
    paddingHorizontal: 8,
  } as const,
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
  } as const,
  clickableCard: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  } as const,
  summaryValue: {
    color: "#F4C542",
    fontWeight: "bold" as const,
    fontSize: 15,
    marginBottom: 2,
  } as const,
  summaryLabel: {
    color: "#B0B3C7",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600" as const,
  } as const,
  summarySubtitle: {
    color: "#8A8FA3",
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
    fontStyle: "italic" as const,
  } as const,
  filtersSection: {
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    marginHorizontal: 12,
  } as const,
  filterLabel: {
    color: "#F4C542",
    fontWeight: "bold" as const,
    fontSize: 15,
    marginBottom: 4,
  } as const,
  filterRow: {
    flexDirection: "row",
    gap: 8,
  } as const,
  filterBtn: {
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#1A2A4F",
  } as const,
  filterBtnActive: {
    backgroundColor: "#F4C542",
    borderColor: "#F4C542",
  } as const,
  filterBtnText: {
    color: "#fff",
    fontWeight: "bold" as const,
    fontSize: 14,
  } as const,
  filterBtnTextActive: {
    color: "#0A1F44",
  } as const,
  tableSection: {
    marginHorizontal: 12,
    backgroundColor: "#142850",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  } as const,
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#F4C542",
    paddingBottom: 8,
    marginBottom: 8,
    backgroundColor: "#142850",
  } as const,
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2A4F",
    minHeight: 48,
  } as const,
  tableRowAlt: {
    backgroundColor: "#1A2A4F",
  } as const,
  tableCell: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
    minWidth: 70,
  } as const,
  downloadSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginVertical: 16,
    paddingBottom: 20,
  } as const,
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
  } as const,
  downloadBtnText: {
    color: "#0A1F44",
    fontWeight: "bold" as const,
    fontSize: 16,
  } as const,
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  } as const,
  loadingText: {
    color: "#B0B3C7",
    fontSize: 16,
    marginTop: 12,
  } as const,
  emptyText: {
    color: "#B0B3C7",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 32,
  } as const,
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    minHeight: 200,
  } as const,
  retryBtn: {
    backgroundColor: "#F4C542",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  } as const,
  retryBtnText: {
    color: "#0A1F44",
    fontWeight: "bold" as const,
    fontSize: 16,
  } as const,
  backBtn: {
    padding: 8,
  } as const,
  contentContainer: {
    flexGrow: 1,
  } as const,
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  } as const,
  modalContent: {
    backgroundColor: "#142850",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  } as const,
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  } as const,
  modalTitle: {
    color: "#F4C542",
    fontSize: 18,
    fontWeight: "bold" as const,
    flex: 1,
  } as const,
  modalLoading: {
    alignItems: "center",
    paddingVertical: 40,
  } as const,
  modalLoadingText: {
    color: "#B0B3C7",
    fontSize: 16,
    marginTop: 12,
  } as const,
  justificationsList: {
    maxHeight: 400,
  } as const,
  justificationItem: {
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  } as const,
  justificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  } as const,
  justificationDate: {
    color: "#B0B3C7",
    fontSize: 14,
    fontWeight: "600" as const,
  } as const,
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    minWidth: 80,
    justifyContent: "center",
  } as const,
  statusText: {
    color: "#333",
    fontSize: 11,
    fontWeight: "bold" as const,
  } as const,
  justificationReason: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
  } as const,
  emptyJustifications: {
    alignItems: "center",
    paddingVertical: 40,
  } as const,
  emptyJustificationsText: {
    color: "#B0B3C7",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  } as const,
});