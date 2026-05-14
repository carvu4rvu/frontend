import { apiFetch } from './api';

/**
 * Company Service - API calls for company portal
 */
export const CompanyService = {
  // ============== PROFILE ==============
  
  /** Get my company profile */
  getMyProfile: async () => {
    const response = await apiFetch('/company/profile');
    return response.data?.data;
  },

  /** Update my company profile */
  updateProfile: async (data) => {
    const response = await apiFetch('/company/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data?.data;
  },

  // ============== CONTACTS ==============
  
  /** Get company contacts */
  getContacts: async () => {
    const response = await apiFetch('/company/contacts');
    return response.data?.data ?? [];
  },

  /** Add a new contact */
  addContact: async (data) => {
    const response = await apiFetch('/company/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data?.data;
  },

  /** Update a contact */
  updateContact: async (id, data) => {
    const response = await apiFetch(`/company/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data?.data;
  },

  /** Delete a contact */
  deleteContact: async (id) => {
    await apiFetch(`/company/contacts/${id}`, { method: 'DELETE' });
  },

  // ============== PLACEMENT DRIVES ==============
  
  /** Get all placement drives for my company */
  getDrives: async () => {
    const response = await apiFetch('/company/drives');
    const raw = response?.data?.data ?? response?.data;
    return Array.isArray(raw) ? raw : [];
  },

  /** Get single drive details */
  getDriveById: async (id) => {
    const response = await apiFetch(`/company/drives/${id}`);
    return response?.data?.data ?? response?.data ?? null;
  },

  /** Get drive eligibility criteria */
  getDriveEligibility: async (driveId) => {
    const response = await apiFetch(`/company/drives/${driveId}/eligibility`);
    return response.data?.data;
  },

  /** Get candidates for a drive (pipeline / process table) */
  getDriveCandidates: async (driveId, params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    const response = await apiFetch(`/company/drives/${driveId}/candidates${qs ? `?${qs}` : ''}`);
    const raw = response?.data?.data ?? response?.data;
    return Array.isArray(raw) ? raw : [];
  },

  /** Update candidate status in pipeline */
  updateCandidateStatus: async (driveId, usn, data) => {
    const response = await apiFetch(`/company/drives/${driveId}/candidates/${encodeURIComponent(usn)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data?.data;
  },

  // ============== STUDENT PROFILES (Company-Safe View) ==============
  
  /** Get student profile (company-safe view) */
  getStudentProfile: async (usn) => {
    const response = await apiFetch(`/company/students/${encodeURIComponent(usn)}`);
    return response.data?.data;
  },

  // ============== OFFERS ==============
  
  /** Get all offers for my company */
  getOffers: async () => {
    const response = await apiFetch('/company/offers');
    return response.data?.data ?? [];
  },

  // ============== NOTIFICATIONS ==============
  
  /** Get company notifications */
  getNotifications: async (params = {}) => {
    const sp = new URLSearchParams();
    if (params.tab) sp.set('tab', params.tab);
    if (params.page != null) sp.set('page', params.page);
    if (params.limit != null) sp.set('limit', params.limit);
    const qs = sp.toString();
    const response = await apiFetch(`/company/notifications${qs ? `?${qs}` : ''}`);
    const list = response.data?.data ?? [];
    return { notifications: list, total: list.length };
  },

  /** Get unread notifications count for badge */
  getNotificationsUnreadCount: async () => {
    const response = await apiFetch('/company/notifications/unread-count');
    return response.data?.data?.unreadCount ?? 0;
  },

  /** Update notification node (mark read, archive, star) */
  updateNotificationNode: async (nodeId, payload) => {
    const response = await apiFetch(`/company/notifications/${nodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response.data?.data;
  },

  // ============== EVENTS ==============
  
  /** Get events sent to companies via notifications (same logic as alumni events) */
  getEvents: async () => {
    const response = await apiFetch('/company/events');
    return response.data?.data ?? [];
  },

  // ============== STUDENT PROJECTS (only students who registered to company's drives) ==============

  /** Get approved projects from students who registered to any of our placement drives */
  getProjects: async () => {
    const response = await apiFetch('/company/projects');
    return Array.isArray(response.data) ? response.data : [];
  },

  /** Get single project by id (only if owner registered to one of our drives) */
  getProjectById: async (projectId) => {
    const response = await apiFetch(`/company/projects/${projectId}`);
    return response.data;
  },

  // ============== DASHBOARD ==============
  
  /** Get dashboard stats */
  getDashboardStats: async () => {
    const response = await apiFetch('/company/dashboard');
    return response.data?.data;
  },
};

export default CompanyService;
