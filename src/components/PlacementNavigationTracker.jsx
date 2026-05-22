import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getStudentProfileBasePath,
  isAdminStudentProfilePath,
  isAppDetailPath,
} from '../utils/placementNavigationHistory';

const STORAGE_KEY = 'placement_previous_path';

/**
 * Remembers the last list/overview route so detail pages can show a dynamic Back button.
 */
export default function PlacementNavigationTracker() {
  const location = useLocation();
  const lastFullPathRef = useRef(null);

  useEffect(() => {
    const full = `${location.pathname}${location.search}`;
    const prev = lastFullPathRef.current;
    const prevPath = prev?.split('?')[0] ?? '';
    const nextPath = location.pathname;

    if (prev && prev !== full) {
      const leavingStudent = isAdminStudentProfilePath(prevPath);
      const enteringStudent = isAdminStudentProfilePath(nextPath);

      if (enteringStudent && !leavingStudent) {
        if (!isAppDetailPath(prevPath)) {
          try {
            sessionStorage.setItem(STORAGE_KEY, prev);
          } catch {
            /* ignore */
          }
        }
      } else if (!enteringStudent && !leavingStudent) {
        if (!isAppDetailPath(prevPath)) {
          try {
            sessionStorage.setItem(STORAGE_KEY, prev);
          } catch {
            /* ignore */
          }
        }
      } else if (leavingStudent && !enteringStudent) {
        if (!isAppDetailPath(prevPath)) {
          try {
            sessionStorage.setItem(STORAGE_KEY, prev);
          } catch {
            /* ignore */
          }
        }
      } else if (leavingStudent && enteringStudent) {
        const prevBase = getStudentProfileBasePath(prevPath);
        const nextBase = getStudentProfileBasePath(nextPath);
        if (prevBase !== nextBase && !isAppDetailPath(prevPath)) {
          try {
            sessionStorage.setItem(STORAGE_KEY, prev);
          } catch {
            /* ignore */
          }
        }
      }
    }

    lastFullPathRef.current = full;
  }, [location.pathname, location.search]);

  return null;
}
