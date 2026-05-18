import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { PlacementService } from '../services/placement.service';
import { StudentProfileService } from '../services/studentProfile.service';

const ProfileViewContext = createContext(null);

/** Map profile section (route segment) → student_edit_control lock field(s). */
export const SECTION_LOCK_MAP = {
  personal: ['is_basic_info_locked'],
  contact: ['is_contacts_locked'],
  family: ['is_parent_details_locked'],
  'parent_details': ['is_parent_details_locked'],
  education: ['is_education_history_locked', 'is_education_gaps_locked'],
  academics: ['is_course_academics_locked'],
  academic_performance: ['is_course_academics_locked'],
  projects: ['is_projects_locked'],
  internships: ['is_internships_locked'],
  trainings: ['is_trainings_locked'],
  certifications: ['is_certifications_locked'],
  publications: ['is_publications_locked'],
  'extra-curricular': ['is_extra_curricular_locked'],
  extra_curricular: ['is_extra_curricular_locked'],
  other: ['is_other_experiences_locked'],
  other_experiences: ['is_other_experiences_locked'],
  career: ['is_profile_details_locked'],
  career_overview: ['is_profile_details_locked'],
  resume: ['is_profile_details_locked'],
  'summer-immersion': ['is_internships_locked'],
  summer_immersion: ['is_internships_locked'],
  'summer-internship': ['is_internships_locked'],
  summer_internship: ['is_internships_locked'],
};

/**
 * Returns whether the given section is locked according to editControl.
 * @param {Object} editControl - from student_edit_control (lock flags)
 * @param {string} sectionKey - e.g. 'personal', 'contact', 'academics'
 */
export function isSectionLocked(editControl, sectionKey) {
  if (!editControl || !sectionKey) return false;
  const fields = SECTION_LOCK_MAP[sectionKey];
  if (!fields || !fields.length) return false;
  return fields.some((f) => editControl[f] === true);
}

/**
 * Provider for "profile view" mode: either the logged-in student (editable per lock)
 * or admin viewing a student by USN (admin has full edit access on all sections).
 * Supplies viewUsn, isReadOnly, isAdminView, editControl.
 */
export function ProfileViewProvider({ children, adminViewUsn = null }) {
  const { user } = useAuth();
  const paramsUsn = useParams().usn;
  const isAdminView = adminViewUsn != null || (paramsUsn && user?.role && ['admin', 'vc'].includes(user.role));

  const viewUsn = useMemo(() => {
    if (isAdminView && (adminViewUsn || paramsUsn)) return (adminViewUsn || paramsUsn || '').toString().trim().toUpperCase();
    return (user?.usn || '').toString().trim().toUpperCase();
  }, [isAdminView, adminViewUsn, paramsUsn, user?.usn]);

  // Admin viewing a student gets edit access on all pages; student view is read-only only when section is locked
  const readOnly = false;

  const [editControl, setEditControl] = useState(null);
  const [editControlLoading, setEditControlLoading] = useState(false);

  const fetchEditControl = useCallback(async () => {
    if (!viewUsn) return;
    setEditControlLoading(true);
    try {
      if (isAdminView) {
        const data = await PlacementService.getStudentEditControl(viewUsn);
        setEditControl(data || null);
      } else {
        const data = await StudentProfileService.getEditControl();
        setEditControl(data || null);
      }
    } catch (e) {
      console.error('[ProfileViewContext] fetchEditControl', e);
      setEditControl(null);
    } finally {
      setEditControlLoading(false);
    }
  }, [viewUsn, isAdminView]);

  useEffect(() => {
    fetchEditControl();
  }, [fetchEditControl]);

  const value = useMemo(
    () => ({
      viewUsn,
      isReadOnly: readOnly,
      isAdminView: !!isAdminView,
      editControl,
      editControlLoading,
      refetchEditControl: fetchEditControl,
      isSectionLocked: (sectionKey) => isSectionLocked(editControl, sectionKey),
    }),
    [viewUsn, readOnly, isAdminView, editControl, editControlLoading, fetchEditControl]
  );

  return <ProfileViewContext.Provider value={value}>{children}</ProfileViewContext.Provider>;
}

export function useProfileView() {
  const ctx = useContext(ProfileViewContext);
  return ctx;
}
