import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  VStack,
  Text,
  Spinner,
  useToast,
  HStack,
  Button,
  Flex,
  Badge,
  SimpleGrid,
  Grid,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Wrap,
  WrapItem,
  Icon,
  Image,
  Link,
  Divider,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import {
  FaUser,
  FaAddressBook,
  FaUsers,
  FaBriefcase,
  FaGraduationCap,
  FaProjectDiagram,
  FaChalkboardTeacher,
  FaCertificate,
  FaBook,
  FaMedal,
  FaList,
  FaFileAlt,
  FaChartBar,
  FaChartPie,
} from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import { StudentProfileService } from '../services/studentProfile.service';
import { PlacementService } from '../services/placement.service';
import { getFileUrl } from '../utils/fileUrl';
import { calculateProfileCompletion } from '../utils/profileHelper';
import './admin/AdminStudentDetail.css';

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: FaChartPie },
  { id: 'personal', label: 'Personal & Contact', icon: FaUser },
  { id: 'education', label: 'Education', icon: FaGraduationCap },
  { id: 'academics', label: 'Academic Performance', icon: FaChartBar },
  { id: 'projects', label: 'Projects', icon: FaProjectDiagram },
  { id: 'internships', label: 'Internships', icon: FaBriefcase },
  { id: 'career', label: 'Career', icon: FaBriefcase },
  { id: 'family', label: 'Parent / Guardian', icon: FaUsers },
  { id: 'trainings', label: 'Trainings', icon: FaChalkboardTeacher },
  { id: 'certifications', label: 'Certifications', icon: FaCertificate },
  { id: 'publications', label: 'Publications', icon: FaBook },
  { id: 'extra', label: 'Extra-Curricular', icon: FaMedal },
  { id: 'other', label: 'Other Experiences', icon: FaList },
  { id: 'resume', label: 'Resume', icon: FaFileAlt },
];

const AdminStudentDetail = ({ embedded = false }) => {
  const { usn } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [placementData, setPlacementData] = useState({ offers: [], processList: [], violations: [], disciplinary: [] });
  const [placementDataLoading, setPlacementDataLoading] = useState(false);

  useEffect(() => {
    if (!usn) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await StudentProfileService.getFullProfile(decodeURIComponent(usn));
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) {
          toast({
            title: 'Failed to load student',
            description: e?.message || 'Student not found.',
            status: 'error',
            isClosable: true,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [usn, toast]);

  useEffect(() => {
    const decodedUsn = usn ? decodeURIComponent(usn) : '';
    if (!decodedUsn) return;
    let cancelled = false;
    setPlacementDataLoading(true);
    (async () => {
      try {
        const [allOffers, allProcess, allViolations, allDisciplinary] = await Promise.all([
          PlacementService.getAllJobOffers().catch(() => []),
          PlacementService.getAllProcessList().catch(() => []),
          PlacementService.getPlacementViolations().catch(() => []),
          PlacementService.getDisciplinaryRecords().catch(() => []),
        ]);
        if (cancelled) return;
        const offers = (Array.isArray(allOffers) ? allOffers : []).filter(
          (o) => String(o.usn || o.student_id || '').toLowerCase() === decodedUsn.toLowerCase()
        );
        const processList = (Array.isArray(allProcess) ? allProcess : []).filter(
          (p) => String(p.usn || p.student_id || '').toLowerCase() === decodedUsn.toLowerCase()
        );
        const violations = (Array.isArray(allViolations) ? allViolations : []).filter(
          (v) => String(v.usn || '').toLowerCase() === decodedUsn.toLowerCase()
        );
        const disciplinary = (Array.isArray(allDisciplinary) ? allDisciplinary : []).filter(
          (d) => String(d.usn || '').toLowerCase() === decodedUsn.toLowerCase()
        );
        setPlacementData({ offers, processList, violations, disciplinary });
      } catch (_) {
        if (!cancelled) setPlacementData({ offers: [], processList: [], violations: [], disciplinary: [] });
      } finally {
        if (!cancelled) setPlacementDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [usn]);

  const content = (node) =>
    embedded ? node : <AdminLayout fullWidth>{node}</AdminLayout>;

  if (loading) {
    return content(
      <Flex justify="center" align="center" minH="calc(100vh - 72px)" bg="#f0f0f0">
        <Spinner size="xl" color="#20343c" thickness="3px" />
      </Flex>
    );
  }

  if (!profile) {
    return content(
      <Flex justify="center" align="center" minH="calc(100vh - 72px)" bg="#f0f0f0" direction="column" gap={4}>
        <Text color="gray.500">Student not found.</Text>
        <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate('/placement/students')} colorScheme="blue">
          Back to Students
        </Button>
      </Flex>
    );
  }

  const personal = profile.personal || {};
  const contact = profile.contact || {};
  const education = profile.education || [];
  const academics = profile.academics || [];
  const projects = profile.projects || [];
  const internships = profile.internships || [];
  const trainings = profile.trainings || [];
  const certifications = profile.certifications || [];
  const publications = profile.publications || [];
  const extraCurricular = profile.extraCurricular || [];
  const otherExperiences = profile.otherExperiences || [];
  const career = profile.career || {};
  const family = profile.family || profile.parents || [];

  const InfoRow = ({ label, value }) => (
    <Flex py={1} borderBottomWidth="1px" borderColor="gray.100" justify="space-between" gap={4}>
      <Text fontWeight="medium" color="gray.600" minW="140px">{label}</Text>
      <Text textAlign="right" flex={1}>{value ?? '—'}</Text>
    </Flex>
  );

  const profileCompletion = calculateProfileCompletion({
    ...profile,
    communication: profile.contact,
    parents: profile.family || profile.parents,
  });

  const stats = [
    { label: 'Projects', value: projects.length, icon: FaProjectDiagram },
    { label: 'Internships', value: internships.length, icon: FaBriefcase },
    { label: 'Certifications', value: certifications.length, icon: FaCertificate },
    { label: 'Publications', value: publications.length, icon: FaBook },
    { label: 'Trainings', value: trainings.length, icon: FaChalkboardTeacher },
    { label: 'Education', value: education.length, icon: FaGraduationCap },
    { label: 'Academics', value: academics.length, icon: FaChartBar },
    { label: 'Extra-Curricular', value: extraCurricular.length, icon: FaMedal },
    { label: 'Other', value: otherExperiences.length, icon: FaList },
    { label: 'Family', value: family.length, icon: FaUsers },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <Box className="admin-student-overview">
            <Heading size="md" mb={6} color="#20343c" fontWeight="600">
              Profile Overview
            </Heading>
            <Box mb={8} p={5} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
              <HStack spacing={3} mb={2}>
                <Icon as={FaChartPie} color="gray.700" boxSize={5} />
                <Heading size="sm" color="gray.800">Overall Completion: {profileCompletion}%</Heading>
              </HStack>
              <Text fontSize="sm" color="gray.600">Profile completeness across all sections.</Text>
            </Box>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} gap={4}>
              {stats.map(({ label, value, icon: StatIcon }) => (
                <Box
                  key={label}
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  bg="white"
                  borderColor="gray.100"
                  _hover={{ borderColor: '#d4a960', shadow: 'md' }}
                  transition="all 0.2s"
                  className="admin-student-stat-card"
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Icon as={StatIcon} color="gray.600" boxSize={4} />
                    <Badge colorScheme={value > 0 ? 'green' : 'gray'} fontSize="sm">
                      {value}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">{label}</Text>
                </Box>
              ))}
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={8}>
              <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" borderColor="gray.100">
                <HStack spacing={2} mb={3}>
                  <Icon as={FaUser} color="gray.600" boxSize={4} />
                  <Text fontWeight="semibold">Quick Info</Text>
                </HStack>
                <VStack align="stretch" spacing={1}>
                  <InfoRow label="USN" value={personal.usn} />
                  <InfoRow label="Email" value={personal.college_email} />
                  <InfoRow label="Year" value={personal.current_year} />
                  <InfoRow label="Section" value={personal.section} />
                  <InfoRow label="Joining" value={personal.year_of_joining} />
                </VStack>
              </Box>
              <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" borderColor="gray.100">
                <HStack spacing={2} mb={3}>
                  <Icon as={FaAddressBook} color="gray.600" boxSize={4} />
                  <Text fontWeight="semibold">Contact</Text>
                </HStack>
                <VStack align="stretch" spacing={1}>
                  <InfoRow label="Email" value={personal.college_email} />
                  <InfoRow label="Phone" value={personal.phone_number ? `${personal.phone_country_code || '+91'} ${personal.phone_number}` : '—'} />
                  {personal.social_links && (Array.isArray(personal.social_links) ? personal.social_links.length : Object.keys(personal.social_links).length) > 0 && (
                    <Box pt={2} className="social-links-block">
                      <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={2}>Social Links</Text>
                      <VStack align="stretch" spacing={1.5}>
                        {(Array.isArray(personal.social_links) ? personal.social_links : Object.entries(personal.social_links)).map((item, idx) => {
                          const isEntry = Array.isArray(item);
                          const url = isEntry ? (typeof item[1] === 'string' ? item[1] : item[1]?.url) : (typeof item === 'string' ? item : item?.url);
                          const name = isEntry ? (item[1]?.name || item[1]?.url || item[0]) : (item?.name || item?.url);
                          return url ? (
                            <Box key={idx} fontSize="sm">
                              <Text as="span" fontWeight="medium" color="gray.600">{typeof name === 'string' && !name.startsWith('http') && isNaN(Number(name)) ? name.charAt(0).toUpperCase() + name.slice(1) : 'Link'}: </Text>
                              <Link href={url} isExternal color="gray.800" wordBreak="break-all" _hover={{ textDecoration: 'underline', color: 'gray.900' }}>
                                {url}
                              </Link>
                            </Box>
                          ) : null;
                        })}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Box>
            </SimpleGrid>
          </Box>
        );
      case 'personal':
        return (
          <Box className="admin-student-section personal-contact-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={5} color="#20343c" fontWeight="600" borderBottom="1px" borderColor="gray.200" pb={3}>
              Personal & Contact
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} className="personal-contact-grid">
              <Box>
                <Text fontWeight="bold" mb={3} color="gray.600" fontSize="sm" textTransform="uppercase" letterSpacing="wider">Personal</Text>
                <VStack align="stretch" spacing={0}>
                  <InfoRow label="Full name" value={personal.full_name} />
                  <InfoRow label="Gender" value={personal.gender} />
                  <InfoRow label="DOB" value={personal.date_of_birth} />
                  <InfoRow label="Blood Group" value={personal.blood_group} />
                  <Flex py={1} borderBottomWidth="1px" borderColor="gray.100" justify="space-between" gap={4} align="flex-start">
                    <Text fontWeight="medium" color="gray.600" minW="140px">Languages</Text>
                    <Wrap spacing={2} flex={1} justify="flex-end">
                      {(() => {
                        const val = personal.languages;
                        const list = Array.isArray(val)
                          ? val.filter(Boolean)
                          : (typeof val === 'string' ? val.split(',').map((s) => s.trim()).filter(Boolean) : []);
                        return list.length === 0 ? (
                          <Text>—</Text>
                        ) : (
                          list.map((lang, i) => {
                            const displayLang = String(lang).split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                            return (
                              <WrapItem key={i}>
                                <Badge colorScheme="gray" variant="subtle" px={2} py={1} borderRadius="md" fontWeight="medium" textTransform="none">
                                  {displayLang}
                                </Badge>
                              </WrapItem>
                            );
                          })
                        );
                      })()}
                    </Wrap>
                  </Flex>
                  <InfoRow label="Specially Abled" value={personal.specially_abled ? 'Yes' : 'No'} />
                  <InfoRow label="Section" value={personal.section} />
                  <InfoRow label="Current year" value={personal.current_year} />
                  <InfoRow label="Current semester" value={personal.current_semester} />
                </VStack>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={3} color="gray.600" fontSize="sm" textTransform="uppercase" letterSpacing="wider">Contact & Status</Text>
                <VStack align="stretch" spacing={0}>
                  <InfoRow label="College email" value={personal.college_email} />
                  <InfoRow label="Personal email" value={personal.personal_email} />
                  <InfoRow label="Phone" value={personal.phone_number ? `${personal.phone_country_code || '+91'} ${personal.phone_number}` : '—'} />
                  <InfoRow label="Registered" value={personal.is_registered ? 'Yes' : 'No'} />
                  <InfoRow label="Active" value={personal.is_active ? 'Yes' : 'No'} />
                  <InfoRow label="Placement Opt-in" value={personal.opt_in ? 'Yes' : 'No'} />
                  <InfoRow label="Policy Agreed" value={personal.has_agreed_placement_policy ? 'Yes' : 'No'} />
                </VStack>
                {personal.social_links && (Array.isArray(personal.social_links) ? personal.social_links.length : Object.keys(personal.social_links).length) > 0 && (
                  <Box mt={4} pt={4} borderTop="1px" borderColor="gray.200" className="social-links-block">
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>Social Links</Text>
                    <VStack align="stretch" spacing={2}>
                      {(Array.isArray(personal.social_links) ? personal.social_links : Object.entries(personal.social_links)).map((item, idx) => {
                        const isEntry = Array.isArray(item);
                        const url = isEntry ? (typeof item[1] === 'string' ? item[1] : item[1]?.url) : (typeof item === 'string' ? item : item?.url);
                        const name = isEntry ? (item[1]?.name || item[1]?.url || item[0]) : (item?.name || item?.url);
                        return url ? (
                          <Box key={idx} py={1.5} px={3} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.100">
                            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={0.5}>{typeof name === 'string' && !name.startsWith('http') && isNaN(Number(name)) ? name.charAt(0).toUpperCase() + name.slice(1) : 'Link'}</Text>
                            <Link href={url} isExternal fontSize="sm" color="gray.800" wordBreak="break-all" _hover={{ textDecoration: 'underline', color: 'gray.900' }}>
                              {url}
                            </Link>
                          </Box>
                        ) : null;
                      })}
                    </VStack>
                  </Box>
                )}
              </Box>
            </SimpleGrid>
          </Box>
        );
      case 'education':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Education History</Heading>
            {education.length === 0 ? (
              <Text color="gray.500">No education history.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {education.map((e, i) => (
                  <Box key={i} p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                    <Flex justify="space-between" align="start" mb={2}>
                      <Box flex="1">
                        <Text fontWeight="bold" fontSize="md">{e.education_level}</Text>
                        <Text fontSize="sm" color="gray.700" mt={1}>{e.institute_name}</Text>
                        <HStack spacing={2} mt={1}>
                          <Badge size="sm" colorScheme="blue">{e.board}</Badge>
                          <Badge size="sm" colorScheme="gray">{e.year_of_passing}</Badge>
                        </HStack>
                      </Box>
                      {e.marksheet_file && (
                        <Button as="a" href={getFileUrl(e.marksheet_file)} target="_blank" size="xs" colorScheme="teal" variant="outline">
                          View Marksheet
                        </Button>
                      )}
                    </Flex>
                    <Text fontSize="sm" color="gray.600" mt={2}>
                      Result: {e.result} {e.result_type || ''}
                    </Text>
                    {e.subjects && <Text fontSize="xs" color="gray.500" mt={1}>Subjects: {e.subjects}</Text>}
                    {e.gap_type && (
                      <Text fontSize="xs" color="orange.600" mt={1}>
                        Gap: {e.gap_type} ({e.gap_duration_months} months) - {e.gap_reason}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        );
      case 'academics':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Semester Academics</Heading>
            {academics.length === 0 ? (
              <Text color="gray.500">No academics data.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {academics.map((a, i) => (
                  <Box key={i} p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                    <Flex justify="space-between" align="start">
                      <Box>
                        <HStack spacing={3} mb={2}>
                          <Badge colorScheme="purple" fontSize="md">{a.academic_year}</Badge>
                          <Badge colorScheme="blue" fontSize="md">Semester {a.semester}</Badge>
                        </HStack>
                        <HStack spacing={4} mt={2}>
                          <Box>
                            <Text fontSize="xs" color="gray.500">SGPA</Text>
                            <Text fontWeight="bold" fontSize="lg" color={a.result_in_sgpa >= 7 ? 'green.600' : 'orange.600'}>
                              {a.result_in_sgpa ?? a.sgpa ?? '-'}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="xs" color="gray.500">Closed Backlogs</Text>
                            <Text fontWeight="semibold">{a.closed_backlogs ?? 0}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="xs" color="gray.500">Live Backlogs</Text>
                            <Text fontWeight="semibold" color={a.live_backlogs > 0 ? 'red.600' : 'green.600'}>
                              {a.live_backlogs ?? 0}
                            </Text>
                          </Box>
                        </HStack>
                      </Box>
                      {(a.provisional_result_upload_links && a.provisional_result_upload_links.length > 0) ? (
                        <VStack spacing={1} align="end">
                          {a.provisional_result_upload_links.map((link, idx) => {
                            const linkUrl = typeof link === 'string' ? link : (link && link.url);
                            return linkUrl ? (
                            <Button key={idx} as="a" href={getFileUrl(linkUrl)} target="_blank" size="xs" colorScheme="teal" variant="outline">
                              View Result {idx + 1}
                            </Button>
                            ) : null;
                          })}
                        </VStack>
                      ) : null}
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        );
      case 'projects':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Projects</Heading>
            {projects.length === 0 ? (
              <Text color="gray.500">No projects.</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                {projects.map((p, i) => {
                  const snaps = Array.isArray(p.project_snaps) ? p.project_snaps : (p.project_snaps ? [p.project_snaps] : []);
                  return (
                  <Box key={i} p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                    <Flex justify="space-between" align="start" mb={2}>
                      <Box flex="1">
                        <Text fontWeight="bold" fontSize="md">{p.title}</Text>
                        <Text fontSize="sm" color="gray.600" mt={1}>{p.one_line_description}</Text>
                      </Box>
                      <HStack spacing={2}>
                        {p.github_repo && (
                          <Button as="a" href={p.github_repo} target="_blank" size="xs" colorScheme="gray" variant="outline">
                            GitHub
                          </Button>
                        )}
                        {p.hosted_link && (
                          <Button as="a" href={p.hosted_link} target="_blank" size="xs" colorScheme="blue" variant="outline">
                            Live Demo
                          </Button>
                        )}
                      </HStack>
                    </Flex>
                    {snaps.length > 0 && (
                      <Box mt={3} mb={3}>
                        <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2}>Project Images</Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {snaps.map((snap, idx) => {
                            const snapUrl = typeof snap === 'string' ? snap : (snap && snap.url);
                            return snapUrl ? (
                            <Box key={idx} w="64px" h="64px" flexShrink={0} borderRadius="md" overflow="hidden" borderWidth="1px" borderColor="gray.200" bg="white">
                              <Image
                                src={getFileUrl(snapUrl)}
                                alt={`${p.title} snap ${idx + 1}`}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </Box>
                            ) : null;
                          })}
                        </HStack>
                      </Box>
                    )}
                    <Wrap spacing={2} mt={2}>
                      {p.genre && <Badge colorScheme="purple">{p.genre}</Badge>}
                      {p.visibility && <Badge colorScheme={p.visibility === 'PUBLIC' ? 'green' : 'gray'}>{p.visibility}</Badge>}
                      {p.is_approved && <Badge colorScheme="green">Approved</Badge>}
                    </Wrap>
                    {p.technologies && p.technologies.length > 0 && (
                      <Wrap spacing={1} mt={2}>
                        {p.technologies.map((tech, idx) => (
                          <Badge key={idx} size="sm" colorScheme="teal" variant="subtle">{tech}</Badge>
                        ))}
                      </Wrap>
                    )}
                    {p.full_description && (
                      <Text fontSize="xs" color="gray.600" mt={2}>{p.full_description}</Text>
                    )}
                    {p.mentor_name && (
                      <Text fontSize="xs" color="gray.500" mt={1}>Mentor: {p.mentor_name}</Text>
                    )}
                  </Box>
                  );
                })}
              </VStack>
            )}
          </Box>
        );
      case 'internships':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Internships</Heading>
            {internships.length === 0 ? (
              <Text color="gray.500">No internships.</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                {internships.map((int, i) => (
                  <Box key={i} p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                    <Flex justify="space-between" align="start" mb={2}>
                      <Box flex="1">
                        <Text fontWeight="bold" fontSize="md">{int.job_role}</Text>
                        <Text fontSize="sm" color="gray.700" mt={1}>{int.organization}</Text>
                        <HStack spacing={2} mt={2}>
                          {int.duration_months && <Badge colorScheme="blue">{int.duration_months} months</Badge>}
                          {int.location && <Badge colorScheme="gray">{int.location}</Badge>}
                          {int.stipend && <Badge colorScheme="green">₹{int.stipend}</Badge>}
                          {int.academic_year && <Badge colorScheme="purple">{int.academic_year}</Badge>}
                        </HStack>
                      </Box>
                      {int.proof_document && (
                        <Button as="a" href={getFileUrl(int.proof_document)} target="_blank" size="xs" colorScheme="teal" variant="outline">
                          View Proof
                        </Button>
                      )}
                    </Flex>
                    {int.description && (
                      <Text fontSize="sm" color="gray.600" mt={2}>{int.description}</Text>
                    )}
                    {int.skills && <Text fontSize="xs" color="gray.500" mt={1}>Skills: {int.skills}</Text>}
                    {int.mentor_name && <Text fontSize="xs" color="gray.500" mt={1}>Mentor: {int.mentor_name}</Text>}
                    {int.start_date && int.end_date && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Duration: {new Date(int.start_date).toLocaleDateString()} - {new Date(int.end_date).toLocaleDateString()}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        );
      case 'career':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Career Profile</Heading>
            {!career || (!career.brief_summary && !career.career_objective && !career.key_expertise && !career.hobbies_interests && !career.future_goals) ? (
              <Text color="gray.500">No career information available.</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                {career.brief_summary && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2}>Brief Summary</Text>
                    <Text fontSize="sm" color="gray.700" lineHeight="1.6">{career.brief_summary}</Text>
                  </Box>
                )}
                {career.career_objective && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2}>Career Objective</Text>
                    <Text fontSize="sm" color="gray.700" lineHeight="1.6">{career.career_objective}</Text>
                  </Box>
                )}
                {career.key_expertise && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2}>Key Expertise</Text>
                    <Text fontSize="sm" color="gray.700" lineHeight="1.6">{career.key_expertise}</Text>
                  </Box>
                )}
                {career.hobbies_interests && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2}>Hobbies & Interests</Text>
                    <Text fontSize="sm" color="gray.700" lineHeight="1.6">{career.hobbies_interests}</Text>
                  </Box>
                )}
                {career.future_goals && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2}>Future Goals</Text>
                    <Text fontSize="sm" color="gray.700" lineHeight="1.6">{career.future_goals}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </Box>
        );
      case 'family':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Parent / Guardian</Heading>
            {family.length === 0 ? (
              <Text color="gray.500">No parent/guardian details.</Text>
            ) : (
              <VStack align="stretch" spacing={2}>
                {family.map((f, i) => (
                  <Box key={i} p={2} bg="gray.50" borderRadius="md">
                    <Text fontWeight="medium">{f.name} ({f.parent_type})</Text>
                    {(f.occupation || f.email) && <Text fontSize="sm" color="gray.600">{[f.occupation, f.email].filter(Boolean).join(' · ')}</Text>}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        );
      case 'trainings':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Trainings</Heading>
            {trainings.length === 0 ? (
              <Text color="gray.500">No trainings.</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                {trainings.map((t, i) => (
                  <Box key={i} p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                    <Flex justify="space-between" align="start" mb={2}>
                      <Box flex="1">
                        <Text fontWeight="bold" fontSize="md">{t.title}</Text>
                        <Text fontSize="sm" color="gray.700" mt={1}>{t.institution}</Text>
                        <HStack spacing={2} mt={2}>
                          {t.training_type && <Badge colorScheme="purple">{t.training_type}</Badge>}
                        </HStack>
                      </Box>
                      {t.proof_document && (
                        <Button as="a" href={getFileUrl(t.proof_document)} target="_blank" size="xs" colorScheme="teal" variant="outline">
                          View Proof
                        </Button>
                      )}
                    </Flex>
                    {t.description && (
                      <Text fontSize="sm" color="gray.600" mt={2}>{t.description}</Text>
                    )}
                    {t.skills && <Text fontSize="xs" color="gray.500" mt={1}>Skills: {t.skills}</Text>}
                    {t.start_date && t.end_date && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Duration: {new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        );
      case 'certifications':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Certifications</Heading>
            {certifications.length === 0 ? (
              <Text color="gray.500">No certifications.</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                {certifications.map((c, i) => (
                  <Box key={i} p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                    <Flex justify="space-between" align="start" mb={2}>
                      <Box flex="1">
                        <Text fontWeight="bold" fontSize="md">{c.title}</Text>
                        <Text fontSize="sm" color="gray.700" mt={1}>{c.organization}</Text>
                        <HStack spacing={2} mt={2}>
                          {c.certification_type && <Badge colorScheme="purple">{c.certification_type}</Badge>}
                          {c.score && <Badge colorScheme="green">Score: {c.score}</Badge>}
                          {c.issue_date && <Badge colorScheme="blue">{new Date(c.issue_date).toLocaleDateString()}</Badge>}
                        </HStack>
                      </Box>
                      {c.proof_document && (
                        <Button as="a" href={getFileUrl(c.proof_document)} target="_blank" size="xs" colorScheme="teal" variant="outline">
                          View Certificate
                        </Button>
                      )}
                    </Flex>
                    {c.skills && Array.isArray(c.skills) && c.skills.length > 0 && (
                      <Wrap spacing={1} mt={2}>
                        {c.skills.map((skill, idx) => (
                          <Badge key={idx} size="sm" colorScheme="teal" variant="subtle">{skill}</Badge>
                        ))}
                      </Wrap>
                    )}
                    {c.expiry_date && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Expires: {new Date(c.expiry_date).toLocaleDateString()}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        );
      case 'publications':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Publications</Heading>
            {publications.length === 0 ? (
              <Text color="gray.500">No publications.</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                {publications.map((p, i) => (
                  <Box key={i} p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                    <Flex justify="space-between" align="start" mb={2}>
                      <Box flex="1">
                        <Text fontWeight="bold" fontSize="md">{p.title}</Text>
                        <Text fontSize="sm" color="gray.700" mt={1}>{p.publication_name}</Text>
                        <HStack spacing={2} mt={2}>
                          {p.publication_type && <Badge colorScheme="purple">{p.publication_type}</Badge>}
                          {p.author_count && <Badge colorScheme="blue">{p.author_count} authors</Badge>}
                          {p.publication_date && <Badge colorScheme="gray">{new Date(p.publication_date).toLocaleDateString()}</Badge>}
                        </HStack>
                      </Box>
                      <VStack spacing={1} align="end">
                        {p.link && (
                          <Button as="a" href={p.link} target="_blank" size="xs" colorScheme="blue" variant="outline">
                            View Publication
                          </Button>
                        )}
                        {p.evidence_document && (
                          <Button as="a" href={getFileUrl(p.evidence_document)} target="_blank" size="xs" colorScheme="teal" variant="outline">
                            View Evidence
                          </Button>
                        )}
                      </VStack>
                    </Flex>
                    {p.description && (
                      <Text fontSize="sm" color="gray.600" mt={2}>{p.description}</Text>
                    )}
                    {p.skills && <Text fontSize="xs" color="gray.500" mt={1}>Skills: {p.skills}</Text>}
                    {p.mentor_name && <Text fontSize="xs" color="gray.500" mt={1}>Mentor: {p.mentor_name}</Text>}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        );
      case 'extra':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Extra-Curricular</Heading>
            {extraCurricular.length === 0 ? (
              <Text color="gray.500">No extra-curricular activities.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {extraCurricular.map((e, i) => (
                  <Box key={i} p={3} bg="gray.50" borderRadius="md">
                    <Text fontWeight="bold">{e.activity}</Text>
                    <Text fontSize="sm" color="gray.600">{e.role}</Text>
                    {e.description && <Text fontSize="sm" mt={1}>{e.description}</Text>}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        );
      case 'other':
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Other Experiences</Heading>
            {otherExperiences.length === 0 ? (
              <Text color="gray.500">No other experiences.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {otherExperiences.map((e, i) => (
                  <Box key={i} p={3} bg="gray.50" borderRadius="md">
                    <Text fontWeight="bold">{e.title}</Text>
                    <Text fontSize="sm" color="gray.600">{e.description}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        );
      case 'resume': {
        const resumeFile = profile.resume_file || career?.resume_file;
        return (
          <Box className="admin-student-section" bg="white" borderRadius="xl" shadow="sm" p={6} borderWidth="1px" borderColor="gray.100">
            <Heading size="md" mb={4} color="#20343c" borderBottom="1px" borderColor="gray.100" pb={3}>Resume</Heading>
            <Box p={6} borderWidth="1px" borderRadius="lg" borderColor="gray.200" borderStyle="dashed" textAlign="center">
              <Icon as={FaFileAlt} w={10} h={10} color="gray.400" mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>Student Resume</Text>
              <Text color="gray.500" fontSize="sm" mb={6}>
                {resumeFile ? 'Resume uploaded.' : 'No resume uploaded.'}
              </Text>
              {resumeFile && (
                <Button as="a" href={getFileUrl(resumeFile)} target="_blank" colorScheme="blue" leftIcon={<FaFileAlt />}>
                  View / Download
                </Button>
              )}
            </Box>
          </Box>
        );
      }
      default:
        return null;
    }
  };

  return content(
    <Box className="admin-student-detail" minH="calc(100vh - 72px)" display="flex" flexDirection="column">
        {!embedded && (
          <Box
            className="admin-student-header"
            bg="#20343c"
            borderBottom="1px solid"
            borderColor="#2d4a54"
            px={{ base: 4, lg: 8 }}
            py={4}
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <HStack spacing={4}>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<ChevronLeftIcon />}
                  onClick={() => navigate('/placement/students')}
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200', color: '#FDE74C' }}
                >
                  Back to Students
                </Button>
                <Box>
                  <Heading size="md" color="white" fontWeight="600">
                    {personal.full_name || profile.firstName}
                  </Heading>
                  <Text fontSize="sm" color="whiteAlpha.800">USN: {profile.usn}</Text>
                </Box>
              </HStack>
              <Wrap spacing={2}>
                {personal.schoolName && <Badge colorScheme="teal" variant="subtle">{personal.schoolName}</Badge>}
                {personal.programName && <Badge colorScheme="purple" variant="subtle">{personal.programName}</Badge>}
                {personal.year_of_joining && <Badge colorScheme="gray" variant="subtle">Joined {personal.year_of_joining}</Badge>}
                {personal.current_year && <Badge colorScheme="gray" variant="outline">Year {personal.current_year}</Badge>}
              </Wrap>
            </Flex>
          </Box>
        )}

        <Box flex="1" display="flex" flexDirection="column" minH="0" overflow="hidden">
          <Box
            px={{ base: 4, lg: 0 }}
            py={3}
            display={{ base: 'block', lg: 'none' }}
            bg="white"
            borderBottom="1px"
            borderColor="gray.200"
            flexShrink={0}
          >
            <Select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              size="sm"
              borderColor="gray.200"
              _focus={{ borderColor: '#d4a960', boxShadow: '0 0 0 1px #d4a960' }}
              borderRadius="md"
            >
              {SIDEBAR_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </Select>
          </Box>
          <Grid
            templateColumns={{ base: '1fr', lg: '260px 1fr' }}
            flex="1"
            minH="0"
            className="admin-student-grid"
          >
            <Box
              className="admin-student-sidebar"
              bg="#f0f0f0"
              borderRight="1px solid"
              borderColor="gray.200"
              py={6}
              overflowY="auto"
              display={{ base: 'none', lg: 'block' }}
            >
              <VStack align="stretch" spacing={0} px={2}>
                {SIDEBAR_ITEMS.map((item) => (
                  <Box
                    key={item.id}
                    as="button"
                    w="100%"
                    textAlign="left"
                    px={4}
                    py={3}
                    borderRadius="lg"
                    cursor="pointer"
                    display="flex"
                    alignItems="center"
                    gap={3}
                    bg={activeSection === item.id ? '#dbeafe' : 'transparent'}
                    color={activeSection === item.id ? '#1e40af' : 'gray.600'}
                    fontWeight={activeSection === item.id ? 'bold' : 'medium'}
                    _hover={{ bg: activeSection === item.id ? '#dbeafe' : 'gray.100' }}
                    transition="all 0.2s"
                    border="none"
                    onClick={() => setActiveSection(item.id)}
                  >
                    <Icon as={item.icon} color={activeSection === item.id ? '#3b82f6' : '#6366f1'} boxSize={4} flexShrink={0} />
                    <Text fontSize="sm">{item.label}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
            <Box
              className="admin-student-content"
              p={{ base: 4, lg: 8 }}
              overflowY="auto"
              bg="#f0f0f0"
              minH="0"
            >
              <Box maxW="1200px">
                {/* Placement Overview — at top */}
                <Box
                  mb={8}
                  bg="white"
                  borderRadius="xl"
                  shadow="sm"
                  borderWidth="1px"
                  borderColor="gray.200"
                  overflow="hidden"
                >
                  <Box px={6} py={4} bg="#20343c" borderBottomWidth="1px" borderColor="gray.200">
                    <Heading size="md" color="white" fontWeight="600">
                      Placement Overview
                    </Heading>
                    <Text fontSize="sm" color="whiteAlpha.800" mt={1}>
                      Basic details and placement-related summary
                    </Text>
                  </Box>
                  <Box p={6}>
                    {placementDataLoading ? (
                      <Flex justify="center" py={8}><Spinner size="lg" color="#20343c" /></Flex>
                    ) : (
                      <VStack align="stretch" spacing={6}>
                        {/* Basic details */}
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2} textTransform="uppercase" letterSpacing="wider">
                            Basic details
                          </Text>
                          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} gap={3}>
                            {[
                              { label: 'USN', value: profile.usn || personal.usn },
                              { label: 'Name', value: personal.full_name },
                              { label: 'Email', value: personal.college_email },
                              { label: 'School', value: personal.schoolName },
                              { label: 'Program', value: personal.programName },
                              { label: 'Year of joining', value: personal.year_of_joining },
                              { label: 'Section', value: personal.section },
                            ].map(({ label, value }) => (
                              <Box key={label} py={2} px={3} bg="gray.50" borderRadius="md">
                                <Text fontSize="xs" color="gray.500" fontWeight="600">{label}</Text>
                                <Text fontSize="sm" mt={0.5}>{value ?? '—'}</Text>
                              </Box>
                            ))}
                          </SimpleGrid>
                        </Box>
                        <Divider />
                        {/* Placement metrics */}
                        <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={4}>
                          <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.100">
                            <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">Offers received</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="gray.800">{placementData.offers.length}</Text>
                          </Box>
                          <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.100">
                            <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">Drives appeared</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                              {new Set((placementData.processList || []).map((p) => p.drive_id || p.placement_drive_id)).size}
                            </Text>
                          </Box>
                          <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.100">
                            <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">Companies approached</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                              {new Set((placementData.processList || []).map((p) => p.company_name || p.drive?.company?.company_name).filter(Boolean)).size}
                            </Text>
                          </Box>
                          <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.100">
                            <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">Opt-in for placement</Text>
                            <Text fontSize="lg" fontWeight="bold" color={personal.opt_in ? 'green.600' : 'gray.500'}>{personal.opt_in ? 'Yes' : 'No'}</Text>
                          </Box>
                          <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.100">
                            <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">Profile completion</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="gray.800">{profileCompletion}%</Text>
                          </Box>
                          <Box p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.100">
                            <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">Placement status</Text>
                            <Text fontSize="lg" fontWeight="bold" color={placementData.offers.length > 0 ? 'green.600' : 'gray.600'}>
                              {placementData.offers.length > 0 ? 'Has offer(s)' : 'No offers yet'}
                            </Text>
                          </Box>
                        </SimpleGrid>
                        {/* Offers table */}
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2} textTransform="uppercase" letterSpacing="wider">
                            Offers received
                          </Text>
                          {placementData.offers.length === 0 ? (
                            <Text color="gray.500" fontSize="sm">No offers.</Text>
                          ) : (
                            <TableContainer borderWidth="1px" borderRadius="md" borderColor="gray.200" overflowX="auto">
                              <Table size="sm">
                                <Thead bg="gray.50">
                                  <Tr>
                                    <Th>Company</Th>
                                    <Th>Designation</Th>
                                    <Th>Job type</Th>
                                    <Th>CTC (LPA)</Th>
                                    <Th>Status</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {placementData.offers.slice(0, 20).map((o) => (
                                    <Tr key={o.id || o.placement_id}>
                                      <Td>{o.company_name || o.company?.company_name || '—'}</Td>
                                      <Td>{o.designation || '—'}</Td>
                                      <Td>{o.job_type || '—'}</Td>
                                      <Td>{o.ctc_min_lpa != null || o.ctc_max_lpa != null ? `${o.ctc_min_lpa ?? '-'}–${o.ctc_max_lpa ?? '-'}` : '—'}</Td>
                                      <Td>{o.is_accepted === true ? 'Accepted' : o.is_accepted === false ? 'Rejected' : o.offer_letter_status || '—'}</Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                        {/* Process table overview */}
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2} textTransform="uppercase" letterSpacing="wider">
                            Process table overview
                          </Text>
                          {placementData.processList.length === 0 ? (
                            <Text color="gray.500" fontSize="sm">No drive registrations.</Text>
                          ) : (
                            <TableContainer borderWidth="1px" borderRadius="md" borderColor="gray.200" overflowX="auto" maxH="240px" overflowY="auto">
                              <Table size="sm">
                                <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                                  <Tr>
                                    <Th>Drive / Company</Th>
                                    <Th>Job type</Th>
                                    <Th>Status</Th>
                                    <Th>Stage</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {placementData.processList.slice(0, 50).map((p, idx) => (
                                    <Tr key={p.id || idx}>
                                      <Td>{p.company_name || p.drive?.company?.company_name || `Drive ${p.drive_id || p.placement_drive_id}`}</Td>
                                      <Td>{p.job_type || p.drive?.job_type || '—'}</Td>
                                      <Td>{p.drive?.placement_status || '—'}</Td>
                                      <Td>{p.stage || p.current_stage || '—'}</Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                        {/* Malpractice / Disciplinary */}
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2} textTransform="uppercase" letterSpacing="wider">
                            Malpractice / Disciplinary
                          </Text>
                          {placementData.disciplinary.length === 0 ? (
                            <Text color="gray.500" fontSize="sm">None.</Text>
                          ) : (
                            <TableContainer borderWidth="1px" borderRadius="md" borderColor="gray.200" overflowX="auto">
                              <Table size="sm">
                                <Thead bg="gray.50">
                                  <Tr>
                                    <Th>Type</Th>
                                    <Th>Severity</Th>
                                    <Th>Description</Th>
                                    <Th>Period</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {placementData.disciplinary.map((d, idx) => (
                                    <Tr key={d.id || idx}>
                                      <Td>{d.violation_type || '—'}</Td>
                                      <Td><Badge colorScheme={d.severity === 'CRITICAL' ? 'red' : d.severity === 'MAJOR' ? 'orange' : 'gray'}>{d.severity || '—'}</Badge></Td>
                                      <Td>{d.description || '—'}</Td>
                                      <Td>{d.start_date ? `${d.start_date}${d.end_date ? ` – ${d.end_date}` : ''}` : '—'}</Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                        {/* Placement violations */}
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" color="gray.600" mb={2} textTransform="uppercase" letterSpacing="wider">
                            Placement violations
                          </Text>
                          {placementData.violations.length === 0 ? (
                            <Text color="gray.500" fontSize="sm">None.</Text>
                          ) : (
                            <TableContainer borderWidth="1px" borderRadius="md" borderColor="gray.200" overflowX="auto">
                              <Table size="sm">
                                <Thead bg="gray.50">
                                  <Tr>
                                    <Th>Type</Th>
                                    <Th>Penalty</Th>
                                    <Th>Remarks</Th>
                                    <Th>Drive</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {placementData.violations.map((v, idx) => (
                                    <Tr key={v.id || idx}>
                                      <Td>{v.violation_type || '—'}</Td>
                                      <Td><Badge colorScheme={v.penalty_type === 'PERMANENT_BAN' ? 'red' : v.penalty_type === 'TEMP_BAN' ? 'orange' : 'yellow'}>{v.penalty_type || '—'}{v.penalty_days ? ` (${v.penalty_days}d)` : ''}</Badge></Td>
                                      <Td>{v.remarks || '—'}</Td>
                                      <Td>{v.drive?.company?.company_name || v.placement_drive_id || '—'}</Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                      </VStack>
                    )}
                  </Box>
                </Box>

                {renderSectionContent()}
              </Box>
            </Box>
          </Grid>
        </Box>
      </Box>
  );
};

export default AdminStudentDetail;
