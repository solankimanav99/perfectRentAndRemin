import { request } from './apiClient';

export const paymentService = {
  processPayment: async (paymentData) => {
    const res = await request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return res.data;
  },

  getMyPayments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/payments${queryString}`);
    const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
    return {
      items,
      pagination: res.data?.pagination || { page: 1, limit: items.length, totalItems: items.length, totalPages: 1 },
    };
  },

  getPaymentByBookingId: async (bookingId) => {
    const res = await request(`/bookings/${bookingId}/payment`);
    return res.data;
  },

  refundPayment: async (id, reason = '') => {
    const res = await request(`/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return res.data;
  },
};

