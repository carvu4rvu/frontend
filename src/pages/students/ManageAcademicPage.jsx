import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  Flex,
  HStack,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DownloadIcon, DeleteIcon, WarningIcon } from '@chakra-ui/icons';
import * as XLSX from 'xlsx';
import { StudentProfileService } from '../../services/studentProfile.service';

export default function ManageAcademicPage() {
  const toast = useToast();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // New deletion state
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'school'|'program'|'major'|'minor'|'spec', id, name, studentCount }
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);
  const cancelDeleteRef = React.useRef();

  const [editingSchool, setEditingSchool] = useState(null);
  const [formName, setFormName] = useState('');
  const [formAbbreviation, setFormAbbreviation] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedMinorSchoolId, setSelectedMinorSchoolId] = useState('');
  const { isOpen: isProgramFormOpen, onOpen: onProgramFormOpen, onClose: onProgramFormClose } = useDisclosure();
  const { isOpen: isMinorFormOpen, onOpen: onMinorFormOpen, onClose: onMinorFormClose } = useDisclosure();
  const [editingProgram, setEditingProgram] = useState(null);
  const [formProgramName, setFormProgramName] = useState('');
  const [formProgramGraduationLevel, setFormProgramGraduationLevel] = useState('');
  const [formProgramMinDuration, setFormProgramMinDuration] = useState('');
  const [formProgramMaxDuration, setFormProgramMaxDuration] = useState('');
  const [programSaving, setProgramSaving] = useState(false);
  const [editingMinor, setEditingMinor] = useState(null);
  const [formMinorName, setFormMinorName] = useState('');
  const [minorSaving, setMinorSaving] = useState(false);
  const [selectedMajorSchoolId, setSelectedMajorSchoolId] = useState('');
  const [selectedMajorProgramId, setSelectedMajorProgramId] = useState('');
  const [selectedSpecSchoolId, setSelectedSpecSchoolId] = useState('');
  const [selectedSpecProgramId, setSelectedSpecProgramId] = useState('');
  const { isOpen: isMajorFormOpen, onOpen: onMajorFormOpen, onClose: onMajorFormClose } = useDisclosure();
  const { isOpen: isSpecFormOpen, onOpen: onSpecFormOpen, onClose: onSpecFormClose } = useDisclosure();
  const [editingMajor, setEditingMajor] = useState(null);
  const [formMajorName, setFormMajorName] = useState('');
  const [majorSaving, setMajorSaving] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [formSpecName, setFormSpecName] = useState('');
  const [specSaving, setSpecSaving] = useState(false);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const data = await StudentProfileService.getAcademyOverview();
      setSchools(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ title: 'Failed to load schools', description: e?.message, status: 'error' });
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    if (schools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(String(schools[0].id));
    }
    if (schools.length > 0 && selectedSchoolId && !schools.some((s) => String(s.id) === selectedSchoolId)) {
      setSelectedSchoolId(String(schools[0].id));
    }
  }, [schools, selectedSchoolId]);

  useEffect(() => {
    if (schools.length > 0 && !selectedMinorSchoolId) {
      setSelectedMinorSchoolId(String(schools[0].id));
    }
    if (schools.length > 0 && selectedMinorSchoolId && !schools.some((s) => String(s.id) === selectedMinorSchoolId)) {
      setSelectedMinorSchoolId(String(schools[0].id));
    }
  }, [schools, selectedMinorSchoolId]);

  const majorSchool = schools.find((s) => String(s.id) === selectedMajorSchoolId);
  const programsForMajorSchool = majorSchool?.programs || [];
  useEffect(() => {
    if (schools.length > 0 && !selectedMajorSchoolId) setSelectedMajorSchoolId(String(schools[0].id));
    if (schools.length > 0 && selectedMajorSchoolId && !schools.some((s) => String(s.id) === selectedMajorSchoolId)) {
      setSelectedMajorSchoolId(String(schools[0].id));
    }
  }, [schools, selectedMajorSchoolId]);
  useEffect(() => {
    if (programsForMajorSchool.length > 0 && (!selectedMajorProgramId || !programsForMajorSchool.some((p) => String(p.id) === selectedMajorProgramId))) {
      setSelectedMajorProgramId(String(programsForMajorSchool[0].id));
    }
    if (programsForMajorSchool.length === 0) setSelectedMajorProgramId('');
  }, [selectedMajorSchoolId, programsForMajorSchool, selectedMajorProgramId]);

  const specSchool = schools.find((s) => String(s.id) === selectedSpecSchoolId);
  const programsForSpecSchool = specSchool?.programs || [];
  useEffect(() => {
    if (schools.length > 0 && !selectedSpecSchoolId) setSelectedSpecSchoolId(String(schools[0].id));
    if (schools.length > 0 && selectedSpecSchoolId && !schools.some((s) => String(s.id) === selectedSpecSchoolId)) {
      setSelectedSpecSchoolId(String(schools[0].id));
    }
  }, [schools, selectedSpecSchoolId]);
  useEffect(() => {
    if (programsForSpecSchool.length > 0 && (!selectedSpecProgramId || !programsForSpecSchool.some((p) => String(p.id) === selectedSpecProgramId))) {
      setSelectedSpecProgramId(String(programsForSpecSchool[0].id));
    }
    if (programsForSpecSchool.length === 0) setSelectedSpecProgramId('');
  }, [selectedSpecSchoolId, programsForSpecSchool, selectedSpecProgramId]);

  const openAdd = () => {
    setEditingSchool(null);
    setFormName('');
    setFormAbbreviation('');
    onFormOpen();
  };

  const openEdit = (school) => {
    setEditingSchool(school);
    setFormName(school.name || '');
    setFormAbbreviation(school.abbreviation || '');
    onFormOpen();
  };

  const handleFormSubmit = async () => {
    const name = (formName || '').trim();
    const abbreviation = (formAbbreviation || '').trim();
    if (!name) {
      toast({ title: 'Name is required', status: 'warning' });
      return;
    }
    if (!abbreviation) {
      toast({ title: 'Abbreviation is required', status: 'warning' });
      return;
    }
    setFormSaving(true);
    try {
      if (editingSchool) {
        await StudentProfileService.updateSchool(editingSchool.id, { name, abbreviation });
        toast({ title: 'School updated', status: 'success' });
      } else {
        await StudentProfileService.createSchool({ name, abbreviation });
        toast({ title: 'School added', status: 'success' });
      }
      onFormClose();
      fetchSchools();
    } catch (e) {
      toast({ title: editingSchool ? 'Update failed' : 'Add failed', description: e?.message, status: 'error' });
    } finally {
      setFormSaving(false);
    }
  };

  const initiateDelete = (type, item) => {
    setItemToDelete({
      type,
      id: item.id,
      name: item.name,
      studentCount: item.totalStudents || 0,
      displayName: type === 'spec' ? 'Specialization' : type.charAt(0).toUpperCase() + type.slice(1)
    });
    setDeleteConfirmationInput('');
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    const requiredConfirmation = `delete ${itemToDelete.name}`;
    if (deleteConfirmationInput !== requiredConfirmation) {
      toast({ title: 'Confirmation failed', description: `Please type "${requiredConfirmation}" exactly.`, status: 'warning' });
      return;
    }

    setDeleteConfirmLoading(true);
    try {
      const { type, id } = itemToDelete;
      const cascade = itemToDelete.studentCount > 0;
      
      switch (type) {
        case 'school': await StudentProfileService.deleteSchool(id, cascade); break;
        case 'program': await StudentProfileService.deleteProgram(id, cascade); break;
        case 'major': await StudentProfileService.deleteMajor(id, cascade); break;
        case 'minor': await StudentProfileService.deleteMinor(id, cascade); break;
        case 'spec': await StudentProfileService.deleteSpecialization(id, cascade); break;
        default: throw new Error('Invalid item type');
      }

      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`, status: 'success' });
      onDeleteClose();
      setItemToDelete(null);
      fetchSchools();
    } catch (e) {
      toast({ title: 'Delete failed', description: e?.message, status: 'error' });
    } finally {
      setDeleteConfirmLoading(false);
    }
  };

  const canDelete = (school) => (school.totalStudents || 0) === 0;
  const deleteDisabledMessage = 'Cannot delete because students are associated with this school.';

  const selectedSchool = schools.find((s) => String(s.id) === selectedSchoolId);
  const programsForSchool = selectedSchool?.programs || [];
  const selectedMinorSchool = schools.find((s) => String(s.id) === selectedMinorSchoolId);
  const minorsForSchool = selectedMinorSchool?.minors || [];
  const selectedMajorProgram = programsForMajorSchool.find((p) => String(p.id) === selectedMajorProgramId);
  const majorsForProgram = selectedMajorProgram?.majors || [];
  const selectedSpecProgram = programsForSpecSchool.find((p) => String(p.id) === selectedSpecProgramId);
  const specializationsForProgram = selectedSpecProgram?.specializations || [];

  const sortById = (a, b) => (Number(a?.id) || 0) - (Number(b?.id) || 0);
  const sortedSchools = useMemo(() => [...schools].sort(sortById), [schools]);
  const sortedProgramsForSchool = useMemo(() => [...programsForSchool].sort(sortById), [programsForSchool]);
  const sortedProgramsForMajorSchool = useMemo(() => [...programsForMajorSchool].sort(sortById), [programsForMajorSchool]);
  const sortedProgramsForSpecSchool = useMemo(() => [...programsForSpecSchool].sort(sortById), [programsForSpecSchool]);
  const sortedMinorsForSchool = useMemo(() => [...minorsForSchool].sort(sortById), [minorsForSchool]);
  const sortedMajorsForProgram = useMemo(() => [...majorsForProgram].sort(sortById), [majorsForProgram]);
  const sortedSpecializationsForProgram = useMemo(() => [...specializationsForProgram].sort(sortById), [specializationsForProgram]);

  const openAddProgram = () => {
    setEditingProgram(null);
    setFormProgramName('');
    setFormProgramGraduationLevel('');
    setFormProgramMinDuration('');
    setFormProgramMaxDuration('');
    onProgramFormOpen();
  };

  const openEditProgram = (prog) => {
    setEditingProgram(prog);
    setFormProgramName(prog.name || '');
    setFormProgramGraduationLevel(prog.graduation_level || '');
    setFormProgramMinDuration(prog.min_duration_years != null ? String(prog.min_duration_years) : '');
    setFormProgramMaxDuration(prog.max_duration_years != null ? String(prog.max_duration_years) : '');
    onProgramFormOpen();
  };

  const handleProgramFormSubmit = async () => {
    const name = (formProgramName || '').trim();
    if (!name) {
      toast({ title: 'Program name is required', status: 'warning' });
      return;
    }
    setProgramSaving(true);
    try {
      const minDur = formProgramMinDuration.trim() ? parseInt(formProgramMinDuration, 10) : undefined;
      const maxDur = formProgramMaxDuration.trim() ? parseInt(formProgramMaxDuration, 10) : undefined;
      const payload = {
        name,
        graduation_level: (formProgramGraduationLevel || '').trim() || undefined,
        min_duration_years: minDur != null && !Number.isNaN(minDur) ? minDur : undefined,
        max_duration_years: maxDur != null && !Number.isNaN(maxDur) ? maxDur : undefined,
      };
      if (editingProgram) {
        await StudentProfileService.updateProgram(editingProgram.id, payload);
        toast({ title: 'Program updated', status: 'success' });
      } else {
        if (!selectedSchoolId) {
          toast({ title: 'Select a school first', status: 'warning' });
          setProgramSaving(false);
          return;
        }
        await StudentProfileService.createProgram({
          school_id: parseInt(selectedSchoolId, 10),
          ...payload,
        });
        toast({ title: 'Program added', status: 'success' });
      }
      onProgramFormClose();
      fetchSchools();
    } catch (e) {
      toast({ title: editingProgram ? 'Update failed' : 'Add failed', description: e?.message, status: 'error' });
    } finally {
      setProgramSaving(false);
    }
  };

  const openAddMinor = () => {
    setEditingMinor(null);
    setFormMinorName('');
    onMinorFormOpen();
  };

  const openEditMinor = (minor) => {
    setEditingMinor(minor);
    setFormMinorName(minor.name || '');
    onMinorFormOpen();
  };

  const handleMinorFormSubmit = async () => {
    const name = (formMinorName || '').trim();
    if (!name) {
      toast({ title: 'Minor name is required', status: 'warning' });
      return;
    }
    setMinorSaving(true);
    try {
      if (editingMinor) {
        await StudentProfileService.updateMinor(editingMinor.id, { name });
        toast({ title: 'Minor updated', status: 'success' });
      } else {
        if (!selectedMinorSchoolId) {
          toast({ title: 'Select a school first', status: 'warning' });
          setMinorSaving(false);
          return;
        }
        await StudentProfileService.createMinor({
          school_id: parseInt(selectedMinorSchoolId, 10),
          name,
        });
        toast({ title: 'Minor added', status: 'success' });
      }
      onMinorFormClose();
      fetchSchools();
    } catch (e) {
      toast({ title: editingMinor ? 'Update failed' : 'Add failed', description: e?.message, status: 'error' });
    } finally {
      setMinorSaving(false);
    }
  };

  const openAddMajor = () => {
    setEditingMajor(null);
    setFormMajorName('');
    onMajorFormOpen();
  };

  const openEditMajor = (major) => {
    setEditingMajor(major);
    setFormMajorName(major.name || '');
    onMajorFormOpen();
  };

  const handleMajorFormSubmit = async () => {
    const name = (formMajorName || '').trim();
    if (!name) {
      toast({ title: 'Major name is required', status: 'warning' });
      return;
    }
    setMajorSaving(true);
    try {
      if (editingMajor) {
        await StudentProfileService.updateMajor(editingMajor.id, { name });
        toast({ title: 'Major updated', status: 'success' });
      } else {
        if (!selectedMajorProgramId) {
          toast({ title: 'Select a school and program first', status: 'warning' });
          setMajorSaving(false);
          return;
        }
        await StudentProfileService.createMajor({
          program_id: parseInt(selectedMajorProgramId, 10),
          name,
        });
        toast({ title: 'Major added', status: 'success' });
      }
      onMajorFormClose();
      fetchSchools();
    } catch (e) {
      toast({ title: editingMajor ? 'Update failed' : 'Add failed', description: e?.message, status: 'error' });
    } finally {
      setMajorSaving(false);
    }
  };

  const openAddSpec = () => {
    setEditingSpec(null);
    setFormSpecName('');
    onSpecFormOpen();
  };

  const openEditSpec = (spec) => {
    setEditingSpec(spec);
    setFormSpecName(spec.name || '');
    onSpecFormOpen();
  };

  const handleSpecFormSubmit = async () => {
    const name = (formSpecName || '').trim();
    if (!name) {
      toast({ title: 'Specialization name is required', status: 'warning' });
      return;
    }
    setSpecSaving(true);
    try {
      if (editingSpec) {
        await StudentProfileService.updateSpecialization(editingSpec.id, { name });
        toast({ title: 'Specialization updated', status: 'success' });
      } else {
        if (!selectedSpecProgramId) {
          toast({ title: 'Select a school and program first', status: 'warning' });
          setSpecSaving(false);
          return;
        }
        await StudentProfileService.createSpecialization({
          program_id: parseInt(selectedSpecProgramId, 10),
          name,
        });
        toast({ title: 'Specialization added', status: 'success' });
      }
      onSpecFormClose();
      fetchSchools();
    } catch (e) {
      toast({ title: editingSpec ? 'Update failed' : 'Add failed', description: e?.message, status: 'error' });
    } finally {
      setSpecSaving(false);
    }
  };

  const handleExportLookup = () => {
    if (!schools.length) {
      toast({ title: 'No data to export', status: 'warning' });
      return;
    }

    const wb = XLSX.utils.book_new();

    // A. School Tab
    const schoolData = sortedSchools.map(s => ({
      'School ID': s.id,
      'School Code': s.abbreviation || '',
      'School Name': s.name || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schoolData), 'Schools');

    // B. Program Tab
    const programData = [];
    sortedSchools.forEach(s => {
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
    sortedSchools.forEach(s => {
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
    sortedSchools.forEach(s => {
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
    sortedSchools.forEach(s => {
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
    toast({ title: 'Exported academic lookup data', status: 'success' });
  };

  return (
    <Box w="full">
      <Card bg="white" borderRadius="xl" shadow="sm" border="1px" borderColor="gray.100" overflow="hidden">
        <CardBody p={6}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" color="gray.800">Manage Academic</Heading>
            <Button
              leftIcon={<DownloadIcon />}
              size="sm"
              variant="outline"
              colorScheme="green"
              onClick={handleExportLookup}
              isDisabled={loading || !schools.length}
            >
              Export Lookup
            </Button>
          </Flex>

          <Tabs variant="enclosed" colorScheme="blue" size="sm">
            <TabList borderBottomWidth="1px" borderColor="gray.200">
              <Tab fontWeight="600">Schools</Tab>
              <Tab fontWeight="600">Programs</Tab>
              <Tab fontWeight="600">Minors</Tab>
              <Tab fontWeight="600">Majors</Tab>
              <Tab fontWeight="600">Specializations</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0} pt={4}>
                <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                  <Text fontSize="sm" color="gray.600">Add and edit schools.</Text>
                  <Button leftIcon={<AddIcon />} colorScheme="blue" size="sm" onClick={openAdd}>
                    Add School
                  </Button>
                </Flex>
                {loading ? (
                  <Flex justify="center" py={8}>
                    <Spinner size="lg" color="blue.500" />
                  </Flex>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th fontWeight="600" color="gray.700" textAlign="center">ID</Th>
                          <Th fontWeight="600" color="gray.700">Name</Th>
                          <Th fontWeight="600" color="gray.700">Abbreviation</Th>
                          <Th fontWeight="600" color="gray.700" textAlign="center">Students</Th>
                          <Th fontWeight="600" color="gray.700" textAlign="right">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sortedSchools.length === 0 ? (
                          <Tr>
                            <Td colSpan={5} textAlign="center" py={8} color="gray.500">
                              No schools yet. Add one to get started.
                            </Td>
                          </Tr>
                        ) : (
                          sortedSchools.map((school) => (
                            <Tr key={school.id} _hover={{ bg: 'gray.50' }}>
                              <Td textAlign="center" fontSize="sm" color="gray.600">{school.id}</Td>
                              <Td fontWeight="medium">{school.name || '—'}</Td>
                              <Td>{school.abbreviation || '—'}</Td>
                              <Td textAlign="center">{school.totalStudents ?? 0}</Td>
                              <Td textAlign="right">
                                <HStack spacing={2} justify="flex-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<EditIcon />}
                                    colorScheme="blue"
                                    onClick={() => openEdit(school)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    leftIcon={<DeleteIcon />}
                                    colorScheme="red"
                                    onClick={() => initiateDelete('school', school)}
                                  >
                                    Delete
                                  </Button>
                                </HStack>
                              </Td>
                            </Tr>
                          ))
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>

              <TabPanel px={0} pt={4}>
                <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                  <FormControl maxW="320px">
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700">School</FormLabel>
                    <Select
                      value={selectedSchoolId}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      bg="white"
                      borderColor="gray.300"
                      placeholder="Select a school"
                    >
                      {sortedSchools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.abbreviation || `School ${s.id}`}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    size="sm"
                    onClick={openAddProgram}
                    isDisabled={!selectedSchoolId}
                  >
                    Add Program
                  </Button>
                </Flex>
                {!selectedSchoolId ? (
                  <Text color="gray.500" py={6}>Select a school to view and manage its programs.</Text>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th fontWeight="600" color="gray.700" textAlign="center">ID</Th>
                          <Th fontWeight="600" color="gray.700">Program name</Th>
                          <Th fontWeight="600" color="gray.700">Graduation level</Th>
                          <Th fontWeight="600" color="gray.700" textAlign="center">Min duration (yr)</Th>
                          <Th fontWeight="600" color="gray.700" textAlign="center">Max duration (yr)</Th>
                          <Th fontWeight="600" color="gray.700" textAlign="center">Students</Th>
                          <Th fontWeight="600" color="gray.700" textAlign="right">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sortedProgramsForSchool.length === 0 ? (
                          <Tr>
                            <Td colSpan={7} textAlign="center" py={8} color="gray.500">
                              No programs for this school.
                            </Td>
                          </Tr>
                        ) : (
                          sortedProgramsForSchool.map((prog) => (
                            <Tr key={prog.id} _hover={{ bg: 'gray.50' }}>
                              <Td textAlign="center" fontSize="sm" color="gray.600">{prog.id}</Td>
                              <Td fontWeight="medium">{prog.name || '—'}</Td>
                              <Td>{prog.graduation_level ?? '—'}</Td>
                              <Td textAlign="center">{prog.min_duration_years ?? '—'}</Td>
                              <Td textAlign="center">{prog.max_duration_years ?? '—'}</Td>
                              <Td textAlign="center">{prog.totalStudents ?? 0}</Td>
                              <Td textAlign="right">
                                <HStack spacing={2} justify="flex-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<EditIcon />}
                                    colorScheme="blue"
                                    onClick={() => openEditProgram(prog)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    leftIcon={<DeleteIcon />}
                                    colorScheme="red"
                                    onClick={() => initiateDelete('program', prog)}
                                  >
                                    Delete
                                  </Button>
                                </HStack>
                              </Td>
                            </Tr>
                          ))
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>

              <TabPanel px={0} pt={4}>
                <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                  <FormControl maxW="320px">
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700">School</FormLabel>
                    <Select
                      value={selectedMinorSchoolId}
                      onChange={(e) => setSelectedMinorSchoolId(e.target.value)}
                      bg="white"
                      borderColor="gray.300"
                      placeholder="Select a school"
                    >
                      {sortedSchools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.abbreviation || `School ${s.id}`}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    size="sm"
                    onClick={openAddMinor}
                    isDisabled={!selectedMinorSchoolId}
                  >
                    Add Minor
                  </Button>
                </Flex>
                {!selectedMinorSchoolId ? (
                  <Text color="gray.500" py={6}>Select a school to view and manage its minors.</Text>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th fontWeight="600" color="gray.700" textAlign="center">ID</Th>
                          <Th fontWeight="600" color="gray.700">Minor name</Th>
                          <Th fontWeight="600" color="gray.700" textAlign="right">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sortedMinorsForSchool.length === 0 ? (
                          <Tr>
                            <Td colSpan={3} textAlign="center" py={8} color="gray.500">
                              No minors for this school.
                            </Td>
                          </Tr>
                        ) : (
                          sortedMinorsForSchool.map((minor) => (
                            <Tr key={minor.id} _hover={{ bg: 'gray.50' }}>
                              <Td textAlign="center" fontSize="sm" color="gray.600">{minor.id}</Td>
                              <Td fontWeight="medium">{minor.name || '—'}</Td>
                              <Td textAlign="right">
                                <HStack spacing={2} justify="flex-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<EditIcon />}
                                    colorScheme="blue"
                                    onClick={() => openEditMinor(minor)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    leftIcon={<DeleteIcon />}
                                    colorScheme="red"
                                    onClick={() => initiateDelete('minor', minor)}
                                  >
                                    Delete
                                  </Button>
                                </HStack>
                              </Td>
                            </Tr>
                          ))
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>

              <TabPanel px={0} pt={4}>
                <Flex align="center" mb={4} flexWrap="nowrap" justify="space-between" gap={4} w="full">
                  <HStack gap={4} flexWrap="nowrap" align="flex-end" flex="1" minW={0}>
                    <FormControl maxW="200px" minW="140px">
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">School</FormLabel>
                      <Select
                        value={selectedMajorSchoolId}
                        onChange={(e) => setSelectedMajorSchoolId(e.target.value)}
                        bg="white"
                        borderColor="gray.300"
                        placeholder="Select school"
                      >
                        {sortedSchools.map((s) => (
                          <option key={s.id} value={s.id}>{s.name || s.abbreviation || `School ${s.id}`}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl maxW="240px" minW="160px">
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Program</FormLabel>
                      <Select
                        value={selectedMajorProgramId}
                        onChange={(e) => setSelectedMajorProgramId(e.target.value)}
                        bg="white"
                        borderColor="gray.300"
                        placeholder="Select program"
                      >
                        {sortedProgramsForMajorSchool.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Select>
                    </FormControl>
                  </HStack>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    size="sm"
                    onClick={openAddMajor}
                    isDisabled={!selectedMajorProgramId}
                    flexShrink={0}
                  >
                    Add Major
                  </Button>
                </Flex>
                {!selectedMajorProgramId ? (
                  <Text color="gray.500" py={6}>Select a school and program to view and manage majors.</Text>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th fontWeight="600" color="gray.700" textAlign="center">ID</Th>
                          <Th fontWeight="600" color="gray.700">Major name</Th>
                          <Th fontWeight="600" color="gray.700" textAlign="right">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sortedMajorsForProgram.length === 0 ? (
                          <Tr>
                            <Td colSpan={3} textAlign="center" py={8} color="gray.500">No majors for this program.</Td>
                          </Tr>
                        ) : (
                          sortedMajorsForProgram.map((m) => (
                            <Tr key={m.id} _hover={{ bg: 'gray.50' }}>
                              <Td textAlign="center" fontSize="sm" color="gray.600">{m.id}</Td>
                              <Td fontWeight="medium">{m.name || '—'}</Td>
                              <Td textAlign="right">
                                <HStack spacing={2} justify="flex-end">
                                  <Button size="sm" variant="outline" leftIcon={<EditIcon />} colorScheme="blue" onClick={() => openEditMajor(m)}>Edit</Button>
                                  <Button size="sm" variant="ghost" leftIcon={<DeleteIcon />} colorScheme="red" onClick={() => initiateDelete('major', m)}>Delete</Button>
                                </HStack>
                              </Td>
                            </Tr>
                          ))
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>

              <TabPanel px={0} pt={4}>
                <Flex align="center" mb={4} flexWrap="nowrap" justify="space-between" gap={4} w="full">
                  <HStack gap={4} flexWrap="nowrap" align="flex-end" flex="1" minW={0}>
                    <FormControl maxW="200px" minW="140px">
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">School</FormLabel>
                      <Select
                        value={selectedSpecSchoolId}
                        onChange={(e) => setSelectedSpecSchoolId(e.target.value)}
                        bg="white"
                        borderColor="gray.300"
                        placeholder="Select school"
                      >
                        {sortedSchools.map((s) => (
                          <option key={s.id} value={s.id}>{s.name || s.abbreviation || `School ${s.id}`}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl maxW="240px" minW="160px">
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">Program</FormLabel>
                      <Select
                        value={selectedSpecProgramId}
                        onChange={(e) => setSelectedSpecProgramId(e.target.value)}
                        bg="white"
                        borderColor="gray.300"
                        placeholder="Select program"
                      >
                        {sortedProgramsForSpecSchool.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Select>
                    </FormControl>
                  </HStack>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    size="sm"
                    onClick={openAddSpec}
                    isDisabled={!selectedSpecProgramId}
                    flexShrink={0}
                  >
                    Add Specialization
                  </Button>
                </Flex>
                {!selectedSpecProgramId ? (
                  <Text color="gray.500" py={6}>Select a school and program to view and manage specializations.</Text>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th fontWeight="600" color="gray.700" textAlign="center">ID</Th>
                          <Th fontWeight="600" color="gray.700">Specialization name</Th>
                          <Th fontWeight="600" color="gray.700" textAlign="right">Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sortedSpecializationsForProgram.length === 0 ? (
                          <Tr>
                            <Td colSpan={3} textAlign="center" py={8} color="gray.500">No specializations for this program.</Td>
                          </Tr>
                        ) : (
                          sortedSpecializationsForProgram.map((s) => (
                            <Tr key={s.id} _hover={{ bg: 'gray.50' }}>
                              <Td textAlign="center" fontSize="sm" color="gray.600">{s.id}</Td>
                              <Td fontWeight="medium">{s.name || '—'}</Td>
                              <Td textAlign="right">
                                <HStack spacing={2} justify="flex-end">
                                  <Button size="sm" variant="outline" leftIcon={<EditIcon />} colorScheme="blue" onClick={() => openEditSpec(s)}>Edit</Button>
                                  <Button size="sm" variant="ghost" leftIcon={<DeleteIcon />} colorScheme="red" onClick={() => initiateDelete('spec', s)}>Delete</Button>
                                </HStack>
                              </Td>
                            </Tr>
                          ))
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      <Modal isOpen={isFormOpen} onClose={onFormClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingSchool ? 'Edit School' : 'Add School'}</ModalHeader>
          <ModalBody>
            <FormControl isRequired mb={4}>
              <FormLabel>Name</FormLabel>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                bg="white"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Abbreviation</FormLabel>
              <Input
                value={formAbbreviation}
                onChange={(e) => setFormAbbreviation(e.target.value)}
                bg="white"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter justifyContent="space-between">
            <Box>
              {editingSchool && (
                <Button
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  mr={2}
                  leftIcon={<DeleteIcon />}
                  onClick={() => initiateDelete('school', editingSchool)}
                >
                  Delete
                </Button>
              )}
            </Box>
            <HStack>
              <Button variant="ghost" onClick={onFormClose}>Cancel</Button>
              <Button colorScheme="blue" onClick={handleFormSubmit} isLoading={formSaving}>
                {editingSchool ? 'Save' : 'Add'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelDeleteRef}
        onClose={onDeleteClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl" shadow="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" borderBottomWidth="1px" borderColor="gray.100">
              <HStack color="red.600">
                <WarningIcon />
                <Text>Delete {itemToDelete?.displayName}</Text>
              </HStack>
            </AlertDialogHeader>

            <AlertDialogBody py={6}>
              <VStack align="start" spacing={4}>
                <Box>
                  <Text mb={2}>
                    Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?
                  </Text>
                  {itemToDelete?.studentCount > 0 && (
                    <Box p={3} bg="red.50" borderRadius="md" borderLeft="4px solid" borderColor="red.500">
                      <Text color="red.700" fontWeight="bold" fontSize="sm">
                        WARNING: CRITICAL ACTION
                      </Text>
                      <Text color="red.600" fontSize="sm" mt={1}>
                        {['school', 'program'].includes(itemToDelete.type) ? (
                          <>
                            This {itemToDelete.type} has <strong>{itemToDelete.studentCount} students</strong> associated with it. 
                            Deleting it will <strong>permanently delete all associated students</strong> and their records from the system.
                          </>
                        ) : (
                          <>
                            This {itemToDelete.displayName} has <strong>{itemToDelete.studentCount} students</strong> associated with it. 
                            Deleting it will <strong>disconnect these students</strong> (their {itemToDelete.displayName} will be set to None). 
                            The student records themselves will <strong>not</strong> be deleted.
                          </>
                        )}
                      </Text>
                      <Text color="red.600" fontSize="sm" mt={2} fontWeight="600">
                        {['school', 'program'].includes(itemToDelete.type) ? "This action cannot be undone!" : "This action only affects the category, not the student profiles."}
                      </Text>
                    </Box>
                  )}
                </Box>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                    To confirm, type <Text as="span" color="red.600" fontWeight="bold">delete {itemToDelete?.name}</Text> below:
                  </FormLabel>
                  <Input
                    placeholder={`delete ${itemToDelete?.name}`}
                    value={deleteConfirmationInput}
                    onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                    focusBorderColor="red.400"
                    bg="white"
                  />
                </FormControl>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter bg="gray.50" borderTopWidth="1px" borderColor="gray.100" py={3}>
              <Button ref={cancelDeleteRef} onClick={onDeleteClose} variant="ghost" size="sm">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                isLoading={deleteConfirmLoading}
                ml={3}
                size="sm"
                isDisabled={deleteConfirmationInput !== `delete ${itemToDelete?.name}`}
                _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                Delete Everything
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Modal isOpen={isProgramFormOpen} onClose={onProgramFormClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingProgram ? 'Edit Program' : 'Add Program'}</ModalHeader>
          <ModalBody>
            {!editingProgram && selectedSchoolId && (
              <FormControl mb={4}>
                <FormLabel fontSize="sm" color="gray.600">School</FormLabel>
                <Text fontWeight="medium">{selectedSchool?.name || selectedSchool?.abbreviation || '—'}</Text>
              </FormControl>
            )}
            <FormControl isRequired mb={4}>
              <FormLabel>Name</FormLabel>
              <Input
                value={formProgramName}
                onChange={(e) => setFormProgramName(e.target.value)}
                bg="white"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Graduation level</FormLabel>
              <Input
                value={formProgramGraduationLevel}
                onChange={(e) => setFormProgramGraduationLevel(e.target.value)}
                bg="white"
                placeholder="UG or PG"
              />
            </FormControl>
            <FormControl mb={2}>
              <FormLabel>Min duration (years)</FormLabel>
              <Input
                type="number"
                min={1}
                max={10}
                value={formProgramMinDuration}
                onChange={(e) => setFormProgramMinDuration(e.target.value)}
                bg="white"
                placeholder="e.g. 3"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Max duration (years)</FormLabel>
              <Input
                type="number"
                min={1}
                max={10}
                value={formProgramMaxDuration}
                onChange={(e) => setFormProgramMaxDuration(e.target.value)}
                bg="white"
                placeholder="e.g. 4"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onProgramFormClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleProgramFormSubmit} isLoading={programSaving}>
              {editingProgram ? 'Save' : 'Add'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isMinorFormOpen} onClose={onMinorFormClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingMinor ? 'Edit Minor' : 'Add Minor'}</ModalHeader>
          <ModalBody>
            {!editingMinor && selectedMinorSchoolId && (
              <FormControl mb={4}>
                <FormLabel fontSize="sm" color="gray.600">School</FormLabel>
                <Text fontWeight="medium">{selectedMinorSchool?.name || selectedMinorSchool?.abbreviation || '—'}</Text>
              </FormControl>
            )}
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={formMinorName}
                onChange={(e) => setFormMinorName(e.target.value)}
                bg="white"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onMinorFormClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleMinorFormSubmit} isLoading={minorSaving}>
              {editingMinor ? 'Save' : 'Add'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isMajorFormOpen} onClose={onMajorFormClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingMajor ? 'Edit Major' : 'Add Major'}</ModalHeader>
          <ModalBody>
            {!editingMajor && selectedMajorSchoolId && selectedMajorProgramId && (
              <>
                <FormControl mb={2}>
                  <FormLabel fontSize="sm" color="gray.600">School</FormLabel>
                  <Text fontWeight="medium">{majorSchool?.name || majorSchool?.abbreviation || '—'}</Text>
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel fontSize="sm" color="gray.600">Program</FormLabel>
                  <Text fontWeight="medium">{selectedMajorProgram?.name || '—'}</Text>
                </FormControl>
              </>
            )}
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input value={formMajorName} onChange={(e) => setFormMajorName(e.target.value)} bg="white" />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onMajorFormClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleMajorFormSubmit} isLoading={majorSaving}>
              {editingMajor ? 'Save' : 'Add'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isSpecFormOpen} onClose={onSpecFormClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingSpec ? 'Edit Specialization' : 'Add Specialization'}</ModalHeader>
          <ModalBody>
            {!editingSpec && selectedSpecSchoolId && selectedSpecProgramId && (
              <>
                <FormControl mb={2}>
                  <FormLabel fontSize="sm" color="gray.600">School</FormLabel>
                  <Text fontWeight="medium">{specSchool?.name || specSchool?.abbreviation || '—'}</Text>
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel fontSize="sm" color="gray.600">Program</FormLabel>
                  <Text fontWeight="medium">{selectedSpecProgram?.name || '—'}</Text>
                </FormControl>
              </>
            )}
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input value={formSpecName} onChange={(e) => setFormSpecName(e.target.value)} bg="white" />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSpecFormClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSpecFormSubmit} isLoading={specSaving}>
              {editingSpec ? 'Save' : 'Add'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
