import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Fingerprint, 
  Eye, 
  EyeOff, 
  Phone,
  MapPin,
  Save,
  X,
  Check,
  AlertCircle,
  QrCode,
  Mail,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserSettings = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para dados pessoais
  const [personalData, setPersonalData] = useState({
    telefone: user?.telefone || '',
    endereco: user?.endereco || '',
    cidade: user?.cidade || '',
    estado: user?.estado || '',
    senha_confirmacao: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para 2FA
  const [twoFASettings, setTwoFASettings] = useState({
    enabled: false,
    method: null
  });
  const [twoFACode, setTwoFACode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  
  // Estados para biometria
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/user/security-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTwoFASettings({
        enabled: response.data.two_factor_enabled,
        method: response.data.two_factor_method
      });
      setBiometricEnabled(response.data.biometric_enabled);
    } catch (error) {
      console.log('Erro ao buscar configurações:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handlePersonalDataUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/user/update-data`, personalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showMessage('success', 'Dados atualizados com sucesso!');
      setPersonalData({ ...personalData, senha_confirmacao: '' });
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (enable, method = null) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/user/enable-2fa`, 
        { enable, method },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (enable && method === 'totp') {
        setQrCodeUrl(`${API}/user/2fa-qr`);
        setShowQrCode(true);
      }
      
      setTwoFASettings({
        enabled: enable,
        method: enable ? method : null
      });
      
      showMessage('success', response.data.message);
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Erro ao configurar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail2FA = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/user/send-email-2fa`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showMessage('success', 'Código enviado por email!');
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/user/verify-2fa`, 
        { code: twoFACode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showMessage('success', 'Código verificado com sucesso!');
      setTwoFACode('');
      setShowQrCode(false);
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBiometric = async (enable) => {
    if (enable && !navigator.credentials) {
      showMessage('error', 'Seu navegador não suporta autenticação biométrica');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/user/biometric`, 
        { enable },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBiometricEnabled(enable);
      showMessage('success', `Biometria ${enable ? 'habilitada' : 'desabilitada'} com sucesso!`);
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Erro ao configurar biometria');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'biometric', label: 'Biometria', icon: Fingerprint }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Configurações da Conta</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'personal' && (
            <form onSubmit={handlePersonalDataUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label flex items-center space-x-2">
                    <Phone size={16} />
                    <span>Telefone</span>
                  </label>
                  <input
                    type="tel"
                    value={personalData.telefone}
                    onChange={(e) => setPersonalData({ ...personalData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center space-x-2">
                    <MapPin size={16} />
                    <span>Estado</span>
                  </label>
                  <input
                    type="text"
                    value={personalData.estado}
                    onChange={(e) => setPersonalData({ ...personalData, estado: e.target.value })}
                    placeholder="SP"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input
                  type="text"
                  value={personalData.endereco}
                  onChange={(e) => setPersonalData({ ...personalData, endereco: e.target.value })}
                  placeholder="Rua das Flores, 123"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input
                  type="text"
                  value={personalData.cidade}
                  onChange={(e) => setPersonalData({ ...personalData, cidade: e.target.value })}
                  placeholder="São Paulo"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirme sua senha para salvar</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={personalData.senha_confirmacao}
                    onChange={(e) => setPersonalData({ ...personalData, senha_confirmacao: e.target.value })}
                    placeholder="Digite sua senha atual"
                    className="form-input pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Shield size={20} />
                  <span>Autenticação em Duas Etapas</span>
                </h3>
                
                {!twoFASettings.enabled ? (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                      Adicione uma camada extra de segurança à sua conta.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleToggle2FA(true, 'totp')}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Smartphone size={20} />
                        <span>Usar Aplicativo Autenticador</span>
                      </button>
                      <button
                        onClick={() => handleToggle2FA(true, 'email')}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Mail size={20} />
                        <span>Usar Email</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Check size={16} className="text-green-600" />
                        <span className="text-green-800 font-medium">
                          2FA Ativo ({twoFASettings.method === 'totp' ? 'Aplicativo' : 'Email'})
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggle2FA(false)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Desabilitar
                      </button>
                    </div>

                    {twoFASettings.method === 'email' && (
                      <div className="space-y-3">
                        <button
                          onClick={handleSendEmail2FA}
                          disabled={loading}
                          className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                          Enviar Código de Teste
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* QR Code Modal */}
                {showQrCode && (
                  <div className="mt-4 p-4 bg-white border rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center space-x-2">
                      <QrCode size={16} />
                      <span>Configure seu Aplicativo</span>
                    </h4>
                    <div className="text-center">
                      <img 
                        src={`${qrCodeUrl}?t=${Date.now()}`} 
                        alt="QR Code 2FA" 
                        className="mx-auto mb-4 max-w-xs border rounded-lg"
                      />
                      <p className="text-sm text-gray-600 mb-4">
                        Escaneie este QR Code com seu aplicativo autenticador
                      </p>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={twoFACode}
                          onChange={(e) => setTwoFACode(e.target.value)}
                          placeholder="Digite o código do app"
                          className="form-input flex-1"
                        />
                        <button
                          onClick={handleVerify2FA}
                          disabled={loading || !twoFACode}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50"
                        >
                          Verificar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test 2FA */}
                {twoFASettings.enabled && !showQrCode && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-semibold mb-3">Testar 2FA</h4>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={twoFACode}
                        onChange={(e) => setTwoFACode(e.target.value)}
                        placeholder="Digite o código"
                        className="form-input flex-1"
                      />
                      <button
                        onClick={handleVerify2FA}
                        disabled={loading || !twoFACode}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        Testar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'biometric' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Fingerprint size={20} />
                  <span>Login com Biometria</span>
                </h3>
                
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Use sua impressão digital, Face ID ou Windows Hello para fazer login rapidamente.
                  </p>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Autenticação Biométrica</p>
                      <p className="text-sm text-gray-600">
                        {biometricEnabled ? 'Habilitada' : 'Desabilitada'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleBiometric(!biometricEnabled)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                        biometricEnabled
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {biometricEnabled ? 'Desabilitar' : 'Habilitar'}
                    </button>
                  </div>

                  {!navigator.credentials && (
                    <div className="p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm flex items-center space-x-2">
                        <AlertCircle size={16} />
                        <span>Seu navegador não suporta autenticação biométrica.</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettings;