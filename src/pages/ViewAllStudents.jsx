import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Spinner,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Button,
  Flex,
  Wrap,
  WrapItem,
  Avatar,
  IconButton,
  useBreakpointValue,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Checkbox,
  CheckboxGroup,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Tooltip,
} from '@chakra-ui/react';
import { SearchIcon, ViewIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, AddIcon, DownloadIcon, AttachmentIcon } from '@chakra-ui/icons';
import { MdViewColumn } from 'react-icons/md';
import './ViewAllStudents.css';
import { StudentProfileService } from '../services/studentProfile.service';
import { PlacementService } from '../services/placement.service';
import { getFileUrl } from '../utils/fileUrl';
import { useBackgroundRefresh } from '../hooks/useBackgroundRefresh';

// Display columns for View All Students table — categorized, user can select which to show
const VIEW_STUDENTS_COLUMNS = {
  basic: [
    { id: 'student', label: 'Student' },
    { id: 'usn', label: 'USN' },
    { id: 'full_name', label: 'Full name' },
    { id: 'college_email', label: 'Email' },
    { id: 'school', label: 'School' },
    { id: 'program', label: 'Program' },
    { id: 'year_of_joining', label: 'Year of joining' },
    { id: 'current_year', label: 'Current year' },
    { id: 'current_semester', label: 'Current semester' },
  ],
  academic: [
    { id: 'section', label: 'Section' },
    { id: 'major', label: 'Major' },
    { id: 'minor', label: 'Minor' },
    { id: 'specialization', label: 'Specialization' },
  ],
  other: [
    { id: 'is_active', label: 'Status' },
    { id: 'is_registered', label: 'Is registered' },
    { id: 'created_at', label: 'Created at' },
  ],
};
const VIEW_STUDENTS_DEFAULT_VISIBLE = ['student', 'usn', 'college_email', 'school', 'program', 'year_of_joining', 'is_active'];

// student_basic_details columns for Add Students — admin selects which to include (categorized, no highlight)
const ADD_STUDENTS_COLUMNS = {
  basic: [
    { key: 'usn', label: 'usn', description: 'Primary key, unique' },
    { key: 'full_name', label: 'full_name', description: 'Student full name' },
    { key: 'college_email', label: 'college_email', description: 'College email, unique' },
    { key: 'school_id', label: 'school_id', description: 'FK → schools.id (use IDs from Manage Academic)' },
    { key: 'program_id', label: 'program_id', description: 'FK → programs.id' },
    { key: 'year_of_joining', label: 'year_of_joining', description: 'Year of joining' },
  ],
  contact: [
    { key: 'personal_email', label: 'personal_email', description: 'Personal email' },
    { key: 'phone_country_code', label: 'phone_country_code', description: 'e.g. +91' },
    { key: 'phone_number', label: 'phone_number', description: '7–15 digits' },
  ],
  academic: [
    { key: 'specialization_id', label: 'specialization_id', description: 'FK → specializations.id' },
    { key: 'major_id', label: 'major_id', description: 'FK → majors.id' },
    { key: 'minor_id', label: 'minor_id', description: 'FK → minors.id' },
    { key: 'section', label: 'section', description: 'Section' },
  ],
  personal: [
    { key: 'gender', label: 'gender', description: 'Gender' },
    { key: 'date_of_birth', label: 'date_of_birth', description: 'Date of birth' },
    { key: 'blood_group', label: 'blood_group', description: 'Blood group' },
    { key: 'languages', label: 'languages', description: 'Languages' },
    { key: 'specially_abled', label: 'specially_abled', description: 'Boolean' },
  ],
};

function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
        if (json.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }
        const headers = (json[0] || []).map((h) => String(h || '').trim());
        const rows = [];
        for (let i = 1; i < json.length; i++) {
          const values = json[i] || [];
          const obj = {};
          headers.forEach((h, j) => {
            obj[h] = values[j] !== undefined ? String(values[j] ?? '').trim() : '';
          });
          rows.push(obj);
        }
        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function normalizeHeader(h) {
  return String(h || '').toLowerCase().replace(/\s+/g, '_').trim();
}

function mapRowToSelectedColumns(row, fileHeaders, selectedColumns) {
  const keyMap = {};
  fileHeaders.forEach((h) => {
    keyMap[normalizeHeader(h)] = h;
  });
  const out = {};
  selectedColumns.forEach((col) => {
    const key = keyMap[col] || keyMap[col.replace(/_/g, ' ')];
    const raw = key !== undefined ? row[key] : row[col];
    out[col] = raw != null ? String(raw).trim() : '';
  });
  return out;
}

function getTestDataRow(selectedColumns, rowIndex) {
  const samples = {
    usn: `TEST${String(rowIndex).padStart(3, '0')}_24`,
    full_name: `Test Student ${rowIndex}`,
    college_email: `test${rowIndex}@college.edu`,
    personal_email: `test${rowIndex}@personal.com`,
    phone_country_code: '+91',
    phone_number: '9876543210',
    school_id: 1,
    program_id: 1,
    specialization_id: 1,
    major_id: 1,
    minor_id: 1,
    year_of_joining: 2024,
    section: 'A',
    gender: 'Male',
    date_of_birth: '2002-01-15',
    blood_group: 'O+',
    languages: 'English, Hindi',
    specially_abled: false,
  };
  const row = {};
  selectedColumns.forEach((col) => {
    row[col] = samples[col] !== undefined ? samples[col] : '';
  });
  return row;
}

function validateImportRows(rows, requiredKeys) {
  const typeErrors = [];
  const validRows = [];
  const numericKeys = ['school_id', 'program_id', 'year_of_joining', 'major_id', 'minor_id', 'specialization_id'];
  const boolKeys = ['specially_abled'];
  rows.forEach((r, idx) => {
    const rowNum = idx + 2;
    const missing = requiredKeys.filter((k) => !r[k] || String(r[k]).trim() === '');
    if (missing.length) {
      typeErrors.push({ row: rowNum, message: `Missing required: ${missing.join(', ')}` });
      return;
    }
    let ok = true;
    numericKeys.forEach((k) => {
      if (r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== '') {
        const n = parseInt(String(r[k]).trim(), 10);
        if (Number.isNaN(n)) {
          typeErrors.push({ row: rowNum, col: k, message: `Invalid number: ${k}` });
          ok = false;
        }
      }
    });
    boolKeys.forEach((k) => {
      if (r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== '') {
        const v = String(r[k]).toLowerCase();
        if (v !== 'true' && v !== 'false' && v !== '1' && v !== '0') {
          typeErrors.push({ row: rowNum, col: k, message: `Invalid boolean: ${k}` });
          ok = false;
        }
      }
    });
    if (ok) validRows.push(r);
  });
  return { validRows, typeErrors };
}

// Placement Overview tab: table by school / program / year with batch strength and salary stats (exported for PlacementOverviewPage)
export const PlacementOverviewTab = ({ rows, salaryStats, academicYears, selectedYear, onYearChange, loading }) => {
  const headerRowBg = '#fbeec8';
  const border = '#c2b38a';
  const palette = ['#e8f5e9', '#e3f2fd', '#fff8e1', '#e0f7fa', '#f1f8e9', '#ede7f6', '#fff3e0'];
  const sortedRows = [...(rows || [])].sort((a, b) => {
    const sc = (a.school || '').localeCompare(b.school || '');
    if (sc !== 0) return sc;
    const cc = (a.course || '').localeCompare(b.course || '');
    if (cc !== 0) return cc;
    return (a.currentYear || 0) - (b.currentYear || 0);
  });
  const schoolColors = {};
  const schoolRowCounts = {};
  sortedRows.forEach((row, i) => {
    const key = row.school || 'Unknown';
    schoolRowCounts[key] = (schoolRowCounts[key] || 0) + 1;
    if (!schoolColors[key]) schoolColors[key] = palette[Object.keys(schoolColors).length % palette.length];
  });
  const getRowBg = (school) => schoolColors[school || 'Unknown'] || '#e9f4dd';

  return (
    <Box>
      <Flex justify="flex-end" mb={4} align="center" gap={3}>
        <HStack>
          <Text fontSize="sm" fontWeight="bold" color="gray.600">Academic Year:</Text>
          <Select size="sm" w="150px" value={selectedYear} onChange={(e) => onYearChange(e.target.value)} bg="white" borderColor="gray.300" isDisabled={loading}>
            <option value="">All Years</option>
            {(academicYears || []).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
        </HStack>
        {loading && <Spinner size="sm" color="blue.500" />}
      </Flex>
      <Box bg="white" shadow="sm" border="1px" borderColor={border} overflowX="auto">
        <Table size="sm" borderWidth="1px" borderColor={border}>
          <Thead>
            <Tr bg={headerRowBg}>
              <Th fontSize="xs" textTransform="none" borderColor={border} textAlign="center">School</Th>
              <Th fontSize="xs" textTransform="none" borderColor={border} textAlign="center">Course</Th>
              <Th fontSize="xs" textTransform="none" borderColor={border} textAlign="center">Current Year</Th>
              <Th fontSize="xs" textTransform="none" borderColor={border} textAlign="center">Batch Strength</Th>
              <Th fontSize="xs" textTransform="none" borderColor={border} textAlign="center">Mode</Th>
              <Th fontSize="xs" textTransform="none" borderColor={border} textAlign="center">Salary Range (LPA)</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedRows.map((row, index) => {
              const key = row.school || 'Unknown';
              const isFirstOfSchool = index === 0 || (sortedRows[index - 1].school || 'Unknown') !== key;
              const stats = (salaryStats && salaryStats[key]) || { max: 0, min: 0, avg: 0, median: 0, paidInternships: 0 };
              return (
                <Tr key={`${row.school}-${row.course}-${row.currentYear}-${index}`} bg={getRowBg(row.school)}>
                  <Td fontSize="sm" fontWeight="bold" textAlign="center" borderColor={border}>{row.school}</Td>
                  <Td fontSize="sm" textAlign="center" borderColor={border}>{row.course}</Td>
                  <Td fontSize="sm" textAlign="center" borderColor={border}>{row.currentYearLabel}</Td>
                  <Td fontSize="sm" textAlign="center" borderColor={border}>{row.batchStrength}</Td>
                  <Td fontSize="sm" textAlign="center" borderColor={border}>{row.mode}</Td>
                  {isFirstOfSchool && (
                    <Td rowSpan={schoolRowCounts[key]} fontSize="sm" borderColor={border} textAlign="center" verticalAlign="middle" p={4}>
                      <SimpleGrid columns={2} spacingY={2} spacingX={4} textAlign="left" minW="140px">
                        <Box><Text fontSize="xs" color="gray.500">Max</Text><Text fontWeight="bold" fontSize="md" color="green.600">{stats.max} LPA</Text></Box>
                        <Box><Text fontSize="xs" color="gray.500">Avg</Text><Text fontWeight="bold" fontSize="md" color="blue.600">{stats.avg} LPA</Text></Box>
                        <Box><Text fontSize="xs" color="gray.500">Median</Text><Text fontWeight="bold" fontSize="md" color="purple.600">{stats.median} LPA</Text></Box>
                        <Box><Text fontSize="xs" color="gray.500">Min</Text><Text fontWeight="bold" fontSize="md" color="orange.600">{stats.min} LPA</Text></Box>
                        <Box gridColumn="span 2" borderTop="1px dashed" borderColor="gray.200" pt={2}>
                          <HStack justify="space-between"><Text fontSize="xs" color="gray.500">Paid Internships</Text><Badge colorScheme="teal">{stats.paidInternships}</Badge></HStack>
                        </Box>
                      </SimpleGrid>
                    </Td>
                  )}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
      {sortedRows.length === 0 && (
        <Box bg="white" p={8} borderRadius="lg" shadow="sm" textAlign="center">
          <Text color="gray.500">No placement overview data. Student and school data will populate this view.</Text>
        </Box>
      )}
    </Box>
  );
};

// Placement eligibility track: batch policies (exported for StudentEligibilityPage)
export const StudentEligibilityTab = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modifiedPolicies, setModifiedPolicies] = useState({});
  const [filters, setFilters] = useState({ year: '', school: '' });
  
  // Confirmation modal state
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0, results: [], saving: false });

  const fetchData = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    try {
      if (!silent) setLoading(true);
      const data = await PlacementService.getAllPolicies();
      setPolicies(Array.isArray(data) ? data : []);
      if (!silent) setModifiedPolicies({});
    } catch (e) {
      if (!silent) toast({ title: 'Error fetching policies', status: 'error' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useBackgroundRefresh(fetchData);

  const handleSyncPolicies = async () => {
    try {
      setLoading(true);
      const res = await PlacementService.syncPolicies();
      toast({ title: 'Sync successful', description: res.message, status: 'success' });
      fetchData();
    } catch (e) {
      toast({ title: 'Sync failed', description: e?.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePolicy = (policy, field) => {
    const updated = { ...policy, [field]: !policy[field] };
    setPolicies((prev) => prev.map((p) => (p.id === policy.id ? updated : p)));
    setModifiedPolicies((prev) => ({ ...prev, [policy.id]: updated }));
  };

  // Get changes summary for a policy
  const getPolicyChanges = (policy) => {
    const original = policies.find(p => p.id === policy.id);
    if (!original) return [];
    const changes = [];
    if (original.summer_immersion !== policy.summer_immersion) {
      changes.push({ field: 'Immersion', from: original.summer_immersion, to: policy.summer_immersion });
    }
    if (original.summer_internship !== policy.summer_internship) {
      changes.push({ field: 'Internship', from: original.summer_internship, to: policy.summer_internship });
    }
    if (original.capstone !== policy.capstone) {
      changes.push({ field: 'Capstone', from: original.capstone, to: policy.capstone });
    }
    if (original.placement !== policy.placement) {
      changes.push({ field: 'Placement', from: original.placement, to: policy.placement });
    }
    return changes;
  };

  const handleSaveClick = () => {
    const updates = Object.values(modifiedPolicies);
    if (updates.length === 0) {
      toast({ title: 'No changes to save', status: 'info' });
      return;
    }
    // Open confirmation modal
    setSaveProgress({ current: 0, total: updates.length, results: [], saving: false });
    onConfirmOpen();
  };

  const handleConfirmSave = async () => {
    const updates = Object.values(modifiedPolicies);
    setSaveProgress({ current: 0, total: updates.length, results: [], saving: true });
    
    const results = [];
    for (let i = 0; i < updates.length; i++) {
      const policy = updates[i];
      try {
        const response = await PlacementService.upsertPolicy(policy);
        results.push({
          policy,
          success: true,
          studentsUpdated: response.students_updated || 0
        });
      } catch (err) {
        results.push({
          policy,
          success: false,
          error: err?.message || 'Failed'
        });
      }
      setSaveProgress(prev => ({ ...prev, current: i + 1, results: [...results] }));
    }
    
    setSaveProgress(prev => ({ ...prev, saving: false }));
    
    const totalStudents = results.reduce((sum, r) => sum + (r.studentsUpdated || 0), 0);
    const successCount = results.filter(r => r.success).length;
    
    if (successCount === updates.length) {
      toast({ 
        title: 'All changes saved successfully', 
        description: `Updated eligibility for ${totalStudents} students across ${successCount} batches`,
        status: 'success',
        duration: 5000
      });
      setModifiedPolicies({});
      fetchData({ silent: true });
    } else {
      toast({ 
        title: 'Some changes failed', 
        description: `${successCount}/${updates.length} batches updated`,
        status: 'warning' 
      });
    }
  };

  const handleCloseConfirm = () => {
    if (!saveProgress.saving) {
      onConfirmClose();
      if (saveProgress.results.length > 0) {
        fetchData({ silent: true });
      }
    }
  };

  const uniqueYears = [...new Set(policies.map((p) => p.joining_year))].sort((a, b) => b - a);
  const uniqueSchools = [...new Set(policies.map((p) => p.school_name).filter(Boolean))].sort();
  const filteredPolicies = policies.filter((p) => {
    return (!filters.year || p.joining_year.toString() === filters.year) && (!filters.school || p.school_name === filters.school);
  });
  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    const schoolA = (a.school_name || '').localeCompare(b.school_name || '');
    if (schoolA !== 0) return schoolA;
    const programA = (a.program_name || '').localeCompare(b.program_name || '');
    if (programA !== 0) return programA;
    return (a.joining_year || 0) - (b.joining_year || 0);
  });
  const colors = ['#E3F2FD', '#E8F5E9', '#F3E5F5', '#FFF3E0', '#FFEBEE', '#E0F2F1', '#E0F7FA', '#FCE4EC', '#F1F8E9', '#FFF8E1'];
  const getSchoolColor = (name) => {
    if (!name) return 'white';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box p={4} bg="white" borderRadius="xl" shadow="sm" border="1px" borderColor="gray.100">
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={2}>
        <Heading size="md">Placement eligibility track</Heading>
        <HStack>
          <Select w="150px" value={filters.year} onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}>
            {uniqueYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Select placeholder="Filter School" w="200px" value={filters.school} onChange={(e) => setFilters((p) => ({ ...p, school: e.target.value }))}>
            {uniqueSchools.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Button colorScheme="purple" size="sm" onClick={handleSyncPolicies} isLoading={loading}>Sync All Programs</Button>
        </HStack>
      </HStack>
      {loading && policies.length === 0 ? (
        <Flex justify="center" py={8}><Spinner /></Flex>
      ) : (
        <>
          <TableContainer overflowX="auto" mb={4}>
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>School</Th>
                  <Th>Program</Th>
                  <Th>Joining Year</Th>
                  <Th textAlign="center">Immersion</Th>
                  <Th textAlign="center">Internship</Th>
                  <Th textAlign="center">Capstone</Th>
                  <Th textAlign="center">Placement</Th>
                  <Th textAlign="center">Alumni conversion %</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedPolicies.map((policy) => (
                  <Tr key={policy.id} bg={getSchoolColor(policy.school_name)}>
                    <Td>{policy.school_name || '—'}</Td>
                    <Td>{policy.program_name || '—'}</Td>
                    <Td>{policy.joining_year}</Td>
                    <Td textAlign="center">
                      <Button size="xs" colorScheme={policy.summer_immersion ? 'green' : 'red'} onClick={() => handleTogglePolicy(policy, 'summer_immersion')} variant="solid" w="60px">{policy.summer_immersion ? 'Yes' : 'No'}</Button>
                    </Td>
                    <Td textAlign="center">
                      <Button size="xs" colorScheme={policy.summer_internship ? 'green' : 'red'} onClick={() => handleTogglePolicy(policy, 'summer_internship')} variant="solid" w="60px">{policy.summer_internship ? 'Yes' : 'No'}</Button>
                    </Td>
                    <Td textAlign="center">
                      <Button size="xs" colorScheme={policy.capstone ? 'green' : 'red'} onClick={() => handleTogglePolicy(policy, 'capstone')} variant="solid" w="60px">{policy.capstone ? 'Yes' : 'No'}</Button>
                    </Td>
                    <Td textAlign="center">
                      <Button size="xs" colorScheme={policy.placement ? 'green' : 'red'} onClick={() => handleTogglePolicy(policy, 'placement')} variant="solid" w="60px">{policy.placement ? 'Yes' : 'No'}</Button>
                    </Td>
                    <Td textAlign="center">
                      <Tooltip 
                        label={`${policy.alumni_count || 0} of ${policy.student_count || 0} students converted — Click to manage`}
                        hasArrow
                        placement="top"
                      >
                        <Box 
                          position="relative" 
                          w="120px" 
                          h="32px" 
                          borderRadius="md" 
                          overflow="hidden"
                          bg="#1a7a6c"
                          cursor="pointer"
                          mx="auto"
                          onClick={() => navigate(`/placement/alumni?tab=conversions&school_id=${policy.school_id}&program_id=${policy.program_id}`)}
                          _hover={{ transform: 'scale(1.05)', boxShadow: 'md' }}
                          transition="all 0.2s"
                        >
                          <Box
                            position="absolute"
                            top={0}
                            left={0}
                            h="100%"
                            w={`${Math.min(100, typeof policy.alumni_conversion_pct === 'number' ? policy.alumni_conversion_pct : 0)}%`}
                            bg="#2a9d8f"
                            transition="width 0.3s ease"
                          />
                          <Flex
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            bottom={0}
                            align="center"
                            justify="center"
                          >
                            <Text 
                              fontWeight="600" 
                              fontSize="sm" 
                              color="white"
                              textShadow="0 1px 2px rgba(0,0,0,0.2)"
                            >
                              {typeof policy.alumni_conversion_pct === 'number' ? `${policy.alumni_conversion_pct}%` : '0%'}
                            </Text>
                          </Flex>
                        </Box>
                      </Tooltip>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          <Flex justify="flex-end">
            <Button colorScheme="blue" size="md" onClick={handleSaveClick} isDisabled={Object.keys(modifiedPolicies).length === 0} isLoading={loading}>Save Changes</Button>
          </Flex>
        </>
      )}
      {!loading && policies.length === 0 && (
        <Text color="gray.500" py={4}>No policies yet. Use &quot;Sync All Programs&quot; to create policies from schools and programs.</Text>
      )}

      {/* Confirmation Modal with Live Progress */}
      <Modal isOpen={isConfirmOpen} onClose={handleCloseConfirm} size="xl" closeOnOverlayClick={!saveProgress.saving}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {saveProgress.saving ? 'Updating Student Eligibility...' : saveProgress.results.length > 0 ? 'Update Complete' : 'Confirm Changes'}
          </ModalHeader>
          {!saveProgress.saving && <ModalCloseButton />}
          <ModalBody>
            {/* Before saving - show preview */}
            {!saveProgress.saving && saveProgress.results.length === 0 && (
              <>
                <Alert status="info" mb={4} borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>You are about to update {Object.keys(modifiedPolicies).length} batch(es)</AlertTitle>
                    <AlertDescription>
                      This will update eligibility flags for all students in the selected batches.
                    </AlertDescription>
                  </Box>
                </Alert>
                <Box maxH="300px" overflowY="auto">
                  {Object.values(modifiedPolicies).map((policy) => {
                    const changes = getPolicyChanges(policy);
                    return (
                      <Box key={policy.id} p={3} mb={2} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="600" fontSize="sm">
                            {policy.school_name} - {policy.program_name} ({policy.joining_year})
                          </Text>
                          <Badge colorScheme="blue">{policy.student_count || 0} students</Badge>
                        </HStack>
                        <Wrap spacing={2}>
                          {changes.map((c, idx) => (
                            <WrapItem key={idx}>
                              <Badge colorScheme={c.to ? 'green' : 'red'} fontSize="xs">
                                {c.field}: {c.from ? 'ON' : 'OFF'} → {c.to ? 'ON' : 'OFF'}
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}

            {/* During saving - show progress */}
            {saveProgress.saving && (
              <>
                <Box mb={4}>
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="500">Processing batches...</Text>
                    <Text fontSize="sm" color="gray.600">{saveProgress.current} / {saveProgress.total}</Text>
                  </HStack>
                  <Progress 
                    value={(saveProgress.current / saveProgress.total) * 100} 
                    size="lg" 
                    colorScheme="blue" 
                    borderRadius="md"
                    hasStripe
                    isAnimated
                  />
                </Box>
                <Box maxH="250px" overflowY="auto">
                  {saveProgress.results.map((result, idx) => (
                    <HStack key={idx} p={2} bg={result.success ? 'green.50' : 'red.50'} borderRadius="md" mb={2}>
                      <Icon 
                        viewBox="0 0 24 24" 
                        color={result.success ? 'green.500' : 'red.500'}
                        boxSize={5}
                      >
                        {result.success ? (
                          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        ) : (
                          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        )}
                      </Icon>
                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight="500">
                          {result.policy.school_name} - {result.policy.program_name} ({result.policy.joining_year})
                        </Text>
                        {result.success && (
                          <Text fontSize="xs" color="green.600">{result.studentsUpdated} students updated</Text>
                        )}
                        {!result.success && (
                          <Text fontSize="xs" color="red.600">{result.error}</Text>
                        )}
                      </Box>
                    </HStack>
                  ))}
                </Box>
              </>
            )}

            {/* After saving - show results */}
            {!saveProgress.saving && saveProgress.results.length > 0 && (
              <>
                <Alert 
                  status={saveProgress.results.every(r => r.success) ? 'success' : 'warning'} 
                  mb={4} 
                  borderRadius="md"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle>
                      {saveProgress.results.filter(r => r.success).length} / {saveProgress.results.length} batches updated
                    </AlertTitle>
                    <AlertDescription>
                      Total students affected: {saveProgress.results.reduce((sum, r) => sum + (r.studentsUpdated || 0), 0)}
                    </AlertDescription>
                  </Box>
                </Alert>
                <Box maxH="250px" overflowY="auto">
                  {saveProgress.results.map((result, idx) => (
                    <HStack key={idx} p={2} bg={result.success ? 'green.50' : 'red.50'} borderRadius="md" mb={2}>
                      <Icon 
                        viewBox="0 0 24 24" 
                        color={result.success ? 'green.500' : 'red.500'}
                        boxSize={5}
                      >
                        {result.success ? (
                          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        ) : (
                          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        )}
                      </Icon>
                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight="500">
                          {result.policy.school_name} - {result.policy.program_name} ({result.policy.joining_year})
                        </Text>
                        {result.success && (
                          <Text fontSize="xs" color="green.600">{result.studentsUpdated} students updated</Text>
                        )}
                        {!result.success && (
                          <Text fontSize="xs" color="red.600">{result.error}</Text>
                        )}
                      </Box>
                    </HStack>
                  ))}
                </Box>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            {/* Before saving */}
            {!saveProgress.saving && saveProgress.results.length === 0 && (
              <>
                <Button variant="ghost" mr={3} onClick={handleCloseConfirm}>Cancel</Button>
                <Button colorScheme="blue" onClick={handleConfirmSave}>
                  Confirm & Update Students
                </Button>
              </>
            )}
            {/* After saving */}
            {!saveProgress.saving && saveProgress.results.length > 0 && (
              <Button colorScheme="blue" onClick={handleCloseConfirm}>Done</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Individual Student Eligibility Tab - manage eligibility for individual students
export const IndividualStudentEligibilityTab = () => {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ school_id: '', program_id: '', search: '' });
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedUsns, setSelectedUsns] = useState(new Set());
  const [updating, setUpdating] = useState({});
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure();
  const [bulkEligibility, setBulkEligibility] = useState({
    is_summer_immersion_eligible: false,
    is_summer_internship_eligible: false,
    is_capstone_eligible: false,
    is_placement_eligible: false
  });
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  // Fetch schools and programs
  useEffect(() => {
    (async () => {
      try {
        const [schoolsData, programsData] = await Promise.all([
          StudentProfileService.getSchools(),
          StudentProfileService.getPrograms()
        ]);
        setSchools(Array.isArray(schoolsData) ? schoolsData : []);
        setPrograms(Array.isArray(programsData) ? programsData : []);
      } catch (e) {
        console.error('Error fetching filters:', e);
      }
    })();
  }, []);

  // Fetch students with eligibility
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        school_id: filters.school_id || undefined,
        program_id: filters.program_id || undefined,
        search: searchDebounced || undefined,
        limit: 500
      };
      const data = await PlacementService.getStudentsEligibility(params);
      setStudents(data.students || []);
    } catch (e) {
      toast({ title: 'Error fetching students', status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters.school_id, filters.program_id, searchDebounced, toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filter programs by selected school
  const filteredPrograms = filters.school_id
    ? programs.filter(p => String(p.school_id) === String(filters.school_id))
    : programs;

  // Toggle individual eligibility
  const handleToggleEligibility = async (usn, field, currentValue) => {
    const key = `${usn}-${field}`;
    setUpdating(prev => ({ ...prev, [key]: true }));
    try {
      await PlacementService.updateStudentEligibility(usn, { [field]: !currentValue });
      setStudents(prev => prev.map(s => 
        s.usn === usn ? { ...s, [field]: !currentValue } : s
      ));
      toast({ title: 'Updated', status: 'success', duration: 1500 });
    } catch (e) {
      toast({ title: 'Update failed', status: 'error' });
    } finally {
      setUpdating(prev => ({ ...prev, [key]: false }));
    }
  };

  // Handle select all
  const allSelected = students.length > 0 && students.every(s => selectedUsns.has(s.usn));
  const someSelected = students.some(s => selectedUsns.has(s.usn));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedUsns(new Set());
    } else {
      setSelectedUsns(new Set(students.map(s => s.usn)));
    }
  };

  const handleSelectStudent = (usn) => {
    setSelectedUsns(prev => {
      const next = new Set(prev);
      if (next.has(usn)) {
        next.delete(usn);
      } else {
        next.add(usn);
      }
      return next;
    });
  };

  // Bulk update
  const handleBulkUpdate = async () => {
    if (selectedUsns.size === 0) return;
    setBulkUpdating(true);
    try {
      const result = await PlacementService.bulkUpdateStudentEligibility(
        Array.from(selectedUsns),
        bulkEligibility
      );
      toast({ 
        title: 'Bulk update complete', 
        description: `Updated ${result.updated} students`,
        status: 'success' 
      });
      fetchStudents();
      setSelectedUsns(new Set());
      onBulkClose();
    } catch (e) {
      toast({ title: 'Bulk update failed', status: 'error' });
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <Box p={4} bg="white" borderRadius="xl" shadow="sm" border="1px" borderColor="gray.100">
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={2}>
        <Heading size="md">Student Eligibility Management</Heading>
        <HStack spacing={2}>
          {selectedUsns.size > 0 && (
            <Button colorScheme="teal" size="sm" onClick={onBulkOpen}>
              Update Selected ({selectedUsns.size})
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Filters */}
      <HStack spacing={4} mb={4} flexWrap="wrap">
        <Select 
          placeholder="All Schools" 
          w="200px" 
          size="sm"
          value={filters.school_id} 
          onChange={(e) => {
            setFilters(prev => ({ ...prev, school_id: e.target.value, program_id: '' }));
          }}
        >
          {schools.map(s => <option key={s.id} value={s.id}>{s.name || s.abbreviation}</option>)}
        </Select>
        <Select 
          placeholder="All Programs" 
          w="200px" 
          size="sm"
          value={filters.program_id} 
          onChange={(e) => setFilters(prev => ({ ...prev, program_id: e.target.value }))}
        >
          {filteredPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <InputGroup w="250px" size="sm">
          <InputLeftElement><SearchIcon color="gray.400" /></InputLeftElement>
          <Input 
            placeholder="Search name, USN, email..." 
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </InputGroup>
        <Text fontSize="sm" color="gray.500">{students.length} students</Text>
      </HStack>

      {/* Table */}
      {loading ? (
        <Flex justify="center" py={8}><Spinner /></Flex>
      ) : (
        <TableContainer overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th w="40px">
                  <Checkbox 
                    isChecked={allSelected} 
                    isIndeterminate={someSelected && !allSelected}
                    onChange={handleSelectAll}
                  />
                </Th>
                <Th>Name</Th>
                <Th>USN</Th>
                <Th>Email</Th>
                <Th>School</Th>
                <Th>Program</Th>
                <Th textAlign="center">Immersion</Th>
                <Th textAlign="center">Internship</Th>
                <Th textAlign="center">Capstone</Th>
                <Th textAlign="center">Placement</Th>
              </Tr>
            </Thead>
            <Tbody>
              {students.map((student) => (
                <Tr key={student.usn} bg={selectedUsns.has(student.usn) ? 'blue.50' : undefined}>
                  <Td>
                    <Checkbox 
                      isChecked={selectedUsns.has(student.usn)}
                      onChange={() => handleSelectStudent(student.usn)}
                    />
                  </Td>
                  <Td fontWeight="500">{student.full_name}</Td>
                  <Td fontSize="sm" color="gray.600">{student.usn}</Td>
                  <Td fontSize="sm" color="gray.600">{student.college_email}</Td>
                  <Td fontSize="sm">{student.school_name}</Td>
                  <Td fontSize="sm">{student.program_name}</Td>
                  <Td textAlign="center">
                    <Button
                      size="xs"
                      colorScheme={student.is_summer_immersion_eligible ? 'green' : 'red'}
                      variant="solid"
                      w="50px"
                      isLoading={updating[`${student.usn}-is_summer_immersion_eligible`]}
                      onClick={() => handleToggleEligibility(student.usn, 'is_summer_immersion_eligible', student.is_summer_immersion_eligible)}
                    >
                      {student.is_summer_immersion_eligible ? 'Yes' : 'No'}
                    </Button>
                  </Td>
                  <Td textAlign="center">
                    <Button
                      size="xs"
                      colorScheme={student.is_summer_internship_eligible ? 'green' : 'red'}
                      variant="solid"
                      w="50px"
                      isLoading={updating[`${student.usn}-is_summer_internship_eligible`]}
                      onClick={() => handleToggleEligibility(student.usn, 'is_summer_internship_eligible', student.is_summer_internship_eligible)}
                    >
                      {student.is_summer_internship_eligible ? 'Yes' : 'No'}
                    </Button>
                  </Td>
                  <Td textAlign="center">
                    <Button
                      size="xs"
                      colorScheme={student.is_capstone_eligible ? 'green' : 'red'}
                      variant="solid"
                      w="50px"
                      isLoading={updating[`${student.usn}-is_capstone_eligible`]}
                      onClick={() => handleToggleEligibility(student.usn, 'is_capstone_eligible', student.is_capstone_eligible)}
                    >
                      {student.is_capstone_eligible ? 'Yes' : 'No'}
                    </Button>
                  </Td>
                  <Td textAlign="center">
                    <Button
                      size="xs"
                      colorScheme={student.is_placement_eligible ? 'green' : 'red'}
                      variant="solid"
                      w="50px"
                      isLoading={updating[`${student.usn}-is_placement_eligible`]}
                      onClick={() => handleToggleEligibility(student.usn, 'is_placement_eligible', student.is_placement_eligible)}
                    >
                      {student.is_placement_eligible ? 'Yes' : 'No'}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {!loading && students.length === 0 && (
        <Text color="gray.500" py={4} textAlign="center">No students found. Adjust filters or add students.</Text>
      )}

      {/* Bulk Update Modal */}
      <Modal isOpen={isBulkOpen} onClose={onBulkClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bulk Update Eligibility</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4} fontSize="sm" color="gray.600">
              Set eligibility for {selectedUsns.size} selected students:
            </Text>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text>Summer Immersion</Text>
                <Button
                  size="sm"
                  colorScheme={bulkEligibility.is_summer_immersion_eligible ? 'green' : 'red'}
                  onClick={() => setBulkEligibility(prev => ({ ...prev, is_summer_immersion_eligible: !prev.is_summer_immersion_eligible }))}
                >
                  {bulkEligibility.is_summer_immersion_eligible ? 'Yes' : 'No'}
                </Button>
              </HStack>
              <HStack justify="space-between">
                <Text>Summer Internship</Text>
                <Button
                  size="sm"
                  colorScheme={bulkEligibility.is_summer_internship_eligible ? 'green' : 'red'}
                  onClick={() => setBulkEligibility(prev => ({ ...prev, is_summer_internship_eligible: !prev.is_summer_internship_eligible }))}
                >
                  {bulkEligibility.is_summer_internship_eligible ? 'Yes' : 'No'}
                </Button>
              </HStack>
              <HStack justify="space-between">
                <Text>Capstone</Text>
                <Button
                  size="sm"
                  colorScheme={bulkEligibility.is_capstone_eligible ? 'green' : 'red'}
                  onClick={() => setBulkEligibility(prev => ({ ...prev, is_capstone_eligible: !prev.is_capstone_eligible }))}
                >
                  {bulkEligibility.is_capstone_eligible ? 'Yes' : 'No'}
                </Button>
              </HStack>
              <HStack justify="space-between">
                <Text>Placement</Text>
                <Button
                  size="sm"
                  colorScheme={bulkEligibility.is_placement_eligible ? 'green' : 'red'}
                  onClick={() => setBulkEligibility(prev => ({ ...prev, is_placement_eligible: !prev.is_placement_eligible }))}
                >
                  {bulkEligibility.is_placement_eligible ? 'Yes' : 'No'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onBulkClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleBulkUpdate} isLoading={bulkUpdating}>
              Update {selectedUsns.size} Students
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

const ViewAllStudents = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 20;
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [programId, setProgramId] = useState('');
  const [yearOfJoining, setYearOfJoining] = useState('');
  const [yearOfJoiningDebounced, setYearOfJoiningDebounced] = useState('');
  const [isActive, setIsActive] = useState('');
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const { isOpen: isAddStudentsOpen, onOpen: onAddStudentsOpen, onClose: onAddStudentsClose } = useDisclosure();
  const { isOpen: isViewColumnsOpen, onOpen: onViewColumnsOpen, onClose: onViewColumnsClose } = useDisclosure();
  const [visibleTableColumns, setVisibleTableColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('viewAllStudents_visibleColumns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [...VIEW_STUDENTS_DEFAULT_VISIBLE];
  });
  const basicColumnKeys = ADD_STUDENTS_COLUMNS.basic.map((c) => c.key);
  const [addStudentsSelectedOptional, setAddStudentsSelectedOptional] = useState(() => [...basicColumnKeys]);

  const importFileInputRef = useRef(null);
  const [importRows, setImportRows] = useState([]);
  const [importValidation, setImportValidation] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [isImportPhase2Open, setIsImportPhase2Open] = useState(false);
  const [importPhase2Lookup, setImportPhase2Lookup] = useState({ schools: [], programs: [], majors: [], minors: [], specializations: [] });

  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const t = setTimeout(() => setYearOfJoiningDebounced((yearOfJoining || '').trim()), 400);
    return () => clearTimeout(t);
  }, [yearOfJoining]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchFilters = useCallback(async () => {
    try {
      const [schoolsData, programsData] = await Promise.all([
        StudentProfileService.getSchools(),
        StudentProfileService.getPrograms(),
      ]);
      setSchools(Array.isArray(schoolsData) ? schoolsData : []);
      setPrograms(Array.isArray(programsData) ? programsData : []);
    } catch (e) {
      console.error('Error fetching filters:', e);
    }
  }, []);

  const fetchStudents = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    if (!silent) setLoading(true);
    try {
      const yojNum = yearOfJoiningDebounced ? parseInt(yearOfJoiningDebounced, 10) : NaN;
      const yearOfJoiningParam = yearOfJoiningDebounced && !Number.isNaN(yojNum) ? yojNum : undefined;
      const params = {
        page,
        limit,
        search: searchDebounced || undefined,
        school_id: schoolId ? parseInt(schoolId, 10) : undefined,
        program_id: programId ? parseInt(programId, 10) : undefined,
        year_of_joining: yearOfJoiningParam,
        is_active: isActive === '' ? undefined : isActive,
      };
      const data = await StudentProfileService.getStudentsList(params);
      setStudents(data.students || []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      if (!silent) {
        toast({
          title: 'Failed to load students',
          description: e?.message || 'Please try again.',
          status: 'error',
          isClosable: true,
        });
        setStudents([]);
        setTotal(0);
        setTotalPages(0);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, limit, searchDebounced, schoolId, programId, yearOfJoiningDebounced, isActive, toast]);

  useBackgroundRefresh(fetchStudents);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // Update filtered programs when school selection changes
  useEffect(() => {
    if (schoolId) {
      const filtered = programs.filter(p => String(p.school_id) === String(schoolId));
      setFilteredPrograms(filtered);
      // Reset program if current selection is not in the filtered list
      if (programId && !filtered.find(p => String(p.id) === String(programId))) {
        setProgramId('');
      }
    } else {
      setFilteredPrograms(programs);
    }
  }, [schoolId, programs, programId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (!isImportPhase2Open || importRows.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const [majorsData, minorsData, specsData] = await Promise.all([
          StudentProfileService.getMajors(),
          StudentProfileService.getMinors(),
          StudentProfileService.getSpecializations(),
        ]);
        if (cancelled) return;
        setImportPhase2Lookup({
          schools: schools || [],
          programs: programs || [],
          majors: Array.isArray(majorsData) ? majorsData : [],
          minors: Array.isArray(minorsData) ? minorsData : [],
          specializations: Array.isArray(specsData) ? specsData : [],
        });
      } catch (e) {
        if (!cancelled) setImportPhase2Lookup((prev) => ({ ...prev, schools: schools || [], programs: programs || [] }));
      }
    })();
    return () => { cancelled = true; };
  }, [isImportPhase2Open, importRows.length, schools, programs]);

  const handleDownloadLookup = async () => {
    try {
      setLookupLoading(true);
      const schoolsData = await StudentProfileService.getAcademyOverview();
      if (!schoolsData || !schoolsData.length) {
        toast({ title: 'No academic data available', status: 'warning' });
        return;
      }

      const wb = XLSX.utils.book_new();

      // A. School Tab
      const schoolData = schoolsData.map(s => ({
        'School ID': s.id,
        'School Code': s.abbreviation || '',
        'School Name': s.name || ''
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schoolData), 'Schools');

      // B. Program Tab
      const programData = [];
      schoolsData.forEach(s => {
        (s.programs || []).forEach(p => {
          programData.push({
            'School ID': s.id,
            'School Code': s.abbreviation || '',
            'School Name': s.name || '',
            'Program ID': p.id,
            'Program Name': p.name || ''
          });
        });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(programData), 'Programs');

      // C. Major Tab
      const majorData = [];
      schoolsData.forEach(s => {
        (s.programs || []).forEach(p => {
          (p.majors || []).forEach(m => {
            majorData.push({
              'School ID': s.id,
              'School Name': s.name || '',
              'Program ID': p.id,
              'Program Name': p.name || '',
              'Major ID': m.id,
              'Major Name': m.name || ''
            });
          });
        });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(majorData), 'Majors');

      // D. Minor Tab (Linked to School)
      const minorData = [];
      schoolsData.forEach(s => {
        (s.minors || []).forEach(m => {
          minorData.push({
            'School ID': s.id,
            'School Name': s.name || '',
            'Minor ID': m.id,
            'Minor Name': m.name || ''
          });
        });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(minorData), 'Minors');

      // E. Specialization Tab (Linked to Program)
      const specData = [];
      schoolsData.forEach(s => {
        (s.programs || []).forEach(p => {
          (p.specializations || []).forEach(spec => {
            specData.push({
              'School ID': s.id,
              'School Name': s.name || '',
              'Program ID': p.id,
              'Program Name': p.name || '',
              'Specialization ID': spec.id,
              'Specialization Name': spec.name || ''
            });
          });
        });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(specData), 'Specializations');

      XLSX.writeFile(wb, 'Academic_Lookup_Data.xlsx');
      toast({ title: 'Academic lookup data downloaded', status: 'success' });
    } catch (e) {
      toast({ title: 'Download failed', description: e?.message, status: 'error' });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleDownloadTemplateWithTestData = () => {
    const cols = addStudentsSelectedOptional;
    if (cols.length === 0) {
      toast({ title: 'Select at least one column', status: 'warning' });
      return;
    }
    try {
      const headers = [...cols];
      const rows = [];
      for (let i = 1; i <= 10; i++) rows.push(getTestDataRow(cols, i));
      const aoa = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ''))];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'students_template.xlsx';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Template downloaded with 10 sample rows.', status: 'success', duration: 3000 });
    } catch (err) {
      toast({ title: 'Download failed', description: err?.message, status: 'error' });
    }
  };

  const handleImportFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = (file.name || '').toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls') && !ext.endsWith('.csv')) {
      toast({ title: 'Use .xlsx, .xls or .csv file', status: 'warning' });
      e.target.value = '';
      return;
    }
    setIsImporting(true);
    setImportValidation(null);
    setImportRows([]);
    try {
      let headers = [];
      let rows = [];
      if (ext.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length) {
          headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const obj = {};
            headers.forEach((h, j) => { obj[h] = values[j] !== undefined ? values[j] : ''; });
            rows.push(obj);
          }
        }
      } else {
        const parsed = await parseExcelFile(file);
        headers = parsed.headers;
        rows = parsed.rows;
      }
      const selectedCols = addStudentsSelectedOptional;
      const normalized = rows.map((r) => mapRowToSelectedColumns(r, headers, selectedCols));
      const requiredKeys = ['usn', 'full_name', 'college_email', 'school_id', 'program_id', 'year_of_joining'];
      const { validRows, typeErrors } = validateImportRows(normalized, requiredKeys);
      const payload = validRows.map((r) => ({
        usn: String(r.usn).trim().toUpperCase(),
        full_name: r.full_name,
        college_email: r.college_email,
        year_of_joining: r.year_of_joining ? parseInt(r.year_of_joining, 10) : null,
        school_id: r.school_id ? parseInt(r.school_id, 10) : null,
        program_id: r.program_id ? parseInt(r.program_id, 10) : null,
        phone_country_code: r.phone_country_code || undefined,
        phone_number: r.phone_number || undefined,
        personal_email: r.personal_email || undefined,
        major_id: r.major_id ? parseInt(r.major_id, 10) : undefined,
        minor_id: r.minor_id ? parseInt(r.minor_id, 10) : undefined,
        specialization_id: r.specialization_id ? parseInt(r.specialization_id, 10) : undefined,
        section: r.section || undefined,
        gender: r.gender || undefined,
        date_of_birth: r.date_of_birth || undefined,
        blood_group: r.blood_group || undefined,
        languages: r.languages || undefined,
        specially_abled: r.specially_abled === 'true' || r.specially_abled === '1' || r.specially_abled === true,
      }));
      const validPayload = payload.filter((r) => r.school_id != null && r.program_id != null);
      const groups = {};
      validPayload.forEach((row) => {
        const key = `${row.school_id}:${row.program_id}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });
      let duplicateUsnsInDb = [];
      let duplicateUsnsInFile = [];
      for (const key of Object.keys(groups)) {
        const [sid, pid] = key.split(':').map(Number);
        const result = await StudentProfileService.checkBulkDuplicates({
          school_id: sid,
          program_id: pid,
          students: groups[key],
        });
        if (result.duplicateUsnsInDb?.length) duplicateUsnsInDb = [...duplicateUsnsInDb, ...result.duplicateUsnsInDb];
        if (result.duplicateUsnsInFile?.length) duplicateUsnsInFile = [...duplicateUsnsInFile, ...result.duplicateUsnsInFile];
      }
      const hasDuplicates = duplicateUsnsInDb.length > 0 || duplicateUsnsInFile.length > 0;
      const schoolIds = new Set((schools || []).map((s) => Number(s.id)));
      const programMap = new Map();
      (programs || []).forEach((p) => {
        const key = `${p.school_id}:${p.id}`;
        if (!programMap.has(key)) programMap.set(key, p);
      });
      const idErrors = [];
      validPayload.forEach((row, idx) => {
        const rowNum = idx + 2;
        if (row.school_id != null && !schoolIds.has(row.school_id)) {
          idErrors.push({ row: rowNum, message: `school_id ${row.school_id} not found` });
        }
        if (row.school_id != null && row.program_id != null) {
          const key = `${row.school_id}:${row.program_id}`;
          if (!programMap.has(key)) {
            idErrors.push({ row: rowNum, message: `program_id ${row.program_id} not found for school_id ${row.school_id}` });
          }
        }
      });
      setImportValidation({
        typeErrors,
        duplicateUsnsInDb: [...new Set(duplicateUsnsInDb)],
        duplicateUsnsInFile: [...new Set(duplicateUsnsInFile)],
        hasDuplicates,
        validCount: validPayload.length,
        idErrors,
      });
      setImportRows(validPayload);
      setIsImportPhase2Open(true);
      onAddStudentsClose();
    } catch (err) {
      toast({ title: 'Import failed', description: err?.message, status: 'error' });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (importRows.length === 0 || importValidation?.hasDuplicates) return;
    setIsInserting(true);
    try {
      const groups = {};
      importRows.forEach((row) => {
        const key = `${row.school_id}:${row.program_id}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      });
      let totalInserted = 0;
      for (const key of Object.keys(groups)) {
        const [schoolId, programId] = key.split(':').map(Number);
        await StudentProfileService.bulkInsertStudents({
          school_id: schoolId,
          program_id: programId,
          students: groups[key],
        });
        totalInserted += groups[key].length;
      }
      toast({ title: `Inserted ${totalInserted} students`, status: 'success' });
      setImportRows([]);
      setImportValidation(null);
      setIsImportPhase2Open(false);
      fetchStudents();
    } catch (err) {
      toast({ title: err?.message || 'Insert failed', status: 'error' });
    } finally {
      setIsInserting(false);
    }
  };

  const resetImportPreview = () => {
    setImportRows([]);
    setImportValidation(null);
    if (importFileInputRef.current) importFileInputRef.current.value = '';
  };

  const allViewColumnIds = [
    ...VIEW_STUDENTS_COLUMNS.basic.map((c) => c.id),
    ...VIEW_STUDENTS_COLUMNS.academic.map((c) => c.id),
    ...VIEW_STUDENTS_COLUMNS.other.map((c) => c.id),
  ];
  const getViewColumnLabel = (id) => {
    for (const cat of Object.values(VIEW_STUDENTS_COLUMNS)) {
      const col = cat.find((c) => c.id === id);
      if (col) return col.label;
    }
    return id;
  };
  const getViewColumnCell = (id, s) => {
    const schoolNameVal = (st) => (st?.schools && (st.schools.name || st.schools.abbreviation)) || '—';
    const programNameVal = (st) => (st?.programs && st.programs.name) || '—';
    const majorNameVal = (st) => (st?.majors && st.majors.name) || '—';
    const minorNameVal = (st) => (st?.minors && st.minors.name) || '—';
    const specNameVal = (st) => (st?.specializations && st.specializations.name) || '—';
    switch (id) {
      case 'student':
        return (
          <HStack spacing={3}>
            <Avatar size="sm" name={s.full_name} src={s.profile_image ? getFileUrl(s.profile_image) : undefined} bg="blue.50" color="blue.600" />
            <Text fontWeight="medium">{s.full_name}</Text>
          </HStack>
        );
      case 'usn': return s.usn;
      case 'full_name': return s.full_name ?? '—';
      case 'college_email': return <Text color="gray.600">{s.college_email}</Text>;
      case 'school': return schoolNameVal(s);
      case 'program': return programNameVal(s);
      case 'year_of_joining': return s.year_of_joining ?? '—';
      case 'current_year': return s.current_year ?? '—';
      case 'current_semester': return s.current_semester ?? '—';
      case 'section': return s.section ?? '—';
      case 'major': return majorNameVal(s);
      case 'minor': return minorNameVal(s);
      case 'specialization': return specNameVal(s);
      case 'is_active':
        return (
          <Badge colorScheme={s.is_active !== false ? 'green' : 'red'} variant="subtle" borderRadius="full" px={2} py={0.5}>
            {s.is_active !== false ? 'Active' : 'Inactive'}
          </Badge>
        );
      case 'is_registered': return s.is_registered ? 'Yes' : 'No';
      case 'created_at': return s.created_at ? new Date(s.created_at).toLocaleDateString() : '—';
      default: return s[id] != null ? String(s[id]) : '—';
    }
  };

  const handleViewColumnsProceed = (selectedIds) => {
    if (selectedIds.length === 0) {
      toast({ title: 'Select at least one column', status: 'warning' });
      return;
    }
    setVisibleTableColumns(selectedIds);
    try {
      localStorage.setItem('viewAllStudents_visibleColumns', JSON.stringify(selectedIds));
    } catch (_) {}
    onViewColumnsClose();
    toast({ title: 'Columns updated', status: 'success', duration: 2000 });
  };

  const handleView = (usn) => {
    navigate(`/placement/students/${encodeURIComponent(usn)}`);
  };

  const clearFilters = () => {
    setSearch('');
    setSchoolId('');
    setProgramId('');
    setYearOfJoining('');
    setIsActive('');
    setPage(1);
  };

  const hasActiveFilters = search || schoolId || programId || yearOfJoining || isActive;

  const schoolName = (s) => (s?.schools && (s.schools.name || s.schools.abbreviation)) || '—';
  const programName = (s) => (s?.programs && s.programs.name) || '—';

  const [viewColumnsModalSelected, setViewColumnsModalSelected] = useState([]);

  return (
    <Box w="full">
      <Flex w="full" justify="flex-end" align="center" mb={4} gap={2}>
        <IconButton
          aria-label="Select columns to display"
          icon={<Icon as={MdViewColumn} boxSize={5} />}
          size="sm"
          variant="outline"
          colorScheme="blue"
          onClick={() => {
            setViewColumnsModalSelected([...visibleTableColumns]);
            onViewColumnsOpen();
          }}
        />
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          size="sm"
          onClick={onAddStudentsOpen}
        >
          Add Students
        </Button>
      </Flex>
      {/* Filters card */}
      <Card
        bg="white"
        borderRadius="xl"
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
        overflow="hidden"
        mb={6}
      >
        <CardBody py={4} px={{ base: 4, md: 6 }}>
              <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                <Text fontSize="sm" fontWeight="600" color="gray.700" textTransform="uppercase" letterSpacing="wider">
                  Filters
                </Text>
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="gray"
                    leftIcon={<Icon as={CloseIcon} />}
                    onClick={clearFilters}
                  >
                    Clear all
                  </Button>
                )}
              </Flex>
              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3, lg: 5 }}
                spacing={4}
                align="end"
              >
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" fontWeight="500" mb={1}>
                    Search
                  </FormLabel>
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none" color="gray.400">
                      <SearchIcon />
                    </InputLeftElement>
                    <Input
                      placeholder="USN or name"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      bg="gray.50"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="lg"
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                      _placeholder={{ color: 'gray.400' }}
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" fontWeight="500" mb={1}>
                    School
                  </FormLabel>
                  <Select
                    placeholder="All schools"
                    value={schoolId}
                    onChange={(e) => { setSchoolId(e.target.value); setPage(1); }}
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                    size="md"
                    _focus={{ borderColor: 'blue.400' }}
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name || s.abbreviation}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" fontWeight="500" mb={1}>
                    Program
                  </FormLabel>
                  <Select
                    placeholder="All programs"
                    value={programId}
                    onChange={(e) => { setProgramId(e.target.value); setPage(1); }}
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                    size="md"
                    _focus={{ borderColor: 'blue.400' }}
                  >
                    {filteredPrograms.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" fontWeight="500" mb={1}>
                    Year of joining
                  </FormLabel>
                  <Input
                    placeholder="e.g. 2023"
                    value={yearOfJoining}
                    onChange={(e) => { setYearOfJoining(e.target.value); setPage(1); }}
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                    size="md"
                    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" fontWeight="500" mb={1}>
                    Status
                  </FormLabel>
                  <Select
                    placeholder="All"
                    value={isActive}
                    onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                    size="md"
                    _focus={{ borderColor: 'blue.400' }}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </Card>

          {loading ? (
            <Flex justify="center" align="center" minH="280px" bg="white" borderRadius="xl" shadow="sm">
              <Spinner size="xl" color="blue.500" thickness="3px" />
            </Flex>
          ) : isMobile ? (
            <SimpleGrid columns={1} spacing={4}>
              {students.length === 0 ? (
                <Box bg="white" p={10} borderRadius="xl" shadow="sm" textAlign="center" border="1px solid" borderColor="gray.100">
                  <Text color="gray.500" fontSize="md">No students found.</Text>
                  <Text color="gray.400" fontSize="sm" mt={2}>Try adjusting your filters.</Text>
                </Box>
              ) : (
                students.map((s) => (
                  <Card
                    key={s.usn}
                    shadow="sm"
                    borderRadius="xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="gray.100"
                    _hover={{ shadow: 'md', borderColor: 'gray.200', cursor: 'pointer' }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => handleView(s.usn)}
                  >
                    <CardHeader pb={0} pt={4} px={4}>
                      <Flex align="center" justify="space-between">
                        <HStack spacing={3}>
                          <Avatar
                            size="md"
                            name={s.full_name}
                            src={s.profile_image ? getFileUrl(s.profile_image) : undefined}
                            bg="blue.50"
                            color="blue.600"
                          />
                          <Box>
                            <Text fontWeight="bold" fontSize="md">{s.full_name}</Text>
                            <Text fontSize="sm" color="gray.500">{s.usn}</Text>
                          </Box>
                        </HStack>
                        <Button
                          size="sm"
                          leftIcon={<ViewIcon />}
                          colorScheme="blue"
                          borderRadius="lg"
                          onClick={(e) => { e.stopPropagation(); handleView(s.usn); }}
                        >
                          View
                        </Button>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={3} px={4} pb={4}>
                      <Text fontSize="sm" color="gray.600">{s.college_email}</Text>
                      <HStack mt={3} spacing={2} flexWrap="wrap" gap={1}>
                        <Badge colorScheme="teal" variant="subtle" borderRadius="full" px={2} py={0.5}>{schoolName(s)}</Badge>
                        <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={2} py={0.5}>{programName(s)}</Badge>
                        {s.year_of_joining && <Badge variant="subtle" borderRadius="full" px={2} py={0.5}>YJ {s.year_of_joining}</Badge>}
                        {s.is_active === false && <Badge colorScheme="red" variant="subtle" borderRadius="full">Inactive</Badge>}
                      </HStack>
                    </CardBody>
                  </Card>
                ))
              )}
            </SimpleGrid>
          ) : (
            <TableContainer
              bg="white"
              borderRadius="xl"
              shadow="sm"
              overflowX="auto"
              border="1px solid"
              borderColor="gray.100"
            >
              <Table variant="simple" size="sm">
                <Thead bg="gray.50" borderBottom="2px solid" borderColor="gray.200">
                  <Tr>
                    {visibleTableColumns.map((id) => (
                      <Th key={id} fontWeight="600" color="gray.700" fontSize="xs" textTransform="uppercase" letterSpacing="wider" whiteSpace="nowrap">
                        {getViewColumnLabel(id)}
                      </Th>
                    ))}
                    <Th textAlign="right" fontWeight="600" color="gray.700" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {students.length === 0 ? (
                    <Tr>
                      <Td colSpan={visibleTableColumns.length + 1} textAlign="center" py={12} color="gray.500" fontSize="md">
                        No students found. Try adjusting your filters.
                      </Td>
                    </Tr>
                  ) : (
                    students.map((s) => (
                      <Tr
                        key={s.usn}
                        _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                        borderBottom="1px"
                        borderColor="gray.100"
                        cursor="pointer"
                        onClick={() => handleView(s.usn)}
                      >
                        {visibleTableColumns.map((id) => (
                          <Td key={id} py={3} fontSize="sm">
                            {getViewColumnCell(id, s)}
                          </Td>
                        ))}
                        <Td py={3} textAlign="right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            leftIcon={<ViewIcon />}
                            colorScheme="blue"
                            variant="outline"
                            borderRadius="lg"
                            onClick={() => handleView(s.usn)}
                          >
                            View
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          {totalPages > 1 && (
            <Flex
              justify="space-between"
              align="center"
              wrap="wrap"
              gap={4}
              mt={6}
              p={4}
              bg="white"
              borderRadius="xl"
              shadow="sm"
              border="1px solid"
              borderColor="gray.100"
            >
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Showing <strong>{(page - 1) * limit + 1}</strong>–<strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong>
              </Text>
              <HStack spacing={3}>
                <IconButton
                  aria-label="Previous page"
                  icon={<ChevronLeftIcon />}
                  size="sm"
                  borderRadius="lg"
                  variant="outline"
                  colorScheme="blue"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  isDisabled={page <= 1}
                />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">Page {page} of {totalPages}</Text>
                <IconButton
                  aria-label="Next page"
                  icon={<ChevronRightIcon />}
                  size="sm"
                  borderRadius="lg"
                  variant="outline"
                  colorScheme="blue"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  isDisabled={page >= totalPages}
                />
              </HStack>
            </Flex>
          )}

          {/* Select columns to display */}
          <Modal isOpen={isViewColumnsOpen} onClose={onViewColumnsClose} size="4xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent maxW="90vw">
              <ModalHeader>Select columns to display</ModalHeader>
              <ModalCloseButton />
              <ModalBody pt={2} pb={6}>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Choose which columns to show in the View All Students table. Categories match student data.
                </Text>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  {[
                    { id: 'basic', title: 'Basic', cols: VIEW_STUDENTS_COLUMNS.basic },
                    { id: 'academic', title: 'Academic', cols: VIEW_STUDENTS_COLUMNS.academic },
                    { id: 'other', title: 'Other', cols: VIEW_STUDENTS_COLUMNS.other },
                  ].map(({ id, title, cols }) => (
                    <Card key={id} variant="outline" size="sm" shadow="sm">
                      <CardHeader py={2} px={4} borderBottom="1px" borderColor="gray.100">
                        <Text fontSize="sm" fontWeight="600" color="gray.800">{title}</Text>
                      </CardHeader>
                      <CardBody py={2} px={4}>
                        <VStack align="stretch" spacing={1}>
                          {cols.map((col) => (
                            <Checkbox
                              key={col.id}
                              size="sm"
                              colorScheme="blue"
                              isChecked={viewColumnsModalSelected.includes(col.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setViewColumnsModalSelected((prev) => [...prev, col.id]);
                                } else {
                                  setViewColumnsModalSelected((prev) => prev.filter((c) => c !== col.id));
                                }
                              }}
                            >
                              {col.label}
                            </Checkbox>
                          ))}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </ModalBody>
              <ModalFooter>
                <Button size="sm" colorScheme="blue" onClick={() => handleViewColumnsProceed(viewColumnsModalSelected)}>
                  Proceed
                </Button>
                <Button size="sm" variant="ghost" onClick={onViewColumnsClose}>Cancel</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal
            isOpen={isAddStudentsOpen}
            onClose={() => {
              resetImportPreview();
              onAddStudentsClose();
            }}
            size="6xl"
            scrollBehavior="inside"
          >
            <ModalOverlay />
            <ModalContent maxW="90vw" minH="80vh">
              <ModalHeader>Add Students</ModalHeader>
              <ModalCloseButton />
              <ModalBody pt={2} pb={6} className="add-students-modal-body">
                <Text fontWeight="medium" color="gray.700" mb={4} fontSize="md" bg="blue.50" p={3} borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                  If you wanted to add minors, majors, specializations, replace them with the ids to insert into the database.
                </Text>

                <Text fontWeight="bold" fontSize="sm" color="gray.800" mt={6} mb={2}>Step 1: Select columns to include</Text>
                <Text fontSize="sm" color="gray.600" mb={3}>Choose which student_basic_details columns to include for the upload.</Text>

                <Box className="add-students-columns-scroll">
                  <CheckboxGroup
                    value={addStudentsSelectedOptional}
                    onChange={(newValue) => {
                      const basicSet = new Set(basicColumnKeys);
                      const optionalInNew = (newValue || []).filter((k) => !basicSet.has(k));
                      setAddStudentsSelectedOptional([...basicColumnKeys, ...optionalInNew]);
                    }}
                  >
                    <SimpleGrid className="add-students-cards-grid" columns={{ base: 1, md: 4 }} spacing={4}>
                      {[
                        { id: 'basic', title: 'Basic', cols: ADD_STUDENTS_COLUMNS.basic },
                        { id: 'contact', title: 'Contact', cols: ADD_STUDENTS_COLUMNS.contact },
                        { id: 'academic', title: 'Academic', cols: ADD_STUDENTS_COLUMNS.academic },
                        { id: 'personal', title: 'Personal', cols: ADD_STUDENTS_COLUMNS.personal },
                      ].map(({ id, title, cols }) => {
                        const isBasic = id === 'basic';
                        const allSelected = cols.every((c) => addStudentsSelectedOptional.includes(c.key));
                        const cardKeys = cols.map((c) => c.key);
                        const toggleCardSelection = () => {
                          if (isBasic) return;
                          if (allSelected) {
                            setAddStudentsSelectedOptional((prev) => prev.filter((k) => !cardKeys.includes(k)));
                          } else {
                            setAddStudentsSelectedOptional((prev) => [...new Set([...prev, ...cardKeys])]);
                          }
                        };
                        return (
                        <Card key={id} className="add-students-card" variant="outline" size="sm" shadow="sm">
                          <CardHeader py={3} px={4} borderBottom="1px" borderColor="gray.100" display="flex" flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text className="add-students-card-title" fontSize="sm" fontWeight="600" color="gray.800">
                              {title}
                            </Text>
                            <Checkbox
                              size="sm"
                              colorScheme="blue"
                              isChecked={isBasic || allSelected}
                              isDisabled={isBasic}
                              onChange={toggleCardSelection}
                              aria-label={`Select all ${title}`}
                            >
                              <Text as="span" fontSize="xs" color="gray.600">Select all</Text>
                            </Checkbox>
                          </CardHeader>
                          <CardBody py={2} px={4}>
                            <VStack align="stretch" spacing={0}>
                              {cols.map((col) => {
                                const isBasic = id === 'basic';
                                const isSelected = addStudentsSelectedOptional.includes(col.key);
                                return (
                                  <Flex
                                    key={col.key}
                                    className={`add-students-row ${isSelected ? 'add-students-row-selected' : ''}`}
                                    align="center"
                                    gap={3}
                                    py={2}
                                    px={2}
                                  >
                                    <Checkbox
                                      value={col.key}
                                      size="sm"
                                      colorScheme="blue"
                                      aria-label={`Include ${col.label}`}
                                      flexShrink={0}
                                      isChecked={isBasic || isSelected}
                                      isDisabled={isBasic}
                                    >
                                      {null}
                                    </Checkbox>
                                    <Text as="span" className="add-students-col-name" fontFamily="mono" fontWeight="500" fontSize="xs">
                                      {col.label}
                                    </Text>
                                    <Text as="span" className="add-students-col-desc" fontSize="xs" color="gray.500" noOfLines={1}>
                                      {col.description}
                                    </Text>
                                  </Flex>
                                );
                              })}
                            </VStack>
                          </CardBody>
                        </Card>
                      );
                      })}
                    </SimpleGrid>
                  </CheckboxGroup>
                </Box>

                <Divider my={6} />

                <Text fontWeight="bold" fontSize="sm" color="gray.800" mb={3}>Step 2: Template &amp; Import</Text>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={3} mb={4}>
                  <HStack spacing={3}>
                    <Button
                      leftIcon={<DownloadIcon />}
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      onClick={handleDownloadTemplateWithTestData}
                    >
                      Download template
                    </Button>
                    <Button
                      leftIcon={<DownloadIcon />}
                      size="sm"
                      variant="outline"
                      colorScheme="green"
                      onClick={handleDownloadLookup}
                      isLoading={lookupLoading}
                    >
                      Download lookup
                    </Button>
                  </HStack>
                  <Box>
                    <Input
                      ref={importFileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      display="none"
                      onChange={handleImportFileChange}
                    />
                    <Button
                      leftIcon={<AttachmentIcon />}
                      size="sm"
                      colorScheme="blue"
                      onClick={() => importFileInputRef.current?.click()}
                      isLoading={isImporting}
                    >
                      Import
                    </Button>
                  </Box>
                </Flex>
                <Text fontSize="xs" color="gray.500" mb={4}>
                  Template downloads with 10 sample rows. Replace with your data and import. File can include multiple schools and programs (use school_id and program_id columns).
                </Text>

              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Phase 2: Review import — fresh popup after file select */}
          <Modal
            isOpen={isImportPhase2Open}
            onClose={() => {
              setIsImportPhase2Open(false);
              resetImportPreview();
            }}
            size="6xl"
            scrollBehavior="inside"
          >
            <ModalOverlay />
            <ModalContent maxW="95vw" minH="85vh">
              <ModalHeader>Review import — Add Students (Phase 2)</ModalHeader>
              <ModalCloseButton />
              <ModalBody pt={4} pb={6}>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Scroll to view all columns and rows. IDs are mapped to names where available.
                </Text>
                <TableContainer className="add-students-phase2-table-wrap" overflowX="auto" overflowY="auto" maxH="55vh" mb={4}>
                  <Table size="sm" className="add-students-import-table" minW="max-content">
                    <Thead>
                      <Tr>
                        <Th whiteSpace="nowrap">#</Th>
                        {addStudentsSelectedOptional.map((col) => (
                          <Th key={col} whiteSpace="nowrap">{col}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {importRows.map((row, idx) => {
                        const lookup = importPhase2Lookup;
                        const schoolName = (id) => (lookup.schools.find((s) => Number(s.id) === Number(id))?.name || lookup.schools.find((s) => Number(s.id) === Number(id))?.abbreviation) || null;
                        const programName = (sid, pid) => (lookup.programs.find((p) => Number(p.school_id) === Number(sid) && Number(p.id) === Number(pid))?.name) || null;
                        const majorName = (id) => (lookup.majors.find((m) => Number(m.id) === Number(id))?.name) || null;
                        const minorName = (id) => (lookup.minors.find((m) => Number(m.id) === Number(id))?.name) || null;
                        const specName = (id) => (lookup.specializations.find((s) => Number(s.id) === Number(id))?.name) || null;
                        const cellDisplay = (col, val) => {
                          if (val == null || val === '') return '—';
                          if (col === 'school_id') {
                            const name = schoolName(val);
                            return name ? `${name} (${val})` : <Text as="span" color="red.600">{val} (not found)</Text>;
                          }
                          if (col === 'program_id') {
                            const name = programName(row.school_id, val);
                            return name ? `${name} (${val})` : <Text as="span" color="red.600">{val} (not found)</Text>;
                          }
                          if (col === 'major_id') {
                            const name = majorName(val);
                            return name ? `${name} (${val})` : `${val}`;
                          }
                          if (col === 'minor_id') {
                            const name = minorName(val);
                            return name ? `${name} (${val})` : `${val}`;
                          }
                          if (col === 'specialization_id') {
                            const name = specName(val);
                            return name ? `${name} (${val})` : `${val}`;
                          }
                          return String(val);
                        };
                        return (
                          <Tr key={idx}>
                            <Td whiteSpace="nowrap" fontWeight="medium">{idx + 1}</Td>
                            {addStudentsSelectedOptional.map((col) => (
                              <Td key={col} whiteSpace="nowrap" maxW="200px" overflow="hidden" textOverflow="ellipsis" title={String(row[col] ?? '')}>
                                {cellDisplay(col, row[col])}
                              </Td>
                            ))}
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>

                {(importValidation?.idErrors?.length > 0 || importValidation?.typeErrors?.length > 0 || importValidation?.hasDuplicates) ? (
                  <Box mb={4}>
                    <Alert status="error" borderRadius="md" mb={3}>
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle fontSize="sm">Errors — fix these and re-import</AlertTitle>
                        <AlertDescription as="ul" fontSize="xs" pl={4} mt={2}>
                          {importValidation?.idErrors?.map((e, i) => (
                            <li key={`id-${i}`}>Row {e.row}: {e.message}</li>
                          ))}
                          {importValidation?.typeErrors?.map((e, i) => (
                            <li key={`type-${i}`}>Row {e.row}: {e.message}</li>
                          ))}
                          {importValidation?.hasDuplicates && (
                            <li>Duplicate USNs in DB: {importValidation.duplicateUsnsInDb?.join(', ')}. In file: {importValidation.duplicateUsnsInFile?.join(', ')}. Remove duplicates and re-import.</li>
                          )}
                        </AlertDescription>
                      </Box>
                    </Alert>
                    <Button size="sm" colorScheme="gray" onClick={() => { setIsImportPhase2Open(false); resetImportPreview(); }}>
                      Close (cancel import)
                    </Button>
                  </Box>
                ) : (
                  <Flex gap={3}>
                    <Button size="sm" colorScheme="green" onClick={handleConfirmImport} isLoading={isInserting}>
                      Insert {importRows.length} row(s)
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setIsImportPhase2Open(false); resetImportPreview(); }}>
                      Close (cancel)
                    </Button>
                  </Flex>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
    </Box>
  );
};

export default ViewAllStudents;
