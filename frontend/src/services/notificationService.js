import { request } from './apiClient';

export const notificationService = {
  getNotifications: async (unreadOnly = false) => {
    try {
      const res = await request(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      // /notifications endpoint is not implemented in the current backend
      return [];
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await request(`/notifications/${id}/read`, { method: 'PUT' });
      return res.data;
    } catch {
      return { success: true };
    }
  },
};
