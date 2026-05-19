import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  useToast,
  Spinner,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, BellIcon } from '@chakra-ui/icons';
import { FiCalendar, FiFileText, FiImage, FiUploadCloud, FiInfo } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EventsService } from '../services/events.service';
import { NotificationService } from '../services/notification.service';
import { navigateToPlacementNotificationSend } from '../utils/placementNotificationNav';
import { getFileUrl } from '../utils/fileUrl';
import AdminLayout from '../components/AdminLayout';
import './EventsPage.css';

const TABS = [
  { id: 'scheduled', label: 'Upcoming', status: 'scheduled' },
  { id: 'ongoing', label: 'Ongoing', status: 'ongoing' },
  { id: 'completed', label: 'Done', status: 'completed' },
  { id: 'failed', label: 'Failed', status: 'failed' },
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const defaultForm = {
  title: '',
  type: 'Workshop',
  details: '',
  event_datetime: '',
  status: 'scheduled',
};

/** Append cache-buster so replaced covers refresh in the browser */
function withImageCacheBust(url, event) {
  if (!url) return null;
  const v = event?.updated_at ? new Date(event.updated_at).getTime() : null;
  if (!v) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${v}`;
}

/** Cover image: DB images[0], API image_url (system-assets), or Supabase public path */
function getEventImageUrl(event) {
  if (!event) return null;
  const first = Array.isArray(event.images) && event.images[0];
  if (first) {
    const url = typeof first === 'string' ? first : first?.url;
    if (url) return withImageCacheBust(getFileUrl(url) || url, event);
  }
  if (event.image_url) return withImageCacheBust(getFileUrl(event.image_url) || event.image_url, event);
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (base && event.id) {
    const url = `${base.replace(/\/$/, '')}/storage/v1/object/public/system-assets/events/${event.id}.jpg`;
    return withImageCacheBust(url, event);
  }
  return null;
}

function formatDatetime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });
}

function EventCard({ event, isAdmin, onEdit, onDelete, onSendNotification, onGoToNotification, notificationStats, isHighlighted }) {
  const [imgError, setImgError] = useState(false);
  const imgUrl = !imgError ? getEventImageUrl(event) : null;

  useEffect(() => {
    setImgError(false);
  }, [event.id, event.updated_at, event.images, event.image_url]);
  const stats = notificationStats?.[event.id];
  const hasNotification = stats?.notificationId != null;

  return (
    <div id={`event-${event.id}`} className={`events-card ${isHighlighted ? 'highlighted' : ''}`}>
      <div className="events-card-image-wrap">
        {imgUrl ? (
          <img src={imgUrl} alt="" className="events-card-image" onError={() => setImgError(true)} />
        ) : (
          <div className="events-card-image" style={{ background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
            No image
          </div>
        )}
      </div>
      <div className="events-card-body">
        <div className="events-card-type">{event.type}</div>
        <div className="events-card-title">{event.title}</div>
        <div className="events-card-datetime">{formatDatetime(event.event_datetime)}</div>
        <span className={`status-badge status-${event.status || 'scheduled'}`}>
          {event.status || 'scheduled'}
        </span>
        {event.details && (
          <div className="events-card-details">{event.details}</div>
        )}
        {isAdmin && (
          <div className="events-card-actions">
            <Button size="sm" leftIcon={<EditIcon />} variant="outline" onClick={() => onEdit(event)}>
              Edit
            </Button>
            {hasNotification ? (
              <>
                {stats && stats.sent > 0 && (
                  <span className="events-card-read-stats-inline">
                    Sent to {stats.sent} · <span className="read-count">{stats.read} read</span>
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => onGoToNotification(stats.notificationId)}
                  title="View notification"
                  aria-label="View notification"
                >
                  <BellIcon />
                </Button>
              </>
            ) : (event.status || 'scheduled') !== 'completed' ? (
              <Button size="sm" leftIcon={<BellIcon />} variant="outline" colorScheme="blue" onClick={() => onSendNotification(event)}>
                Send Notification
              </Button>
            ) : null}
            <Button size="sm" leftIcon={<DeleteIcon />} colorScheme="red" variant="ghost" onClick={() => onDelete(event)}>
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const NOTIFICATION_TYPES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'PLACEMENT', label: 'Placement' },
  { value: 'ALERT', label: 'Alert' },
  { value: 'SYSTEM', label: 'System' },
];

const defaultNotifForm = { title: '', message: '', type: 'GENERAL', link: '', eventId: null };

export default function EventsPage() {
  const { userRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isNotifOpen, onOpen: onNotifOpen, onClose: onNotifClose } = useDisclosure();

  const [activeTab, setActiveTab] = useState('scheduled');
  const [events, setEvents] = useState([]);
  const [notificationStats, setNotificationStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);
  const [notificationForm, setNotificationForm] = useState(defaultNotifForm);
  const [notificationSubmitting, setNotificationSubmitting] = useState(false);

  const isAdmin = (userRole || '').toLowerCase() === 'admin';
  const visibleTabs = TABS;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsData, statsData] = await Promise.all([
        EventsService.list(),
        EventsService.getNotificationStats().catch(() => ({})),
      ]);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setNotificationStats(typeof statsData === 'object' && statsData !== null ? statsData : {});
    } catch (e) {
      toast({ title: 'Could not load events', status: 'error', description: e.message });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const highlightId = searchParams.get('highlight');
    if (highlightId && !loading) {
      setTimeout(() => {
        const el = document.getElementById(`event-${highlightId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [location.search, loading]);

  const byStatus = (status) => (status ? events.filter((e) => (e.status || 'scheduled') === status) : []);

  const clearImageState = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const applyImageFile = (file) => {
    if (!file) return;
    const isImage =
      file.type?.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(file.name || '');
    if (!isImage) {
      toast({ title: 'Please choose an image file (JPG, PNG, WebP, or GIF)', status: 'warning' });
      return;
    }
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      applyImageFile(file);
      return;
    }
    if (editingId) {
      setImageFile(null);
      setImagePreview(getEventImageUrl(events.find((ev) => String(ev.id) === String(editingId))) || null);
    }
  };

  const handleImageInputClick = (e) => {
    e.target.value = '';
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    applyImageFile(e.dataTransfer.files?.[0]);
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.type?.trim()) {
      toast({ title: 'Title and type are required', status: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      let formattedEventDatetime = form.event_datetime;
      if (formattedEventDatetime && !formattedEventDatetime.includes('Z') && !formattedEventDatetime.includes('+')) {
        formattedEventDatetime = `${formattedEventDatetime}:00+05:30`;
      }

      const payload = {
        title: form.title.trim(),
        type: form.type.trim(),
        details: form.details?.trim() || null,
        event_datetime: formattedEventDatetime || null,
        status: form.status || 'scheduled',
      };

      let eventId = editingId;
      if (editingId) {
        await EventsService.update(editingId, payload);
      } else {
        const created = await EventsService.create({ ...payload, images: [] });
        eventId = created?.id;
      }

      if (imageFile && eventId) {
        await EventsService.uploadImage(eventId, imageFile);
      }

      toast({
        title: editingId ? 'Event updated' : 'Event created',
        description: imageFile ? 'Cover image saved to storage.' : undefined,
        status: 'success',
      });
      setForm(defaultForm);
      setEditingId(null);
      clearImageState();
      onClose();
      load();
    } catch (err) {
      toast({ title: 'Error', status: 'error', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openAdd = () => {
    clearImageState();
    setForm(defaultForm);
    setEditingId(null);
    onOpen();
  };

  const openEdit = (event) => {
    clearImageState();
    setForm({
      title: event.title || '',
      type: event.type || 'Workshop',
      details: event.details || '',
      event_datetime: event.event_datetime ? (() => {
        const d = new Date(event.event_datetime);
        const istDate = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const year = istDate.getFullYear();
        const month = String(istDate.getMonth() + 1).padStart(2, '0');
        const day = String(istDate.getDate()).padStart(2, '0');
        const hours = String(istDate.getHours()).padStart(2, '0');
        const minutes = String(istDate.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      })() : '',
      status: event.status || 'scheduled',
    });
    setImagePreview(getEventImageUrl(event));
    setEditingId(event.id);
    onOpen();
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    try {
      await EventsService.remove(event.id);
      toast({ title: 'Event deleted', status: 'success' });
      load();
    } catch (err) {
      toast({ title: 'Delete failed', status: 'error', description: err.message });
    }
  };

  const openNotificationModal = (event) => {
    const dateStr = formatDatetime(event.event_datetime);
    const title = `Event: ${event.title || 'Event'}`;
    const message = [
      `${event.type || 'Event'} – ${event.title || ''}`,
      `Date & time: ${dateStr}`,
      event.status ? `Status: ${event.status}` : null,
      event.details ? event.details : null,
    ].filter(Boolean).join('\n');
    const link = `${window.location.origin}/events?highlight=${event.id}`;
    navigate('/placement/notifications', {
      state: { fromEvent: true, event: { title, message, link } },
    });
  };

  const handleNotificationInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveNotification = async () => {
    if (!notificationForm.title?.trim() || !notificationForm.message?.trim()) {
      toast({ title: 'Title and message are required', status: 'warning', isClosable: true });
      return;
    }
    setNotificationSubmitting(true);
    try {
      const title = notificationForm.title.trim();
      const message = notificationForm.message.trim();
      const link = notificationForm.link?.trim() || '';
      const notification_type = notificationForm.type || 'EVENT';
      const created = await NotificationService.create({
        title,
        message,
        notification_type,
        link: link || undefined,
      });
      toast({ title: 'Notification created', description: 'Redirecting to send to students.', status: 'success', duration: 2000 });
      onNotifClose();
      setNotificationForm(defaultNotifForm);
      navigateToPlacementNotificationSend(navigate, {
        title,
        message,
        link,
        notification_type,
        openNotificationId: created?.id,
      });
    } catch (err) {
      toast({ title: 'Failed to create notification', status: 'error', description: err?.message, isClosable: true });
    } finally {
      setNotificationSubmitting(false);
    }
  };

  const currentList = byStatus(TABS.find((t) => t.id === activeTab)?.status);

  const pageContent = (
    <Box bg="#f0f0f0" minH="100vh" py={8}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
          <Heading size="lg" color="#172e36" className="events-page-header">Events</Heading>
          {isAdmin && (
            <Button leftIcon={<AddIcon />} colorScheme="teal" bg="#172e36" _hover={{ bg: '#1e3a47' }} onClick={openAdd}>
              Add Event
            </Button>
          )}
        </Flex>

        <div className="events-page">
          <ul className="events-tabs">
            {visibleTabs.map((t) => {
              const count = t.status != null ? byStatus(t.status).length : null;
              const isActive = activeTab === t.id;
              return (
                <li
                  key={t.id}
                  role="tab"
                  tabIndex={0}
                  className={`events-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab(t.id)}
                >
                  {t.label}
                  {count != null && <span className="tab-badge">{count}</span>}
                </li>
              );
            })}
          </ul>

          <div className="events-tab-content">
            {loading ? (
              <Flex justify="center" py={12}>
                <Spinner size="lg" />
              </Flex>
            ) : currentList.length === 0 ? (
              <div className="events-empty">No events in this category.</div>
            ) : (
              <div className="events-grid">
                {currentList.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    isAdmin={isAdmin}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onSendNotification={openNotificationModal}
                    onGoToNotification={(id) => navigate(`/placement/notifications/${id}`)}
                    notificationStats={notificationStats}
                    isHighlighted={new URLSearchParams(location.search).get('highlight') === String(ev.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>

      <Modal
        isOpen={isOpen}
        onClose={() => { onClose(); setForm(defaultForm); setEditingId(null); clearImageState(); }}
        size="4xl"
        isCentered
        scrollBehavior="inside"
        motionPreset="none"
        className="event-form-modal"
      >
        <ModalOverlay className="event-form-modal-overlay" />
        <ModalContent className="event-form-modal-content" maxW="960px">
          <ModalHeader className="event-form-modal-header" padding={0}>
            <div className="event-form-modal-header-inner">
              <div className="event-form-modal-brand">
                <span className="event-form-modal-brand-icon" aria-hidden="true">
                  <FiCalendar />
                </span>
                <div className="event-form-modal-brand-text">
                  <h2 className="event-form-modal-title">{editingId ? 'Edit Event' : 'Schedule Event'}</h2>
                  <p className="event-form-modal-subtitle">
                    {editingId ? 'Refine event details, visibility, and cover artwork' : 'Publish a new event to the placement calendar'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="event-form-modal-close"
                onClick={() => { onClose(); setForm(defaultForm); setEditingId(null); clearImageState(); }}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
          </ModalHeader>
          <ModalBody className="event-form-modal-body">
            <Box as="form" id="event-form" onSubmit={handleSubmit} className="events-form">
              <article className="events-form-card">
                <header className="events-form-card-head">
                  <span className="events-form-card-icon events-form-card-icon--calendar"><FiCalendar /></span>
                  <div>
                    <h3 className="events-form-card-title">Basic information</h3>
                    <p className="events-form-card-desc">Title, category, schedule, and lifecycle status</p>
                  </div>
                </header>
                <div className="events-form-card-body">
                <FormControl isRequired className="events-form-field">
                  <FormLabel>Event title</FormLabel>
                  <Input
                    className="events-form-input events-form-input-lg"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Placement Orientation 2026"
                  />
                </FormControl>
                <div className={`events-form-row ${editingId != null ? 'events-form-row--three' : 'events-form-row--two'}`}>
                  <FormControl isRequired className="events-form-field">
                    <FormLabel>Event type</FormLabel>
                    <Select
                      className="events-form-input"
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    >
                      {['Workshop', 'Training', 'Career Fair', 'Hackathon', 'Networking', 'Contest', 'Placement', 'Other'].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl className="events-form-field">
                    <FormLabel>Date &amp; time</FormLabel>
                    <Input
                      className="events-form-input events-form-input-datetime"
                      type="datetime-local"
                      value={form.event_datetime}
                      onChange={(e) => setForm((f) => ({ ...f, event_datetime: e.target.value }))}
                    />
                  </FormControl>
                  {editingId != null && (
                    <FormControl className="events-form-field">
                      <FormLabel>Status</FormLabel>
                      <Select
                        className="events-form-input"
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </div>
                </div>
              </article>

              <div className="events-form-duo">
              <article className="events-form-card events-form-card--grow">
                <header className="events-form-card-head">
                  <span className="events-form-card-icon events-form-card-icon--doc"><FiFileText /></span>
                  <div>
                    <h3 className="events-form-card-title">Description</h3>
                    <p className="events-form-card-desc">Venue, organizer, audience, and agenda</p>
                  </div>
                </header>
                <div className="events-form-card-body">
                  <FormControl className="events-form-field">
                    <FormLabel>Event details</FormLabel>
                    <Textarea
                      className="events-form-textarea events-form-textarea-tall"
                      value={form.details}
                      onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                      placeholder="Venue, organizer, audience, agenda..."
                      rows={7}
                    />
                  </FormControl>
                </div>
              </article>

              <article className="events-form-card events-form-card--media">
                <header className="events-form-card-head">
                  <span className="events-form-card-icon events-form-card-icon--image"><FiImage /></span>
                  <div>
                    <h3 className="events-form-card-title">Cover image</h3>
                    <p className="events-form-card-desc">Shown on cards and listings</p>
                  </div>
                </header>
                <div className="events-form-card-body">
                  <div className="events-image-upload">
                    <input
                      ref={imageInputRef}
                      type="file"
                      className="events-image-upload-input"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageFileChange}
                      onClick={handleImageInputClick}
                    />
                    {imagePreview ? (
                      <div className="events-image-preview-stage">
                        <img src={imagePreview} alt="Cover preview" onError={() => setImagePreview(null)} />
                        <button
                          type="button"
                          className="events-image-replace"
                          onClick={openImagePicker}
                        >
                          <FiUploadCloud />
                          Replace image
                        </button>
                      </div>
                    ) : (
                      <label
                        className="events-image-upload-zone"
                        onDragOver={handleImageDragOver}
                        onDrop={handleImageDrop}
                        onClick={(e) => {
                          e.preventDefault();
                          openImagePicker();
                        }}
                      >
                        <span className="events-image-upload-icon-wrap">
                          <FiUploadCloud />
                        </span>
                        <span className="events-image-upload-text">
                          <strong>Drop image here</strong> or browse files
                        </span>
                        <span className="events-image-upload-hint">PNG, JPG, WebP · up to 5 MB</span>
                      </label>
                    )}
                    {imageFile && (
                      <p className="events-image-upload-filename">
                        <span className="events-image-upload-dot" /> {imageFile.name}
                      </p>
                    )}
                    <p className="events-image-upload-help">
                      Stored in system assets when you save. Safe to update later.
                    </p>
                  </div>
                </div>
              </article>
              </div>

              {editingId != null && (
                <article className="events-form-card events-form-card--meta">
                  <header className="events-form-card-head">
                    <span className="events-form-card-icon events-form-card-icon--info"><FiInfo /></span>
                    <div>
                      <h3 className="events-form-card-title">Metadata</h3>
                      <p className="events-form-card-desc">Read-only identifiers for this record</p>
                    </div>
                  </header>
                  <div className="events-form-card-body">
                    <div className="events-meta-grid">
                      <div className="events-meta-item">
                        <span className="events-meta-label">Event ID</span>
                        <span className="events-meta-value">#{editingId}</span>
                      </div>
                      <div className="events-meta-item">
                        <span className="events-meta-label">Type</span>
                        <span className="events-meta-value">{form.type || '—'}</span>
                      </div>
                      <div className="events-meta-item">
                        <span className="events-meta-label">Status</span>
                        <span className={`events-meta-badge status-${form.status || 'scheduled'}`}>
                          {STATUS_OPTIONS.find((o) => o.value === form.status)?.label || form.status}
                        </span>
                      </div>
                      <div className="events-meta-item">
                        <span className="events-meta-label">Scheduled</span>
                        <span className="events-meta-value">{formatDatetime(form.event_datetime) || '—'}</span>
                      </div>
                    </div>
                  </div>
                </article>
              )}
            </Box>
          </ModalBody>
          <ModalFooter className="event-form-modal-footer">
            <p className="event-form-footer-hint">Changes apply after you save</p>
            <div className="event-form-footer-actions">
              <Button variant="ghost" className="event-form-btn-cancel" onClick={onClose} isDisabled={submitting}>
                Cancel
              </Button>
              <Button
                className="event-form-btn-submit"
                isLoading={submitting}
                loadingText={editingId ? 'Saving…' : 'Creating…'}
                type="submit"
                form="event-form"
              >
                {editingId ? 'Save changes' : 'Create event'}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isNotifOpen} onClose={() => { onNotifClose(); setNotificationForm(defaultNotifForm); }} size="lg" className="event-notification-modal">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Notification (from Event)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired mb={4}>
              <FormLabel>Title</FormLabel>
              <Input
                name="title"
                value={notificationForm.title}
                onChange={handleNotificationInputChange}
                placeholder="Notification title"
                bg="gray.50"
              />
            </FormControl>
            <FormControl isRequired mb={4}>
              <FormLabel>Message</FormLabel>
              <Textarea
                name="message"
                value={notificationForm.message}
                onChange={handleNotificationInputChange}
                placeholder="Notification message"
                rows={6}
                bg="gray.50"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Type</FormLabel>
              <Select name="type" value={notificationForm.type} onChange={handleNotificationInputChange} bg="gray.50">
                {NOTIFICATION_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Link (optional)</FormLabel>
              <Input
                name="link"
                value={notificationForm.link}
                onChange={handleNotificationInputChange}
                placeholder="/events or full URL"
                bg="gray.50"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { onNotifClose(); setNotificationForm(defaultNotifForm); }}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              bg="#172e36"
              _hover={{ bg: '#1e3a47' }}
              onClick={handleSaveNotification}
              isLoading={notificationSubmitting}
              isDisabled={!notificationForm.title?.trim() || !notificationForm.message?.trim()}
            >
              Save Notification
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );

  return isAdmin ? <AdminLayout>{pageContent}</AdminLayout> : pageContent;
}
