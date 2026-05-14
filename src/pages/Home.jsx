import { Box, Spinner, Center } from "@chakra-ui/react"
import { Hero } from "../components/Hero"
import { Stats } from "../components/Stats"
import { Recruiters } from "../components/Recruiters"
import { Testimonials } from "../components/Testimonials"
import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom"

// hello 
// hi
// hiiii
export const Home = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    )
  }

  if (isAuthenticated && user) {
    switch (user.role?.toLowerCase()) {
      case 'student':
        return <Navigate to="/student-dashboard" replace />;
      case 'admin':
      case 'vc':
        return <Navigate to="/placement/dashboard" replace />;
      case 'alumni':
        return <Navigate to="/placement/alumni-dashboard" replace />;
      case 'company':
        return <Navigate to="/company/dashboard" replace />;
      default:
        break;
    }
  }

  return (
    <Box>
      <Hero />
      <Stats />
      <Recruiters />
      <Testimonials />
    </Box>
  )
}
