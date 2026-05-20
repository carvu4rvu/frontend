const STORAGE_KEY = 'placement_previous_path';

/** Admin viewing a student profile under /placement/students/:usn/... */
export function isAdminStudentProfilePath(pathname = '') {
  return /^\/placement\/students\/[^/]+/.test(pathname);
}

export function getStudentProfileBasePath(pathname = '') {
  const match = pathname.match(/^(\/placement\/students\/[^/]+)/);
  return match ? match[1] : null;
}

const PATH_LABEL_RULES = [
  { test: (p) => p === '/placement/students' || p.startsWith('/placement/students?'), label: 'Back to Students' },
  { test: (p) => p.startsWith('/placement/gallery/showcase'), label: 'Back to Showcase' },
  { test: (p) => p.startsWith('/placement/gallery/top-charts'), label: 'Back to Top Charts' },
  { test: (p) => p.startsWith('/placement/gallery/manage'), label: 'Back to Manage Projects' },
  { test: (p) => p.startsWith('/placement/gallery/project'), label: 'Back to Project' },
  { test: (p) => p.includes('/placement/events/') && p.includes('/process'), label: 'Back to Drive Process' },
  { test: (p) => p.startsWith('/placement/events'), label: 'Back to Placement Drives' },
  { test: (p) => p.startsWith('/placement/job-offers'), label: 'Back to Job Offers' },
  { test: (p) => p.startsWith('/placement/violations'), label: 'Back to Violations' },
  { test: (p) => p.startsWith('/placement/overview'), label: 'Back to Placement Overview' },
  { test: (p) => p.startsWith('/placement/dashboard'), label: 'Back to Dashboard' },
  { test: (p) => p.startsWith('/placement/alumni'), label: 'Back to Alumni' },
  { test: (p) => p.startsWith('/placement/companies'), label: 'Back to Companies' },
  { test: (p) => p.startsWith('/placement/notifications'), label: 'Back to Notifications' },
  { test: (p) => p.startsWith('/placement/user-login'), label: 'Back to Login Settings' },
  { test: (p) => p.startsWith('/placement/hr-recommendations'), label: 'Back to HR Recommendations' },
  { test: (p) => p.startsWith('/placement/alumni-connect'), label: 'Back to Alumni Connect' },
];

export function getBackLabelForPath(path) {
  if (!path) return 'Back';
  const pathname = path.split('?')[0];
  const rule = PATH_LABEL_RULES.find((r) => r.test(pathname) || r.test(path));
  return rule?.label ?? 'Back';
}

export function getStoredPreviousPath() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function resolveAdminStudentBack(location, fallbackPath = '/placement/students') {
  const fromState = location.state?.from;
  if (fromState && typeof fromState === 'string') {
    return {
      path: fromState,
      label: location.state?.fromLabel || getBackLabelForPath(fromState),
    };
  }

  const stored = getStoredPreviousPath();
  if (stored && !isAdminStudentProfilePath(stored.split('?')[0])) {
    return { path: stored, label: getBackLabelForPath(stored) };
  }

  return { path: fallbackPath, label: getBackLabelForPath(fallbackPath) };
}
