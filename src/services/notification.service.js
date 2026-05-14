import { apiFetch } from './api';

export const NotificationService = {
  /**
   * Create custom notification (no recipients yet).
   * @param {Object} payload - { title, message, notification_type?, link?, visible_from?, visible_until? }
   */
  create: async (payload) => {
    const response = await apiFetch('/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /**
   * Get recipient options for targeting. Params: type (students|alumni|companies|roles|role_users), search?, school_id?, program_id?, role? (for role_users), limit?.
   */
  getRecipientOptions: async (params = {}) => {
    const sp = new URLSearchParams();
    if (params.type) sp.set('type', params.type);
    if (params.search) sp.set('search', params.search);
    if (params.school_id != null) sp.set('school_id', params.school_id);
    if (params.program_id != null) sp.set('program_id', params.program_id);
    if (params.role) sp.set('role', params.role);
    if (params.limit != null) sp.set('limit', params.limit);
    const qs = sp.toString();
    const response = await apiFetch(`/notifications/recipient-options${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  /**
   * Send notification to selected recipients. Saves to notifications + notification_nodes.
   * @param {number} id - notification id
   * @param {Object} payload - { target_type: 'ALL'|'ROLE'|'CUSTOM', target_roles?: string[], user_ids?: number[] }
   */
  send: async (id, payload) => {
    const response = await apiFetch(`/notifications/${id}/send`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /**
   * List custom notifications (admin). Params: notification_type, search, page, limit.
   */
  list: async (params = {}) => {
    const sp = new URLSearchParams();
    if (params.notification_type != null && params.notification_type !== '') sp.set('notification_type', params.notification_type);
    if (params.search != null && params.search !== '') sp.set('search', params.search);
    if (params.page != null) sp.set('page', params.page);
    if (params.limit != null) sp.set('limit', params.limit);
    const qs = sp.toString();
    const response = await apiFetch(`/notifications${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  /**
   * Delete notification (soft-delete).
   */
  delete: async (id) => {
    const response = await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
    return response.data;
  },

  /**
   * Get roles for notification targeting (admin).
   */
  getRoles: async () => {
    const response = await apiFetch('/notifications/roles');
    return response.data;
  },

  /**
   * Update notification (title, message, link, etc.).
   */
  update: async (id, payload) => {
    const response = await apiFetch(`/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /**
   * Duplicate a notification (same content, new id, no recipients).
   */
  duplicate: async (id) => {
    const response = await apiFetch(`/notifications/${id}/duplicate`, {
      method: 'POST',
    });
    return response.data;
  },

  /**
   * Get single notification with stats (admin).
   */
  getById: async (id) => {
    const response = await apiFetch(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Get recipients for a notification with read/unread status (admin).
   */
  getRecipients: async (id) => {
    const response = await apiFetch(`/notifications/${id}/recipients`);
    return response.data;
  },

  /**
   * Resend notification to selected recipients (admin). Body: { user_ids?: number[] } or { target_type, target_roles }.
   */
  resend: async (id, payload) => {
    const response = await apiFetch(`/notifications/${id}/resend`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  // ============== STUDENT NOTIFICATIONS ==============

  /**
   * List my notifications (student). Params: tab (unread|read|archived|starred), search, page, limit.
   */
  listMine: async (params = {}) => {
    const sp = new URLSearchParams();
    if (params.tab) sp.set('tab', params.tab);
    if (params.search) sp.set('search', params.search);
    if (params.page != null) sp.set('page', params.page);
    if (params.limit != null) sp.set('limit', params.limit);
    const qs = sp.toString();
    const response = await apiFetch(`/student/notifications${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  /**
   * Get unread count for badge.
   */
  getUnreadCount: async () => {
    const response = await apiFetch('/student/notifications/unread-count');
    return response.data?.unreadCount ?? 0;
  },

  /**
   * Update a notification node (mark read, archive, star).
   */
  updateNode: async (nodeId, payload) => {
    const response = await apiFetch(`/student/notifications/${nodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

};
