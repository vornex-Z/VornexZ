import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';

const AdminApp = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se já existe um admin logado
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminUser');
    
    if (token && storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin));
      } catch (error) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (admin) => {
    setAdminUser(admin);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel admin...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminPanel adminUser={adminUser} onLogout={handleLogout} />;
};

export default AdminApp;