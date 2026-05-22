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
  Switch,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FaSearch, FaTimes, FaLockOpen, FaEye } from 'react-icons/fa';
import { PlacementService } from '../../services/placement.service';
import { StudentProfileService } from '../../services/studentProfile.service';
import { getFileUrl } from '../../utils/fileUrl';
import { formatDateTimeIST } from '../../utils/dateTime';

const formatDate = (d) => formatDateTimeIST(d);
import { useNavigate } from 'react-router-dom';
import '../student/profile/AcademicsProfile.css';

const STATUS_COLORS = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
};

export default function SemUnlockRequestsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(''); // '' = all, 'pending', 'approved', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionId, setActionId] = useState(null);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (r.usn || '').toLowerCase().includes(q) ||
        (r.student_name || '').toLowerCase().includes(q) ||
        (r.student_email || r.college_email || '').toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);
  const [rejectNotes, setRejectNotes] = useState('');
  const [sendRejectNotification, setSendRejectNotification] = useState(true);
  const [detailRow, setDetailRow] = useState(null);
  const [detailSemester, setDetailSemester] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

  const load = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getSemesterUnlockRequests(filter || undefined);
      setRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (e) {
      toast({
        title: 'Failed to load requests',
        description: e?.message || 'Could not load semester unlock requests.',
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

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await PlacementService.approveSemesterUnlockRequest(id);
      toast({
        title: 'Approved',
        description: 'Semester unlocked successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await load();
    } catch (e) {
      toast({
        title: 'Failed to approve',
        description: e?.message || 'Could not approve request.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setActionId(null);
    }
  };

  const openRejectModal = (id) => {
    setActionId(id);
    setRejectNotes('');
    setSendRejectNotification(true);
    onRejectOpen();
  };

  const handleReject = async () => {
    if (!actionId) return;
    try {
      await PlacementService.rejectSemesterUnlockRequest(actionId, rejectNotes, sendRejectNotification);
      toast({
        title: 'Rejected',
        description: 'Request rejected.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onRejectClose();
      setActionId(null);
      setRejectNotes('');
      setSendRejectNotification(true);
      await load();
    } catch (e) {
      toast({
        title: 'Failed to reject',
        description: e?.message || 'Could not reject request.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };


  const openViewDetails = async (row) => {
    setDetailRow(row);
    setDetailSemester(null);
    onDetailOpen();
    setDetailLoading(true);
    try {
      const data = await StudentProfileService.getAcademicSemesters(row.usn);
      const semesters = Array.isArray(data?.semesters) ? data.semesters : [];
      const match = semesters.find((s) => Number(s.semester) === Number(row.semester));
      setDetailSemester(match || null);
    } catch {
      setDetailSemester(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeViewDetails = () => {
    onDetailClose();
    setDetailRow(null);
    setDetailSemester(null);
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
        <Box>
          <Heading size="md" color="gray.800" mb={1}>
            Semester Unlock Requests
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Students request unlock for locked semesters. Approve to unlock, or reject.
          </Text>
        </Box>

        <HStack spacing={2}>
          {['', 'pending', 'approved', 'rejected'].map((s) => (
            <Button
              key={s || 'all'}
              size="sm"
              variant={filter === s ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setFilter(s)}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </HStack>
      </Flex>

      {!loading && rows.length > 0 && (
        <InputGroup maxW="400px" mb={4}>
          <InputLeftElement pointerEvents="none" color="gray.400">
            <FaSearch />
          </InputLeftElement>
          <Input
            placeholder="Search by USN, name, or email..."
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
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="auto">
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>USN</Th>
                <Th>Student</Th>
                <Th>Semester</Th>
                <Th minW="280px">Reason</Th>
                <Th>Status</Th>
                <Th>Requested</Th>
                <Th>Reviewed</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredRows.length === 0 ? (
                <Tr>
                  <Td colSpan={8} py={8} textAlign="center" color="gray.500">
                    {rows.length === 0 ? 'No requests found.' : 'No requests match your search.'}
                  </Td>
                </Tr>
              ) : (
                filteredRows.map((r) => (
                  <Tr key={r.id}>
                    <Td fontWeight="semibold">
                      <Text
                        as="span"
                        cursor="pointer"
                        color="blue.600"
                        _hover={{ textDecoration: 'underline' }}
                        onClick={() => navigate(`/placement/students/${encodeURIComponent(r.usn)}/academics`, { replace: false })}
                      >
                        {r.usn}
                      </Text>
                    </Td>
                    <Td>{r.student_name || '—'}</Td>
                    <Td>Sem {r.semester}</Td>
                    <Td minW="280px" maxW="400px" whiteSpace="pre-wrap" fontSize="sm">
                      {r.reason || '—'}
                    </Td>
                    <Td>
                      <Badge colorScheme={STATUS_COLORS[r.status] || 'gray'}>{r.status}</Badge>
                    </Td>
                    <Td fontSize="xs">{formatDate(r.created_at)}</Td>
                    <Td fontSize="xs">
                      {r.reviewed_at ? formatDate(r.reviewed_at) : '—'}
                      {r.reviewed_by_name && (
                        <Text fontSize="xs" color="gray.500">
                          by {r.reviewed_by_name}
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        leftIcon={<FaEye />}
                        onClick={() => openViewDetails(r)}
                      >
                        View details
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isDetailOpen} onClose={closeViewDetails} size="xl">
        <ModalOverlay />
        <ModalContent maxW="640px">
          <ModalHeader>
            {detailRow && (
              <>
                {detailRow.student_name} — Semester {detailRow.semester}
              </>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {detailRow && (
              <Box>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  <strong>Reason:</strong> {detailRow.reason || '—'}
                </Text>
                {detailLoading ? (
                  <Flex justify="center" py={8}>
                    <Spinner />
                  </Flex>
                ) : (
                  <>
                    {detailSemester && (
                      <Flex className="academics-form-stats" gap={4} mb={4} flexWrap="wrap">
                        <Box className="academics-form-stat">
                          <Text className="academics-form-stat-label">Semester Credits</Text>
                          <Text className="academics-form-stat-value">{detailSemester.total_credits ?? 0}</Text>
                        </Box>
                        <Box className="academics-form-stat">
                          <Text className="academics-form-stat-label">Earned Credits</Text>
                          <Text className="academics-form-stat-value">{detailSemester.earned_credits ?? '—'}</Text>
                        </Box>
                        <Box className="academics-form-stat">
                          <Text className="academics-form-stat-label">SGPA</Text>
                          <Text className="academics-form-stat-value">
                            {detailSemester.sgpa != null ? Number(detailSemester.sgpa).toFixed(2) : '—'}
                          </Text>
                        </Box>
                        <Box className="academics-form-stat">
                          <Text className="academics-form-stat-label">Active Backlogs</Text>
                          <Text className="academics-form-stat-value">{detailSemester.active_backlogs ?? 0}</Text>
                        </Box>
                        <Box className="academics-form-stat">
                          <Text className="academics-form-stat-label">Cleared Backlogs</Text>
                          <Text className="academics-form-stat-value">{detailSemester.cleared_backlogs ?? 0}</Text>
                        </Box>
                      </Flex>
                    )}
                    {detailSemester?.result_file && (
                      <Text as="a" href={getFileUrl(detailSemester.result_file)} target="_blank" rel="noopener noreferrer" className="academics-marksheet-link" fontSize="sm" mb={3} display="block">
                        View marksheet
                      </Text>
                    )}
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
                      Course-wise details
                    </Text>
                    <Box className="academics-courses-table-wrap">
                      <Table size="sm" className="academics-courses-table">
                        <Thead>
                          <Tr>
                            <Th>Course Code</Th>
                            <Th>Course Title</Th>
                            <Th data-numeric>Credits</Th>
                            <Th data-numeric>Grade Points</Th>
                            <Th>Grade</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {(!detailSemester?.courses || detailSemester.courses.length === 0) ? (
                            <Tr>
                              <Td colSpan={5} color="gray.500" py={4}>
                                No courses recorded
                              </Td>
                            </Tr>
                          ) : (
                            detailSemester.courses.map((c, idx) => (
                              <Tr key={idx}>
                                <Td>{c.course_code ?? '—'}</Td>
                                <Td>{c.course_title ?? '—'}</Td>
                                <Td isNumeric>{c.credits ?? '—'}</Td>
                                <Td isNumeric>{c.grade_points ?? '—'}</Td>
                                <Td className="grade-cell">{c.grade ?? '—'}</Td>
                              </Tr>
                            ))
                          )}
                        </Tbody>
                      </Table>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </ModalBody>
          {detailRow && detailRow.status === 'pending' && (
            <ModalFooter gap={3} borderTopWidth="1px" borderColor="gray.200">
              <Button variant="ghost" onClick={closeViewDetails}>
                Close
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                leftIcon={<FaTimes />}
                onClick={() => {
                  closeViewDetails();
                  openRejectModal(detailRow.id);
                }}
              >
                Reject
              </Button>
              <Button
                colorScheme="green"
                leftIcon={<FaLockOpen />}
                onClick={() => {
                  closeViewDetails();
                  handleApprove(detailRow.id);
                }}
                isLoading={actionId === detailRow.id}
              >
                Approve
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isRejectOpen} onClose={onRejectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reject Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2} fontSize="sm" color="gray.600">
              Optional: Add a note for the student.
            </Text>
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              mb={4}
            />
            <FormControl display="flex" alignItems="center" gap={3}>
              <Switch
                id="send-reject-notification"
                isChecked={sendRejectNotification}
                onChange={(e) => setSendRejectNotification(e.target.checked)}
                colorScheme="blue"
              />
              <FormLabel htmlFor="send-reject-notification" mb={0} fontSize="sm" color="gray.600">
                Remarks will be sent as a notification to the student
              </FormLabel>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onRejectClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleReject}>
              Reject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
