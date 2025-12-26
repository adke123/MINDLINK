// client/src/lib/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// 기본 fetch 함수
const fetchAPI = async (endpoint, options = {}) => {
  const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
};

// Auth API
export const authAPI = {
  login: (email, password) => 
    fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    
  signup: (data) => 
    fetchAPI('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  me: () => fetchAPI('/api/auth/me'),
};

// Chat API
export const chatAPI = {
  getRooms: () => fetchAPI('/api/chat/rooms'),
  
  getMessages: (roomId, limit = 50) => 
    fetchAPI(`/api/chat/rooms/${roomId}/messages?limit=${limit}`),
    
  sendMessage: (roomId, content) => 
    fetchAPI(`/api/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
    
  createRoom: (participantIds, name, type = 'direct') => 
    fetchAPI('/api/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ participantIds, name, type }),
    }),
    
  getContacts: () => fetchAPI('/api/chat/contacts'),
  
  getFriends: () => fetchAPI('/api/chat/friends'),
  
  addFriend: (friendCode) => 
    fetchAPI('/api/chat/friends', {
      method: 'POST',
      body: JSON.stringify({ friendCode }),
    }),
};

// Conversation API
export const conversationAPI = {
  getList: (seniorId, limit = 50) => 
    fetchAPI(`/api/conversations?${seniorId ? `seniorId=${seniorId}&` : ''}limit=${limit}`),
    
  save: (role, content, emotion) => 
    fetchAPI('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ role, content, emotion }),
    }),
    
  getSummary: (seniorId, days = 7) =>
    fetchAPI(`/api/conversations/summary?${seniorId ? `seniorId=${seniorId}&` : ''}days=${days}`),
};

// Emotion API
export const emotionAPI = {
  save: (emotion, confidence, context, emotions) => 
    fetchAPI('/api/emotions', {
      method: 'POST',
      body: JSON.stringify({ emotion, confidence, context, emotions }),
    }),
    
  getHistory: (seniorId, days = 7) => 
    fetchAPI(`/api/emotions/history?${seniorId ? `seniorId=${seniorId}&` : ''}days=${days}`),
    
  getStats: (seniorId, days = 30) =>
    fetchAPI(`/api/emotions/stats?${seniorId ? `seniorId=${seniorId}&` : ''}days=${days}`),
    
  getWeeklyReport: (seniorId) =>
    fetchAPI(`/api/emotions/weekly-report?${seniorId ? `seniorId=${seniorId}` : ''}`),
};

// Games API
export const gamesAPI = {
  saveResult: (gameType, score, duration, difficulty) => 
    fetchAPI('/api/games/results', {
      method: 'POST',
      body: JSON.stringify({ gameType, score, duration, difficulty }),
    }),
    
  getHistory: (seniorId, limit = 20) => 
    fetchAPI(`/api/games/history?${seniorId ? `seniorId=${seniorId}&` : ''}limit=${limit}`),
    
  getStats: (seniorId) =>
    fetchAPI(`/api/games/stats?${seniorId ? `seniorId=${seniorId}` : ''}`),
};

// Memory API
export const memoryAPI = {
  getList: (seniorId) => 
    fetchAPI(`/api/memories?${seniorId ? `seniorId=${seniorId}` : ''}`),
    
  create: (formData) => {
    const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token;
    return fetch(`${API_URL}/api/memories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }).then(res => res.json());
  },
  
  // ★★★ 시니어를 위한 추억 생성 (보호자가 사용) ★★★
  createForSenior: (formData, seniorId) => {
    const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token;
    return fetch(`${API_URL}/api/memories?seniorId=${seniorId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }).then(res => res.json());
  },
  
  delete: (id) => 
    fetchAPI(`/api/memories/${id}`, { method: 'DELETE' }),
    
  addComment: (memoryId, content) =>
    fetchAPI(`/api/memories/${memoryId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

// Connection API
export const connectionAPI = {
  getConnections: () => fetchAPI('/api/connections'),
  
  getConnectedSenior: () => fetchAPI('/api/connections/senior'),
  
  requestConnection: (seniorCode) => 
    fetchAPI('/api/connections/request', {
      method: 'POST',
      body: JSON.stringify({ seniorCode }),
    }),
    
  acceptConnection: (connectionId) => 
    fetchAPI(`/api/connections/${connectionId}/accept`, { method: 'POST' }),
    
  rejectConnection: (connectionId) => 
    fetchAPI(`/api/connections/${connectionId}/reject`, { method: 'POST' }),
};

// Notification API
export const notificationAPI = {
  getList: () => fetchAPI('/api/notifications'),
  
  markAsRead: (id) => 
    fetchAPI(`/api/notifications/${id}/read`, { method: 'POST' }),
    
  markAllAsRead: () => 
    fetchAPI('/api/notifications/read-all', { method: 'POST' }),
};

// Medication API
export const medicationAPI = {
  getList: () => fetchAPI('/api/medications'),
  
  create: (data) => 
    fetchAPI('/api/medications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  update: (id, data) => 
    fetchAPI(`/api/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  delete: (id) => 
    fetchAPI(`/api/medications/${id}`, { method: 'DELETE' }),
    
  logTaken: (medicationId) => 
    fetchAPI(`/api/medications/${medicationId}/taken`, { method: 'POST' }),
    
  getTodayLogs: () => fetchAPI('/api/medications/today'),
};

// Schedule API
export const scheduleAPI = {
  getList: (startDate, endDate) => 
    fetchAPI(`/api/schedules?startDate=${startDate}&endDate=${endDate}`),
    
  create: (data) => 
    fetchAPI('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  update: (id, data) => 
    fetchAPI(`/api/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  delete: (id) => 
    fetchAPI(`/api/schedules/${id}`, { method: 'DELETE' }),
};

// Report API
export const reportAPI = {
  getWeeklyReport: (seniorId) =>
    fetchAPI(`/api/reports/weekly?${seniorId ? `seniorId=${seniorId}` : ''}`),
    
  getMonthlyReport: (seniorId) =>
    fetchAPI(`/api/reports/monthly?${seniorId ? `seniorId=${seniorId}` : ''}`),
};

// Alert API
export const alertAPI = {
  getAlerts: () => fetchAPI('/api/alerts'),
  
  dismissAlert: (id) => 
    fetchAPI(`/api/alerts/${id}/dismiss`, { method: 'POST' }),
};

export default {
  auth: authAPI,
  chat: chatAPI,
  conversation: conversationAPI,
  emotion: emotionAPI,
  games: gamesAPI,
  memory: memoryAPI,
  connection: connectionAPI,
  notification: notificationAPI,
  medication: medicationAPI,
  schedule: scheduleAPI,
  report: reportAPI,
  alert: alertAPI,
};
