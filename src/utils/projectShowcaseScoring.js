/**
 * Showcase ranking formulas (admin gallery).
 *
 * Variable availability on project objects from API:
 * - likes_count        → project_metrics.likes
 * - favorites_count    → project_metrics.favorites
 * - comments_count     → project_metrics.comments (review count)
 * - staff_favorite_count → staff bookmarks (admin/vc/placement)
 * - created_at / published_at → projects row (for freshness & timeDecay)
 * - seenPenalty        → localStorage (client-only, per browser)
 * - randomness         → stable jitter from project id + session seed (client)
 */

const SEEN_STORAGE_KEY = 'placement_showcase_seen_project_ids';
const SEEN_PENALTY = 12;
const FRESHNESS_MAX_BOOST = 15;
const FRESHNESS_HALF_LIFE_DAYS = 14;
const RANDOMNESS_MAX = 8;
const TIME_DECAY_HALF_LIFE_DAYS = 45;

export function getSeenProjectIds() {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(Number).filter((n) => !Number.isNaN(n)) : []);
  } catch {
    return new Set();
  }
}

export function markProjectSeen(projectId) {
  if (projectId == null) return;
  const id = Number(projectId);
  if (Number.isNaN(id)) return;
  const seen = getSeenProjectIds();
  seen.add(id);
  try {
    const list = [...seen].slice(-500);
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
}

function projectAgeDays(project) {
  const raw = project.published_at || project.created_at;
  if (!raw) return null;
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, (Date.now() - t) / 86400000);
}

/** Boost for newer projects (exponential decay by age). */
export function freshnessBoost(project) {
  const ageDays = projectAgeDays(project);
  if (ageDays == null) return 0;
  return FRESHNESS_MAX_BOOST * Math.exp(-ageDays / FRESHNESS_HALF_LIFE_DAYS);
}

/** Stable 0..RANDOMNESS_MAX per project for the session (not re-shuffled every render). */
export function stableRandomness(projectId, sessionSeed = 0) {
  const id = Number(projectId) || 0;
  const seed = Number(sessionSeed) || 0;
  const h = Math.abs((id * 9301 + seed * 49297) % 233280);
  return (h / 233280) * RANDOMNESS_MAX;
}

/** Multiplier in (0, 1] — newer projects rank higher in Top Charts. */
export function timeDecay(project) {
  const ageDays = projectAgeDays(project);
  if (ageDays == null) return 1;
  return Math.exp(-ageDays / TIME_DECAY_HALF_LIFE_DAYS);
}

/**
 * All Projects: (likes×4) + (favorites×6) + (comments×8) + freshness + random − seen
 */
export function allProjectsScore(project, { seenIds = new Set(), sessionSeed = 0 } = {}) {
  const likes = Number(project.likes_count) || 0;
  const favorites = Number(project.favorites_count) || 0;
  const comments = Number(project.comments_count) || 0;

  let score = likes * 4 + favorites * 6 + comments * 8;
  score += freshnessBoost(project);
  score += stableRandomness(project.id, sessionSeed);

  const id = Number(project.id);
  if (!Number.isNaN(id) && seenIds.has(id)) {
    score -= SEEN_PENALTY;
  }

  return score;
}

/**
 * Top Charts: (likes×5) + (favorites×8) + (comments×10) + (staffFavorites×20), then × timeDecay
 */
export function topChartsScore(project) {
  const likes = Number(project.likes_count) || 0;
  const favorites = Number(project.favorites_count) || 0;
  const comments = Number(project.comments_count) || 0;
  const staffFavorites = Number(project.staff_favorite_count) || 0;

  const score = likes * 5 + favorites * 8 + comments * 10 + staffFavorites * 20;
  return score * timeDecay(project);
}

export function sortByAllProjectsScore(projects, options) {
  return [...projects].sort((a, b) => {
    const diff = allProjectsScore(b, options) - allProjectsScore(a, options);
    if (diff !== 0) return diff;
    return (Number(b.likes_count) || 0) - (Number(a.likes_count) || 0);
  });
}

export function sortByTopChartsScore(projects) {
  return [...projects].sort((a, b) => {
    const diff = topChartsScore(b) - topChartsScore(a);
    if (diff !== 0) return diff;
    return (Number(b.likes_count) || 0) - (Number(a.likes_count) || 0);
  });
}

/** Report which formula inputs are present (for debugging / UI). */
export function scoringFieldStatus(project) {
  return {
    likes: (Number(project.likes_count) || 0) >= 0,
    favorites: (Number(project.favorites_count) || 0) >= 0,
    comments: project.comments_count != null,
    staffFavorites: project.staff_favorite_count != null,
    dates: !!(project.published_at || project.created_at),
    seenPenaltyClient: typeof localStorage !== 'undefined',
    randomnessClient: true,
  };
}
