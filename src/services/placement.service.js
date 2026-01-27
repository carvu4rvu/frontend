import { apiFetch } from './api';

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
    } catch (error) {
      console.error("Error fetching student placement process:", error);
      return [];
    }
  },

  /**
   * Get all active placement drives
   */
  getAllDrives: async () => {
    try {
      const response = await apiFetch('/placement/drives');
      return response.data || [];
    } catch (error) {
      console.error("Error fetching drives:", error);
      return [];
    }
  },

  /**
   * Get all participating companies
   */
  getAllCompanies: async () => {
    try {
      const response = await apiFetch('/placement/companies');
      return response.data || [];
    } catch (error) {
      console.error("Error fetching companies:", error);
      return [];
    }
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
  }
};
