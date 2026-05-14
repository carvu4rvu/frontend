import React, { useState, useEffect, useCallback } from 'react';
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
  Link,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FiSearch, FiStar, FiArchive, FiMail, FiCheck, FiExternalLink } from 'react-icons/fi';
import { NotificationService } from '../../services/notification.service';
import { useStudentDataCache } from '../../context/StudentDataCacheContext';
import './StudentNotificationsPage.css';

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

export default function StudentNotificationsPage() {
  const [tab, setTab] = useState('unread');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const toast = useToast();
  const { fetchNotifications } = useStudentDataCache();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await NotificationService.listMine({
        tab,
        search: searchDebounced.trim() || undefined,
        page: 1,
        limit: 50,
      });
      setNotifications(data.notifications || []);
      setTotal(data.total ?? 0);
    } catch (e) {
      console.error('Load notifications:', e);
      setNotifications([]);
      setTotal(0);
      toast({ title: 'Failed to load notifications', status: 'error', description: e.message });
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

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (node, value) => {
    setUpdatingId(node.id);
    try {
      await NotificationService.updateNode(node.id, { is_read: value });
      await load();
      fetchNotifications();
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
      await NotificationService.updateNode(node.id, { is_archived: value });
      await load();
      fetchNotifications();
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
      await NotificationService.updateNode(node.id, { is_starred: value });
      await load();
      toast({ title: value ? 'Starred' : 'Unstarred', status: 'success', duration: 2000 });
    } catch (e) {
      toast({ title: 'Failed to update', status: 'error', description: e.message });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Box className="student-notifications-page" py={6} px={{ base: 4, md: 8 }}>
      <Heading size="lg" mb={6} color="#1a202c" fontWeight="700">
        Notifications
      </Heading>

      <Box className="student-notifications-toolbar" mb={6}>
        <InputGroup maxW="400px" size="md">
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
            _focus={{ borderColor: '#2a4d5c', boxShadow: '0 0 0 1px #2a4d5c' }}
            aria-label="Search notifications"
          />
        </InputGroup>
      </Box>

      <Tabs
        variant="soft-rounded"
        colorScheme="teal"
        index={TABS.findIndex((t) => t.key === tab)}
        onChange={(i) => setTab(TABS[i].key)}
        className="student-notifications-tabs"
      >
        <TabList flexWrap="wrap" gap={2} mb={4}>
          {TABS.map((t) => (
            <Tab
              key={t.key}
              _selected={{ color: 'white', bg: '#2a4d5c', fontWeight: '600' }}
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
                  <Spinner size="lg" color="#2a4d5c" />
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
                      className={`student-notification-card ${n.isRead ? 'read' : 'unread'}`}
                      p={4}
                      bg="white"
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="gray.200"
                      _hover={{ borderColor: '#2a4d5c', boxShadow: 'sm' }}
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
                          <Heading size="sm" fontWeight={n.isRead ? '500' : '600'} color="#1a202c" mb={1}>
                            {n.title}
                          </Heading>
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {n.message}
                          </Text>
                          {n.link && (
                            <Link
                              href={n.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              fontSize="sm"
                              color="#2a4d5c"
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
                              _hover={{ color: n.isStarred ? 'yellow.600' : 'gray.600' }}
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
                              _hover={{ color: 'gray.600' }}
                              onClick={() => handleArchive(n, !n.isArchived)}
                              isLoading={updatingId === n.id}
                            />
                          )}
                          {tab === 'archived' && (
                            <IconButton
                              aria-label="Restore"
                              icon={<FiArchive size={16} />}
                              variant="ghost"
                              size="sm"
                              color="gray.400"
                              _hover={{ color: 'gray.600' }}
                              onClick={() => handleArchive(n, false)}
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
                              _hover={{ color: 'gray.600' }}
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
  );
}
