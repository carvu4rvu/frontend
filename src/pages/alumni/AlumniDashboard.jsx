import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Spinner,
  Avatar,
  Badge,
  Icon,
  Progress,
  HStack,
  Text,
} from '@chakra-ui/react';
import { CalendarIcon, ChevronRightIcon, BellIcon, ViewIcon } from '@chakra-ui/icons';
import { FaUsers, FaBriefcase, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PlacementService } from '../../services/placement.service';
import { getFileUrl } from '../../utils/fileUrl';
import { getDisplayProjectSnaps } from '../../utils/projectSnaps';
import { formatDateTimeIST, formatRelativeTimeIST } from '../../utils/dateTime';
import './AlumniDashboard.css';

function isUpcoming(iso) {
  return iso && new Date(iso) >= new Date();
}

const PROFILE_FIELDS = [
  { key: 'full_name', label: 'Full name' },
  { key: 'graduation_year', label: 'Graduation year' },
  { key: 'current_company', label: 'Company' },
  { key: 'current_designation', label: 'Role' },
  { key: 'personal_email', label: 'Email' },
  { key: 'phone_number', label: 'Phone' },
  { key: 'profile_image', label: 'Photo' },
  { key: 'alumni_remark', label: 'Bio' },
];

function getProfileCompletion(profile) {
  if (!profile) return { percent: 0, missing: PROFILE_FIELDS.map((f) => f.label) };
  const missing = [];
  let filled = 0;
  for (const { key, label } of PROFILE_FIELDS) {
    const v = profile[key];
    const ok = v != null && String(v).trim() !== '';
    if (ok) filled += 1;
    else missing.push(label);
  }
  return {
    percent: Math.round((filled / PROFILE_FIELDS.length) * 100),
    missing,
  };
}

function normalizeNotification(n) {
  if (!n || typeof n !== 'object') return null;
  return {
    id: n.id ?? n.node_id,
    title: n.title ?? 'Notification',
    message: n.message ?? '',
    type: n.notificationType ?? n.notification_type ?? 'General',
    createdAt: n.createdAt ?? n.created_at,
    isRead: Boolean(n.isRead ?? n.is_read),
  };
}

const AlumniDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [hrList, setHrList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [alumniNetwork, setAlumniNetwork] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [
          eventsData,
          hrData,
          profileData,
          unread,
          notifResult,
          projectsData,
          alumniData,
        ] = await Promise.all([
          PlacementService.getAlumniEvents(),
          PlacementService.getMyHrRecommendations().catch(() => []),
          PlacementService.getAlumniMe().catch(() => null),
          PlacementService.getAlumniNotificationsUnreadCount().catch(() => 0),
          PlacementService.getAlumniNotifications({ limit: 5, page: 1 }).catch(() => ({ notifications: [] })),
          PlacementService.getAlumniProjects().catch(() => []),
          PlacementService.getAllAlumni().catch(() => []),
        ]);
        if (!cancelled) {
          setEvents(Array.isArray(eventsData) ? eventsData : []);
          setHrList(Array.isArray(hrData) ? hrData : []);
          setProfile(profileData);
          setUnreadCount(typeof unread === 'number' ? unread : 0);
          const notifList = (notifResult?.notifications ?? [])
            .map(normalizeNotification)
            .filter(Boolean);
          setNotifications(notifList.slice(0, 5));
          setProjects(Array.isArray(projectsData) ? projectsData : []);
          setAlumniNetwork(Array.isArray(alumniData) ? alumniData : []);
        }
      } catch {
        /* partial data ok */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const upcomingEvents = useMemo(
    () => events.filter((e) => isUpcoming(e.event_datetime)).slice(0, 5),
    [events]
  );
  const pastEventsCount = useMemo(
    () => events.filter((e) => !isUpcoming(e.event_datetime)).length,
    [events]
  );
  const displayName = profile?.full_name || user?.name || user?.full_name || 'Alumni';
  const profileImage = profile?.profile_image ? getFileUrl(profile.profile_image) : user?.profile_image;
  const { percent: profilePercent, missing: missingProfileFields } = useMemo(
    () => getProfileCompletion(profile),
    [profile]
  );
  const spotlightProjects = useMemo(() => projects.slice(0, 3), [projects]);
  const networkSample = useMemo(
    () => alumniNetwork.filter((a) => a.full_name).slice(0, 4),
    [alumniNetwork]
  );
  const recentHr = useMemo(() => hrList.slice(0, 3), [hrList]);

  const heroMeta = [
    profile?.graduation_year && { icon: FaGraduationCap, text: `Class of ${profile.graduation_year}` },
    profile?.institution_name && { icon: FaBriefcase, text: profile.institution_name },
    profile?.current_work_location && { text: profile.current_work_location },
  ].filter(Boolean);

  return (
    <div className="alumni-dash">
        <header className="alumni-dash__hero">
          <div className="alumni-dash__hero-top">
            <div>
              <h1 className="alumni-dash__hero-title">Welcome back, {displayName.split(' ')[0]}!</h1>
              <p className="alumni-dash__hero-sub">
                {profile?.current_designation && profile?.current_company
                  ? `${profile.current_designation} at ${profile.current_company}`
                  : 'Your alumni portal — mentor students, refer opportunities, and stay connected.'}
              </p>
              {heroMeta.length > 0 && (
                <div className="alumni-dash__hero-chips">
                  {heroMeta.map((chip, i) => (
                    <span key={i} className="alumni-dash__chip">
                      {chip.icon && <Icon as={chip.icon} boxSize={3} />}
                      {chip.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {!loading && profilePercent < 100 && (
              <div className="alumni-dash__hero-progress">
                <Text fontSize="xs" color="whiteAlpha.800" mb={1}>
                  Profile {profilePercent}%
                </Text>
                <Progress
                  value={profilePercent}
                  size="sm"
                  borderRadius="full"
                  colorScheme="yellow"
                  bg="whiteAlpha.300"
                />
              </div>
            )}
          </div>
        </header>

        <div className="alumni-dash__stats" aria-label="Overview">
          <div
            className="alumni-dash__stat-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/placement/alumni-hr-recommendations')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/placement/alumni-hr-recommendations')}
          >
            <div className="alumni-dash__stat-label">HR referrals</div>
            <div className="alumni-dash__stat-value">{loading ? '—' : hrList.length}</div>
            <p className="alumni-dash__stat-hint">Opportunities shared</p>
          </div>
          <div
            className="alumni-dash__stat-card alumni-dash__stat-card--events"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/placement/alumni-events')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/placement/alumni-events')}
          >
            <div className="alumni-dash__stat-label">Upcoming events</div>
            <div className="alumni-dash__stat-value">{loading ? '—' : upcomingEvents.length}</div>
            <p className="alumni-dash__stat-hint">
              {pastEventsCount > 0 ? `${pastEventsCount} past` : 'Campus & alumni'}
            </p>
          </div>
          <div
            className="alumni-dash__stat-card alumni-dash__stat-card--projects"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/placement/alumni-projects')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/placement/alumni-projects')}
          >
            <div className="alumni-dash__stat-label">Student projects</div>
            <div className="alumni-dash__stat-value">{loading ? '—' : projects.length}</div>
            <p className="alumni-dash__stat-hint">Available to review</p>
          </div>
          <div
            className="alumni-dash__stat-card alumni-dash__stat-card--notify"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/placement/alumni-notifications')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/placement/alumni-notifications')}
          >
            <div className="alumni-dash__stat-label">Notifications</div>
            <div className="alumni-dash__stat-value">{loading ? '—' : unreadCount}</div>
            <p className="alumni-dash__stat-hint">{unreadCount > 0 ? 'Unread' : 'All caught up'}</p>
          </div>
        </div>

        <div className="alumni-dash__grid">
          <div className="alumni-dash__main">
            <section className="alumni-dash__panel">
              <div className="alumni-dash__panel-head">
                <h2 className="alumni-dash__section-title">Upcoming events</h2>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="green"
                  rightIcon={<ChevronRightIcon />}
                  onClick={() => navigate('/placement/alumni-events')}
                >
                  All events
                </Button>
              </div>
              {loading ? (
                <div className="alumni-dash__loading"><Spinner color="#d4a960" /></div>
              ) : upcomingEvents.length === 0 ? (
                <div className="alumni-dash__empty-inline">
                  <Icon as={CalendarIcon} boxSize={5} color="#d4a960" />
                  <p>No upcoming events. You&apos;ll see campus and alumni events here when they&apos;re scheduled.</p>
                </div>
              ) : (
                <div className="alumni-dash__list">
                  {upcomingEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="alumni-dash__event-row"
                      onClick={() => navigate('/placement/alumni-events')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate('/placement/alumni-events')}
                    >
                      <div className="alumni-dash__event-main">
                        <Badge colorScheme="green" fontSize="0.65rem" mb={1}>
                          {ev.type || 'Event'}
                        </Badge>
                        <div className="alumni-dash__event-title">{ev.title}</div>
                        <div className="alumni-dash__event-date">{formatDateTimeIST(ev.event_datetime)}</div>
                        {ev.location && (
                          <div className="alumni-dash__event-meta">{ev.location}</div>
                        )}
                      </div>
                      <ChevronRightIcon color="#94a3b8" boxSize={5} flexShrink={0} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="alumni-dash__panel">
              <div className="alumni-dash__panel-head">
                <h2 className="alumni-dash__section-title">Recent updates</h2>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="green"
                  rightIcon={<ChevronRightIcon />}
                  onClick={() => navigate('/placement/alumni-notifications')}
                >
                  View all
                </Button>
              </div>
              {loading ? (
                <div className="alumni-dash__loading"><Spinner color="#d4a960" size="md" /></div>
              ) : notifications.length === 0 ? (
                <div className="alumni-dash__empty-inline">
                  <Icon as={BellIcon} boxSize={5} color="#3182ce" />
                  <p>No notifications yet. Placement news and event alerts will appear here.</p>
                </div>
              ) : (
                <div className="alumni-dash__list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`alumni-dash__notif-row${n.isRead ? '' : ' alumni-dash__notif-row--unread'}`}
                      onClick={() => navigate('/placement/alumni-notifications')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate('/placement/alumni-notifications')}
                    >
                      <div className="alumni-dash__notif-main">
                        <div className="alumni-dash__notif-title">{n.title}</div>
                        {n.message && (
                          <p className="alumni-dash__notif-msg">{n.message.slice(0, 120)}{n.message.length > 120 ? '…' : ''}</p>
                        )}
                      </div>
                      <span className="alumni-dash__notif-time">{formatRelativeTimeIST(n.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="alumni-dash__panel">
              <div className="alumni-dash__panel-head">
                <h2 className="alumni-dash__section-title">Student project spotlight</h2>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="green"
                  rightIcon={<ChevronRightIcon />}
                  onClick={() => navigate('/placement/alumni-projects')}
                >
                  Browse all
                </Button>
              </div>
              {loading ? (
                <div className="alumni-dash__loading"><Spinner color="#d4a960" size="md" /></div>
              ) : spotlightProjects.length === 0 ? (
                <div className="alumni-dash__empty-inline">
                  <Icon as={ViewIcon} boxSize={5} color="#166534" />
                  <p>No student projects to show yet. Check back as students publish their work.</p>
                </div>
              ) : (
                <div className="alumni-dash__project-grid">
                  {spotlightProjects.map((p) => {
                    const thumbUrl = getFileUrl(getDisplayProjectSnaps(p)[0]);
                    return (
                      <div
                        key={p.id}
                        className="alumni-dash__project-card"
                        onClick={() => navigate(`/placement/alumni-projects?project=${p.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/placement/alumni-projects?project=${p.id}`)}
                      >
                        <div
                          className="alumni-dash__project-thumb"
                          style={thumbUrl ? { backgroundImage: `url(${thumbUrl})` } : undefined}
                        >
                          {!thumbUrl && <Icon as={ViewIcon} boxSize={6} color="#94a3b8" />}
                        </div>
                        <div className="alumni-dash__project-body">
                          <p className="alumni-dash__project-title">{p.title || 'Untitled project'}</p>
                          <p className="alumni-dash__project-meta">
                            {p.usn ? `${p.usn} · ` : ''}{p.genre || 'Student work'}
                          </p>
                          {p.one_line_description && (
                            <p className="alumni-dash__project-desc">{p.one_line_description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="alumni-dash__sidebar">
            <div
              className="alumni-dash__sidebar-card alumni-dash__sidebar-card--clickable"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/placement/alumni-profile')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/placement/alumni-profile')}
            >
              <div className="alumni-dash__profile-row">
                <Avatar
                  size="lg"
                  name={displayName}
                  src={profileImage}
                  border="2px solid"
                  borderColor="#FDE74C"
                  bg="#475569"
                />
                <div className="alumni-dash__profile-meta">
                  <p className="alumni-dash__profile-name">{displayName}</p>
                  {profile?.current_designation && (
                    <p className="alumni-dash__profile-role">{profile.current_designation}</p>
                  )}
                  {profile?.current_company && (
                    <p className="alumni-dash__profile-company">{profile.current_company}</p>
                  )}
                  {profile?.personal_email && (
                    <p className="alumni-dash__profile-email">{profile.personal_email}</p>
                  )}
                </div>
              </div>
              {profilePercent < 100 && !loading && (
                <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.100">
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" fontWeight="600" color="gray.600">
                      Complete your profile
                    </Text>
                    <Text fontSize="xs" fontWeight="700" color="#166534">
                      {profilePercent}%
                    </Text>
                  </HStack>
                  <Progress value={profilePercent} size="xs" colorScheme="green" borderRadius="full" mb={2} />
                  <Text fontSize="xs" color="gray.500" noOfLines={2}>
                    Missing: {missingProfileFields.slice(0, 3).join(', ')}
                    {missingProfileFields.length > 3 ? '…' : ''}
                  </Text>
                </Box>
              )}
            </div>

            <div className="alumni-dash__sidebar-card">
              <div className="alumni-dash__panel-head">
                <h2 className="alumni-dash__section-title">Alumni network</h2>
              </div>
              <div className="alumni-dash__network-stat">
                <Icon as={FaUsers} color="#d4a960" boxSize={5} />
                <div>
                  <p className="alumni-dash__network-count">
                    {loading ? '—' : alumniNetwork.length}
                  </p>
                  <p className="alumni-dash__network-label">alumni in directory</p>
                </div>
              </div>
              {networkSample.length > 0 && (
                <HStack spacing={-2} mt={3} mb={3}>
                  {networkSample.map((a) => (
                    <Avatar
                      key={a.id ?? a.student_id ?? a.full_name}
                      size="sm"
                      name={a.full_name}
                      src={a.profile_image ? getFileUrl(a.profile_image) : undefined}
                      border="2px solid white"
                      bg="#475569"
                    />
                  ))}
                </HStack>
              )}
              <Button
                size="sm"
                width="100%"
                variant="outline"
                colorScheme="green"
                onClick={() => navigate('/placement/alumni-directory')}
              >
                Open directory
              </Button>
            </div>

            {recentHr.length > 0 && (
              <div className="alumni-dash__sidebar-card">
                <h2 className="alumni-dash__section-title">Your recent referrals</h2>
                <ul className="alumni-dash__hr-list">
                  {recentHr.map((hr, idx) => (
                    <li key={hr.id ?? idx} className="alumni-dash__hr-item">
                      <p className="alumni-dash__hr-title">
                        {hr.company_name || hr.company || 'Company'}
                        {hr.role_title || hr.job_title ? ` — ${hr.role_title || hr.job_title}` : ''}
                      </p>
                      {(hr.opportunity_type || hr.created_at) && (
                        <p className="alumni-dash__hr-meta">
                          {[hr.opportunity_type, hr.created_at && formatRelativeTimeIST(hr.created_at)].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  width="100%"
                  mt={2}
                  variant="link"
                  colorScheme="green"
                  onClick={() => navigate('/placement/alumni-hr-recommendations')}
                >
                  Manage referrals →
                </Button>
              </div>
            )}

            {!loading && recentHr.length === 0 && (
              <div className="alumni-dash__sidebar-card alumni-dash__cta-card">
                <p className="alumni-dash__cta-title">Know an opening?</p>
                <p className="alumni-dash__cta-text">
                  Refer HR contacts or job openings to help students in the placement process.
                </p>
                <Button
                  size="sm"
                  width="100%"
                  bg="#FDE74C"
                  color="#20343c"
                  _hover={{ bg: '#e5d43a' }}
                  onClick={() => navigate('/placement/alumni-hr-recommendations')}
                >
                  Submit a referral
                </Button>
              </div>
            )}
          </aside>
        </div>
      </div>
  );
};

export default AlumniDashboard;

