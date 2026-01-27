import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  VStack,
  Badge,
  Avatar,
  InputGroup,
  InputLeftElement,
  Flex,
  Spinner,
  Checkbox,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Divider,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  FormControl,
  FormLabel,
  useToast,
  Icon,
  TableContainer
} from '@chakra-ui/react';
import { SearchIcon, ChevronLeftIcon, DownloadIcon, CloseIcon, AddIcon } from '@chakra-ui/icons';
import { BsLayoutThreeColumns } from 'react-icons/bs';
import { PlacementService } from '../../services/placement.service';

const AddStudentsToDrive = ({ driveId, onCancel, onSuccess, embedded = false, existingUsns = [] }) => {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  
  // Advanced Filters
  const [minCGPA, setMinCGPA] = useState('');
  const [maxLiveBacklogs, setMaxLiveBacklogs] = useState('');
  const [maxClosedBacklogs, setMaxClosedBacklogs] = useState('');
  
  // Selection state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  // Column visibility state
  const baseColumns = [
    { id: 'select', label: 'Select' },
    { id: 'name', label: 'Name' },
    { id: 'usn', label: 'USN' },
    { id: 'school', label: 'School' },
    { id: 'program', label: 'Program' },
    { id: 'latest_sgpa', label: 'SGPA' },
    { id: 'live_backlogs', label: 'Live BL' },
    { id: 'closed_backlogs', label: 'Closed BL' },
  ];
  const [visibleColumns, setVisibleColumns] = useState(baseColumns.map(c => c.id));
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // Column groups from database schema (simplified for list view)
  const columnGroups = [
    {
      id: 'students_personal_details',
      label: 'Personal Details',
      columns: [
        { id: 'name', label: 'Full Name' },
        { id: 'usn', label: 'USN' },
        { id: 'gender', label: 'Gender' },
        { id: 'date_of_birth', label: 'Date of Birth' },
        { id: 'blood_group', label: 'Blood Group' },
        { id: 'marital_status', label: 'Marital Status' },
        { id: 'specially_abled', label: 'Specially Abled' },
        { id: 'languages', label: 'Languages' },
        { id: 'school', label: 'School' },
        { id: 'year_of_joining', label: 'Year of Joining' },
        { id: 'program', label: 'Program' },
        { id: 'specialization', label: 'Specialization' },
        { id: 'major', label: 'Major' },
        { id: 'minor', label: 'Minor' },
        { id: 'profile_image', label: 'Profile Image' },
      ],
    },
    {
      id: 'student_profile_communication',
      label: 'Communication',
      columns: [
        { id: 'college_email', label: 'College Email' },
        { id: 'personal_email', label: 'Personal Email' },
        { id: 'phone', label: 'Phone Number' },
        { id: 'links', label: 'Links' },
      ],
    },
    {
      id: 'student_semester_academics',
      label: 'Semester Academics',
      columns: [
        { id: 'latest_academic_year', label: 'Academic Year' },
        { id: 'latest_semester', label: 'Semester' },
        { id: 'latest_sgpa', label: 'Result (SGPA)' },
        { id: 'closed_backlogs', label: 'Closed Backlogs' },
        { id: 'live_backlogs', label: 'Live Backlogs' },
      ],
    },
    {
      id: 'student_education_history',
      label: 'Education History',
      columns: [
        { id: 'highest_education_level', label: 'Education Level' },
        { id: 'latest_institute', label: 'Institute' },
        { id: 'latest_year_of_passing', label: 'Year of Passing' },
        { id: 'latest_result', label: 'Result' },
      ],
    },
    {
        id: 'student_projects',
        label: 'Projects',
        columns: [
          { id: 'projects_count', label: 'Projects Count' },
          { id: 'latest_project_title', label: 'Latest Project Title' },
        ],
      },
      {
        id: 'student_internships',
        label: 'Internships',
        columns: [
          { id: 'internships_count', label: 'Internships Count' },
          { id: 'latest_internship_org', label: 'Latest Internship Org' },
          { id: 'latest_internship_stipend', label: 'Latest Internship Stipend' },
        ],
      },
      {
        id: 'student_trainings',
        label: 'Trainings',
        columns: [
          { id: 'trainings_count', label: 'Trainings Count' },
          { id: 'latest_training_title', label: 'Latest Training Title' },
        ],
      },
      {
        id: 'student_certifications',
        label: 'Certifications',
        columns: [
          { id: 'certifications_count', label: 'Certifications Count' },
          { id: 'latest_certification_title', label: 'Latest Certification Title' },
        ],
      },
      {
        id: 'student_publications',
        label: 'Publications',
        columns: [
          { id: 'publications_count', label: 'Publications Count' },
          { id: 'latest_publication_title', label: 'Latest Publication Title' },
          { id: 'latest_publication_date', label: 'Latest Publication Date' },
        ],
      },
  ];

  const allColumnsMeta = [
    ...baseColumns.filter(c => c.id !== 'select'),
    ...columnGroups.flatMap(g => g.columns),
  ];

  const getLabelForColumn = (id) => {
    if (id === 'select') return '';
    const found = allColumnsMeta.find(c => c.id === id);
    return found ? found.label : id;
  };

  const baseColumnIds = baseColumns.map(c => c.id);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await PlacementService.getAllStudents();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
          title: "Error",
          description: "Failed to fetch students.",
          status: "error",
          duration: 3000,
          isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Extract unique schools and programs for filters
  const schools = [...new Set(students.map(s => s.school))].sort();
  
  // Filter programs based on selected school
  const programs = [...new Set(
    students
      .filter(s => !selectedSchool || s.school === selectedSchool)
      .map(s => s.program)
  )].sort();

  // Reset selected program when school changes
  useEffect(() => {
    setSelectedProgram('');
  }, [selectedSchool]);

  // Filter logic
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.usn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSchool = selectedSchool ? student.school === selectedSchool : true;
    const matchesProgram = selectedProgram ? student.program === selectedProgram : true;

    // Advanced filtering
    const studentCGPA = parseFloat(student.latest_sgpa || 0);
    const matchesCGPA = minCGPA ? studentCGPA >= parseFloat(minCGPA) : true;
    
    const studentLiveBL = parseInt(student.live_backlogs || 0);
    const matchesLiveBL = maxLiveBacklogs !== '' ? studentLiveBL <= parseInt(maxLiveBacklogs) : true;

    const studentClosedBL = parseInt(student.closed_backlogs || 0);
    const matchesClosedBL = maxClosedBacklogs !== '' ? studentClosedBL <= parseInt(maxClosedBacklogs) : true;

    // Filter out already registered students
    const isNotRegistered = !existingUsns.includes(student.usn);

    return matchesSearch && matchesSchool && matchesProgram && matchesCGPA && matchesLiveBL && matchesClosedBL && isNotRegistered;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSchool('');
    setSelectedProgram('');
    setMinCGPA('');
    setMaxLiveBacklogs('');
    setMaxClosedBacklogs('');
    setCurrentPage(1);
  };

  const handleSelectAll = (e) => {
      if (e.target.checked) {
          // Select all visible students on current page or all filtered? 
          // Usually "Select All" applies to filtered list or just current page. 
          // Let's do current page for simplicity, or filtered list.
          // Let's do filtered list so they can bulk add everyone matching a filter.
          const allIds = filteredStudents.map(s => s.usn);
          setSelectedStudents(allIds);
      } else {
          setSelectedStudents([]);
      }
  };

  const handleSelectStudent = (usn) => {
      setSelectedStudents(prev => {
          if (prev.includes(usn)) {
              return prev.filter(id => id !== usn);
          } else {
              return [...prev, usn];
          }
      });
  };

  const handleAddStudents = async () => {
      if (selectedStudents.length === 0) return;

      setIsAdding(true);
      try {
          // Add students sequentially or in parallel?
          // Since we don't have a bulk endpoint confirmed, let's do parallel requests with a limit or just Promise.all if not too many.
          // If 100s of students, this might be bad. But typically it's smaller batches.
          
          let successCount = 0;
          let failCount = 0;
          const errorMessages = new Set();

          const promises = selectedStudents.map(async (usn) => {
              try {
                  await PlacementService.registerForDrive(usn, driveId);
                  successCount++;
              } catch (error) {
                  console.error(`Failed to register ${usn}:`, error);
                  failCount++;
                  errorMessages.add(error.message);
              }
          });

          await Promise.all(promises);

          if (successCount > 0) {
              toast({
                  title: "Success",
                  description: `Successfully added ${successCount} students. ${failCount > 0 ? `${failCount} failed.` : ''}`,
                  status: "success",
                  duration: 3000,
                  isClosable: true
              });
              if (onSuccess) onSuccess();
          } else if (failCount > 0) {
              const errorMsg = Array.from(errorMessages).join(', ') || "They might already be registered.";
              toast({
                  title: "Error",
                  description: `Failed to add selected students. ${errorMsg}`,
                  status: "error",
                  duration: 3000,
                  isClosable: true
              });
          }

      } catch (error) {
          console.error("Error adding students:", error);
          toast({
              title: "Error",
              description: "An unexpected error occurred.",
              status: "error",
              duration: 3000,
              isClosable: true
          });
      } finally {
          setIsAdding(false);
      }
  };

  const toggleColumn = (columnId) => {
    setVisibleColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  return (
    <Box 
      bg={embedded ? "transparent" : "white"} 
      borderRadius={embedded ? "none" : "xl"} 
      shadow={embedded ? "none" : "sm"} 
      border={embedded ? "none" : "1px solid"} 
      borderColor={embedded ? "transparent" : "gray.200"} 
      p={embedded ? 0 : 5}
    >
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
            <Box>
                <Heading size="md" color="gray.800">Add Students</Heading>
                <Text color="gray.500" fontSize="sm">Select students to add to this placement drive</Text>
            </Box>
            <HStack>
                 <Button onClick={onCancel} variant="ghost">Cancel</Button>
                 <Button 
                    colorScheme="blue" 
                    leftIcon={<AddIcon />} 
                    isLoading={isAdding}
                    loadingText="Adding..."
                    onClick={handleAddStudents}
                    isDisabled={selectedStudents.length === 0}
                >
                    Add Selected ({selectedStudents.length})
                </Button>
            </HStack>
        </Flex>

        {/* Filters */}
        <Box bg="gray.50" p={4} borderRadius="lg" mb={6} border="1px" borderColor="gray.200">
            <Flex gap={4} direction={{ base: 'column', md: 'row' }} align="center" flexWrap="wrap">
              <InputGroup maxW={{ base: '100%', md: '300px' }} flex="1">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search students..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="white"
                  size="sm"
                />
              </InputGroup>

              <Select 
                placeholder="All Schools" 
                maxW={{ base: '100%', md: '180px' }}
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                bg="white"
                size="sm"
              >
                {schools.map(school => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </Select>

              <Select 
                placeholder="All Programs" 
                maxW={{ base: '100%', md: '180px' }}
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                bg="white"
                size="sm"
              >
                {programs.map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </Select>

              <Input
                placeholder="Min CGPA"
                type="number"
                maxW="100px"
                size="sm"
                bg="white"
                value={minCGPA}
                onChange={(e) => setMinCGPA(e.target.value)}
              />
               <Input
                placeholder="Max Live BL"
                type="number"
                maxW="100px"
                size="sm"
                bg="white"
                value={maxLiveBacklogs}
                onChange={(e) => setMaxLiveBacklogs(e.target.value)}
              />
               <Input
                placeholder="Max Closed BL"
                type="number"
                maxW="110px"
                size="sm"
                bg="white"
                value={maxClosedBacklogs}
                onChange={(e) => setMaxClosedBacklogs(e.target.value)}
              />

              <HStack spacing={2} ml="auto">
                <Button 
                  leftIcon={<BsLayoutThreeColumns />} 
                  bg="white" 
                  size="sm"
                  onClick={() => setIsColumnModalOpen(true)}
                >
                  Columns
                </Button>
              </HStack>
            </Flex>
        </Box>

        {/* Table */}
        <TableContainer>
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                   <Th w="50px">
                       <Checkbox 
                            isChecked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                            isIndeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                            onChange={handleSelectAll}
                       />
                   </Th>
                  {visibleColumns.filter(id => id !== 'select').map(columnId => (
                    <Th key={columnId} whiteSpace="nowrap">
                      {getLabelForColumn(columnId)}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={visibleColumns.length + 1} textAlign="center" py={10}>
                      <Spinner size="md" color="blue.500" />
                      <Text mt={2} color="gray.500">Loading students...</Text>
                    </Td>
                  </Tr>
                ) : currentStudents.length === 0 ? (
                  <Tr>
                    <Td colSpan={visibleColumns.length + 1} textAlign="center" py={10}>
                      <Text color="gray.500">No students found matching your criteria</Text>
                    </Td>
                  </Tr>
                ) : (
                  currentStudents.map((student, index) => (
                    <Tr 
                      key={student.usn} 
                      _hover={{ bg: 'gray.50' }}
                    >
                      <Td>
                          <Checkbox 
                                isChecked={selectedStudents.includes(student.usn)}
                                onChange={() => handleSelectStudent(student.usn)}
                          />
                      </Td>
                      {visibleColumns.includes('name') && (
                        <Td>
                          <Flex align="center">
                            <Avatar size="xs" name={student.name} src={student.avatar} mr={2} />
                            <Text fontWeight="600" color="gray.700" fontSize="sm">{student.name}</Text>
                          </Flex>
                        </Td>
                      )}
                      {visibleColumns.includes('usn') && (
                        <Td>
                          <Badge colorScheme="blue" fontSize="xs" variant="subtle">{student.usn}</Badge>
                        </Td>
                      )}
                      {visibleColumns.includes('school') && <Td fontSize="sm" color="gray.600">{student.school}</Td>}
                      {visibleColumns.includes('program') && <Td fontSize="sm" color="gray.600">{student.program}</Td>}
                      {visibleColumns.includes('specialization') && <Td fontSize="sm" color="gray.600">{student.specialization || '-'}</Td>}
                      {visibleColumns.includes('email') && <Td fontSize="sm" color="gray.600">{student.email}</Td>}
                      {visibleColumns.includes('contact') && <Td fontSize="sm" color="gray.600">{student.contact || '-'}</Td>}
                      {visibleColumns.includes('latest_sgpa') && <Td fontSize="sm" fontWeight="bold">{student.latest_sgpa || '-'}</Td>}
                      {visibleColumns.includes('live_backlogs') && <Td fontSize="sm" color={student.live_backlogs > 0 ? "red.500" : "green.500"}>{student.live_backlogs !== null ? student.live_backlogs : '-'}</Td>}
                      {visibleColumns.includes('closed_backlogs') && <Td fontSize="sm">{student.closed_backlogs !== null ? student.closed_backlogs : '-'}</Td>}
                      
                      {/* Dynamic Columns Rendering */}
                      {visibleColumns.filter(id => !baseColumnIds.includes(id)).map(id => {
                         let value = '-';
                         switch (id) {
                            case 'gender': value = student.gender || '-'; break;
                            case 'date_of_birth': value = student.date_of_birth || '-'; break;
                            case 'blood_group': value = student.blood_group || '-'; break;
                            case 'marital_status': value = student.marital_status || '-'; break;
                            case 'specially_abled': value = typeof student.specially_abled === 'boolean' ? (student.specially_abled ? 'Yes' : 'No') : '-'; break;
                            case 'languages': value = student.languages || '-'; break;
                            case 'year_of_joining': value = student.year_of_joining || '-'; break;
                            case 'major': value = student.major || '-'; break;
                            case 'minor': value = student.minor || '-'; break;
                            case 'profile_image': value = student.profile_image ? 'Available' : '-'; break;
                            
                            // Communication
                            case 'college_email': value = student.college_email || '-'; break;
                            case 'personal_email': value = student.email || '-'; break;
                            case 'phone': value = student.phone_number || student.contact || '-'; break;
                            case 'links': value = student.links ? 'Available' : '-'; break;

                            // Academics
                            case 'latest_academic_year': value = student.latest_academic_year || '-'; break;
                            case 'latest_semester': value = student.latest_semester || '-'; break;
                            case 'latest_sgpa': value = student.latest_sgpa || '-'; break;
                            case 'closed_backlogs': value = student.closed_backlogs ?? '-'; break;
                            case 'live_backlogs': value = student.live_backlogs ?? '-'; break;

                            // Education
                            case 'highest_education_level': value = student.highest_education_level || '-'; break;
                            case 'latest_institute': value = student.latest_institute || '-'; break;
                            case 'latest_year_of_passing': value = student.latest_year_of_passing || '-'; break;
                            case 'latest_result': value = student.latest_result || '-'; break;

                            // Others
                            case 'projects_count': value = student.projects_count || 0; break;
                            case 'internships_count': value = student.internships_count || 0; break;
                            case 'trainings_count': value = student.trainings_count || 0; break;
                            case 'certifications_count': value = student.certifications_count || 0; break;
                            case 'publications_count': value = student.publications_count || 0; break;
                            
                            default: 
                                value = student[id] || '-';
                         }
                         return <Td key={id} fontSize="sm" color="gray.600">{value}</Td>;
                      })}
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
            <Flex justify="space-between" align="center" mt={4}>
              <Text fontSize="sm" color="gray.500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} entries
              </Text>
              <HStack>
                <Button 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
        )}

      {/* Column Visibility Modal */}
      <Modal isOpen={isColumnModalOpen} onClose={() => setIsColumnModalOpen(false)} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Customize Columns</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Tabs variant="enclosed">
              <TabList mb={4} overflowX="auto">
                <Tab>Basic</Tab>
                {columnGroups.map(group => (
                  <Tab key={group.id} whiteSpace="nowrap">{group.label}</Tab>
                ))}
              </TabList>
              <TabPanels>
                <TabPanel>
                  <SimpleGrid columns={2} spacing={3}>
                    {baseColumns.filter(c => c.id !== 'select').map(column => (
                      <Checkbox 
                        key={column.id}
                        isChecked={visibleColumns.includes(column.id)}
                        onChange={() => toggleColumn(column.id)}
                      >
                        {column.label}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </TabPanel>
                {columnGroups.map(group => (
                  <TabPanel key={group.id}>
                    <SimpleGrid columns={2} spacing={3}>
                      {group.columns.map(column => (
                        <Checkbox 
                          key={column.id}
                          isChecked={visibleColumns.includes(column.id)}
                          onChange={() => toggleColumn(column.id)}
                        >
                          {column.label}
                        </Checkbox>
                      ))}
                    </SimpleGrid>
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={() => setIsColumnModalOpen(false)}>Done</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
};

// Helper component for table container to avoid closing tag issue
const TableContainerContainer = ({ children }) => (
    <TableContainer>{children}</TableContainer>
);

export default AddStudentsToDrive;
