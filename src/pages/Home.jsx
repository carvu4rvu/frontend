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
      case 'superadmin':
        return <Navigate to="/placement/dashboard" replace />;
      case 'alumni':
        return <Navigate to="/placement/alumni-dashboard" replace />;
      case 'dean':
        return <Navigate to="/dean/dashboard" replace />;
      case 'company':
        return <Navigate to="/company/dashboard" replace />;
      case 'parent':
        return <Navigate to="/parent/dashboard" replace />;
      case 'management':
        return <Navigate to="/management/dashboard" replace />;
      default:
        // If role is unknown, maybe stay here or go to login?
        // Staying here is safer to avoid infinite redirect loops if role is missing
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
