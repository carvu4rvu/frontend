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

  /** One notification per campus event, each sent to all VC users */
  notifyVcDigest: async () => {
    const { data } = await apiFetch(`${BASE}/notify-vc-digest`, { method: 'POST' });
    return data;
  },

  /** One notification for a single campus event to all VC users */
  notifyVcForEvent: async (eventId) => {
    const { data } = await apiFetch(`${BASE}/${eventId}/notify-vc`, { method: 'POST' });
    return data;
  },

  /** Upload cover image to system-assets/events/{id}.jpg */
  uploadImage: async (eventId, file) => {
    if (!file || !(file instanceof File)) {
      throw new Error('Please select an image file');
    }
    const formData = new FormData();
    formData.append('file', file, file.name || 'event.jpg');
    const token = localStorage.getItem('token');
    const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
    const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;
    const response = await fetch(`${API_URL}${BASE}/${eventId}/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      let message = 'Image upload failed';
      try {
        const errBody = await response.json();
        message = errBody.message || errBody.error || message;
      } catch (_) {
        /* ignore */
      }
      throw new Error(message);
    }
    return response.json();
  },
};
