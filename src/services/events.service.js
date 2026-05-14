import { apiFetch } from './api';

const BASE = '/events';

export const EventsService = {
  list: async (status) => {
    const url = status ? `${BASE}?status=${status}` : BASE;
    const res = await apiFetch(url);
    const data = res?.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.events)) return data.events;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  getNotificationStats: async () => {
    const { data } = await apiFetch(`${BASE}/notification-stats`);
    return data || {};
  },

  getById: async (id) => {
    const { data } = await apiFetch(`${BASE}/${id}`);
    return data;
  },

  create: async (payload) => {
    const { data } = await apiFetch(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },

  update: async (id, payload) => {
    const { data } = await apiFetch(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  },

  remove: async (id) => {
    await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  },
};
