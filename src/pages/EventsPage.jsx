import React, { useState, useEffect, useCallback } from 'react';
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
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { BellIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EventsService } from '../services/events.service';
import { NotificationService } from '../services/notification.service';
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
  images: '',
  status: 'scheduled',
};

function formatDatetime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function EventCard({ event, isAdmin, onEdit, onDelete, onSendNotification, onGoToNotification, notificationStats, isHighlighted }) {
  const imgUrl = Array.isArray(event.images) && event.images[0] ? event.images[0] : null;
  const stats = notificationStats?.[event.id];
  const hasNotification = stats?.notificationId != null;

  return (
    <div id={`event-${event.id}`} className={`events-card ${isHighlighted ? 'highlighted' : ''}`}>
      <div className="events-card-image-wrap">
        {imgUrl ? (
          <img src={imgUrl} alt="" className="events-card-image" />
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.type?.trim()) {
      toast({ title: 'Title and type are required', status: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const images = form.images
        ? form.images.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];
      const payload = {
        title: form.title.trim(),
        type: form.type.trim(),
        details: form.details?.trim() || null,
        event_datetime: form.event_datetime || null,
        images,
        status: form.status || 'scheduled',
      };
      if (editingId) {
        await EventsService.update(editingId, payload);
        toast({ title: 'Event updated', status: 'success' });
      } else {
        await EventsService.create(payload);
        toast({ title: 'Event created', status: 'success' });
      }
      setForm(defaultForm);
      setEditingId(null);
      onClose();
      load();
    } catch (err) {
      toast({ title: 'Error', status: 'error', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openAdd = () => {
    setForm(defaultForm);
    setEditingId(null);
    onOpen();
  };

  const openEdit = (event) => {
    setForm({
      title: event.title || '',
      type: event.type || 'Workshop',
      details: event.details || '',
      event_datetime: event.event_datetime ? event.event_datetime.slice(0, 16) : '',
      images: Array.isArray(event.images) ? event.images.join('\n') : '',
      status: event.status || 'scheduled',
    });
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
      const created = await NotificationService.create({
        title: notificationForm.title.trim(),
        message: notificationForm.message.trim(),
        type: notificationForm.type,
        link: notificationForm.link?.trim() || undefined,
        event_id: notificationForm.eventId || undefined,
      });
      toast({ title: 'Notification created', description: 'Redirecting to send to students.', status: 'success', duration: 2000 });
      onNotifClose();
      setNotificationForm(defaultNotifForm);
      navigate(`/placement/notifications/${created.id}`);
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
          <Heading size="lg" color="#172e36">Events</Heading>
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

      <Modal isOpen={isOpen} onClose={() => { onClose(); setForm(defaultForm); setEditingId(null); }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingId ? 'Edit Event' : 'Schedule Event'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box as="form" id="event-form" onSubmit={handleSubmit} className="events-form">
              <FormControl isRequired mb={4}>
                <FormLabel>Title</FormLabel>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Event title"
                />
              </FormControl>
              <FormControl isRequired mb={4}>
                <FormLabel>Type</FormLabel>
                <Select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {['Workshop', 'Training', 'Career Fair', 'Hackathon', 'Networking', 'Contest', 'Placement', 'Other'].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Date & time</FormLabel>
                <Input
                  type="datetime-local"
                  value={form.event_datetime}
                  onChange={(e) => setForm((f) => ({ ...f, event_datetime: e.target.value }))}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Details</FormLabel>
                <Textarea
                  value={form.details}
                  onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                  placeholder="Description..."
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Image URLs (one per line)</FormLabel>
                <Textarea
                  value={form.images}
                  onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
                  placeholder="https://..."
                  minH="80px"
                />
              </FormControl>
              {editingId != null && (
                <FormControl mb={4}>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button
              colorScheme="teal"
              bg="#172e36"
              _hover={{ bg: '#1e3a47' }}
              isLoading={submitting}
              type="submit"
              form="event-form"
            >
              {editingId ? 'Update' : 'Create'} Event
            </Button>
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
