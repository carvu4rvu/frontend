const STORAGE_KEY = 'placement_previous_path';

/** Admin viewing a student profile under /placement/students/:usn/... */
export function isAdminStudentProfilePath(pathname = '') {
  return /^\/placement\/students\/[^/]+/.test(pathname);
}

export function getStudentProfileBasePath(pathname = '') {
  const match = pathname.match(/^(\/placement\/students\/[^/]+)/);
  return match ? match[1] : null;
}

/** Admin project detail under gallery */
export function isGalleryProjectDetailPath(pathname = '') {
  return /^\/placement\/gallery\/project\/[^/]+/.test(pathname);
}

/** Placement admin detail / child routes — not valid "back" destinations */
export function isPlacementDetailPath(pathname = '') {
  if (!pathname.startsWith('/placement/')) return false;
  if (isAdminStudentProfilePath(pathname)) return true;
  if (isGalleryProjectDetailPath(pathname)) return true;
  if (/^\/placement\/company\/[^/]+/.test(pathname)) return true;
  if (/^\/placement\/events\/[^/]+/.test(pathname)) return true;
  if (/^\/placement\/alumni\/[^/]+/.test(pathname)) return true;
  if (/^\/placement\/notifications\/[^/]+/.test(pathname)) return true;
  if (/^\/placement\/alumni-directory\/[^/]+/.test(pathname)) return true;
  if (/^\/placement\/alumni-projects\/project\/[^/]+/.test(pathname)) return true;
  if (/^\/placement\/alumni-student\/[^/]+/.test(pathname)) return true;
  if (/^\/placement\/vc-projects\/project\/[^/]+/.test(pathname)) return true;
  return false;
}

/** Company portal detail routes */
export function isCompanyDetailPath(pathname = '') {
  if (!pathname.startsWith('/company/')) return false;
  return (
    /^\/company\/drive\/[^/]+/.test(pathname) ||
    /^\/company\/student\/[^/]+/.test(pathname) ||
    /^\/company\/projects\/project\/[^/]+/.test(pathname)
  );
}

export function isAppDetailPath(pathname = '') {
  return isPlacementDetailPath(pathname) || isCompanyDetailPath(pathname);
}

const PLACEMENT_PATH_LABEL_RULES = [
  { test: (p) => p === '/placement/students' || p.startsWith('/placement/students?'), label: 'Back to Students' },
  { test: (p) => p.startsWith('/placement/student-events'), label: 'Back to Events' },
  { test: (p) => p.startsWith('/placement/gallery/showcase'), label: 'Back to Showcase' },
  { test: (p) => p.startsWith('/placement/gallery/top-charts'), label: 'Back to Top Charts' },
  { test: (p) => p.startsWith('/placement/gallery/manage'), label: 'Back to Manage Projects' },
  { test: (p) => p === '/placement/gallery' || p.startsWith('/placement/gallery?'), label: 'Back to Gallery' },
  {
    test: (p) => /^\/placement\/events\/[^/]+\/registrations/.test(p.split('?')[0]),
    label: 'Back to Drive Process',
  },
  {
    test: (p) => /^\/placement\/events\/[^/]+\/process/.test(p.split('?')[0]),
    label: 'Back to Placement Drives',
  },
  {
    test: (p) => /^\/placement\/events\/[^/]+$/.test(p.split('?')[0]),
    label: 'Back to Placement Drives',
  },
  { test: (p) => p.startsWith('/placement/events'), label: 'Back to Placement Drives' },
  { test: (p) => p.startsWith('/placement/job-offers'), label: 'Back to Job Offers' },
  { test: (p) => p.startsWith('/placement/violations'), label: 'Back to Violations' },
  { test: (p) => p.startsWith('/placement/overview'), label: 'Back to Placement Overview' },
  { test: (p) => p.startsWith('/placement/dashboard'), label: 'Back to Dashboard' },
  { test: (p) => p.startsWith('/placement/calendar'), label: 'Back to Calendar' },
  { test: (p) => p.startsWith('/placement/process'), label: 'Back to Process' },
  { test: (p) => p.startsWith('/placement/reports'), label: 'Back to Reports' },
  { test: (p) => p.startsWith('/placement/companies'), label: 'Back to Companies' },
  { test: (p) => p.startsWith('/placement/company/'), label: 'Back to Companies' },
  { test: (p) => p.startsWith('/placement/alumni-directory'), label: 'Back to Alumni Directory' },
  { test: (p) => p.startsWith('/placement/alumni-projects'), label: 'Back to Projects' },
  { test: (p) => p.startsWith('/placement/alumni-student/'), label: 'Back to Projects' },
  { test: (p) => p.startsWith('/placement/alumni-dashboard'), label: 'Back to Dashboard' },
  { test: (p) => p === '/placement/alumni' || p.startsWith('/placement/alumni?'), label: 'Back to Alumni' },
  { test: (p) => p.startsWith('/placement/alumni/'), label: 'Back to Alumni' },
  { test: (p) => p.startsWith('/placement/notifications'), label: 'Back to Notifications' },
  { test: (p) => p.startsWith('/placement/user-login'), label: 'Back to Login Settings' },
  { test: (p) => p.startsWith('/placement/hr-recommendations'), label: 'Back to HR Recommendations' },
  { test: (p) => p.startsWith('/placement/alumni-connect'), label: 'Back to Alumni Connect' },
  { test: (p) => p.startsWith('/placement/alumni-hr-recommendations'), label: 'Back to Recommendations' },
  { test: (p) => p.startsWith('/placement/alumni-events'), label: 'Back to Events' },
  { test: (p) => p.startsWith('/placement/vc-projects'), label: 'Back to Student Projects' },
];

const COMPANY_PATH_LABEL_RULES = [
  { test: (p) => p.startsWith('/company/dashboard'), label: 'Back to Dashboard' },
  { test: (p) => p.startsWith('/company/drives'), label: 'Back to Drives' },
  { test: (p) => p.startsWith('/company/drive/'), label: 'Back to Drives' },
  { test: (p) => p.startsWith('/company/student/'), label: 'Back to Drives' },
  { test: (p) => p.startsWith('/company/projects/top-charts'), label: 'Back to Projects' },
  { test: (p) => p.startsWith('/company/projects'), label: 'Back to Projects' },
  { test: (p) => p.startsWith('/company/offers'), label: 'Back to Offers' },
  { test: (p) => p.startsWith('/company/notifications'), label: 'Back to Notifications' },
  { test: (p) => p.startsWith('/company/events'), label: 'Back to Events' },
  { test: (p) => p.startsWith('/company/contacts'), label: 'Back to Contacts' },
  { test: (p) => p.startsWith('/company/profile'), label: 'Back to Profile' },
];

export function getBackLabelForPath(path) {
  if (!path) return 'Back';
  const pathname = path.split('?')[0];
  const rules = pathname.startsWith('/company/')
    ? COMPANY_PATH_LABEL_RULES
    : PLACEMENT_PATH_LABEL_RULES;
  const rule = rules.find((r) => r.test(pathname) || r.test(path));
  return rule?.label ?? 'Back';
}

export function getStoredPreviousPath() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function shouldExcludeBackTarget(pathname) {
  return isAppDetailPath(pathname);
}

/** Core resolver for dynamic back buttons (placement + company) */
export function resolveAppBack(location, fallbackPath = '/placement/dashboard') {
  const fromState = location.state?.from;
  if (fromState && typeof fromState === 'string') {
    const fromPath = fromState.split('?')[0];
    if (!shouldExcludeBackTarget(fromPath)) {
      return {
        path: fromState,
        label: location.state?.fromLabel || getBackLabelForPath(fromState),
      };
    }
  }

  const stored = getStoredPreviousPath();
  if (stored) {
    const storedPath = stored.split('?')[0];
    if (!shouldExcludeBackTarget(storedPath)) {
      return { path: stored, label: getBackLabelForPath(stored) };
    }
  }

  return { path: fallbackPath, label: getBackLabelForPath(fallbackPath) };
}

export function resolveAdminStudentBack(location, fallbackPath = '/placement/students') {
  return resolveAppBack(location, fallbackPath);
}

export function resolveGalleryProjectBack(location, fallbackPath = '/placement/gallery/showcase') {
  return resolveAppBack(location, fallbackPath);
}

/** Navigation state when opening a detail page from a list */
export function buildPlacementNavState(location) {
  const from = `${location.pathname}${location.search}`;
  return {
    from,
    fromLabel: getBackLabelForPath(from),
  };
}
