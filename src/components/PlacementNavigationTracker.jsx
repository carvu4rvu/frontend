import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getStudentProfileBasePath,
  isAdminStudentProfilePath,
} from '../utils/placementNavigationHistory';

const STORAGE_KEY = 'placement_previous_path';

/**
 * Remembers the last non–student-profile placement route so admin student profile
 * "Back" can return to gallery, drives, job offers, etc.
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
        try {
          sessionStorage.setItem(STORAGE_KEY, prev);
        } catch {
          /* ignore */
        }
      } else if (!enteringStudent && !leavingStudent) {
        try {
          sessionStorage.setItem(STORAGE_KEY, prev);
        } catch {
          /* ignore */
        }
      } else if (leavingStudent && !enteringStudent) {
        try {
          sessionStorage.setItem(STORAGE_KEY, prev);
        } catch {
          /* ignore */
        }
      }
      // Tabs within same student (personal → projects): keep stored previous unchanged
      else if (leavingStudent && enteringStudent) {
        const prevBase = getStudentProfileBasePath(prevPath);
        const nextBase = getStudentProfileBasePath(nextPath);
        if (prevBase !== nextBase) {
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
