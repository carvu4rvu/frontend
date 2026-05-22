import { useState } from 'react';
import { Box, Flex, Heading, Spinner, Button, IconButton, Tooltip } from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, BellIcon } from '@chakra-ui/icons';
import { getFileUrl } from '../../utils/fileUrl';
import { formatDateTimeIST } from '../../utils/dateTime';
import '../../pages/EventsPage.css';

const TABS = [
  { id: 'scheduled', label: 'Upcoming', status: 'scheduled' },
  { id: 'ongoing', label: 'Ongoing', status: 'ongoing' },
  { id: 'completed', label: 'Done', status: 'completed' },
  { id: 'failed', label: 'Failed', status: 'failed' },
];

function getEventImageUrl(event) {
  if (!event) return null;
  const first = Array.isArray(event.images) && event.images[0];
  if (first) {
    const url = typeof first === 'string' ? first : first?.url;
    if (url) return getFileUrl(url) || url;
  }
  if (event.image_url) return getFileUrl(event.image_url) || event.image_url;
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (base && event.id) {
    return `${base.replace(/\/$/, '')}/storage/v1/object/public/system-assets/events/${event.id}.jpg`;
  }
  return null;
}

function EventCard({
  event,
  manageMode,
  onEdit,
  onDelete,
  onSendNotification,
  notifying,
}) {
  const imgUrl = getEventImageUrl(event);

  return (
    <div className={`events-card${manageMode ? ' events-card--manage' : ''}`}>
      <div className="events-card-image-wrap">
        {imgUrl ? (
          <img src={imgUrl} alt="" className="events-card-image" />
        ) : (
          <div
            className="events-card-image"
            style={{
              background: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: 14,
            }}
          >
            No image
          </div>
        )}
      </div>
      <div className="events-card-body">
        <div className="events-card-type">{event.type}</div>
        <div className="events-card-title">{event.title}</div>
        <div className="events-card-datetime">{formatDateTimeIST(event.event_datetime)}</div>
        <span className={`status-badge status-${event.status || 'scheduled'}`}>
          {event.status || 'scheduled'}
        </span>
        {event.details && <div className="events-card-details">{event.details}</div>}
        {manageMode && (
          <div className="events-card-actions">
            <Tooltip label="Edit event">
              <IconButton
                aria-label="Edit event"
                icon={<EditIcon />}
                size="sm"
                variant="outline"
                colorScheme="blue"
                className="events-card-action-btn"
                onClick={() => onEdit?.(event)}
              />
            </Tooltip>
            <Tooltip label="Send notification">
              <IconButton
                aria-label="Send notification"
                icon={<BellIcon />}
                size="sm"
                variant="outline"
                colorScheme="orange"
                className="events-card-action-btn"
                isLoading={notifying}
                onClick={() => onSendNotification?.(event)}
              />
            </Tooltip>
            <Tooltip label="Delete event">
              <IconButton
                aria-label="Delete event"
                icon={<DeleteIcon />}
                size="sm"
                variant="outline"
                colorScheme="red"
                className="events-card-action-btn"
                onClick={() => onDelete?.(event)}
              />
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

/** Shared campus events page — same layout as /student/placements/events */
export function CampusEventsView({
  events = [],
  loading = false,
  manageMode = false,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onSendNotification,
  onNotifyVcDigest,
  notifyingEventId = null,
  notifyingVcDigest = false,
}) {
  const [activeTab, setActiveTab] = useState('scheduled');
  const list = Array.isArray(events) ? events : [];

  const byStatus = (status) =>
    status ? list.filter((e) => (e.status || 'scheduled') === status) : [];
  const currentList = byStatus(TABS.find((t) => t.id === activeTab)?.status);

  return (
    <Box className="events-page-shell" bg="gray.50" minH="80vh" py={8} w="100%">
      <div className="events-layout-inner">
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
          <Heading size="lg" color="#166534" m={0}>
            Events
          </Heading>
          {manageMode && (
            <Flex gap={2} flexWrap="wrap">
              <Button
                leftIcon={<AddIcon />}
                colorScheme="green"
                size="sm"
                onClick={onAddEvent}
              >
                Add Event
              </Button>
              {onNotifyVcDigest && (
                <Button
                  leftIcon={<BellIcon />}
                  colorScheme="orange"
                  variant="outline"
                  size="sm"
                  onClick={onNotifyVcDigest}
                  isLoading={notifyingVcDigest}
                  loadingText="Sending…"
                >
                  Notify VC
                </Button>
              )}
            </Flex>
          )}
        </Flex>

        <div className="events-page">
          <ul className="events-tabs">
            {TABS.map((t) => {
              const count = t.status != null ? byStatus(t.status).length : null;
              const isActive = activeTab === t.id;
              return (
                <li
                  key={t.id}
                  role="tab"
                  tabIndex={0}
                  className={`events-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                  onKeyDown={(e) =>
                    (e.key === 'Enter' || e.key === ' ') && setActiveTab(t.id)
                  }
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
                <Spinner size="lg" color="#d4a960" />
              </Flex>
            ) : currentList.length === 0 ? (
              <div className="events-empty">No events in this category.</div>
            ) : (
              <div className="events-grid">
                {currentList.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    manageMode={manageMode}
                    onEdit={onEditEvent}
                    onDelete={onDeleteEvent}
                    onSendNotification={onSendNotification}
                    notifying={notifyingEventId === ev.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Box>
  );
}

export default CampusEventsView;
