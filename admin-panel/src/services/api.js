import axios from 'axios';

const API_URL = '/api/v1';

// Создаём axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (phone, code) => api.post('/auth/verify-code', { phone, code });
export const sendCode = (phone) => api.post('/auth/send-code', { phone });
export const logout = () => api.post('/auth/logout');

// Couriers
export const getPendingCouriers = () => api.get('/admin/couriers/pending');
export const getCourierDetails = (id) => api.get(`/admin/couriers/${id}`);
export const verifyCourier = (id, status, reason) =>
  api.put(`/admin/users/${id}/verify`, { verification_status: status, rejection_reason: reason });

// Orders
export const getOrders = (params) => api.get('/admin/orders', { params });
export const getOrderDetails = (id) => api.get(`/orders/${id}`);

// Stats
export const getStats = () => api.get('/admin/dashboard');

// Support
export const getSupportTickets = (params) => api.get('/support/admin/tickets', { params });
export const assignTicket = (id, assignedTo) =>
  api.put(`/support/admin/tickets/${id}/assign`, { assigned_to: assignedTo });
export const updateTicket = (id, data) => api.put(`/support/admin/tickets/${id}`, data);
export const getTicketMessages = (id) => api.get(`/support/tickets/${id}/messages`);
export const sendTicketMessage = (id, message) =>
  api.post(`/support/tickets/${id}/messages`, { message });

// Promo Codes
export const getPromoCodes = (params) => api.get('/promo-codes/admin/list', { params });
export const createPromoCode = (data) => api.post('/promo-codes/admin/create', data);
export const updatePromoCode = (id, data) => api.put(`/promo-codes/admin/${id}`, data);
export const getPromoCodeStats = (id) => api.get(`/promo-codes/admin/${id}/stats`);

// Referrals
export const getReferralStats = () => api.get('/referrals/admin/stats');
export const getReferralSettings = () => api.get('/referrals/admin/settings');
export const updateReferralSettings = (data) => api.put('/referrals/admin/settings', data);

// Settings
export const getSettings = () => api.get('/settings');
export const updateSetting = (key, value, description) =>
  api.put(`/settings/${key}`, { value, description });
export const deleteSetting = (key) => api.delete(`/settings/${key}`);

// Audit
export const getAuditLogs = (params) => api.get('/settings/audit/logs', { params });
export const getAuditStats = () => api.get('/settings/audit/stats');

// Push Notifications
export const sendPushNotification = (userId, title, body, data) =>
  api.post('/push/admin/send', { user_id: userId, title, body, data });
export const broadcastPushNotification = (title, body, role, data) =>
  api.post('/push/admin/broadcast', { title, body, role, data });

export default api;
