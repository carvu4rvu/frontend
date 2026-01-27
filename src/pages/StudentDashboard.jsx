import { Box, Grid, Heading, Text, VStack, HStack, Badge, Button, SimpleGrid, Spinner, Link } from "@chakra-ui/react"
import { FaUser, FaBriefcase, FaCalendarAlt, FaCheckCircle, FaBell, FaExclamationCircle } from "react-icons/fa"
import { Link as RouterLink, useLocation } from "react-router-dom"
import { calculateProfileCompletion } from "../utils/profileHelper"
import { StudentProfileLayout } from "../components/student/StudentProfileLayout"
import { useEffect, useState } from "react"
import { PlacementService } from "../services/placement.service"
import { StudentProfileService } from "../services/studentProfile.service"
import { useAuth } from "../context/AuthContext"

const StatCard = ({ icon, title, value, color }) => (
  <Box bg="white" p={6} borderRadius="xl" shadow="sm" borderLeft="4px solid" borderColor={color}>
    <HStack gap={4}>
      <Box p={3} bg={`${color}10`} borderRadius="full" color={color}>
        {icon}
      </Box>
      <Box>
        <Text color="gray.500" fontSize="sm">{title}</Text>
        <Heading size="lg" color="#20343c">{value}</Heading>
      </Box>
    </HStack>
  </Box>
)

const JobCard = ({ company, role, status, date }) => {
  let colorScheme = "blue";
  if (status === "Selected" || status === "Offer Accepted") colorScheme = "green";
  else if (status === "Rejected") colorScheme = "red";
  else if (status === "Interview") colorScheme = "orange";

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" borderColor="gray.100" _hover={{ borderColor: "#d4a960", shadow: "md" }} transition="all 0.2s">
      <HStack justify="space-between" mb={2}>
        <Heading size="sm" color="#20343c">{company}</Heading>
        <Badge colorScheme={colorScheme}>{status}</Badge>
      </HStack>
      <Text fontSize="sm" color="gray.600" mb={2}>{role}</Text>
      <Text fontSize="xs" color="gray.400">{new Date(date).toLocaleDateString()}</Text>
    </Box>
  )
}

export const StudentDashboard = () => {
  const location = useLocation()
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const showNotification = location.state?.isFirstLogin || completionPercentage < 100
  const { user, loading: authLoading } = useAuth()
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const studentUSN = user?.usn;

  useEffect(() => {
    if (authLoading) return;
    if (!studentUSN) {
        setLoading(false);
        return;
    }
    
    const fetchDashboardData = async () => {
      try {
        const [processData, profileData] = await Promise.all([
             PlacementService.getStudentProcess(studentUSN),
             StudentProfileService.getFullProfile(studentUSN)
        ]);
        setApplications(processData || []);
        if (profileData) {
            const formattedProfile = {
                 ...profileData,
                 communication: profileData.contact || {}
            };
            setCompletionPercentage(calculateProfileCompletion(formattedProfile));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [studentUSN, authLoading]);

  if (authLoading || (loading && studentUSN)) {
      return (
        <StudentProfileLayout>
           <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
             <Spinner size="xl" color="#d4a960" />
           </Box>
        </StudentProfileLayout>
      );
  }

  // Calculate Stats
  const totalApplications = applications.length;
  const interviewsScheduled = applications.filter(app => app.interview_status === "Pending" || app.interview_status === "Scheduled").length;
  const offersReceived = applications.filter(app => app.final_select_status === "Selected").length;

  return (
    <StudentProfileLayout>
      <Box py={0}>
        {showNotification && (
          <Box mb={8} bg="orange.50" p={4} borderRadius="lg" borderLeft="4px solid" borderColor="orange.400" display="flex" justifyContent="space-between" alignItems="center">
            <HStack gap={3}>
              <FaExclamationCircle color="#dd6b20" size={20} />
              <Box>
                <Heading size="sm" color="orange.800">Complete Your Profile</Heading>
                <Text fontSize="sm" color="orange.700">Your profile is {completionPercentage}% complete. Please update your details to apply for jobs.</Text>
              </Box>
            </HStack>
            <Button size="sm" colorScheme="orange" variant="outline" as={RouterLink} to="/student/profile">
              Complete Now
            </Button>
          </Box>
        )}

        {/* Header */}
        <HStack justify="space-between" mb={8}>
          <Box>
            <Heading color="#20343c" size="lg">Welcome back, Student!</Heading>
            <Text color="gray.500">Here&apos;s what&apos;s happening with your job applications.</Text>
          </Box>
          <Button bg="#20343c" color="white" _hover={{ bg: "#1a2b32" }}>
            <FaBell style={{ marginRight: "8px" }} /> Notifications
          </Button>
        </HStack>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 4 }} gap={6} mb={8}>
          <StatCard icon={<FaBriefcase />} title="Total Applications" value={totalApplications} color="#20343c" />
          <StatCard icon={<FaCalendarAlt />} title="Interviews Scheduled" value={interviewsScheduled} color="#d4a960" />
          <StatCard icon={<FaCheckCircle />} title="Offers Received" value={offersReceived} color="green" />
          <StatCard icon={<FaUser />} title="Profile Completeness" value={`${completionPercentage}%`} color="blue" />
        </SimpleGrid>

        <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={8}>
          {/* Recent Applications */}
          <Box>
            <Heading size="md" color="#20343c" mb={4}>Recent Applications</Heading>
            <VStack gap={4} align="stretch" bg="white" p={6} borderRadius="xl" shadow="sm">
              {loading ? (
                <Spinner />
              ) : applications.length === 0 ? (
                <Text color="gray.500">You haven&apos;t applied to any drives yet.</Text>
              ) : (
                applications.map((app) => (
                  <JobCard 
                    key={app.id}
                    company={app.company?.company_name || "Unknown Company"} 
                    role={app.drive?.job_type || "Role"} 
                    status={app.final_select_status !== "Pending" ? app.final_select_status : app.registration_status} 
                    date={app.created_at} 
                  />
                ))
              )}
            </VStack>
          </Box>

          {/* Upcoming Events */}
          <Box>
            <Heading size="md" color="#20343c" mb={4}>Upcoming Interviews</Heading>
            <VStack gap={4} align="stretch" bg="white" p={6} borderRadius="xl" shadow="sm">
              {applications.filter(app => app.interview_status === "Pending" || app.interview_status === "Scheduled").length === 0 ? (
                 <Text color="gray.500">No upcoming interviews scheduled.</Text>
              ) : (
                applications.filter(app => app.interview_status === "Pending" || app.interview_status === "Scheduled").map((app, index) => (
                  <Box key={index} borderLeft="4px solid #d4a960" pl={4} py={1}>
                    <Text fontWeight="bold" color="#20343c">{app.company?.company_name} - {app.drive?.job_type}</Text>
                    <Text fontSize="sm" color="gray.500">Check drive details for date</Text>
                  </Box>
                ))
              )}
              
              <Box mt={4} p={4} bg="blue.50" borderRadius="lg">
                <Heading size="xs" color="blue.700" mb={2}>Placement Tip</Heading>
                <Text fontSize="xs" color="blue.600">
                  Keep your resume updated and practice coding problems regularly.
                </Text>
              </Box>
            </VStack>
          </Box>
        </Grid>
        
        <Box mt={12} bg="#20343c" color="white" p={8} borderRadius="xl" shadow="sm">
          <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={8}>
            <Box>
              <Heading size="md" color="#d4a960" mb={4}>Contact Us</Heading>
              <VStack align="start" spacing={2}>
                <Text>Placement Officer: +91 98765 43210</Text>
                <Text>Assistant Officer: +91 98765 43211</Text>
                <Text>Student Coordinator: +91 98765 43212</Text>
              </VStack>
            </Box>
            <Box>
              <Heading size="md" color="#d4a960" mb={4}>Feedback</Heading>
              <HStack gap={4} flexWrap="wrap">
                <Button
                  as="a"
                  href="#"
                  variant="outline"
                  borderColor="#d4a960"
                  color="#d4a960"
                  _hover={{ bg: "#d4a960", color: "#20343c" }}
                  size="sm"
                >
                  Feedback of the Placement
                </Button>
                <Button
                  as="a"
                  href="#"
                  variant="outline"
                  borderColor="#d4a960"
                  color="#d4a960"
                  _hover={{ bg: "#d4a960", color: "#20343c" }}
                  size="sm"
                >
                  Feedback of the Placement Portal
                </Button>
              </HStack>
            </Box>
          </Grid>
          <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={8} mt={8}>
            <Box>
              <Heading color="#d4a960" mb={4}>CarvU</Heading>
              <Text mb={4} color="whiteAlpha.800">
                Empowering students to achieve their career goals through world-class placement opportunities.
              </Text>
              <Text color="whiteAlpha.600">&copy; {new Date().getFullYear()} Carv U. All rights reserved.</Text>
            </Box>
            <Box>
              <Heading size="md" color="#d4a960" mb={4}>Quick Links</Heading>
              <HStack gap={4} flexWrap="wrap">
                <Link href="#" color="white" _hover={{ color: "#d4a960" }}>About Us</Link>
                <Link href="#" color="white" _hover={{ color: "#d4a960" }}>Placement Process</Link>
                <Link href="#" color="white" _hover={{ color: "#d4a960" }}>Recruiters</Link>
              </HStack>
            </Box>
          </Grid>
        </Box>
      </Box>
    </StudentProfileLayout>
  )
}
