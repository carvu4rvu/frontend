import { Heading, SimpleGrid, Box, Text, Badge, Button, Flex, HStack, Icon, Alert, AlertIcon, AlertTitle, AlertDescription, Center, Spinner } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { StudentProfileService } from "../../../services/studentProfile.service"
import { useAuth } from "../../../context/AuthContext"
import { calculateProfileCompletion, calculateSectionCompletion } from "../../../utils/profileHelper"
import { getProfileErrorMessage } from "../../../utils/profileErrorHelper"
import {
  FaUser,
  FaAddressBook,
  FaGraduationCap,
  FaChartBar,
  FaProjectDiagram,
  FaBriefcase,
  FaChalkboardTeacher,
  FaCertificate,
  FaBook,
  FaMedal,
  FaList,
  FaUsers,
  FaIdCard,
  FaSeedling,
  FaChartPie,
  FaEdit,
  FaEye,
} from "react-icons/fa"

export const ProfileOverview = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const usn = user?.usn
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const fetchProfile = useCallback(async () => {
    if (!usn) return
    setLoadError(null)
    setLoading(true)
    try {
      const data = await StudentProfileService.getFullProfile(usn)
      setProfile(data)
    } catch (err) {
      setLoadError(getProfileErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [usn])

  useEffect(() => {
    if (!usn) return
    fetchProfile()
  }, [usn, fetchProfile])

  if (!usn) {
    return <Box p={8}>Please log in to view your profile.</Box>
  }

  if (loadError && !profile) {
    return (
      <Box p={8}>
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Could not load profile</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Box>
          <Button size="sm" colorScheme="red" variant="outline" onClick={fetchProfile}>
            Retry
          </Button>
        </Alert>
      </Box>
    )
  }

  if (loading || !profile) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="#d4a960" />
      </Center>
    )
  }

  const normalizedProfile = {
    ...profile,
    communication: profile.communication || profile.contact || {},
    parents: profile.parents || profile.family || []
  }

  const isComplete = (data) => {
      if (Array.isArray(data)) return data.length > 0
      if (typeof data === "object" && data !== null) {
          return Object.values(data).some(val => val !== "" && val !== null && (Array.isArray(val) ? val.length > 0 : true))
      }
      return false
  }

  const sectionIcons = {
    personal: FaUser,
    communication: FaAddressBook,
    career: FaBriefcase,
    education: FaGraduationCap,
    academics: FaChartBar,
    projects: FaProjectDiagram,
    internships: FaBriefcase,
    trainings: FaChalkboardTeacher,
    certifications: FaCertificate,
    publications: FaBook,
    extraCurricular: FaMedal,
    other: FaList,
    parents: FaUsers,
  }

  const sections = [
    { id: "personal", label: "Personal Details", data: normalizedProfile.personal },
    { id: "communication", label: "Communication", data: normalizedProfile.communication },
    { id: "career", label: "Career Summary", data: normalizedProfile.career },
    { id: "education", label: "Education History", data: normalizedProfile.education },
    { id: "academics", label: "Semester Academics", data: normalizedProfile.academics },
    { id: "projects", label: "Projects", data: normalizedProfile.projects },
    { id: "internships", label: "Internships", data: normalizedProfile.internships },
    { id: "trainings", label: "Trainings", data: normalizedProfile.trainings },
    { id: "certifications", label: "Certifications", data: normalizedProfile.certifications },
    { id: "publications", label: "Publications", data: normalizedProfile.publications },
    { id: "extraCurricular", label: "Extra-Curricular", data: normalizedProfile.extraCurricular },
    { id: "other", label: "Other Experiences", data: normalizedProfile.otherExperiences },
    { id: "parents", label: "Parent Details", data: normalizedProfile.parents },
  ]

  const categories = [
    {
      id: "coreIdentity",
      label: "Core Identity",
      icon: FaIdCard,
      sectionKeys: ["personal", "communication", "parents", "education", "academics"]
    },
    {
      id: "growthPortfolio",
      label: "Growth Portfolio",
      icon: FaSeedling,
      sectionKeys: ["projects", "internships", "trainings", "certifications", "publications", "extraCurricular", "otherExperiences"]
    },
    {
      id: "professionalSnapshot",
      label: "Professional Snapshot",
      icon: FaBriefcase,
      sectionKeys: ["career"]
    }
  ]

  const getCategoryPercentage = (sectionKeys) => {
    if (!sectionKeys.length) return 0
    const completedCount = sectionKeys.reduce((count, key) => {
      const value = normalizedProfile[key]
      return count + (isComplete(value) ? 1 : 0)
    }, 0)
    return Math.round((completedCount / sectionKeys.length) * 100)
  }

  const overallCompletion = calculateProfileCompletion({
    ...normalizedProfile,
    communication: normalizedProfile.communication
  })

  return (
    <Box>
      <Heading size="md" mb={6}>Profile Overview</Heading>
      
      <Box mb={8} p={4} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.100">
          <HStack spacing={2} mb={2}>
            <Icon as={FaChartPie} color="blue.600" boxSize={5} />
            <Heading size="sm">Overall Completion</Heading>
          </HStack>
          <Text fontSize="sm" color="gray.700">Complete all sections to generate your resume.</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={8}>
        {categories.map(category => {
          const percentage = getCategoryPercentage(category.sectionKeys)
          const isCompleteCategory = percentage === 100
          return (
            <Box key={category.id} p={4} borderWidth="1px" borderRadius="md" bg="white">
              <Flex justify="space-between" align="center" mb={2}>
                <HStack spacing={2}>
                  <Icon as={category.icon} color="#d4a960" boxSize={4} />
                  <Text fontWeight="semibold">{category.label}</Text>
                </HStack>
                <Badge colorScheme={isCompleteCategory ? "green" : "yellow"}>
                  {isCompleteCategory ? "Complete" : "In progress"}
                </Badge>
              </Flex>
              <Text fontSize="sm" color="gray.700">
                {isCompleteCategory ? "All sections filled" : "Keep filling details in this category"}
              </Text>
            </Box>
          )
        })}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {sections.map((section) => {
            const sectionId = section.id === "other" ? "otherExperiences" : section.id
            const percent = calculateSectionCompletion(sectionId, normalizedProfile)
            const completed = percent === 100
            const SectionIcon = sectionIcons[section.id]

            return (
                <Box key={section.id} p={4} borderWidth="1px" borderRadius="md" bg={completed ? "white" : "gray.50"}>
                    <Flex justify="space-between" align="center">
                        <HStack spacing={2}>
                          {SectionIcon && <Icon as={SectionIcon} color="#d4a960" boxSize={4} />}
                          <Text fontWeight="medium">{section.label}</Text>
                        </HStack>
                        <Badge colorScheme={completed ? "green" : "yellow"}>
                            {completed ? "Complete" : "In progress"}
                        </Badge>
                    </Flex>
                </Box>
            )
        })}
      </SimpleGrid>

      <HStack mt={8} gap={4}>
        <Button colorScheme="blue" leftIcon={<Icon as={FaEdit} />} onClick={() => navigate("/student/profile/edit")}>
            Add/Edit Profile
        </Button>
        <Button variant="outline" leftIcon={<Icon as={FaEye} />} onClick={() => navigate("/student/profile/preview")}>
            Preview Resume
        </Button>
      </HStack>
    </Box>
  )
}
