/** Campus events list routes — share /student/placements/events layout */
export const CAMPUS_EVENTS_PATHS = [
  '/student/placements/events',
  '/placement/student-events',
  '/placement/alumni-events',
  '/placement/vc-events',
  '/company/events',
];

export function isCampusEventsPath(pathname) {
  return CAMPUS_EVENTS_PATHS.includes(pathname);
}
