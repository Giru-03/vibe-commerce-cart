import axios from 'axios';

// Support deploying frontend separately. If VITE_API_BASE is set at build time
// it can be either the backend root (https://api.example.com) or include /api
// (https://api.example.com/api). We normalize to always end with /api so
// callers can continue using paths like api.get('/products').
const rawBase = import.meta.env.VITE_API_BASE;
const base = rawBase
  ? (rawBase.replace(/\/+$/, '').endsWith('/api') ? rawBase.replace(/\/+$/, '') : rawBase.replace(/\/+$/, '') + '/api')
  : '/api';

const api = axios.create({
  baseURL: base
});

// Default mock user id (matches seeder). Frontend will send this header on every request.
const DEFAULT_USER_ID = 'guest@example.com';
api.defaults.headers.common['x-user-id'] = DEFAULT_USER_ID;

// Helper to change user for testing/multi-user flows
export function setUserId(id) {
  if (id) api.defaults.headers.common['x-user-id'] = id;
  else delete api.defaults.headers.common['x-user-id'];
}

export default api;