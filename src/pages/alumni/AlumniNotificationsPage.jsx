import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  Text,
  Spinner,
  HStack,
  IconButton,
  Link,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FiSearch, FiStar, FiArchive, FiMail, FiCheck, FiExternalLink } from 'react-icons/fi';
import AlumniLayout from '../../components/AlumniLayout';
import { PlacementService } from '../../services/placement.service';

const colors = {
  accent: '#d4a960',
  dark: '#1e293b',
  darkGreen: '#166534',
  secondary: '#64748b',
  muted: '#94a3b8',
};

const TABS = [
  { key: 'unread', label: 'Unread', icon: FiMail },
  { key: 'read', label: 'Read', icon: FiCheck },
  { key: 'archived', label: 'Archived', icon: FiArchive },
  { key: 'starred', label: 'Starred', icon: FiStar },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const getTypeBadgeColor = (type) => {
  const t = (type || '').toLowerCase();
  if (t === 'urgent') return 'red';
  if (t === 'placement') return 'blue';
  if (t === 'event') return 'orange';
  return 'gray';
};

function normalizeNotification(n) {
  if (!n || typeof n !== 'object') return null;
  return {
    id: n.id ?? n.node_id,
    notificationId: n.notificationId ?? n.notification_id,
    title: n.title ?? '',
    message: n.message ?? '',
    link: n.link ?? null,
    notificationType: n.notificationType ?? n.notification_type ?? 'General',
    isRead: Boolean(n.isRead ?? n.is_read),
    readAt: n.readAt ?? n.read_at,
    isArchived: Boolean(n.isArchived ?? n.is_archived),
    isStarred: Boolean(n.isStarred ?? n.is_starred),
    createdAt: n.createdAt ?? n.created_at,
  };
}

export default function AlumniNotificationsPage() {
  const [tab, setTab] = useState('unread');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await PlacementService.getAlumniNotifications({
        tab,
        search: searchDebounced.trim() || undefined,
        page: 1,
        limit: 50,
      });
      const list = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotifications(list.map(normalizeNotification).filter(Boolean));
      setTotal(data?.total ?? list.length);
    } catch (e) {
      setNotifications([]);
      setTotal(0);
      setLoadError(e?.message || 'Failed to load notifications');
      toast({ title: 'Error', status: 'error', description: e?.message || 'Failed to load notifications', isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [tab, searchDebounced, toast]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (node, value) => {
    setUpdatingId(node.id);
    try {
      await PlacementService.updateAlumniNotificationNode(node.id, { is_read: value });
      await load();
      toast({ title: value ? 'Marked as read' : 'Marked as unread', status: 'success', duration: 2000 });
    } catch (e) {
      toast({ title: 'Failed to update', status: 'error', description: e.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleArchive = async (node, value) => {
    setUpdatingId(node.id);
    try {
      await PlacementService.updateAlumniNotificationNode(node.id, { is_archived: value });
      await load();
      toast({ title: value ? 'Archived' : 'Restored', status: 'success', duration: 2000 });
    } catch (e) {
      toast({ title: 'Failed to update', status: 'error', description: e.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStar = async (node, value) => {
    setUpdatingId(node.id);
    try {
      await PlacementService.updateAlumniNotificationNode(node.id, { is_starred: value });
      await load();
      toast({ title: value ? 'Starred' : 'Unstarred', status: 'success', duration: 2000 });
    } catch (e) {
      toast({ title: 'Failed to update', status: 'error', description: e.message });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AlumniLayout>
      <Box py={6} px={{ base: 4, md: 8 }}>
        <Heading size="lg" mb={2} color={colors.dark} fontWeight="700">
          Notifications
        </Heading>
        {!loadError && (
          <Text color={colors.secondary} fontSize="sm" mb={6}>
            {total} {total === 1 ? 'notification' : 'notifications'} in this tab
            {loading && (
              <HStack as="span" display="inline-flex" gap={2} alignItems="center" ml={2}>
                <Spinner size="sm" />
                <span>Updating…</span>
              </HStack>
            )}
          </Text>
        )}

        {loadError && (
          <Box
            mb={6}
            p={4}
            bg="red.50"
            borderWidth="1px"
            borderColor="red.200"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={3}
          >
            <Text color="red.700" fontWeight="500">{loadError}</Text>
            <Button size="sm" colorScheme="red" variant="outline" onClick={() => load()}>
              Retry
            </Button>
          </Box>
        )}

        <InputGroup maxW="400px" mb={6} size="md">
          <InputLeftElement pointerEvents="none" color="gray.400">
            <FiSearch size={18} />
          </InputLeftElement>
          <Input
            placeholder="Search notifications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bg="white"
            borderColor="gray.200"
            _hover={{ borderColor: 'gray.300' }}
            _focus={{ borderColor: colors.darkGreen, boxShadow: `0 0 0 1px ${colors.darkGreen}` }}
          />
        </InputGroup>

        <Tabs
          variant="soft-rounded"
          index={TABS.findIndex((t) => t.key === tab)}
          onChange={(i) => {
            const newTab = TABS[i].key;
            if (newTab !== tab) setLoading(true);
            setTab(newTab);
          }}
        >
          <TabList flexWrap="wrap" gap={2} mb={4}>
            {TABS.map((t) => (
              <Tab
                key={t.key}
                _selected={{ color: 'white', bg: colors.darkGreen, fontWeight: '600' }}
                _hover={{ bg: 'gray.100' }}
                fontWeight="medium"
              >
                {t.label}
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            {TABS.map((t) => (
              <TabPanel key={t.key} px={0} pt={2}>
                {loading ? (
                  <HStack justify="center" py={12}>
                    <Spinner size="lg" color={colors.accent} />
                  </HStack>
                ) : notifications.length === 0 ? (
                  <Box
                    py={16}
                    textAlign="center"
                    color="gray.500"
                    bg="gray.50"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Text fontSize="lg">No {t.label.toLowerCase()} notifications</Text>
                    <Text fontSize="sm" mt={2}>
                      {t.key === 'unread' ? 'When you receive notifications, they will appear here.' : 'Nothing in this tab yet.'}
                    </Text>
                  </Box>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {notifications.map((n) => (
                      <Box
                        key={n.id}
                        p={4}
                        bg="white"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        _hover={{ borderColor: colors.darkGreen, boxShadow: 'sm' }}
                        transition="all 0.2s"
                      >
                        <HStack align="flex-start" spacing={3} justify="space-between">
                          <Box flex={1} minW={0}>
                            <HStack spacing={2} mb={1} flexWrap="wrap">
                              <Badge colorScheme={getTypeBadgeColor(n.notificationType)} size="sm">
                                {n.notificationType || 'General'}
                              </Badge>
                              <Text fontSize="xs" color="gray.500">
                                {formatDate(n.createdAt)}
                              </Text>
                            </HStack>
                            <Heading size="sm" fontWeight={n.isRead ? '500' : '600'} color={colors.dark} mb={1}>
                              {n.title}
                            </Heading>
                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                              {n.message}
                            </Text>
                            {n.link && (
                              <Link
                                href={n.link.startsWith('http') ? n.link : `${window.location.origin}${n.link}`}
                                target={n.link.startsWith('http') ? '_blank' : '_self'}
                                rel="noopener noreferrer"
                                fontSize="sm"
                                color={colors.darkGreen}
                                fontWeight="500"
                                mt={2}
                                display="inline-flex"
                                alignItems="center"
                                gap={1}
                                _hover={{ textDecoration: 'underline' }}
                              >
                                View details <FiExternalLink size={14} />
                              </Link>
                            )}
                          </Box>
                          <HStack spacing={1} flexShrink={0}>
                            {tab !== 'starred' && (
                              <IconButton
                                aria-label={n.isStarred ? 'Unstar' : 'Star'}
                                icon={<FiStar size={16} fill={n.isStarred ? 'currentColor' : 'none'} />}
                                variant="ghost"
                                size="sm"
                                color={n.isStarred ? 'yellow.500' : 'gray.400'}
                                onClick={() => handleStar(n, !n.isStarred)}
                                isLoading={updatingId === n.id}
                              />
                            )}
                            {tab !== 'archived' && (
                              <IconButton
                                aria-label={n.isArchived ? 'Restore' : 'Archive'}
                                icon={<FiArchive size={16} />}
                                variant="ghost"
                                size="sm"
                                color="gray.400"
                                onClick={() => handleArchive(n, !n.isArchived)}
                                isLoading={updatingId === n.id}
                              />
                            )}
                            {(tab === 'unread' || tab === 'read') && (
                              <IconButton
                                aria-label={n.isRead ? 'Mark unread' : 'Mark read'}
                                icon={n.isRead ? <FiMail size={16} /> : <FiCheck size={16} />}
                                variant="ghost"
                                size="sm"
                                color="gray.400"
                                onClick={() => handleMarkRead(n, !n.isRead)}
                                isLoading={updatingId === n.id}
                              />
                            )}
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>
    </AlumniLayout>
  );
}
