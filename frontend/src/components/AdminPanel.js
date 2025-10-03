import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Shield, 
  FileText, 
  Settings, 
  LogOut,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  UserCheck,
  UserX,
  RotateCcw,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      loadDashboard();
    }
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
      setAdminData(response.data.admin_info);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'all') params.append('status', filters.status);

      const response = await axios.get(`${API}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(response.data.users);
      setPagination({
        page: response.data.page,
        total: response.data.total,
        pages: response.data.pages
      });
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/logs?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data.logs);
      setPagination({
        page: response.data.page,
        total: response.data.total,
        pages: response.data.pages
      });
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action, user) => {
    try {
      const token = localStorage.getItem('admin_token');
      let requestData = { user_id: userId, action: action };
      
      if (action === 'block') {
        const reason = prompt('Motivo do bloqueio (o usuário não poderá se cadastrar novamente):');
        if (!reason) return;
        requestData.reason = reason;
      }
      
      if (action === 'delete') {
        const confirmDelete = window.confirm(
          `⚠️ ATENÇÃO: Esta ação irá EXCLUIR PERMANENTEMENTE o usuário:\n\n` +
          `Nome: ${user.nome_completo}\n` +
          `Email: ${user.email}\n` +
          `CPF: ${user.cpf}\n\n` +
          `O usuário poderá se cadastrar novamente com os mesmos dados.\n\n` +
          `Tem certeza que deseja continuar?`
        );
        if (!confirmDelete) return;
      }
      
      if (action === 'reset_password') {
        const newPassword = prompt(
          `Resetar senha do usuário: ${user.nome_completo}\n\n` +
          `Deixe em branco para gerar senha automática ou digite a nova senha:`
        );
        if (newPassword !== null) {
          if (newPassword.trim()) {
            requestData.new_password = newPassword.trim();
          }
        } else {
          return; // Cancelou
        }
      }
      
      const response = await axios.post(`${API}/admin/users/${userId}/action`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mostrar resultado detalhado
      if (action === 'reset_password' && response.data.user_info) {
        const info = response.data;
        alert(
          `✅ Senha resetada com sucesso!\n\n` +
          `📋 Informações de Login:\n` +
          `Nome: ${info.user_info.nome}\n` +
          `CPF: ${info.user_info.cpf}\n` +
          `Nova Senha: ${info.new_password}\n\n` +
          `🔑 O usuário pode fazer login com:\n` +
          `CPF: ${info.user_info.cpf}\n` +
          `Senha: ${info.new_password}`
        );
      } else {
        alert(`✅ ${response.data.message}`);
      }
      
      // Recarregar lista de usuários
      loadUsers(pagination.page);
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      const errorMsg = error.response?.data?.detail || 'Erro ao executar ação';
      alert(`❌ Erro: ${errorMsg}`);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    window.location.reload();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  useEffect(() => {
    if (currentView === 'users') {
      loadUsers();
    } else if (currentView === 'logs') {
      loadLogs();
    } else if (currentView === 'dashboard') {
      loadDashboard();
    }
  }, [currentView]);

  const renderSidebar = () => (
    <div className="w-64 bg-white shadow-lg h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">VornexZPay Admin</h1>
        <p className="text-sm text-gray-600 mt-1">{adminData?.nome}</p>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'dashboard' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Activity size={20} />
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentView('users')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'users' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users size={20} />
              <span>Gestão de Usuários</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentView('logs')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'logs' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText size={20} />
              <span>Logs & Auditoria</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentView('security')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'security' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shield size={20} />
              <span>Segurança</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentView('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'settings' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings size={20} />
              <span>Configurações</span>
            </button>
          </li>
        </ul>
        
        <div className="mt-8 pt-4 border-t">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </div>
  );

  const renderDashboard = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Administrativo</h2>
        <p className="text-gray-600">Visão geral do VornexZPay</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      ) : dashboardData && (
        <>
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total de Usuários</p>
                  <p className="text-2xl font-bold text-gray-800">{dashboardData.total_usuarios}</p>
                </div>
                <Users className="text-blue-500" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.usuarios_ativos}</p>
                </div>
                <UserCheck className="text-green-500" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Cadastros Hoje</p>
                  <p className="text-2xl font-bold text-purple-600">{dashboardData.cadastros_hoje}</p>
                </div>
                <TrendingUp className="text-purple-500" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Alertas 24h</p>
                  <p className="text-2xl font-bold text-red-600">{dashboardData.atividades_suspeitas_24h}</p>
                </div>
                <AlertTriangle className="text-red-500" size={32} />
              </div>
            </div>
          </div>

          {/* Logs recentes */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Atividades Recentes</h3>
            </div>
            <div className="p-6">
              {dashboardData.logs_recentes && dashboardData.logs_recentes.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.logs_recentes.map((log, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-800">{log.action}</p>
                        <p className="text-sm text-gray-600">{log.admin_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma atividade recente</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestão de Usuários</h2>
        <p className="text-gray-600">Gerencie todos os usuários do sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome, email ou CPF..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>
          
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="blocked">Bloqueados</option>
          </select>

          <button
            onClick={() => loadUsers()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.nome_completo}</div>
                        <div className="text-sm text-gray-500">CPF: {user.cpf}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.telefone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(user.saldo || 0)}
                      </div>
                      {user.premium && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Premium
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.blocked ? 'Bloqueado' : 'Ativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {!user.blocked ? (
                          <button
                            onClick={() => {
                              const reason = prompt('Motivo do bloqueio:');
                              if (reason) handleUserAction(user.id, 'block', reason);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Bloquear usuário"
                          >
                            <UserX size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction(user.id, 'unblock')}
                            className="text-green-600 hover:text-green-900"
                            title="Desbloquear usuário"
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza que deseja resetar a senha deste usuário?')) {
                              handleUserAction(user.id, 'reset_password');
                            }
                          }}
                          className="text-orange-600 hover:text-orange-900"
                          title="Resetar senha"
                        >
                          <RotateCcw size={16} />
                        </button>
                        
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.')) {
                              handleUserAction(user.id, 'delete');
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Remover usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Paginação */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.page - 1) * 20) + 1} até {Math.min(pagination.page * 20, pagination.total)} de {pagination.total} usuários
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadUsers(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => loadUsers(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Logs & Auditoria</h2>
        <p className="text-gray-600">Histórico de todas as ações administrativas</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalhes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.admin_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.action.includes('FAILED') ? 'bg-red-100 text-red-800' :
                        log.action.includes('SUCCESS') ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.target_user_id && `Usuário: ${log.target_user_id}`}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'logs':
        return renderLogs();
      case 'security':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Segurança</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-gray-600">Módulo de segurança em desenvolvimento...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Configurações</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-gray-600">Módulo de configurações em desenvolvimento...</p>
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {renderSidebar()}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPanel;