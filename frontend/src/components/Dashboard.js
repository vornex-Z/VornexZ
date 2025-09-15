import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  User, 
  CreditCard, 
  Gift, 
  Heart, 
  Headphones, 
  LogOut,
  Smartphone,
  Receipt,
  FileText,
  Crown,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.log('Error fetching transactions:', error);
    }
  };

  const actionButtons = [
    { 
      id: 'adicionar', 
      icon: Plus, 
      label: 'Adicionar', 
      className: 'purple',
      onClick: () => alert('Funcionalidade em desenvolvimento - Adicionar Dinheiro')
    },
    { 
      id: 'pix', 
      icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 2L13.09 8.26L20 7L14.74 12.26L20 17.52L13.09 16.26L12 22L10.91 16.26L4 17.52L9.26 12.26L4 7L10.91 8.26L12 2Z"/>
        </svg>
      ), 
      label: 'PIX', 
      className: 'teal',
      onClick: () => alert('Funcionalidade em desenvolvimento - PIX')
    },
    { 
      id: 'enviar', 
      icon: ArrowUp, 
      label: 'Enviar', 
      className: 'purple',
      onClick: () => alert('Funcionalidade em desenvolvimento - Enviar Dinheiro')
    },
    { 
      id: 'sacar', 
      icon: ArrowDown, 
      label: 'Sacar', 
      className: 'purple',
      onClick: () => alert('Funcionalidade em desenvolvimento - Sacar')
    },
    { 
      id: 'historico', 
      icon: Clock, 
      label: 'Histórico', 
      className: 'purple',
      onClick: () => {
        const historicoSection = document.getElementById('historico-section');
        historicoSection?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    { 
      id: 'recarga', 
      icon: Smartphone, 
      label: 'Recarga', 
      className: 'purple',
      onClick: () => alert('Funcionalidade em desenvolvimento - Recarga de Celular')
    },
    { 
      id: 'pagamentos', 
      icon: Receipt, 
      label: 'Pagamentos', 
      className: 'purple',
      onClick: () => alert('Funcionalidade em desenvolvimento - Pagamentos')
    },
    { 
      id: 'boletos', 
      icon: FileText, 
      label: 'Boletos', 
      className: 'purple',
      onClick: () => alert('Funcionalidade em desenvolvimento - Boletos e Contas')
    },
    { 
      id: 'premium', 
      icon: Crown, 
      label: 'Premium', 
      className: 'teal',
      onClick: () => alert('Funcionalidade em desenvolvimento - Clube Premium')
    }
  ];

  const menuItems = [
    {
      icon: CreditCard,
      label: 'Cartões Virtuais',
      description: 'Gerencie seus cartões de débito virtuais',
      onClick: () => alert('Funcionalidade em desenvolvimento')
    },
    {
      icon: Gift,
      label: 'Cashback Inteligente',
      description: 'Veja seu cashback e categorias',
      onClick: () => alert('Funcionalidade em desenvolvimento')
    },
    {
      icon: Clock,
      label: 'Assistente IA',
      description: 'Análises e insights financeiros',
      onClick: () => alert('Funcionalidade em desenvolvimento')
    },
    {
      icon: Heart,
      label: 'Parcerias',
      description: 'Empresas parceiras com cashback',
      onClick: () => alert('Funcionalidade em desenvolvimento')
    },
    {
      icon: Headphones,
      label: 'Suporte',
      description: 'Chat com nossa equipe',
      onClick: () => alert('Funcionalidade em desenvolvimento')
    }
  ];

  const formatCurrency = (value) => {
    const absValue = Math.abs(value);
    return `R$ ${absValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (tipo) => {
    switch (tipo) {
      case 'deposito':
        return { icon: Plus, className: 'green' };
      case 'transferencia':
        return { icon: ArrowUp, className: 'blue' };
      case 'pix':
        return { 
          icon: () => (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2L13.09 8.26L20 7L14.74 12.26L20 17.52L13.09 16.26L12 22L10.91 16.26L4 17.52L9.26 12.26L4 7L10.91 8.26L12 2Z"/>
            </svg>
          ), 
          className: 'teal' 
        };
      default:
        return { icon: Clock, className: 'blue' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
      {/* Header */}
      <div className="flex justify-between items-center p-6 pb-4">
        <h1 className="text-2xl font-bold text-white">
          Vornex<span className="text-teal-400">ZPay</span>
        </h1>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 text-white hover:text-teal-400 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm">Olá,</p>
              <p className="font-semibold">{user?.nome_completo?.split(' ')[0]} {user?.nome_completo?.split(' ')[1]}</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
          </button>

          {/* User Menu */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="user-menu">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setShowUserMenu(false);
                    }}
                    className="menu-item w-full"
                  >
                    <div className="menu-icon purple">
                      <item.icon size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="menu-item logout w-full"
                >
                  <div className="menu-icon red">
                    <LogOut size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">Sair da Conta</p>
                    <p className="text-sm text-red-400">Fazer logout do app</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Balance Card */}
        <div className="glass-card-dashboard p-8 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/80 text-lg mb-2">Saldo Principal</p>
              <div className="flex items-center space-x-3">
                <div className="balance-display">
                  {showBalance ? formatCurrency(user?.saldo || 0) : 'R$ •••••'}
                </div>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {showBalance ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
              <p className="balance-subtitle">Disponível para uso</p>
            </div>
          </div>
          
          {user?.premium && (
            <div className="premium-badge">
              <Crown size={16} />
              Premium
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-4 mb-8">
          {actionButtons.map((button) => (
            <div key={button.id} className="flex flex-col items-center">
              <button
                onClick={button.onClick}
                className={`action-button ${button.className}`}
              >
                <button.icon size={24} />
              </button>
              <span className="text-white text-sm mt-2 text-center">{button.label}</span>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div id="historico-section" className="glass-card-dashboard p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Histórico</h3>
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-white/60" />
              <select className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                <option value="todos">Todos</option>
                <option value="deposito">Depósitos</option>
                <option value="transferencia">Transferências</option>
                <option value="pix">PIX</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={48} className="text-white/30 mx-auto mb-4" />
                <p className="text-white/60">Nenhuma transação encontrada</p>
                <p className="text-white/40 text-sm">Suas transações aparecerão aqui</p>
              </div>
            ) : (
              transactions.map((transaction) => {
                const { icon: IconComponent, className } = getTransactionIcon(transaction.tipo);
                const isPositive = transaction.valor > 0;
                
                return (
                  <div key={transaction.id} className="transaction-item">
                    <div className={`transaction-icon ${className}`}>
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white">{transaction.descricao}</p>
                          <p className="text-sm text-white/60">
                            {formatDate(transaction.created_at)}, {formatTime(transaction.created_at)}
                          </p>
                          {transaction.cashback && (
                            <p className="text-sm text-green-400">
                              +R$ {transaction.cashback.toFixed(2)} cashback
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg transaction-value ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(transaction.valor)}
                          </p>
                          <p className="text-sm text-white/60 capitalize">{transaction.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;