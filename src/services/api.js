const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const text = await response.text();
        // If it's a 404/500 HTML page, throwing an error with status is more helpful
        throw new Error(`Server Error: ${response.status} ${response.statusText}`);
    }

    // Handle token expiration
    if (response.status === 401 && (data.message === 'Token expired' || data.message === 'Invalid token' || data.message === 'Access token required')) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return { ok: true, json: async () => data, data };
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
};
