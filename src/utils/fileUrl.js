/**
 * Utility function to get the correct file URL
 * - Supabase PUBLIC buckets (projects, system-assets): return URL as-is, direct access
 * - Supabase PRIVATE buckets: use backend proxy for signed URL
 * - Legacy /uploads: backend static files
 */
const PRIVATE_BUCKETS = ['student-assets', 'student_assets', 'alumni-assets', 'company-assets', 'admin-assets'];

export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  // If it's already a signed URL (contains token), return it as is
  if (filePath.includes('?token=')) return filePath;

  // Use the origin from the API URL if provided, otherwise default to relative path
  // or localhost for development.
  const rawUrl = (import.meta.env.VITE_API_URL || '').trim();
  let API_URL = '/api';
  
  if (rawUrl) {
    API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
  } else if (typeof window !== 'undefined') {
    // In browser, if no API URL is set, assume it's on port 5000 for local dev
    // or same origin for production.
    if (window.location.hostname === 'localhost') {
      API_URL = 'http://localhost:5000/api';
    } else {
      API_URL = `${window.location.origin}/api`;
    }
  }

  const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

  // Full URL (http/https)
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    // Supabase storage: public buckets = direct URL, private = signed URL proxy
    if (filePath.includes('supabase.co/storage')) {
      const isPrivate = PRIVATE_BUCKETS.some((b) => filePath.includes(`/${b}/`) || filePath.includes(`/public/${b}/`));
      if (isPrivate) {
        // Proxy through backend to get a signed URL
        return `${API_URL}/upload/asset?url=${encodeURIComponent(filePath)}`;
      }
      return filePath; // public bucket - direct access
    }
    return filePath;
  }

  // Legacy /uploads path - backend static files
  if (filePath.startsWith('/uploads/')) {
    return `${API_BASE_URL}${filePath}`;
  }
  if (!filePath.startsWith('/')) {
    return `${API_BASE_URL}/uploads/${filePath}`;
  }
  return `${API_BASE_URL}${filePath}`;
};
