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
  saida_almoco?: string;
  saida?: string;
  status?: string;
  [key: string]: any;
}

interface CustomPopupState {
  visible: boolean;
  type: 'pdf' | 'csv' | 'success' | 'error' | 'loading';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
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
  const [stats, setStats] = useState<{
    horas_trabalhadas_total: number;
    total_faltas: number;
    total_atrasos: number;
    total_justificativas: number;
  }>({
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

  const [customPopup, setCustomPopup] = useState<CustomPopupState>({
    visible: false,
    type: 'pdf',
    title: '',
    message: '',
    onConfirm: undefined,
    onCancel: undefined,
  });

  const formatDecimalToHours = (decimalHours: number) => {
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const extractLocationData = (attendance: any, pointType: 'entrada' | 'almoco' | 'saida'): LocationData => {
    if (attendance[`location_${pointType}`] && typeof attendance[`location_${pointType}`] === 'object') {
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

  const showCustomPopup = (
    type: CustomPopupState['type'],
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    setCustomPopup({
      visible: true,
      type,
      title,
      message,
      onConfirm,
      onCancel,
    });
  };

  const hideCustomPopup = () => {
    setCustomPopup(prev => ({ ...prev, visible: false }));
  };

  const fetchUserJustifications = async () => {
    try {
      setJustificationsLoading(true);
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
      }
    } catch (error: any) {
      console.error("Erro ao buscar justificativas:", error);
      showCustomPopup('error', 'Erro', 'Não foi possível carregar as justificativas.');
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

  const calculateWorkedHours = (attendances: AttendanceRecord[]) => {
    let totalHours = 0;
    attendances.forEach((r) => {
      if (r.entrada && r.saida && r.entrada !== '-' && r.saida !== '-') {
        const [entryHour, entryMinute] = r.entrada.split(':').map(Number);
        const [exitHour, exitMinute] = r.saida.split(':').map(Number);
        const [day, month, year] = r.date!.split('/').map(Number);
        const entryTime = new Date(year, month - 1, day, entryHour, entryMinute);
        const exitTime = new Date(year, month - 1, day, exitHour, exitMinute);
        const hours = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });
    return totalHours;
  };

  useEffect(() => {
    const fetchUserAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        setStats({
          horas_trabalhadas_total: 0,
          total_faltas: 0,
          total_atrasos: 0,
          total_justificativas: 0,
        });
  
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
        const { attendances: data, total_attendances, stats: newStats } = response.data;
  
        if (data) {
          const sortedData = [...data].sort((a, b) => {
            const dateA = new Date(a.date.split('/').reverse().join('-'));
            const dateB = new Date(b.date.split('/').reverse().join('-'));
            return dateA.getTime() - dateB.getTime();
          });
  
          const formatDateForComparison = (date: Date) => {
            return date.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
          };
  
          // Filtrar registros com presença (entrada !== '-' e status !== 'falta')
          const filteredData = sortedData.filter(r => r.entrada !== '-' && r.status !== 'falta');
  
          setAttendances(filteredData);
  
          // Recalcular horas trabalhadas no frontend
          const recalculatedHours = calculateWorkedHours(filteredData);
  
          let updatedStats = {
            horas_trabalhadas_total: recalculatedHours,
            total_faltas: 0,
            total_atrasos: Number(newStats.total_atrasos) || 0,
            total_justificativas: Number(newStats.total_justificativas) || 0,
          };
  
          // Ajustar o cálculo de faltas para o período "hoje"
          if (period === "hoje") {
            const today = new Date();
            const todayStr = formatDateForComparison(today);
            const dayData = sortedData.find(r => r.date === todayStr);
  
            console.log(`Verificando ${todayStr} (período "hoje"):`, {
              dayData: dayData ? {
                date: dayData.date,
                entrada: dayData.entrada,
                status: dayData.status,
              } : 'Sem registro',
            });
  
            if (dayData && dayData.entrada !== '-' && dayData.status !== 'falta') {
              console.log(`Presença confirmada em ${todayStr}: ${dayData.status}`);
              updatedStats.total_faltas = 0;
            } else {
              console.log(`Falta detectada em ${todayStr}`);
              updatedStats.total_faltas = 1;
            }
          } else {
            // Para outros períodos, calcular faltas a partir do primeiro ponto
            const firstPointIndex = sortedData.findIndex(r => r.entrada !== '-');
            if (firstPointIndex !== -1) {
              const firstPointDate = new Date(sortedData[firstPointIndex].date.split('/').reverse().join('-'));
              const today = new Date();
              const periodEnd = new Date(Math.min(
                new Date(sortedData[sortedData.length - 1].date.split('/').reverse().join('-')).getTime(),
                today.getTime()
              ));
  
              let currentDate = new Date(firstPointDate);
              let recalculatedFaltas = 0;
  
              console.log(`Calculando faltas de ${formatDateForComparison(firstPointDate)} até ${formatDateForComparison(periodEnd)}`);
  
              while (currentDate <= periodEnd) {
                const currentDateStr = formatDateForComparison(currentDate);
                const dayData = sortedData.find(r => r.date === currentDateStr);
  
                console.log(`Verificando ${currentDateStr}:`, {
                  dayData: dayData ? {
                    date: dayData.date,
                    entrada: dayData.entrada,
                    status: dayData.status,
                  } : 'Sem registro',
                });
  
                if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && (!dayData || dayData.status !== 'feriado_domingo')) {
                  if (!dayData || dayData.status === 'falta') {
                    recalculatedFaltas++;
                    console.log(`Falta detectada em ${currentDateStr}`);
                  } else {
                    console.log(`Presença confirmada em ${currentDateStr}: ${dayData?.status}`);
                  }
                } else {
                  console.log(`Ignorado ${currentDateStr} (sábado, domingo ou feriado)`);
                }
  
                currentDate.setDate(currentDate.getDate() + 1);
              }
  
              updatedStats.total_faltas = recalculatedFaltas;
            }
          }
  
          setStats(updatedStats);
        } else {
          setAttendances([]);
        }
  
        setTotalAttendances(total_attendances !== undefined ? total_attendances : 0);
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
      setError("ID do usuário não encontrado");
      setLoading(false);
    }
  }, [userId, period, startDate, endDate]);

  const showPdfConfirmation = () => {
    const userName = Array.isArray(name) ? name[0] : name;
    showCustomPopup(
      'pdf',
      'Gerar Relatório PDF',
      `Deseja gerar o relatório em PDF para ${userName}? O arquivo incluirá todos os dados do período selecionado.`,
      executePdfGeneration,
      hideCustomPopup
    );
  };

  const showCsvConfirmation = () => {
    const userName = Array.isArray(name) ? name[0] : name;
    showCustomPopup(
      'csv',
      'Gerar Relatório CSV',
      `Deseja gerar o relatório em CSV para ${userName}? O arquivo poderá ser aberto no Excel ou similar.`,
      executeCsvGeneration,
      hideCustomPopup
    );
  };

  const executePdfGeneration = async () => {
    try {
      hideCustomPopup();
      showCustomPopup('loading', 'Gerando PDF', 'Aguarde enquanto o relatório está sendo gerado...');
      
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
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; color: #333; background: #f8f9fa;
            }
            .container {
              max-width: 1000px; margin: 0 auto; padding: 40px;
              background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center; margin-bottom: 40px; padding-bottom: 20px;
              border-bottom: 3px solid #0A1F44;
            }
            .header h1 {
              color: #0A1F44; font-size: 28px; font-weight: 700; margin-bottom: 10px;
            }
            .header .subtitle { color: #666; font-size: 16px; font-weight: 400; }
            .employee-info {
              background: linear-gradient(135deg, #0A1F44 0%, #142850 100%);
              color: white; padding: 25px; border-radius: 12px; margin-bottom: 30px; text-align: center;
            }
            .employee-info h2 { font-size: 24px; margin-bottom: 8px; color: #F4C542; }
            .employee-info .meta { font-size: 14px; opacity: 0.9; }
            .employee-info .meta p { margin: 4px 0; }
            .stats-grid {
              display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px;
            }
            .stat-card {
              background: white; border: 2px solid; border-radius: 12px; padding: 20px;
              text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            }
            .stat-card.hours { border-color: #4CAF50; }
            .stat-card.absences { border-color: #FF6B6B; }
            .stat-card.delays { border-color: #FF9800; }
            .stat-card.justifications { border-color: #2196F3; }
            .stat-value {
              font-size: 32px; font-weight: 700; margin-bottom: 5px; color: #0A1F44;
            }
            .stat-card.hours .stat-value { color: #4CAF50; }
            .stat-card.absences .stat-value { color: #FF6B6B; }
            .stat-card.delays .stat-value { color: #FF9800; }
            .stat-card.justifications .stat-value { color: #2196F3; }
            .stat-label {
              font-size: 14px; color: #666; text-transform: uppercase;
              letter-spacing: 1px; font-weight: 600;
            }
            .table-section { margin-top: 30px; }
            .table-title {
              color: #0A1F44; font-size: 20px; font-weight: 700;
              margin-bottom: 20px; display: flex; align-items: center;
            }
            table {
              width: 100%; border-collapse: collapse; background: white;
              border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);
              font-size: 14px;
            }
            th {
              background: linear-gradient(135deg, #0A1F44 0%, #142850 100%);
              color: #F4C542; padding: 16px 12px; text-align: center; font-weight: 600;
              font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;
            }
            td {
              padding: 14px 12px; text-align: center; border-bottom: 1px solid #e9ecef;
              font-size: 14px; vertical-align: top; line-height: 1.2;
            }
            .time-cell { white-space: nowrap; font-family: monospace; font-weight: 600; }
            .date-cell { font-weight: 700; color: #0A1F44; }
            .location-cell {
              font-size: 13px; color: #333; max-width: 150px;
              word-wrap: break-word; text-align: center;
            }
            tbody tr:nth-child(even) { background-color: #f8f9fa; }
            .no-data { text-align: center; padding: 40px; color: #666; font-style: italic; }
            .footer {
              margin-top: 50px; padding-top: 20px; border-top: 2px solid #e9ecef;
              text-align: center; color: #666; font-size: 12px;
            }
            .footer .generated-info { margin-bottom: 10px; font-weight: 500; }
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
              ${attendances.length > 0
                ? `<table>
                  <thead>
                    <tr>
                      <th>Data</th><th>Entrada</th><th>Local Entrada</th>
                      <th>Almoço</th><th>Local Almoço</th><th>Saída</th>
                      <th>Local Saída</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${attendances.map((r: AttendanceRecord, index) => {
                      const locationEntrada = extractLocationData(r, 'entrada');
                      const locationAlmoco = extractLocationData(r, 'almoco');
                      const locationSaida = extractLocationData(r, 'saida');
                      
                      return `<tr${index % 2 === 0 ? ' style="background-color: #f8f9fa;"' : ''}>
                        <td class="date-cell">${r.date || "—"}</td>
                        <td class="time-cell">${r.entrada || "—"}</td>
                        <td class="location-cell">${locationEntrada.place_name || '—'}</td>
                        <td class="time-cell">${r.entrada_almoco || "—"}</td>
                        <td class="location-cell">${locationAlmoco.place_name || '—'}</td>
                        <td class="time-cell">${r.saida || "—"}</td>
                        <td class="location-cell">${locationSaida.place_name || '—'}</td>
                        <td style="font-weight: 600;">${r.status || "—"}</td>
                      </tr>`;
                    }).join("")}
                  </tbody>
                </table>`
                : `<div class="no-data">Nenhum registro de ponto encontrado para o período selecionado</div>`
              }
            </div>
            <div class="footer">
              <div class="generated-info">Relatório gerado automaticamente pelo Sistema de Ponto Eletrônico</div>
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
          
          hideCustomPopup();
          showCustomPopup('success', 'PDF Gerado!', `Relatório PDF salvo com sucesso! Você pode acessá-lo usando um gerenciador de arquivos.`);
        } else {
          hideCustomPopup();
          showCustomPopup('error', 'Erro de Permissão', 'Permissão negada para acessar o diretório.');
        }
      } else {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        await Sharing.shareAsync(uri);
        hideCustomPopup();
        showCustomPopup('success', 'PDF Gerado!', 'PDF gerado com sucesso e pronto para salvar ou compartilhar!');
      }
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      hideCustomPopup();
      showCustomPopup('error', 'Erro ao Gerar PDF', `Não foi possível gerar o PDF: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const executeCsvGeneration = async () => {
    try {
      hideCustomPopup();
      showCustomPopup('loading', 'Gerando CSV', 'Aguarde enquanto o arquivo CSV está sendo gerado...');
      
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
          hideCustomPopup();
          showCustomPopup('success', 'CSV Gerado!', `Arquivo CSV salvo com sucesso! Você pode acessá-lo usando um gerenciador de arquivos.`);
        } else {
          hideCustomPopup();
          showCustomPopup('error', 'Erro de Permissão', 'Permissão negada para acessar o diretório.');
        }
      } else {
        const tempPath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(tempPath, csvContent);
        await Sharing.shareAsync(tempPath);
        hideCustomPopup();
        showCustomPopup('success', 'CSV Gerado!', 'CSV gerado com sucesso e pronto para salvar ou compartilhar!');
      }
    } catch (error: any) {
      console.error("Erro ao gerar CSV:", error);
      hideCustomPopup();
      showCustomPopup('error', 'Erro ao Gerar CSV', `Não foi possível gerar o CSV: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const generatePdf = async () => {
    showPdfConfirmation();
  };

  const generateCsv = async () => {
    showCsvConfirmation();
  };

  const CustomPopupModal = () => {
    if (!customPopup.visible) return null;

    const getPopupIcon = () => {
      switch (customPopup.type) {
        case 'pdf': return 'document-text-outline';
        case 'csv': return 'grid-outline';
        case 'success': return 'checkmark-circle';
        case 'error': return 'alert-circle';
        case 'loading': return 'hourglass-outline';
        default: return 'help-circle-outline';
      }
    };

    const getPopupIconColor = () => {
      switch (customPopup.type) {
        case 'pdf': return '#F4C542';
        case 'csv': return '#4CAF50';
        case 'success': return '#4BB543';
        case 'error': return '#FF6B6B';
        case 'loading': return '#F4C542';
        default: return '#B0B3C7';
      }
    };

    const isConfirmationPopup = customPopup.type === 'pdf' || customPopup.type === 'csv';
    const isLoadingPopup = customPopup.type === 'loading';

    return (
      <Modal
        visible={customPopup.visible}
        transparent
        animationType="fade"
        onRequestClose={!isLoadingPopup ? hideCustomPopup : undefined}
      >
        <View style={styles.customPopupOverlay}>
          <View style={styles.customPopupContainer}>
            <View style={styles.customPopupContent}>
              <View style={styles.customPopupIconContainer}>
                {isLoadingPopup ? (
                  <ActivityIndicator size={48} color={getPopupIconColor()} />
                ) : (
                  <Ionicons 
                    name={getPopupIcon()} 
                    size={48} 
                    color={getPopupIconColor()} 
                  />
                )}
              </View>
              
              <Text style={styles.customPopupTitle}>{customPopup.title}</Text>
              <Text style={styles.customPopupMessage}>{customPopup.message}</Text>
              
              {!isLoadingPopup && (
                <View style={styles.customPopupButtons}>
                  {isConfirmationPopup ? (
                    <>
                      <TouchableOpacity
                        style={[styles.customPopupButton, styles.customPopupCancelButton]}
                        onPress={customPopup.onCancel || hideCustomPopup}
                      >
                        <Text style={styles.customPopupCancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.customPopupButton,
                          customPopup.type === 'pdf' 
                            ? styles.customPopupPdfButton 
                            : styles.customPopupCsvButton
                        ]}
                        onPress={customPopup.onConfirm || hideCustomPopup}
                      >
                        <Text style={styles.customPopupConfirmButtonText}>
                          {customPopup.type === 'pdf' ? 'Gerar PDF' : 'Gerar CSV'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.customPopupButton, styles.customPopupOkButton]}
                      onPress={hideCustomPopup}
                    >
                      <Text style={styles.customPopupConfirmButtonText}>OK</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
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

      <CustomPopupModal />
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
  const displayValue = Number(value) || 0;

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
  customPopupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  customPopupContainer: {
    backgroundColor: "#142850",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F4C542",
    width: "90%",
    maxWidth: 350,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  customPopupContent: {
    padding: 24,
    alignItems: "center",
  },
  customPopupIconContainer: {
    marginBottom: 16,
    backgroundColor: "#1A2A4F",
    borderRadius: 50,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F4C542",
    minHeight: 80,
    minWidth: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  customPopupTitle: {
    color: "#F4C542",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  customPopupMessage: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  customPopupButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  customPopupButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  customPopupCancelButton: {
    backgroundColor: "#1A2A4F",
    borderWidth: 1,
    borderColor: "#F4C542",
  },
  customPopupPdfButton: {
    backgroundColor: "#F4C542",
  },
  customPopupCsvButton: {
    backgroundColor: "#4CAF50",
  },
  customPopupOkButton: {
    backgroundColor: "#F4C542",
  },
  customPopupCancelButtonText: {
    color: "#F4C542",
    fontSize: 16,
    fontWeight: "bold",
  },
  customPopupConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});