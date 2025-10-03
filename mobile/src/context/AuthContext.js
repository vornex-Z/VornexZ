import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('@VornexZPay:token');
      const userData = await AsyncStorage.getItem('@VornexZPay:user');

      if (token && userData) {
        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Erro ao carregar dados salvos:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (cpf, senha) => {
    try {
      const response = await api.post('/auth/login', {
        cpf,
        senha
      });

      const { access_token, user: userData } = response.data;

      // Salvar no AsyncStorage
      await AsyncStorage.setItem('@VornexZPay:token', access_token);
      await AsyncStorage.setItem('@VornexZPay:user', JSON.stringify(userData));

      // Configurar header da API
      api.defaults.headers.Authorization = `Bearer ${access_token}`;

      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.log('Erro no login:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Erro interno do servidor'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.log('Erro no cadastro:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Erro interno do servidor'
      };
    }
  };

  const logout = async () => {
    try {
      // Remover dados salvos
      await AsyncStorage.multiRemove([
        '@VornexZPay:token',
        '@VornexZPay:user'
      ]);

      // Limpar header da API
      delete api.defaults.headers.Authorization;

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.log('Erro no logout:', error);
    }
  };

  const updateUser = async (newUserData) => {
    try {
      // Atualizar no estado
      setUser(newUserData);
      
      // Salvar no AsyncStorage
      await AsyncStorage.setItem('@VornexZPay:user', JSON.stringify(newUserData));
      
      return { success: true };
    } catch (error) {
      console.log('Erro ao atualizar usuário:', error);
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};