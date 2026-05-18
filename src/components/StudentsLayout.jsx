import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Box, Container, VStack, Heading, Text, Flex } from '@chakra-ui/react';
import { FaUsers, FaGraduationCap, FaLock, FaUnlock } from 'react-icons/fa';
import AdminLayout from './AdminLayout';

const tabPaths = [
  { path: '/placement/students', label: 'View All Students', end: true, icon: FaUsers, color: 'blue' },
  { path: '/placement/students/academic', label: 'Manage Academic', end: false, icon: FaGraduationCap, color: 'teal' },
  { path: '/placement/students/profile_lock', label: 'Profile Lock', end: false, icon: FaLock, color: 'purple' },
  { path: '/placement/students/sem_unlock_requests', label: 'Sem Unlock Requests', end: false, icon: FaUnlock, color: 'orange' },
];

export default function StudentsLayout() {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (tabPath, end) => {
    if (end) return pathname === tabPath || pathname === tabPath + '/';
    return pathname.startsWith(tabPath);
  };

  return (
    <AdminLayout>
      <Box
        bg="linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)"
        minH="100vh"
        py={6}
        px={{ base: 4, md: 6 }}
      >
        <Container maxW="container.xl">
          <VStack spacing={6} align="stretch">
            <Heading size="lg" color="gray.800" fontWeight="700" letterSpacing="-0.02em">
              Students
            </Heading>
            <Text color="gray.600" fontSize="md">
              View all students or manage academic.
            </Text>

            <Flex
              role="tablist"
              bg="gray.100"
              p={2}
              borderRadius="xl"
              shadow="sm"
              flexWrap="wrap"
              gap={3}
              w="full"
            >
              {tabPaths.map(({ path, label, end, icon: Icon, color }) => {
                const active = isActive(path, end);
                const schemes = {
                  blue: { bg: 'blue.500', bgHover: 'blue.600', inactive: 'blue.50', inactiveHover: 'blue.100', text: 'blue.700', outline: 'blue.400' },
                  teal: { bg: 'teal.500', bgHover: 'teal.600', inactive: 'teal.50', inactiveHover: 'teal.100', text: 'teal.700', outline: 'teal.400' },
                  purple: { bg: 'purple.500', bgHover: 'purple.600', inactive: 'purple.50', inactiveHover: 'purple.100', text: 'purple.700', outline: 'purple.400' },
                  orange: { bg: 'orange.500', bgHover: 'orange.600', inactive: 'orange.50', inactiveHover: 'orange.100', text: 'orange.700', outline: 'orange.400' },
                };
                const s = schemes[color];
                return (
                  <Box
                    key={path}
                    as={Link}
                    to={path}
                    py={2.5}
                    px={4}
                    borderRadius="lg"
                    fontWeight="medium"
                    fontSize="sm"
                    color={active ? 'white' : s.text}
                    bg={active ? s.bg : s.inactive}
                    shadow={active ? 'sm' : 'none'}
                    border="none"
                    outline="none"
                    _hover={{ bg: active ? s.bgHover : s.inactiveHover, color: active ? 'white' : s.text, textDecoration: 'none' }}
                    _focus={{ outline: 'none', boxShadow: 'none', textDecoration: 'none' }}
                    _focusVisible={{ outline: '2px solid', outlineColor: s.outline, outlineOffset: '2px' }}
                    transition="all 0.2s"
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Box as={Icon} boxSize={4} />
                    {label}
                  </Box>
                );
              })}
            </Flex>

            <Box w="full" pt={2}>
              <Outlet />
            </Box>
          </VStack>
        </Container>
      </Box>
    </AdminLayout>
  );
}
