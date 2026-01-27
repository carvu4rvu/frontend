import { useState, useEffect } from "react"
import { Box, Flex, VStack, Text, Icon, Heading, HStack, Image, Button, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody, Badge, List, ListItem, Collapse } from "@chakra-ui/react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import StudentUniversalSearch from "./StudentUniversalSearch"
import { useAuth } from "../../context/AuthContext"
import { 
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "../ui/drawer"
import { 
  FaChevronRight, 
  FaBars, 
  FaUser, 
  FaAddressBook, 
  FaGraduationCap, 
  FaPaperclip, 
  FaUsers, 
  FaBriefcase, 
  FaProjectDiagram, 
  FaBook, 
  FaChalkboardTeacher, 
  FaCertificate, 
  FaUserTie, 
  FaList, 
  FaChartBar, 
  FaVideo,
  FaFileAlt,
  FaMedal,
  FaBell
} from "react-icons/fa"

const navGroups = [
  {
    title: "Core Identity",
    subtitle: "Locked & Mandatory",
    icon: FaUserTie,
    items: [
      { label: "Personal Information", path: "/student/profile/personal", icon: FaUser },
      { label: "Contact Details", path: "/student/profile/contact", icon: FaAddressBook },
      { label: "Parent / Guardian Details", path: "/student/profile/family", icon: FaUsers },
      { label: "Education", path: "/student/profile/education", icon: FaGraduationCap },
      { label: "Academic Performance", path: "/student/profile/academics", icon: FaChartBar },
    ],
  },
  {
    title: "Growth Portfolio",
    subtitle: "Optional & Weightage-Based",
    icon: FaChartBar,
    items: [
      { label: "Projects", path: "/student/profile/projects", icon: FaProjectDiagram },
      { label: "Internships", path: "/student/profile/internships", icon: FaBriefcase },
      { label: "Training & Workshops", path: "/student/profile/trainings", icon: FaChalkboardTeacher },
      { label: "Certifications", path: "/student/profile/certifications", icon: FaCertificate },
      { label: "Publications", path: "/student/profile/publications", icon: FaBook },
      { label: "Extra-Curricular Activities", path: "/student/profile/extra-curricular", icon: FaMedal },
      { label: "Other Experiences", path: "/student/profile/other", icon: FaList },
    ],
  },
  {
    title: "Professional Snapshot",
    subtitle: "Mandatory & Editable",
    icon: FaBriefcase,
    items: [
      { label: "Career Overview", path: "/student/profile/career", icon: FaBriefcase },
      { label: "Resume", path: "/student/profile/resume", icon: FaFileAlt },
    ],
  },
  {
    title: "Placement Track",
    subtitle: "Placement-Related Activities",
    icon: FaBriefcase,
    items: [
      { label: "Summer Immersion", path: "/student/profile/summer-immersion", icon: FaBriefcase },
      { label: "Summer Internship", path: "/student/profile/summer-internship", icon: FaBriefcase },
      { label: "Capstone", path: "/student/profile/capstone", icon: FaBriefcase },
      { label: "Placement", path: "/student/profile/placement", icon: FaBriefcase },
    ],
  },
]

export const StudentProfileLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem("studentProfileOpenGroups")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            return parsed
          }
        } catch {
        }
      }
    }
    return [0, 1, 2, 3]
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleGroup = (index) => {
    setOpenGroups((prev) => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      }
      return [...prev, index]
    })
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("studentProfileOpenGroups", JSON.stringify(openGroups))
    }
  }, [openGroups])

  const NavContent = () => (
    <VStack align="stretch" gap={3} py={4}>
      {navGroups.map((group, index) => {
        const isOpen = openGroups.includes(index)
        return (
          <Box key={group.title}>
            <Box
              px={4}
              py={3}
              mx={2}
              borderRadius="md"
              bg="#5B7C99"
              borderWidth={1}
              borderColor={isOpen ? "#E5E9EC" : "#5B7C99"}
              color="#fbfff1"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              cursor="pointer"
              transition="all 0.2s"
              onClick={() => toggleGroup(index)}
            >
              <HStack spacing={3}>
                <Icon as={group.icon} color="#E5E9EC" boxSize={4} />
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="#fbfff1">
                    {group.title}
                  </Text>
                  <Text fontSize="xs" color="#E5E9EC">
                    {group.subtitle}
                  </Text>
                </Box>
              </HStack>
              <Icon
                as={FaChevronRight}
                boxSize={3}
                color="gray.300"
                transform={isOpen ? "rotate(90deg)" : "rotate(0deg)"}
                transition="transform 0.2s"
              />
            </Box>
            <Collapse in={isOpen} animateOpacity>
              <VStack align="stretch" gap={1} mt={2} mb={1}>
                {group.items.map(item => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.label === "Personal Information" && location.pathname === "/student/profile")
                  return (
                    <Link key={item.label} to={item.path}>
                      <Box
                        px={6}
                        py={2}
                        ml={6}
                        mr={2}
                        borderRadius="md"
                        bg={isActive ? "#FDE74C" : "transparent"}
                        color={isActive ? "#1a202c" : "#fbfff1"}
                        fontWeight={isActive ? "bold" : "medium"}
                        display="flex"
                        alignItems="center"
                        gap={3}
                        role="group"
                        _hover={{ bgGradient: "linear(to-r, #E5E7EB, #F3F4F6)", color: "#1a202c" }}
                        transition="all 0.2s"
                      >
                        <Icon
                          as={item.icon}
                          boxSize={3}
                          color={isActive ? "#1a202c" : "#E5E9EC"}
                          _groupHover={{ color: "#000000" }}
                        />
                        <Text fontSize="sm" flex={1} _groupHover={{ color: "#000000" }}>
                          {item.label}
                        </Text>
                      </Box>
                    </Link>
                  )
                })}
              </VStack>
            </Collapse>
          </Box>
        )
      })}
    </VStack>
  )

  const showSidebar = location.pathname.startsWith('/student/profile')

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Top Header */}
      <Flex 
        h={{ base: "60px", md: "72px" }} 
        bg="#20343c" 
        borderBottom="1px solid" 
        borderColor="#2d4a54" 
        align="center" 
        justify="space-between"
        px={4} 
        position="sticky"
        top={0}
        zIndex={10}
      >
        {/* Left: Logo */}
        <HStack spacing={3} minW="fit-content" as={Link} to="/student-dashboard" _hover={{ textDecoration: 'none' }} cursor="pointer">
          <Image src="/logo.png" alt="CarvU" w="220px" objectFit="contain" mt={-1} />
        </HStack>
        
        <HStack spacing={4} align="center">
          <HStack 
            spacing={4} 
            display={{ base: "none", md: "flex" }}
          >
            <Button
              as={Link}
              to="/student-dashboard"
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname === "/student-dashboard" ? "#FDE74C" : "transparent"}
              color={location.pathname === "/student-dashboard" ? "#FDE74C" : "white"}
              fontWeight={location.pathname === "/student-dashboard" ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              px={1}
            >
              Dashboard
            </Button>
            <Button
              as={Link}
              to="/student/profile/personal"
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname.startsWith("/student/profile") ? "#FDE74C" : "transparent"}
              color={location.pathname.startsWith("/student/profile") ? "#FDE74C" : "white"}
              fontWeight={location.pathname.startsWith("/student/profile") ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              px={1}
            >
              Profile
            </Button>
            <Button
              as={Link}
              to="/student/placements/feed"
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname === "/student/placements/feed" ? "#FDE74C" : "transparent"}
              color={location.pathname === "/student/placements/feed" ? "#FDE74C" : "white"}
              fontWeight={location.pathname === "/student/placements/feed" ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              px={1}
            >
              Placement Drives
            </Button>
            <Button
              as={Link}
              to="/student/placements/offers"
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname === "/student/placements/offers" ? "#FDE74C" : "transparent"}
              color={location.pathname === "/student/placements/offers" ? "#FDE74C" : "white"}
              fontWeight={location.pathname === "/student/placements/offers" ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              px={1}
            >
              Job Offers
            </Button>
            <Button
              as={Link}
              to="/student/placements/events"
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname === "/student/placements/events" ? "#FDE74C" : "transparent"}
              color={location.pathname === "/student/placements/events" ? "#FDE74C" : "white"}
              fontWeight={location.pathname === "/student/placements/events" ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              px={1}
            >
              Events
            </Button>
            <Button
              as={Link}
              to="/student/placements/policy"
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname === "/student/placements/policy" ? "#FDE74C" : "transparent"}
              color={location.pathname === "/student/placements/policy" ? "#FDE74C" : "white"}
              fontWeight={location.pathname === "/student/placements/policy" ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              px={1}
            >
              Policy
            </Button>
          </HStack>
          <Popover placement="bottom">
            <PopoverTrigger>
              <Button 
                variant="ghost" 
                color="white" 
                _hover={{ bg: "whiteAlpha.200" }}
                size="sm"
                aria-label="Notifications"
              >
                <Icon as={FaBell} />
              </Button>
            </PopoverTrigger>
            <PopoverContent color="gray.800" _focus={{ boxShadow: "xl" }}>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader fontWeight="bold" borderBottomWidth="1px">Notifications</PopoverHeader>
              <PopoverBody p={0}>
                <List spacing={0}>
                  {[
                    "New placement drive added: Google",
                    "Resume verification pending",
                    "Upcoming session on Resume Building"
                  ].map((note, i) => (
                    <ListItem key={i} p={3} borderBottomWidth="1px" _last={{ borderBottomWidth: 0 }} _hover={{ bg: "gray.50" }}>
                      <HStack>
                        <Icon as={FaBell} color="#d4a960" />
                        <Text fontSize="sm">{note}</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </PopoverBody>
            </PopoverContent>
          </Popover>
          {/* Search and Logout unchanged */}
          <HStack spacing={4}>
          <Box w="300px" display={{ base: "none", md: "block" }}>
            <StudentUniversalSearch />
          </Box>
          <Button 
            variant="ghost" 
            color="red.300" 
            _hover={{ bg: "whiteAlpha.200", color: "red.200" }}
            onClick={handleLogout}
            size="sm"
            fontWeight="medium"
            flexShrink={0}
          >
            Logout
          </Button>
          </HStack>
        </HStack>
      </Flex>

      <Flex>
        {showSidebar && (
          <Box 
            w="280px" 
            bg="#3c3744" 
            borderRight="1px solid" 
            borderColor="#E5E9EC"
            h="calc(100vh - 60px)" 
            position="sticky" 
            top="60px"
            overflowY="auto"
            display={{ base: "none", md: "block" }}
            flexShrink={0}
          >
             <Box py={4}>
               <NavContent />
             </Box>
          </Box>
        )}

        <Box flex={1} p={8}>
          <Box maxW="960px" mx="auto">
            {children}
          </Box>
        </Box>
      </Flex>
    </Box>
  )
}
