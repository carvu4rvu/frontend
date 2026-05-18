import { useState, useRef, createContext, useEffect } from "react"
import { Box, Flex, VStack, Text, Icon, HStack, Image, Button, Spinner, Badge } from "@chakra-ui/react"

/** Context so modals (e.g. project detail) can render inside the main content area and not overlap the sidebar */
export const StudentProfileContentRefContext = createContext(null)
import { useLocation, useNavigate } from "react-router-dom"
import StudentUniversalSearch from "./StudentUniversalSearch"
import { useAuth } from "../../context/AuthContext"
import { usePlacementTrackPolicy } from "../../context/PlacementTrackPolicyContext"
import { ProfileViewProvider } from "../../context/ProfileViewContext"
import { 
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "../ui/drawer"
import { ChevronLeftIcon } from "@chakra-ui/icons"
import { 
  FaUser, 
  FaAddressBook, 
  FaGraduationCap, 
  FaUsers, 
  FaBriefcase, 
  FaProjectDiagram, 
  FaBook, 
  FaChalkboardTeacher, 
  FaCertificate, 
  FaList, 
  FaChartBar, 
  FaFileAlt,
  FaMedal,
  FaBell,
  FaSun,
  FaBuilding,
  FaTachometerAlt,
} from "react-icons/fa"

const navItems = [
  { label: "Dashboard", path: "/student-dashboard", icon: FaTachometerAlt },
  { label: "Personal Information", path: "/student/profile/personal", icon: FaUser },
  { label: "Contact Details", path: "/student/profile/contact", icon: FaAddressBook },
  { label: "Parent / Guardian Details", path: "/student/profile/family", icon: FaUsers },
  { label: "Education", path: "/student/profile/education", icon: FaGraduationCap },
  { label: "Academic Performance", path: "/student/profile/academics", icon: FaChartBar },
  { label: "Projects", path: "/student/profile/projects", icon: FaProjectDiagram },
  { label: "Internships", path: "/student/profile/internships", icon: FaBriefcase },
  { label: "Training & Workshops", path: "/student/profile/trainings", icon: FaChalkboardTeacher },
  { label: "Certifications", path: "/student/profile/certifications", icon: FaCertificate },
  { label: "Publications", path: "/student/profile/publications", icon: FaBook },
  { label: "Extra-Curricular Activities", path: "/student/profile/extra-curricular", icon: FaMedal },
  { label: "Other Experiences", path: "/student/profile/other", icon: FaList },
  { label: "Career Overview", path: "/student/profile/career", icon: FaBriefcase },
  { label: "Resume", path: "/student/profile/resume", icon: FaFileAlt },
  { label: "Summer Immersion", path: "/student/profile/summer-immersion", icon: FaSun },
  { label: "Summer Internship", path: "/student/profile/summer-internship", icon: FaBuilding },
]

const PLACEMENT_TRACK_PATHS = []

const TRACK_NAV_ITEMS = []

const isPlacementTrackPath = (path) => PLACEMENT_TRACK_PATHS.some((p) => path === p)

/** When basePath is set (e.g. /placement/students/1RVU23BECTH1), nav uses it for links (admin view). */
export const StudentProfileLayout = ({ children, basePath = null, isAdminView = false }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const contentRef = useRef(null)
  const [open, setOpen] = useState(false)
  const { policy: trackPolicy, loading: trackPolicyLoading } = usePlacementTrackPolicy()
  const onPlacementTrackPath = isPlacementTrackPath(location.pathname)

  const getItemPath = (item) => {
    if (basePath) {
      if (item.path === "/student-dashboard") return `${basePath}/dashboard`
      const segment = item.path.replace(/^\/student\/profile\//, '')
      return `${basePath}/${segment}`
    }
    return item.path
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const DottedDivider = () => (
    <Box
      mx={2}
      my={1}
      borderBottomWidth="1px"
      borderBottomStyle="dotted"
      borderColor="#FDE74C"
      opacity={0.9}
    />
  )

  const isPlacementTrackActive = false

  const NavContent = () => {
    const rows = []
    navItems.forEach((item, i) => {
      // Hide Dashboard in sidebar when student is on profile section
      if (item.label === "Dashboard" && !basePath && location.pathname.startsWith('/student/profile')) return
      // Hide Summer Immersion / Summer Internship when batch policy does not allow them
      if (item.label === "Summer Immersion" && trackPolicy && trackPolicy.summer_immersion === false) return
      if (item.label === "Summer Internship" && trackPolicy && trackPolicy.summer_internship === false) return

      // Insert a divider above Projects to visually separate academic history from portfolio
      if (item.label === "Projects") {
        rows.push({ type: "divider", key: "div-before-projects" })
      }

      if (item.label === "Career Overview") {
        rows.push({ type: "divider", key: `div-${item.path}` })
      }
      rows.push({ type: "item", item, key: item.label })
      if (item.label === "Resume") {
        rows.push({ type: "divider", key: "div-after-resume" })
      }
    })
    return (
      <VStack align="stretch" gap={1} py={4}>
        {rows.map(({ type, key, item }) =>
          type === "divider" ? (
            <DottedDivider key={key} />
          ) : (
            <Box
              key={key}
              px={4}
              py={2}
              mx={2}
              borderRadius="md"
              cursor="pointer"
              bg={
                location.pathname === getItemPath(item) ||
                (item.label === "Personal Information" && (location.pathname === "/student/profile" || (basePath && location.pathname === basePath)))
                  ? "#FDE74C"
                  : "transparent"
              }
              color={
                location.pathname === getItemPath(item) ||
                (item.label === "Personal Information" && (location.pathname === "/student/profile" || (basePath && location.pathname === basePath)))
                  ? "#1a202c"
                  : "#fbfff1"
              }
              fontWeight={
                location.pathname === getItemPath(item) ||
                (item.label === "Personal Information" && (location.pathname === "/student/profile" || (basePath && location.pathname === basePath)))
                  ? "bold"
                  : "medium"
              }
              display="flex"
                alignItems="center"
                gap={3}
                role="group"
                tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  navigate(getItemPath(item))
                }
              }}
              onClick={() => navigate(getItemPath(item))}
              _hover={{ bgGradient: "linear(to-r, #E5E7EB, #F3F4F6)", color: "#1a202c" }}
              transition="all 0.2s"
            >
              <Icon
                as={item.icon}
                boxSize={3}
                color={
                  location.pathname === getItemPath(item) ||
                  (item.label === "Personal Information" && (location.pathname === "/student/profile" || (basePath && location.pathname === basePath)))
                    ? "#1a202c"
                    : "#E5E9EC"
                }
                _groupHover={{ color: "#000000" }}
              />
              <Text fontSize="sm" flex={1} _groupHover={{ color: "#000000" }}>
                {item.label}
              </Text>
            </Box>
          )
        )}
      </VStack>
    )
  }

  const showSidebar = (basePath ? location.pathname.startsWith(basePath) : location.pathname.startsWith('/student/profile')) && !onPlacementTrackPath

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
        {/* Left: Logo / Back + Admin nav (Dashboard insights | Profile) */}
        <HStack spacing={4}>
          <HStack spacing={3} minW="fit-content" cursor="pointer" onClick={() => navigate(isAdminView ? "/placement/students" : "/student-dashboard")} _hover={{ opacity: 0.9 }}>
            {isAdminView ? (
              <Button leftIcon={<ChevronLeftIcon />} variant="ghost" color="white" size="sm" _hover={{ bg: "whiteAlpha.200" }} _focus={{ outline: "none", boxShadow: "none" }} _focusVisible={{ outline: "2px solid #FDE74C", outlineOffset: "2px" }}>
                Back to Students
              </Button>
            ) : (
              <Image src="/logo.png" alt="CarvU" w="220px" objectFit="contain" mt={-1} pointerEvents="none" />
            )}
          </HStack>
        </HStack>
        
        {!isAdminView && (
        <HStack spacing={4} align="center">
          <HStack 
            spacing={4} 
            display={{ base: "none", md: "flex" }}
          >
            <Button
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname === "/student-dashboard" ? "#FDE74C" : "transparent"}
              color={location.pathname === "/student-dashboard" ? "#FDE74C" : "white"}
              fontWeight={location.pathname === "/student-dashboard" ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              _focus={{ outline: "none", boxShadow: "none" }}
              _focusVisible={{ outline: "2px solid #FDE74C", outlineOffset: "2px" }}
              px={1}
              onClick={() => navigate("/student-dashboard")}
              type="button"
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname.startsWith("/student/profile") && !isPlacementTrackActive ? "#FDE74C" : "transparent"}
              color={location.pathname.startsWith("/student/profile") && !isPlacementTrackActive ? "#FDE74C" : "white"}
              fontWeight={location.pathname.startsWith("/student/profile") && !isPlacementTrackActive ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              _focus={{ outline: "none", boxShadow: "none" }}
              _focusVisible={{ outline: "2px solid #FDE74C", outlineOffset: "2px" }}
              px={1}
              onClick={() => navigate("/student/profile/personal")}
              type="button"
            >
              Profile
            </Button>
            {trackPolicy?.opt_in === true && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  borderRadius={0}
                  borderBottomWidth="2px"
                  borderColor={location.pathname === "/student/placements/feed" ? "#FDE74C" : "transparent"}
                  color={location.pathname === "/student/placements/feed" ? "#FDE74C" : "white"}
                  fontWeight={location.pathname === "/student/placements/feed" ? "semibold" : "medium"}
                  _hover={{ bg: "transparent", color: "#FDE74C" }}
                  _focus={{ outline: "none", boxShadow: "none" }}
                  _focusVisible={{ outline: "2px solid #FDE74C", outlineOffset: "2px" }}
                  px={1}
                  onClick={() => navigate("/student/placements/feed")}
                  type="button"
                >
                  Placement Drives
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  borderRadius={0}
                  borderBottomWidth="2px"
                  borderColor={location.pathname === "/student/placements/offers" ? "#FDE74C" : "transparent"}
                  color={location.pathname === "/student/placements/offers" ? "#FDE74C" : "white"}
                  fontWeight={location.pathname === "/student/placements/offers" ? "semibold" : "medium"}
                  _hover={{ bg: "transparent", color: "#FDE74C" }}
                  _focus={{ outline: "none", boxShadow: "none" }}
                  _focusVisible={{ outline: "2px solid #FDE74C", outlineOffset: "2px" }}
                  px={1}
                  onClick={() => navigate("/student/placements/offers")}
                  type="button"
                >
                  Job Offers
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname === "/student/placements/events" ? "#FDE74C" : "transparent"}
              color={location.pathname === "/student/placements/events" ? "#FDE74C" : "white"}
              fontWeight={location.pathname === "/student/placements/events" ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              _focus={{ outline: "none", boxShadow: "none" }}
              _focusVisible={{ outline: "2px solid #FDE74C", outlineOffset: "2px" }}
              px={1}
              onClick={() => navigate("/student/placements/events")}
              type="button"
            >
              Events
            </Button>
            <Button
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname === "/student/calendar" ? "#FDE74C" : "transparent"}
              color={location.pathname === "/student/calendar" ? "#FDE74C" : "white"}
              fontWeight={location.pathname === "/student/calendar" ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              _focus={{ outline: "none", boxShadow: "none" }}
              _focusVisible={{ outline: "2px solid #FDE74C", outlineOffset: "2px" }}
              px={1}
              onClick={() => navigate("/student/calendar")}
              type="button"
            >
              Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              borderRadius={0}
              borderBottomWidth="2px"
              borderColor={location.pathname === "/student/placements/policy" ? "#FDE74C" : "transparent"}
              color={location.pathname === "/student/placements/policy" ? "#FDE74C" : "white"}
              fontWeight={location.pathname === "/student/placements/policy" ? "semibold" : "medium"}
              _hover={{ bg: "transparent", color: "#FDE74C" }}
              _focus={{ outline: "none", boxShadow: "none" }}
              _focusVisible={{ outline: "2px solid #FDE74C", outlineOffset: "2px" }}
              px={1}
              onClick={() => navigate("/student/placements/policy")}
              type="button"
            >
              Policy
            </Button>
          </HStack>
          <Button 
            variant="ghost" 
            color="white" 
            _hover={{ bg: "whiteAlpha.200" }}
            _focus={{ outline: "none", boxShadow: "none" }}
            _focusVisible={{ outline: "2px solid #FDE74C", outlineOffset: "2px" }}
            size="sm"
            aria-label="Notifications"
            pos="relative"
            onClick={() => navigate("/student/notifications")}
            type="button"
          >
            <Icon as={FaBell} />
          </Button>
          {/* Search and Logout unchanged */}
          <HStack spacing={4}>
          <Box w="300px" display={{ base: "none", md: "block" }}>
            <StudentUniversalSearch />
          </Box>
          <Button 
            variant="ghost" 
            color="red.300" 
            _hover={{ bg: "whiteAlpha.200", color: "red.200" }}
            _focus={{ outline: "none", boxShadow: "none" }}
            _focusVisible={{ outline: "2px solid #FDE74C", outlineOffset: "2px" }}
            onClick={handleLogout}
            size="sm"
            fontWeight="medium"
            flexShrink={0}
          >
            Logout
          </Button>
          </HStack>
        </HStack>
        )}
      </Flex>

      <Flex alignItems="flex-start" minH="calc(100vh - 72px)">
        {showSidebar && (
          <Box 
            w="280px" 
            bg="#3c3744" 
            borderRight="1px solid" 
            borderColor="#E5E9EC"
            minH="calc(100vh - 72px)"
            maxH="calc(100vh - 72px)"
            position="sticky" 
            top="72px"
            overflowY="auto"
            display={{ base: "none", md: "block" }}
            flexShrink={0}
            alignSelf="flex-start"
            zIndex={5}
          >
             <Box py={4}>
               <NavContent />
             </Box>
          </Box>
        )}

        {onPlacementTrackPath && TRACK_NAV_ITEMS.length > 0 && (
          <Box
            w="220px"
            bg="#2d3748"
            borderRight="1px solid"
            borderColor="#E5E9EC"
            minH="calc(100vh - 72px)"
            maxH="calc(100vh - 72px)"
            position="sticky"
            top="72px"
            overflowY="auto"
            display={{ base: "none", md: "block" }}
            flexShrink={0}
            alignSelf="flex-start"
            zIndex={5}
            py={4}
          >
            <Text fontSize="xs" fontWeight="bold" color="#FDE74C" px={4} mb={2}>Placement Track</Text>
            {trackPolicyLoading ? (
              <Flex justify="center" py={4}><Spinner size="sm" color="#FDE74C" /></Flex>
            ) : (
              <VStack align="stretch" gap={0}>
                {TRACK_NAV_ITEMS.map((t) => {
                  const allowed = trackPolicy?.[t.key]
                  const isActive = location.pathname === t.path
                  const boxProps = {
                    px: 4,
                    py: 2,
                    mx: 2,
                    borderRadius: "md",
                    fontSize: "sm",
                    display: "flex",
                    alignItems: "center",
                    cursor: allowed ? "pointer" : "not-allowed",
                    opacity: allowed ? 1 : 0.5,
                    bg: isActive ? "#FDE74C" : "transparent",
                    color: isActive ? "#1a202c" : allowed ? "#fbfff1" : "#718096",
                    fontWeight: isActive ? "bold" : "medium",
                    _hover: allowed ? { bg: isActive ? "#FDE74C" : "whiteAlpha.200", color: "#1a202c" } : {},
                    role: allowed ? "button" : undefined,
                    tabIndex: allowed ? 0 : undefined,
                    onKeyDown: allowed ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        navigate(t.path)
                      }
                    } : undefined,
                    onClick: allowed ? () => navigate(t.path) : undefined,
                  }
                  const TrackIcon = t.icon
                  return (
                    <Box key={t.key} {...boxProps} title={!allowed ? "Not enabled for your batch" : undefined} display="flex" alignItems="center" gap={2}>
                      {TrackIcon && <Icon as={TrackIcon} boxSize={3.5} />}
                      {t.label}
                    </Box>
                  )
                })}
              </VStack>
            )}
          </Box>
        )}

        <Box ref={contentRef} flex={1} p={8} minW={0} position="relative">
          <StudentProfileContentRefContext.Provider value={contentRef}>
            <Box maxW={location.pathname === "/student-dashboard" || location.pathname === "/student/calendar" ? "1600px" : "960px"} mx="auto" w="100%">
              {basePath ? children : <ProfileViewProvider>{children}</ProfileViewProvider>}
            </Box>
          </StudentProfileContentRefContext.Provider>
        </Box>
      </Flex>
    </Box>
  )
}
