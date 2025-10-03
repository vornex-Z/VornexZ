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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { formatCPF } from '../utils/formatters';
import BiometricAuth from '../components/BiometricAuth';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    cpf: '',
    senha: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const handleInputChange = (field, value) => {
    if (field === 'cpf') {
      value = formatCPF(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!formData.cpf || !formData.senha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData.cpf, formData.senha);
      
      if (result.success) {
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Erro no login', result.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    // Implementar login biométrico
    try {
      // Aqui integraria com a biometria
      Alert.alert('Biometria', 'Login biométrico em desenvolvimento');
    } catch (error) {
      Alert.alert('Erro', 'Falha na autenticação biométrica');
    }
  };

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
          <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>VornexZPay</Text>
              <Text style={styles.subtitle}>Entre na sua conta</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* CPF Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="000.000.000-00"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={formData.cpf}
                  onChangeText={(text) => handleInputChange('cpf', text)}
                  keyboardType="numeric"
                  maxLength={14}
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={formData.senha}
                  onChangeText={(text) => handleInputChange('senha', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? '👁️' : '🙈'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => navigation.navigate('Help')}
              >
                <Text style={styles.forgotText}>Esqueci minha senha</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Text>
              </TouchableOpacity>

              {/* Biometric Login */}
              {biometricAvailable && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                >
                  <Text style={styles.biometricText}>🔒 Entrar com Biometria</Text>
                </TouchableOpacity>
              )}

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Não tem conta? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>Cadastre-se</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  biometricButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  biometricText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  registerLink: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;