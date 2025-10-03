import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const HelpScreen = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const helpOptions = [
    {
      id: 'forgot_password',
      title: '🔑 Esqueci minha senha',
      description: 'Recuperar acesso à sua conta',
      action: () => setSelectedOption('forgot_password'),
    },
    {
      id: 'account_blocked',
      title: '🚫 Minha conta foi bloqueada',
      description: 'Desbloquear sua conta',
      action: () => showComingSoon(),
    },
    {
      id: 'transaction_help',
      title: '💳 Problemas com transações',
      description: 'Ajuda com PIX, transferências e cartões',
      action: () => showComingSoon(),
    },
    {
      id: 'security_help',
      title: '🔒 Questões de segurança',
      description: '2FA, biometria e proteção da conta',
      action: () => showComingSoon(),
    },
    {
      id: 'contact_support',
      title: '📞 Falar com suporte',
      description: 'Contato direto com nossa equipe',
      action: () => showComingSoon(),
    },
  ];

  const showComingSoon = () => {
    Alert.alert(
      'Em desenvolvimento',
      'Esta funcionalidade estará disponível em breve! Por enquanto, você pode usar a recuperação de senha.',
      [{ text: 'OK' }]
    );
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu email');
      return;
    }

    setLoading(true);
    try {
      // Aqui integraria com a API de reset de senha
      // await api.post('/auth/forgot-password', { email: resetEmail });
      
      // Por enquanto, simular envio
      setTimeout(() => {
        Alert.alert(
          'Email enviado!',
          `Instruções para resetar sua senha foram enviadas para ${resetEmail}`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                setSelectedOption(null);
                setResetEmail('');
              }
            }
          ]
        );
        setLoading(false);
      }, 2000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível enviar o email de recuperação');
    }
  };

  const renderPasswordReset = () => (
    <View style={styles.resetContainer}>
      <Text style={styles.resetTitle}>🔑 Recuperar Senha</Text>
      <Text style={styles.resetDescription}>
        Digite seu email cadastrado. Enviaremos instruções para criar uma nova senha.
      </Text>
      
      <TextInput
        style={styles.resetInput}
        placeholder="seu@email.com"
        placeholderTextColor="rgba(255, 255, 255, 0.6)"
        value={resetEmail}
        onChangeText={setResetEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TouchableOpacity
        style={[styles.resetButton, loading && styles.resetButtonDisabled]}
        onPress={handlePasswordReset}
        disabled={loading}
      >
        <Text style={styles.resetButtonText}>
          {loading ? 'Enviando...' : 'Enviar instruções'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setSelectedOption(null)}
      >
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHelpOptions = () => (
    <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.helpTitle}>Como podemos ajudar?</Text>
      <Text style={styles.helpSubtitle}>
        Escolha uma das opções abaixo para resolver seu problema
      </Text>
      
      {helpOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={styles.optionCard}
          onPress={option.action}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>
      ))}
      
      {/* Informações adicionais */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>💡 Dicas de Segurança</Text>
        <Text style={styles.infoText}>
          • Nunca compartilhe sua senha com ninguém{'\n'}
          • Use biometria para maior segurança{'\n'}
          • Mantenha seus dados sempre atualizados{'\n'}
          • Entre em contato se notar atividade suspeita
        </Text>
      </View>
      
      <View style={styles.contactContainer}>
        <Text style={styles.contactTitle}>📧 Precisa de mais ajuda?</Text>
        <Text style={styles.contactText}>
          Email: suporte@vornexzpay.com{'\n'}
          WhatsApp: (11) 9999-9999{'\n'}
          Horário: Segunda a Sexta, 8h às 18h
        </Text>
      </View>
    </ScrollView>
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
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Central de Ajuda</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          {selectedOption === 'forgot_password' ? renderPasswordReset() : renderHelpOptions()}
        </View>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  optionsContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  helpSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  optionArrow: {
    fontSize: 20,
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  resetContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  resetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  resetInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  contactContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34D399',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});

export default HelpScreen;