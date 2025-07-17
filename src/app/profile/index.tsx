import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Modal, TextInput, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const USER = {
  nome: "João Silva",
  email: "joao.silva@empresa.com",
  funcao: "",
  empresa: "Construtora ABC Ltda",
  cpf: "123.456.789-00",
  dataCadastro: "2024-06-01",
};

const FUNCOES = ["Chefe de Obra", "Terceirizado"];

const FUNCOES_CIVIL: { nome: string; icone: string }[] = [
  { nome: 'Chefe de Obra', icone: 'business-outline' },
  { nome: 'Pedreiro', icone: 'hammer-outline' },
  { nome: 'Servente', icone: 'construct-outline' },
  { nome: 'Armador', icone: 'build-outline' },
  { nome: 'Carpinteiro', icone: 'cut-outline' },
  { nome: 'Eletricista', icone: 'flash-outline' },
  { nome: 'Encanador', icone: 'water-outline' },
  { nome: 'Pintor', icone: 'color-palette-outline' },
  { nome: 'Mestre de Obras', icone: 'school-outline' },
  { nome: 'Técnico de Segurança', icone: 'shield-checkmark-outline' },
  { nome: 'Outro', icone: 'person-outline' }
];

const FUNCIONARIOS_INICIAIS = [
  {
    id: "1",
    nome: "Carlos Souza",
    email: "carlos@empresa.com",
    funcao: "Pedreiro",
    cpf: "111.222.333-44",
    dataAdmissao: "2024-06-10",
    status: "Ativo",
    ultimoPonto: "2024-07-01 07:02",
    diasTrabalhados: 22,
    faltas: 1,
    obraAtual: "Edifício Alpha",
    observacoes: "Ótimo desempenho, sempre pontual."
  },
  {
    id: "2",
    nome: "Maria Oliveira",
    email: "maria@empresa.com",
    funcao: "Servente",
    cpf: "555.666.777-88",
    dataAdmissao: "2024-06-12",
    status: "Afastado",
    ultimoPonto: "2024-06-28 16:55",
    diasTrabalhados: 18,
    faltas: 3,
    obraAtual: "Residencial Beta",
    observacoes: "Afastada por motivo de saúde."
  },
];

const HISTORICO_INICIAL = [
  { id: "h1", acao: "Adicionou funcionário Carlos Souza", data: "2024-06-10 09:12" },
  { id: "h2", acao: "Adicionou funcionário Maria Oliveira", data: "2024-06-12 14:30" },
];

export default function ProfileScreen() {
  const [funcionarios, setFuncionarios] = useState(FUNCIONARIOS_INICIAIS);
  const [historico, setHistorico] = useState(HISTORICO_INICIAL);
  const [modalVisible, setModalVisible] = useState(false);
  const [novoFuncionario, setNovoFuncionario] = useState({
    nome: "",
    email: "",
    funcao: FUNCOES_CIVIL[0].nome,
    cpf: "",
    obraAtual: "",
    observacoes: "",
    status: "Ativo"
  });
  const [feedback, setFeedback] = useState("");
  const [userFuncao] = useState(USER.funcao || "Chefe de Obra");
  const [modalFuncaoCivil, setModalFuncaoCivil] = useState(false);
  const [funcionarioParaRemover, setFuncionarioParaRemover] = useState<null | { id: string; nome: string }>(null);
  const [modalRemover, setModalRemover] = useState(false);
  const [funcionarioDetalhe, setFuncionarioDetalhe] = useState<null | typeof FUNCIONARIOS_INICIAIS[0]>(null);
  const [modalDetalhe, setModalDetalhe] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroFuncao, setFiltroFuncao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroObra, setFiltroObra] = useState("");
  const [modalEditar, setModalEditar] = useState(false);
  const [funcionarioEditar, setFuncionarioEditar] = useState<any>(null);
  const [snackbar, setSnackbar] = useState("");
  const snackbarTimeout = useRef<number | null>(null);
  const [modalStatusFuncionario, setModalStatusFuncionario] = useState(false);
  const [modalStatusEditar, setModalStatusEditar] = useState(false);
  const [modalObra, setModalObra] = useState(false);
  const [modalFuncaoCivilEditar, setModalFuncaoCivilEditar] = useState(false);

  function validarEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function validarTelefone(telefone: string) {
    return /^\(\d{2}\) \d{4,5}-\d{4}$/.test(telefone);
  }
  function validarData(data: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(data);
  }
  function validarCPF(cpf: string) {
    return cpf.trim().length > 0;
  }

  const handleAddFuncionario = () => {
    if (!novoFuncionario.nome.trim() || !novoFuncionario.email.trim() || !novoFuncionario.funcao.trim() || !novoFuncionario.cpf.trim()) {
      setFeedback("Preencha todos os campos!");
      return;
    }
    if (!validarEmail(novoFuncionario.email)) {
      setFeedback("E-mail inválido!");
      return;
    }
    const obras = ["Edifício Alpha", "Residencial Beta", "Obra Central", "Galpão Zeta", "Prédio Omega"];
    const randomObra = obras[Math.floor(Math.random() * obras.length)];
    const diasTrabalhados = Math.floor(Math.random() * 30) + 1;
    const faltas = Math.floor(Math.random() * 3);
    const hoje = new Date();
    const ultimoPonto = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
    const obsList = [
      "Ótimo desempenho, sempre pontual.",
      "Precisa melhorar o uso de EPI.",
      "Afastado por motivo de saúde.",
      "Destaque na obra atual.",
      "Faltou na última sexta-feira.",
      "Reforço temporário na equipe.",
      "Sem observações recentes."
    ];
    const observacoes = obsList[Math.floor(Math.random() * obsList.length)];
    const novo = {
      ...novoFuncionario,
      id: (Math.random() * 100000).toFixed(0),
      dataAdmissao: new Date().toISOString().slice(0, 10),
      status: novoFuncionario.status,
      ultimoPonto: ultimoPonto.toLocaleString("pt-BR", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      diasTrabalhados,
      faltas,
      obraAtual: novoFuncionario.obraAtual || randomObra,
      observacoes: novoFuncionario.observacoes || observacoes
    };
    setFuncionarios(prev => [...prev, novo]);
    setHistorico(prev => [
      { id: `h${Math.random() * 100000}`, acao: `Adicionou funcionário ${novo.nome}`, data: new Date().toLocaleString("pt-BR") },
      ...prev,
    ]);
    setFeedback("Funcionário adicionado com sucesso!");
    setNovoFuncionario({ nome: "", email: "", funcao: FUNCOES_CIVIL[0].nome, cpf: "", obraAtual: "", observacoes: "", status: "Ativo" });
    setTimeout(() => {
      setModalVisible(false);
      setFeedback("");
    }, 1200);
    setSnackbar("Funcionário adicionado com sucesso!");
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
  };

  const handleRemoverFuncionario = (id: string, nome: string) => {
    setFuncionarioParaRemover({ id, nome });
    setModalRemover(true);
  };
  const confirmarRemocaoFuncionario = () => {
    if (funcionarioParaRemover) {
      const nomeRemovido = funcionarioParaRemover.nome;
      setFuncionarios(prev => prev.filter(f => f.id !== funcionarioParaRemover.id));
      setHistorico(prev => [
        { id: `h${Math.random() * 100000}`, acao: `Removeu funcionário ${nomeRemovido}`, data: new Date().toLocaleString("pt-BR") },
        ...prev,
      ]);
      setFuncionarioParaRemover(null);
      setModalRemover(false);
      setSnackbar(`Funcionário ${nomeRemovido} removido!`);
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
      snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
    }
  };

  const handleLogout = () => {
    router.replace("/");
  };

  const funcionariosFiltrados = funcionarios.filter(f => {
    const buscaLower = busca.toLowerCase();
    return (
      (!busca || f.nome.toLowerCase().includes(buscaLower) || f.email.toLowerCase().includes(buscaLower)) &&
      (!filtroFuncao || (filtroFuncao === 'terceirizados' ? f.funcao !== 'Chefe de Obra' : f.funcao === filtroFuncao)) &&
      (!filtroStatus || f.status === filtroStatus) &&
      (!filtroObra || f.obraAtual === filtroObra)
    );
  });

  const obrasUnicas = Array.from(new Set(funcionarios.map(f => f.obraAtual).filter(Boolean)));
  
  const handleUpdateFuncionario = () => {
    if (funcionarioEditar) {
        setFuncionarios(prev => prev.map(f => f.id === funcionarioEditar.id ? funcionarioEditar : f));
        setHistorico(prev => [
            { id: `h${Math.random() * 100000}`, acao: `Editou funcionário ${funcionarioEditar.nome}`, data: new Date().toLocaleString("pt-BR") },
            ...prev,
        ]);
        setSnackbar("Funcionário editado com sucesso!");
        if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
        snackbarTimeout.current = setTimeout(() => setSnackbar(""), 2000);
        setModalEditar(false);
        setFuncionarioEditar(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#F4C542" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil do Usuário</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle-outline" size={90} color="#F4C542" />
          </View>
          <Text style={styles.userName}>{USER.nome}</Text>
          <Text style={styles.userEmail}>{USER.email}</Text>
          <Text style={styles.userRole}>{userFuncao}</Text>
          <Text style={styles.userInfo}>Empresa: <Text style={styles.userInfoValue}>{USER.empresa}</Text></Text>
          <Text style={styles.userInfo}>CPF: <Text style={styles.userInfoValue}>{USER.cpf}</Text></Text>
          <Text style={styles.userInfo}>Cadastrado em: <Text style={styles.userInfoValue}>{USER.dataCadastro}</Text></Text>
          <Text style={styles.userInfo}>Total de funcionários: <Text style={styles.userInfoValue}>{funcionarios.length}</Text></Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Funcionários</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="person-add-outline" size={22} color="#F4C542" />
              <Text style={styles.addBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 10 }}>
            <View style={{ flex: 1, backgroundColor: '#1A2A4F', borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
              <Ionicons name="search" size={18} color="#B0B3C7" />
              <TextInput
                style={{ flex: 1, color: '#fff', fontSize: 15, paddingVertical: 8 }}
                placeholder="Buscar por nome ou e-mail"
                placeholderTextColor="#B0B3C7"
                value={busca}
                onChangeText={setBusca}
              />
            </View>
            <TouchableOpacity onPress={() => setFiltroFuncao(filtroFuncao ? "" : "terceirizados")} style={{ backgroundColor: filtroFuncao ? '#F4C542' : '#1A2A4F', borderRadius: 8, padding: 8 }}>
              <Ionicons name="hammer-outline" size={18} color={filtroFuncao ? '#0A1F44' : '#B0B3C7'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFiltroStatus(filtroStatus ? "" : "Ativo")} style={{ backgroundColor: filtroStatus ? '#F4C542' : '#1A2A4F', borderRadius: 8, padding: 8 }}>
              <Ionicons name="checkmark-circle" size={18} color={filtroStatus ? '#0A1F44' : '#B0B3C7'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalObra(true)} style={{ backgroundColor: filtroObra ? '#F4C542' : '#1A2A4F', borderRadius: 8, padding: 8 }}>
              <Ionicons name="business-outline" size={18} color={filtroObra ? '#0A1F44' : '#B0B3C7'} />
            </TouchableOpacity>
          </View>
          <Modal
            visible={modalObra}
            transparent
            animationType="fade"
            onRequestClose={() => setModalObra(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Filtrar por obra</Text>
                <Pressable
                  style={[styles.selectBtn, !filtroObra && styles.selectBtnActive]}
                  onPress={() => { setFiltroObra(""); setModalObra(false); }}
                >
                  <Ionicons name="list" size={20} color="#F4C542" />
                  <Text style={[styles.selectBtnText, !filtroObra && styles.selectBtnTextActive]}>Todas</Text>
                </Pressable>
                {obrasUnicas.map(obra => (
                  <Pressable
                    key={obra}
                    style={[styles.selectBtn, filtroObra === obra && styles.selectBtnActive]}
                    onPress={() => { setFiltroObra(obra); setModalObra(false); }}
                  >
                    <Ionicons name="business-outline" size={20} color={filtroObra === obra ? '#F4C542' : '#B0B3C7'} />
                    <Text style={[styles.selectBtnText, filtroObra === obra && styles.selectBtnTextActive]}>{obra}</Text>
                  </Pressable>
                ))}
                <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={() => setModalObra(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <FlatList
            data={funcionariosFiltrados}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.workerItem, { alignItems: 'flex-start', paddingVertical: 14 }]}>
                <Ionicons name={FUNCOES_CIVIL.find(f => f.nome === item.funcao)?.icone as any || 'people-outline'} size={28} color="#F4C542" style={{ marginRight: 14, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.workerName}>{item.nome}</Text>
                  <Text style={styles.workerFuncao}>{item.funcao} | {item.status} {item.obraAtual && `| ${item.obraAtual}`}</Text>
                  <Text style={styles.workerEmail}>{item.email}</Text>
                  <Text style={styles.workerFuncao}>Último ponto: {item.ultimoPonto}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 4 }}>
                  <TouchableOpacity onPress={() => { setFuncionarioEditar({ ...item }); setModalEditar(true); }} style={{ padding: 4 }}>
                    <Ionicons name="create-outline" size={22} color="#1976D2" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoverFuncionario(item.id, item.nome)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={22} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum funcionário encontrado.</Text>}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Ações</Text>
          <FlatList
            data={historico}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <Ionicons name="time-outline" size={18} color="#F4C542" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.historyText}>{item.acao}</Text>
                  <Text style={styles.historyDate}>{item.data}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma ação registrada.</Text>}
            scrollEnabled={false}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#F44336" style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: '#F44336' }]}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Funcionário</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor="#B0B3C7"
              value={novoFuncionario.nome}
              onChangeText={nome => setNovoFuncionario(prev => ({ ...prev, nome }))}
            />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#B0B3C7"
              keyboardType="email-address"
              value={novoFuncionario.email}
              onChangeText={email => setNovoFuncionario(prev => ({ ...prev, email }))}
            />
            <TouchableOpacity
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setModalFuncaoCivil(true)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={FUNCOES_CIVIL.find((f: { nome: string; icone: string }) => f.nome === novoFuncionario.funcao)?.icone as keyof typeof Ionicons.glyphMap || 'person-outline'} size={18} color="#F4C542" />
                <Text style={{ color: novoFuncionario.funcao ? '#fff' : '#B0B3C7', fontSize: 15 }}>
                  {novoFuncionario.funcao || 'Selecione a função'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#B0B3C7" />
            </TouchableOpacity>
            <Modal
              visible={modalFuncaoCivil}
              transparent
              animationType="fade"
              onRequestClose={() => setModalFuncaoCivil(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Selecione a função</Text>
                  {FUNCOES_CIVIL.map((funcao: { nome: string; icone: string }) => (
                    <Pressable
                      key={funcao.nome}
                      style={[styles.selectBtn, novoFuncionario.funcao === funcao.nome && styles.selectBtnActive]}
                      onPress={() => { setNovoFuncionario(prev => ({ ...prev, funcao: funcao.nome })); setModalFuncaoCivil(false); }}
                    >
                      <Ionicons name={funcao.icone as keyof typeof Ionicons.glyphMap} size={20} color={novoFuncionario.funcao === funcao.nome ? '#F4C542' : '#B0B3C7'} />
                      <Text style={[styles.selectBtnText, novoFuncionario.funcao === funcao.nome && styles.selectBtnTextActive]}>{funcao.nome}</Text>
                    </Pressable>
                  ))}
                  <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={() => setModalFuncaoCivil(false)}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <TextInput
              style={styles.input}
              placeholder="CPF (000.000.000-00)"
              placeholderTextColor="#B0B3C7"
              keyboardType="numeric"
              value={novoFuncionario.cpf}
              onChangeText={cpf => setNovoFuncionario(prev => ({ ...prev, cpf }))}
              maxLength={14}
            />
            <TextInput
              style={styles.input}
              placeholder="Obra atual"
              placeholderTextColor="#B0B3C7"
              value={novoFuncionario.obraAtual}
              onChangeText={obraAtual => setNovoFuncionario(prev => ({ ...prev, obraAtual }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Observações"
              placeholderTextColor="#B0B3C7"
              value={novoFuncionario.observacoes}
              onChangeText={observacoes => setNovoFuncionario(prev => ({ ...prev, observacoes }))}
            />
            <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A2A4F', marginBottom: 10 }]}>
              <Text style={{ color: '#B0B3C7', fontSize: 15 }}>Status:</Text>
              <TouchableOpacity onPress={() => setModalStatusFuncionario(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={novoFuncionario.status === 'Ativo' ? 'checkmark-circle' : 'remove-circle'} size={20} color={novoFuncionario.status === 'Ativo' ? '#4CAF50' : '#B0B3C7'} />
                <Text style={{ color: novoFuncionario.status === 'Ativo' ? '#4CAF50' : '#B0B3C7', fontWeight: 'bold' }}>{novoFuncionario.status}</Text>
                <Ionicons name="chevron-down" size={16} color="#B0B3C7" />
              </TouchableOpacity>
            </View>
            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setFeedback(""); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddFuncionario}>
                <Text style={styles.saveBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalRemover}
        transparent
        animationType="fade"
        onRequestClose={() => setModalRemover(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle-outline" size={40} color="#F44336" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Remover Funcionário</Text>
            <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 18 }}>
              Tem certeza que deseja remover {funcionarioParaRemover?.nome} da equipe?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalRemover(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#F44336' }]} onPress={confirmarRemocaoFuncionario}>
                <Text style={styles.saveBtnText}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={modalEditar && !!funcionarioEditar}
        transparent
        animationType="slide"
        onRequestClose={() => setModalEditar(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { alignItems: 'center', minWidth: 320, maxWidth: 400 }]}>
                <Text style={styles.modalTitle}>Editar Funcionário</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Nome"
                    placeholderTextColor="#B0B3C7"
                    value={funcionarioEditar?.nome || ''}
                    onChangeText={nome => setFuncionarioEditar((prev: any) => ({ ...prev, nome }))}
                />
                <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    placeholderTextColor="#B0B3C7"
                    value={funcionarioEditar?.email || ''}
                    onChangeText={email => setFuncionarioEditar((prev: any) => ({ ...prev, email }))}
                />
                <TouchableOpacity
                    style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                    onPress={() => setModalFuncaoCivilEditar(true)}
                    activeOpacity={0.8}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name={FUNCOES_CIVIL.find((f: { nome: string; icone: string }) => f.nome === funcionarioEditar?.funcao)?.icone as keyof typeof Ionicons.glyphMap || 'person-outline'} size={18} color="#F4C542" />
                        <Text style={{ color: funcionarioEditar?.funcao ? '#fff' : '#B0B3C7', fontSize: 15 }}>
                            {funcionarioEditar?.funcao || 'Selecione a função'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#B0B3C7" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Obra atual"
                    placeholderTextColor="#B0B3C7"
                    value={funcionarioEditar?.obraAtual || ''}
                    onChangeText={obraAtual => setFuncionarioEditar((prev: any) => ({ ...prev, obraAtual }))}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Observações"
                    placeholderTextColor="#B0B3C7"
                    value={funcionarioEditar?.observacoes || ''}
                    onChangeText={observacoes => setFuncionarioEditar((prev: any) => ({ ...prev, observacoes }))}
                />
                <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A2A4F', marginBottom: 10 }]}>
                    <Text style={{ color: '#B0B3C7', fontSize: 15 }}>Status:</Text>
                    <TouchableOpacity onPress={() => setModalStatusEditar(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name={funcionarioEditar?.status === 'Ativo' ? 'checkmark-circle' : 'remove-circle'} size={20} color={funcionarioEditar?.status === 'Ativo' ? '#4CAF50' : '#B0B3C7'} />
                        <Text style={{ color: funcionarioEditar?.status === 'Ativo' ? '#4CAF50' : '#B0B3C7', fontWeight: 'bold' }}>{funcionarioEditar?.status}</Text>
                        <Ionicons name="chevron-down" size={16} color="#B0B3C7" />
                    </TouchableOpacity>
                </View>
                {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalEditar(false)}>
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateFuncionario}>
                        <Text style={styles.saveBtnText}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      <Modal visible={modalFuncaoCivilEditar} transparent animationType="fade" onRequestClose={() => setModalFuncaoCivilEditar(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Selecione a função</Text>
                  {FUNCOES_CIVIL.map((funcao) => (
                      <Pressable key={funcao.nome} style={[styles.selectBtn, funcionarioEditar?.funcao === funcao.nome && styles.selectBtnActive]} onPress={() => { setFuncionarioEditar((prev: any) => ({ ...prev, funcao: funcao.nome })); setModalFuncaoCivilEditar(false); }}>
                          <Ionicons name={funcao.icone as any} size={20} color={funcionarioEditar?.funcao === funcao.nome ? '#F4C542' : '#B0B3C7'} />
                          <Text style={[styles.selectBtnText, funcionarioEditar?.funcao === funcao.nome && styles.selectBtnTextActive]}>{funcao.nome}</Text>
                      </Pressable>
                  ))}
                  <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={() => setModalFuncaoCivilEditar(false)}>
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>
      
      <Modal visible={modalStatusFuncionario} transparent animationType="fade" onRequestClose={() => setModalStatusFuncionario(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Selecione o status</Text>
                  <Pressable style={[styles.selectBtn, novoFuncionario.status === 'Ativo' && styles.selectBtnActive]} onPress={() => { setNovoFuncionario(prev => ({ ...prev, status: 'Ativo' })); setModalStatusFuncionario(false); }}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={[styles.selectBtnText, novoFuncionario.status === 'Ativo' && styles.selectBtnTextActive]}>Ativo</Text>
                  </Pressable>
                  <Pressable style={[styles.selectBtn, novoFuncionario.status === 'Inativo' && styles.selectBtnActive]} onPress={() => { setNovoFuncionario(prev => ({ ...prev, status: 'Inativo' })); setModalStatusFuncionario(false); }}>
                      <Ionicons name="remove-circle" size={20} color="#B0B3C7" />
                      <Text style={[styles.selectBtnText, novoFuncionario.status === 'Inativo' && styles.selectBtnTextActive]}>Inativo</Text>
                  </Pressable>
                   <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={() => setModalStatusFuncionario(false)}>
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Modal visible={modalStatusEditar} transparent animationType="fade" onRequestClose={() => setModalStatusEditar(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Selecione o status</Text>
                  <Pressable style={[styles.selectBtn, funcionarioEditar?.status === 'Ativo' && styles.selectBtnActive]} onPress={() => { setFuncionarioEditar((prev: any) => ({ ...prev, status: 'Ativo' })); setModalStatusEditar(false); }}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={[styles.selectBtnText, funcionarioEditar?.status === 'Ativo' && styles.selectBtnTextActive]}>Ativo</Text>
                  </Pressable>
                  <Pressable style={[styles.selectBtn, funcionarioEditar?.status === 'Inativo' && styles.selectBtnActive]} onPress={() => { setFuncionarioEditar((prev: any) => ({ ...prev, status: 'Inativo' })); setModalStatusEditar(false); }}>
                      <Ionicons name="remove-circle" size={20} color="#B0B3C7" />
                      <Text style={[styles.selectBtnText, funcionarioEditar?.status === 'Inativo' && styles.selectBtnTextActive]}>Inativo</Text>
                  </Pressable>
                   <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={() => setModalStatusEditar(false)}>
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {snackbar ? (
        <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center', zIndex: 99 }}>
          <View style={{ backgroundColor: '#333', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 }}>
            <Text style={{ color: '#fff', fontSize: 15 }}>{snackbar}</Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A1F44",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: "#0A1F44",
  },
  backButton: {
    width: 40,
    alignItems: "flex-start",
  },
  headerTitle: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 22,
    letterSpacing: 1.1,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: "#142850",
    margin: 20,
    borderRadius: 18,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    marginBottom: 10,
  },
  userName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 2,
  },
  userEmail: {
    color: "#B0B3C7",
    fontSize: 15,
    marginBottom: 2,
  },
  userRole: {
    color: "#F4C542",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  userInfo: {
    color: "#B0B3C7",
    fontSize: 14,
    marginBottom: 1,
  },
  userInfoValue: {
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: "#142850",
    borderRadius: 14,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  addBtnText: {
    color: "#F4C542",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 14,
  },
  workerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A1F44",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  workerName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  workerEmail: {
    color: "#B0B3C7",
    fontSize: 13,
  },
  workerFuncao: {
    color: "#F4C542",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: "#B0B3C7",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A1F44",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  historyText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  historyDate: {
    color: "#B0B3C7",
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#142850",
    borderRadius: 12,
    paddingVertical: 12,
    margin: 24,
  },
  logoutText: {
    color: "#F4C542",
    fontWeight: "bold",
    fontSize: 16,
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
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    color: "#F4C542",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#0A1F44",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    width: "100%",
    marginBottom: 10,
  },
  selectRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    width: '100%',
  },
  selectBtnActive: {
    backgroundColor: "#F4C542",
  },
  selectBtnText: {
    color: "#B0B3C7",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  selectBtnTextActive: {
    color: "#0A1F44",
  },
  feedback: {
    color: "#F4C542",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#1A2A4F",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: "#B0B3C7",
    fontWeight: "bold",
    fontSize: 15,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#F4C542",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: "#0A1F44",
    fontWeight: "bold",
    fontSize: 15,
  },
  avatarDetalhe: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A2A4F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#F4C542',
  },
  avatarInicial: {
    color: '#F4C542',
    fontSize: 28,
    fontWeight: 'bold',
  },
  detalheLabel: {
    color: '#B0B3C7',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  detalheValor: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
});