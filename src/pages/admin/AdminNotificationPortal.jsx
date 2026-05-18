import React, { useState, useEffect, useCallback } from 'react';
import { FiCheck } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import { NotificationService } from '../../services/notification.service';
import './AdminNotificationPortal.css';

const limit = 20;

function AdminNotificationPortal() {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await NotificationService.list({
        notification_type: 'CUSTOM',
        page,
        limit,
      });
      setNotifications(data.notifications || []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      console.error('Load history:', e);
      setNotifications([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <AdminLayout fullWidth>
      <div className="notification-portal notification-portal--no-sidebar">
        <div className="notification-portal__main">
          <div className="notification-portal__view active view-history">
            <div className="notification-portal__history-inner">
              <header className="notification-portal__history-header">
                <div>
                  <h1 className="notification-portal__history-title">Notification History</h1>
                  <p className="notification-portal__history-subtitle">View and track all previously broadcasted messages.</p>
                </div>
              </header>
              <div className="notification-portal__history-table-wrap">
                {historyLoading ? (
                  <div className="notification-portal__loading">Loading...</div>
                ) : (
                  <table className="notification-portal__history-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Subject</th>
                        <th>Target Audience</th>
                        <th>Type</th>
                        <th>Reach</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="notification-portal__empty">
                            No notifications yet.
                          </td>
                        </tr>
                      ) : (
                        notifications.map((n) => (
                          <tr key={n.id}>
                            <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {n.created_at
                                ? new Date(n.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                                : '—'}
                            </td>
                            <td className="cell-title">{n.title}</td>
                            <td>{n.target_type || '—'} {n.target_role ? `(${n.target_role})` : ''}</td>
                            <td>
                              <span
                                className={`notification-portal__history-badge ${
                                  (n.notification_type || '').toLowerCase() === 'urgent'
                                    ? 'urgent'
                                    : (n.notification_type || '').toLowerCase() === 'placement'
                                      ? 'placement'
                                      : 'default'
                                }`}
                              >
                                {n.notification_type || 'CUSTOM'}
                              </span>
                            </td>
                            <td>{(n.recipient_count ?? 0).toLocaleString()}</td>
                            <td>
                              <span className="notification-portal__history-status">
                                <FiCheck size={12} /> DELIVERED
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              {totalPages > 1 && (
                <div className="notification-portal__actions" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="notification-portal__btn notification-portal__btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '0.875rem' }}>Page {page} of {totalPages}</span>
                  <button
                    type="button"
                    className="notification-portal__btn notification-portal__btn-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminNotificationPortal;
