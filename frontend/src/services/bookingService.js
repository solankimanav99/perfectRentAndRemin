import { request } from './apiClient';
import { clothingService } from './clothingService';

let clothingCache = null;
let clothingCacheTime = 0;

const getClothingMap = async () => {
  const now = Date.now();
  if (clothingCache && now - clothingCacheTime < 30000) {
    return clothingCache;
  }
  try {
    const data = await clothingService.getAllClothing({ limit: 100 });
    const map = {};
    (data.items || []).forEach((c) => {
      map[c.id] = c;
    });
    clothingCache = map;
    clothingCacheTime = now;
    return map;
  } catch {
    return clothingCache || {};
  }
};

export const bookingService = {
  createBooking: async (bookingData) => {
    const res = await request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
    return res.data;
  },

  getMyBookings: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/bookings${queryString}`);
    const rawItems = Array.isArray(res.data) ? res.data : (res.data?.items || []);

    const clothingMap = await getClothingMap();
    const items = rawItems.map((b) => {
      const cId = b.clothingId?._id || b.clothingId || b.clothing?.id;
      const resolvedClothing =
        typeof b.clothing === 'object' && b.clothing?.name
          ? b.clothing
          : clothingMap[cId] || { name: 'Designer Outfit', size: 'N/A', image: '' };
      return {
        ...b,
        id: b.id || b._id,
        clothing: resolvedClothing,
      };
    });

    return {
      items,
      pagination: res.data?.pagination || {
        page: 1,
        limit: items.length,
        totalItems: items.length,
        totalPages: 1,
      },
    };
  },

  getBookingById: async (id) => {
    const res = await request(`/bookings/${id}`);
    const b = res.data;
    if (b) {
      const clothingMap = await getClothingMap();
      const cId = b.clothingId?._id || b.clothingId || b.clothing?.id;
      b.clothing =
        typeof b.clothing === 'object' && b.clothing?.name
          ? b.clothing
          : clothingMap[cId] || { name: 'Designer Outfit', size: 'N/A', image: '' };
      b.id = b.id || b._id;
    }
    return b;
  },

  cancelBooking: async (id) => {
    const res = await request(`/bookings/${id}/cancel`, { method: 'PUT' });
    return res.data;
  },
};

