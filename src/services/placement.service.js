import { apiFetch } from './api';
import { getOrFetch, invalidateCache } from '../utils/placementCache';

/** Dedupe concurrent identical student-list requests (e.g. React Strict Mode double mount). */
const placementStudentsInflight = new Map();

const DEFAULT_PAGE_SIZE = 50;

let schoolsCache = null;
let schoolsInflight = null;

export const PlacementService = {
  /**
   * Get placement process/application status for a specific student
   * @param {string} usn 
   */
  getStudentProcess: async (usn) => {
    try {
      // Adjust endpoint as per your backend route structure
      const response = await apiFetch(`/placement/student/${usn}/applications`);
      return response.data;
    } catch (_error) {
      return [];
    }
  },

  /**
   * Get all active placement drives
   */
  getAllDrives: async () => {
    return getOrFetch('placement', 'drives-all', async () => {
      try {
        const response = await apiFetch('/placement/drives');
        return response.data || [];
      } catch (_error) {
        return [];
      }
    });
  },

  /** Lightweight USN list for students already on a drive (Add Students UI). */
  getDriveRegistrationUsns: async (driveId) => {
    try {
      const response = await apiFetch(`/placement/drives/${driveId}/registrations?usns_only=1`);
      const data = response.data ?? {};
      return Array.isArray(data.usns) ? data.usns : [];
    } catch (_error) {
      return [];
    }
  },

  /** Sync placement drive statuses from dates (upcoming/ongoing/completed). Call when placement events page opens. */
  syncDriveStatuses: async () => {
    try {
      const response = await apiFetch('/placement/drives/sync-status', { method: 'POST' });
      return response.data ?? { updated: 0, total: 0 };
    } catch (_error) {
      return { updated: 0, total: 0 };
    }
  },

  /** Get a single drive by id */
  getDriveById: async (id) => {
    try {
      const response = await apiFetch(`/placement/drives/${id}`);
      return response.data ?? null;
    } catch (_error) {
      return null;
    }
  },

  getDriveEligibility: async (driveId) => {
    return getOrFetch('placement', `drive-eligibility-${driveId}`, async () => {
      try {
        const response = await apiFetch(`/placement/drives/${driveId}/eligibility`);
        return response.data ?? null;
      } catch (_e) {
        return null;
      }
    });
  },

  upsertDriveEligibility: async (driveId, data) => {
    const response = await apiFetch(`/placement/drives/${driveId}/eligibility`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    invalidateCache('placement', `drive-eligibility-${driveId}`);
    return response.data;
  },

  /** Get all student_placement_process records (admin Process page) */
  getAllProcessList: async () => {
    try {
      const response = await apiFetch('/placement/process/list');
      return response.data ?? [];
    } catch (_error) {
      return [];
    }
  },

  /** Get student process/registrations for a drive (admin) */
  getDriveProcesses: async (driveId) => {
    try {
      const response = await apiFetch(`/placement/drives/${driveId}/registrations`);
      return response.data ?? [];
    } catch (_error) {
      return [];
    }
  },

  /** Get enriched export data for drive registrations (admin) */
  getDriveExportData: async (driveId, params = {}) => {
    const qs = new URLSearchParams();
    if (params.stage) qs.set('stage', params.stage);
    if (params.columns && params.columns.length) qs.set('columns', params.columns.join(','));
    const url = `/placement/drives/${driveId}/export${qs.toString() ? `?${qs}` : ''}`;
    const response = await apiFetch(url);
    return response.data ?? { data: [], columns: [], availableColumns: [] };
  },

  /** Remove a student from a drive's process (admin) */
  removeFromProcess: async (driveId, usn) => {
    const response = await apiFetch(`/placement/drives/${driveId}/registrations/${encodeURIComponent(usn)}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  /** Update student placement process status (admin) */
  updateProcessStatus: async (id, data) => {
    const response = await apiFetch(`/placement/process/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /** Update placement drive (full PUT) */
  updatePlacementDrive: async (id, data) => {
    const response = await apiFetch(`/placement/drives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /** Update placement drive status only. Calls dedicated PATCH /placement/drives/:id/status (updates placements_drives.placement_status in DB). */
  updatePlacementDriveStatus: async (id, placement_status) => {
    const response = await apiFetch(`/placement/drives/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ placement_status }),
    });
    return response.data;
  },

  addPlacementDrive: async (data) => {
    const response = await apiFetch('/placement/drives', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  getSchools: async () => {
    if (schoolsCache) return schoolsCache;
    if (schoolsInflight) return schoolsInflight;
    schoolsInflight = (async () => {
      try {
        const response = await apiFetch('/student/schools');
        const data = response.data ?? [];
        schoolsCache = data;
        return data;
      } catch (_error) {
        return [];
      } finally {
        schoolsInflight = null;
      }
    })();
    return schoolsInflight;
  },

  getPrograms: async (schoolId) => {
    try {
      const response = await apiFetch('/student/programs');
      const all = response.data ?? [];
      if (schoolId != null && schoolId !== '') {
        const sid = typeof schoolId === 'number' ? schoolId : parseInt(schoolId, 10);
        if (!Number.isNaN(sid)) return all.filter((p) => p.school_id === sid);
      }
      return all;
    } catch (error) {
      console.error("Error fetching programs:", error);
      return [];
    }
  },

  getSpecializations: async (programId) => {
    try {
      const response = await apiFetch('/student/specializations');
      const all = response.data ?? [];
      if (programId != null && programId !== '') {
        const pid = typeof programId === 'number' ? programId : parseInt(programId, 10);
        if (!Number.isNaN(pid)) return all.filter((s) => s.program_id === pid);
      }
      return all;
    } catch (_error) {
      return [];
    }
  },

  getMajors: async (programId) => {
    try {
      const response = await apiFetch('/student/majors');
      const all = response.data ?? [];
      if (programId != null && programId !== '') {
        const pid = typeof programId === 'number' ? programId : parseInt(programId, 10);
        if (!Number.isNaN(pid)) return all.filter((m) => m.program_id === pid);
      }
      return all;
    } catch (_error) {
      return [];
    }
  },

  /** Get all students (for Add Students to Drive, Eligibility preview). Params: school_ids, program_ids, search, limit, opt_in_only, drive_id (includes academics + eligibility when set) */
  getAllStudents: async (params = {}, options = {}) => {
    const { _bustCache, ...queryParams } = params;
    const cacheKey = JSON.stringify(queryParams);

    if (!_bustCache && placementStudentsInflight.has(cacheKey)) {
      return placementStudentsInflight.get(cacheKey);
    }

    const run = (async () => {
      try {
        const q = new URLSearchParams();
        if (_bustCache) q.set('t', String(Date.now()));
        if (queryParams.school_ids) {
          const sids = Array.isArray(queryParams.school_ids) ? queryParams.school_ids.join(',') : queryParams.school_ids;
          if (sids) q.set('school_ids', sids);
        }
        if (queryParams.program_ids) {
          const pids = Array.isArray(queryParams.program_ids) ? queryParams.program_ids.join(',') : queryParams.program_ids;
          if (pids) q.set('program_ids', pids);
        }
        if (queryParams.search) q.set('search', queryParams.search);
        q.set('page', String(queryParams.page != null ? queryParams.page : 1));
        q.set('page_size', String(queryParams.page_size != null ? queryParams.page_size : DEFAULT_PAGE_SIZE));
        if (queryParams.specialization_ids) {
          const sp = Array.isArray(queryParams.specialization_ids) ? queryParams.specialization_ids.join(',') : queryParams.specialization_ids;
          if (sp) q.set('specialization_ids', sp);
        }
        if (queryParams.major_ids) {
          const mids = Array.isArray(queryParams.major_ids) ? queryParams.major_ids.join(',') : queryParams.major_ids;
          if (mids) q.set('major_ids', mids);
        }
        if (queryParams.min_cgpa != null && queryParams.min_cgpa !== '') q.set('min_cgpa', queryParams.min_cgpa);
        if (queryParams.max_cgpa != null && queryParams.max_cgpa !== '') q.set('max_cgpa', queryParams.max_cgpa);
        if (queryParams.max_backlogs != null && queryParams.max_backlogs !== '') q.set('max_backlogs', queryParams.max_backlogs);
        if (queryParams.max_backlog_history != null && queryParams.max_backlog_history !== '') q.set('max_backlog_history', queryParams.max_backlog_history);
        if (queryParams.joining_years) q.set('joining_years', queryParams.joining_years);
        if (queryParams.graduation_years) q.set('graduation_years', queryParams.graduation_years);
        if (queryParams.opt_in_only) q.set('opt_in_only', '1');
        if (queryParams.drive_id != null) q.set('drive_id', queryParams.drive_id);
        if (queryParams.include_inactive) q.set('include_inactive', '1');
        if (queryParams.exclude_admin_hold) q.set('exclude_admin_hold', '1');
        if (queryParams.exclude_placement_violations) q.set('exclude_placement_violations', '1');
        if (queryParams.exclude_disciplinary_records) q.set('exclude_disciplinary_records', '1');
        if (queryParams.exclude_admin_override_hold) q.set('exclude_admin_override_hold', '1');
        if (queryParams.exclude_already_added) q.set('exclude_already_added', '1');

        const response = await apiFetch(`/placement/students?${q.toString()}`, { signal: options.signal });
        const payload = response.data;
        if (payload && Array.isArray(payload.students)) {
          return {
            students: payload.students,
            total: payload.total ?? payload.students.length,
            page: payload.page ?? 1,
            pageSize: payload.pageSize ?? DEFAULT_PAGE_SIZE,
            totalPages: payload.totalPages ?? 1,
          };
        }
        if (Array.isArray(payload)) {
          return {
            students: payload,
            total: payload.length,
            page: 1,
            pageSize: payload.length,
            totalPages: 1,
          };
        }
        return { students: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1 };
      } catch (error) {
        if (error?.name === 'AbortError' || error?.code === 'ABORT_ERR') return null;
        return { students: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1 };
      } finally {
        placementStudentsInflight.delete(cacheKey);
      }
    })();

    if (!_bustCache) placementStudentsInflight.set(cacheKey, run);
    return run;
  },

  /** Search students by USN, email, or name (for Add Violation) */
  searchStudents: async (search, limit = 50) => {
    try {
      const params = new URLSearchParams();
      if (search && String(search).trim()) params.set('search', String(search).trim());
      params.set('limit', Math.min(100, Math.max(1, limit)));
      const response = await apiFetch(`/placement/students?${params}`);
      return response.data ?? [];
    } catch (_error) {
      return [];
    }
  },

  /** GET /placement/students/overview-table - per-student placement overview table (admin) */
  getStudentsOverviewTable: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.limit) q.set('limit', params.limit);
    if (params.page) q.set('page', params.page);
    if (params.school) q.set('school', params.school);
    if (params.program) q.set('program', params.program);
    const response = await apiFetch(`/placement/students/overview-table${q.toString() ? `?${q}` : ''}`);
    return response.data ?? { rows: [], roundColumns: [], total: 0 };
  },

  /** Get student process list for a student (their applications) */
  getStudentProcessList: async (usn) => {
    try {
      const response = await apiFetch(`/placement/process/${usn}`);
      return response.data ?? [];
    } catch (_error) {
      return [];
    }
  },

  getAllJobOffers: async () => {
    try {
      const response = await apiFetch('/placement/job-offers');
      return response.data ?? [];
    } catch (_error) {
      return [];
    }
  },

  /** Add a job offer for a student */
  addJobOffer: async (data) => {
    const response = await apiFetch('/placement/job-offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  updateJobOffer: async (id, data) => {
    const response = await apiFetch(`/placement/job-offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  getStudentOffers: async (usn) => {
    try {
      const response = await apiFetch(`/placement/offers/${usn}`);
      return response.data ?? [];
    } catch (_error) {
      return [];
    }
  },

  /** Student accept/reject offer. placementId = placement id, isAccepted = true/false, remarks = required when rejecting */
  submitOfferDecision: async (placementId, isAccepted, remarks = '') => {
    const response = await apiFetch('/placement/offers/decision', {
      method: 'PATCH',
      body: JSON.stringify({
        placement_id: placementId,
        offer_id: placementId,
        is_accepted: isAccepted,
        remarks: remarks || undefined,
      }),
    });
    return response;
  },

  /**
   * Get placement/calendar events from the events API (student view).
   * Maps API fields (event_datetime, details) to the shape expected by StudentEvents.
   */
  getAllEvents: async () => {
    try {
      const response = await apiFetch('/events');
      const raw = Array.isArray(response?.data) ? response.data : [];
      return raw.map((e) => ({
        id: e.id,
        title: e.title || 'Event',
        type: e.type || 'Event',
        event_date: e.event_datetime || e.event_date,
        description: e.details || e.description || '',
        location: e.location || 'See details',
        status: e.status,
      }));
    } catch (_error) {
      return [];
    }
  },

  /**
   * Get all participating companies.
   * @param {Object} opts - Optional: { schoolId } to filter by school.
   * @returns {Promise<Array>} Companies array (backward compat for callers expecting array).
   * Use getCompaniesWithSchools() for Companies page to get { companies, schoolsList }.
   */
  getAllCompanies: async (opts) => {
    const schoolId = opts?.schoolId ?? opts?.school_id;
    const cacheKey = `companies-${schoolId ?? 'all'}`;
    return getOrFetch('placement', cacheKey, async () => {
      try {
        const params = schoolId != null ? `?school_id=${schoolId}` : '';
        const response = await apiFetch('/placement/companies' + params);
        const data = response.data ?? {};
        return (data.companies && Array.isArray(data.companies)) ? data.companies : (Array.isArray(data) ? data : []);
      } catch (_error) {
        return [];
      }
    });
  },

  /**
   * Get companies with schools list for filter UI. Uses process table: companies -> drives -> process -> students (school_id).
   * @param {number|null} schoolId - Optional school ID to filter companies.
   * @returns {Promise<{ companies: Array, schoolsList: Array }>}
   */
  getCompaniesWithSchools: async (schoolId = null) => {
    try {
      const params = schoolId != null ? `?school_id=${schoolId}` : '';
      const response = await apiFetch('/placement/companies' + params);
      const data = response.data ?? {};
      return {
        companies: Array.isArray(data.companies) ? data.companies : [],
        schoolsList: Array.isArray(data.schoolsList) ? data.schoolsList : [],
        totalCompanies: data.totalCompanies ?? data.companies?.length ?? 0,
      };
    } catch (_error) {
      return { companies: [], schoolsList: [], totalCompanies: 0 };
    }
  },

  /**
   * Get a single company by id
   */
  getCompanyById: async (id) => {
    try {
      const response = await apiFetch(`/placement/companies/${id}`);
      return response.data ?? null;
    } catch (_error) {
      return null;
    }
  },

  /**
   * Get placement drives for a company
   */
  getCompanyDrives: async (id) => {
    try {
      const response = await apiFetch(`/placement/companies/${id}/drives`);
      return response.data ?? [];
    } catch (_error) {
      return [];
    }
  },

  /**
   * Get placement offers (students hired) for a company
   */
  getCompanyOffers: async (id) => {
    try {
      const response = await apiFetch(`/placement/companies/${id}/offers`);
      return response.data ?? [];
    } catch (_error) {
      return [];
    }
  },

  /**
   * Add a new company. Payload: company_name, description, company_type, address, website, linkedin, remarks, company_logo_link.
   * Optional: contacts (array of { contact_name, email, phone_number, role_title, remarks }).
   */
  addCompany: async (payload) => {
    const response = await apiFetch('/placement/companies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /**
   * Update a company. Payload: company_name, description, company_type, address, website, linkedin, remarks, company_logo_link
   */
  updateCompany: async (id, payload) => {
    const response = await apiFetch(`/placement/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  deleteCompany: async (id, { offersAction = 'delete' } = {}) => {
    await apiFetch(`/placement/companies/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ offersAction }),
    });
  },

  getCompanyContacts: async (id) => {
    try {
      const response = await apiFetch(`/placement/companies/${id}/contacts`);
      return response.data ?? [];
    } catch (_error) {
      return [];
    }
  },

  addCompanyContacts: async (id, contacts) => {
    const response = await apiFetch(`/placement/companies/${id}/contacts`, {
      method: 'POST',
      body: JSON.stringify(Array.isArray(contacts) ? { contacts } : contacts),
    });
    return response.data;
  },

  updateCompanyContact: async (companyId, contactId, payload) => {
    const response = await apiFetch(`/placement/companies/${companyId}/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  deleteCompanyContact: async (companyId, contactId) => {
    await apiFetch(`/placement/companies/${companyId}/contacts/${contactId}`, { method: 'DELETE' });
  },

  /**
   * Apply for a drive
   */
  applyForDrive: async (driveId, usn) => {
      try {
          const response = await apiFetch(`/placement/drives/${driveId}/apply`, {
              method: 'POST',
              body: JSON.stringify({ usn })
          });
          return response.data;
      } catch (error) {
          throw error;
      }
  },

  /** Register a student for a drive (same as apply; usn, driveId order for AddStudentsToDrive). admin_override: allow adding despite eligibility when drive has admin_override_allowed. */
  registerForDrive: async (usn, driveId, opts = {}) => {
      const body = { usn };
      if (opts.admin_override) body.admin_override = true;
      const response = await apiFetch(`/placement/drives/${driveId}/apply`, {
          method: 'POST',
          body: JSON.stringify(body)
      });
      return response.data;
  },

  /**
   * Placement overview for admin Students > Placement Overview tab
   */
  getPlacementOverview: async (academicYear) => {
    try {
      const query = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : '';
      const response = await apiFetch(`/placement/students/overview${query}`);
      return response.data;
    } catch (_error) {
      return { rows: [], schoolOverview: {}, academicYears: [] };
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await apiFetch('/placement/dashboard-stats');
      return response.data ?? { total_registered: 0, total_seeking: 0, total_eligible: 0 };
    } catch (_error) {
      return { total_registered: 0, total_seeking: 0, total_eligible: 0 };
    }
  },

  /** Full dashboard analytics (PostgreSQL aggregates — no student pagination). */
  getDashboardAnalytics: async () => {
    return getOrFetch('placement', 'dashboard-analytics-v2', async () => {
      try {
        const response = await apiFetch('/placement/dashboard/analytics');
        return response.data ?? null;
      } catch (_error) {
        return null;
      }
    }, 60 * 1000);
  },

  getPlacementReport: async (dateFrom, dateTo) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const qs = params.toString();
    const response = await apiFetch(`/placement/reports${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  generatePlacementReport: async (dateFrom, dateTo, options = {}) => {
    const response = await apiFetch('/placement/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        dateFrom,
        dateTo,
        reportName: options.reportName,
        reportType: options.reportType || 'placement_summary',
      }),
    });
    return response.data;
  },

  getPlacementReportHistory: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.reportType) params.set('reportType', filters.reportType);
    if (filters.generatedBy) params.set('generatedBy', filters.generatedBy);
    if (filters.status) params.set('status', filters.status);
    if (filters.historyFrom) params.set('historyFrom', filters.historyFrom);
    if (filters.historyTo) params.set('historyTo', filters.historyTo);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.sort) params.set('sort', filters.sort);
    const qs = params.toString();
    const response = await apiFetch(`/placement/reports/history${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  viewPlacementReport: async (id) => {
    const response = await apiFetch(`/placement/reports/${id}/view`);
    return response.data;
  },

  downloadPlacementReport: async (id, fileName = 'placement-report.xlsx') => {
    const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
    const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/placement/reports/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      let message = 'Download failed';
      try {
        const err = await response.json();
        message = err.message || message;
      } catch (_) {
        /* ignore */
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  deletePlacementReport: async (id) => {
    const response = await apiFetch(`/placement/reports/${id}`, { method: 'DELETE' });
    return response.data;
  },

  getAllPolicies: async () => {
    try {
      const response = await apiFetch('/placement/policies');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /** Get batch academic policy for the current student (by school/program/year). */
  getMyPolicy: async () => {
    try {
      const response = await apiFetch('/placement/policies/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  upsertPolicy: async (data) => {
    const response = await apiFetch('/placement/policies', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data;
  },

  syncPolicies: async () => {
    const response = await apiFetch('/placement/policies/sync', { method: 'POST' });
    return response.data;
  },

  // --- Alumni ---
  /** Get current logged-in alumni profile (alumni role only) */
  getAlumniMe: async () => {
    const response = await apiFetch('/placement/alumni/me');
    return response.data;
  },

  /** Update current logged-in alumni profile */
  updateAlumniMe: async (data) => {
    const response = await apiFetch('/placement/alumni/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /** Upload alumni profile image */
  uploadAlumniImage: async (alumniId, file) => {
    if (!file || !(file instanceof File)) {
      throw new Error('Please select a valid image file');
    }
    if (file.size === 0) {
      throw new Error('File is empty');
    }
    const formData = new FormData();
    formData.append('file', file, file.name || 'profile.jpg');
    formData.append('alumni_id', String(alumniId));
    formData.append('folder', 'profile_image');

    const token = localStorage.getItem('token');
    const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
    const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }

    return response.json();
  },

  getAllAlumni: async () => {
    try {
      const response = await apiFetch('/placement/alumni');
      return response.data || [];
    } catch (error) {
      throw error;
    }
  },

  getAlumniConversions: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.school_id != null && params.school_id !== '') q.set('school_id', params.school_id);
    if (params.program_id != null && params.program_id !== '') q.set('program_id', params.program_id);
    const batch = params.batch ?? params.year_of_joining;
    if (batch != null && batch !== '' && batch !== 'all') q.set('batch', batch);
    if (params.current_year != null && params.current_year !== '' && params.current_year !== 'all') {
      q.set('current_year', params.current_year);
    }
    if (params.section != null && params.section !== '' && params.section !== 'all') {
      q.set('section', params.section);
    }
    if (params.opt_in != null && params.opt_in !== '' && params.opt_in !== 'all') q.set('opt_in', params.opt_in);
    if (params.is_placed != null && params.is_placed !== '' && params.is_placed !== 'all') {
      q.set('is_placed', params.is_placed);
    }
    if (params.search != null && String(params.search).trim() !== '') q.set('search', String(params.search).trim());
    if (params.has_personal_email === true || params.has_personal_email === 'true' || params.personal_email === '1') {
      q.set('has_personal_email', 'true');
    }
    const response = await apiFetch(`/placement/alumni/conversions${q.toString() ? `?${q}` : ''}`);
    return response.data ?? { schools: [], programs: [], rows: [], filter_meta: { years: [], current_years: [], sections: [] } };
  },

  convertToAlumni: async (usns) => {
    const response = await apiFetch('/placement/alumni/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usns }),
    });
    return response.data;
  },

  getAlumniConversionLogs: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.batch_id) q.set('batch_id', params.batch_id);
    if (params.status) q.set('status', params.status);
    if (params.limit != null) q.set('limit', params.limit);
    const response = await apiFetch(`/placement/alumni/conversion-logs${q.toString() ? `?${q}` : ''}`);
    return response.data?.logs ?? [];
  },

  addAlumni: async (data) => {
    const response = await apiFetch('/placement/alumni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.data;
  },

  getAlumniByIdOrUsn: async (identifier) => {
    try {
      const response = await apiFetch(`/placement/alumni/${encodeURIComponent(identifier)}`);
      return response.data;
    } catch (_error) {
      return null;
    }
  },

  updateAlumni: async (identifier, data) => {
    const response = await apiFetch(`/placement/alumni/${encodeURIComponent(identifier)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteAlumni: async (identifier) => {
    const response = await apiFetch(`/placement/alumni/${encodeURIComponent(identifier)}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  getRegistrationCodes: async () => {
    try {
      const response = await apiFetch('/placement/alumni/codes');
      return response.data || [];
    } catch (error) {
      throw error;
    }
  },

  generateRegistrationCode: async (data) => {
    const response = await apiFetch('/placement/alumni/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteRegistrationCode: async (id) => {
    const response = await apiFetch(`/placement/alumni/codes/${id}`, { method: 'DELETE' });
    return response.data;
  },

  /** Admin: get all student projects (uses projects table via admin API) */
  getAllProjects: async (params = {}) => {
    const sp = new URLSearchParams();
    if (params.project_status) sp.set('project_status', params.project_status);
    if (params.search) sp.set('search', params.search);
    const q = sp.toString();
    const url = q ? `/admin/projects?${q}` : '/admin/projects';
    const response = await apiFetch(url);
    return response.data ?? [];
  },

  /** Alumni: get approved public projects with like status */
  getAlumniProjects: async () => {
    const response = await apiFetch('/placement/projects/alumni');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.projects)) return data.projects;
    return [];
  },

  /** Alumni: get single approved project by id (full detail for view page) */
  getAlumniProjectById: async (projectId) => {
    const response = await apiFetch(`/placement/projects/alumni/${projectId}`);
    return response.data;
  },

  /** Add review (any authenticated user – used by alumni on project detail page). POST /api/projects/:id/reviews */
  addProjectReviewPublic: async (projectId, reviewText) => {
    const response = await apiFetch(`/projects/${projectId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ review_text: reviewText }),
    });
    return response.data;
  },

  /** Alumni: get student profile for viewing (limited data) */
  getStudentProfileForAlumni: async (usn) => {
    const response = await apiFetch(`/placement/alumni/student/${encodeURIComponent(usn)}`);
    return response.data;
  },

  /** Alumni: submit HR recommendation */
  submitHrRecommendation: async (data) => {
    const response = await apiFetch('/placement/alumni/hr-recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /** Alumni: get my HR recommendations */
  getMyHrRecommendations: async () => {
    const response = await apiFetch('/placement/alumni/hr-recommendations');
    return response.data ?? [];
  },

  /** Alumni: get events that were notified to this alumni */
  getAlumniEvents: async () => {
    const response = await apiFetch('/placement/alumni/events');
    return Array.isArray(response?.data) ? response.data : [];
  },

  /** Alumni: list my notifications. Params: tab (unread|read|archived|starred), search, page, limit */
  getAlumniNotifications: async (params = {}) => {
    try {
      const sp = new URLSearchParams();
      if (params.tab) sp.set('tab', params.tab);
      if (params.search) sp.set('search', params.search);
      if (params.page != null) sp.set('page', params.page);
      if (params.limit != null) sp.set('limit', params.limit);
      const qs = sp.toString();
      const response = await apiFetch(`/placement/alumni/notifications${qs ? `?${qs}` : ''}`);
      const data = response?.data ?? response;
      const list = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
      return {
        notifications: list,
        total: data?.total ?? list.length,
        page: data?.page ?? 1,
        limit: data?.limit ?? 20,
        totalPages: data?.totalPages ?? 1,
      };
    } catch (err) {
      throw err;
    }
  },

  /** Alumni: unread notifications count for badge */
  getAlumniNotificationsUnreadCount: async () => {
    try {
      const response = await apiFetch('/placement/alumni/notifications/unread-count');
      const data = response?.data ?? response;
      return typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
    } catch (_err) {
      return 0;
    }
  },

  /** VC: all events from events table */
  getVcEvents: async () => {
    const response = await apiFetch('/placement/vc/events');
    const data = response?.data ?? response;
    return Array.isArray(data) ? data : [];
  },

  /** Alumni: update notification node (mark read, archive, star) */
  updateAlumniNotificationNode: async (nodeId, payload) => {
    const response = await apiFetch(`/placement/alumni/notifications/${nodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /** Admin: get all HR recommendations */
  getAllHrRecommendations: async () => {
    const response = await apiFetch('/placement/hr-recommendations');
    return response.data ?? [];
  },

  /** Toggle favorite on a project (admin, alumni, or any authenticated user) */
  toggleProjectFavorite: async (projectId) => {
    const response = await apiFetch(`/projects/${projectId}/favorite`, { method: 'POST' });
    const data = response.data ?? response;
    return {
      is_favorited: data.favorited ?? data.is_favorited ?? false,
      favorites_count: data.favorites ?? data.favorites_count ?? 0,
    };
  },

  /** Toggle like on a project (admin, alumni, or any authenticated user) */
  toggleProjectLike: async (projectId) => {
    const response = await apiFetch(`/placement/projects/${projectId}/like`, {
      method: 'POST',
    });
    const data = response.data ?? response;
    return {
      is_liked: data.liked ?? data.is_liked ?? false,
      likes_count: data.likes ?? data.likes_count ?? 0,
    };
  },

  /** Increment project view count */
  incrementProjectView: async (projectId) => {
    const response = await apiFetch(`/placement/projects/${projectId}/view`, {
      method: 'POST',
    });
    return response.data;
  },

  /** Admin: get full project by id (assets, variants, reviews, share links, metrics) */
  getProjectById: async (id) => {
    const response = await apiFetch(`/admin/projects/${id}`);
    return response.data;
  },

  /** Admin: update project (project_status: approved|rejected|archived) */
  updateProject: async (id, data) => {
    const payload = {};
    if (data.project_status) payload.project_status = data.project_status;
    else if (data.is_approved !== undefined) payload.project_status = data.is_approved ? 'approved' : 'rejected';
    const response = await apiFetch(`/admin/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /** Admin: delete project and all sub-tables */
  deleteProject: async (id) => {
    await apiFetch(`/admin/projects/${id}`, { method: 'DELETE' });
  },

  /** Admin: add asset to project */
  addProjectAsset: async (projectId, data) => {
    const response = await apiFetch(`/admin/projects/${projectId}/assets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /** Admin: delete project asset */
  deleteProjectAsset: async (projectId, assetId) => {
    await apiFetch(`/admin/projects/${projectId}/assets/${assetId}`, { method: 'DELETE' });
  },

  /** Admin: update project asset (position, asset_role) */
  updateProjectAsset: async (projectId, assetId, data) => {
    const response = await apiFetch(`/admin/projects/${projectId}/assets/${assetId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /** Admin: list asset variants */
  getProjectAssetVariants: async (projectId, assetId) => {
    const response = await apiFetch(`/admin/projects/${projectId}/assets/${assetId}/variants`);
    return response.data ?? [];
  },

  /** Admin: delete asset variant */
  deleteProjectAssetVariant: async (projectId, assetId, variantId) => {
    await apiFetch(`/admin/projects/${projectId}/assets/${assetId}/variants/${variantId}`, { method: 'DELETE' });
  },

  /** Admin: list project reviews */
  getProjectReviews: async (projectId) => {
    const response = await apiFetch(`/admin/projects/${projectId}/reviews`);
    return response.data ?? [];
  },

  /** Admin: add project review */
  addProjectReview: async (projectId, reviewText) => {
    const response = await apiFetch(`/admin/projects/${projectId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ review_text: reviewText }),
    });
    return response.data;
  },

  /** Admin: delete project review */
  deleteProjectReview: async (projectId, reviewId) => {
    await apiFetch(`/admin/projects/${projectId}/reviews/${reviewId}`, { method: 'DELETE' });
  },

  /** Admin: list project share links */
  getProjectShareLinks: async (projectId) => {
    const response = await apiFetch(`/admin/projects/${projectId}/share-links`);
    return response.data ?? [];
  },

  /** Admin: create project share link */
  createProjectShareLink: async (projectId, expiresInHours = 168) => {
    const response = await apiFetch(`/admin/projects/${projectId}/share-links`, {
      method: 'POST',
      body: JSON.stringify({ expires_in_hours: expiresInHours }),
    });
    return response.data;
  },

  /** Admin: delete project share link */
  deleteProjectShareLink: async (projectId, linkId) => {
    await apiFetch(`/admin/projects/${projectId}/share-links/${linkId}`, { method: 'DELETE' });
  },

  /** Public: get approved PUBLIC projects for showcase (uses /api/projects/feed) */
  getPublicProjects: async (params = {}) => {
    const sp = new URLSearchParams();
    if (params.limit) sp.set('limit', params.limit);
    if (params.best === 'true') sp.set('sort', 'popular');
    const q = sp.toString();
    const url = q ? `/projects/feed?${q}` : '/projects/feed';
    const response = await apiFetch(url);
    const rows = response.data ?? response ?? [];
    return Array.isArray(rows) ? rows.map((r) => ({
      id: r.id,
      usn: r.owner_usn,
      title: r.title,
      one_line_description: r.short_description,
      full_description: r.description,
      project_snaps: r.cover_url ? [r.cover_url] : [],
      genre: r.category,
      technologies: r.tech_stack || [],
      views_count: r.views ?? 0,
      likes_count: r.likes ?? 0,
    })) : [];
  },

  /** Violations: eligibility decision logs */
  getEligibilityDecisionLogs: async () => {
    const response = await apiFetch('/placement/violations/eligibility-logs');
    return response.data ?? [];
  },

  /** Violations: student placement violations */
  getPlacementViolations: async () => {
    const response = await apiFetch('/placement/violations/placement-violations');
    return response.data ?? [];
  },

  /** Violations: student disciplinary records */
  getDisciplinaryRecords: async () => {
    const response = await apiFetch('/placement/violations/disciplinary-records');
    return response.data ?? [];
  },

  /** Violations: create eligibility decision log */
  createEligibilityDecisionLog: async (data) => {
    const response = await apiFetch('/placement/violations/eligibility-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /** Violations: create placement violation */
  createPlacementViolation: async (data) => {
    const response = await apiFetch('/placement/violations/placement-violations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /** Violations: create disciplinary record */
  createDisciplinaryRecord: async (data) => {
    const response = await apiFetch('/placement/violations/disciplinary-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  updateEligibilityDecisionLog: async (id, data) => {
    const response = await apiFetch(`/placement/violations/eligibility-logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteEligibilityDecisionLog: async (id) => {
    const response = await apiFetch(`/placement/violations/eligibility-logs/${id}`, { method: 'DELETE' });
    return response.data;
  },

  updatePlacementViolation: async (id, data) => {
    const response = await apiFetch(`/placement/violations/placement-violations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deletePlacementViolation: async (id) => {
    const response = await apiFetch(`/placement/violations/placement-violations/${id}`, { method: 'DELETE' });
    return response.data;
  },

  updateDisciplinaryRecord: async (id, data) => {
    const response = await apiFetch(`/placement/violations/disciplinary-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteDisciplinaryRecord: async (id) => {
    const response = await apiFetch(`/placement/violations/disciplinary-records/${id}`, { method: 'DELETE' });
    return response.data;
  },

  /** Alumni: Create connection request */
  createAlumniConnectionRequest: async (data) => {
    const response = await apiFetch('/placement/alumni/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /** Admin: Get all alumni connection requests */
  getAlumniConnectionRequests: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    const url = `/placement/alumni/connection-requests${qs.toString() ? `?${qs}` : ''}`;
    const response = await apiFetch(url);
    return response.data ?? { rows: [] };
  },

  /** Admin: Update connection request status */
  updateAlumniConnectionRequest: async (id, { status, po_remarks }) => {
    const response = await apiFetch(`/placement/alumni/connection-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, po_remarks }),
    });
    return response.data;
  },

  // ========== Student Eligibility Management ==========

  /** Get students with eligibility flags */
  getStudentsEligibility: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.school_id) qs.set('school_id', params.school_id);
    if (params.program_id) qs.set('program_id', params.program_id);
    if (params.search) qs.set('search', params.search);
    if (params.limit) qs.set('limit', params.limit);
    if (params.page) qs.set('page', params.page);
    const response = await apiFetch(`/placement/students/eligibility${qs.toString() ? `?${qs}` : ''}`);
    return response.data;
  },

  /** Update individual student eligibility */
  updateStudentEligibility: async (usn, eligibility) => {
    const response = await apiFetch(`/placement/students/${usn}/eligibility`, {
      method: 'PUT',
      body: JSON.stringify(eligibility),
    });
    return response.data;
  },

  /** Bulk update student eligibility */
  bulkUpdateStudentEligibility: async (usns, eligibility) => {
    const response = await apiFetch('/placement/students/eligibility/bulk', {
      method: 'PUT',
      body: JSON.stringify({ usns, eligibility }),
    });
    return response.data;
  },

  // ========== Student Edit Control (Profile Locks) ==========

  /** Get students with student_edit_control flags (admin). Params: page, limit, search */
  getStudentProfileLocks: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    if (params.search) qs.set('search', params.search);
    const response = await apiFetch(`/placement/students/profile-locks${qs.toString() ? `?${qs}` : ''}`);
    return response.data ?? { rows: [], total: 0, page: 1, totalPages: 0 };
  },

  /** Get count of students matching batch lock filters */
  getBatchLockCount: async (filters = {}) => {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) qs.set(k, v); });
    const response = await apiFetch(`/placement/students/profile-locks/batch-count${qs.toString() ? `?${qs}` : ''}`);
    return response.data?.count ?? 0;
  },

  /** Update lock flags for a batch of students */
  batchUpdateProfileLocks: async (filters, locks) => {
    const response = await apiFetch('/placement/students/profile-locks/batch-update', {
      method: 'POST',
      body: JSON.stringify({ filters, locks }),
    });
    return response.data;
  },

  /** Sync missing student_edit_control rows (admin). */
  syncStudentProfileLocks: async () => {
    const response = await apiFetch('/placement/students/profile-locks/sync', { method: 'POST' });
    return response.data ?? { inserted: 0 };
  },

  /** Update a student's lock flags (admin). */
  updateStudentProfileLocks: async (usn, patch) => {
    const response = await apiFetch(`/placement/students/profile-locks/${encodeURIComponent(usn)}`, {
      method: 'PUT',
      body: JSON.stringify(patch || {}),
    });
    return response.data;
  },

  /** Get edit control (lock flags) for one student (admin). */
  getStudentEditControl: async (usn) => {
    const response = await apiFetch(`/placement/students/${encodeURIComponent(usn)}/edit-control`);
    return response.data ?? null;
  },

  // ========== Semester Unlock Requests ==========

  /** List semester unlock requests (admin). Optional: ?status=pending|approved|rejected */
  getSemesterUnlockRequests: async (status) => {
    const q = status && ['pending', 'approved', 'rejected'].includes(String(status).toLowerCase())
      ? `?status=${encodeURIComponent(status)}`
      : '';
    const response = await apiFetch(`/placement/students/sem-unlock-requests${q}`);
    return response.data ?? { rows: [] };
  },

  /** Get student's own pending unlock requests (semester numbers). */
  getMySemesterUnlockRequests: async () => {
    const response = await apiFetch('/placement/students/sem-unlock-requests/me');
    return response.data ?? { semesters: [] };
  },

  /** Create semester unlock request (student). */
  createSemesterUnlockRequest: async (semester, reason) => {
    const response = await apiFetch('/placement/students/sem-unlock-requests', {
      method: 'POST',
      body: JSON.stringify({ semester, reason }),
    });
    return response.data;
  },

  /** Approve request and unlock semester (admin). */
  approveSemesterUnlockRequest: async (id) => {
    const response = await apiFetch(`/placement/students/sem-unlock-requests/${id}/approve`, {
      method: 'PUT',
    });
    return response.data;
  },

  /** Reject request (admin). */
  rejectSemesterUnlockRequest: async (id, adminNotes, sendNotification = false) => {
    const response = await apiFetch(`/placement/students/sem-unlock-requests/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({
        admin_notes: adminNotes || '',
        send_notification: !!sendNotification,
      }),
    });
    return response.data;
  },
};
