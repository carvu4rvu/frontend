import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import Contact from './pages/Contact';
import { Login } from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import { Companies } from './pages/Companies';
import { StudentDashboard } from './pages/StudentDashboard';
import {
  PersonalProfile, ContactDetails, FamilyDetails, EducationDetails, AcademicPerformance,
  Projects, Internships, Trainings, Certifications, Publications, ExtraCurricular, OtherExperiences,
  CareerOverview, Resume,
  SummerImmersion, SummerInternship, Capstone, PlacementTrack
} from './pages/student/StudentProfilePages';
import './App.css';
import { Flex, Box } from '@chakra-ui/react';
import { AuthProvider } from './context/AuthContext';
import PlacementProtectedRoute from './components/PlacementProtectedRoute';

function AppContent() {
  const location = useLocation();
  const isStudentPage = location.pathname.startsWith('/student-dashboard') || location.pathname.startsWith('/student/');

  return (
    <Flex direction="column" minH="100vh">
      {!isStudentPage && <Navbar />}
      <Box flex="1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route 
            path="/student-dashboard" 
            element={
              <PlacementProtectedRoute>
                <StudentDashboard />
              </PlacementProtectedRoute>
            } 
          />
          
          {/* Student Profile Routes */}
          <Route path="/student/profile" element={<PlacementProtectedRoute><PersonalProfile /></PlacementProtectedRoute>} />
          <Route path="/student/profile/personal" element={<PlacementProtectedRoute><PersonalProfile /></PlacementProtectedRoute>} />
          <Route path="/student/profile/contact" element={<PlacementProtectedRoute><ContactDetails /></PlacementProtectedRoute>} />
          <Route path="/student/profile/family" element={<PlacementProtectedRoute><FamilyDetails /></PlacementProtectedRoute>} />
          <Route path="/student/profile/education" element={<PlacementProtectedRoute><EducationDetails /></PlacementProtectedRoute>} />
          <Route path="/student/profile/academics" element={<PlacementProtectedRoute><AcademicPerformance /></PlacementProtectedRoute>} />
          
          <Route path="/student/profile/projects" element={<PlacementProtectedRoute><Projects /></PlacementProtectedRoute>} />
          <Route path="/student/profile/internships" element={<PlacementProtectedRoute><Internships /></PlacementProtectedRoute>} />
          <Route path="/student/profile/trainings" element={<PlacementProtectedRoute><Trainings /></PlacementProtectedRoute>} />
          <Route path="/student/profile/certifications" element={<PlacementProtectedRoute><Certifications /></PlacementProtectedRoute>} />
          <Route path="/student/profile/publications" element={<PlacementProtectedRoute><Publications /></PlacementProtectedRoute>} />
          <Route path="/student/profile/extra-curricular" element={<PlacementProtectedRoute><ExtraCurricular /></PlacementProtectedRoute>} />
          <Route path="/student/profile/other" element={<PlacementProtectedRoute><OtherExperiences /></PlacementProtectedRoute>} />
          
          <Route path="/student/profile/career" element={<PlacementProtectedRoute><CareerOverview /></PlacementProtectedRoute>} />
          <Route path="/student/profile/resume" element={<PlacementProtectedRoute><Resume /></PlacementProtectedRoute>} />
          
          <Route path="/student/profile/summer-immersion" element={<PlacementProtectedRoute><SummerImmersion /></PlacementProtectedRoute>} />
          <Route path="/student/profile/summer-internship" element={<PlacementProtectedRoute><SummerInternship /></PlacementProtectedRoute>} />
          <Route path="/student/profile/capstone" element={<PlacementProtectedRoute><Capstone /></PlacementProtectedRoute>} />
          <Route path="/student/profile/placement" element={<PlacementProtectedRoute><PlacementTrack /></PlacementProtectedRoute>} />
        </Routes>
      </Box>
      <Footer />
    </Flex>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
