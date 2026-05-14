import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Spinner } from '@chakra-ui/react';

const PlacementProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const rolesToCheck = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const normalizedRolesToCheck = rolesToCheck.map(r => r?.toLowerCase());
    const userRole = user?.role?.toLowerCase();
    if (!normalizedRolesToCheck.includes(userRole)) {
      // If user is logged in but not authorized (e.g. student trying to access admin), redirect to home or their dashboard
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PlacementProtectedRoute;
