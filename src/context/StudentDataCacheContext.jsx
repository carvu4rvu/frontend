import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlacementService } from '../services/placement.service';
import { StudentProfileService } from '../services/studentProfile.service';
import { EventsService } from '../services/events.service';
import { NotificationService } from '../services/notification.service';
import { calculateProfileCompletion, getMissingSections } from '../utils/profileHelper';
import { useAuth } from './AuthContext';

const REFRESH_INTERVAL_MS = 60 * 1000;      // Dashboard, Placement, Events, JobOffers
const NOTIFICATIONS_INTERVAL_MS = 15 * 1000; // Notifications - faster for updates

const StudentDataCacheContext = createContext(null);

export function StudentDataCacheProvider({ children }) {
  const { user } = useAuth();
  const studentUSN = user?.usn;
  const [cache, setCache] = useState({
    dashboard: {
      applications: [],
      completionPercentage: 0,
      missingSections: [],
      resumeUploaded: false,
      optIn: false,
      placementPolicyAgreed: false,
      academicSnapshot: null,
      portfolioCounts: null,
      loaded: false,
    },
    placementFeed: { drives: [], processRecords: [], loaded: false },
    events: { list: [], loaded: false },
    notifications: { list: [], unreadCount: 0, loaded: false },
    jobOffers: { list: [], loaded: false },
    profile: { sections: {}, dropdowns: null, loaded: false },
  });
  const [loading, setLoading] = useState({
    dashboard: false,
    placementFeed: false,
    events: false,
    notifications: false,
    jobOffers: false,
    profile: false,
  });
  const studentUSNRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const updateCache = useCallback((key, data) => {
    if (!isMountedRef.current) return;
    setCache((prev) => ({ ...prev, [key]: { ...prev[key], ...data, loaded: true } }));
  }, []);

  const setLoadingForKey = useCallback((key, value) => {
    if (!isMountedRef.current) return;
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  const fetchDashboard = useCallback(async (usn, silent = false) => {
    if (!usn) return;
    if (!silent) setLoadingForKey('dashboard', true);
    try {
      const [processData, profileData] = await Promise.all([
        PlacementService.getStudentProcess(usn),
        StudentProfileService.getFullProfile(usn),
      ]);
      let completion = 0;
      let missingSections = [];
      let resumeUploaded = false;
      let optIn = false;
      let placementPolicyAgreed = false;
      let academicSnapshot = null;
      let portfolioCounts = null;

      if (profileData) {
        const raw = profileData?.data ?? profileData;
        const formatted = {
          ...raw,
          usn: raw?.usn ?? usn,
          personal: raw?.personal ?? {},
          contact: raw?.contact ?? {},
          communication: raw?.contact ?? raw?.communication ?? {},
        };
        completion = calculateProfileCompletion(formatted);
        completion = Number.isFinite(completion) ? Math.min(100, Math.max(0, Math.round(completion))) : 0;
        missingSections = getMissingSections(formatted) || [];

        const resumeVal = raw?.resume_file ?? raw?.career?.resume_file ?? '';
        resumeUploaded = typeof resumeVal === 'string' && resumeVal.trim().length >= 5 && !/^(n\/a|na|none|pending|tbd|tba|-|\.)$/i.test(resumeVal.trim());

        const personal = raw?.personal ?? {};
        optIn = personal.opt_in === true;
        placementPolicyAgreed = personal.has_agreed_placement_policy === true;

        const academics = Array.isArray(raw?.academics) ? raw.academics : [];
        const sortedAcad = [...academics].sort((a, b) => (parseInt(b?.semester, 10) || 0) - (parseInt(a?.semester, 10) || 0));
        const latest = sortedAcad[0];
        const sgpaValues = academics.map((a) => a?.result_in_sgpa ?? a?.sgpa).filter((v) => v != null && v !== '').map((v) => parseFloat(v));
        const cgpa = sgpaValues.length > 0 ? sgpaValues.reduce((s, v) => s + v, 0) / sgpaValues.length : null;
        academicSnapshot = {
          currentYear: personal?.current_year ?? personal?.currentYear ?? null,
          currentSemester: personal?.current_semester ?? personal?.currentSemester ?? null,
          latestSgpa: latest != null ? (latest.result_in_sgpa ?? latest.sgpa) : null,
          cgpa: cgpa != null && !Number.isNaN(cgpa) ? Math.round(cgpa * 100) / 100 : null,
          liveBacklogs: latest?.live_backlogs ?? latest?.liveBacklogs ?? 0,
          closedBacklogs: latest?.closed_backlogs ?? latest?.closedBacklogs ?? 0,
        };

        portfolioCounts = {
          projects: (raw?.projects || []).length,
          internships: (raw?.internships || []).length,
          trainings: (raw?.trainings || []).length,
          certifications: (raw?.certifications || []).length,
          publications: (raw?.publications || []).length,
          extraCurricular: (raw?.extraCurricular || []).length,
        };
      }

      updateCache('dashboard', {
        applications: processData || [],
        completionPercentage: completion,
        missingSections,
        resumeUploaded,
        optIn,
        placementPolicyAgreed,
        academicSnapshot,
        portfolioCounts,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      if (!silent) setLoadingForKey('dashboard', false);
    }
  }, [updateCache, setLoadingForKey]);

  const fetchPlacementFeed = useCallback(async (usn, silent = false) => {
    if (!usn) return;
    if (!silent) setLoadingForKey('placementFeed', true);
    try {
      const [drivesData, processData] = await Promise.all([
        PlacementService.getAllDrives(),
        PlacementService.getStudentProcess(usn),
      ]);
      updateCache('placementFeed', {
        drives: drivesData || [],
        processRecords: processData || [],
      });
    } catch {
    } finally {
      if (!silent) setLoadingForKey('placementFeed', false);
    }
  }, [updateCache, setLoadingForKey]);

  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoadingForKey('events', true);
    try {
      const data = await EventsService.list();
      updateCache('events', { list: Array.isArray(data) ? data : [] });
    } catch {
      if (!silent) updateCache('events', { list: [] });
    } finally {
      if (!silent) setLoadingForKey('events', false);
    }
  }, [updateCache, setLoadingForKey]);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoadingForKey('notifications', true);
    try {
      const unreadCount = await NotificationService.getUnreadCount();
      updateCache('notifications', { list: [], unreadCount });
    } catch {
      updateCache('notifications', { list: [], unreadCount: 0 });
    } finally {
      if (!silent) setLoadingForKey('notifications', false);
    }
  }, [updateCache, setLoadingForKey]);

  const fetchJobOffers = useCallback(async (usn, silent = false) => {
    if (!usn) return;
    if (!silent) setLoadingForKey('jobOffers', true);
    try {
      const myOffers = await PlacementService.getStudentOffers(usn);
      updateCache('jobOffers', { list: myOffers || [] });
    } catch {
      if (!silent) updateCache('jobOffers', { list: [] });
    } finally {
      if (!silent) setLoadingForKey('jobOffers', false);
    }
  }, [updateCache, setLoadingForKey]);

  const fetchProfileDropdowns = useCallback(async (silent = false) => {
    if (!silent) setLoadingForKey('profile', true);
    try {
      const [maj, min, spec, schools, programs] = await Promise.all([
        StudentProfileService.getMajors().catch(() => []),
        StudentProfileService.getMinors().catch(() => []),
        StudentProfileService.getSpecializations().catch(() => []),
        StudentProfileService.getSchools().catch(() => []),
        StudentProfileService.getPrograms().catch(() => []),
      ]);
      setCache((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          dropdowns: {
            majors: Array.isArray(maj) ? maj : [],
            minors: Array.isArray(min) ? min : [],
            specializations: Array.isArray(spec) ? spec : [],
            schools: Array.isArray(schools) ? schools : [],
            programs: Array.isArray(programs) ? programs : [],
          },
        },
      }));
    } catch {
    } finally {
      if (!silent) setLoadingForKey('profile', false);
    }
  }, [setLoadingForKey]);

  const fetchProfileSection = useCallback(async (usn, section, silent = false) => {
    if (!usn || !section) return null;
    if (!silent) setLoadingForKey('profile', true);
    try {
      if (section === 'academics') {
        const [sectionData, personalData] = await Promise.all([
          StudentProfileService.getSection(usn, section),
          StudentProfileService.getSection(usn, 'personal'),
        ]);
        const result = {
          data: sectionData || [],
          personalMeta: personalData || {},
        };
        setCache((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            sections: {
              ...prev.profile?.sections,
              [section]: result,
              personal: personalData || {},
            },
          },
        }));
        return result;
      }
      const sectionData = await StudentProfileService.getSection(usn, section);
      const data = sectionData || {};
      setCache((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          sections: { ...prev.profile?.sections, [section]: data },
        },
      }));
      return data;
    } catch (err) {
      return null;
    } finally {
      if (!silent) setLoadingForKey('profile', false);
    }
  }, [setLoadingForKey]);

  const refreshMainDataSilent = useCallback(() => {
    if (studentUSN) {
      fetchDashboard(studentUSN, true);
      fetchPlacementFeed(studentUSN, true);
      fetchJobOffers(studentUSN, true);
    }
    fetchEvents(true);
  }, [studentUSN, fetchDashboard, fetchPlacementFeed, fetchEvents, fetchJobOffers]);

  const refreshNotificationsSilent = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  useEffect(() => {
    studentUSNRef.current = studentUSN;
    if (!studentUSN) {
      setCache({
        dashboard: {
          applications: [],
          completionPercentage: 0,
          missingSections: [],
          resumeUploaded: false,
          optIn: false,
          placementPolicyAgreed: false,
          academicSnapshot: null,
          portfolioCounts: null,
          loaded: false,
        },
        placementFeed: { drives: [], processRecords: [], loaded: false },
        events: { list: [], loaded: false },
        notifications: { list: [], unreadCount: 0, loaded: false },
        jobOffers: { list: [], loaded: false },
        profile: { sections: {}, dropdowns: null, loaded: false },
      });
      setLoading({ dashboard: false, placementFeed: false, events: false, notifications: false, jobOffers: false, profile: false });
    }
  }, [studentUSN]);

  // Main data: 1 min background refresh
  useEffect(() => {
    if (!studentUSN) return;
    const id = setInterval(refreshMainDataSilent, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [studentUSN, refreshMainDataSilent]);

  // Notifications: 15 sec for fastest updates
  useEffect(() => {
    if (!studentUSN) return;
    const id = setInterval(refreshNotificationsSilent, NOTIFICATIONS_INTERVAL_MS);
    return () => clearInterval(id);
  }, [studentUSN, refreshNotificationsSilent]);

  const invalidateProfile = useCallback((section) => {
    if (!section) {
      setCache((prev) => ({ ...prev, profile: { sections: {}, dropdowns: prev.profile?.dropdowns, loaded: false } }));
    } else {
      setCache((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          sections: { ...prev.profile?.sections, [section]: undefined },
        },
      }));
    }
  }, []);

  /** Clear a data slice so the page will refetch instead of using cached data. */
  const clearCache = useCallback((key) => {
    if (!isMountedRef.current) return;
    const initial = {
      dashboard: {
        applications: [],
        completionPercentage: 0,
        missingSections: [],
        resumeUploaded: false,
        optIn: false,
        placementPolicyAgreed: false,
        academicSnapshot: null,
        portfolioCounts: null,
        loaded: false,
      },
      placementFeed: { drives: [], processRecords: [], loaded: false },
      events: { list: [], loaded: false },
      notifications: { list: [], unreadCount: 0, loaded: false },
      jobOffers: { list: [], loaded: false },
    };
    if (initial[key] !== undefined) {
      setCache((prev) => ({ ...prev, [key]: initial[key] }));
    }
  }, []);

  const value = useMemo(() => ({
    cache,
    loading,
    updateCache,
    clearCache,
    fetchDashboard,
    fetchPlacementFeed,
    fetchEvents,
    fetchNotifications,
    fetchJobOffers,
    fetchProfileDropdowns,
    fetchProfileSection,
    invalidateProfile,
  }), [cache, loading, updateCache, clearCache, fetchDashboard, fetchPlacementFeed, fetchEvents, fetchNotifications, fetchJobOffers, fetchProfileDropdowns, fetchProfileSection, invalidateProfile]);

  return (
    <StudentDataCacheContext.Provider value={value}>
      {children}
    </StudentDataCacheContext.Provider>
  );
}

export function useStudentDataCache() {
  const ctx = useContext(StudentDataCacheContext);
  if (!ctx) throw new Error('useStudentDataCache must be used within StudentDataCacheProvider');
  return ctx;
}
