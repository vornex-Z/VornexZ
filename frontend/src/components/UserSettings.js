import React, { useState } from 'react';
import { 
  User, 
  Eye, 
  EyeOff, 
  Phone,
  MapPin,
  Save,
  X,
  Check,
  AlertCircle,
  Mail,
  Map
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserSettings = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para dados pessoais - inicializar com dados atuais do usuário
  const [personalData, setPersonalData] = useState({
    email: user?.email || '',
    telefone: user?.telefone || '',
    endereco: user?.endereco || '',
    cidade: user?.cidade || '',
    estado: user?.estado || '',
    cep: user?.cep || '',
    senha_confirmacao: ''
  });
  const [showPassword, setShowPassword] = useState(false);

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
      
      // Fechar o modal após 1.5 segundos para mostrar a mensagem de sucesso
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Conta</h2>
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

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
            <User size={20} />
            <span>Dados Pessoais</span>
          </h3>
          <p className="text-gray-600 text-sm">
            Visualize e atualize suas informações pessoais
          </p>
        </div>

        {/* Dados Não Editáveis */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <User size={16} />
            <span>Informações Fixas (não editáveis)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Nome Completo</p>
              <p className="font-medium text-gray-900">{user?.nome_completo}</p>
            </div>
            <div>
              <p className="text-gray-600">CPF</p>
              <p className="font-medium text-gray-900">{user?.cpf}</p>
            </div>
            <div>
              <p className="text-gray-600">RG</p>
              <p className="font-medium text-gray-900">{user?.rg}</p>
            </div>
            <div>
              <p className="text-gray-600">Data de Nascimento</p>
              <p className="font-medium text-gray-900">{user?.data_nascimento}</p>
            </div>
          </div>
        </div>

        {/* Formulário de Edição */}
        <form onSubmit={handlePersonalDataUpdate} className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Save size={16} />
            <span>Informações Editáveis</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label flex items-center space-x-2">
                <Mail size={16} />
                <span>Email</span>
              </label>
              <input
                type="email"
                value={personalData.email}
                onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                placeholder="seu@email.com"
                className="form-input"
              />
              <p className="text-xs text-gray-500 mt-1">Atual: {user?.email}</p>
            </div>

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
              <p className="text-xs text-gray-500 mt-1">Atual: {user?.telefone}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label flex items-center space-x-2">
                <Map size={16} />
                <span>CEP</span>
              </label>
              <input
                type="text"
                value={personalData.cep}
                onChange={(e) => setPersonalData({ ...personalData, cep: e.target.value })}
                placeholder="12345-678"
                className="form-input"
              />
              <p className="text-xs text-gray-500 mt-1">Atual: {user?.cep}</p>
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
              <p className="text-xs text-gray-500 mt-1">Atual: {user?.estado}</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Endereço (Rua)</label>
            <input
              type="text"
              value={personalData.endereco}
              onChange={(e) => setPersonalData({ ...personalData, endereco: e.target.value })}
              placeholder="Rua das Flores, 123"
              className="form-input"
            />
            <p className="text-xs text-gray-500 mt-1">Atual: {user?.endereco}</p>
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
            <p className="text-xs text-gray-500 mt-1">Atual: {user?.cidade}</p>
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
      </div>
    </div>
  );
};

export default UserSettings;