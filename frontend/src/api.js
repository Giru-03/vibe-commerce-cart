import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
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