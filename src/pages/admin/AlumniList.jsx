import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Card,
  CardBody,
  Flex,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useDisclosure,
  Container,
  Badge,
  Icon,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  Switch,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, ExternalLinkIcon, CopyIcon, EmailIcon } from '@chakra-ui/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';
import AlumniRegistrationCodes from './AlumniRegistrationCodes';

const AlumniList = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isConvertOpen, onOpen: onConvertOpen, onClose: onConvertClose } = useDisclosure();

  // Read initial values from URL query params
  const initialSchoolId = searchParams.get('school_id') || '';
  const initialProgramId = searchParams.get('program_id') || '';
  const initialTab = searchParams.get('tab');
  const [tabIndex, setTabIndex] = useState(initialTab === 'conversions' ? 2 : 0);
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversionsSchools, setConversionsSchools] = useState([]);
  const [conversionsPrograms, setConversionsPrograms] = useState([]);
  const [conversionsRows, setConversionsRows] = useState([]);
  const [conversionsSchoolId, setConversionsSchoolId] = useState(initialSchoolId);
  const [conversionsProgramId, setConversionsProgramId] = useState(initialProgramId);
  const [conversionsLoading, setConversionsLoading] = useState(false);
  const [conversionsFilterPersonalEmail, setConversionsFilterPersonalEmail] = useState(false);
  const [conversionsSelectedUsns, setConversionsSelectedUsns] = useState(new Set());
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertResult, setConvertResult] = useState(null);
  const [conversionLogs, setConversionLogs] = useState([]);
  const [conversionLogsLoading, setConversionLogsLoading] = useState(false);

  const [newAlumni, setNewAlumni] = useState({
    usn: '',
    full_name: '',
    graduation_year: '',
    institution_name: '',
    current_company: '',
    current_designation: '',
    current_work_location: '',
    personal_email: '',
    phone_number: '',
    linkedin: '',
    other_links: '',
  });

  useEffect(() => {
    fetchAlumni();
  }, []);

  // Auto-load conversions if URL params are present
  useEffect(() => {
    if (initialTab === 'conversions' && initialSchoolId && initialProgramId) {
      // Fetch meta first, then data will be fetched by another effect
      fetchConversionsMeta();
    }
  }, []);

  const handleTabsChange = (index) => {
    setTabIndex(index);
    // Update URL when changing tabs
    const next = new URLSearchParams(searchParams);
    if (index === 2) {
      next.set('tab', 'conversions');
    } else {
      next.delete('tab');
      next.delete('school_id');
      next.delete('program_id');
    }
    setSearchParams(next, { replace: true });
  };

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getAllAlumni();
      setAlumni(data);
    } catch (error) {
      toast({
        title: 'Error fetching alumni',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmails = () => {
    const emails = filteredAlumni
      .map((a) => a.personal_email)
      .filter(Boolean)
      .join(', ');
    if (!emails) {
      toast({ title: 'No emails to copy', status: 'info' });
      return;
    }
    navigator.clipboard.writeText(emails);
    toast({ title: 'Emails copied to clipboard', status: 'success' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAlumni((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAlumni = async () => {
    if (!newAlumni.full_name) {
      toast({ title: 'Full name is required', status: 'warning' });
      return;
    }
    try {
      await PlacementService.addAlumni(newAlumni);
      toast({ title: 'Alumni added successfully', status: 'success' });
      onClose();
      setNewAlumni({
        usn: '',
        full_name: '',
        graduation_year: '',
        institution_name: '',
        current_company: '',
        current_designation: '',
        current_work_location: '',
        personal_email: '',
        phone_number: '',
        linkedin: '',
        other_links: '',
      });
      fetchAlumni();
    } catch (error) {
      toast({ title: error.message || 'Error adding alumni', status: 'error' });
    }
  };

  const filteredAlumni = alumni.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.full_name?.toLowerCase().includes(q) ||
      (a.usn || a.student_id)?.toLowerCase().includes(q) ||
      a.current_company?.toLowerCase().includes(q)
    );
  });

  const linkId = (a) => a.student_id || a.usn || a.id;

  const fetchConversionsMeta = useCallback(async () => {
    try {
      const data = await PlacementService.getAlumniConversions();
      setConversionsSchools(data.schools || []);
      setConversionsPrograms(data.programs || []);
    } catch (e) {
      toast({ title: 'Error loading schools/programs', status: 'error' });
    }
  }, [toast]);

  const fetchConversionsData = useCallback(async () => {
    const sid = conversionsSchoolId && conversionsSchoolId !== '' ? conversionsSchoolId : null;
    const pid = conversionsProgramId && conversionsProgramId !== '' ? conversionsProgramId : null;
    if (sid == null || pid == null) {
      setConversionsRows([]);
      return;
    }
    setConversionsLoading(true);
    setConversionsSelectedUsns(new Set());
    try {
      const data = await PlacementService.getAlumniConversions({ school_id: sid, program_id: pid });
      setConversionsRows(data.rows || []);
      if (!conversionsSchools.length) setConversionsSchools(data.schools || []);
      if (!conversionsPrograms.length) setConversionsPrograms(data.programs || []);
    } catch (e) {
      toast({ title: 'Error loading conversions data', status: 'error' });
      setConversionsRows([]);
    } finally {
      setConversionsLoading(false);
    }
  }, [conversionsSchoolId, conversionsProgramId, toast, conversionsSchools.length, conversionsPrograms.length]);

  useEffect(() => {
    if (tabIndex === 2) fetchConversionsMeta();
  }, [tabIndex, fetchConversionsMeta]);

  const fetchConversionLogs = useCallback(async () => {
    setConversionLogsLoading(true);
    try {
      const logs = await PlacementService.getAlumniConversionLogs({ limit: 300 });
      setConversionLogs(logs || []);
    } catch (e) {
      toast({ title: 'Failed to load conversion logs', status: 'error' });
    } finally {
      setConversionLogsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (tabIndex === 3) fetchConversionLogs();
  }, [tabIndex, fetchConversionLogs]);

  useEffect(() => {
    if (tabIndex === 2 && (conversionsSchoolId || conversionsProgramId)) fetchConversionsData();
  }, [tabIndex, conversionsSchoolId, conversionsProgramId]);

  const conversionsProgramsFiltered = conversionsSchoolId
    ? (conversionsPrograms || []).filter((p) => String(p.school_id) === String(conversionsSchoolId))
    : (conversionsPrograms || []);

  const conversionsRowsFiltered = conversionsFilterPersonalEmail
    ? (conversionsRows || []).filter((r) => r.personal_email && String(r.personal_email).trim() !== '')
    : (conversionsRows || []);

  const conversionsSelectAll = conversionsRowsFiltered.length > 0 && conversionsRowsFiltered.every((r) => conversionsSelectedUsns.has(r.usn));
  const conversionsSelectSome = conversionsRowsFiltered.some((r) => conversionsSelectedUsns.has(r.usn));

  const toggleConversionsSelectAll = () => {
    if (conversionsSelectAll) {
      setConversionsSelectedUsns((prev) => {
        const next = new Set(prev);
        conversionsRowsFiltered.forEach((r) => next.delete(r.usn));
        return next;
      });
    } else {
      setConversionsSelectedUsns((prev) => {
        const next = new Set(prev);
        conversionsRowsFiltered.forEach((r) => next.add(r.usn));
        return next;
      });
    }
  };

  const toggleConversionsSelectOne = (usn) => {
    setConversionsSelectedUsns((prev) => {
      const next = new Set(prev);
      if (next.has(usn)) next.delete(usn);
      else next.add(usn);
      return next;
    });
  };

  const usnsToConvert = conversionsRowsFiltered.map((r) => r.usn).filter(Boolean);
  const rowsWithPersonalEmail = conversionsRowsFiltered.filter((r) => r.personal_email && String(r.personal_email).trim());
  const usnsWithPersonalEmail = rowsWithPersonalEmail.map((r) => r.usn);
  const usnsSelectedForConvert =
    conversionsSelectedUsns.size > 0
      ? usnsToConvert.filter((u) => conversionsSelectedUsns.has(u))
      : usnsToConvert;
  const usnsToSend = usnsSelectedForConvert.filter((u) => usnsWithPersonalEmail.includes(u));
  const hasSelectedWithoutEmail =
    usnsSelectedForConvert.length > 0 && usnsToSend.length < usnsSelectedForConvert.length;
  const showConvertButton = conversionsRows.length > 0;

  const handleConvertToAlumni = async () => {
    if (usnsToSend.length === 0) {
      toast({
        title: hasSelectedWithoutEmail ? 'Select only students with personal mail id' : 'Select students to convert',
        description: hasSelectedWithoutEmail ? 'Only students with a personal email can be converted to alumni.' : undefined,
        status: 'error',
        isClosable: true,
        duration: 5000,
      });
      return;
    }
    setConvertLoading(true);
    setConvertResult(null);
    try {
      const data = await PlacementService.convertToAlumni(usnsToSend);
      setConvertResult(data);
      if (data.converted > 0) {
        toast({ title: `${data.converted} converted to alumni`, status: 'success' });
        setConversionsSelectedUsns(new Set());
        fetchConversionsData();
      }
    } catch (e) {
      toast({ title: e.message || 'Convert failed', status: 'error' });
      setConvertResult({ total: 0, converted: 0, failed: usnsToSend.length, failed_list: [{ usn: '', error_message: e.message || 'Request failed' }] });
    } finally {
      setConvertLoading(false);
    }
  };

  const openConvertModal = () => {
    setConvertResult(null);
    if (hasSelectedWithoutEmail && usnsToSend.length === 0) {
      toast({
        title: 'Select only students with personal mail id',
        description: 'Only students with a personal email can be converted to alumni.',
        status: 'error',
        isClosable: true,
        duration: 5000,
      });
    }
    onConvertOpen();
  };
  const closeConvertModal = () => {
    setConvertResult(null);
    onConvertClose();
  };

  return (
    <AdminLayout>
      <Box bg="#f0f0f0" minH="100vh" pb={10}>
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} pt={8}>
          <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
              <Heading size="lg" color="gray.800">Alumni Network</Heading>
              <Text color="gray.500" fontSize="sm">Track and manage alumni</Text>
            </Box>
            <Button
              bg="#22c35e"
              color="white"
              _hover={{ bg: '#1da851' }}
              leftIcon={<AddIcon boxSize={3} />}
              onClick={onOpen}
              size="sm"
            >
              Add manually
            </Button>
          </Flex>

          <Tabs index={tabIndex} onChange={handleTabsChange} variant="enclosed" colorScheme="blue" bg="white" borderRadius="xl" shadow="sm" p={2}>
            <TabList mb={4}>
              <Tab fontWeight="bold">Current Alumni</Tab>
              <Tab fontWeight="bold">Manage Registrations</Tab>
              <Tab fontWeight="bold">Alumni Conversions</Tab>
              <Tab fontWeight="bold">Conversion logs</Tab>
            </TabList>

            <TabPanels>
              <TabPanel p={0}>
                <Flex mb={6} justify="space-between" align="center" gap={4} wrap="wrap">
                  <Box flex="1">
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search by name, USN, or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        bg="gray.50"
                        border="none"
                        _focus={{ bg: 'white', boxShadow: 'outline' }}
                      />
                    </InputGroup>
                  </Box>
                  <Button variant="outline" colorScheme="gray" leftIcon={<CopyIcon />} onClick={handleCopyEmails} size="md">
                    Copy emails
                  </Button>
                </Flex>

                {loading ? (
                  <Flex justify="center" py={10}><Spinner /></Flex>
                ) : (
                  <>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {filteredAlumni.map((alum) => (
                        <Card
                          key={alum.id}
                          bg="white"
                          boxShadow="sm"
                          borderRadius="xl"
                          cursor="pointer"
                          _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                          transition="all 0.2s"
                          onClick={() => navigate(`/placement/alumni/${linkId(alum)}`)}
                          borderWidth="1px"
                        >
                          <CardBody>
                            <Flex justify="space-between" align="start" mb={2}>
                              <Box>
                                <Text fontWeight="bold" fontSize="lg" color="gray.800">{alum.full_name}</Text>
                                <Text fontSize="sm" color="gray.500">{alum.usn || alum.student_id || '—'}</Text>
                              </Box>
                              {alum.graduation_year && <Badge colorScheme="blue" variant="subtle">{alum.graduation_year}</Badge>}
                            </Flex>
                            <Box mt={4}>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="wide">Current role</Text>
                              <Text fontSize="md" fontWeight="medium" color="#20343c">{alum.current_designation || 'N/A'}</Text>
                              <Text fontSize="sm" color="blue.600">{alum.current_company || 'N/A'}</Text>
                            </Box>
                            <Flex mt={3} align="center" gap={2}>
                              <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide">Profile / Data</Text>
                              <Badge size="sm" colorScheme={alum.profile_data_added ? 'green' : 'gray'} variant={alum.profile_data_added ? 'solid' : 'subtle'}>
                                {alum.profile_data_added ? 'Added' : 'Pending'}
                              </Badge>
                            </Flex>
                            <HStack mt={4} spacing={4} color="gray.400">
                              {alum.personal_email && <Icon as={EmailIcon} title={alum.personal_email} />}
                              {alum.linkedin && <Icon as={ExternalLinkIcon} title="LinkedIn" />}
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                    {filteredAlumni.length === 0 && (
                      <Box textAlign="center" py={10}>
                        <Text color="gray.500">No alumni found.</Text>
                      </Box>
                    )}
                  </>
                )}
              </TabPanel>

              <TabPanel p={0}>
                <AlumniRegistrationCodes />
              </TabPanel>

              <TabPanel p={0}>
                <Box mb={4}>
                  <HStack spacing={4} flexWrap="wrap" align="end">
                    <FormControl w="200px">
                      <FormLabel fontSize="sm">School</FormLabel>
                      <Select
                        placeholder="Select school"
                        value={conversionsSchoolId}
                        onChange={(e) => {
                          setConversionsSchoolId(e.target.value);
                          setConversionsProgramId('');
                        }}
                        size="sm"
                      >
                        {(conversionsSchools || []).map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl w="240px">
                      <FormLabel fontSize="sm">Program</FormLabel>
                      <Select
                        placeholder="Select program"
                        value={conversionsProgramId}
                        onChange={(e) => setConversionsProgramId(e.target.value)}
                        size="sm"
                      >
                        {conversionsProgramsFiltered.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <Button size="sm" colorScheme="blue" onClick={fetchConversionsData} isDisabled={!conversionsSchoolId || !conversionsProgramId}>
                      Load
                    </Button>
                    {!conversionsLoading && conversionsRows.length > 0 && (
                      <FormControl display="flex" alignItems="center" w="auto">
                        <FormLabel fontSize="sm" mb={0} whiteSpace="nowrap">Personal emails only</FormLabel>
                        <Switch
                          size="sm"
                          isChecked={conversionsFilterPersonalEmail}
                          onChange={(e) => setConversionsFilterPersonalEmail(e.target.checked)}
                        />
                      </FormControl>
                    )}
                  </HStack>
                </Box>
                {conversionsLoading ? (
                  <Flex justify="center" py={8}><Spinner /></Flex>
                ) : (
                  <TableContainer overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th px={2} w="40px">
                            <Checkbox
                              isChecked={conversionsSelectAll}
                              isIndeterminate={conversionsSelectSome && !conversionsSelectAll}
                              onChange={toggleConversionsSelectAll}
                              aria-label="Select all"
                            />
                          </Th>
                          <Th>USN</Th>
                          <Th>Name</Th>
                          <Th>RVU mail id</Th>
                          <Th>Personal mail id</Th>
                          <Th>Program</Th>
                          <Th>Year of joining</Th>
                          <Th>Program year</Th>
                          <Th>Opt in</Th>
                          <Th>Is placed</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {conversionsRowsFiltered.map((row) => (
                          <Tr key={row.usn}>
                            <Td px={2}>
                              <Checkbox
                                isChecked={conversionsSelectedUsns.has(row.usn)}
                                onChange={() => toggleConversionsSelectOne(row.usn)}
                                aria-label={`Select ${row.usn}`}
                              />
                            </Td>
                            <Td fontFamily="mono" fontSize="xs">{row.usn || '—'}</Td>
                            <Td fontWeight="medium">{row.full_name || '—'}</Td>
                            <Td fontSize="sm">{row.college_email || '—'}</Td>
                            <Td fontSize="sm">{row.personal_email || '—'}</Td>
                            <Td fontSize="sm">{row.program || '—'}</Td>
                            <Td>{row.year_of_joining ?? '—'}</Td>
                            <Td fontSize="sm">[{row.course_year_min ?? 0}-{row.course_year_max ?? 0}]</Td>
                            <Td>
                              <Badge colorScheme={row.opt_in ? 'green' : 'gray'} size="sm">{row.opt_in ? 'Yes' : 'No'}</Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={row.is_placed ? 'green' : 'gray'} size="sm">{row.is_placed ? 'Yes' : 'No'}</Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
                {!conversionsLoading && conversionsRows.length === 0 && (conversionsSchoolId && conversionsProgramId) && (
                  <Text color="gray.500" py={4}>No students found for this school and program.</Text>
                )}
                {!conversionsLoading && conversionsRows.length > 0 && conversionsRowsFiltered.length === 0 && conversionsFilterPersonalEmail && (
                  <Text color="gray.500" py={4}>No students with personal email in this list.</Text>
                )}
                {!conversionsLoading && conversionsRows.length === 0 && !conversionsSchoolId && (
                  <Text color="gray.500" py={4}>Select a school and program to view students.</Text>
                )}
                {showConvertButton && (
                  <Flex mt={4} justify="flex-end">
                    <Button size="md" colorScheme="green" onClick={openConvertModal}>
                      Convert to Alumni
                    </Button>
                  </Flex>
                )}
              </TabPanel>

              <TabPanel p={0}>
                <Box mb={4}>
                  <Text fontSize="sm" color="gray.600" mb={2}>Alumni conversion log (role change + alumni record creation).</Text>
                </Box>
                {conversionLogsLoading ? (
                  <Flex justify="center" py={8}><Spinner /></Flex>
                ) : (
                  <TableContainer overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th>#</Th>
                          <Th>Batch ID</Th>
                          <Th>USN</Th>
                          <Th>RVU email</Th>
                          <Th>Personal email</Th>
                          <Th>Alumni migrated</Th>
                          <Th>Role converted</Th>
                          <Th>Personal row created</Th>
                          <Th>Status</Th>
                          <Th>Error</Th>
                          <Th>Created</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {conversionLogs.map((log, i) => {
                          const migrated = log.status === 'success';
                          return (
                            <Tr key={log.id}>
                              <Td>{i + 1}</Td>
                              <Td fontFamily="mono" fontSize="xs">{String(log.batch_id || '').slice(0, 8)}…</Td>
                              <Td fontFamily="mono" fontSize="xs">{log.usn || '—'}</Td>
                              <Td fontSize="sm">{log.rvu_email || '—'}</Td>
                              <Td fontSize="sm">{log.personal_email || '—'}</Td>
                              <Td>
                                <Badge colorScheme={migrated ? 'green' : 'red'} variant={migrated ? 'solid' : 'subtle'} size="sm">
                                  {migrated ? 'Yes' : 'No'}
                                </Badge>
                              </Td>
                              <Td>{log.role_converted ? 'Yes' : 'No'}</Td>
                              <Td>{log.personal_mail_row_created ? 'Yes' : 'No'}</Td>
                              <Td><Badge colorScheme={log.status === 'success' ? 'green' : log.status === 'failed' ? 'red' : 'gray'} size="sm">{log.status}</Badge></Td>
                              <Td fontSize="xs" maxW="200px" isTruncated title={log.error_message}>{log.error_message || '—'}</Td>
                              <Td fontSize="xs">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
                {!conversionLogsLoading && conversionLogs.length === 0 && (
                  <Text color="gray.500" py={4}>No conversion logs yet.</Text>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Add new alumni (manual)</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Box as="form" id="add-alumni-form">
                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <FormControl>
                      <FormLabel>USN</FormLabel>
                      <Input name="usn" value={newAlumni.usn} onChange={handleInputChange} placeholder="1RVU..." />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Full name</FormLabel>
                      <Input name="full_name" value={newAlumni.full_name} onChange={handleInputChange} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mb={4}>
                    <FormLabel>Graduation year</FormLabel>
                    <Input name="graduation_year" type="number" value={newAlumni.graduation_year} onChange={handleInputChange} placeholder="e.g. 2024" />
                  </FormControl>
                  <FormControl mb={4}>
                    <FormLabel>Institution name</FormLabel>
                    <Input name="institution_name" value={newAlumni.institution_name} onChange={handleInputChange} placeholder="e.g. RV University" />
                  </FormControl>
                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <FormControl>
                      <FormLabel>Current company</FormLabel>
                      <Input name="current_company" value={newAlumni.current_company} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Designation</FormLabel>
                      <Input name="current_designation" value={newAlumni.current_designation} onChange={handleInputChange} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mb={4}>
                    <FormLabel>Work location</FormLabel>
                    <Input name="current_work_location" value={newAlumni.current_work_location} onChange={handleInputChange} />
                  </FormControl>
                  <SimpleGrid columns={2} spacing={4} mb={4}>
                    <FormControl>
                      <FormLabel>Personal email</FormLabel>
                      <Input name="personal_email" type="email" value={newAlumni.personal_email} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Phone number</FormLabel>
                      <Input name="phone_number" value={newAlumni.phone_number} onChange={handleInputChange} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mb={4}>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <Input name="linkedin" value={newAlumni.linkedin} onChange={handleInputChange} placeholder="https://..." />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Other links</FormLabel>
                    <Input name="other_links" value={newAlumni.other_links} onChange={handleInputChange} placeholder="Portfolio, etc." />
                  </FormControl>
                </Box>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                <Button colorScheme="green" bg="#22c35e" onClick={handleAddAlumni}>Save alumni</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isConvertOpen} onClose={closeConvertModal} size="lg" isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Convert to Alumni</ModalHeader>
              <ModalCloseButton isDisabled={convertLoading} />
              <ModalBody>
                {!convertResult ? (
                  <>
                    <Text mb={4}>
                      {usnsToSend.length === 0
                        ? (hasSelectedWithoutEmail ? 'Select only students with personal mail id. Only students with a personal email can be converted to alumni.' : 'Select students to convert.')
                        : `Convert ${usnsToSend.length} student(s) to alumni? Their RVU login will be set to alumni role and their details will be added to the alumni table. Failed conversions will be reverted automatically.`}
                    </Text>
                    {convertLoading && (
                      <Flex align="center" gap={3} py={2}>
                        <Spinner size="sm" />
                        <Text>Converting…</Text>
                      </Flex>
                    )}
                  </>
                ) : (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Conversion complete: {convertResult.success_rate_pct ?? 0}% success
                    </Text>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      {convertResult.converted} converted, {convertResult.failed} failed (reverted to student).
                    </Text>
                    {convertResult.failed_list && convertResult.failed_list.length > 0 && (
                      <Box mt={3}>
                        <Text fontSize="sm" fontWeight="semibold" mb={2}>Failed (reverted to student):</Text>
                        <Box as="ul" pl={4} fontSize="sm" maxH="200px" overflowY="auto">
                          {convertResult.failed_list.map((f, i) => (
                            <Box as="li" key={i} mb={1}>
                              <Badge fontFamily="mono" mr={2}>{f.usn}</Badge>
                              {f.error_message}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </ModalBody>
              <ModalFooter>
                {!convertResult ? (
                  <>
                    <Button variant="ghost" onClick={closeConvertModal} isDisabled={convertLoading}>Cancel</Button>
                    <Button colorScheme="green" onClick={handleConvertToAlumni} isLoading={convertLoading} isDisabled={usnsToSend.length === 0}>
                      Convert
                    </Button>
                  </>
                ) : (
                  <Button onClick={closeConvertModal}>Close</Button>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default AlumniList;
