import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { ButtonLogin } from '../../components/ButtonLogin';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { saveUserType } from '../../utils/userType';
import api from '../../services/api';

interface RegisterForm {
  nome: string;
  email: string;
  cpf: string;
  phone_number: string;
  funcao: string;
  senha: string;
  confirmarSenha: string;
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterForm>({
    nome: '',
    email: '',
    cpf: '',
    phone_number: '',
    funcao: '',
    senha: '',
    confirmarSenha: '',
  });
  const [showFuncaoModal, setShowFuncaoModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const funcoes = ['Terceirizado', 'Chefe de Obra'];

  const updateFormData = (field: keyof RegisterForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    updateFormData('cpf', formatted);
  };

  const handlePhoneNumberChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    updateFormData('phone_number', formatted);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erro', 'Permissão para acessar a galeria é necessária!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: false,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log('Photo selected:', {
        uri,
        type: result.assets[0].type || 'image/jpeg',
        name: 'face_image.jpg',
      });
      setPhoto(uri);
    }
  };
  
  const handleRegister = async () => {
    const requiredFields: (keyof RegisterForm)[] = ['nome', 'email', 'cpf', 'phone_number', 'funcao', 'senha', 'confirmarSenha'];
    const emptyFields = requiredFields.filter((field) => !formData[field]);

    if (emptyFields.length > 0) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!photo) {
      Alert.alert('Erro', 'Por favor, selecione uma foto.');
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(formData.cpf)) {
      Alert.alert('Erro', 'CPF deve estar no formato: 000.000.000-00');
      return;
    }

    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      Alert.alert('Erro', 'Número de telefone deve estar no formato: (99) 99999-9999');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erro', 'Por favor, digite um e-mail válido.');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.nome); 
      formDataToSend.append('email', formData.email);
      formDataToSend.append('cpf', formData.cpf.replace(/\D/g, '')); 
      formDataToSend.append('phone_number', formData.phone_number.replace(/\D/g, '')); 
      formDataToSend.append('password', formData.senha);
      formDataToSend.append('confirm_password', formData.confirmarSenha);
      formDataToSend.append('role', formData.funcao === 'Chefe de Obra' ? 'admin' : 'user');

      formDataToSend.append('face_image', {
        uri: photo,
        name: 'face_image.jpg',
        type: 'image/jpeg', 
      } as any); 


      console.log('Enviando FormData:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await api.post('/register/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Resposta do servidor:', response.data);
      saveUserType(formData.email, formData.funcao);

      Alert.alert(
        'Sucesso',
        `Conta criada com sucesso para ${formData.nome}!`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao registrar:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.face_image?.[0] ||
        error.response?.data?.non_field_errors?.[0] ||
        error.message ||
        'Erro ao processar o registro.';
      Alert.alert('Erro', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Sistema de Ponto Digital</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Nome completo"
            placeholderTextColor="#B0B3C7"
            autoCapitalize="words"
            value={formData.nome}
            onChangeText={(value) => updateFormData('nome', value)}
            style={styles.input}
          />
          <TextInput
            placeholder="E-mail"
            placeholderTextColor="#B0B3C7"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            style={styles.input}
          />
          <TextInput
            placeholder="CPF (000.000.000-00)"
            placeholderTextColor="#B0B3C7"
            keyboardType="numeric"
            value={formData.cpf}
            onChangeText={handleCPFChange}
            style={styles.input}
            maxLength={14}
          />
          <TextInput
            placeholder="Telefone ((99) 99999-9999)"
            placeholderTextColor="#B0B3C7"
            keyboardType="phone-pad"
            value={formData.phone_number}
            onChangeText={handlePhoneNumberChange}
            style={styles.input}
            maxLength={15}
          />
          <TouchableOpacity style={styles.selectInput} onPress={() => setShowFuncaoModal(true)}>
            <Text style={[styles.selectText, { color: formData.funcao ? '#FFFFFF' : '#B0B3C7' }]}>
              {formData.funcao || 'Selecione a função'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#B0B3C7" />
          </TouchableOpacity>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Senha"
              placeholderTextColor="#B0B3C7"
              secureTextEntry={!showPassword}
              value={formData.senha}
              onChangeText={(value) => updateFormData('senha', value)}
              style={styles.input}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#B0B3C7" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Confirmar senha"
              placeholderTextColor="#B0B3C7"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmarSenha}
              onChangeText={(value) => updateFormData('confirmarSenha', value)}
              style={styles.input}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#B0B3C7" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={20} color="#333" />
            <Text style={styles.uploadButtonText}>
              {photo ? 'Foto Selecionada' : 'Selecionar Foto'}
            </Text>
          </TouchableOpacity>
          <View style={styles.buttonContainer}>
            <ButtonLogin
              icon="checkmark-circle-outline"
              title="Criar Conta"
              onPress={handleRegister}
              backgroundColor="#F4C542"
              textColor="#333"
              iconColor="#333"
            />
          </View>
          <View style={styles.backToLoginContainer}>
            <Text style={styles.backToLoginText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.backToLoginLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showFuncaoModal} transparent={true} animationType="slide" onRequestClose={() => setShowFuncaoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Função</Text>
              <TouchableOpacity onPress={() => setShowFuncaoModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {funcoes.map((funcao) => (
              <TouchableOpacity
                key={funcao}
                style={styles.optionItem}
                onPress={() => {
                  updateFormData('funcao', funcao);
                  setShowFuncaoModal(false);
                }}
              >
                <Text style={styles.optionText}>{funcao}</Text>
                {formData.funcao === funcao && <Ionicons name="checkmark" size={20} color="#F4C542" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1F44',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B3C7',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
    marginBottom: 20,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#142850',
    borderColor: '#1A2A4F',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 50,
    height: 56,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  selectInput: {
    backgroundColor: '#142850',
    borderColor: '#1A2A4F',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#F4C542',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  backToLoginText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  backToLoginLink: {
    color: '#F4C542',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#142850',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2A4F',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#0A1F44',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});