import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  Flex,
  Wrap,
  WrapItem,
  useToast,
  Spinner,
  Badge,
  Divider,
  SimpleGrid,
  useBreakpointValue,
} from '@chakra-ui/react';
import { SearchIcon, CopyIcon, EmailIcon } from '@chakra-ui/icons';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';
import { StudentProfileService } from '../../services/studentProfile.service';

const CATEGORIES = [
  { value: 'students', label: 'Students' },
  { value: 'parents', label: 'Parents' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'staff', label: 'Staff / User logins' },
];

const BulkEmail = () => {
  const toast = useToast();
  const [category, setCategory] = useState('students');
  const [recipients, setRecipients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const limit = 100;

  // Filters (all categories)
  const [search, setSearch] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [programId, setProgramId] = useState('');
  const [majorId, setMajorId] = useState('');
  const [minorId, setMinorId] = useState('');
  const [specializationId, setSpecializationId] = useState('');
  const [yearOfJoining, setYearOfJoining] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [section, setSection] = useState('');
  const [gender, setGender] = useState('');
  const [isActive, setIsActive] = useState('');
  const [isRegistered, setIsRegistered] = useState('');
  const [parentType, setParentType] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [roleId, setRoleId] = useState('');

  // Metadata for filters
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [majors, setMajors] = useState([]);
  const [minors, setMinors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [roles, setRoles] = useState([]);

  const [selected, setSelected] = useState(new Set());

  const isMobile = useBreakpointValue({ base: true, md: false });

  // When school is selected, show only programs under that school (filters work together)
  const programsForSchool = useMemo(() => {
    if (!schoolId) return programs;
    const sid = parseInt(schoolId, 10);
    if (Number.isNaN(sid)) return programs;
    return programs.filter((p) => p.school_id === sid);
  }, [programs, schoolId]);

  const programIdsForSchool = useMemo(() => new Set(programsForSchool.map((p) => p.id)), [programsForSchool]);

  // Major belongs to program: filter by selected program, or by programs under selected school
  const majorsForSelection = useMemo(() => {
    if (programId) {
      const pid = parseInt(programId, 10);
      if (Number.isNaN(pid)) return majors;
      return majors.filter((m) => m.program_id === pid);
    }
    if (schoolId && programIdsForSchool.size > 0) return majors.filter((m) => programIdsForSchool.has(m.program_id));
    return majors;
  }, [majors, programId, programIdsForSchool, schoolId]);

  // Minor belongs to school: filter by selected school
  const minorsForSelection = useMemo(() => {
    if (!schoolId) return minors;
    const sid = parseInt(schoolId, 10);
    if (Number.isNaN(sid)) return minors;
    return minors.filter((m) => m.school_id === sid);
  }, [minors, schoolId]);

  // Specialization belongs to program: filter by selected program, or by programs under selected school
  const specializationsForSelection = useMemo(() => {
    if (programId) {
      const pid = parseInt(programId, 10);
      if (Number.isNaN(pid)) return specializations;
      return specializations.filter((s) => s.program_id === pid);
    }
    if (schoolId && programIdsForSchool.size > 0) return specializations.filter((s) => programIdsForSchool.has(s.program_id));
    return specializations;
  }, [specializations, programId, programIdsForSchool, schoolId]);

  const loadMetadata = useCallback(async () => {
    try {
      const [schoolsData, programsData, majorsData, minorsData, specsData] = await Promise.all([
        StudentProfileService.getSchools(),
        StudentProfileService.getPrograms(),
        StudentProfileService.getMajors(),
        StudentProfileService.getMinors(),
        StudentProfileService.getSpecializations(),
      ]);
      setSchools(Array.isArray(schoolsData) ? schoolsData : []);
      setPrograms(Array.isArray(programsData) ? programsData : []);
      setMajors(Array.isArray(majorsData) ? majorsData : []);
      setMinors(Array.isArray(minorsData) ? minorsData : []);
      setSpecializations(Array.isArray(specsData) ? specsData : []);
    } catch (e) {
      console.error('Load metadata:', e);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const buildParams = useCallback(() => {
    const params = { category, page, limit, search: search.trim() || undefined };
    if (category === 'students') {
      if (schoolId) params.school_id = parseInt(schoolId, 10);
      if (programId) params.program_id = parseInt(programId, 10);
      if (majorId) params.major_id = parseInt(majorId, 10);
      if (minorId) params.minor_id = parseInt(minorId, 10);
      if (specializationId) params.specialization_id = parseInt(specializationId, 10);
      if (yearOfJoining) params.year_of_joining = parseInt(yearOfJoining, 10);
      if (currentYear) params.current_year = parseInt(currentYear, 10);
      if (currentSemester) params.current_semester = parseInt(currentSemester, 10);
      if (section) params.section = section;
      if (gender) params.gender = gender;
      if (isActive !== '') params.is_active = isActive;
      if (isRegistered !== '') params.is_registered = isRegistered;
    } else if (category === 'parents') {
      if (parentType) params.parent_type = parentType;
      if (schoolId) params.school_id = parseInt(schoolId, 10);
      if (programId) params.program_id = parseInt(programId, 10);
    } else if (category === 'alumni') {
      if (graduationYear) params.graduation_year = parseInt(graduationYear, 10);
      if (institutionName) params.institution_name = institutionName;
    } else if (category === 'staff') {
      if (roleId) params.role_id = parseInt(roleId, 10);
      if (isActive !== '') params.is_active = isActive;
    }
    return params;
  }, [category, page, limit, search, schoolId, programId, majorId, minorId, specializationId, yearOfJoining, currentYear, currentSemester, section, gender, isActive, isRegistered, parentType, graduationYear, institutionName, roleId]);

  const fetchRecipients = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = buildParams();
      const data = await PlacementService.getEmailRecipients(params);
      setRecipients(data.recipients || []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      if (data.roles) setRoles(data.roles);
      setSelected(new Set());
    } catch (e) {
      toast({
        title: 'Failed to load recipients',
        description: e?.message || 'Please try again.',
        status: 'error',
        isClosable: true,
      });
      setRecipients([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [buildParams, toast]);

  useEffect(() => {
    if (category === 'staff' && roles.length === 0) {
      PlacementService.getEmailRecipients({ category: 'staff', limit: 1 })
        .then((data) => { if (data.roles && data.roles.length) setRoles(data.roles); })
        .catch(() => {});
    }
  }, [category]);

  useEffect(() => {
    if (hasSearched && page > 1) fetchRecipients();
  }, [page]);

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    const ids = recipients.map((r) => r.id);
    const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const selectedRecipients = recipients.filter((r) => selected.has(r.id));
  const selectedNames = selectedRecipients.map((r) => r.name).filter(Boolean);
  const selectedEmails = selectedRecipients.map((r) => r.email).filter(Boolean);
  const emailString = selectedEmails.join(', ');

  const copyEmails = () => {
    if (!emailString) {
      toast({ title: 'No emails selected', status: 'info', isClosable: true });
      return;
    }
    navigator.clipboard.writeText(emailString).then(
      () => toast({ title: 'Emails copied to clipboard', description: 'Paste into Gmail To/BCC for bulk mailing.', status: 'success', isClosable: true }),
      () => toast({ title: 'Copy failed', status: 'error', isClosable: true })
    );
  };

  const renderFilters = () => {
    if (category === 'students') {
      return (
        <Wrap spacing={3}>
          <WrapItem>
            <Select
              placeholder="School"
              value={schoolId}
              onChange={(e) => {
                const newSchoolId = e.target.value;
                setSchoolId(newSchoolId);
                const sid = newSchoolId ? parseInt(newSchoolId, 10) : null;
                const newProgramIds = sid && !Number.isNaN(sid) ? new Set(programs.filter((p) => p.school_id === sid).map((p) => p.id)) : new Set();
                if (programId) {
                  const belongs = !sid || programs.some((p) => p.id === parseInt(programId, 10) && p.school_id === sid);
                  if (!belongs) setProgramId('');
                }
                if (minorId && sid && !Number.isNaN(sid)) {
                  const minorBelongs = minors.some((m) => m.id === parseInt(minorId, 10) && m.school_id === sid);
                  if (!minorBelongs) setMinorId('');
                }
                if (majorId && newProgramIds.size > 0) {
                  const major = majors.find((m) => m.id === parseInt(majorId, 10));
                  if (major && !newProgramIds.has(major.program_id)) setMajorId('');
                }
                if (specializationId && newProgramIds.size > 0) {
                  const spec = specializations.find((s) => s.id === parseInt(specializationId, 10));
                  if (spec && !newProgramIds.has(spec.program_id)) setSpecializationId('');
                }
              }}
              bg="white"
              w={{ base: 'full', sm: '160px' }}
              size="sm"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name || s.abbreviation}</option>
              ))}
            </Select>
          </WrapItem>
          <WrapItem>
            <Select
              placeholder="Program"
              value={programId}
              onChange={(e) => {
                const newProgramId = e.target.value;
                setProgramId(newProgramId);
                const pid = newProgramId ? parseInt(newProgramId, 10) : null;
                if (majorId && pid && !Number.isNaN(pid)) {
                  const major = majors.find((m) => m.id === parseInt(majorId, 10));
                  if (major && major.program_id !== pid) setMajorId('');
                }
                if (specializationId && pid && !Number.isNaN(pid)) {
                  const spec = specializations.find((s) => s.id === parseInt(specializationId, 10));
                  if (spec && spec.program_id !== pid) setSpecializationId('');
                }
              }}
              bg="white"
              w={{ base: 'full', sm: '160px' }}
              size="sm"
            >
              {programsForSchool.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </WrapItem>
          <WrapItem>
            <Select placeholder="Major" value={majorId} onChange={(e) => setMajorId(e.target.value)} bg="white" w={{ base: 'full', sm: '140px' }} size="sm">
              {majorsForSelection.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </WrapItem>
          <WrapItem>
            <Select placeholder="Minor" value={minorId} onChange={(e) => setMinorId(e.target.value)} bg="white" w={{ base: 'full', sm: '140px' }} size="sm">
              {minorsForSelection.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </WrapItem>
          <WrapItem>
            <Select placeholder="Specialization" value={specializationId} onChange={(e) => setSpecializationId(e.target.value)} bg="white" w={{ base: 'full', sm: '140px' }} size="sm">
              {specializationsForSelection.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </WrapItem>
          <WrapItem>
            <Input placeholder="Year of joining" value={yearOfJoining} onChange={(e) => setYearOfJoining(e.target.value)} bg="white" w="120px" size="sm" />
          </WrapItem>
          <WrapItem>
            <Select placeholder="Current year" value={currentYear} onChange={(e) => setCurrentYear(e.target.value)} bg="white" w="120px" size="sm">
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </WrapItem>
          <WrapItem>
            <Select placeholder="Semester" value={currentSemester} onChange={(e) => setCurrentSemester(e.target.value)} bg="white" w="100px" size="sm">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </WrapItem>
          <WrapItem>
            <Input placeholder="Section" value={section} onChange={(e) => setSection(e.target.value)} bg="white" w="100px" size="sm" />
          </WrapItem>
          <WrapItem>
            <Select placeholder="Gender" value={gender} onChange={(e) => setGender(e.target.value)} bg="white" w="110px" size="sm">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </WrapItem>
          <WrapItem>
            <Select placeholder="Active" value={isActive} onChange={(e) => setIsActive(e.target.value)} bg="white" w="100px" size="sm">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </WrapItem>
          <WrapItem>
            <Select placeholder="Registered" value={isRegistered} onChange={(e) => setIsRegistered(e.target.value)} bg="white" w="110px" size="sm">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </WrapItem>
        </Wrap>
      );
    }
    if (category === 'parents') {
      return (
        <Wrap spacing={3}>
          <WrapItem>
            <Select placeholder="Parent type" value={parentType} onChange={(e) => setParentType(e.target.value)} bg="white" w="140px" size="sm">
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
            </Select>
          </WrapItem>
          <WrapItem>
            <Select
              placeholder="Student school"
              value={schoolId}
              onChange={(e) => {
                const newSchoolId = e.target.value;
                setSchoolId(newSchoolId);
                if (newSchoolId && programId) {
                  const sid = parseInt(newSchoolId, 10);
                  const belongs = programs.some((p) => p.id === parseInt(programId, 10) && p.school_id === sid);
                  if (!belongs) setProgramId('');
                }
              }}
              bg="white"
              w="180px"
              size="sm"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name || s.abbreviation}</option>
              ))}
            </Select>
          </WrapItem>
          <WrapItem>
            <Select placeholder="Student program" value={programId} onChange={(e) => setProgramId(e.target.value)} bg="white" w="180px" size="sm">
              {programsForSchool.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </WrapItem>
        </Wrap>
      );
    }
    if (category === 'alumni') {
      return (
        <Wrap spacing={3}>
          <WrapItem>
            <Input placeholder="Graduation year" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} bg="white" w="140px" size="sm" />
          </WrapItem>
          <WrapItem>
            <Input placeholder="Institution name" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} bg="white" w="200px" size="sm" />
          </WrapItem>
        </Wrap>
      );
    }
    if (category === 'staff') {
      return (
        <Wrap spacing={3}>
          <WrapItem>
            <Select placeholder="Role" value={roleId} onChange={(e) => setRoleId(e.target.value)} bg="white" w="160px" size="sm">
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </WrapItem>
          <WrapItem>
            <Select placeholder="Active" value={isActive} onChange={(e) => setIsActive(e.target.value)} bg="white" w="100px" size="sm">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </WrapItem>
        </Wrap>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg" color="#20343c">
            Email
          </Heading>
          <Text color="gray.600">
            Filter by category (students, parents, alumni, staff), apply filters, select recipients, and copy emails for Gmail bulk mailing.
          </Text>

          <Box bg="white" p={4} borderRadius="lg" shadow="sm">
            <Text fontWeight="semibold" mb={2}>Category</Text>
            <Flex flexWrap="wrap" gap={2} mb={4}>
              {CATEGORIES.map((c) => (
                <Button
                  key={c.value}
                  size="sm"
                  colorScheme={category === c.value ? 'blue' : 'gray'}
                  variant={category === c.value ? 'solid' : 'outline'}
                  onClick={() => { setCategory(c.value); setPage(1); setRecipients([]); setHasSearched(false); setSelected(new Set()); }}
                >
                  {c.label}
                </Button>
              ))}
            </Flex>

            <Text fontWeight="semibold" mb={2}>Filters</Text>
            {renderFilters()}
            <HStack mt={4} spacing={3}>
              <InputGroup maxW="280px">
                <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" /></InputLeftElement>
                <Input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} bg="white" size="sm" />
              </InputGroup>
              <Button leftIcon={<EmailIcon />} colorScheme="blue" size="sm" onClick={fetchRecipients} isLoading={loading}>
                Apply filters & load
              </Button>
            </HStack>
          </Box>

          {hasSearched && (
            <>
              <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                <HStack justify="space-between" mb={3}>
                  <Text fontWeight="semibold">Recipients ({total} total)</Text>
                  {totalPages > 1 && (
                    <HStack>
                      <Button size="xs" isDisabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                      <Text fontSize="sm">Page {page} of {totalPages}</Text>
                      <Button size="xs" isDisabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                    </HStack>
                  )}
                </HStack>
                {loading ? (
                  <Flex justify="center" py={8}><Spinner /></Flex>
                ) : (
                  <TableContainer>
                    <Table size="sm">
                      <Thead>
                        <Tr bg="gray.50">
                          <Th w="40px"><Checkbox isChecked={recipients.length > 0 && recipients.every((r) => selected.has(r.id))} isIndeterminate={selected.size > 0 && selected.size < recipients.length} onChange={togglePage} /></Th>
                          <Th>Name</Th>
                          <Th>Email</Th>
                          {category === 'students' && <Th>Email type</Th>}
                          {category === 'staff' && <Th>Role</Th>}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {recipients.map((r) => (
                          <Tr key={r.id} _hover={{ bg: 'gray.50' }}>
                            <Td><Checkbox isChecked={selected.has(r.id)} onChange={() => toggleOne(r.id)} /></Td>
                            <Td>{r.name || '—'}</Td>
                            <Td>{r.email || '—'}</Td>
                            {category === 'students' && <Td><Badge size="sm">{r.emailType || '—'}</Badge></Td>}
                            {category === 'staff' && <Td>{r.role_name || '—'}</Td>}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
                {!loading && recipients.length === 0 && (
                  <Text color="gray.500" py={6} textAlign="center">No recipients with email found for the current filters.</Text>
                )}
              </Box>

              <Box bg="white" p={4} borderRadius="lg" shadow="sm">
                <Heading size="sm" mb={2}>Selected ({selectedNames.length})</Heading>
                {selectedNames.length > 0 ? (
                  <>
                    <Flex flexWrap="wrap" gap={2} mb={3} maxH="120px" overflowY="auto">
                      {selectedNames.map((name) => (
                        <Badge key={name} colorScheme="blue" variant="subtle" px={2} py={1}>{name}</Badge>
                      ))}
                    </Flex>
                    <Button leftIcon={<CopyIcon />} colorScheme="teal" size="sm" onClick={copyEmails}>
                      Copy emails (for Gmail To/BCC)
                    </Button>
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Emails are copied as a comma-separated list. Paste into Gmail&apos;s To or BCC field for bulk mailing.
                    </Text>
                  </>
                ) : (
                  <Text color="gray.500">Select recipients above to see names and copy their emails.</Text>
                )}
              </Box>
            </>
          )}

          {!hasSearched && (
            <Text color="gray.500" py={4}>Choose a category, set filters if needed, then click &quot;Apply filters & load&quot; to load recipients.</Text>
          )}
        </VStack>
      </Container>
    </AdminLayout>
  );
};

export default BulkEmail;
