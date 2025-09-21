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

const formatHoursToHHMM = (decimalHours: number): string => {
  if (!decimalHours || decimalHours === 0) return "00:00";
  
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatDecimalToHours = (decimalHours: number): string => {
  if (!decimalHours || decimalHours === 0) return "00:00";
  
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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

const formatLocationForPdf = (pointType: string, locationData: LocationData): string => {
  if (!locationData || !locationData.place_name) {
    return '—';
  }

  return locationData.place_name;
};

const generatePdf = async (user: any, attendances: AttendanceRecord[], stats: any, period: string): Promise<string> => {
  const userName: string = user.username || 'N/A';
  const currentDate: string = new Date().toLocaleDateString("pt-BR");
  const currentTime: string = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const formattedHours: string = formatDecimalToHours(stats.horas_trabalhadas_total || 0);

  return `
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
          max-width: 1200px;
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
          grid-template-columns: repeat(4, 1fr);
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
          font-size: 12px;
        }
        
        th {
          background: linear-gradient(135deg, #0A1F44 0%, #142850 100%);
          color: #F4C542;
          padding: 12px 8px;
          text-align: center;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        
        td {
          padding: 10px 8px;
          text-align: center;
          border-bottom: 1px solid #e9ecef;
          font-size: 11px;
          vertical-align: top;
        }
        
        .time-cell {
          font-family: 'Courier New', monospace;
          font-weight: 600;
          font-size: 12px;
          color: #0A1F44;
        }
        
        .date-cell {
          font-weight: 700;
          color: #0A1F44;
          font-size: 12px;
          white-space: nowrap;
        }
        
        .location-cell {
          font-size: 11px;
          color: #333;
          max-width: 200px;
          word-wrap: break-word;
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
          body { 
            background: white; 
            font-size: 11px;
          }
          .container { 
            box-shadow: none; 
            max-width: 100%;
            padding: 20px;
          }
          table { font-size: 10px; }
          th { font-size: 9px; padding: 8px 4px; }
          td { padding: 6px 4px; font-size: 10px; }
          .location-cell { max-width: 180px; font-size: 10px; }
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
                  <th style="width: 200px;">Local Entrada</th>
                  <th style="width: 80px;">Almoço</th>
                  <th style="width: 200px;">Local Almoço</th>
                  <th style="width: 80px;">Saída</th>
                  <th style="width: 200px;">Local Saída</th>
                  <th style="width: 100px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${attendances
                  .map(
                    (r: AttendanceRecord) => {
                      const locationEntrada: LocationData = extractLocationData(r, 'entrada');
                      const locationAlmoco: LocationData = extractLocationData(r, 'almoco');
                      const locationSaida: LocationData = extractLocationData(r, 'saida');
                      
                      const formattedEntrada: string = formatLocationForPdf('Entrada', locationEntrada);
                      const formattedAlmoco: string = formatLocationForPdf('Almoço', locationAlmoco);
                      const formattedSaida: string = formatLocationForPdf('Saída', locationSaida);
                      
                      return `
                      <tr>
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
};

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
        
        console.log("Estrutura de usuários recebida:", response.data.slice(0, 1));
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
        console.log(`Gerando PDF para usuário: ${user.username}`);
        
        const response = await api.get(`/attendance/${user.id}/?period=all`);
        const { attendances, stats } = response.data;
        
        if (attendances && attendances.length > 0) {
          console.log(`Estrutura de attendance para ${user.username}:`, {
            firstAttendance: attendances[0],
            hasLocationObjects: !!attendances[0].location_entrada,
            hasFlatFields: !!attendances[0].location_entrada_latitude
          });
        }
        
        const htmlContent = await generatePdf(user, attendances || [], stats || {}, "total");
        const fileName = `Relatorio_Ponto_${(user.username || 'User').replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

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
            console.log(`PDF salvo para ${user.username}`);
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
        console.log(`Gerando CSV para usuário: ${user.username}`);
        
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
            console.log(`CSV salvo para ${user.username}`);
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
        <Text style={styles.exportBtnText}>Exportar todos</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const generateCsvContent = (user: any, attendances: any[], stats: any, period: string, startDate: string | null, endDate: string | null) => {
  const userName = user.username || 'N/A';
  const userCpf = user.cpf || 'N/A';
  const userRole = user.role || 'N/A';

  let csv = `Informações do Funcionário\n`;
  csv += `Nome:,${userName}\n`;
  csv += `CPF:,${userCpf}\n`;
  csv += `Função:,${userRole}\n\n`;

  let periodLabel = period === 'mes' ? 'Mês' : period === 'ano' ? 'Ano' : 'Dia';
  if (startDate && endDate) {
    periodLabel = `De ${startDate} a ${endDate}`;
  }

  csv += `Estatísticas do Período (${periodLabel})\n`;
  csv += `Dias Trabalhados:,${stats?.dias_trabalhados || 0}\n`;
  csv += `Pontos Registrados:,${stats?.total_pontos_registrados || 0}\n`;
  csv += `Faltas:,${stats?.total_faltas || 0}\n`;
  csv += `Atrasos:,${stats?.total_atrasos || 0}\n`;
  csv += `Justificativas:,${stats?.total_justificativas || 0}\n`;
  csv += `Horas Trabalhadas:,${formatHoursToHHMM(stats?.horas_trabalhadas_total || 0)}\n\n`;

  if (attendances.length > 0) {
    csv += "Registros de Ponto Detalhados\n";
    csv += "Data,Entrada,Local_Entrada,Almoço,Local_Almoco,Saída,Local_Saida,Status,Observacao\n";
    
    attendances.forEach(r => {
      const locEntrada = extractLocationData(r, 'entrada');
      const locAlmoco = extractLocationData(r, 'almoco');
      const locSaida = extractLocationData(r, 'saida');
      
      const localEntrada = locEntrada.place_name ? `"${locEntrada.place_name.replace(/"/g, '""')}"` : '';
      const localAlmoco = locAlmoco.place_name ? `"${locAlmoco.place_name.replace(/"/g, '""')}"` : '';
      const localSaida = locSaida.place_name ? `"${locSaida.place_name.replace(/"/g, '""')}"` : '';
      
      csv += `"${r.date || ''}","${r.entrada || ''}",${localEntrada},"${r.entrada_almoco || ''}",${localAlmoco},"${r.saida || ''}",${localSaida},"${r.status || ''}","${r.observacao ? r.observacao.replace(/"/g, '""') : ''}"\n`;
    });
  } else {
    csv += "Registros de Ponto Detalhados\n";
    csv += "Data,Entrada,Local_Entrada,Almoço,Local_Almoco,Saída,Local_Saida,Status,Observacao\n";
    csv += "Nenhum registro encontrado,,,,,,,,,,,,,,,,,\n";
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
    paddingHorizontal: 16,
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