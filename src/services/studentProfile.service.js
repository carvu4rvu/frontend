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
      console.error("Error fetching student profile:", error);
      return null;
    }
  },

  /**
   * Get specific profile section
   * @param {string} usn
   * @param {string} section
   */
  getSection: async (usn, section) => {
    try {
      const response = await apiFetch(`/student/profile/${usn}/${section}`);
      return response.data;
    } catch (error) {
      // console.error(`Error fetching section ${section}:`, error);
      return null;
    }
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
      // In a real app, this might be different, but for now alias it
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
   * Upload a file (resume, certificate, etc.)
   * @param {string} usn 
   * @param {File} file 
   * @param {Object} options 
   */
  uploadFile: async (usn, file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('usn', usn);
    if (options.folder) {
        formData.append('folder', options.folder);
    }
    
    const token = localStorage.getItem('token');
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;
    
    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error('File upload failed');
    }

    return await response.json();
  }
};
