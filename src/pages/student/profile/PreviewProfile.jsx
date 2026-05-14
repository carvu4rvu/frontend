import { useEffect, useState, useCallback } from "react"
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  HStack,
  VStack,
  Badge,
  Button,
  Divider,
  Card,
  CardBody,
  Spinner,
  Link,
  Icon,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react"
import { FaPrint, FaLinkedin, FaGithub, FaGlobe, FaEnvelope, FaPhone, FaFileAlt } from "react-icons/fa"
import { StudentProfileService } from "../../../services/studentProfile.service"
import { useAuth } from "../../../context/AuthContext"
import { getProfileErrorMessage } from "../../../utils/profileErrorHelper"

export const PreviewProfile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const { user, loading: authLoading } = useAuth()
  const usn = user?.usn
  const toast = useToast()

  const loadProfile = useCallback(async () => {
    if (!usn) return
    setLoadError(null)
    setLoading(true)
    try {
      const data = await StudentProfileService.getFullProfile(usn)
      if (data && data.contact) {
        data.communication = data.contact
        if (!data.communication.links) data.communication.links = {}
      }
      const toArray = (v) => Array.isArray(v) ? v : (typeof v === 'string' ? v.split(/[,\\n]/).map(s => s.trim()).filter(Boolean) : [])
      if (data && data.career) {
        data.career.keyExpertise = toArray(data.career.keyExpertise)
      }
      setProfile(data)
    } catch (err) {
      const msg = getProfileErrorMessage(err)
      setLoadError(msg)
      toast({
        title: "Error loading profile",
        description: msg,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }, [usn, toast])

  useEffect(() => {
    if (usn) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [usn, loadProfile])

  const handlePrint = () => {
    window.print()
  }

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="80vh">
        <Spinner size="xl" color="#d4a960" />
      </Box>
    )
  }

  if (!usn) {
    return (
      <Box p={8}>
        <Text>Please log in to view your profile.</Text>
      </Box>
    )
  }

  if (loadError && !profile) {
    return (
      <Box p={8}>
        <Alert status="error" borderRadius="md" flexDirection={{ base: "column", md: "row" }} alignItems="stretch">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Could not load profile</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Box>
          <Button size="sm" colorScheme="red" variant="outline" alignSelf="center" onClick={loadProfile}>
            Retry
          </Button>
        </Alert>
      </Box>
    )
  }

  if (loading || !profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="80vh">
        <Spinner size="xl" color="#d4a960" />
      </Box>
    )
  }

  return (
    <Container maxW="container.lg" py={8} className="print-container">
      <HStack justifyContent="space-between" mb={8} className="no-print">
        <HStack spacing={2}>
          <Icon as={FaFileAlt} color="#d4a960" boxSize={7} />
          <Heading size="lg">Profile Preview</Heading>
        </HStack>
        <Button leftIcon={<FaPrint />} colorScheme="blue" onClick={handlePrint}>
          Print / Save as PDF
        </Button>
      </HStack>

      <Card p={8} bg="white" shadow="md" variant="elevated">
        <CardBody>
          {/* Header Section */}
          <VStack align="center" gap={2} mb={8}>
            <Heading size="2xl">{profile.personal.fullName}</Heading>
            <Text fontSize="lg" color="gray.700">
              {profile.personal.programId} - {profile.personal.specializationId}
            </Text>
            <HStack gap={4} flexWrap="wrap" justify="center">
              <HStack>
                <Icon as={FaEnvelope} color="gray.600" />
                <Text>{profile.communication.collegeEmail}</Text>
              </HStack>
              <HStack>
                <Icon as={FaPhone} color="gray.600" />
                <Text>{profile.communication.phoneCountryCode} {profile.communication.phoneNumber}</Text>
              </HStack>
            </HStack>
            <HStack gap={4}>
              {profile.communication.links.linkedin && (
                <Link href={profile.communication.links.linkedin} isExternal color="blue.500">
                  <HStack><Icon as={FaLinkedin} /> <Text>LinkedIn</Text></HStack>
                </Link>
              )}
              {profile.communication.links.github && (
                <Link href={profile.communication.links.github} isExternal color="gray.800">
                  <HStack><Icon as={FaGithub} /> <Text>GitHub</Text></HStack>
                </Link>
              )}
              {profile.communication.links.portfolio && (
                <Link href={profile.communication.links.portfolio} isExternal color="teal.500">
                  <HStack><Icon as={FaGlobe} /> <Text>Portfolio</Text></HStack>
                </Link>
              )}
            </HStack>
          </VStack>

          <Divider mb={6} />

          <Stack gap={8}>
            {/* Career Summary */}
            <Section title="Career Summary">
              <Text>{profile.career.briefSummary}</Text>
              <Box mt={2}>
                <Text fontWeight="bold" mb={1}>Key Expertise:</Text>
                <HStack flexWrap="wrap">
                  {profile.career.keyExpertise.map((skill, i) => (
                    <Badge key={i} colorScheme="blue" variant="subtle">{skill}</Badge>
                  ))}
                </HStack>
              </Box>
            </Section>

            {/* Education */}
            <Section title="Education">
              <Stack gap={4}>
                {profile.education.map((edu, i) => (
                  <Box key={i}>
                    <HStack justify="space-between">
                      <Text fontWeight="bold">{edu.instituteName}</Text>
                      <Text color="gray.700">{edu.yearOfPassing}</Text>
                    </HStack>
                    <Text>{edu.educationLevel} - {edu.board}</Text>
                    <Text fontSize="sm" color="gray.600">Result: {edu.result} {edu.resultType}</Text>
                  </Box>
                ))}
              </Stack>
            </Section>

            {/* Projects */}
            <Section title="Projects">
              <Stack gap={4}>
                {profile.projects.map((proj, i) => (
                  <Box key={i}>
                    <HStack justify="space-between">
                      <Text fontWeight="bold">{proj.title}</Text>
                      <HStack gap={3}>
                        {proj.projectLink && (
                          <Link href={proj.projectLink} isExternal fontSize="sm" color="blue.500">View Project</Link>
                        )}
                        {proj.proofFile && (
                          <Link href={proj.proofFile} isExternal fontSize="sm" color="teal.500">View Proof</Link>
                        )}
                      </HStack>
                    </HStack>
                    <Text fontSize="sm" mb={1}>{proj.description}</Text>
                    {proj.mentorName && <Text fontSize="xs" color="gray.700">Mentor: {proj.mentorName}</Text>}
                    <HStack flexWrap="wrap" mt={1}>
                      {proj.skills && proj.skills.map((skill, j) => (
                        <Badge key={j} size="sm" variant="outline">{skill}</Badge>
                      ))}
                    </HStack>
                  </Box>
                ))}
              </Stack>
            </Section>

            {/* Internships */}
            <Section title="Internships">
              <Stack gap={4}>
                {profile.internships.map((job, i) => (
                  <Box key={i}>
                    <HStack justify="space-between">
                      <Text fontWeight="bold">{job.jobRole} @ {job.organization}</Text>
                      <Text color="gray.700">{job.startDate} - {job.endDate}</Text>
                    </HStack>
                    <Text fontSize="sm" mb={1}>{job.description}</Text>
                    <HStack gap={4} fontSize="xs" color="gray.600" mb={1}>
                      {job.location && <Text>Location: {job.location}</Text>}
                      {job.stipend && <Text>Stipend: {job.stipend}</Text>}
                    </HStack>
                    <HStack justify="space-between" fontSize="xs">
                       {job.mentorName && <Text color="gray.700">Mentor: {job.mentorName}</Text>}
                       {job.certificateLink && (
                          <Link href={job.certificateLink} isExternal color="blue.500">View Certificate</Link>
                       )}
                    </HStack>
                  </Box>
                ))}
              </Stack>
            </Section>

            {/* Trainings */}
            {profile.trainings && profile.trainings.length > 0 && (
              <Section title="Trainings">
                <Stack gap={4}>
                  {profile.trainings.map((train, i) => (
                    <Box key={i}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">{train.title} @ {train.organization}</Text>
                        <Text color="gray.700">{train.startDate} - {train.endDate}</Text>
                      </HStack>
                      <Text fontSize="sm" mb={1}>Type: {train.trainingType}</Text>
                      {train.certificateLink && (
                        <Link href={train.certificateLink} isExternal fontSize="xs" color="blue.500">View Certificate</Link>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Section>
            )}

            {/* Certifications */}
             {profile.certifications.length > 0 && (
                <Section title="Certifications">
                  <Stack gap={2}>
                    {profile.certifications.map((cert, i) => (
                      <Box key={i}>
                        <HStack justify="space-between">
                          <Text fontWeight="bold">{cert.name}</Text>
                          <Text fontSize="sm" color="gray.600">{cert.issueDate} {cert.expiryDate ? `- ${cert.expiryDate}` : ''}</Text>
                        </HStack>
                        <Text fontSize="sm">{cert.issuingOrganization}</Text>
                        <HStack justify="space-between" fontSize="sm" color="gray.600" mt={1}>
                           <HStack gap={3}>
                             <Text>Type: {cert.certificationType}</Text>
                             {cert.score && <Text>Score: {cert.score}</Text>}
                           </HStack>
                           {cert.certificateLink && (
                              <Link href={cert.certificateLink} isExternal color="blue.500" fontSize="xs">View Certificate</Link>
                           )}
                        </HStack>
                      </Box>
                    ))}
                  </Stack>
                </Section>
             )}

            {/* Publications */}
            {profile.publications && profile.publications.length > 0 && (
              <Section title="Publications">
                <Stack gap={4}>
                  {profile.publications.map((pub, i) => (
                    <Box key={i}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">{pub.title}</Text>
                        <Text color="gray.700" fontSize="sm">{pub.publicationDate}</Text>
                      </HStack>
                      <Text fontSize="sm">{pub.journalConference}</Text>
                      <Text fontSize="sm" mb={1}>{pub.description}</Text>
                      <HStack justify="space-between" fontSize="xs" color="gray.600">
                         <HStack gap={3}>
                            <Text>Type: {pub.publicationType}</Text>
                            <Text>Authors: {pub.authorCount}</Text>
                            {pub.mentorName && <Text>Mentor: {pub.mentorName}</Text>}
                         </HStack>
                         {pub.link && (
                            <Link href={pub.link} isExternal color="blue.500">View Publication</Link>
                         )}
                      </HStack>
                    </Box>
                  ))}
                </Stack>
              </Section>
            )}

            {/* Extra Curricular */}
            {profile.extraCurricular && profile.extraCurricular.length > 0 && (
              <Section title="Extra Curricular Activities">
                <Stack gap={4}>
                  {profile.extraCurricular.map((activity, i) => (
                    <Box key={i}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">{activity.activityName}</Text>
                        <Text color="gray.700" fontSize="sm">{activity.date} {activity.endDate ? `- ${activity.endDate}` : ''}</Text>
                      </HStack>
                      <Text fontSize="sm">{activity.role} @ {activity.organization}</Text>
                      <Text fontSize="sm" mb={1}>{activity.description}</Text>
                      <Text fontSize="xs" color="gray.600" mb={1}>Achievement: {activity.achievement}</Text>
                      <HStack justify="space-between" fontSize="xs">
                        <HStack gap={3}>
                           <Text color="gray.600">Type: {activity.activityType}</Text>
                        </HStack>
                        {activity.proofFile && (
                          <Link href={activity.proofFile} isExternal color="blue.500">View Proof</Link>
                        )}
                      </HStack>
                      <HStack flexWrap="wrap" mt={1}>
                        {activity.skills && activity.skills.map((skill, j) => (
                          <Badge key={j} size="sm" variant="outline">{skill}</Badge>
                        ))}
                      </HStack>
                    </Box>
                  ))}
                </Stack>
              </Section>
            )}

          </Stack>
        </CardBody>
      </Card>

      <Box display="none">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-container { max-width: 100% !important; padding: 0 !important; }
            body { background: white !important; }
          }
        `}</style>
      </Box>
    </Container>
  )
}

const Section = ({ title, children }) => (
  <Box>
    <Heading size="md" mb={3} borderBottom="2px solid" borderColor="gray.100" pb={2}>
      {title}
    </Heading>
    {children}
  </Box>
)
