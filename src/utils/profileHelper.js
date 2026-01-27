/**
 * Helper to calculate profile completion percentage
 * @param {Object} profile - The full student profile object
 * @returns {number} - Completion percentage (0-100)
 */
export const calculateProfileCompletion = (profile) => {
    if (!profile) return 0;
  
    let score = 0;
    let totalWeight = 0;
  
    // Define weights for different sections
    const sections = [
      { key: 'first_name', weight: 10, check: (p) => !!p.first_name },
      { key: 'last_name', weight: 5, check: (p) => !!p.last_name },
      { key: 'usn', weight: 5, check: (p) => !!p.usn },
      { key: 'email', weight: 5, check: (p) => !!p.email },
      { key: 'mobile', weight: 5, check: (p) => !!p.mobile },
      
      // Communication/Contact Details
      { key: 'communication', weight: 10, check: (p) => p.communication && (p.communication.address || p.communication.city) },
      
      // Education (Assuming array or object)
      { key: 'education', weight: 20, check: (p) => {
          if (Array.isArray(p.education)) return p.education.length > 0;
          return !!p.education; 
      }},
      
      // Skills
      { key: 'skills', weight: 10, check: (p) => {
          if (Array.isArray(p.skills)) return p.skills.length > 0;
          return !!p.skills;
      }},
      
      // Projects
      { key: 'projects', weight: 10, check: (p) => {
          if (Array.isArray(p.projects)) return p.projects.length > 0;
          return !!p.projects;
      }},
  
      // Resume
      { key: 'resume_url', weight: 20, check: (p) => !!p.resume_url }
    ];
  
    sections.forEach(section => {
      totalWeight += section.weight;
      if (section.check(profile)) {
        score += section.weight;
      }
    });
  
    if (totalWeight === 0) return 0;
  
    return Math.round((score / totalWeight) * 100);
  };
