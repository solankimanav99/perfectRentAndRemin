import { request } from './apiClient';

export const clothingService = {
  getCategories: async () => {
    const res = await request('/categories');
    return res.data;
  },

  getAllClothing: async (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/clothing${queryString}`);
    const data = res.data || { items: [], pagination: {} };
    if (data.items) {
      data.items = data.items.map((item) => ({
        ...item,
        category:
          typeof item.category === 'object' && item.category?.name
            ? item.category
            : item.categoryId && typeof item.categoryId === 'object' && item.categoryId.name
            ? item.categoryId
            : { name: 'Outfit' },
      }));
    }
    return data;
  },

  getClothingById: async (id) => {
    const res = await request(`/clothing/${id}`);
    const item = res.data;
    if (item) {
      item.category =
        typeof item.category === 'object' && item.category?.name
          ? item.category
          : item.categoryId && typeof item.categoryId === 'object' && item.categoryId.name
          ? item.categoryId
          : { name: 'Outfit' };
    }
    return item;
  },

  checkAvailability: async (id, startDate, endDate, quantity = 1) => {
    const query = new URLSearchParams({
      startDate,
      endDate,
      quantity: String(quantity),
    });
    const res = await request(`/clothing/${id}/availability?${query.toString()}`);
    return res.data;
  },
};

