import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  useToast,
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  List,
  ListItem,
  HStack,
  Checkbox,
  CheckboxGroup,
  Stack,
  VStack,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';

const PLACEMENT_VIOLATION_TYPES = ['OFFER_REJECTED', 'NO_SHOW', 'MULTIPLE_OFFERS_ACCEPTED', 'DOCUMENT_FRAUD', 'POLICY_BREACH', 'OTHER'];
const DISCIPLINARY_VIOLATION_TYPES = ['CHEATING', 'MISCONDUCT', 'HARASSMENT', 'ACADEMIC_FRAUD', 'BEHAVIORAL', 'OTHER'];
const REJECTION_REASON_OPTIONS = ['CGPA_BELOW_THRESHOLD', 'ACTIVE_BACKLOGS', 'HISTORY_OF_BACKLOGS', 'NOT_OPTED_IN', 'DISCIPLINARY_ISSUE', 'PLACEMENT_VIOLATION', 'YEAR_GAP', 'OTHER'];

const headerBg = '#172e36';
const headerColor = '#fbeec8';
const borderColor = '#c2b38a';
const cardBg = '#ffffff';

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
};

const formatDateOnly = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '—';
  }
};

const Violations = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [eligibilityLogs, setEligibilityLogs] = useState([]);
  const [placementViolations, setPlacementViolations] = useState([]);
  const [disciplinaryRecords, setDisciplinaryRecords] = useState([]);
  const [loadingEligibility, setLoadingEligibility] = useState(true);
  const [loadingViolations, setLoadingViolations] = useState(true);
  const [loadingDisciplinary, setLoadingDisciplinary] = useState(true);

  // Add Violation modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState(''); // 'eligibility', 'placement', 'disciplinary'
  const [drives, setDrives] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [mainTabIndex, setMainTabIndex] = useState(0);
  const [eligibilityForm, setEligibilityForm] = useState({
    placement_drive_id: '',
    is_eligible: true,
    rejection_reasons: [],
  });
  const [placementForm, setPlacementForm] = useState({
    placement_drive_id: '',
    violation_type: 'OFFER_REJECTED',
    penalty_type: 'WARNING',
    penalty_days: '',
    remarks: '',
  });
  const [disciplinaryForm, setDisciplinaryForm] = useState({
    violation_type: 'CHEATING',
    severity: 'MINOR',
    description: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
  });

  const fetchEligibilityLogs = useCallback(async () => {
    setLoadingEligibility(true);
    try {
      const data = await PlacementService.getEligibilityDecisionLogs();
      setEligibilityLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({ title: 'Failed to load eligibility logs', status: 'error' });
      setEligibilityLogs([]);
    } finally {
      setLoadingEligibility(false);
    }
  }, [toast]);

  const fetchPlacementViolations = useCallback(async () => {
    setLoadingViolations(true);
    try {
      const data = await PlacementService.getPlacementViolations();
      setPlacementViolations(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({ title: 'Failed to load placement violations', status: 'error' });
      setPlacementViolations([]);
    } finally {
      setLoadingViolations(false);
    }
  }, [toast]);

  const fetchDisciplinaryRecords = useCallback(async () => {
    setLoadingDisciplinary(true);
    try {
      const data = await PlacementService.getDisciplinaryRecords();
      setDisciplinaryRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({ title: 'Failed to load disciplinary records', status: 'error' });
      setDisciplinaryRecords([]);
    } finally {
      setLoadingDisciplinary(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEligibilityLogs();
  }, [fetchEligibilityLogs]);

  useEffect(() => {
    fetchPlacementViolations();
  }, [fetchPlacementViolations]);

  useEffect(() => {
    fetchDisciplinaryRecords();
  }, [fetchDisciplinaryRecords]);

  const getDriveLabel = (row) => {
    const drive = row.drive;
    if (!drive) return `Drive #${row.placement_drive_id}`;
    const company = drive.company?.company_name || '';
    const job = drive.job_type || '';
    if (company || job) return `${company || '—'} / ${job || '—'}`.trim();
    return `Drive #${row.placement_drive_id}`;
  };

  const handleOpenAddModal = (type) => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStudent(null);
    setModalType(type);
    setEligibilityForm({ placement_drive_id: '', is_eligible: true, rejection_reasons: [] });
    setPlacementForm({ placement_drive_id: '', violation_type: 'OFFER_REJECTED', penalty_type: 'WARNING', penalty_days: '', remarks: '' });
    setDisciplinaryForm({ violation_type: 'CHEATING', severity: 'MINOR', description: '', start_date: new Date().toISOString().slice(0, 10), end_date: '' });
    PlacementService.getAllDrives().then((d) => setDrives(Array.isArray(d) ? d : []));
    onOpen();
  };

  const handleSearchStudents = useCallback(async (query) => {
    const q = typeof query === 'string' ? String(query).trim() : searchQuery.trim();
    setSearching(true);
    try {
      const data = await PlacementService.searchStudents(q, 200);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Load all students when modal opens; filter as you type (debounced when typing)
  useEffect(() => {
    if (!isOpen || selectedStudent) return;
    const delay = searchQuery.trim() ? 300 : 0;
    const timer = setTimeout(() => handleSearchStudents(searchQuery), delay);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, selectedStudent, handleSearchStudents]);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
  };

  const handleAddViolationSubmit = async () => {
    if (!selectedStudent?.usn) return;
    setSubmitting(true);
    try {
      if (modalType === 'eligibility') {
        if (!eligibilityForm.placement_drive_id) {
          toast({ title: 'Please select a drive', status: 'warning' });
          setSubmitting(false);
          return;
        }
        await PlacementService.createEligibilityDecisionLog({
          usn: selectedStudent.usn,
          placement_drive_id: eligibilityForm.placement_drive_id,
          is_eligible: eligibilityForm.is_eligible,
          rejection_reasons: eligibilityForm.is_eligible ? null : eligibilityForm.rejection_reasons,
        });
        toast({ title: 'Eligibility decision log added', status: 'success' });
        fetchEligibilityLogs();
      } else if (modalType === 'placement') {
        await PlacementService.createPlacementViolation({
          usn: selectedStudent.usn,
          placement_drive_id: placementForm.placement_drive_id || null,
          violation_type: placementForm.violation_type,
          penalty_type: placementForm.penalty_type,
          penalty_days: placementForm.penalty_type === 'TEMP_BAN' ? placementForm.penalty_days || null : null,
          remarks: placementForm.remarks || null,
        });
        toast({ title: 'Placement violation added', status: 'success' });
        fetchPlacementViolations();
      } else if (modalType === 'disciplinary') {
        await PlacementService.createDisciplinaryRecord({
          usn: selectedStudent.usn,
          violation_type: disciplinaryForm.violation_type,
          severity: disciplinaryForm.severity,
          description: disciplinaryForm.description || null,
          start_date: disciplinaryForm.start_date,
          end_date: disciplinaryForm.end_date || null,
        });
        toast({ title: 'Disciplinary record added', status: 'success' });
        fetchDisciplinaryRecords();
      }
      onClose();
    } catch (err) {
      toast({ title: err?.message || 'Failed to add record', status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <Box bg="#f0f0f0" minH="100vh" pb={10}>
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} pt={8}>
          <Box mb={4}>
            <Heading size="lg" color="gray.800" mb={1}>
              Violations
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Eligibility decision logs, placement violations, and disciplinary records.
            </Text>
          </Box>

          <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent maxH="90vh">
              <ModalHeader>
                {modalType === 'eligibility' && 'Add Eligibility Decision Log'}
                {modalType === 'placement' && 'Add Placement Violation'}
                {modalType === 'disciplinary' && 'Add Disciplinary Record'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                {!selectedStudent ? (
                  <>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      All students shown below. Type to filter by USN, email, or name.
                    </Text>
                    <HStack mb={4}>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                          placeholder="USN, email, or name"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchStudents()}
                        />
                      </InputGroup>
                      <Button colorScheme="blue" onClick={handleSearchStudents} isLoading={searching}>
                        Search
                      </Button>
                    </HStack>
                    {searchResults.length > 0 && (
                      <List spacing={2} maxH="200px" overflowY="auto">
                        {searchResults.map((s) => (
                          <ListItem
                            key={s.usn}
                            p={3}
                            borderRadius="md"
                            bg="gray.50"
                            cursor="pointer"
                            _hover={{ bg: 'gray.100' }}
                            onClick={() => handleSelectStudent(s)}
                          >
                            <Text fontWeight="medium">{s.full_name || s.name}</Text>
                            <Text fontSize="sm" color="gray.600">{s.usn} · {s.college_email}</Text>
                          </ListItem>
                        ))}
                      </List>
                    )}
                    {!searching && searchResults.length === 0 && (
                      <Text color="gray.500" fontSize="sm">
                        {searchQuery.trim() ? 'No students found. Try a different search.' : 'No students in the system.'}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Box mb={4} p={3} bg="blue.50" borderRadius="md">
                      <Text fontSize="sm" fontWeight="medium">{selectedStudent.full_name || selectedStudent.name}</Text>
                      <Text fontSize="sm" color="gray.600">{selectedStudent.usn} · {selectedStudent.college_email}</Text>
                      <Button size="xs" variant="link" mt={1} onClick={() => setSelectedStudent(null)}>
                        Change student
                      </Button>
                    </Box>

                    {/* Eligibility Decision Log Form */}
                    {modalType === 'eligibility' && (
                      <VStack align="stretch" spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>Placement Drive</FormLabel>
                          <Select
                            value={eligibilityForm.placement_drive_id}
                            onChange={(e) => setEligibilityForm((f) => ({ ...f, placement_drive_id: e.target.value }))}
                            placeholder="Select a drive"
                          >
                            {drives.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.company?.company_name || 'Company'} – {d.job_type || 'Drive'}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Is Eligible?</FormLabel>
                          <Select
                            value={eligibilityForm.is_eligible ? 'yes' : 'no'}
                            onChange={(e) => setEligibilityForm((f) => ({ ...f, is_eligible: e.target.value === 'yes' }))}
                          >
                            <option value="yes">Yes - Eligible</option>
                            <option value="no">No - Not Eligible</option>
                          </Select>
                        </FormControl>
                        {!eligibilityForm.is_eligible && (
                          <FormControl>
                            <FormLabel>Rejection Reasons</FormLabel>
                            <CheckboxGroup
                              value={eligibilityForm.rejection_reasons}
                              onChange={(values) => setEligibilityForm((f) => ({ ...f, rejection_reasons: values }))}
                            >
                              <Stack spacing={2}>
                                {REJECTION_REASON_OPTIONS.map((reason) => (
                                  <Checkbox key={reason} value={reason}>
                                    {reason.replace(/_/g, ' ')}
                                  </Checkbox>
                                ))}
                              </Stack>
                            </CheckboxGroup>
                          </FormControl>
                        )}
                      </VStack>
                    )}

                    {/* Placement Violation Form */}
                    {modalType === 'placement' && (
                      <VStack align="stretch" spacing={4}>
                        <FormControl>
                          <FormLabel>Drive (optional)</FormLabel>
                          <Select
                            value={placementForm.placement_drive_id}
                            onChange={(e) => setPlacementForm((f) => ({ ...f, placement_drive_id: e.target.value }))}
                            placeholder="None"
                          >
                            {drives.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.company?.company_name || 'Company'} – {d.job_type || 'Drive'}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Violation Type</FormLabel>
                          <Select
                            value={placementForm.violation_type}
                            onChange={(e) => setPlacementForm((f) => ({ ...f, violation_type: e.target.value }))}
                          >
                            {PLACEMENT_VIOLATION_TYPES.map((v) => (
                              <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Penalty Type</FormLabel>
                          <Select
                            value={placementForm.penalty_type}
                            onChange={(e) => setPlacementForm((f) => ({ ...f, penalty_type: e.target.value }))}
                          >
                            <option value="WARNING">WARNING</option>
                            <option value="TEMP_BAN">TEMP_BAN</option>
                            <option value="PERMANENT_BAN">PERMANENT_BAN</option>
                          </Select>
                        </FormControl>
                        {placementForm.penalty_type === 'TEMP_BAN' && (
                          <FormControl>
                            <FormLabel>Penalty Days</FormLabel>
                            <Input
                              type="number"
                              min={1}
                              value={placementForm.penalty_days}
                              onChange={(e) => setPlacementForm((f) => ({ ...f, penalty_days: e.target.value }))}
                              placeholder="e.g. 30"
                            />
                          </FormControl>
                        )}
                        <FormControl>
                          <FormLabel>Remarks</FormLabel>
                          <Textarea
                            value={placementForm.remarks}
                            onChange={(e) => setPlacementForm((f) => ({ ...f, remarks: e.target.value }))}
                            placeholder="Optional"
                            rows={2}
                          />
                        </FormControl>
                      </VStack>
                    )}

                    {/* Disciplinary Record Form */}
                    {modalType === 'disciplinary' && (
                      <VStack align="stretch" spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>Violation Type</FormLabel>
                          <Select
                            value={disciplinaryForm.violation_type}
                            onChange={(e) => setDisciplinaryForm((f) => ({ ...f, violation_type: e.target.value }))}
                          >
                            {DISCIPLINARY_VIOLATION_TYPES.map((v) => (
                              <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Severity</FormLabel>
                          <Select
                            value={disciplinaryForm.severity}
                            onChange={(e) => setDisciplinaryForm((f) => ({ ...f, severity: e.target.value }))}
                          >
                            <option value="MINOR">MINOR</option>
                            <option value="MAJOR">MAJOR</option>
                            <option value="CRITICAL">CRITICAL</option>
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel>Description</FormLabel>
                          <Textarea
                            value={disciplinaryForm.description}
                            onChange={(e) => setDisciplinaryForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Optional"
                            rows={2}
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Start Date</FormLabel>
                          <Input
                            type="date"
                            value={disciplinaryForm.start_date}
                            onChange={(e) => setDisciplinaryForm((f) => ({ ...f, start_date: e.target.value }))}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>End Date (optional)</FormLabel>
                          <Input
                            type="date"
                            value={disciplinaryForm.end_date}
                            onChange={(e) => setDisciplinaryForm((f) => ({ ...f, end_date: e.target.value }))}
                          />
                        </FormControl>
                      </VStack>
                    )}
                  </>
                )}
              </ModalBody>
              {selectedStudent && (
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                  <Button colorScheme="blue" onClick={handleAddViolationSubmit} isLoading={submitting}>
                    {modalType === 'eligibility' && 'Add Log'}
                    {modalType === 'placement' && 'Add Violation'}
                    {modalType === 'disciplinary' && 'Add Record'}
                  </Button>
                </ModalFooter>
              )}
            </ModalContent>
          </Modal>

          <Tabs variant="unstyled" mb={4} index={mainTabIndex} onChange={setMainTabIndex}>
            <TabList
              gap={0}
              borderBottom="2px"
              borderColor="gray.200"
              bg="gray.100"
              borderRadius="lg"
              p={1}
              w="fit-content"
            >
              <Tab
                borderRadius="md"
                px={4}
                py={2}
                fontSize="sm"
                fontWeight="medium"
                _selected={{ bg: 'white', color: 'gray.800', boxShadow: 'sm', border: '1px', borderColor: 'gray.200', borderBottom: '2px solid white', mb: '-2px' }}
                _hover={{ bg: 'whiteAlpha.700' }}
                color="gray.600"
              >
                Eligibility Decision Logs
              </Tab>
              <Tab
                borderRadius="md"
                px={4}
                py={2}
                fontSize="sm"
                fontWeight="medium"
                _selected={{ bg: 'white', color: 'gray.800', boxShadow: 'sm', border: '1px', borderColor: 'gray.200', borderBottom: '2px solid white', mb: '-2px' }}
                _hover={{ bg: 'whiteAlpha.700' }}
                color="gray.600"
              >
                Placement Violations
              </Tab>
              <Tab
                borderRadius="md"
                px={4}
                py={2}
                fontSize="sm"
                fontWeight="medium"
                _selected={{ bg: 'white', color: 'gray.800', boxShadow: 'sm', border: '1px', borderColor: 'gray.200', borderBottom: '2px solid white', mb: '-2px' }}
                _hover={{ bg: 'whiteAlpha.700' }}
                color="gray.600"
              >
                Disciplinary Records
              </Tab>
            </TabList>

            <TabPanels pt={4}>
              {/* Tab 1: Eligibility Decision Logs */}
              <TabPanel p={0}>
                <Flex justify="flex-end" mb={3}>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    size="sm"
                    onClick={() => handleOpenAddModal('eligibility')}
                  >
                    Add Eligibility Log
                  </Button>
                </Flex>
                <Box bg={cardBg} borderRadius="xl" boxShadow="sm" border="1px" borderColor="gray.200" overflow="hidden">
                  {loadingEligibility ? (
                    <Flex justify="center" py={12}>
                      <Spinner size="lg" />
                    </Flex>
                  ) : (
                    <TableContainer overflowX="auto">
                      <Table size="sm">
                        <Thead bg={headerBg}>
                          <Tr>
                            <Th color={headerColor} borderColor={borderColor}>USN</Th>
                            <Th color={headerColor} borderColor={borderColor}>Drive</Th>
                            <Th color={headerColor} borderColor={borderColor}>Eligible</Th>
                            <Th color={headerColor} borderColor={borderColor} minW="240px">Rejection Reasons</Th>
                            <Th color={headerColor} borderColor={borderColor}>Evaluated At</Th>
                            <Th color={headerColor} borderColor={borderColor}>Evaluated By</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {eligibilityLogs.map((row) => (
                            <Tr
                              key={row.id}
                              _hover={{ bg: 'gray.50' }}
                              cursor="pointer"
                              onClick={() => navigate(`/placement/students/${row.usn}`)}
                            >
                              <Td borderColor={borderColor} fontWeight="medium">{row.usn}</Td>
                              <Td borderColor={borderColor}>{getDriveLabel(row)}</Td>
                              <Td borderColor={borderColor}>
                                <Badge colorScheme={row.is_eligible ? 'green' : 'red'}>
                                  {row.is_eligible ? 'Yes' : 'No'}
                                </Badge>
                              </Td>
                              <Td borderColor={borderColor} minW="240px">
                                {Array.isArray(row.rejection_reasons) && row.rejection_reasons.length > 0
                                  ? row.rejection_reasons.join(', ')
                                  : '—'}
                              </Td>
                              <Td borderColor={borderColor}>{formatDate(row.evaluated_at)}</Td>
                              <Td borderColor={borderColor}>{row.evaluated_by || '—'}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                  {!loadingEligibility && eligibilityLogs.length === 0 && (
                    <Text py={8} textAlign="center" color="gray.500">No eligibility decision logs found.</Text>
                  )}
                </Box>
              </TabPanel>

              {/* Tab 2: Placement Violations */}
              <TabPanel p={0}>
                <Flex justify="flex-end" mb={3}>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    size="sm"
                    onClick={() => handleOpenAddModal('placement')}
                  >
                    Add Placement Violation
                  </Button>
                </Flex>
                <Box bg={cardBg} borderRadius="xl" boxShadow="sm" border="1px" borderColor="gray.200" overflow="hidden">
                  {loadingViolations ? (
                    <Flex justify="center" py={12}>
                      <Spinner size="lg" />
                    </Flex>
                  ) : (
                    <TableContainer overflowX="auto">
                      <Table size="sm">
                        <Thead bg={headerBg}>
                          <Tr>
                            <Th color={headerColor} borderColor={borderColor}>USN</Th>
                            <Th color={headerColor} borderColor={borderColor}>Drive</Th>
                            <Th color={headerColor} borderColor={borderColor}>Violation Type</Th>
                            <Th color={headerColor} borderColor={borderColor}>Penalty</Th>
                            <Th color={headerColor} borderColor={borderColor}>Active</Th>
                            <Th color={headerColor} borderColor={borderColor}>Remarks</Th>
                            <Th color={headerColor} borderColor={borderColor}>Created At</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {placementViolations.map((row) => (
                            <Tr
                              key={row.id}
                              _hover={{ bg: 'gray.50' }}
                              cursor="pointer"
                              onClick={() => navigate(`/placement/students/${row.usn}`)}
                            >
                              <Td borderColor={borderColor} fontWeight="medium">{row.usn}</Td>
                              <Td borderColor={borderColor}>
                                {row.placement_drive_id ? getDriveLabel(row) : '—'}
                              </Td>
                              <Td borderColor={borderColor}>{row.violation_type || '—'}</Td>
                              <Td borderColor={borderColor}>
                                <Badge
                                  colorScheme={
                                    row.penalty_type === 'PERMANENT_BAN' ? 'red' :
                                    row.penalty_type === 'TEMP_BAN' ? 'orange' : 'yellow'
                                  }
                                >
                                  {row.penalty_type}
                                  {row.penalty_days != null ? ` (${row.penalty_days}d)` : ''}
                                </Badge>
                              </Td>
                              <Td borderColor={borderColor}>
                                <Badge colorScheme={row.is_active ? 'green' : 'gray'}>
                                  {row.is_active ? 'Yes' : 'No'}
                                </Badge>
                              </Td>
                              <Td borderColor={borderColor} maxW="200px" isTruncated title={row.remarks}>
                                {row.remarks || '—'}
                              </Td>
                              <Td borderColor={borderColor}>{formatDate(row.created_at)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                  {!loadingViolations && placementViolations.length === 0 && (
                    <Text py={8} textAlign="center" color="gray.500">No placement violations found.</Text>
                  )}
                </Box>
              </TabPanel>

              {/* Tab 3: Disciplinary Records */}
              <TabPanel p={0}>
                <Flex justify="flex-end" mb={3}>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    size="sm"
                    onClick={() => handleOpenAddModal('disciplinary')}
                  >
                    Add Disciplinary Record
                  </Button>
                </Flex>
                <Box bg={cardBg} borderRadius="xl" boxShadow="sm" border="1px" borderColor="gray.200" overflow="hidden">
                  {loadingDisciplinary ? (
                    <Flex justify="center" py={12}>
                      <Spinner size="lg" />
                    </Flex>
                  ) : (
                    <TableContainer overflowX="auto">
                      <Table size="sm">
                        <Thead bg={headerBg}>
                          <Tr>
                            <Th color={headerColor} borderColor={borderColor}>USN</Th>
                            <Th color={headerColor} borderColor={borderColor}>Violation Type</Th>
                            <Th color={headerColor} borderColor={borderColor}>Severity</Th>
                            <Th color={headerColor} borderColor={borderColor}>Description</Th>
                            <Th color={headerColor} borderColor={borderColor}>Active</Th>
                            <Th color={headerColor} borderColor={borderColor}>Start</Th>
                            <Th color={headerColor} borderColor={borderColor}>End</Th>
                            <Th color={headerColor} borderColor={borderColor}>Created At</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {disciplinaryRecords.map((row) => (
                            <Tr
                              key={row.id}
                              _hover={{ bg: 'gray.50' }}
                              cursor="pointer"
                              onClick={() => navigate(`/placement/students/${row.usn}`)}
                            >
                              <Td borderColor={borderColor} fontWeight="medium">{row.usn}</Td>
                              <Td borderColor={borderColor}>{row.violation_type || '—'}</Td>
                              <Td borderColor={borderColor}>
                                <Badge
                                  colorScheme={
                                    row.severity === 'CRITICAL' ? 'red' :
                                    row.severity === 'MAJOR' ? 'orange' : 'yellow'
                                  }
                                >
                                  {row.severity}
                                </Badge>
                              </Td>
                              <Td borderColor={borderColor} maxW="200px" isTruncated title={row.description}>
                                {row.description || '—'}
                              </Td>
                              <Td borderColor={borderColor}>
                                <Badge colorScheme={row.is_active ? 'green' : 'gray'}>
                                  {row.is_active ? 'Yes' : 'No'}
                                </Badge>
                              </Td>
                              <Td borderColor={borderColor}>{formatDateOnly(row.start_date)}</Td>
                              <Td borderColor={borderColor}>{formatDateOnly(row.end_date)}</Td>
                              <Td borderColor={borderColor}>{formatDate(row.created_at)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                  {!loadingDisciplinary && disciplinaryRecords.length === 0 && (
                    <Text py={8} textAlign="center" color="gray.500">No disciplinary records found.</Text>
                  )}
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default Violations;
