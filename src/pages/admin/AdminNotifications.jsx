import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Flex,
  useToast,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  HStack,
  Text,
} from '@chakra-ui/react';
import AdminLayout from '../../components/AdminLayout';
import { NotificationService } from '../../services/notification.service';
import './AdminNotifications.css';

const AdminNotifications = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { notification_type: 'CUSTOM', page, limit };
      const data = await NotificationService.list(params);
      setNotifications(data.notifications || []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      toast({ title: 'Failed to load notifications', status: 'error', description: e.message });
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, toast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const headerBg = '#172e36';
  const headerColor = '#fbeec8';

  return (
    <AdminLayout>
      <Box className="notifications-page">
        <Container maxW="container.xl" py={6}>
          <Flex className="notifications-header" justify="space-between" align="center">
            <Heading size="lg">Notification History</Heading>
          </Flex>

          <TableContainer className="notifications-table-wrap" overflowX="auto">
            {loading ? (
              <Flex justify="center" py={10}>
                <Spinner size="lg" />
              </Flex>
            ) : (
              <Table size="sm" variant="simple">
                <Thead bg={headerBg}>
                  <Tr>
                    <Th color={headerColor}>Title</Th>
                    <Th color={headerColor}>Message</Th>
                    <Th color={headerColor}>Target</Th>
                    <Th color={headerColor}>Recipients</Th>
                    <Th color={headerColor}>Created</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {notifications.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} className="notifications-empty">
                        No notifications yet.
                      </Td>
                    </Tr>
                  ) : (
                    notifications.map((n) => (
                      <Tr key={n.id}>
                        <Td fontWeight="medium">{n.title}</Td>
                        <Td maxW="200px" isTruncated title={n.message}>
                          {n.message?.substring(0, 60)}
                          {n.message?.length > 60 ? '…' : ''}
                        </Td>
                        <Td>
                          {n.target_type || '—'} {n.target_role ? `(${n.target_role})` : ''}
                        </Td>
                        <Td>{n.recipient_count ?? 0}</Td>
                        <Td>{n.created_at ? new Date(n.created_at).toLocaleDateString() : '—'}</Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            )}
          </TableContainer>

          {totalPages > 1 && (
            <HStack className="notifications-pagination" justify="center" spacing={2}>
              <Button size="sm" isDisabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Text fontSize="sm">
                Page {page} of {totalPages}
              </Text>
              <Button size="sm" isDisabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </HStack>
          )}
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default AdminNotifications;
