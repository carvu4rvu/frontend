import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCheck, FiBell, FiX, FiSearch, FiTrash2 } from 'react-icons/fi';
import { NotificationService } from '../../services/notification.service';
import { PlacementService } from '../../services/placement.service';
import './AdminNotificationPortal.css';

const formatRecipientId = (o) => (o.entity_id != null ? String(o.entity_id) : o.usn || (o.id != null ? String(o.id) : ''));
const formatRecipientName = (o) => o.full_name || o.company_name || o.name || o.email || o.label || '';
const formatRecipientLine = (o) => {
  const id = formatRecipientId(o);
  const name = formatRecipientName(o);
  return name ? `${id} - ${name}` : id;
};

const limit = 20;

const NOTIFICATION_TYPES = [
  {
    value: 'CUSTOM',
    label: 'General',
    headerBg: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
    buttonBg: '#475569',
    buttonHoverBg: '#334155',
  },
  {
    value: 'PLACEMENT',
    label: 'Placement',
    headerBg: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    buttonBg: '#1d4ed8',
    buttonHoverBg: '#1e40af',
  },
  {
    value: 'EVENT',
    label: 'Event',
    headerBg: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
    buttonBg: '#c2410c',
    buttonHoverBg: '#9a3412',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    headerBg: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
    buttonBg: '#b91c1c',
    buttonHoverBg: '#991b1b',
  },
];

const defaultTypeTheme = NOTIFICATION_TYPES[0];
const getTypeTheme = (type) => NOTIFICATION_TYPES.find((t) => t.value === type) || defaultTypeTheme;

export default function AdminNotificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    notification_type: 'CUSTOM',
    title: '',
    message: '',
    link: '',
  });
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [recipientTab, setRecipientTab] = useState('students');
  const [studentOpts, setStudentOpts] = useState([]);
  const [alumniOpts, setAlumniOpts] = useState([]);
  const [companyOpts, setCompanyOpts] = useState([]);
  const [roleOpts, setRoleOpts] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [alumniSearch, setAlumniSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [studentSchoolId, setStudentSchoolId] = useState('');
  const [studentProgramId, setStudentProgramId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectedRecipientDetails, setSelectedRecipientDetails] = useState([]);
  const [selectedRoleNames, setSelectedRoleNames] = useState(new Set());
  const [roleUserIdsByRole, setRoleUserIdsByRole] = useState({});
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [universalSearch, setUniversalSearch] = useState('');
  const [universalResults, setUniversalResults] = useState([]);
  const [loadingUniversal, setLoadingUniversal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = { page, limit };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (categoryFilter && categoryFilter !== 'all') params.notification_type = categoryFilter;
      const data = await NotificationService.list(params);
      setNotifications(data.notifications || []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      console.error('Load history:', e);
      setNotifications([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [page, limit, searchQuery, categoryFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const state = location.state;
    if (state?.fromEvent && state?.event && typeof state.event === 'object') {
      const { title = '', message = '', link = '' } = state.event;
      setEditId(null);
      setAddOpen(true);
      setStep(1);
      setForm({
        notification_type: 'EVENT',
        title: String(title),
        message: String(message),
        link: String(link || ''),
      });
      setSelectedUserIds(new Set());
      setSelectedRecipientDetails([]);
      setSelectedRoleNames(new Set());
      setRoleUserIdsByRole({});
      setUniversalSearch('');
      setUniversalResults([]);
      setSendError(null);
      PlacementService.getSchools().then((s) => setSchools(s || []));
      PlacementService.getPrograms().then((p) => setPrograms(p || []));
      NotificationService.getRoles().then((r) => setRoleOpts(r.roles || []));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const openAddModal = useCallback(() => {
    setEditId(null);
    setAddOpen(true);
    setStep(1);
    setForm({
      notification_type: 'CUSTOM',
      title: '',
      message: '',
      link: '',
    });
    setSelectedUserIds(new Set());
    setSelectedRecipientDetails([]);
    setSelectedRoleNames(new Set());
    setRoleUserIdsByRole({});
    setStudentOpts([]);
    setAlumniOpts([]);
    setCompanyOpts([]);
    setRoleOpts([]);
    setUniversalSearch('');
    setUniversalResults([]);
    setSendError(null);
    PlacementService.getSchools().then((s) => setSchools(s || []));
    PlacementService.getPrograms().then((p) => setPrograms(p || []));
    NotificationService.getRoles().then((r) => setRoleOpts(r.roles || []));
  }, []);

  const closeAddModal = useCallback(() => {
    setAddOpen(false);
    setEditId(null);
  }, []);

  const handleDelete = useCallback(async (n) => {
    if (!window.confirm(`Delete "${n.title || 'this notification'}"? This cannot be undone.`)) return;
    setDeletingId(n.id);
    try {
      await NotificationService.delete(n.id);
      loadHistory();
    } catch (e) {
      console.error('Delete notification:', e);
      window.alert(e.message || 'Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  }, [loadHistory]);

  const openEditModal = useCallback((n) => {
    setEditId(n.id);
    setAddOpen(true);
    setStep(1);
    setForm({
      notification_type: n.notification_type || 'CUSTOM',
      title: n.title || '',
      message: n.message || '',
      link: n.link || '',
    });
    setSelectedUserIds(new Set());
    setSelectedRecipientDetails([]);
    setSelectedRoleNames(new Set());
    setRoleUserIdsByRole({});
    setSendError(null);
    PlacementService.getSchools().then((s) => setSchools(s || []));
    PlacementService.getPrograms().then((p) => setPrograms(p || []));
    NotificationService.getRoles().then((r) => setRoleOpts(r.roles || []));
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!form.title?.trim() || !form.message?.trim()) return;
    setSavingDraft(true);
    setSendError(null);
    try {
      await NotificationService.create({
        title: form.title.trim(),
        message: form.message.trim(),
        notification_type: form.notification_type,
        link: form.link?.trim() || null,
      });
      closeAddModal();
      loadHistory();
    } catch (e) {
      setSendError(e.message || 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  }, [form, closeAddModal, loadHistory]);

  const fetchStudentOpts = useCallback(async () => {
    setLoadingOpts(true);
    try {
      const data = await NotificationService.getRecipientOptions({
        type: 'students',
        search: studentSearch || undefined,
        school_id: studentSchoolId ? parseInt(studentSchoolId, 10) : undefined,
        program_id: studentProgramId ? parseInt(studentProgramId, 10) : undefined,
        limit: 300,
      });
      setStudentOpts(data.options || []);
    } catch (_e) {
      setStudentOpts([]);
    } finally {
      setLoadingOpts(false);
    }
  }, [studentSearch, studentSchoolId, studentProgramId]);

  const fetchAlumniOpts = useCallback(async () => {
    setLoadingOpts(true);
    try {
      const data = await NotificationService.getRecipientOptions({
        type: 'alumni',
        search: alumniSearch || undefined,
        limit: 300,
      });
      setAlumniOpts(data.options || []);
    } catch (_e) {
      setAlumniOpts([]);
    } finally {
      setLoadingOpts(false);
    }
  }, [alumniSearch]);

  const fetchCompanyOpts = useCallback(async () => {
    setLoadingOpts(true);
    try {
      const data = await NotificationService.getRecipientOptions({
        type: 'companies',
        search: companySearch || undefined,
        limit: 300,
      });
      setCompanyOpts(data.options || []);
    } catch (_e) {
      setCompanyOpts([]);
    } finally {
      setLoadingOpts(false);
    }
  }, [companySearch]);

  const programsForSchool = useMemo(
    () => (studentSchoolId ? (programs || []).filter((p) => String(p.school_id) === String(studentSchoolId)) : programs || []),
    [programs, studentSchoolId]
  );

  useEffect(() => {
    if (!addOpen) return;
    if (recipientTab === 'students') fetchStudentOpts();
    else if (recipientTab === 'alumni') fetchAlumniOpts();
    else if (recipientTab === 'companies') fetchCompanyOpts();
  }, [addOpen, recipientTab, fetchStudentOpts, fetchAlumniOpts, fetchCompanyOpts]);

  const toggleUserId = useCallback((id, option) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedRecipientDetails((d) => d.filter((x) => x.kind !== 'user' || x.id !== id));
        return next;
      }
      next.add(id);
      if (option) {
        setSelectedRecipientDetails((d) => {
          if (d.some((x) => x.kind === 'user' && x.id === id)) return d;
          return [
            ...d,
            {
              kind: 'user',
              id,
              label: option.label,
              type: option.type || 'user',
              entity_id: option.entity_id,
              name: option.full_name || option.company_name || option.email,
            },
          ];
        });
      }
      return next;
    });
  }, []);

  const removeRecipient = useCallback((item) => {
    if (item.kind === 'role') {
      setSelectedRoleNames((prev) => {
        const next = new Set(prev);
        next.delete(item.roleName);
        return next;
      });
      setRoleUserIdsByRole((prev) => {
        const u = { ...prev };
        delete u[item.roleName];
        return u;
      });
      setSelectedRecipientDetails((d) => d.filter((x) => !(x.kind === 'role' && x.roleName === item.roleName)));
    } else {
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      setSelectedRecipientDetails((d) => d.filter((x) => x.kind !== 'user' || x.id !== item.id));
    }
  }, []);

  const toggleRole = useCallback(async (roleName) => {
    const nextRoles = new Set(selectedRoleNames);
    if (nextRoles.has(roleName)) {
      nextRoles.delete(roleName);
      setRoleUserIdsByRole((prev) => {
        const u = { ...prev };
        delete u[roleName];
        return u;
      });
      setSelectedRecipientDetails((d) => d.filter((x) => !(x.kind === 'role' && x.roleName === roleName)));
    } else {
      nextRoles.add(roleName);
      try {
        const data = await NotificationService.getRecipientOptions({
          type: 'role_users',
          role: roleName,
          limit: 500,
        });
        const ids = (data.options || []).map((o) => o.id);
        setRoleUserIdsByRole((prev) => ({ ...prev, [roleName]: ids }));
        setSelectedRecipientDetails((d) => [...d, { kind: 'role', roleName, count: ids.length }]);
      } catch (_e) {
        nextRoles.delete(roleName);
      }
    }
    setSelectedRoleNames(nextRoles);
  }, [selectedRoleNames]);

  const fetchUniversal = useCallback(async () => {
    const q = (universalSearch || '').trim();
    if (!q) {
      setUniversalResults([]);
      return;
    }
    setLoadingUniversal(true);
    try {
      const [students, alumni, companies] = await Promise.all([
        NotificationService.getRecipientOptions({ type: 'students', search: q, limit: 100 }),
        NotificationService.getRecipientOptions({ type: 'alumni', search: q, limit: 100 }),
        NotificationService.getRecipientOptions({ type: 'companies', search: q, limit: 100 }),
      ]);
      const combined = [
        ...(students.options || []).map((o) => ({ ...o, type: 'student' })),
        ...(alumni.options || []).map((o) => ({ ...o, type: 'alumni' })),
        ...(companies.options || []).map((o) => ({ ...o, type: 'company' })),
      ];
      setUniversalResults(combined);
    } catch (_e) {
      setUniversalResults([]);
    } finally {
      setLoadingUniversal(false);
    }
  }, [universalSearch]);

  const selectAllInList = useCallback((opts) => {
    const toAdd = (opts || []).filter((o) => o.id != null && o.id !== '' && !selectedUserIds.has(o.id));
    const uniqueById = [...new Map(toAdd.map((o) => [o.id, o])).values()];
    if (uniqueById.length === 0) return;
    setSelectedUserIds((prev) => new Set([...prev, ...uniqueById.map((o) => o.id)]));
    setSelectedRecipientDetails((prev) => {
      const existingIds = new Set(prev.filter((x) => x.kind === 'user').map((x) => x.id));
      const newEntries = uniqueById
        .filter((o) => !existingIds.has(o.id))
        .map((o) => ({
          kind: 'user',
          id: o.id,
          label: o.label,
          type: o.type || 'user',
          entity_id: o.entity_id,
          name: o.full_name || o.company_name || o.email,
        }));
      return newEntries.length ? [...prev, ...newEntries] : prev;
    });
  }, [selectedUserIds]);

  const deselectAllInList = useCallback((opts) => {
    const idsToRemove = new Set((opts || []).filter((o) => o.id != null && o.id !== '').map((o) => o.id));
    if (idsToRemove.size === 0) return;
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      idsToRemove.forEach((id) => next.delete(id));
      return next;
    });
    setSelectedRecipientDetails((prev) => prev.filter((x) => x.kind !== 'user' || !idsToRemove.has(x.id)));
  }, []);

  const selectAllRoles = useCallback(async () => {
    const names = (roleOpts || []).map((r) => r.name);
    if (names.length === 0) return;
    try {
      const results = await Promise.all(
        names.map((name) => NotificationService.getRecipientOptions({ type: 'role_users', role: name, limit: 500 }))
      );
      const byRole = {};
      names.forEach((name, i) => {
        byRole[name] = (results[i].options || []).map((o) => o.id);
      });
      setRoleUserIdsByRole(byRole);
      setSelectedRoleNames(new Set(names));
      setSelectedRecipientDetails((prev) => [
        ...prev.filter((x) => x.kind !== 'role'),
        ...names.map((name) => ({ kind: 'role', roleName: name, count: byRole[name].length })),
      ]);
    } catch (_e) {}
  }, [roleOpts]);

  const deselectAllRoles = useCallback(() => {
    setSelectedRoleNames(new Set());
    setRoleUserIdsByRole({});
    setSelectedRecipientDetails((prev) => prev.filter((x) => x.kind !== 'role'));
  }, []);

  const allRecipientIds = useCallback(() => {
    const ids = new Set(selectedUserIds);
    Object.values(roleUserIdsByRole).flat().forEach((id) => ids.add(id));
    return Array.from(ids);
  }, [selectedUserIds, roleUserIdsByRole]);

  const canGoToPreview = form.title.trim() && form.message.trim();
  const recipientCount = allRecipientIds().length;

  const recipientCountByRole = useMemo(() => {
    const byRole = {};
    for (const item of selectedRecipientDetails) {
      if (item.kind === 'role') {
        const name = item.roleName || 'Role';
        byRole[name] = (byRole[name] || 0) + (item.count || 0);
      } else if (item.kind === 'user' && item.type) {
        const label = item.type === 'student' ? 'Students' : item.type === 'alumni' ? 'Alumni' : item.type === 'company' ? 'Companies' : item.type;
        byRole[label] = (byRole[label] || 0) + 1;
      }
    }
    return byRole;
  }, [selectedRecipientDetails]);

  const handleSend = useCallback(async () => {
    if (recipientCount === 0) return;
    setSending(true);
    setSendError(null);
    try {
      const userIds = allRecipientIds();
      let notifId;
      if (editId) {
        await NotificationService.update(editId, {
          title: form.title.trim(),
          message: form.message.trim(),
          notification_type: form.notification_type,
          link: form.link?.trim() || null,
        });
        notifId = editId;
      } else {
        const created = await NotificationService.create({
          title: form.title.trim(),
          message: form.message.trim(),
          notification_type: form.notification_type,
          link: form.link?.trim() || null,
        });
        notifId = created.id;
      }
      await NotificationService.send(notifId, {
        target_type: 'CUSTOM',
        user_ids: userIds,
      });
      closeAddModal();
      loadHistory();
    } catch (e) {
      setSendError(e.message || 'Failed to create or send notification');
    } finally {
      setSending(false);
    }
  }, [form, recipientCount, editId, allRecipientIds, closeAddModal, loadHistory]);

  const typeTheme = getTypeTheme(form.notification_type);

  return (
    <div className="notification-portal__view active view-history">
      <div className="notification-portal__history-inner">
        <header className="notification-portal__history-header">
          <div>
            <h1 className="notification-portal__history-title">Notification History</h1>
            <p className="notification-portal__history-subtitle">View and track all previously broadcasted messages.</p>
          </div>
          <button
            type="button"
            className="notification-portal__btn notification-portal__btn-add"
            onClick={openAddModal}
            aria-label="Add notification"
          >
            <FiBell size={18} aria-hidden />
            <span>Add</span>
          </button>
        </header>
        <div className="notification-portal__toolbar">
          <div className="notification-portal__search-wrap">
            <FiSearch className="notification-portal__search-icon" aria-hidden />
            <input
              type="text"
              className="notification-portal__search-input"
              placeholder="Search title, message, or type…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              aria-label="Search notifications"
            />
          </div>
          <select
            className="notification-portal__filter-select"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="notification-portal__history-table-wrap">
          {historyLoading ? (
            <div className="notification-portal__loading">Loading...</div>
          ) : (
            <table className="notification-portal__history-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Type</th>
                  <th>Reach</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="notification-portal__empty">
                      No notifications yet.
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => {
                    const isDraft = (n.recipient_count ?? 0) === 0;
                    return (
                      <tr key={n.id}>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {n.created_at
                            ? new Date(n.created_at).toLocaleString(undefined, {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="cell-title">{n.title}</td>
                        <td className="cell-message" title={n.message || ''}>
                          {n.message || '—'}
                        </td>
                        <td>
                          <span
                            className={`notification-portal__history-badge ${
                              (n.notification_type || '').toLowerCase() === 'urgent'
                                ? 'urgent'
                                : (n.notification_type || '').toLowerCase() === 'placement'
                                  ? 'placement'
                                  : (n.notification_type || '').toLowerCase() === 'event'
                                    ? 'event'
                                    : 'default'
                            }`}
                          >
                            {n.notification_type || 'CUSTOM'}
                          </span>
                        </td>
                        <td>{(n.recipient_count ?? 0).toLocaleString()}</td>
                        <td>
                          <span className={`notification-portal__history-status ${isDraft ? 'draft' : ''}`}>
                            {isDraft ? 'Draft' : <><FiCheck size={12} /> DELIVERED</>}
                          </span>
                        </td>
                        <td>
                          <div className="notification-portal__history-actions">
                            <button type="button" className="notification-portal__link-btn" onClick={() => openEditModal(n)}>Edit</button>
                            <button
                              type="button"
                              className="notification-portal__history-action-icon"
                              onClick={() => handleDelete(n)}
                              disabled={deletingId === n.id}
                              aria-label="Delete notification"
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
            <span style={{ alignSelf: 'center', fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
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

      {addOpen && (
        <div className="notification-portal__add-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-notification-title">
          <div className="notification-portal__add-modal" data-type={form.notification_type}>
            <header className="notification-portal__add-modal-header" style={{ background: typeTheme.headerBg }}>
              <h2 id="add-notification-title">
                {editId ? 'Edit Notification' : 'Add Notification'}
              </h2>
              <button type="button" className="notification-portal__add-modal-close" onClick={closeAddModal} aria-label="Close">
                <FiX size={20} />
              </button>
            </header>
            <div className="notification-portal__add-modal-body">
              {step === 1 && (
                <section className="notification-portal__add-section">
                  <h3>Details</h3>
                  <div className="notification-portal__add-field">
                    <label htmlFor="add-notif-type">Type</label>
                    <select
                      id="add-notif-type"
                      value={form.notification_type}
                      onChange={(e) => setForm((f) => ({ ...f, notification_type: e.target.value }))}
                    >
                      {NOTIFICATION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="notification-portal__add-field">
                    <label htmlFor="add-notif-title">Title</label>
                    <input
                      id="add-notif-title"
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Notification title"
                    />
                  </div>
                  <div className="notification-portal__add-field">
                    <label htmlFor="add-notif-message">Message</label>
                    <textarea
                      id="add-notif-message"
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="Message content"
                      rows={4}
                    />
                  </div>
                  <div className="notification-portal__add-field">
                    <label htmlFor="add-notif-link">Link (optional)</label>
                    <input
                      id="add-notif-link"
                      type="text"
                      value={form.link}
                      onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                      placeholder="Paste full URL — used exactly as entered, opens in new tab"
                    />
                  </div>
                  {sendError && <p className="notification-portal__add-error">{sendError}</p>}
                  <div className="notification-portal__add-actions">
                    <button type="button" className="notification-portal__btn notification-portal__btn-secondary" onClick={closeAddModal}>
                      Cancel
                    </button>
                    {!editId && (
                      <button
                        type="button"
                        className="notification-portal__btn notification-portal__btn-secondary"
                        disabled={!canGoToPreview || savingDraft}
                        onClick={handleSaveDraft}
                      >
                        {savingDraft ? 'Saving…' : 'Save as draft'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="notification-portal__btn notification-portal__btn-primary"
                      disabled={!form.title?.trim() || !form.message?.trim()}
                      onClick={() => setStep(2)}
                    >
                      Next: Recipients
                    </button>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="notification-portal__add-section">
                  <h3>Recipients</h3>
                  <div className="notification-portal__universal-search">
                    <div className="notification-portal__universal-search-bar">
                      <FiSearch className="notification-portal__universal-search-icon" aria-hidden />
                      <input
                        type="text"
                        placeholder="Search across students, alumni, companies…"
                        value={universalSearch}
                        onChange={(e) => setUniversalSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUniversal()}
                      />
                      <button type="button" className="notification-portal__btn notification-portal__btn-secondary" onClick={fetchUniversal} disabled={loadingUniversal}>
                        {loadingUniversal ? 'Searching…' : 'Search'}
                      </button>
                    </div>
                    {universalResults.length > 0 && (
                      <div className="notification-portal__universal-results">
                        <div className="notification-portal__list-actions">
                          <span className="notification-portal__universal-results-label">Results</span>
                          <div className="notification-portal__select-all-wrap">
                            <button type="button" className="notification-portal__link-btn" onClick={() => selectAllInList(universalResults)}>Select all</button>
                            <span className="notification-portal__list-actions-sep">·</span>
                            <button type="button" className="notification-portal__link-btn" onClick={() => deselectAllInList(universalResults)}>Deselect all</button>
                          </div>
                        </div>
                        <div className="notification-portal__add-list notification-portal__add-list--universal">
                          {universalResults.map((o) => (
                            <label key={`${o.type}-${o.id}`} className="notification-portal__add-check">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.has(o.id)}
                                onChange={() => toggleUserId(o.id, o)}
                              />
                              <span className="notification-portal__option-id">{formatRecipientLine(o)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="notification-portal__add-tabs">
                    {['students', 'alumni', 'companies', 'roles'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        className={`notification-portal__add-tab ${recipientTab === tab ? 'active' : ''}`}
                        onClick={() => setRecipientTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                  {recipientTab === 'students' && (
                    <div className="notification-portal__add-recipients">
                      <div className="notification-portal__add-filters">
                        <input
                          type="text"
                          placeholder="Search by name, USN, email"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && fetchStudentOpts()}
                        />
                        <select
                          value={studentSchoolId}
                          onChange={(e) => {
                            setStudentSchoolId(e.target.value);
                            setStudentProgramId('');
                          }}
                        >
                          <option value="">All schools</option>
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <select
                          value={studentProgramId}
                          onChange={(e) => setStudentProgramId(e.target.value)}
                          disabled={!!studentSchoolId && programsForSchool.length === 0}
                        >
                          <option value="">All programs</option>
                          {programsForSchool.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <button type="button" className="notification-portal__btn notification-portal__btn-secondary" onClick={fetchStudentOpts}>
                          Apply
                        </button>
                      </div>
                      <div className="notification-portal__list-actions">
                        <button type="button" className="notification-portal__link-btn" onClick={() => selectAllInList(studentOpts)}>Select all</button>
                        <span className="notification-portal__list-actions-sep">·</span>
                        <button type="button" className="notification-portal__link-btn" onClick={() => deselectAllInList(studentOpts)}>Deselect all</button>
                      </div>
                      <div className="notification-portal__add-list">
                        {loadingOpts ? (
                          <div className="notification-portal__loading">Loading...</div>
                        ) : (
                          studentOpts.map((o) => (
                            <label key={o.id} className="notification-portal__add-check">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.has(o.id)}
                                onChange={() => toggleUserId(o.id, o)}
                              />
                              <span className="notification-portal__option-id">{formatRecipientLine(o)}</span>
                            </label>
                          ))
                        )}
                        {!loadingOpts && studentOpts.length === 0 && (
                          <p className="notification-portal__add-empty">No students found. Select school (program filters by school) and click Apply.</p>
                        )}
                      </div>
                    </div>
                  )}
                  {recipientTab === 'alumni' && (
                    <div className="notification-portal__add-recipients">
                      <div className="notification-portal__add-filters">
                        <input
                          type="text"
                          placeholder="Search by name or email"
                          value={alumniSearch}
                          onChange={(e) => setAlumniSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && fetchAlumniOpts()}
                        />
                        <button type="button" className="notification-portal__btn notification-portal__btn-secondary" onClick={fetchAlumniOpts}>
                          Apply
                        </button>
                      </div>
                      <div className="notification-portal__list-actions">
                        <button type="button" className="notification-portal__link-btn" onClick={() => selectAllInList(alumniOpts)}>Select all</button>
                        <span className="notification-portal__list-actions-sep">·</span>
                        <button type="button" className="notification-portal__link-btn" onClick={() => deselectAllInList(alumniOpts)}>Deselect all</button>
                      </div>
                      <div className="notification-portal__add-list">
                        {loadingOpts ? (
                          <div className="notification-portal__loading">Loading...</div>
                        ) : (
                          alumniOpts.map((o) => (
                            <label key={o.id} className="notification-portal__add-check">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.has(o.id)}
                                onChange={() => toggleUserId(o.id, o)}
                              />
                              <span className="notification-portal__option-id">{formatRecipientLine(o)}</span>
                            </label>
                          ))
                        )}
                        {!loadingOpts && alumniOpts.length === 0 && (
                          <p className="notification-portal__add-empty">No alumni found.</p>
                        )}
                      </div>
                    </div>
                  )}
                  {recipientTab === 'companies' && (
                    <div className="notification-portal__add-recipients">
                      <div className="notification-portal__add-filters">
                        <input
                          type="text"
                          placeholder="Search company or email"
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && fetchCompanyOpts()}
                        />
                        <button type="button" className="notification-portal__btn notification-portal__btn-secondary" onClick={fetchCompanyOpts}>
                          Apply
                        </button>
                      </div>
                      <div className="notification-portal__list-actions">
                        <button type="button" className="notification-portal__link-btn" onClick={() => selectAllInList(companyOpts)}>Select all</button>
                        <span className="notification-portal__list-actions-sep">·</span>
                        <button type="button" className="notification-portal__link-btn" onClick={() => deselectAllInList(companyOpts)}>Deselect all</button>
                      </div>
                      <div className="notification-portal__add-list">
                        {loadingOpts ? (
                          <div className="notification-portal__loading">Loading...</div>
                        ) : (
                          companyOpts.map((o) => (
                            <label key={o.id} className="notification-portal__add-check">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.has(o.id)}
                                onChange={() => toggleUserId(o.id, o)}
                              />
                              <span className="notification-portal__option-id">{formatRecipientLine(o)}</span>
                            </label>
                          ))
                        )}
                        {!loadingOpts && companyOpts.length === 0 && (
                          <p className="notification-portal__add-empty">No company accounts found.</p>
                        )}
                      </div>
                    </div>
                  )}
                  {recipientTab === 'roles' && (
                    <div className="notification-portal__add-recipients">
                      <p className="notification-portal__add-hint">Select roles to include everyone with that role (e.g. Admin, VC).</p>
                      <div className="notification-portal__list-actions">
                        <button type="button" className="notification-portal__link-btn" onClick={selectAllRoles}>Select all roles</button>
                        <span className="notification-portal__list-actions-sep">·</span>
                        <button type="button" className="notification-portal__link-btn" onClick={deselectAllRoles}>Deselect all roles</button>
                      </div>
                      <div className="notification-portal__add-list">
                        {roleOpts.map((r) => (
                          <label key={r.id} className="notification-portal__add-check">
                            <input
                              type="checkbox"
                              checked={selectedRoleNames.has(r.name)}
                              onChange={() => toggleRole(r.name)}
                            />
                            <span>{r.name}</span>
                          </label>
                        ))}
                        {roleOpts.length === 0 && <p className="notification-portal__add-empty">No roles found.</p>}
                      </div>
                    </div>
                  )}
                  <div className="notification-portal__selected-list">
                    <h4 className="notification-portal__selected-list-title">Selected ({selectedRecipientDetails.length})</h4>
                    {selectedRecipientDetails.length === 0 ? (
                      <p className="notification-portal__selected-empty">No recipients selected yet. Use search or tabs above to add.</p>
                    ) : (
                      <ul className="notification-portal__selected-ul">
                        {selectedRecipientDetails
                          .filter((item, idx, arr) => {
                            if (item.kind === 'role') return arr.findIndex((x) => x.kind === 'role' && x.roleName === item.roleName) === idx;
                            return arr.findIndex((x) => x.kind === 'user' && x.id === item.id) === idx;
                          })
                          .map((item) => (
                          <li key={item.kind === 'role' ? `role-${item.roleName}` : `user-${item.id}`} className="notification-portal__selected-li">
                            <span className="notification-portal__selected-id">
                              {item.kind === 'role' ? `Role: ${item.roleName} (${item.count} users)` : formatRecipientLine(item)}
                            </span>
                            <button
                              type="button"
                              className="notification-portal__selected-remove"
                              onClick={() => removeRecipient(item)}
                              aria-label="Remove"
                            >
                              <FiX size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="notification-portal__add-actions">
                    <button
                      type="button"
                      className="notification-portal__btn notification-portal__btn-secondary"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="notification-portal__btn notification-portal__btn-primary"
                      onClick={() => setStep(3)}
                    >
                      Next: Preview &amp; Send
                    </button>
                  </div>
                </section>
              )}

              {step === 3 && (
                <section className="notification-portal__add-section">
                  <h3>Preview &amp; Send</h3>
                  <p className="notification-portal__preview-intro">How it will look to recipients</p>
                  <div className="notification-portal__preview-card" data-type={form.notification_type}>
                    <div className="notification-portal__preview-card-header" style={{ background: typeTheme.headerBg }}>
                      <span className="notification-portal__preview-card-type">{getTypeTheme(form.notification_type).label}</span>
                    </div>
                    <div className="notification-portal__preview-card-body">
                      <h4 className="notification-portal__preview-card-title">{form.title || 'Notification title'}</h4>
                      <div className="notification-portal__preview-card-message">{form.message || 'Message content.'}</div>
                      {form.link?.trim() && (
                        <a href={form.link.trim()} target="_blank" rel="noopener noreferrer" className="notification-portal__preview-card-link" title={form.link.trim()}>
                          Open link ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="notification-portal__add-preview notification-portal__add-preview--recipients">
                    <p className="notification-portal__recipients-total"><strong>Total recipients:</strong> {recipientCount.toLocaleString()}</p>
                    {Object.keys(recipientCountByRole).length > 0 && (
                      <p className="notification-portal__recipients-by-role">
                        {Object.entries(recipientCountByRole)
                          .filter(([, n]) => n != null && n > 0)
                          .map(([role, n]) => (
                            <span key={role} className="notification-portal__recipients-role-badge">
                              {role}: {n.toLocaleString()}
                            </span>
                          ))}
                      </p>
                    )}
                  </div>
                  {sendError && <p className="notification-portal__add-error">{sendError}</p>}
                  <div className="notification-portal__add-actions">
                    <button type="button" className="notification-portal__btn notification-portal__btn-secondary" onClick={() => setStep(2)}>
                      Back
                    </button>
                    <button
                      type="button"
                      className="notification-portal__btn notification-portal__btn-primary"
                      disabled={sending || recipientCount === 0}
                      onClick={handleSend}
                      style={{ background: typeTheme.buttonBg }}
                    >
                      {sending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
