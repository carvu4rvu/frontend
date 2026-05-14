import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useToast,
  Tooltip,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { QuestionIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { PlacementService } from '../../services/placement.service';

/** Multi-select filter: click to open, shows selected options as tags */
const FilterMultiSelect = ({ label, options, value = [], onChange, placeholder = 'Select...', isDisabled, colorScheme = 'teal', getLabel = (o) => o?.name || o?.abbreviation || String(o) }) => {
  const selected = options.filter((o) => value.includes(o.id));
  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(next);
  };
  const remove = (id) => onChange(value.filter((v) => v !== id));

  return (
    <Box flex="1" minW="120px">
      <Text fontSize="xs" fontWeight="600" color="gray.600" mb={0.5}>{label}</Text>
      <Popover placement="bottom-start" isLazy>
        <PopoverTrigger>
          <Box
            as="button"
            type="button"
            w="100%"
            minH="44px"
            px={2}
            py={1.5}
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.200"
            bg={isDisabled ? 'gray.100' : 'gray.50'}
            _hover={!isDisabled && { borderColor: 'gray.300', bg: 'white' }}
            _focus={{ outline: 'none', borderColor: 'teal.400', boxShadow: '0 0 0 1px var(--chakra-colors-teal-400)' }}
            textAlign="left"
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            opacity={isDisabled ? 0.7 : 1}
          >
            {selected.length > 0 ? (
              <Wrap spacing={1}>
                {selected.map((o) => (
                  <WrapItem key={o.id}>
                    <Tag size="sm" colorScheme={colorScheme} borderRadius="md" fontSize="xs">
                      <TagLabel>{getLabel(o)}</TagLabel>
                      <TagCloseButton onClick={(e) => { e.stopPropagation(); remove(o.id); }} />
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            ) : (
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">{placeholder}</Text>
                <ChevronDownIcon />
              </HStack>
            )}
          </Box>
        </PopoverTrigger>
        <PopoverContent w="auto" minW="200px" maxH="240px" overflowY="auto" _focus={{ outline: 'none' }}>
          <PopoverBody p={2}>
            <VStack align="stretch" spacing={0}>
              {options.map((o) => (
                <Checkbox
                  key={o.id}
                  size="sm"
                  isChecked={value.includes(o.id)}
                  onChange={() => toggle(o.id)}
                  py={1.5}
                  px={2}
                  _hover={{ bg: 'gray.50' }}
                  borderRadius="md"
                >
                  {getLabel(o)}
                </Checkbox>
              ))}
              {options.length === 0 && <Text fontSize="sm" color="gray.500" py={2}>No options</Text>}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};

const initialEligibilityState = {
  min_cgpa: '',
  max_cgpa: '',
  max_active_backlogs: '',
  max_backlog_history: '',
  max_total_offers: '',
  eligible_years: [],
  eligible_semesters: [],
  allowed_school_ids: [],
  allowed_program_ids: [],
  allowed_major_ids: [],
  allowed_specialization_ids: [],
  joining_years: [],
  graduation_years: [],
  allow_already_placed: true,
  max_existing_ctc_lpa: '',
  min_new_ctc_lpa: '',
  min_ctc_multiplier: '',
  count_offcampus_offers: true,
  no_disciplinary_action: true,
  no_active_placement_violation: true,
  admin_override_allowed: false
};

const DriveEligibilityModal = ({ isOpen, onClose, driveId, schoolList: schoolListProp = [], onSuccess }) => {
  const toast = useToast();
  const [eligibilityForm, setEligibilityForm] = useState(initialEligibilityState);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [schoolList, setSchoolList] = useState(schoolListProp);
  const [programList, setProgramList] = useState([]);
  const [specializationList, setSpecializationList] = useState([]);
  const [majorList, setMajorList] = useState([]);

  useEffect(() => {
    if (isOpen && schoolListProp.length) setSchoolList(schoolListProp);
  }, [isOpen, schoolListProp]);

  useEffect(() => {
    if (!eligibilityForm.allowed_school_ids?.length) {
      setProgramList([]);
      return;
    }
    PlacementService.getPrograms().then((all) => {
      const filtered = (all || []).filter((p) => eligibilityForm.allowed_school_ids.includes(p.school_id));
      setProgramList(filtered);
    }).catch(() => setProgramList([]));
  }, [eligibilityForm.allowed_school_ids?.join(',')]);

  useEffect(() => {
    if (!eligibilityForm.allowed_program_ids?.length) {
      setSpecializationList([]);
      setMajorList([]);
      return;
    }
    const progIds = eligibilityForm.allowed_program_ids;
    Promise.all([
      PlacementService.getSpecializations().then((all) => (all || []).filter((s) => progIds.includes(s.program_id))),
      PlacementService.getMajors().then((all) => (all || []).filter((m) => progIds.includes(m.program_id)))
    ]).then(([specs, majors]) => {
      setSpecializationList(specs);
      setMajorList(majors);
    }).catch(() => { setSpecializationList([]); setMajorList([]); });
  }, [eligibilityForm.allowed_program_ids?.join(',')]);

  useEffect(() => {
    if (!isOpen || !driveId) return;
    setEligibilityForm(initialEligibilityState);
    setLoading(true);
    PlacementService.getDriveEligibility(driveId)
      .then((elig) => {
        if (elig) {
          setEligibilityForm({
            min_cgpa: elig.min_cgpa ?? '',
            max_cgpa: elig.max_cgpa ?? '',
            max_active_backlogs: elig.max_active_backlogs ?? '',
            max_backlog_history: elig.max_backlog_history ?? '',
            max_total_offers: elig.max_total_offers ?? '',
            eligible_years: Array.isArray(elig.eligible_years) ? elig.eligible_years : [],
            eligible_semesters: Array.isArray(elig.eligible_semesters) ? elig.eligible_semesters : [],
            allowed_school_ids: Array.isArray(elig.allowed_school_ids) ? elig.allowed_school_ids : [],
            allowed_program_ids: Array.isArray(elig.allowed_program_ids) ? elig.allowed_program_ids : [],
            allowed_major_ids: Array.isArray(elig.allowed_major_ids) ? elig.allowed_major_ids : [],
            allowed_specialization_ids: Array.isArray(elig.allowed_specialization_ids) ? elig.allowed_specialization_ids : [],
            joining_years: Array.isArray(elig.joining_years) ? elig.joining_years : [],
            graduation_years: Array.isArray(elig.graduation_years) ? elig.graduation_years : [],
            allow_already_placed: elig.allow_already_placed !== false,
            max_existing_ctc_lpa: elig.max_existing_ctc_lpa ?? '',
            min_new_ctc_lpa: elig.min_new_ctc_lpa ?? '',
            min_ctc_multiplier: elig.min_ctc_multiplier ?? '',
            count_offcampus_offers: elig.count_offcampus_offers !== false,
            no_disciplinary_action: elig.no_disciplinary_action !== false,
            no_active_placement_violation: elig.no_active_placement_violation !== false,
            admin_override_allowed: elig.admin_override_allowed === true
          });
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen, driveId]);

  const handleSchoolChange = (vals) => {
    setEligibilityForm((prev) => ({ ...prev, allowed_school_ids: vals, allowed_program_ids: [], allowed_major_ids: [], allowed_specialization_ids: [] }));
  };

  const handleProgramChange = (vals) => {
    setEligibilityForm((prev) => ({ ...prev, allowed_program_ids: vals, allowed_major_ids: [], allowed_specialization_ids: [] }));
  };

  const saveEligibility = async () => {
    if (!driveId) return;
    setLoading(true);
    try {
      const res = await PlacementService.upsertDriveEligibility(driveId, eligibilityForm);
      const added = res?.addedToProcess ?? 0;
      const notified = res?.notified ?? 0;
      if (added > 0 || notified > 0) {
        const parts = [];
        if (added > 0) parts.push(`${added} newly added to process`);
        if (notified > 0) parts.push(`notification sent to ${notified} student(s)`);
        if (added === 0 && notified > 0) parts.unshift('0 newly added (all eligible were already in process)');
        toast({
          title: 'Eligibility saved',
          description: parts.join('; '),
          status: 'success',
          duration: 5000,
        });
      } else {
        toast({ title: 'Eligibility saved', status: 'success' });
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      toast({ title: 'Failed to save eligibility', description: e?.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const params = { limit: 10000, opt_in_only: true };
      if (eligibilityForm.allowed_school_ids?.length) params.school_ids = eligibilityForm.allowed_school_ids;
      if (eligibilityForm.allowed_program_ids?.length) params.program_ids = eligibilityForm.allowed_program_ids;
      const data = await PlacementService.getAllStudents(params);
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Auto-load all students when modal opens and eligibility has been loaded
  useEffect(() => {
    if (isOpen && driveId && !loading) {
      fetchStudents();
    }
  }, [isOpen, driveId, loading]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(6px)" />
      <ModalContent maxH="90vh" bg="gray.50" borderRadius="xl" shadow="2xl" overflow="hidden">
        <ModalHeader
          py={5}
          px={6}
          bg="linear-gradient(135deg, #2d3748 0%, #1a202c 100%)"
          color="white"
          borderBottomWidth="1px"
          borderColor="whiteAlpha.200"
        >
          <Heading size="md" fontWeight="600">Placement Drive Eligibility</Heading>
          <Text fontSize="sm" color="whiteAlpha.800" mt={1}>Configure criteria and preview eligible students</Text>
        </ModalHeader>
        <ModalCloseButton color="white" top={5} right={4} _hover={{ bg: 'whiteAlpha.200' }} />
        <ModalBody pb={4} pt={4} px={5}>
          {loading ? (
            <Flex justify="center" align="center" py={16}><Spinner size="xl" color="teal.500" thickness="3px" /></Flex>
          ) : (
            <VStack align="stretch" spacing={3}>
              <Box
                bg="white"
                p={3}
                borderRadius="lg"
                shadow="sm"
                borderWidth="1px"
                borderColor="gray.200"
                borderLeftWidth="4px"
                borderLeftColor="teal.500"
              >
                <Heading size="sm" mb={2} color="gray.800" fontWeight="600">Filters</Heading>
                <VStack align="stretch" spacing={1}>
                  {/* Row 1: School / Program / Specialization / Major */}
                  <Flex gap={2} flexWrap="wrap" align="flex-end" pb={1.5} borderBottomWidth="1px" borderColor="gray.100">
                    <FilterMultiSelect
                      label="Schools"
                      options={schoolList}
                      value={eligibilityForm.allowed_school_ids || []}
                      onChange={handleSchoolChange}
                      placeholder="Select schools"
                      getLabel={(s) => s.name || s.abbreviation}
                      colorScheme="teal"
                    />
                    <FilterMultiSelect
                      label="Programs"
                      options={programList}
                      value={eligibilityForm.allowed_program_ids || []}
                      onChange={handleProgramChange}
                      placeholder="Select programs"
                      isDisabled={!eligibilityForm.allowed_school_ids?.length}
                      colorScheme="purple"
                    />
                    <FilterMultiSelect
                      label="Specializations"
                      options={specializationList}
                      value={eligibilityForm.allowed_specialization_ids || []}
                      onChange={(vals) => setEligibilityForm((p) => ({ ...p, allowed_specialization_ids: vals }))}
                      placeholder="Click to select"
                      isDisabled={!eligibilityForm.allowed_program_ids?.length}
                      colorScheme="blue"
                    />
                    <FilterMultiSelect
                      label="Majors"
                      options={majorList}
                      value={eligibilityForm.allowed_major_ids || []}
                      onChange={(vals) => setEligibilityForm((p) => ({ ...p, allowed_major_ids: vals }))}
                      placeholder="Click to select"
                      isDisabled={!eligibilityForm.allowed_program_ids?.length}
                      colorScheme="cyan"
                    />
                  </Flex>
                  {/* Row 2: Academic criteria */}
                  <Flex gap={2} flexWrap="wrap" align="center" py={1.5} borderBottomWidth="1px" borderColor="gray.100">
                    <HStack spacing={1} align="center"><Text fontSize="xs" fontWeight="600" color="gray.600" whiteSpace="nowrap">Min CGPA</Text><Input type="number" step="0.01" placeholder="7.5" value={eligibilityForm.min_cgpa} onChange={(e) => setEligibilityForm((p) => ({ ...p, min_cgpa: e.target.value }))} size="sm" w="70px" h="28px" bg="gray.50" /></HStack>
                    <HStack spacing={1} align="center"><Text fontSize="xs" fontWeight="600" color="gray.600" whiteSpace="nowrap">Max CGPA</Text><Input type="number" step="0.01" value={eligibilityForm.max_cgpa} onChange={(e) => setEligibilityForm((p) => ({ ...p, max_cgpa: e.target.value }))} size="sm" w="70px" h="28px" bg="gray.50" /></HStack>
                    <HStack spacing={1} align="center"><Text fontSize="xs" fontWeight="600" color="gray.600" whiteSpace="nowrap">Max Backlogs</Text><Input type="number" value={eligibilityForm.max_active_backlogs} onChange={(e) => setEligibilityForm((p) => ({ ...p, max_active_backlogs: e.target.value }))} size="sm" w="56px" h="28px" bg="gray.50" /></HStack>
                    <HStack spacing={1} align="center"><Text fontSize="xs" fontWeight="600" color="gray.600" whiteSpace="nowrap">Backlog Hist</Text><Input type="number" value={eligibilityForm.max_backlog_history} onChange={(e) => setEligibilityForm((p) => ({ ...p, max_backlog_history: e.target.value }))} size="sm" w="56px" h="28px" bg="gray.50" /></HStack>
                    <HStack spacing={1} align="center"><Text fontSize="xs" fontWeight="600" color="gray.600" whiteSpace="nowrap">Max Offers</Text><Input type="number" placeholder="2" value={eligibilityForm.max_total_offers} onChange={(e) => setEligibilityForm((p) => ({ ...p, max_total_offers: e.target.value }))} size="sm" w="56px" h="28px" bg="gray.50" /></HStack>
                    <HStack spacing={1} align="center"><Text fontSize="xs" fontWeight="600" color="gray.600" whiteSpace="nowrap">Join Yrs</Text><Input placeholder="2021,2022" value={Array.isArray(eligibilityForm.joining_years) ? eligibilityForm.joining_years.join(',') : ''} onChange={(e) => setEligibilityForm((p) => ({ ...p, joining_years: e.target.value.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !Number.isNaN(n)) }))} size="sm" w="90px" h="28px" bg="gray.50" /></HStack>
                    <HStack spacing={1} align="center"><Text fontSize="xs" fontWeight="600" color="gray.600" whiteSpace="nowrap">Grad Yrs</Text><Input placeholder="2025,2026" value={Array.isArray(eligibilityForm.graduation_years) ? eligibilityForm.graduation_years.join(',') : ''} onChange={(e) => setEligibilityForm((p) => ({ ...p, graduation_years: e.target.value.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !Number.isNaN(n)) }))} size="sm" w="90px" h="28px" bg="gray.50" /></HStack>
                  </Flex>
                  {/* Row 3: CTC fields */}
                  <Flex gap={2} flexWrap="wrap" align="center" py={1.5} borderBottomWidth="1px" borderColor="gray.100">
                    <HStack spacing={1} align="center"><Text fontSize="xs" fontWeight="600" color="gray.600" whiteSpace="nowrap">Max CTC</Text><Tooltip label="Block if current CTC above this" hasArrow><Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={3} /></Tooltip><Input type="number" step="0.5" placeholder="8" value={eligibilityForm.max_existing_ctc_lpa} onChange={(e) => setEligibilityForm((p) => ({ ...p, max_existing_ctc_lpa: e.target.value }))} size="sm" w="60px" h="28px" bg="gray.50" /></HStack>
                    <HStack spacing={1} align="center"><Text fontSize="xs" fontWeight="600" color="gray.600" whiteSpace="nowrap">Min New CTC</Text><Tooltip label="New offer must be ≥ this" hasArrow><Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={3} /></Tooltip><Input type="number" step="0.5" placeholder="30" value={eligibilityForm.min_new_ctc_lpa} onChange={(e) => setEligibilityForm((p) => ({ ...p, min_new_ctc_lpa: e.target.value }))} size="sm" w="60px" h="28px" bg="gray.50" /></HStack>
                    <HStack spacing={1} align="center"><Text fontSize="xs" fontWeight="600" color="gray.600" whiteSpace="nowrap">CTC Mult</Text><Tooltip label="New CTC ≥ current × this" hasArrow><Box as={QuestionIcon} color="gray.400" cursor="help" boxSize={3} /></Tooltip><Input type="number" step="0.1" placeholder="1.5" value={eligibilityForm.min_ctc_multiplier} onChange={(e) => setEligibilityForm((p) => ({ ...p, min_ctc_multiplier: e.target.value }))} size="sm" w="60px" h="28px" bg="gray.50" /></HStack>
                  </Flex>
                  {/* Row 4: Checkboxes */}
                  <Flex gap={4} flexWrap="wrap" pt={1.5}>
                    <Checkbox size="sm" isChecked={eligibilityForm.allow_already_placed} onChange={(e) => setEligibilityForm((p) => ({ ...p, allow_already_placed: e.target.checked }))}>Allow Already Placed</Checkbox>
                    <Checkbox size="sm" isChecked={eligibilityForm.count_offcampus_offers} onChange={(e) => setEligibilityForm((p) => ({ ...p, count_offcampus_offers: e.target.checked }))}>Count Off-Campus</Checkbox>
                    <Checkbox size="sm" isChecked={eligibilityForm.no_disciplinary_action} onChange={(e) => setEligibilityForm((p) => ({ ...p, no_disciplinary_action: e.target.checked }))}>No Disciplinary Action</Checkbox>
                    <Checkbox size="sm" isChecked={eligibilityForm.no_active_placement_violation} onChange={(e) => setEligibilityForm((p) => ({ ...p, no_active_placement_violation: e.target.checked }))}>No Placement Violation</Checkbox>
                    <Checkbox size="sm" isChecked={eligibilityForm.admin_override_allowed} onChange={(e) => setEligibilityForm((p) => ({ ...p, admin_override_allowed: e.target.checked }))}>Admin Override</Checkbox>
                  </Flex>
                </VStack>
              </Box>
              <Box
                bg="white"
                p={3}
                borderRadius="lg"
                shadow="sm"
                borderWidth="1px"
                borderColor="gray.200"
                borderLeftWidth="4px"
                borderLeftColor="blue.400"
              >
                <HStack mb={2} justify="space-between" flexWrap="wrap" gap={2}>
                  <Heading size="sm" color="gray.800" fontWeight="600">Preview: Eligible Students</Heading>
                  <Button size="sm" colorScheme="teal" variant="outline" onClick={fetchStudents} isLoading={studentsLoading}>Refresh list</Button>
                </HStack>
                <Box maxH="320px" overflowY="auto" borderRadius="md" borderWidth="1px" borderColor="gray.100">
                  {studentsLoading ? (
                    <Flex justify="center" py={8}><Spinner size="md" color="teal.500" /></Flex>
                  ) : students.length === 0 ? (
                    <Text color="gray.500" fontSize="sm" py={6} px={4} textAlign="center">Students load automatically. Adjust filters above to narrow the list.</Text>
                  ) : (
                    <Table size="sm" variant="simple"><Thead bg="gray.50" position="sticky" top={0} zIndex={1}><Tr><Th>USN</Th><Th>Name</Th><Th>School</Th><Th>Program</Th></Tr></Thead>
                      <Tbody>{students.slice(0, 100).map((s) => <Tr key={s.usn} _hover={{ bg: 'gray.50' }}><Td fontWeight="500">{s.usn}</Td><Td>{s.full_name || s.name}</Td><Td>{s.school || '-'}</Td><Td>{s.program || '-'}</Td></Tr>)}</Tbody>
                    </Table>
                  )}
                  {!studentsLoading && students.length > 100 && <Text fontSize="xs" color="gray.500" px={3} py={2} borderTopWidth="1px" borderColor="gray.100">Showing 100 of {students.length} students</Text>}
                </Box>
              </Box>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter py={4} px={6} borderTopWidth="1px" borderColor="gray.200" bg="white" gap={3}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button colorScheme="teal" onClick={saveEligibility} isLoading={loading} fontWeight="600">Save Eligibility</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DriveEligibilityModal;
