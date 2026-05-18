import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  HStack,
  Button,
  Avatar,
  Container,
  Image
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import CardNav from './ui/CardNav';

import UniversalSearch from './UniversalSearch';

const AdminLayout = ({ children, fullWidth = false, compactTop = false }) => {
  const { user, logout, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavHovered, setIsNavHovered] = useState(false);

  const isVc = (userRole || '').toLowerCase() === 'vc';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // VC sees only dashboard + View All Companies (read-only)
  const navItems = isVc ? [
    {
      label: "View",
      bgColor: "#172e36",
      textColor: "#fff",
      links: [
        { label: "Dashboard", path: "/placement/dashboard", ariaLabel: "Placement Dashboard" },
        { label: "View All Companies", path: "/placement/companies", ariaLabel: "View All Companies" },
      ]
    },
  ] : [
    {
      label: "Overview",
      bgColor: "#172e36",
      textColor: "#fff",
      links: [
        { label: "Dashboard", path: "/placement/dashboard", ariaLabel: "Placement Dashboard" },
        { label: "Placement Overview", path: "/placement/overview", ariaLabel: "Placement Overview Statistics" },
        { label: "Calendar of Events", path: "/placement/calendar", ariaLabel: "Calendar of Events" },
        { label: "Monthly Reports", path: "/placement/reports", ariaLabel: "Monthly Placement Reports" }
      ]
    },
    {
      label: "Placement",
      bgColor: "#2a4d5c",
      textColor: "#fff",
      links: [
        { label: "Events", path: "/events", ariaLabel: "Events" },
        { label: "Placement Drives", path: "/placement/events", ariaLabel: "Placement Drives" },
        { label: "Companies", path: "/placement/companies", ariaLabel: "Companies" },
        { label: "Placement Violations", path: "/placement/violations", ariaLabel: "Eligibility logs, placement violations, disciplinary records" }
      ]
    },
    {
      label: "Students",
      bgColor: "#1e3a47",
      textColor: "#fff",
      links: [
        { label: "View All Students", path: "/placement/students", ariaLabel: "View Students" },
        { label: "Showcase Projects", path: "/placement/gallery/showcase", ariaLabel: "Showcase Projects" },
        { label: "Manage Projects", path: "/placement/gallery/manage", ariaLabel: "Manage Projects" },
        { label: "Job Offers", path: "/placement/job-offers", ariaLabel: "Job Offers" }
      ]
    },
    {
      label: "Network",
      bgColor: "#2d4a54",
      textColor: "#fff",
      links: [
        { label: "Alumni Connect", path: "/placement/alumni-connect", ariaLabel: "Connect with Alumni" },
        { label: "Alumni", path: "/placement/alumni", ariaLabel: "Alumni Network" },
        { label: "HR Recommendations", path: "/placement/hr-recommendations", ariaLabel: "View HR recommendations from alumni" }
      ]
    },
    {
      label: "System",
      bgColor: "#1a3540",
      textColor: "#fff",
      links: [
        { label: "Email", path: "/placement/email", ariaLabel: "Bulk email and email tools" },
        { label: "Notifications", path: "/placement/notifications", ariaLabel: "Manage and send notifications" },
        { label: "Login Settings", path: "/placement/user-login", ariaLabel: "Manage user logins and active status" },
      ]
    },
  ];

  const isActive = (path) => location.pathname === path;

  const displayRole = isVc
    ? 'Vice Chancellor'
    : (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Admin');

  const CustomLogo = (
    <HStack
      spacing={2}
      alignItems="center"
      _hover={{ transform: 'scale(1.05)' }}
      transition="transform 0.2s ease"
      cursor="pointer"
      onClick={() => navigate('/placement/dashboard')}
      minW="max-content"
    >
      <Image
        src="/logo.png"
        alt="CarvU Logo"
        w="100px"
        maxW="100px"
        objectFit="contain"
        mt={-1}
      />
    </HStack>
  );

  // VC allowed paths: dashboard, companies, vc-projects, vc-events, vc-notifications
  const vcAllowedPaths = ['/placement/dashboard', '/placement/companies', '/placement/company/', '/placement/vc-projects', '/placement/vc-events', '/placement/vc-notifications'];
  const isVcAllowedPath = vcAllowedPaths.some(p => p === location.pathname || (p.endsWith('/') && location.pathname.startsWith(p)));
  useEffect(() => {
    if (isVc && !isVcAllowedPath) {
      navigate('/placement/dashboard', { replace: true });
    }
  }, [isVc, isVcAllowedPath, navigate]);

  return (
    <Box minH="100vh" bg="#f0f0f0">
      {/* Top Navbar */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        w="100%"
        // h={isNavHovered ? '300px' : '72px'}
        h="72px"
        // overflow="hidden"
        overflow="visible"
        onMouseEnter={() => setIsNavHovered(true)}
        onMouseLeave={() => setIsNavHovered(false)}
      >
        <CardNav 
          isOpen={isNavHovered}
          onOpenChange={setIsNavHovered}
          logo={CustomLogo}
          items={{
            items: navItems,
            searchComponent: isVc ? null : <UniversalSearch />,
            rightActions: (
              <HStack spacing={3}>
                {!isVc && (
                  <Button
                    size="sm"
                    variant="ghost"
                    color="white"
                    _hover={{ bg: "whiteAlpha.200" }}
                    onClick={() => navigate('/placement/notifications')}
                    aria-label="Notifications"
                    p={2}
                  >
                    <BellIcon boxSize={5} />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "whiteAlpha.200" }}
                  onClick={() => !isVc && navigate('/placement/dashboard')}
                  display={{ base: 'none', md: 'flex' }}
                >
                  {displayRole}
                </Button>
                 <Avatar
                    name={user?.name || user?.email}
                    size="sm"
                    src={user?.profile_image} 
                    bg="whiteAlpha.300"
                    color="white"
                    ignoreFallback
                  />
                  <Button
                    size="sm"
                    borderRadius="full"
                    onClick={handleLogout}
                    variant="solid"
                    bg="whiteAlpha.200"
                    _hover={{ bg: "whiteAlpha.300", transform: "translateY(-1px)" }}
                    _active={{ bg: "whiteAlpha.400" }}
                    color="white"
                    fontWeight="medium"
                    px={5}
                    transition="all 0.2s"
                  >
                    Logout
                  </Button>
              </HStack>
            )
          }}
        />
      </Box>

      {/* Main Content */}
      <Box
        as="main"
        ml={0}
        pt="72px"
        px={fullWidth ? 0 : 8}
        pb={fullWidth ? 0 : 8}
        bg={fullWidth ? "#f8fafc" : "#f0f0f0"}
        minH="100vh"
        transition="filter 0.3s ease"
        filter={isNavHovered ? 'blur(5px)' : 'none'}
      >
        {fullWidth ? (
          <Box w="100%" maxW="100%" p={0} m={0}>
            {children}
          </Box>
        ) : (
          <Container maxW="container.xl" p={0} pt={0} pb={0}>
            {children}
          </Container>
        )}
      </Box>
    </Box>
  );
};

export default AdminLayout;
