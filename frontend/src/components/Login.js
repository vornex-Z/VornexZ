import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../App';

const Login = () => {
  const [formData, setFormData] = useState({
    login: '',
    senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(formData.login, formData.senha);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            VornexZ<span className="text-teal-400">Pay</span>
          </h1>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Entrar</h2>
            <p className="text-gray-300">Faça login em sua conta VornexZ Pay</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Email ou CPF</label>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleChange}
                placeholder="seu@email.com ou 123.456.789-00"
                className="vornex-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  placeholder="Sua senha"
                  className="vornex-input pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="vornex-button"
            >
              {loading ? (
                <div className="loading-spinner mx-auto"></div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/help" className="text-teal-400 hover:text-teal-300 text-sm">
              Esqueci minha senha ou tenho problemas para acessar
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-300 mb-6">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-teal-400 hover:text-teal-300 font-semibold">
                Cadastre-se
              </Link>
            </p>
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

export default Login;