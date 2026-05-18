import React from 'react';
import { useParams, Outlet, Navigate } from 'react-router-dom';
import { ProfileViewProvider } from '../context/ProfileViewContext';
import { StudentProfileLayout } from '../components/student/StudentProfileLayout';

/**
 * Wraps admin view of a student profile: provides ProfileViewContext (viewUsn = params.usn, read-only)
 * and StudentProfileLayout with basePath so sidebar links go to /placement/students/:usn/personal etc.
 */
export default function AdminStudentProfileWrapper() {
  const { usn } = useParams();
  if (!usn) return <Navigate to="/placement/students" replace />;
  const basePath = `/placement/students/${encodeURIComponent(usn)}`;
  return (
    <ProfileViewProvider adminViewUsn={decodeURIComponent(usn)}>
      <StudentProfileLayout basePath={basePath} isAdminView>
        <Outlet />
      </StudentProfileLayout>
    </ProfileViewProvider>
  );
}
