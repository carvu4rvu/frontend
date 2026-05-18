/**
 * Projects API client: /api/projects (new projects table, owner_user_id).
 * Existing placement project endpoints remain in placement.service.js.
 */

import { apiFetch } from './api';

const BASE = '/projects';

export const ProjectService = {
  /**
   * List projects for current user, or by usn (for profile view; admin or owner).
   * GET /api/projects?usn=...&profile=1 (profile: only non-private, order priority DESC, published_at DESC)
   */
  list: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.usn != null) q.set('usn', params.usn);
    if (params.profile) q.set('profile', '1');
    const url = q.toString() ? `${BASE}?${q}` : BASE;
    const response = await apiFetch(url);
    return response.data ?? response;
  },

  /**
   * Public feed: ranked by discovery score (blueprint algorithm).
   * GET /api/projects/feed?limit=20&sort=score|newest|popular
   * Each item includes: score, rank (1-based). sort=score is default.
   */
  feed: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.limit != null) q.set('limit', params.limit);
    if (params.sort) q.set('sort', params.sort); // score | newest | popular
    const url = q.toString() ? `${BASE}/feed?${q}` : `${BASE}/feed`;
    const response = await apiFetch(url);
    return response.data ?? response;
  },

  /**
   * Get one project by id. Visibility enforced by backend.
   * GET /api/projects/:id?include_rank=true
   * With include_rank: adds score, rank, total_public for public projects.
   */
  getOne: async (id, params = {}) => {
    const q = params.include_rank ? '?include_rank=true' : '';
    const response = await apiFetch(`${BASE}/${id}${q}`);
    return response.data ?? response;
  },

  /**
   * Create project. Body: title, short_description, description, category, tags, visibility, hosted_url, github_url, mentor_name, tech_stack, priority.
   * POST /api/projects
   */
  create: async (body) => {
    const response = await apiFetch(BASE, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data ?? response;
  },

  /**
   * Update project (owner only). Partial body.
   * PATCH /api/projects/:id
   */
  update: async (id, body) => {
    const response = await apiFetch(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return response.data ?? response;
  },

  /**
   * Delete project (owner only).
   * DELETE /api/projects/:id
   */
  delete: async (id) => {
    await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  },

  /**
   * Submit project for admin approval (draft → submitted). PATCH /api/projects/:id/submit
   */
  submit: async (id) => {
    const response = await apiFetch(`${BASE}/${id}/submit`, { method: 'PATCH' });
    return response.data ?? response;
  },

  /**
   * Publish project (owner only). Requires project_status=approved. Sets visibility=PUBLIC, published_at=now().
   * PATCH /api/projects/:id/publish
   */
  publish: async (id) => {
    const response = await apiFetch(`${BASE}/${id}/publish`, { method: 'PATCH' });
    return response.data ?? response;
  },

  /**
   * Add asset. Body: original_url, asset_type (IMAGE|VIDEO), asset_role (LOGO|COVER|GALLERY|VIDEO), position?, width?, height?, file_size_kb?, mime_type?
   * POST /api/projects/:id/assets
   */
  addAsset: async (projectId, body) => {
    const response = await apiFetch(`${BASE}/${projectId}/assets`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data ?? response;
  },

  /**
   * Delete asset. DELETE /api/projects/:id/assets/:assetId
   */
  deleteAsset: async (projectId, assetId) => {
    await apiFetch(`${BASE}/${projectId}/assets/${assetId}`, { method: 'DELETE' });
  },

  /**
   * Create share link. Body: expires_in_hours (optional). Returns { share_token, url, expires_at }.
   * POST /api/projects/:id/share
   */
  createShareLink: async (projectId, body = {}) => {
    const endpoint = `${BASE}/${projectId}/share`;
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
    const fullUrl = apiBase.endsWith('/') ? `${apiBase.slice(0, -1)}${endpoint}` : `${apiBase}${endpoint}`;
    console.log('[createShareLink] Request:', { projectId, endpoint, fullUrl, body });
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    console.log('[createShareLink] Success:', { projectId, data: response.data ?? response });
    return response.data ?? response;
  },

  /**
   * Resolve share by token (public). GET /api/projects/share/:token
   */
  getByShareToken: async (token) => {
    const response = await apiFetch(`${BASE}/share/${token}`);
    return response.data ?? response;
  },

  /**
   * Add review. Body: { review_text }. POST /api/projects/:id/reviews
   */
  addReview: async (projectId, body) => {
    const response = await apiFetch(`${BASE}/${projectId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data ?? response;
  },

  /** Reply to review (owner only). PATCH /api/projects/:id/reviews/:reviewId */
  replyReview: async (projectId, reviewId, body) => {
    const response = await apiFetch(`${BASE}/${projectId}/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return response.data ?? response;
  },

  /** Toggle like. POST /api/projects/:id/like */
  toggleLike: async (projectId) => {
    const response = await apiFetch(`${BASE}/${projectId}/like`, { method: 'POST' });
    return response.data ?? response;
  },

  /** Toggle favorite. POST /api/projects/:id/favorite */
  toggleFavorite: async (projectId) => {
    const response = await apiFetch(`${BASE}/${projectId}/favorite`, { method: 'POST' });
    return response.data ?? response;
  },

};
