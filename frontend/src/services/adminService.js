import { request } from './apiClient';
import { clothingService } from './clothingService';

export const adminService = {
  getDashboard: async () => {
    try {
      const res = await request('/admin/dashboard');
      return res.data;
    } catch {
      // Derive dynamic live metrics from available backend collections
      try {
        const [clothes, payments, returns] = await Promise.all([
          clothingService.getAllClothing({ limit: 100 }),
          request('/payments').catch(() => ({ data: [] })),
          request('/returns').catch(() => ({ data: [] })),
        ]);

        const clothingItems = clothes.items || [];
        const availableItems = clothingItems.filter(
          (c) => c.availabilityStatus === 'AVAILABLE' && c.quantity > 0
        ).length;
        const totalItems = clothingItems.length;

        const paymentList = Array.isArray(payments.data)
          ? payments.data
          : payments.data?.items || [];
        const monthlyRevenue = paymentList
          .filter((p) => p.status === 'PAID')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const returnList = Array.isArray(returns.data)
          ? returns.data
          : returns.data?.items || [];
        const overdueRentals = returnList.filter(
          (r) => r.status === 'LATE' || (r.lateDays && r.lateDays > 0)
        ).length;

        return {
          totalCustomers: '—',
          totalClothingItems: totalItems,
          availableItems,
          activeRentals: paymentList.filter((p) => p.status === 'PAID').length,
          pendingBookings: paymentList.filter((p) => p.status === 'PENDING').length,
          overdueRentals,
          monthlyRevenue,
        };
      } catch {
        return {
          totalCustomers: '—',
          totalClothingItems: 0,
          availableItems: 0,
          activeRentals: 0,
          pendingBookings: 0,
          overdueRentals: 0,
          monthlyRevenue: 0,
        };
      }
    }
  },

  getCustomers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await request(`/admin/customers${query ? `?${query}` : ''}`);
      return res.data;
    } catch (err) {
      if (err.status === 404) {
        return { items: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 } };
      }
      throw err;
    }
  },

  getAllBookings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await request(`/admin/bookings${query ? `?${query}` : ''}`);
      const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
      return {
        items,
        pagination: res.data?.pagination || { page: 1, limit: items.length, totalItems: items.length, totalPages: 1 },
      };
    } catch (err) {
      if (err.status === 404) {
        const res = await request(`/bookings${query ? `?${query}` : ''}`);
        const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        return {
          items,
          pagination: { page: 1, limit: items.length, totalItems: items.length, totalPages: 1 },
        };
      }
      throw err;
    }
  },

  updateBookingStatus: async (id, status) => {
    const res = await request(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  getAllPayments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await request(`/admin/payments${query ? `?${query}` : ''}`);
      const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
      return {
        items,
        pagination: res.data?.pagination || { page: 1, limit: items.length, totalItems: items.length, totalPages: 1 },
      };
    } catch (err) {
      if (err.status === 404) {
        const res = await request(`/payments${query ? `?${query}` : ''}`);
        const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        return {
          items,
          pagination: { page: 1, limit: items.length, totalItems: items.length, totalPages: 1 },
        };
      }
      throw err;
    }
  },

  refundPayment: async (id, reason) => {
    const res = await request(`/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return res.data;
  },

  getAllReturns: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await request(`/admin/returns${query ? `?${query}` : ''}`);
      const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
      return {
        items,
        pagination: res.data?.pagination || { page: 1, limit: items.length, totalItems: items.length, totalPages: 1 },
      };
    } catch (err) {
      if (err.status === 404) {
        const res = await request(`/returns${query ? `?${query}` : ''}`);
        const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        return {
          items,
          pagination: { page: 1, limit: items.length, totalItems: items.length, totalPages: 1 },
        };
      }
      throw err;
    }
  },

  processReturn: async (returnData) => {
    const res = await request('/returns', {
      method: 'POST',
      body: JSON.stringify(returnData),
    });
    return res.data;
  },

  settleReturn: async (id, damageCharge = 0) => {
    const res = await request(`/returns/${id}/settle`, {
      method: 'POST',
      body: JSON.stringify({ damageCharge }),
    });
    return res.data;
  },

  getAllClothing: async (params = {}) => {
    return clothingService.getAllClothing(params);
  },

  createClothing: async (clothingData) => {
    const res = await request('/clothing', {
      method: 'POST',
      body: JSON.stringify(clothingData),
    });
    return res.data;
  },

  updateClothing: async (id, clothingData) => {
    const res = await request(`/clothing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clothingData),
    });
    return res.data;
  },

  updateClothingStatus: async (id, availabilityStatus) => {
    const res = await request(`/clothing/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ availabilityStatus }),
    });
    return res.data;
  },

  deleteClothing: async (id) => {
    const res = await request(`/clothing/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  createCategory: async (categoryData) => {
    const res = await request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    return res.data;
  },

  updateCategory: async (id, categoryData) => {
    const res = await request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
    return res.data;
  },

  deleteCategory: async (id) => {
    const res = await request(`/categories/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};

