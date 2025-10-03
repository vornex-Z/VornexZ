import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL do backend (mesmo do web)
const BACKEND_URL = 'https://pix-wallet.preview.emergentagent.com/api';

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para adicionar token automaticamente
export const setupInterceptors = () => {
  api.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem('@VornexZPay:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error.response?.status === 401) {
        // Token expirado, fazer logout
        await AsyncStorage.multiRemove([
          '@VornexZPay:token',
          '@VornexZPay:user'
        ]);
        // Aqui poderia navegar para login, mas precisa do navigation context
      }
      return Promise.reject(error);
    }
  );
};

// Funções específicas da API
export const authAPI = {
  login: (cpf, senha) => api.post('/auth/login', { cpf, senha }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/user/update-data', userData),
};

export const dashboardAPI = {
  getBalance: () => api.get('/user/balance'),
  getTransactions: (page = 1, limit = 20) => 
    api.get(`/user/transactions?page=${page}&limit=${limit}`),
};

export const cardsAPI = {
  getCards: () => api.get('/user/cards'),
  createVirtualCard: (cardData) => api.post('/user/cards/virtual', cardData),
  requestPhysicalCard: (cardData) => api.post('/user/cards/physical', cardData),
};

export const securityAPI = {
  enable2FA: (method, code) => api.post('/user/enable-2fa', { 
    enable: true, 
    method, 
    code 
  }),
  verify2FA: (code) => api.post('/user/verify-2fa', { code }),
  sendEmail2FA: () => api.post('/user/send-email-2fa'),
  updateBiometrics: (enabled) => api.post('/user/biometrics', { enable: enabled }),
  getSecuritySettings: () => api.get('/user/security-settings'),
};

export default api;