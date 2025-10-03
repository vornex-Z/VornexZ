import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI, securityAPI } from '../services/api';
import { formatPhone, formatCEP, validateEmail, validatePhone } from '../utils/formatters';

const { width, height } = Dimensions.get('window');

const UserSettingsScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Dados pessoais
  const [personalData, setPersonalData] = useState({
    email: user?.email || '',
    telefone: user?.telefone || '',
    cep: user?.cep || '',
    endereco: user?.endereco || '',
    cidade: user?.cidade || '',
    estado: user?.estado || '',
    senha_confirmacao: '',
  });

  // Configurações de segurança
  const [securitySettings, setSecuritySettings] = useState({
    biometricEnabled: false,
    twoFactorEnabled: false,
    pushNotifications: true,
    emailNotifications: true,
  });

  const handlePersonalDataChange = (field, value) => {
    let formattedValue = value;

    if (field === 'telefone') {
      formattedValue = formatPhone(value);
    } else if (field === 'cep') {
      formattedValue = formatCEP(value);
    }

    setPersonalData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const validatePersonalData = () => {
    const errors = [];

    if (!validateEmail(personalData.email)) {
      errors.push('Email inválido');
    }

    if (!validatePhone(personalData.telefone)) {
      errors.push('Telefone inválido');
    }

    if (!personalData.senha_confirmacao.trim()) {
      errors.push('Confirme sua senha para salvar alterações');
    }

    return errors;
  };

  const savePersonalData = async () => {
    const errors = validatePersonalData();
    
    if (errors.length > 0) {
      Alert.alert('Erro de validação', errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const { senha_confirmacao, ...dataToUpdate } = personalData;
      
      const response = await authAPI.updateProfile({
        ...dataToUpdate,
        senha: senha_confirmacao,
      });

      if (response.data) {
        await updateUser({ ...user, ...dataToUpdate });
        
        Alert.alert(
          'Sucesso!',
          'Seus dados foram atualizados com sucesso.',
          [{ text: 'OK' }]
        );
        
        // Limpar senha de confirmação
        setPersonalData(prev => ({ ...prev, senha_confirmacao: '' }));
      }
    } catch (error) {
      console.log('Erro ao atualizar dados:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.detail || 'Não foi possível atualizar os dados'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityToggle = async (setting, value) => {
    setSecuritySettings(prev => ({ ...prev, [setting]: value }));

    if (setting === 'biometricEnabled') {
      try {
        await securityAPI.updateBiometrics(value);
        Alert.alert(
          'Biometria',
          value ? 'Biometria ativada com sucesso!' : 'Biometria desativada'
        );
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível alterar configuração de biometria');
        setSecuritySettings(prev => ({ ...prev, [setting]: !value }));
      }
    }
  };

  const renderPersonalDataTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📝 Dados Pessoais</Text>
      
      {/* Dados não editáveis */}
      <View style={styles.readOnlySection}>
        <Text style={styles.readOnlyLabel}>Dados fixos (não editáveis):</Text>
        
        <View style={styles.readOnlyItem}>
          <Text style={styles.readOnlyFieldName}>Nome completo:</Text>
          <Text style={styles.readOnlyFieldValue}>{user?.nome_completo}</Text>
        </View>
        
        <View style={styles.readOnlyItem}>
          <Text style={styles.readOnlyFieldName}>CPF:</Text>
          <Text style={styles.readOnlyFieldValue}>{user?.cpf}</Text>
        </View>
        
        <View style={styles.readOnlyItem}>
          <Text style={styles.readOnlyFieldName}>RG:</Text>
          <Text style={styles.readOnlyFieldValue}>{user?.rg}</Text>
        </View>
        
        <View style={styles.readOnlyItem}>
          <Text style={styles.readOnlyFieldName}>Data de nascimento:</Text>
          <Text style={styles.readOnlyFieldValue}>{user?.data_nascimento}</Text>
        </View>
      </View>

      {/* Dados editáveis */}
      <Text style={styles.editableLabel}>Dados editáveis:</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={personalData.email}
          onChangeText={(text) => handlePersonalDataChange('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Telefone</Text>
        <TextInput
          style={styles.input}
          placeholder="(00) 00000-0000"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={personalData.telefone}
          onChangeText={(text) => handlePersonalDataChange('telefone', text)}
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>CEP</Text>
        <TextInput
          style={styles.input}
          placeholder="00000-000"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={personalData.cep}
          onChangeText={(text) => handlePersonalDataChange('cep', text)}
          keyboardType="numeric"
          maxLength={9}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Endereço</Text>
        <TextInput
          style={styles.input}
          placeholder="Rua, número, bairro"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={personalData.endereco}
          onChangeText={(text) => handlePersonalDataChange('endereco', text)}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 2, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Cidade</Text>
          <TextInput
            style={styles.input}
            placeholder="Cidade"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={personalData.cidade}
            onChangeText={(text) => handlePersonalDataChange('cidade', text)}
          />
        </View>

        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Estado</Text>
          <TextInput
            style={styles.input}
            placeholder="SP"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={personalData.estado}
            onChangeText={(text) => handlePersonalDataChange('estado', text.toUpperCase())}
            maxLength={2}
          />
        </View>
      </View>

      {/* Confirmação de senha */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Confirme sua senha para salvar</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha atual"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={personalData.senha_confirmacao}
          onChangeText={(text) => handlePersonalDataChange('senha_confirmacao', text)}
          secureTextEntry={true}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={savePersonalData}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSecurityTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🔒 Segurança</Text>

      <View style={styles.securityOption}>
        <View style={styles.securityOptionInfo}>
          <Text style={styles.securityOptionTitle}>👆 Biometria</Text>
          <Text style={styles.securityOptionDescription}>
            Use sua impressão digital ou Face ID para entrar
          </Text>
        </View>
        <Switch
          value={securitySettings.biometricEnabled}
          onValueChange={(value) => handleSecurityToggle('biometricEnabled', value)}
          trackColor={{ false: '#767577', true: '#8B5CF6' }}
          thumbColor={securitySettings.biometricEnabled ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.securityOption}>
        <View style={styles.securityOptionInfo}>
          <Text style={styles.securityOptionTitle}>📱 Autenticação 2FA</Text>
          <Text style={styles.securityOptionDescription}>
            Camada extra de segurança com código
          </Text>
        </View>
        <Switch
          value={securitySettings.twoFactorEnabled}
          onValueChange={(value) => handleSecurityToggle('twoFactorEnabled', value)}
          trackColor={{ false: '#767577', true: '#8B5CF6' }}
          thumbColor={securitySettings.twoFactorEnabled ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.securityOption}>
        <View style={styles.securityOptionInfo}>
          <Text style={styles.securityOptionTitle}>🔔 Notificações Push</Text>
          <Text style={styles.securityOptionDescription}>
            Alertas de transações e segurança
          </Text>
        </View>
        <Switch
          value={securitySettings.pushNotifications}
          onValueChange={(value) => handleSecurityToggle('pushNotifications', value)}
          trackColor={{ false: '#767577', true: '#8B5CF6' }}
          thumbColor={securitySettings.pushNotifications ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.securityOption}>
        <View style={styles.securityOptionInfo}>
          <Text style={styles.securityOptionTitle}>📧 Notificações Email</Text>
          <Text style={styles.securityOptionDescription}>
            Relatórios e alertas por email
          </Text>
        </View>
        <Switch
          value={securitySettings.emailNotifications}
          onValueChange={(value) => handleSecurityToggle('emailNotifications', value)}
          trackColor={{ false: '#767577', true: '#8B5CF6' }}
          thumbColor={securitySettings.emailNotifications ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      <TouchableOpacity style={styles.securityActionButton}>
        <Text style={styles.securityActionButtonText}>🔑 Alterar Senha</Text>
      </TouchableOpacity>
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
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Configurações</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
              onPress={() => setActiveTab('personal')}
            >
              <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
                Dados Pessoais
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'security' && styles.activeTab]}
              onPress={() => setActiveTab('security')}
            >
              <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
                Segurança
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {activeTab === 'personal' ? renderPersonalDataTab() : renderSecurityTab()}
          </ScrollView>
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
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  readOnlySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  readOnlyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 12,
  },
  readOnlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  readOnlyFieldName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  readOnlyFieldValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  editableLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginBottom: 8,
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  securityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  securityOptionInfo: {
    flex: 1,
    marginRight: 16,
  },
  securityOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  securityOptionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  securityActionButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  securityActionButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserSettingsScreen;