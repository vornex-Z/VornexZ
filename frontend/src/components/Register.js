import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../App';

const Register = () => {
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    cpf: '',
    rg: '',
    telefone: '',
    data_nascimento: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    senha: '',
    confirmar_senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    let value = e.target.value;
    const name = e.target.name;

    // Format CPF
    if (name === 'cpf') {
      value = value.replace(/\D/g, '');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})/, '$1-$2');
      value = value.replace(/(-\d{2})\d+?$/, '$1');
    }

    // Format phone
    if (name === 'telefone') {
      value = value.replace(/\D/g, '');
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
      value = value.replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3');
      value = value.replace(/(-\d{4})\d+?$/, '$1');
    }

    // Format CEP
    if (name === 'cep') {
      value = value.replace(/\D/g, '');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
      value = value.replace(/(-\d{3})\d+?$/, '$1');
    }

    // Format RG
    if (name === 'rg') {
      value = value.replace(/\D/g, '');
      value = value.replace(/(\d{2})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})/, '$1-$2');
      value = value.replace(/(-\d{1})\d+?$/, '$1');
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.senha !== formData.confirmar_senha) {
      alert('As senhas não coincidem!');
      return;
    }

    if (formData.senha.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres!');
      return;
    }

    setLoading(true);
    await register(formData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            VornexZ<span className="text-teal-400">Pay</span>
          </h1>
        </div>

        {/* Register Card */}
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Criar Conta</h2>
            <p className="text-gray-300">Crie sua conta VornexZ Pay</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome Completo */}
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input
                type="text"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleChange}
                placeholder="Seu nome completo"
                className="vornex-input"
                required
              />
            </div>

            {/* Email e CPF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className="vornex-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  className="vornex-input"
                  maxLength="14"
                  required
                />
              </div>
            </div>

            {/* RG e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">RG</label>
                <input
                  type="text"
                  name="rg"
                  value={formData.rg}
                  onChange={handleChange}
                  placeholder="12.345.678-9"
                  className="vornex-input"
                  maxLength="12"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  type="text"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  className="vornex-input"
                  maxLength="15"
                  required
                />
              </div>
            </div>

            {/* Data de Nascimento */}
            <div className="form-group">
              <label className="form-label">Data de Nascimento</label>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className="vornex-input"
                required
              />
            </div>

            {/* Endereço */}
            <div className="form-group">
              <label className="form-label">Endereço</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                placeholder="Rua, número, bairro"
                className="vornex-input"
                required
              />
            </div>

            {/* Cidade, Estado e CEP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  placeholder="São Paulo"
                  className="vornex-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="vornex-input"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">CEP</label>
                <input
                  type="text"
                  name="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  placeholder="00000-000"
                  className="vornex-input"
                  maxLength="9"
                  required
                />
              </div>
            </div>

            {/* Senhas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    className="vornex-input pr-12"
                    minLength="6"
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
              <div className="form-group">
                <label className="form-label">Confirmar Senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmar_senha"
                    value={formData.confirmar_senha}
                    onChange={handleChange}
                    placeholder="Confirme sua senha"
                    className="vornex-input pr-12"
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="vornex-button mt-8"
            >
              {loading ? (
                <div className="loading-spinner mx-auto"></div>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-teal-400 hover:text-teal-300 font-semibold">
                Entrar
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            © 2025 VornexZ Pay. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;