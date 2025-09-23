import React, { useState, useEffect } from 'react';
import {
  Shield,
  Settings,
  Users,
  CreditCard,
  Zap,
  Heart,
  BarChart3,
  Code,
  Palette,
  Database,
  Key,
  Activity,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminData, setAdminData] = useState({
    buttons: [],
    partnerships: [],
    apis: [],
    users: [],
    systemConfig: {},
    designConfig: {},
    realTimeStats: {}
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [realTimeMode, setRealTimeMode] = useState(true);

  // Estados para diferentes seções
  const [buttonConfig, setButtonConfig] = useState({
    id: '',
    label: '',
    icon: '',
    endpoint: '',
    enabled: true,
    position: 0
  });

  const [partnershipConfig, setPartnershipConfig] = useState({
    id: '',
    name: '',
    logo: '',
    cashback: '',
    category: '',
    description: '',
    active: true
  });

  const [apiConfig, setApiConfig] = useState({
    id: '',
    name: '',
    endpoint: '',
    method: 'POST',
    headers: '',
    enabled: true,
    buttonId: ''
  });

  const [designConfig, setDesignConfig] = useState({
    primaryColor: '#7B4DFF',
    secondaryColor: '#00BFA5',
    accentColor: '#6366f1',
    brandName: 'VornexZPay',
    tagline: 'Sua carteira digital',
    logo: ''
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Tabs do painel admin
  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'buttons', label: 'Botões', icon: Settings },
    { id: 'apis', label: 'APIs', icon: Code },
    { id: 'partnerships', label: 'Parcerias', icon: Heart },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'logs', label: 'Logs', icon: Activity }
  ];

  // Carregar dados do admin
  useEffect(() => {
    loadAdminData();
    
    // Auto-refresh se modo tempo real estiver ativo
    let interval;
    if (realTimeMode) {
      interval = setInterval(() => {
        loadAdminData();
      }, 10000); // Atualizar a cada 10 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeMode]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAdminData(response.data);
      
      // Carregar configurações de design
      if (response.data.designConfig) {
        setDesignConfig(response.data.designConfig);
      }
      
    } catch (error) {
      showMessage('error', 'Erro ao carregar dados administrativos');
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas em tempo real
  const loadRealTimeStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/real-time-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAdminData(prev => ({
        ...prev,
        realTimeStats: response.data
      }));
      
    } catch (error) {
      console.log('Erro ao carregar estatísticas:', error);
    }
  };

  // Salvar configuração de botão
  const saveButtonConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/admin/buttons`, buttonConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', 'Configuração de botão salva!');
      loadAdminData();
      setButtonConfig({ id: '', label: '', icon: '', endpoint: '', enabled: true, position: 0 });
    } catch (error) {
      showMessage('error', 'Erro ao salvar configuração do botão');
    } finally {
      setLoading(false);
    }
  };

  // Salvar configuração de parceria
  const savePartnershipConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/admin/partnerships`, partnershipConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', 'Parceria salva!');
      loadAdminData();
      setPartnershipConfig({ id: '', name: '', logo: '', cashback: '', category: '', description: '', active: true });
    } catch (error) {
      showMessage('error', 'Erro ao salvar parceria');
    } finally {
      setLoading(false);
    }
  };

  // Salvar configuração de API
  const saveApiConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/admin/apis`, apiConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', 'API configurada!');
      loadAdminData();
      setApiConfig({ id: '', name: '', endpoint: '', method: 'POST', headers: '', enabled: true, buttonId: '' });
    } catch (error) {
      showMessage('error', 'Erro ao configurar API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">VornexZPay Admin</h1>
                <p className="text-sm text-gray-600">Painel de Administração</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadAdminData}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RefreshCw size={16} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <nav className="p-4">
            <div className="space-y-2">
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Usuários Totais</p>
                      <p className="text-2xl font-bold text-gray-900">{adminData.users?.length || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Botões Ativos</p>
                      <p className="text-2xl font-bold text-gray-900">{adminData.buttons?.filter(b => b.enabled).length || 0}</p>
                    </div>
                    <Settings className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">APIs Configuradas</p>
                      <p className="text-2xl font-bold text-gray-900">{adminData.apis?.length || 0}</p>
                    </div>
                    <Code className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Parcerias</p>
                      <p className="text-2xl font-bold text-gray-900">{adminData.partnerships?.length || 0}</p>
                    </div>
                    <Heart className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('buttons')}
                    className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 transition-colors text-center"
                  >
                    <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="font-medium">Configurar Botões</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('apis')}
                    className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-center"
                  >
                    <Code className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-medium">Gerenciar APIs</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('partnerships')}
                    className="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-red-300 transition-colors text-center"
                  >
                    <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="font-medium">Adicionar Parceria</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Buttons Tab */}
          {activeTab === 'buttons' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Gerenciar Botões</h2>
                <button
                  onClick={() => setButtonConfig({ id: '', label: '', icon: '', endpoint: '', enabled: true, position: 0 })}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>Novo Botão</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form para configurar botão */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Configurar Botão</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Botão</label>
                      <input
                        type="text"
                        value={buttonConfig.label}
                        onChange={(e) => setButtonConfig({ ...buttonConfig, label: e.target.value })}
                        placeholder="Ex: PIX, Transferir, Pagar"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ícone (nome Lucide)</label>
                      <input
                        type="text"
                        value={buttonConfig.icon}
                        onChange={(e) => setButtonConfig({ ...buttonConfig, icon: e.target.value })}
                        placeholder="Ex: CreditCard, ArrowUp, Clock"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint da API</label>
                      <input
                        type="text"
                        value={buttonConfig.endpoint}
                        onChange={(e) => setButtonConfig({ ...buttonConfig, endpoint: e.target.value })}
                        placeholder="Ex: /api/pix/transfer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Posição</label>
                      <input
                        type="number"
                        value={buttonConfig.position}
                        onChange={(e) => setButtonConfig({ ...buttonConfig, position: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={buttonConfig.enabled}
                        onChange={(e) => setButtonConfig({ ...buttonConfig, enabled: e.target.checked })}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Botão Ativo</label>
                    </div>

                    <button
                      onClick={saveButtonConfig}
                      disabled={loading}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Salvando...' : 'Salvar Botão'}
                    </button>
                  </div>
                </div>

                {/* Lista de botões existentes */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Botões Configurados</h3>
                  <div className="space-y-3">
                    {adminData.buttons?.map((button, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{button.label}</p>
                          <p className="text-sm text-gray-600">{button.icon}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            button.enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {button.enabled ? 'Ativo' : 'Inativo'}
                          </span>
                          <button
                            onClick={() => setButtonConfig(button)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APIs Tab */}
          {activeTab === 'apis' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Gerenciar APIs</h2>
                <button
                  onClick={() => setApiConfig({ id: '', name: '', endpoint: '', method: 'POST', headers: '', enabled: true, buttonId: '' })}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>Nova API</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form para configurar API */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Configurar API</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome da API</label>
                      <input
                        type="text"
                        value={apiConfig.name}
                        onChange={(e) => setApiConfig({ ...apiConfig, name: e.target.value })}
                        placeholder="Ex: PIX Transfer API"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
                      <input
                        type="text"
                        value={apiConfig.endpoint}
                        onChange={(e) => setApiConfig({ ...apiConfig, endpoint: e.target.value })}
                        placeholder="https://api.example.com/transfer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Método HTTP</label>
                      <select
                        value={apiConfig.method}
                        onChange={(e) => setApiConfig({ ...apiConfig, method: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Headers (JSON)</label>
                      <textarea
                        value={apiConfig.headers}
                        onChange={(e) => setApiConfig({ ...apiConfig, headers: e.target.value })}
                        placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Botão Associado</label>
                      <select
                        value={apiConfig.buttonId}
                        onChange={(e) => setApiConfig({ ...apiConfig, buttonId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione um botão</option>
                        {adminData.buttons?.map((button, index) => (
                          <option key={index} value={button.id}>{button.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={apiConfig.enabled}
                        onChange={(e) => setApiConfig({ ...apiConfig, enabled: e.target.checked })}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">API Ativa</label>
                    </div>

                    <button
                      onClick={saveApiConfig}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Salvando...' : 'Salvar API'}
                    </button>
                  </div>
                </div>

                {/* Lista de APIs existentes */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">APIs Configuradas</h3>
                  <div className="space-y-3">
                    {adminData.apis?.map((api, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{api.name}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            api.enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {api.enabled ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{api.method} - {api.endpoint}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">Botão: {api.buttonId}</span>
                          <button
                            onClick={() => setApiConfig(api)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Partnerships Tab */}
          {activeTab === 'partnerships' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Gerenciar Parcerias</h2>
                <button
                  onClick={() => setPartnershipConfig({ id: '', name: '', logo: '', cashback: '', category: '', description: '', active: true })}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>Nova Parceria</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form para configurar parceria */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Configurar Parceria</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                      <input
                        type="text"
                        value={partnershipConfig.name}
                        onChange={(e) => setPartnershipConfig({ ...partnershipConfig, name: e.target.value })}
                        placeholder="Ex: McDonald's, Amazon, Netflix"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL do Logo</label>
                      <input
                        type="text"
                        value={partnershipConfig.logo}
                        onChange={(e) => setPartnershipConfig({ ...partnershipConfig, logo: e.target.value })}
                        placeholder="https://exemplo.com/logo.png"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">% Cashback</label>
                      <input
                        type="text"
                        value={partnershipConfig.cashback}
                        onChange={(e) => setPartnershipConfig({ ...partnershipConfig, cashback: e.target.value })}
                        placeholder="Ex: 5%, 10%, até 15%"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                      <input
                        type="text"
                        value={partnershipConfig.category}
                        onChange={(e) => setPartnershipConfig({ ...partnershipConfig, category: e.target.value })}
                        placeholder="Ex: Alimentação, Shopping, Streaming"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                      <textarea
                        value={partnershipConfig.description}
                        onChange={(e) => setPartnershipConfig({ ...partnershipConfig, description: e.target.value })}
                        placeholder="Descrição da parceria e benefícios"
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={partnershipConfig.active}
                        onChange={(e) => setPartnershipConfig({ ...partnershipConfig, active: e.target.checked })}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Parceria Ativa</label>
                    </div>

                    <button
                      onClick={savePartnershipConfig}
                      disabled={loading}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Salvando...' : 'Salvar Parceria'}
                    </button>
                  </div>
                </div>

                {/* Lista de parcerias existentes */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Parcerias Configuradas</h3>
                  <div className="space-y-3">
                    {adminData.partnerships?.map((partnership, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {partnership.logo && (
                              <img src={partnership.logo} alt={partnership.name} className="w-8 h-8 rounded" />
                            )}
                            <div>
                              <p className="font-medium">{partnership.name}</p>
                              <p className="text-sm text-gray-600">{partnership.category}</p>
                            </div>
                          </div>
                          <span className="text-green-600 font-medium">{partnership.cashback}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{partnership.description}</p>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            partnership.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {partnership.active ? 'Ativa' : 'Inativa'}
                          </span>
                          <button
                            onClick={() => setPartnershipConfig(partnership)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Design Tab */}
          {activeTab === 'design' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Configurações de Design</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Cores do Tema</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primária</label>
                      <input type="color" className="w-full h-12 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundária</label>
                      <input type="color" className="w-full h-12 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Destaque</label>
                      <input type="color" className="w-full h-12 border border-gray-300 rounded-md" />
                    </div>
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                      Aplicar Cores
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Logo e Branding</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL do Logo</label>
                      <input 
                        type="text" 
                        placeholder="https://exemplo.com/logo.png"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                      <input 
                        type="text" 
                        defaultValue="VornexZPay"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                      <input 
                        type="text" 
                        placeholder="Sua carteira digital"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                      Salvar Branding
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h2>
              
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Lista de Usuários</h3>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                        <Download size={16} />
                        <span>Exportar</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Nome</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">CPF</th>
                          <th className="text-left py-3 px-4">Saldo</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminData.users?.map((user, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{user.nome_completo}</td>
                            <td className="py-3 px-4">{user.email}</td>
                            <td className="py-3 px-4">{user.cpf}</td>
                            <td className="py-3 px-4">R$ {user.saldo?.toFixed(2) || '0.00'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                Ativo
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-800">
                                  <Eye size={16} />
                                </button>
                                <button className="text-red-600 hover:text-red-800">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database Tab */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Gerenciar Database</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Backup & Restore</h3>
                  <div className="space-y-4">
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                      <Download size={16} />
                      <span>Fazer Backup</span>
                    </button>
                    <button className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                      <Upload size={16} />
                      <span>Restaurar Backup</span>
                    </button>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">Último backup:</p>
                      <p className="text-sm font-medium">23/01/2025 - 14:30</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Estatísticas do DB</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de Usuários:</span>
                      <span className="font-medium">{adminData.users?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de Transações:</span>
                      <span className="font-medium">1,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tamanho do DB:</span>
                      <span className="font-medium">25.6 MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Logs do Sistema</h2>
              
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Atividades Recentes</h3>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Atualizar
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle size={16} className="text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Usuário registrado com sucesso</p>
                        <p className="text-xs text-gray-600">23/01/2025 - 15:23</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Activity size={16} className="text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">API configurada: PIX Transfer</p>
                        <p className="text-xs text-gray-600">23/01/2025 - 14:45</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle size={16} className="text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Tentativa de login falhada</p>
                        <p className="text-xs text-gray-600">23/01/2025 - 13:12</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;