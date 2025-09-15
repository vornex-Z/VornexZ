import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  User, 
  CreditCard, 
  Heart, 
  Headphones, 
  LogOut,
  Smartphone,
  Receipt,
  FileText,
  Crown,
  Eye,
  EyeOff,
  Filter,
  X
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// PIX Icon Component based on the provided image
const PixIcon = ({ size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="currentColor"
    className="pix-icon"
  >
    {/* Main PIX logo shape - 4 rounded rectangles forming the characteristic shape */}
    <path d="M50 10 Q60 10 65 15 Q70 20 70 30 L70 40 Q70 50 65 55 Q60 60 50 60 L40 60 Q30 60 25 55 Q20 50 20 40 L20 30 Q20 20 25 15 Q30 10 40 10 Z" 
          fill="currentColor"/>
    <path d="M50 40 Q60 40 65 45 Q70 50 70 60 L70 70 Q70 80 65 85 Q60 90 50 90 L40 90 Q30 90 25 85 Q20 80 20 70 L20 60 Q20 50 25 45 Q30 40 40 40 Z" 
          fill="currentColor"/>
    <path d="M10 50 Q10 40 15 35 Q20 30 30 30 L40 30 Q50 30 55 35 Q60 40 60 50 L60 60 Q60 70 55 75 Q50 80 40 80 L30 80 Q20 80 15 75 Q10 70 10 60 Z" 
          fill="currentColor"/>
    <path d="M40 50 Q40 40 45 35 Q50 30 60 30 L70 30 Q80 30 85 35 Q90 40 90 50 L90 60 Q90 70 85 75 Q80 80 70 80 L60 80 Q50 80 45 75 Q40 70 40 60 Z" 
          fill="currentColor"/>
    
    {/* Central intersection creating the characteristic PIX pattern */}
    <path d="M35 35 Q45 35 50 40 Q55 45 55 55 Q55 65 50 70 Q45 75 35 75 Q25 75 20 70 Q15 65 15 55 Q15 45 20 40 Q25 35 35 35 Z" 
          fill="currentColor" opacity="0.3"/>
    <path d="M65 35 Q75 35 80 40 Q85 45 85 55 Q85 65 80 70 Q75 75 65 75 Q55 75 50 70 Q45 65 45 55 Q45 45 50 40 Q55 35 65 35 Z" 
          fill="currentColor" opacity="0.3"/>
  </svg>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCardsModal, setShowCardsModal] = useState(false);
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
      icon: PixIcon, 
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
      onClick: () => {
        setShowCardsModal(true);
        setShowUserMenu(false);
      }
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
          icon: PixIcon, 
          className: 'teal' 
        };
      default:
        return { icon: Clock, className: 'blue' };
    }
  };

  const mockCards = [
    {
      id: 1,
      number: '**** **** **** 1234',
      name: user?.nome_completo || 'João Santos Silva',
      expiry: '12/28',
      status: 'Ativo',
      limit: 5000.00,
      spent: 1250.00
    },
    {
      id: 2,
      number: '**** **** **** 5678',
      name: user?.nome_completo || 'João Santos Silva',
      expiry: '08/27',
      status: 'Bloqueado',
      limit: 2000.00,
      spent: 0.00
    }
  ];

  const CardsModal = () => (
    <div className="modal-overlay" onClick={() => setShowCardsModal(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Cartões Virtuais</h2>
          <button 
            onClick={() => setShowCardsModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          {mockCards.map(card => (
            <div key={card.id} className="card-item">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-lg font-semibold">{card.number}</p>
                  <p className="text-sm opacity-80">{card.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Válido até</p>
                  <p className="font-semibold">{card.expiry}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-80">Status</p>
                  <p className={`font-semibold ${card.status === 'Ativo' ? 'text-green-300' : 'text-red-300'}`}>
                    {card.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Limite</p>
                  <p className="font-semibold">{formatCurrency(card.limit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Gasto</p>
                  <p className="font-semibold">{formatCurrency(card.spent)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all">
            Criar Novo Cartão
          </button>
          <button className="flex-1 bg-gray-100 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all">
            Gerenciar Cartões
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
      {/* Header */}
      <div className="flex justify-between items-center p-6 pb-4">
        <h1 className="text-2xl font-bold text-white">
          VornexZ<span className="text-teal-400">Pay</span>
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
        <div className="action-buttons-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-4 mb-8">
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

          <div className="space-y-2 max-h-96 overflow-y-auto">
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

      {/* Cards Modal */}
      {showCardsModal && <CardsModal />}
    </div>
  );
};

export default Dashboard;