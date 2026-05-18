import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  useToast,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FaSearch, FaCheck, FaTimes, FaPhone, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';

const STATUS_COLORS = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  CONTACTED: 'blue',
};

export default function AlumniConnect() {
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(''); // '' = all, 'PENDING', 'APPROVED', 'REJECTED', 'CONTACTED'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionId, setActionId] = useState(null);
  const [remarks, setRemarks] = useState('');
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
  const [detailRow, setDetailRow] = useState(null);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (r.student_usn || '').toLowerCase().includes(q) ||
        (r.student_name || '').toLowerCase().includes(q) ||
        (r.student_email || '').toLowerCase().includes(q) ||
        (r.alumni_name || '').toLowerCase().includes(q) ||
        (r.alumni_email || '').toLowerCase().includes(q) ||
        (r.connection_purpose || '').toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getAlumniConnectionRequests(
        filter ? { status: filter } : {}
      );
      setRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (e) {
      toast({
        title: 'Failed to load requests',
        description: e?.message || 'Could not load connection requests.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const updateStatus = async (id, status, poRemarks = null) => {
    setActionId(id);
    try {
      await PlacementService.updateAlumniConnectionRequest(id, {
        status,
        po_remarks: poRemarks || undefined,
      });
      toast({
        title: status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Updated',
        description: `Request ${status.toLowerCase()} successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onRejectClose();
      setRemarks('');
      await load();
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e?.message || 'Could not update request.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setActionId(null);
    }
  };

  const openRejectModal = (row) => {
    setDetailRow(row);
    setActionId(row.id);
    setRemarks('');
    onRejectOpen();
  };

  const handleReject = () => {
    if (!actionId) return;
    updateStatus(actionId, 'REJECTED', remarks);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  const openDetail = (row) => {
    setDetailRow(row);
    onDetailOpen();
  };

  return (
    <AdminLayout>
      <Box pt={6} px={{ base: 4, md: 6 }} pb={8}>
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
          <Box>
            <Heading size="md" color="gray.800" mb={1}>
              Alumni Connect
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Connection requests from alumni who want to connect with students. Approve, reject, or mark as contacted.
            </Text>
          </Box>

          <HStack spacing={2}>
            {['', 'PENDING', 'APPROVED', 'REJECTED', 'CONTACTED'].map((s) => (
              <Button
                key={s || 'all'}
                size="sm"
                variant={filter === s ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => setFilter(s)}
              >
                {s === '' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </HStack>
        </Flex>

        {!loading && rows.length > 0 && (
          <InputGroup maxW="400px" mb={6}>
            <InputLeftElement pointerEvents="none" color="gray.400">
              <FaSearch />
            </InputLeftElement>
            <Input
              placeholder="Search by alumni, student, USN, or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="white"
              borderColor="gray.200"
            />
          </InputGroup>
        )}

        {loading ? (
          <Flex py={12} justify="center">
            <Spinner />
          </Flex>
        ) : (
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="auto" mt={2}>
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th py={4}>Alumni</Th>
                  <Th py={4}>Student</Th>
                  <Th minW="140px" py={4}>Purpose</Th>
                  <Th minW="200px" py={4}>Message</Th>
                  <Th py={4}>Status</Th>
                  <Th py={4}>Requested</Th>
                  <Th py={4}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredRows.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} py={12} textAlign="center" color="gray.500">
                      {rows.length === 0
                        ? 'No connection requests yet.'
                        : 'No requests match your search.'}
                    </Td>
                  </Tr>
                ) : (
                  filteredRows.map((r) => (
                    <Tr key={r.id} _hover={{ bg: 'gray.50' }}>
                      <Td py={4}>
                        <Box>
                          <Text fontWeight="medium">{r.alumni_name || '—'}</Text>
                          <Text fontSize="xs" color="gray.500">{r.alumni_email || '—'}</Text>
                          {r.alumni_company && (
                            <Text fontSize="xs" color="gray.600">{r.alumni_company}</Text>
                          )}
                        </Box>
                      </Td>
                      <Td py={4}>
                        <Text
                          as="span"
                          cursor="pointer"
                          color="blue.600"
                          fontWeight="medium"
                          _hover={{ textDecoration: 'underline' }}
                          onClick={() =>
                            navigate(`/placement/students/${encodeURIComponent(r.student_usn)}/academics`, {
                              replace: false,
                            })
                          }
                        >
                          {r.student_usn}
                        </Text>
                        <Text fontSize="xs" color="gray.600">{r.student_name || '—'}</Text>
                      </Td>
                      <Td py={4} fontSize="sm">{r.connection_purpose || '—'}</Td>
                      <Td py={4} maxW="280px" whiteSpace="pre-wrap" fontSize="sm" noOfLines={2}>
                        {r.message_to_po || '—'}
                      </Td>
                      <Td py={4}>
                        <Badge colorScheme={STATUS_COLORS[r.status] || 'gray'}>
                          {r.status}
                        </Badge>
                      </Td>
                      <Td py={4} fontSize="xs">{formatDate(r.created_at)}</Td>
                      <Td py={4}>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="blue"
                            leftIcon={<FaEye />}
                            onClick={() => openDetail(r)}
                          >
                            View
                          </Button>
                          {r.status === 'PENDING' && (
                            <>
                              <Button
                                size="xs"
                                colorScheme="green"
                                leftIcon={<FaCheck />}
                                onClick={() => updateStatus(r.id, 'APPROVED')}
                                isLoading={actionId === r.id}
                              >
                                Approve
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="red"
                                variant="outline"
                                leftIcon={<FaTimes />}
                                onClick={() => openRejectModal(r)}
                              >
                                Reject
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="blue"
                                variant="outline"
                                leftIcon={<FaPhone />}
                                onClick={() => updateStatus(r.id, 'CONTACTED')}
                                isLoading={actionId === r.id}
                              >
                                Contacted
                              </Button>
                            </>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Connection Request Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {detailRow && (
              <Box>
                <Box mb={4}>
                  <Text fontSize="xs" color="gray.500" fontWeight="600" mb={1}>Alumni</Text>
                  <Text fontWeight="medium">{detailRow.alumni_name || '—'}</Text>
                  <Text fontSize="sm" color="gray.600">{detailRow.alumni_email || '—'}</Text>
                  {(detailRow.alumni_company || detailRow.alumni_designation) && (
                    <Text fontSize="sm" color="gray.600">
                      {[detailRow.alumni_company, detailRow.alumni_designation].filter(Boolean).join(' • ')}
                    </Text>
                  )}
                </Box>
                <Box mb={4}>
                  <Text fontSize="xs" color="gray.500" fontWeight="600" mb={1}>Student</Text>
                  <Text
                    as="span"
                    cursor="pointer"
                    color="blue.600"
                    _hover={{ textDecoration: 'underline' }}
                    onClick={() => {
                      onDetailClose();
                      navigate(`/placement/students/${encodeURIComponent(detailRow.student_usn)}/academics`);
                    }}
                  >
                    {detailRow.student_usn}
                  </Text>
                  <Text fontSize="sm" color="gray.600">{detailRow.student_name || '—'}</Text>
                  <Text fontSize="sm" color="gray.600">{detailRow.student_email || '—'}</Text>
                </Box>
                <Box mb={4}>
                  <Text fontSize="xs" color="gray.500" fontWeight="600" mb={1}>Connection Purpose</Text>
                  <Text>{detailRow.connection_purpose || '—'}</Text>
                </Box>
                <Box mb={4}>
                  <Text fontSize="xs" color="gray.500" fontWeight="600" mb={1}>Message to PO</Text>
                  <Text whiteSpace="pre-wrap" fontSize="sm">{detailRow.message_to_po || '—'}</Text>
                </Box>
                {(detailRow.preferred_contact_date || detailRow.preferred_time_slot || detailRow.contact_mode) && (
                  <Box mb={4}>
                    <Text fontSize="xs" color="gray.500" fontWeight="600" mb={1}>Preferred Contact</Text>
                    <Text fontSize="sm">
                      {[detailRow.preferred_contact_date, detailRow.preferred_time_slot, detailRow.contact_mode]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  </Box>
                )}
                {detailRow.po_remarks && (
                  <Box mb={4}>
                    <Text fontSize="xs" color="gray.500" fontWeight="600" mb={1}>PO Remarks</Text>
                    <Text fontSize="sm" whiteSpace="pre-wrap">{detailRow.po_remarks}</Text>
                  </Box>
                )}
                <HStack mt={4}>
                  <Badge colorScheme={STATUS_COLORS[detailRow.status] || 'gray'}>{detailRow.status}</Badge>
                  <Text fontSize="xs" color="gray.500">Requested: {formatDate(detailRow.created_at)}</Text>
                </HStack>
              </Box>
            )}
          </ModalBody>
          {detailRow && detailRow.status === 'PENDING' && (
            <ModalFooter gap={2} borderTopWidth="1px" borderColor="gray.200">
              <Button variant="ghost" onClick={onDetailClose}>Close</Button>
              <Button
                colorScheme="red"
                variant="outline"
                leftIcon={<FaTimes />}
                onClick={() => {
                  onDetailClose();
                  openRejectModal(detailRow);
                }}
              >
                Reject
              </Button>
              <Button
                colorScheme="green"
                leftIcon={<FaCheck />}
                onClick={() => {
                  onDetailClose();
                  updateStatus(detailRow.id, 'APPROVED');
                }}
                isLoading={actionId === detailRow.id}
              >
                Approve
              </Button>
              <Button
                colorScheme="blue"
                leftIcon={<FaPhone />}
                onClick={() => {
                  onDetailClose();
                  updateStatus(detailRow.id, 'CONTACTED');
                }}
                isLoading={actionId === detailRow.id}
              >
                Mark Contacted
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reject Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel fontSize="sm" color="gray.600">Optional: Add remarks for records</FormLabel>
              <Textarea
                placeholder="Reason for rejection (optional)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onRejectClose}>Cancel</Button>
            <Button colorScheme="red" onClick={handleReject} isLoading={actionId != null}>
              Reject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
