import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { formatCPF, formatPhone, formatCEP, validateCPF, validateEmail } from '../utils/formatters';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    cpf: '',
    rg: '',
    telefone: '',
    data_nascimento: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    senha: '',
    confirmar_senha: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field, value) => {
    let formattedValue = value;

    // Aplicar formatação conforme o campo
    if (field === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (field === 'telefone') {
      formattedValue = formatPhone(value);
    } else if (field === 'cep') {
      formattedValue = formatCEP(value);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.nome_completo.trim()) {
      errors.push('Nome completo é obrigatório');
    }

    if (!validateEmail(formData.email)) {
      errors.push('Email inválido');
    }

    if (!validateCPF(formData.cpf)) {
      errors.push('CPF inválido');
    }

    if (!formData.rg.trim()) {
      errors.push('RG é obrigatório');
    }

    if (!formData.telefone.trim()) {
      errors.push('Telefone é obrigatório');
    }

    if (!formData.data_nascimento.trim()) {
      errors.push('Data de nascimento é obrigatória');
    }

    if (formData.senha.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }

    if (formData.senha !== formData.confirmar_senha) {
      errors.push('Senhas não coincidem');
    }

    return errors;
  };

  const handleRegister = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      Alert.alert('Erro de validação', errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const { confirmar_senha, ...dataToSend } = formData;
      const result = await register(dataToSend);
      
      if (result.success) {
        Alert.alert(
          'Sucesso!', 
          'Conta criada com sucesso! Agora você pode fazer login.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Erro no cadastro', result.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ 
    placeholder, 
    value, 
    onChangeText, 
    keyboardType = 'default',
    secureTextEntry = false,
    maxLength,
    showEye = false,
    onEyePress
  }) => (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.6)"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        autoCapitalize="none"
      />
      {showEye && (
        <TouchableOpacity style={styles.eyeButton} onPress={onEyePress}>
          <Text style={styles.eyeText}>
            {secureTextEntry ? '🙈' : '👁️'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ImageBackground
      source={{
        uri: 'https://customer-assets.emergentagent.com/job_pix-wallet/artifacts/vzhkwips_Imagem%20do%20WhatsApp%20de%202025-09-26%20%C3%A0%28s%29%2010.23.59_37d4cfaa.jpg'
      }}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.overlay}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Criar Conta</Text>
                <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                {/* Dados Pessoais */}
                <Text style={styles.sectionTitle}>📝 Dados Pessoais</Text>
                
                <InputField
                  placeholder="Nome completo"
                  value={formData.nome_completo}
                  onChangeText={(text) => handleInputChange('nome_completo', text)}
                />

                <InputField
                  placeholder="Email"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  keyboardType="email-address"
                />

                <InputField
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChangeText={(text) => handleInputChange('cpf', text)}
                  keyboardType="numeric"
                  maxLength={14}
                />

                <InputField
                  placeholder="RG"
                  value={formData.rg}
                  onChangeText={(text) => handleInputChange('rg', text)}
                />

                <InputField
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChangeText={(text) => handleInputChange('telefone', text)}
                  keyboardType="phone-pad"
                  maxLength={15}
                />

                <InputField
                  placeholder="Data de nascimento (AAAA-MM-DD)"
                  value={formData.data_nascimento}
                  onChangeText={(text) => handleInputChange('data_nascimento', text)}
                />

                {/* Endereço */}
                <Text style={styles.sectionTitle}>🏠 Endereço</Text>

                <InputField
                  placeholder="00000-000"
                  value={formData.cep}
                  onChangeText={(text) => handleInputChange('cep', text)}
                  keyboardType="numeric"
                  maxLength={9}
                />

                <InputField
                  placeholder="Endereço completo"
                  value={formData.endereco}
                  onChangeText={(text) => handleInputChange('endereco', text)}
                />

                <InputField
                  placeholder="Cidade"
                  value={formData.cidade}
                  onChangeText={(text) => handleInputChange('cidade', text)}
                />

                <InputField
                  placeholder="Estado (SP, RJ, MG...)"
                  value={formData.estado}
                  onChangeText={(text) => handleInputChange('estado', text.toUpperCase())}
                  maxLength={2}
                />

                {/* Segurança */}
                <Text style={styles.sectionTitle}>🔒 Segurança</Text>

                <InputField
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={formData.senha}
                  onChangeText={(text) => handleInputChange('senha', text)}
                  secureTextEntry={!showPassword}
                  showEye={true}
                  onEyePress={() => setShowPassword(!showPassword)}
                />

                <InputField
                  placeholder="Confirmar senha"
                  value={formData.confirmar_senha}
                  onChangeText={(text) => handleInputChange('confirmar_senha', text)}
                  secureTextEntry={!showConfirmPassword}
                  showEye={true}
                  onEyePress={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Criando conta...' : 'Criar Conta'}
                  </Text>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Já tem conta? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Fazer login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 20,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  eyeText: {
    fontSize: 20,
  },
  registerButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  loginLink: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;