import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
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
  Link as ChakraLink,
  Badge,
  useToast,
  Container,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FiSearch, FiStar, FiArchive, FiMail, FiCheck, FiExternalLink } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import CompanyLayout from '../../components/CompanyLayout';
import { CompanyService } from '../../services/company.service';

const colors = {
  accent: '#d4a960',
  accentHover: '#c4983f',
  dark: '#172e36',
  darkBlue: '#1e3a47',
  secondary: '#64748b',
  pageBg: '#f1f5f9',
  border: '#e2e8f0',
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
    id: n.id,
    notificationId: n.notificationId ?? n.notification_id,
    title: n.title ?? '',
    message: n.message ?? '',
    link: n.link ?? null,
    notificationType: n.notificationType ?? n.notification_type ?? 'General',
    isRead: Boolean(n.isRead ?? n.is_read),
    isArchived: Boolean(n.isArchived ?? n.is_archived),
    isStarred: Boolean(n.isStarred ?? n.is_starred),
    createdAt: n.createdAt ?? n.created_at,
  };
}

export default function CompanyNotificationsPage() {
  const [tab, setTab] = useState('unread');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await CompanyService.getNotifications({ page: 1, limit: 100 });
      const list = Array.isArray(data?.notifications) ? data.notifications : [];
      setAllNotifications(list.map(normalizeNotification).filter(Boolean));
    } catch (e) {
      setAllNotifications([]);
      setLoadError(e?.message || 'Failed to load notifications');
      toast({ title: 'Error', status: 'error', description: e?.message || 'Failed to load notifications', isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredByTab = useMemo(() => {
    return allNotifications.filter((n) => {
      if (tab === 'unread') return !n.isRead && !n.isArchived;
      if (tab === 'read') return n.isRead && !n.isArchived;
      if (tab === 'archived') return n.isArchived;
      if (tab === 'starred') return n.isStarred;
      return true;
    });
  }, [allNotifications, tab]);

  const notifications = useMemo(() => {
    const q = (searchDebounced || '').toLowerCase().trim();
    if (!q) return filteredByTab;
    return filteredByTab.filter(
      (n) =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.message || '').toLowerCase().includes(q)
    );
  }, [filteredByTab, searchDebounced]);

  const total = notifications.length;

  const handleMarkRead = async (node, value) => {
    setUpdatingId(node.id);
    try {
      await CompanyService.updateNotificationNode(node.id, { is_read: value });
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
      await CompanyService.updateNotificationNode(node.id, { is_archived: value });
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
      await CompanyService.updateNotificationNode(node.id, { is_starred: value });
      await load();
      toast({ title: value ? 'Starred' : 'Unstarred', status: 'success', duration: 2000 });
    } catch (e) {
      toast({ title: 'Failed to update', status: 'error', description: e.message });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <CompanyLayout>
      <Box bg={colors.pageBg} minH="100vh" py={8}>
        <Container maxW="900px">
          <Heading size="lg" mb={2} color={colors.dark} fontWeight="700">
            Notifications
          </Heading>
          {!loadError && (
            <Text color={colors.secondary} fontSize="sm" mb={6}>
              {total} {total === 1 ? 'notification' : 'notifications'} in this tab
              {loading && (
                <HStack as="span" display="inline-flex" gap={2} alignItems="center" ml={2}>
                  <Spinner size="sm" color={colors.accent} />
                  <span>Updating…</span>
                </HStack>
              )}
            </Text>
          )}

          <Box mb={6}>
            <InputGroup maxW="320px">
              <InputLeftElement pointerEvents="none">
                <FiSearch color={colors.secondary} />
              </InputLeftElement>
              <Input
                placeholder="Search notifications…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                bg="white"
                borderRadius="xl"
                borderColor={colors.border}
                _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
              />
            </InputGroup>
          </Box>

          <Tabs variant="soft-rounded" colorScheme="gray" index={TABS.findIndex((t) => t.key === tab)} onChange={(i) => setTab(TABS[i].key)}>
            <TabList gap={2} flexWrap="wrap" mb={4}>
              {TABS.map((t) => (
                <Tab key={t.key} fontSize="sm" fontWeight="500">
                  <HStack spacing={2}>
                    <t.icon size={16} />
                    <span>{t.label}</span>
                  </HStack>
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              {TABS.map((t) => (
                <TabPanel key={t.key} px={0}>
                  {loading ? (
                    <VStack py={12}>
                      <Spinner size="xl" color={colors.accent} thickness="4px" />
                      <Text color={colors.secondary}>Loading notifications…</Text>
                    </VStack>
                  ) : loadError ? (
                    <Card bg="white" borderRadius="xl" border="1px solid" borderColor={colors.border}>
                      <CardBody py={10}>
                        <Text color={colors.secondary}>{loadError}</Text>
                      </CardBody>
                    </Card>
                  ) : notifications.length === 0 ? (
                    <Card bg="white" borderRadius="xl" border="1px solid" borderColor={colors.border}>
                      <CardBody py={12}>
                        <VStack spacing={2}>
                          <Text fontSize="lg">No {t.label.toLowerCase()} notifications</Text>
                          <Text color={colors.secondary} textAlign="center">
                            {t.key === 'unread' ? 'When you receive notifications, they will appear here.' : 'Nothing in this tab yet.'}
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {notifications.map((n) => (
                        <Card
                          key={n.id}
                          bg="white"
                          borderRadius="xl"
                          border="1px solid"
                          borderColor={colors.border}
                          opacity={n.isRead ? 0.92 : 1}
                          _hover={{ boxShadow: 'md' }}
                        >
                          <CardBody py={4}>
                            <HStack align="flex-start" justify="space-between" spacing={4}>
                              <Box flex={1} minW={0}>
                                <HStack mb={1} spacing={2} flexWrap="wrap">
                                  <Badge colorScheme={getTypeBadgeColor(n.notificationType)} size="sm">
                                    {n.notificationType || 'General'}
                                  </Badge>
                                  <Text fontSize="xs" color={colors.secondary}>
                                    {formatDate(n.createdAt)}
                                  </Text>
                                </HStack>
                                <Text fontWeight={n.isRead ? '500' : '600'} color={colors.dark} noOfLines={1}>
                                  {n.title}
                                </Text>
                                {n.message && (
                                  <Text fontSize="sm" color={colors.secondary} mt={1} noOfLines={2}>
                                    {n.message}
                                  </Text>
                                )}
                                {n.link && (
                                  <ChakraLink as={RouterLink} to={n.link} color={colors.accent} fontSize="sm" mt={2} display="inline-flex" alignItems="center" gap={1}>
                                    Open <FiExternalLink size={14} />
                                  </ChakraLink>
                                )}
                              </Box>
                              <HStack spacing={1} flexShrink={0}>
                                <IconButton
                                  aria-label={n.isRead ? 'Mark unread' : 'Mark read'}
                                  icon={<FiCheck size={16} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme={n.isRead ? 'green' : 'gray'}
                                  onClick={() => handleMarkRead(n, !n.isRead)}
                                  isLoading={updatingId === n.id}
                                />
                                <IconButton
                                  aria-label={n.isStarred ? 'Unstar' : 'Star'}
                                  icon={<FiStar size={16} fill={n.isStarred ? 'currentColor' : 'none'} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="yellow"
                                  onClick={() => handleStar(n, !n.isStarred)}
                                  isLoading={updatingId === n.id}
                                />
                                <IconButton
                                  aria-label={n.isArchived ? 'Restore' : 'Archive'}
                                  icon={<FiArchive size={16} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="gray"
                                  onClick={() => handleArchive(n, !n.isArchived)}
                                  isLoading={updatingId === n.id}
                                />
                              </HStack>
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
    </CompanyLayout>
  );
}
