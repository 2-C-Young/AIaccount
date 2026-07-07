import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Request Interceptor to dynamically inject X-User-Id header
client.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const api = {
  login: (credentials) => client.post('/auth/login', credentials).then(r => r.data),
  signup: (details) => client.post('/auth/signup', details).then(r => r.data),

  getDashboard: () => client.get('/dashboard').then(r => r.data),
  getDashboardSummary: () => client.get('/dashboard/summary').then(r => r.data),
  
  getTransactions: () => client.get('/transactions').then(r => r.data),
  createTransaction: (data) => client.post('/transactions', data).then(r => r.data),
  updateTransaction: (id, data) => client.put(`/transactions/${id}`, data).then(r => r.data),
  deleteTransaction: (id) => client.delete(`/transactions/${id}`).then(r => r.data),
  
  getUser: () => client.get('/user').then(r => r.data),
  updateUser: (data) => client.put('/user', data).then(r => r.data),
  
  askAi: (question) => client.post('/ai/chat', { question }).then(r => r.data),
};
