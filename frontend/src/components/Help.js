import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, Mail, HelpCircle } from 'lucide-react';

const Help = () => {
  const helpOptions = [
    {
      id: 'forgot-password',
      icon: Lock,
      title: 'Esqueci a minha senha',
      description: 'Recupere o acesso à sua conta VornexZPay',
      onClick: () => {
        alert('Funcionalidade em desenvolvimento - Recuperação de senha será implementada em breve. Entre em contato com o suporte.');
      }
    },
    {
      id: '2fa-problems',
      icon: Shield,
      title: 'Problemas com autenticação em 2 etapas',
      description: 'Resolva problemas com códigos de verificação',
      onClick: () => {
        alert('Funcionalidade em desenvolvimento - Suporte para 2FA será implementado em breve. Entre em contato com o suporte.');
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            to="/login" 
            className="text-white hover:text-teal-400 transition-colors mr-4"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Central de Ajuda</h1>
            <p className="text-gray-300 text-sm">VornexZPay</p>
          </div>
        </div>

        {/* Help Options */}
        <div className="space-y-4 mb-8">
          {helpOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.onClick}
              className="w-full glass-card p-6 text-left hover:bg-white/20 transition-all duration-300 group"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                  <option.icon size={24} className="text-teal-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {option.title}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Contact Support */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <HelpCircle size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Precisa de mais ajuda?</h3>
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Nossa equipe de suporte está sempre pronta para ajudar você.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2 text-gray-300">
              <Mail size={16} />
              <span>suporte@vornexzpay.com</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            © 2025 VornexZ Pay. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Help;