import { apiFetch } from './api';

export const StudentProfileService = {
  /**
   * Get full student profile
   * @param {string} usn 
   */
  getFullProfile: async (usn) => {
    try {
      const response = await apiFetch(`/student/profile/${usn}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Get edit control (lock flags) for the current student (own profile).
   */
  getEditControl: async () => {
    try {
      const response = await apiFetch('/student/profile/edit-control');
      return response.data ?? null;
    } catch (e) {
      console.error('[getEditControl]', e);
      return null;
    }
  },

  /**
   * Get specific profile section
   * @param {string} usn
   * @param {string} section
   */
  getSection: async (usn, section) => {
    const endpoint = `/student/profile/${usn}/${section}`;
    try {
      const response = await apiFetch(endpoint);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Get manual academic semesters + course-wise details (no OCR).
   * @param {string} usn
   */
  getAcademicSemesters: async (usn) => {
    const endpoint = `/student/profile/${encodeURIComponent(usn)}/academic-semesters`;
    try {
      const response = await apiFetch(endpoint);
      const data = response?.data;
      // Normalize: backend returns { semesters: [...] }; ensure we always return that shape
      if (data && Array.isArray(data.semesters)) return data;
      if (Array.isArray(data)) return { semesters: data };
      return { semesters: [] };
    } catch (error) {
      console.error('[getAcademicSemesters]', error);
      return { semesters: [] };
    }
  },

  /**
   * Create or update a single academic semester with courses.
   * @param {string} usn
   * @param {{ academic_year: number, semester: number, courses: Array }} payload
   */
  saveAcademicSemester: async (usn, payload) => {
    const endpoint = `/student/profile/${usn}/academic-semesters`;
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /**
   * Delete a single academic semester.
   * @param {string} usn
   * @param {number|string} semesterId
   */
  deleteAcademicSemester: async (usn, semesterId) => {
    if (!usn || !semesterId) {
      throw new Error('USN and Semester ID are required for deletion.');
    }
    const endpoint = `/student/profile/${encodeURIComponent(usn)}/academic-semesters/${semesterId}`;
    const response = await apiFetch(endpoint, {
      method: 'DELETE',
    });
    return response.data;
  },

  /**
   * Update specific profile section
   * @param {string} usn 
   * @param {string} section 
   * @param {Object} data 
   */
  updateProfileSection: async (usn, section, data) => {
    try {
      const response = await apiFetch(`/student/profile/${usn}/${section}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Alias for updateProfileSection to match ResumeModule usage
   */
  saveSection: async (usn, section, data) => {
      const endpoint = `/student/profile/${usn}/${section}`;
      console.log('[StudentProfileService.saveSection]', { usn, section, endpoint, payload: data });
      try {
        const response = await apiFetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        console.log('[StudentProfileService.saveSection] SUCCESS', { section, responseData: response.data });
        return response.data;
      } catch (error) {
        console.error('[StudentProfileService.saveSection] ERROR', { section, error: error?.message, response: error?.response });
        throw error;
      }
  },

  /**
   * Upload a file (resume, certificate, etc.)
   * @param {string} usn 
   * @param {File} file 
   * @param {Object} options 
   */
  uploadFile: async (usn, file, options = {}) => {
    if (!file || !(file instanceof File)) {
      throw new Error('Please select a valid file to upload');
    }
    if (file.size === 0) {
      throw new Error('File is empty');
    }
    const formData = new FormData();
    formData.append('file', file, file.name || 'upload');
    formData.append('usn', String(usn));
    if (options.folder) {
        formData.append('folder', options.folder);
    }

    const token = localStorage.getItem('token');
    const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
    const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;
    
    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData
    });

    if (!response.ok) {
        let message = 'File upload failed';
        try {
            const errBody = await response.json();
            message = errBody.message || errBody.error || (typeof errBody.details === 'string' ? errBody.details : message);
            if (errBody.hint) message += ` ${errBody.hint}`;
        } catch (_) {
            // response not JSON
        }
        throw new Error(message);
    }

    return await response.json();
  },

  /**
   * Get all majors
   */
  getMajors: async () => {
    try {
      const response = await apiFetch('/student/majors');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  createMajor: async (data) => {
    const response = await apiFetch('/student/majors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  updateMajor: async (id, data) => {
    const response = await apiFetch(`/student/majors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteMajor: async (id, cascade = false) => {
    const url = `/student/majors/${id}${cascade ? '?cascade=true' : ''}`;
    await apiFetch(url, { method: 'DELETE' });
  },

  /**
   * Get all minors
   */
  getMinors: async () => {
    try {
      const response = await apiFetch('/student/minors');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  /**
   * Get all specializations
   */
  getSpecializations: async () => {
    try {
      const response = await apiFetch('/student/specializations');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  createSpecialization: async (data) => {
    const response = await apiFetch('/student/specializations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  updateSpecialization: async (id, data) => {
    const response = await apiFetch(`/student/specializations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteSpecialization: async (id, cascade = false) => {
    const url = `/student/specializations/${id}${cascade ? '?cascade=true' : ''}`;
    await apiFetch(url, { method: 'DELETE' });
  },

  /**
   * Get all schools
   */
  getSchools: async () => {
    try {
      const response = await apiFetch('/student/schools');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  /**
   * Get academy overview: schools with totalStudents (for Manage Academic)
   */
  getAcademyOverview: async () => {
    try {
      const response = await apiFetch('/student/academy/overview');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  /**
   * Create school. Body: { name, abbreviation? }
   */
  createSchool: async (data) => {
    const response = await apiFetch('/student/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Update school. id, body: { name?, abbreviation? }
   */
  updateSchool: async (id, data) => {
    const response = await apiFetch(`/student/schools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Delete school. Fails if any students are associated, unless cascade=true.
   */
  deleteSchool: async (id, cascade = false) => {
    const url = `/student/schools/${id}${cascade ? '?cascade=true' : ''}`;
    await apiFetch(url, { method: 'DELETE' });
  },

  /**
   * Get all programs
   */
  getPrograms: async () => {
    try {
      const response = await apiFetch('/student/programs');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  createProgram: async (data) => {
    const response = await apiFetch('/student/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  updateProgram: async (id, data) => {
    const response = await apiFetch(`/student/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteProgram: async (id, cascade = false) => {
    const url = `/student/programs/${id}${cascade ? '?cascade=true' : ''}`;
    await apiFetch(url, { method: 'DELETE' });
  },

  createMinor: async (data) => {
    const response = await apiFetch('/student/minors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  updateMinor: async (id, data) => {
    const response = await apiFetch(`/student/minors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  deleteMinor: async (id, cascade = false) => {
    const url = `/student/minors/${id}${cascade ? '?cascade=true' : ''}`;
    await apiFetch(url, { method: 'DELETE' });
  },

  /**
   * Get paginated list of students (admin) with optional filters
   * @param {Object} params - { page, limit, search, school_id, program_id, year_of_joining, is_active, sort_by, sort_order }
   */
  getStudentsList: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page != null) searchParams.set('page', params.page);
    if (params.limit != null) searchParams.set('limit', params.limit);
    if (params.search != null && params.search !== '') searchParams.set('search', params.search);
    if (params.school_id != null) searchParams.set('school_id', params.school_id);
    if (params.program_id != null) searchParams.set('program_id', params.program_id);
    if (params.year_of_joining != null) searchParams.set('year_of_joining', params.year_of_joining);
    if (params.is_active !== undefined && params.is_active !== '') searchParams.set('is_active', params.is_active);
    if (params.sort_by != null) searchParams.set('sort_by', params.sort_by);
    if (params.sort_order != null) searchParams.set('sort_order', params.sort_order);
    const qs = searchParams.toString();
    const url = `/student/students${qs ? `?${qs}` : ''}`;
    const response = await apiFetch(url);
    return response.data;
  },

  /**
   * Add a single student (admin)
   * @param {Object} data - { school_id, program_id, usn, full_name, college_email, year_of_joining, ...optional }
   * current_year and current_semester are computed from year_of_joining on the server.
   */
  addStudent: async (data) => {
    const response = await apiFetch('/student/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Check bulk students for duplicate USNs
   * @param {Object} payload - { school_id, program_id, students: [...] }
   * @returns {Promise<{ duplicateUsnsInDb, duplicateUsnsInFile, duplicateRows, hasDuplicates }>}
   */
  checkBulkDuplicates: async (payload) => {
    const response = await apiFetch('/student/students/bulk/check-duplicates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  /**
   * Bulk insert students (admin). Call after check-duplicates returns no duplicates.
   * @param {Object} payload - { school_id, program_id, students: [...] }
   */
  bulkInsertStudents: async (payload) => {
    const response = await apiFetch('/student/students/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },
};
