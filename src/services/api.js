const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;

let networkErrorWarnedOnce = false;

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  if (!networkErrorWarnedOnce) console.log('[apiFetch]', { method: options.method || 'GET', url, hasBody: !!options.body });

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

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else if (response.status !== 204 && response.status !== 201) {
      // Only throw for non-JSON if it's not a standard success with no content
      const text = await response.text();
      console.error('[apiFetch] Non-JSON response (404/HTML?)', { url, status: response.status, statusText: response.statusText, preview: text?.slice(0, 200) });
      throw new Error(`Server Error: ${response.status} ${response.statusText}`);
    }

    // Handle token expiration
    if (response.status === 401 && data && (data.message === 'Token expired' || data.message === 'Invalid token' || data.message === 'Access token required')) {
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
      console.error('[apiFetch] FAILED', { url, status: response.status, statusText: response.statusText, data });
      const msg = data?.message || data?.error || 'API request failed';
      const hasFieldErrors = data?.fieldErrors && typeof data.fieldErrors === 'object' && Object.keys(data.fieldErrors).length > 0;
      const err = new Error(hasFieldErrors ? `${msg} (See form for field-level errors.)` : msg);
      err.response = { status: response.status, data };
      throw err;
    }

    console.log('[apiFetch] SUCCESS', { url, status: response.status });
    return { ok: true, json: async () => data, data };
  } catch (error) {
    if (error?.name === 'AbortError' || error?.code === 'ABORT_ERR') {
      throw error;
    }
    // Network unreachable (e.g. backend not running) → friendlier message, log once per session
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message === 'Load failed')) {
      if (!networkErrorWarnedOnce) {
        networkErrorWarnedOnce = true;
        console.warn('[apiFetch] Backend unreachable (ERR_CONNECTION_REFUSED). Start it with: cd backend && npm run dev');
      }
      const friendly = new Error('Cannot reach server. Make sure the backend is running (e.g. cd backend && npm run dev) and the URL is correct.');
      friendly.cause = error;
      friendly.isNetworkError = true;
      throw friendly;
    }
    console.error('API Fetch Error:', error);
    throw error;
  }
};
