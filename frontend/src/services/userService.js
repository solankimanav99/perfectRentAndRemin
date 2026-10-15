import { request } from './apiClient';

export const userService = {
  getProfile: async () => {
    const res = await request('/users/profile');
    return res.data?.user || res.data;
  },

  updateProfile: async (updateData) => {
    const res = await request('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    return res.data?.user || res.data;
  },
};

