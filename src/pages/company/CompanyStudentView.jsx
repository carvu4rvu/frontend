import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  Flex,
  Icon,
  Badge,
  Spinner,
  Card,
  CardBody,
  SimpleGrid,
  Divider,
  Avatar,
  Link,
  Image,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { 
  ArrowBackIcon,
  ExternalLinkIcon,
  DownloadIcon,
  StarIcon,
} from '@chakra-ui/icons';
import { 
  FaUserGraduate, 
  FaGraduationCap,
  FaBriefcase,
  FaProjectDiagram,
  FaCertificate,
  FaGithub,
  FaExternalLinkAlt,
  FaFilePdf,
  FaBook,
  FaLightbulb,
  FaBuilding,
} from 'react-icons/fa';
import CompanyLayout from '../../components/CompanyLayout';
import { CompanyService } from '../../services/company.service';
import { getFileUrl } from '../../utils/fileUrl';
import { ProjectShowcase } from '../../components/student/projects/ProjectShowcase';
import '../../pages/student/profile/ProjectsProfile.css';
import './CompanyStudentView.css';

const colors = {
  accent: '#d4a960',
  accentHover: '#c4983f',
  accentLight: '#f8f3e8',
  dark: '#172e36',
  darkBlue: '#1e3a47',
  secondary: '#64748b',
  cardBg: '#ffffff',
  pageBg: '#f1f5f9',
  border: '#e2e8f0',
};

const SectionHead = ({ icon, title }) => (
  <div className="company-student-view-section-head">
    <div className="section-icon">
      <Icon as={icon} boxSize={5} />
    </div>
    <h2 className="section-title">{title}</h2>
  </div>
);

const SectionCard = ({ icon, title, children, isEmpty, className = '' }) => (
  <div className={`company-student-view-section-card ${className}`.trim()}>
    <SectionHead icon={icon} title={title} />
    {isEmpty ? (
      <p className="company-student-view-empty">No information available</p>
    ) : children}
  </div>
);

const CompanyStudentView = () => {
  const { usn } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, [usn]);

  const loadStudent = async () => {
    setLoading(true);
    try {
      const data = await CompanyService.getStudentProfile(usn);
      setStudent(data);
    } catch (err) {
      toast({
        title: 'Failed to load student profile',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const MandatoryDetailRow = ({ label, value }) => (
    <div className="company-student-view-row">
      <Text as="dt" fontSize="sm" fontWeight="600" color={colors.secondary}>
        {label}
      </Text>
      <Text as="dd" fontSize="sm" color={colors.dark}>
        {value ?? '—'}
      </Text>
    </div>
  );

  if (loading) {
    return (
      <CompanyLayout>
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color={colors.accent} thickness="4px" />
        </Flex>
      </CompanyLayout>
    );
  }

  if (!student) {
    return (
      <CompanyLayout>
        <Container maxW="1200px" py={8}>
          <VStack spacing={4}>
            <Text>Student not found</Text>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </VStack>
        </Container>
      </CompanyLayout>
    );
  }

  const profileImageUrl = student.profile_image ? getFileUrl(student.profile_image) : null;
  const resumeUrl = student.profile?.resume_file ? getFileUrl(student.profile.resume_file) : null;

  return (
    <CompanyLayout>
      <Box className="company-student-view-page" minH="100vh" py={8}>
        <Container maxW="1200px">
          <Button
            className="company-student-view-back"
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            size="sm"
            mb={4}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>

          {/* Profile Header Card */}
          <Card className="company-student-view-header-card" mb={6}>
            <CardBody p={8}>
              <Flex gap={6} align="start" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                <Avatar
                  size="2xl"
                  name={student.full_name}
                  src={profileImageUrl}
                  bg={colors.dark}
                  color="white"
                  border="4px solid white"
                  boxShadow="lg"
                />
                <Box flex="1">
                  <Heading size="xl" color={colors.dark} mb={2}>
                    {student.full_name}
                  </Heading>
                  <HStack spacing={3} mb={3} flexWrap="wrap">
                    <Badge bg={colors.accentLight} color={colors.accent} fontSize="sm" px={3} py={1} borderRadius="full">
                      {student.program_name || 'Program'}
                    </Badge>
                    {student.specialization_name && (
                      <Badge colorScheme="purple" fontSize="sm" borderRadius="full">
                        {student.specialization_name}
                      </Badge>
                    )}
                    <Badge colorScheme="blue" fontSize="sm" borderRadius="full">
                      Year {student.current_year}
                    </Badge>
                  </HStack>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color={colors.secondary}>
                      <Icon as={FaGraduationCap} mr={2} />
                      {student.school_name || 'School'}
                    </Text>
                    <Text fontSize="sm" color={colors.secondary}>
                      Joined {student.year_of_joining}
                    </Text>
                  </VStack>
                </Box>
                {resumeUrl && (
                  <Button
                    as="a"
                    href={resumeUrl}
                    target="_blank"
                    leftIcon={<Icon as={FaFilePdf} />}
                    bg={colors.dark}
                    color="white"
                    _hover={{ bg: colors.darkBlue }}
                    size="lg"
                    borderRadius="xl"
                  >
                    View Resume
                  </Button>
                )}
              </Flex>
            </CardBody>
          </Card>

          {/* Mandatory details for company view */}
          <Box className="company-student-view-mandatory-wrap" mb={6}>
            <SectionHead icon={FaUserGraduate} title="Mandatory Details" />
            <Box as="dl" className="company-student-view-dl">
              <MandatoryDetailRow label="USN" value={student.usn} />
              <MandatoryDetailRow label="Full Name" value={student.full_name} />
              <MandatoryDetailRow label="Degree 1" value={student.program_name} />
              <MandatoryDetailRow label="Degree 1 Primary Specializations" value={student.specialization_name} />
              <MandatoryDetailRow label="Gender" value={student.gender} />
              <MandatoryDetailRow label="Official Email" value={student.official_email ?? student.college_email} />
              <MandatoryDetailRow
                label="Personal Emails"
                value={Array.isArray(student.personal_emails) ? student.personal_emails.join(', ') : student.personal_email}
              />
              <MandatoryDetailRow label="Official Phone" value={student.official_phone} />
              <MandatoryDetailRow label="Date of Birth (DD-MM-YYYY)" value={student.date_of_birth_formatted} />
              <MandatoryDetailRow label="10th - Aggregate Marks" value={student.tenth_aggregate_marks} />
              <MandatoryDetailRow label="12th - Aggregate Marks" value={student.twelfth_aggregate_marks} />
              <MandatoryDetailRow label="Diploma - Aggregate Marks" value={student.diploma_aggregate_marks} />
              <MandatoryDetailRow label="Current Academics Aggregate Marks" value={student.current_aggregate_marks} />
              <MandatoryDetailRow label="Current Academics Live Backlogs" value={student.current_live_backlogs != null ? String(student.current_live_backlogs) : null} />
              <div className="company-student-view-row">
                <Text as="dt" fontSize="sm" fontWeight="600" color={colors.secondary}>Resume Link</Text>
                <Box as="dd">
                  {resumeUrl ? (
                    <Link href={resumeUrl} isExternal color="blue.600" fontWeight="500" fontSize="sm">
                      View Resume <ExternalLinkIcon mx="2px" />
                    </Link>
                  ) : (
                    <Text color={colors.secondary} fontSize="sm">—</Text>
                  )}
                </Box>
              </div>
            </Box>
          </Box>

          <SimpleGrid className="company-student-view-grid-wrap" columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* Profile Summary */}
            <SectionCard 
              icon={FaLightbulb} 
              title="Profile Summary"
              isEmpty={!student.profile?.brief_summary && !student.profile?.career_objective}
            >
              {student.profile?.brief_summary && (
                <Box mb={4}>
                  <p className="company-student-view-summary-label">About</p>
                  <p className="company-student-view-summary-text">{student.profile.brief_summary}</p>
                </Box>
              )}
              {student.profile?.key_expertise && (
                <Box mb={4}>
                  <p className="company-student-view-summary-label">Key expertise</p>
                  <p className="company-student-view-summary-text">{student.profile.key_expertise}</p>
                </Box>
              )}
              {student.profile?.career_objective && (
                <Box>
                  <p className="company-student-view-summary-label">Career objective</p>
                  <p className="company-student-view-summary-text">{student.profile.career_objective}</p>
                </Box>
              )}
            </SectionCard>

            {/* Education */}
            <SectionCard 
              icon={FaBook} 
              title="Education History"
              isEmpty={!student.education || student.education.length === 0}
            >
              <VStack spacing={3} align="stretch">
                {student.education?.map((edu, idx) => (
                  <Box key={idx} className="company-student-view-block">
                    <HStack justify="space-between" mb={1}>
                      <Badge colorScheme="blue" borderRadius="full" fontSize="xs">
                        {edu.education_level}
                      </Badge>
                      <Text className="block-meta" fontSize="sm">{edu.year_of_passing}</Text>
                    </HStack>
                    <Text className="block-title" fontSize="sm">{edu.institute_name}</Text>
                    {edu.result != null && (
                      <Text className="block-highlight" fontSize="sm">
                        {edu.result} {edu.result_type || ''}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            </SectionCard>

            {/* Projects - Full Width (showcase style like student side) */}
            <Box gridColumn={{ lg: 'span 2' }} className="company-student-view-projects-section">
              <SectionCard 
                icon={FaProjectDiagram} 
                title={`Projects (${student.projects?.length || 0})`}
                isEmpty={false}
              >
                <ProjectShowcase
                  projects={student.projects || []}
                  studentName={student.full_name}
                />
              </SectionCard>
            </Box>

            {/* Internships */}
            <SectionCard 
              icon={FaBriefcase} 
              title={`Internships (${(student.internships?.length || 0) + (student.summer_internships?.length || 0)})`}
              isEmpty={(!student.internships || student.internships.length === 0) && (!student.summer_internships || student.summer_internships.length === 0)}
            >
              <VStack spacing={3} align="stretch">
                {student.internships?.map((intern, idx) => (
                  <Box key={`int-${idx}`} className="company-student-view-block">
                    <Text className="block-title">{intern.job_role}</Text>
                    <HStack spacing={2} mb={1}>
                      <Icon as={FaBuilding} color={colors.accent} boxSize={3} />
                      <Text className="block-meta" fontSize="sm">{intern.organization}</Text>
                    </HStack>
                    <Text className="block-meta" fontSize="xs">
                      {formatDate(intern.start_date)} – {formatDate(intern.end_date)}
                      {intern.duration_months && ` (${intern.duration_months} months)`}
                    </Text>
                    {intern.skills && (
                      <Text className="block-meta" fontSize="xs" mt={2}>
                        <strong>Skills:</strong> {intern.skills}
                      </Text>
                    )}
                  </Box>
                ))}
                {student.summer_internships?.map((intern, idx) => (
                  <Box key={`summer-${idx}`} className="company-student-view-block">
                    <HStack justify="space-between" mb={1}>
                      <Text className="block-title">{intern.job_role}</Text>
                      <Badge colorScheme="orange" fontSize="xs">Summer</Badge>
                    </HStack>
                    <HStack spacing={2} mb={1}>
                      <Icon as={FaBuilding} color={colors.accent} boxSize={3} />
                      <Text className="block-meta" fontSize="sm">{intern.organization}</Text>
                    </HStack>
                    <Text className="block-meta" fontSize="xs">
                      {formatDate(intern.start_date)} – {formatDate(intern.end_date)}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </SectionCard>

            {/* Certifications */}
            <SectionCard 
              icon={FaCertificate} 
              title={`Certifications (${student.certifications?.length || 0})`}
              isEmpty={!student.certifications || student.certifications.length === 0}
            >
              <VStack spacing={3} align="stretch">
                {student.certifications?.map((cert, idx) => (
                  <Box key={idx} className="company-student-view-block">
                    <Text className="block-title">{cert.title}</Text>
                    <Text className="block-meta" fontSize="sm">{cert.organization}</Text>
                    <HStack justify="space-between" mt={2}>
                      <Text className="block-meta" fontSize="xs">Issued: {formatDate(cert.issue_date)}</Text>
                      {cert.score && (
                        <Badge colorScheme="green" fontSize="xs">{cert.score}</Badge>
                      )}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </SectionCard>

            {/* Capstone */}
            {student.capstone && student.capstone.length > 0 && (
              <SectionCard icon={FaGraduationCap} title="Capstone / Final Year Project">
                <VStack spacing={3} align="stretch">
                  {student.capstone.map((cap, idx) => (
                    <Box key={idx} className="company-student-view-block">
                      <HStack spacing={2} mb={1}>
                        <Icon as={FaBuilding} color={colors.accent} boxSize={3} />
                        <Text className="block-title">{cap.company_name}</Text>
                      </HStack>
                      <Text className="block-meta" fontSize="sm">{cap.designation}</Text>
                      <Text className="block-meta" fontSize="xs" mt={1}>
                        {cap.internship_duration_months} months • {cap.academic_year}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </SectionCard>
            )}
          </SimpleGrid>
        </Container>
      </Box>
    </CompanyLayout>
  );
};

export default CompanyStudentView;
