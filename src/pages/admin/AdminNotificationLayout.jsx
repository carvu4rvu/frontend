import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import './AdminNotificationPortal.css';

export default function AdminNotificationLayout() {
  return (
    <AdminLayout fullWidth>
      <div className="notification-portal notification-portal--no-sidebar">
        <div className="notification-portal__main">
          <Outlet />
        </div>
      </div>
    </AdminLayout>
  );
}
