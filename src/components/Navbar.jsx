import { Box, Flex, Button, Heading, Spacer, HStack, Link, Image } from "@chakra-ui/react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const NavLink = ({ to, children }) => (
  <Link 
    as={RouterLink} 
    to={to} 
    color="white" 
    _hover={{ color: "#d4a960", textDecoration: "none" }}
    fontWeight="medium"
  >
    {children}
  </Link>
)

export const Navbar = () => {
  const { isAuthenticated, logout, userRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <Box as="nav" bg="#20343c" color="white" py={6} px={8} position="sticky" top={0} zIndex={100} shadow="md" w="100%">
      <Flex w="full" alignItems="center" justifyContent="space-between">
        <Box as={RouterLink} to="/">
          <Image
            src="/logo.png"
            alt="CARVu logo"
            h="50px"
            objectFit="contain"
          />
        </Box>
        
          <Flex gap={6} alignItems="center">
          <NavLink to="/">Home</NavLink>
          {!isAuthenticated ? (
            <>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/companies">Companies</NavLink>
              <NavLink to="/projects">Projects</NavLink>
              <NavLink to="/contact">Contact</NavLink>
              <NavLink to="/alumni/register">Alumni</NavLink>
              <Button
                as={RouterLink}
                to="/login"
                variant="outline"
                borderColor="#d4a960"
                color="#d4a960"
                _hover={{ bg: "#d4a960", color: "#20343c" }}
                size="sm"
              >
                Login
              </Button>
            </>
          ) : (
            <>
              {userRole?.toLowerCase() === "student" && (
                <>
                  <NavLink to="/student-dashboard">Dashboard</NavLink>
                  <NavLink to="#">Ongoing Drives</NavLink>
                  <NavLink to="#">Applied Jobs</NavLink>
                </>
              )}
              {userRole?.toLowerCase() === "alumni" && (
                <NavLink to="/placement/alumni-dashboard">Dashboard</NavLink>
              )}
              <NavLink to="/projects">Projects</NavLink>
              <HStack gap={4}>
                <Button
                  as={RouterLink}
                  to="/student/profile"
                  variant="ghost"
                  color="white"
                  _hover={{ color: "#d4a960" }}
                  size="sm"
                >
                  Profile
                </Button>
                <Button
                  variant="outline"
                  borderColor="#d4a960"
                  color="#d4a960"
                  _hover={{ bg: "#d4a960", color: "#20343c" }}
                  onClick={handleLogout}
                  size="sm"
                >
                  Logout
                </Button>
              </HStack>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
