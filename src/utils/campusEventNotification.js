import { formatDateTimeIST } from './dateTime';

/**
 * Campus event notification prefill + redirect to /placement/notifications send flow.
 */
export function buildCampusEventNotificationContent(event) {
  const eventDate = formatDateTimeIST(event?.event_datetime);

  const title = event?.title ? `Event: ${event.title}` : 'Campus event';
  const message = [
    event?.type ? `Type: ${event.type}` : null,
    `When: ${eventDate}`,
    event?.details
      ? event.details.slice(0, 400) + (event.details.length > 400 ? '…' : '')
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const link = event?.id
    ? `/placement/student-events?event=${event.id}`
    : '/placement/student-events';

  return { title, message, link, notification_type: 'EVENT' };
}

const PREFILL_STORAGE_KEY = 'placement_notification_compose_prefill';

export function navigateToCampusEventNotificationSend(navigate, payload) {
  const navState = {
    prefillNotification: true,
    fromEvent: true,
    openComposeStep: true,
    openNotificationId: payload.openNotificationId ?? null,
    event: {
      title: payload.title,
      message: payload.message,
      link: payload.link || '',
      notification_type: payload.notification_type || 'EVENT',
    },
  };
  try {
    sessionStorage.setItem(PREFILL_STORAGE_KEY, JSON.stringify(navState));
  } catch {
    /* ignore quota / private mode */
  }
  navigate('/placement/notifications', { state: navState });
}

/** Read prefill saved before navigation (fallback if router state is lost). */
export function consumeCampusNotificationPrefill() {
  try {
    const raw = sessionStorage.getItem(PREFILL_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PREFILL_STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
