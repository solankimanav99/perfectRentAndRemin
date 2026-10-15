import { request, setAuthToken, getAuthToken } from './apiClient';

export const authService = {
  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data;
  },

  register: async (userData) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data;
  },

  getCurrentUser: async () => {
    const token = getAuthToken();
    if (!token) return null;
    const res = await request('/auth/me');
    return res.data?.user || res.data;
  },

  logout: async () => {
    try {
      if (getAuthToken()) {
        await request('/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null);
    }
  },
};

