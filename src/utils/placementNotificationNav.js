import { getDisplayCTCValue } from './placementDriveDisplay';

/**
 * Build prefill payload for a placement drive notification.
 */
export function buildDriveNotificationContent(drive, companyName) {
  const eventDate = drive.event_datetime
    ? new Date(drive.event_datetime).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';
  const regDate = drive.last_date_to_registration
    ? new Date(drive.last_date_to_registration).toLocaleDateString()
    : '—';
  const ctcVal = getDisplayCTCValue(drive.ctc_structure);
  const ctc = ctcVal != null ? `${ctcVal} LPA` : drive.ctc ? String(drive.ctc) : 'TBD';
  const name = drive.company_name || companyName || 'Company';
  const title = `Placement drive: ${name}`;
  const message = [
    `${name} – ${drive.job_type || drive.job_profile || '—'}`,
    drive.job_location ? `Location: ${drive.job_location}` : null,
    drive.type_of_hiring ? `Hiring: ${drive.type_of_hiring}` : null,
    `CTC: ${ctc}`,
    `Event date: ${eventDate}`,
    `Last date to register: ${regDate}`,
    drive.job_description
      ? drive.job_description.slice(0, 200) + (drive.job_description.length > 200 ? '…' : '')
      : null,
  ]
    .filter(Boolean)
    .join('\n');
  const link = `/placement/events/${drive.id}/process`;
  return { title, message, link, notification_type: 'PLACEMENT' };
}

/**
 * After creating a draft notification, open the send UI on /placement/notifications.
 */
export function navigateToPlacementNotificationSend(navigate, { title, message, link, notification_type = 'PLACEMENT', openNotificationId }) {
  navigate('/placement/notifications', {
    state: {
      prefillNotification: true,
      openNotificationId: openNotificationId ?? null,
      event: {
        title,
        message,
        link: link || '',
        notification_type,
      },
    },
  });
}
