import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  Input,
  useToast,
  HStack,
  Text,
  Button,
  Spinner,
  Flex,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Select,
  SimpleGrid,
  Checkbox,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { FaSync, FaLock, FaUnlock, FaFilter, FaUsers } from 'react-icons/fa';
import { PlacementService } from '../../services/placement.service';
import { StudentProfileService } from '../../services/studentProfile.service';

const SECTION_FIELDS = [
  { key: 'is_basic_info_locked', label: 'Basic' },
  { key: 'is_contacts_locked', label: 'Contact' },
  { key: 'is_profile_details_locked', label: 'Profile' },
  { key: 'is_social_links_locked', label: 'Social' },
  { key: 'is_parent_details_locked', label: 'Family' },
  { key: 'is_education_history_locked', label: 'Edu Hist' },
  { key: 'is_education_gaps_locked', label: 'Edu Gap' },
  { key: 'is_course_academics_locked', label: 'Courses' },
  { key: 'is_extra_curricular_locked', label: 'Extra' },
  { key: 'is_projects_locked', label: 'Projects' },
  { key: 'is_certifications_locked', label: 'Certs' },
  { key: 'is_internships_locked', label: 'Intern' },
  { key: 'is_trainings_locked', label: 'Train' },
  { key: 'is_other_experiences_locked', label: 'Other' },
  { key: 'is_publications_locked', label: 'Pubs' },
  { key: 'is_placements_locked', label: 'Placement' },
];

const SEM_FIELDS = Array.from({ length: 8 }, (_, i) => ({
  key: `is_sem${i + 1}_locked`,
  label: `Sem ${i + 1}`,
}));

const TABLE_SCROLL_MAX_H = 'calc(100vh - 260px)';

const stickyCornerTh = {
  position: 'sticky',
  left: 0,
  top: 0,
  zIndex: 4,
  bg: 'gray.50',
  borderRight: '1px solid',
  borderColor: 'gray.200',
  boxShadow: '2px 2px 4px -2px rgba(0,0,0,0.1)',
};

const stickyHeaderTh = {
  position: 'sticky',
  top: 0,
  zIndex: 3,
  bg: 'gray.50',
  borderBottom: '2px solid',
  borderColor: 'gray.200',
};

const stickyFirstColTd = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  bg: 'white',
  borderRight: '1px solid',
  borderColor: 'gray.200',
  boxShadow: '2px 0 4px -2px rgba(0,0,0,0.08)',
  'tr:hover &': { bg: 'gray.50' },
};

export default function ProfileLockPage() {
  const toast = useToast();
  
  // Individual Locks State
  const [rows, setRows] = useState([]);
  const [localOverrides, setLocalOverrides] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 25;

  // Batch Locks State
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [majors, setMajors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [minors, setMinors] = useState([]);
  
  const [batchFilters, setBatchFilters] = useState({
    school_id: '',
    program_id: '',
    year_of_joining: '',
    major_id: '',
    specialization_id: '',
    minor_id: ''
  });
  
  const [batchLocks, setBatchLocks] = useState({});
  const [batchCount, setBatchCount] = useState(0);
  const [counting, setCounting] = useState(false);
  const [batchApplying, setBatchApplying] = useState(false);

  // Load Initial Metadata
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [s, p, m, sp, mi] = await Promise.all([
          StudentProfileService.getSchools(),
          StudentProfileService.getPrograms(),
          StudentProfileService.getMajors(),
          StudentProfileService.getSpecializations(),
          StudentProfileService.getMinors()
        ]);
        setSchools(s);
        setPrograms(p);
        setMajors(m);
        setSpecializations(sp);
        setMinors(mi);
      } catch (e) {
        console.error('Metadata load failed', e);
      }
    };
    loadMetadata();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Individual Rows
  const loadIndividual = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getStudentProfileLocks({ 
        page, 
        limit, 
        search: debouncedSearch 
      });
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setTotalPages(data?.totalPages || 0);
      setTotal(data?.total || 0);
      setLocalOverrides({});
    } catch (e) {
      toast({ title: 'Load failed', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndividual();
  }, [page, debouncedSearch]);

  // Batch Count Update
  useEffect(() => {
    const fetchBatchCount = async () => {
      // Fetch count if any filter is set, or if we want to allow counting everyone
      setCounting(true);
      try {
        const count = await PlacementService.getBatchLockCount(batchFilters);
        setBatchCount(count);
      } catch (e) {
        console.error(e);
      } finally {
        setCounting(false);
      }
    };
    const timer = setTimeout(fetchBatchCount, 400);
    return () => clearTimeout(timer);
  }, [batchFilters]);

  const updateLock = async (usn, field, value) => {
    const key = `${usn}:${field}`;
    setLocalOverrides((prev) => ({ ...prev, [key]: value }));
    if (field === 'lock_reason') setSavingKey(key);

    try {
      await PlacementService.updateStudentProfileLocks(usn, { [field]: value });
      // Update the actual row in state so the view stays synced after saving
      setRows((prev) =>
        prev.map((r) => (r.usn === usn ? { ...r, [field]: value } : r))
      );
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e.message,
        status: 'error',
        duration: 3000,
      });
      // Revert on error
      setLocalOverrides((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } finally {
      if (field === 'lock_reason') setSavingKey(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await PlacementService.syncStudentProfileLocks();
      toast({ title: 'Sync completed', status: 'success' });
      loadIndividual();
    } catch (e) {
      toast({ title: 'Sync failed', status: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleBatchAction = async (isLock) => {
    if (batchCount === 0) return;
    
    const selectedFields = Object.keys(batchLocks).filter(k => k !== 'lock_reason' && batchLocks[k]);
    if (selectedFields.length === 0) {
      toast({ title: 'No fields selected', status: 'warning', description: 'Please select at least one field to lock/unlock.' });
      return;
    }

    setBatchApplying(true);
    try {
      const locksPayload = {};
      selectedFields.forEach(f => {
        locksPayload[f] = isLock;
      });
      
      if (isLock && batchLocks.lock_reason) {
        locksPayload.lock_reason = batchLocks.lock_reason;
      }

      const res = await PlacementService.batchUpdateProfileLocks(batchFilters, locksPayload);
      toast({
        title: `Batch ${isLock ? 'Lock' : 'Unlock'} Successful`,
        description: `Updated profile locks for ${res.updated} students.`,
        status: 'success',
        duration: 5000,
      });
      loadIndividual();
    } catch (e) {
      toast({ title: 'Batch update failed', status: 'error', description: e.message });
    } finally {
      setBatchApplying(false);
    }
  };

  const getDisplayChecked = (usn, field, row) => {
    const key = `${usn}:${field}`;
    if (localOverrides[key] !== undefined) return !!localOverrides[key];
    return !!row[field];
  };

  const filteredPrograms = useMemo(() => {
    if (!batchFilters.school_id) return programs;
    return programs.filter(p => String(p.school_id) === String(batchFilters.school_id));
  }, [programs, batchFilters.school_id]);

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="blue.700">Profile Lock Management</Heading>
        <Button leftIcon={<FaSync />} colorScheme="blue" onClick={handleSync} isLoading={syncing}>
          Sync Records
        </Button>
      </Flex>

      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab fontWeight="bold"><Icon as={FaUsers} mr={2}/> Individual Locks</Tab>
          <Tab fontWeight="bold"><Icon as={FaFilter} mr={2}/> Batch Lock</Tab>
        </TabList>

        <TabPanels>
          {/* INDIVIDUAL LOCKS PANEL */}
          <TabPanel px={0} pt={6}>
            <Box mb={4}>
              <Input
                placeholder="Search by USN, Name or Email..."
                maxW="400px"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
              />
            </Box>

            <Box
              bg="white"
              borderRadius="xl"
              shadow="sm"
              border="1px solid"
              borderColor="gray.200"
              maxH={TABLE_SCROLL_MAX_H}
              overflow="auto"
            >
              <Table
                size="sm"
                variant="simple"
                sx={{ borderCollapse: 'separate', borderSpacing: 0, minW: 'max-content' }}
              >
                <Thead bg="gray.50">
                  <Tr>
                    <Th sx={stickyCornerTh} whiteSpace="nowrap">USN</Th>
                    <Th sx={stickyHeaderTh} whiteSpace="nowrap">Name</Th>
                    <Th sx={stickyHeaderTh} whiteSpace="nowrap">Email</Th>
                    <Th sx={stickyHeaderTh} textAlign="center" whiteSpace="nowrap">Active</Th>
                    {SECTION_FIELDS.map((f) => (
                      <Th key={f.key} sx={stickyHeaderTh} textAlign="center" whiteSpace="nowrap">{f.label}</Th>
                    ))}
                    {SEM_FIELDS.map((f) => (
                      <Th key={f.key} sx={stickyHeaderTh} textAlign="center" whiteSpace="nowrap">{f.label}</Th>
                    ))}
                    <Th sx={stickyHeaderTh} whiteSpace="nowrap">By</Th>
                    <Th sx={stickyHeaderTh} whiteSpace="nowrap">Reason</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {loading && rows.length === 0 ? (
                    <Tr><Td colSpan={30} textAlign="center" py={10}><Spinner color="blue.500" /></Td></Tr>
                  ) : rows.length === 0 ? (
                    <Tr><Td colSpan={30} textAlign="center" py={10}>No students found.</Td></Tr>
                  ) : (
                    rows.map((r) => (
                      <Tr key={r.usn} _hover={{ bg: 'gray.50' }}>
                        <Td sx={stickyFirstColTd} fontWeight="bold" color="blue.600" whiteSpace="nowrap">{r.usn}</Td>
                        <Td whiteSpace="nowrap">{r.full_name}</Td>
                        <Td fontSize="xs">{r.college_email}</Td>
                        <Td textAlign="center">
                          <Switch colorScheme="green" isChecked={getDisplayChecked(r.usn, 'login_is_active', r)} onChange={(e) => updateLock(r.usn, 'login_is_active', e.target.checked)} />
                        </Td>
                        {SECTION_FIELDS.map((f) => (
                          <Td key={f.key} textAlign="center">
                            <Switch colorScheme="red" size="sm" isChecked={getDisplayChecked(r.usn, f.key, r)} onChange={(e) => updateLock(r.usn, f.key, e.target.checked)} />
                          </Td>
                        ))}
                        {SEM_FIELDS.map((f) => (
                          <Td key={f.key} textAlign="center">
                            <Switch colorScheme="red" size="sm" isChecked={getDisplayChecked(r.usn, f.key, r)} onChange={(e) => updateLock(r.usn, f.key, e.target.checked)} />
                          </Td>
                        ))}
                        <Td fontSize="xs" whiteSpace="nowrap">{r.locked_by_name || '-'}</Td>
                        <Td minW="150px">
                          <Input size="xs" variant="flushed" defaultValue={r.lock_reason || ''} onBlur={(e) => updateLock(r.usn, 'lock_reason', e.target.value)} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>

            {totalPages > 1 && (
              <Flex justify="center" mt={6} align="center" gap={4}>
                <Button size="sm" isDisabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Text fontSize="sm">Page {page} of {totalPages} ({total} total)</Text>
                <Button size="sm" isDisabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </Flex>
            )}
          </TabPanel>

          {/* BATCH LOCK PANEL */}
          <TabPanel px={0} pt={6}>
            <Box bg="white" p={6} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.200">
              <Heading size="sm" mb={4} display="flex" align="center" gap={2}>
                <Icon as={FaFilter} color="blue.500" /> 1. Select Target Students
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
                <FormControl>
                  <FormLabel fontSize="xs">School</FormLabel>
                  <Select size="sm" placeholder="All Schools" value={batchFilters.school_id} onChange={(e) => setBatchFilters({...batchFilters, school_id: e.target.value, program_id: ''})}>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Program</FormLabel>
                  <Select size="sm" placeholder="All Programs" value={batchFilters.program_id} onChange={(e) => setBatchFilters({...batchFilters, program_id: e.target.value})}>
                    {filteredPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Joining Year</FormLabel>
                  <Input size="sm" type="number" placeholder="e.g. 2022" value={batchFilters.year_of_joining} onChange={(e) => setBatchFilters({...batchFilters, year_of_joining: e.target.value})} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Major (Optional)</FormLabel>
                  <Select size="sm" placeholder="All Majors" value={batchFilters.major_id} onChange={(e) => setBatchFilters({...batchFilters, major_id: e.target.value})}>
                    {majors.filter(m => !batchFilters.program_id || String(m.program_id) === String(batchFilters.program_id)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Specialization (Optional)</FormLabel>
                  <Select size="sm" placeholder="All Specializations" value={batchFilters.specialization_id} onChange={(e) => setBatchFilters({...batchFilters, specialization_id: e.target.value})}>
                    {specializations.filter(s => !batchFilters.program_id || String(s.program_id) === String(batchFilters.program_id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs">Minor (Optional)</FormLabel>
                  <Select size="sm" placeholder="All Minors" value={batchFilters.minor_id} onChange={(e) => setBatchFilters({...batchFilters, minor_id: e.target.value})}>
                    {minors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <Flex bg="blue.50" p={4} borderRadius="lg" align="center" justify="space-between" mb={8}>
                <HStack spacing={4}>
                  <Icon as={FaUsers} color="blue.600" boxSize={5} />
                  <Box>
                    <Text fontWeight="bold" color="blue.800">Target Students Identified</Text>
                    <Text fontSize="sm" color="blue.600">These locks will apply to all students matching the filters above.</Text>
                  </Box>
                </HStack>
                <Box textAlign="right">
                  {counting ? <Spinner size="sm" /> : <Heading size="lg" color="blue.700">{batchCount}</Heading>}
                  <Text fontSize="xs" fontWeight="bold" color="blue.600">STUDENTS</Text>
                </Box>
              </Flex>

              <Divider mb={8} />

              <Heading size="sm" mb={4} display="flex" align="center" gap={2}>
                <Icon as={FaLock} color="red.500" /> 2. Set Lock Fields
              </Heading>

              <Box mb={8}>
                <Text fontSize="xs" fontWeight="bold" mb={3} color="gray.500" textTransform="uppercase">Profile Sections</Text>
                <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
                  {SECTION_FIELDS.map(f => (
                    <Checkbox 
                      key={f.key} 
                      colorScheme="red" 
                      isChecked={batchLocks[f.key] === true} 
                      onChange={(e) => setBatchLocks({...batchLocks, [f.key]: e.target.checked})}
                    >
                      <Text fontSize="sm">{f.label}</Text>
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </Box>

              <Box mb={8}>
                <Text fontSize="xs" fontWeight="bold" mb={3} color="gray.500" textTransform="uppercase">Semester Records</Text>
                <SimpleGrid columns={{ base: 4, md: 8 }} spacing={4}>
                  {SEM_FIELDS.map(f => (
                    <Checkbox 
                      key={f.key} 
                      colorScheme="red" 
                      isChecked={batchLocks[f.key] === true} 
                      onChange={(e) => setBatchLocks({...batchLocks, [f.key]: e.target.checked})}
                    >
                      <Text fontSize="sm">{f.label}</Text>
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </Box>

              <Box mb={8} maxW="500px">
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="bold">Lock Reason</FormLabel>
                  <Input placeholder="Reason for batch lock (optional)" value={batchLocks.lock_reason || ''} onChange={(e) => setBatchLocks({...batchLocks, lock_reason: e.target.value})} />
                </FormControl>
              </Box>

              <HStack spacing={4}>
                <Button 
                  colorScheme="red" 
                  size="lg" 
                  flex={1}
                  leftIcon={<FaLock />} 
                  isDisabled={batchCount === 0} 
                  isLoading={batchApplying}
                  onClick={() => handleBatchAction(true)}
                >
                  Lock Selected Sections ({batchCount})
                </Button>
                <Button 
                  colorScheme="green" 
                  size="lg" 
                  flex={1}
                  leftIcon={<FaUnlock />} 
                  isDisabled={batchCount === 0} 
                  isLoading={batchApplying}
                  onClick={() => handleBatchAction(false)}
                >
                  Unlock Selected Sections ({batchCount})
                </Button>
              </HStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
