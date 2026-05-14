import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  Heading,
  VStack,
  Text,
  useToast,
  Select,
  FormControl,
  FormLabel,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Card,
  CardBody,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  SimpleGrid,
  Checkbox,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { AddIcon, AttachmentIcon, DownloadIcon } from '@chakra-ui/icons';
import { StyledFileInput } from '../components/ui/StyledFileInput';
import { StudentProfileService } from '../services/studentProfile.service';
import { useBackgroundRefresh } from '../hooks/useBackgroundRefresh';

const REQUIRED_COLUMNS = ['usn', 'full_name', 'college_email', 'year_of_joining'];
const OPTIONAL_COLUMNS = ['phone_country_code', 'phone_number', 'major_id', 'minor_id', 'specialization_id', 'personal_email', 'gender', 'date_of_birth', 'blood_group', 'languages', 'specially_abled'];

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, j) => {
      obj[h] = values[j] !== undefined ? values[j] : '';
    });
    rows.push(obj);
  }
  return { headers, rows };
}

function parseExcel(file) {
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

function normalizeRow(row) {
  const normalized = {};
  const keyMap = {};
  Object.keys(row).forEach((k) => {
    const lower = k.toLowerCase().replace(/\s+/g, '_').trim();
    keyMap[lower] = k;
  });
  [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].forEach((col) => {
    const key = keyMap[col] || keyMap[col.replace(/_/g, ' ')];
    if (key !== undefined) {
      normalized[col] = row[key] != null ? String(row[key]).trim() : '';
    } else {
      normalized[col] = row[col] != null ? String(row[col]).trim() : '';
    }
  });
  return normalized;
}

export default function AddStudents() {
  const toast = useToast();
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [programId, setProgramId] = useState('');
  const [uploadedRows, setUploadedRows] = useState([]);
  const [uploadedHeaders, setUploadedHeaders] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [inserting, setInserting] = useState(false);
  const { isOpen: isDuplicateModalOpen, onOpen: onDuplicateModalOpen, onClose: onDuplicateModalClose } = useDisclosure();
  const [duplicateResult, setDuplicateResult] = useState(null);

  const [allPrograms, setAllPrograms] = useState([]);

  const fetchSchools = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    try {
      const data = await StudentProfileService.getSchools();
      setSchools(Array.isArray(data) ? data : []);
    } catch (e) {
      if (!silent) {
        console.error(e);
        toast({ title: 'Failed to load schools', status: 'error' });
      }
    }
  }, [toast]);

  const fetchAllPrograms = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    try {
      const data = await StudentProfileService.getPrograms();
      setAllPrograms(Array.isArray(data) ? data : []);
    } catch (e) {
      if (!silent) setAllPrograms([]);
    }
  }, []);

  const refreshFilters = useCallback(async (opts = {}) => {
    await Promise.all([fetchSchools(opts), fetchAllPrograms(opts)]);
  }, [fetchSchools, fetchAllPrograms]);

  useEffect(() => {
    fetchAllPrograms();
  }, [fetchAllPrograms]);

  useBackgroundRefresh(refreshFilters);

  // Programs that belong to the selected school (each program has school_id)
  const programs = schoolId
    ? allPrograms.filter((p) => String(p.school_id) === String(schoolId))
    : [];
  useEffect(() => {
    if (!schoolId) setProgramId('');
  }, [schoolId]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    const ext = (file.name || '').toLowerCase();
    try {
      if (ext.endsWith('.csv')) {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);
        setUploadedHeaders(headers);
        setUploadedRows(rows);
        toast({ title: `Loaded ${rows.length} rows from CSV`, status: 'success', duration: 2000 });
      } else if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
        const { headers, rows } = await parseExcel(file);
        setUploadedHeaders(headers);
        setUploadedRows(rows);
        toast({ title: `Loaded ${rows.length} rows from Excel`, status: 'success', duration: 2000 });
      } else {
        toast({ title: 'Use .csv or .xlsx file', status: 'warning' });
        setUploadedRows([]);
        setUploadedHeaders([]);
      }
    } catch (err) {
      toast({ title: 'Failed to parse file', description: err?.message, status: 'error' });
      setUploadedRows([]);
      setUploadedHeaders([]);
    }
    e.target.value = '';
  };

  const [selectedTemplateColumns, setSelectedTemplateColumns] = useState(() =>
    [...REQUIRED_COLUMNS, 'phone_country_code', 'phone_number', 'personal_email']
  );

  const toggleTemplateColumn = (col) => {
    if (REQUIRED_COLUMNS.includes(col)) return;
    setSelectedTemplateColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const downloadEmptyTemplate = () => {
    const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS.filter((c) => selectedTemplateColumns.includes(c))];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students_template.xlsx');
    toast({ title: 'Empty template downloaded. Fill it and upload.', status: 'success', duration: 3000 });
  };

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

  const handleProceedBulk = async () => {
    if (!schoolId || !programId) {
      toast({ title: 'Select School and Program', status: 'warning' });
      return;
    }
    if (uploadedRows.length === 0) {
      toast({ title: 'Upload a file and preview rows first', status: 'warning' });
      return;
    }
    const normalized = uploadedRows.map((r) => {
      const n = normalizeRow(r);
      return {
        usn: n.usn,
        full_name: n.full_name,
        college_email: n.college_email,
        year_of_joining: n.year_of_joining ? parseInt(n.year_of_joining, 10) : null,
        phone_country_code: n.phone_country_code || undefined,
        phone_number: n.phone_number || undefined,
        major_id: n.major_id ? parseInt(n.major_id, 10) : undefined,
        minor_id: n.minor_id ? parseInt(n.minor_id, 10) : undefined,
        specialization_id: n.specialization_id ? parseInt(n.specialization_id, 10) : undefined,
        section: n.section || undefined,
        personal_email: n.personal_email || undefined,
        gender: n.gender || undefined,
        date_of_birth: n.date_of_birth || undefined,
        blood_group: n.blood_group || undefined,
        languages: n.languages || undefined,
        specially_abled: n.specially_abled === 'true' || n.specially_abled === '1',
      };
    });
    const valid = normalized.filter(
      (r) =>
        r.usn &&
        r.full_name &&
        r.college_email &&
        r.year_of_joining != null
    );
    if (valid.length === 0) {
      toast({ title: 'No valid rows (required: usn, full_name, college_email, year_of_joining)', status: 'error' });
      return;
    }
    if (valid.length !== normalized.length) {
      toast({ title: `${normalized.length - valid.length} rows skipped (missing required fields)`, status: 'info' });
    }
    setInserting(true);
    try {
      const result = await StudentProfileService.checkBulkDuplicates({
        school_id: parseInt(schoolId, 10),
        program_id: parseInt(programId, 10),
        students: valid,
      });
      setDuplicateResult(result);
      if (result.hasDuplicates && result.duplicateRows?.length > 0) {
        onDuplicateModalOpen();
        setInserting(false);
        return;
      }
      await StudentProfileService.bulkInsertStudents({
        school_id: parseInt(schoolId, 10),
        program_id: parseInt(programId, 10),
        students: valid,
      });
      toast({ title: `Inserted ${valid.length} students`, status: 'success' });
      setUploadedRows([]);
      setUploadedHeaders([]);
      setUploadFile(null);
    } catch (err) {
      toast({ title: err?.message || 'Bulk insert failed', status: 'error' });
    } finally {
      setInserting(false);
    }
  };

  const downloadDuplicateRowsExcel = () => {
    if (!duplicateResult?.duplicateRows?.length) return;
    const ws = XLSX.utils.json_to_sheet(duplicateResult.duplicateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Duplicate Rows');
    XLSX.writeFile(wb, 'duplicate_students.xlsx');
    toast({ title: 'Duplicate rows downloaded', status: 'success' });
    onDuplicateModalClose();
    setDuplicateResult(null);
    setInserting(false);
  };

  const closeDuplicateModalCancel = () => {
    onDuplicateModalClose();
    setDuplicateResult(null);
    setInserting(false);
  };

  return (
    <>
      <Box w="full" maxW="900px">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="lg" color="gray.800" fontWeight="700" letterSpacing="-0.02em" mb={2}>
              Add Students (Bulk Upload)
            </Heading>
            <Text color="gray.600" fontSize="md" lineHeight="tall">
              Select school and program, download the template, fill it, and upload your file to add students in bulk.
            </Text>
          </Box>

          <Card
            bg="white"
            borderRadius="xl"
            shadow="md"
            border="1px solid"
            borderColor="gray.100"
            overflow="hidden"
          >
            <CardBody py={7} px={{ base: 5, md: 8 }}>
              <Text fontWeight="600" color="gray.800" mb={5} fontSize="sm" textTransform="uppercase" letterSpacing="wider">
                School & Program
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700">School</FormLabel>
                  <Select
                    placeholder="Select school"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    bg="white"
                    borderColor="gray.300"
                    borderRadius="xl"
                    size="md"
                    h="44px"
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.25)' }}
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.abbreviation}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Program</FormLabel>
                  <Select
                    placeholder="Select program"
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    bg="white"
                    borderColor="gray.300"
                    borderRadius="xl"
                    size="md"
                    h="44px"
                    isDisabled={!schoolId}
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.25)' }}
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </Card>

          <Card bg="white" borderRadius="xl" shadow="md" border="1px solid" borderColor="gray.100" overflow="hidden">
            <CardBody py={7} px={{ base: 5, md: 8 }}>
              <Text fontWeight="600" color="gray.800" mb={2} fontSize="sm" textTransform="uppercase" letterSpacing="wider">
                Step 1 — Download template
              </Text>
              <Text fontSize="sm" color="gray.600" mb={5} lineHeight="tall">
                Choose optional columns to include. Required columns are always in the template. Download, fill the file, then upload in Step 2.
              </Text>
              <Wrap spacing={3} mb={6}>
                {REQUIRED_COLUMNS.map((col) => (
                  <WrapItem key={col}>
                    <Badge colorScheme="blue" fontSize="xs" px={2.5} py={1} borderRadius="full">
                      {col}
                    </Badge>
                  </WrapItem>
                ))}
                {OPTIONAL_COLUMNS.map((col) => (
                  <WrapItem key={col}>
                    <Checkbox
                      size="sm"
                      isChecked={selectedTemplateColumns.includes(col)}
                      onChange={() => toggleTemplateColumn(col)}
                      colorScheme="blue"
                      sx={{ '.chakra-checkbox__label': { fontSize: 'sm' } }}
                    >
                      {col}
                    </Checkbox>
                  </WrapItem>
                ))}
              </Wrap>
              <HStack spacing={4}>
                <Button
                  leftIcon={<DownloadIcon />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={downloadEmptyTemplate}
                  size="md"
                  borderRadius="xl"
                  fontWeight="600"
                  _hover={{ bg: 'blue.50', borderColor: 'blue.400' }}
                >
                  Download Excel template
                </Button>
                <Button
                  leftIcon={<DownloadIcon />}
                  colorScheme="green"
                  variant="outline"
                  onClick={handleDownloadLookup}
                  size="md"
                  borderRadius="xl"
                  fontWeight="600"
                  _hover={{ bg: 'green.50', borderColor: 'green.400' }}
                  isLoading={lookupLoading}
                >
                  Download lookup
                </Button>
              </HStack>
            </CardBody>
          </Card>

          <Card bg="white" borderRadius="xl" shadow="md" border="1px solid" borderColor="gray.100" overflow="hidden">
            <CardBody py={7} px={{ base: 5, md: 8 }}>
              <Text fontWeight="600" color="gray.800" mb={2} fontSize="sm" textTransform="uppercase" letterSpacing="wider">
                Step 2 — Upload file
              </Text>
              <FormControl mb={4}>
                <StyledFileInput
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  acceptLabel="CSV, XLSX"
                />
                {uploadFile && (
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    <strong>{uploadFile.name}</strong> — {uploadedRows.length} row(s) loaded. Click above to replace.
                  </Text>
                )}
              </FormControl>
              {uploadedRows.length > 0 && (
                <>
                  <Text fontWeight="600" color="gray.800" mb={3} fontSize="sm">
                    Preview
                  </Text>
                  <TableContainer
                    bg="gray.50"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.200"
                    maxH="320px"
                    overflowY="auto"
                    sx={{ '&::-webkit-scrollbar': { w: 2 }, '&::-webkit-scrollbar-thumb': { bg: 'gray.300', borderRadius: 'full' } }}
                  >
                    <Table size="sm" variant="simple">
                      <Thead bg="gray.100" position="sticky" top={0} zIndex={1}>
                        <Tr>
                          {uploadedHeaders.map((h) => (
                            <Th key={h} whiteSpace="nowrap" fontSize="xs" fontWeight="600" color="gray.700" py={3}>
                              {h}
                            </Th>
                          ))}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {uploadedRows.map((row, idx) => (
                          <Tr key={idx} _even={{ bg: 'white' }} _hover={{ bg: 'gray.50' }}>
                            {uploadedHeaders.map((h) => (
                              <Td key={h} whiteSpace="nowrap" fontSize="xs" py={2.5}>
                                {row[h] ?? ''}
                              </Td>
                            ))}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  <Button
                    mt={5}
                    colorScheme="blue"
                    size="md"
                    h="44px"
                    px={6}
                    borderRadius="xl"
                    fontWeight="600"
                    leftIcon={inserting ? <Spinner size="sm" /> : <AddIcon />}
                    onClick={handleProceedBulk}
                    isDisabled={inserting || !schoolId || !programId}
                    _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                    transition="all 0.2s"
                  >
                    {inserting ? 'Checking...' : 'Proceed with insertion'}
                  </Button>
                </>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Box>

      <Modal isOpen={isDuplicateModalOpen} onClose={closeDuplicateModalCancel} size="xl">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent borderRadius="xl" shadow="xl">
          <ModalHeader color="gray.800" fontWeight="600">Duplicate USNs detected</ModalHeader>
          <ModalBody>
            <Text mb={4} color="gray.600">
              {duplicateResult?.duplicateRows?.length || 0} row(s) have duplicate USNs (already in database or repeated in file). Insertion was cancelled.
            </Text>
            <Text fontWeight="600" mb={2}>
              Do you want to download the duplicate rows as an Excel file?
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={closeDuplicateModalCancel} borderRadius="xl">
              Close
            </Button>
            <Button colorScheme="blue" leftIcon={<AttachmentIcon />} onClick={downloadDuplicateRowsExcel} borderRadius="xl" fontWeight="600">
              Download duplicate rows (Excel)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
