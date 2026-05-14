import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Box, HStack, Button, Text, Flex, Avatar, Container, Image, Tag
} from '@chakra-ui/react';
import { ViewIcon, CopyIcon, InfoIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

const DeanLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dean/dashboard', label: 'School Overview', icon: ViewIcon },
    { path: '/dean/projects', label: 'Student Projects', icon: CopyIcon },
    { path: '/dean/companies', label: 'Companies', icon: InfoIcon },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Top Navbar */}
      <Box
        bgGradient="linear(to-r, #1a365d, #2c5282)"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.15)"
        position="sticky"
        top={0}
        zIndex={1000}
      >
        <Container maxW="100%" px={{ base: 4, md: 8 }}>
          <Flex justify="space-between" align="center" h={{ base: '60px', md: '72px' }}>
            <HStack spacing={{ base: 4, md: 8 }}>
              <HStack onClick={() => navigate('/dean/dashboard')} cursor="pointer" spacing={3}>
                <Image src="/logo.png" alt="Dean Portal" w="220px" objectFit="contain" mt={-2} />
                <Text color="white" fontWeight="bold" fontSize="xl" mt={2}>
                  Dean's Portal
                </Text>
                {user?.school && (
                  <Tag colorScheme="cyan" variant="solid" mt={2}>{user.school}</Tag>
                )}
              </HStack>

              <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                      <Button
                        variant="ghost"
                        size="md"
                        borderRadius="xl"
                        fontWeight={active ? '600' : '500'}
                        color={active ? 'white' : 'whiteAlpha.700'}
                        bg={active ? 'whiteAlpha.200' : 'transparent'}
                        _hover={{
                          bg: 'whiteAlpha.300',
                          color: 'white',
                        }}
                        leftIcon={<item.icon />}
                      >
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </HStack>
            </HStack>

            <HStack spacing={{ base: 2, md: 4 }}>
              <HStack spacing={3}>
                <Text color="white" fontSize="sm" fontWeight="500" display={{ base: 'none', md: 'block' }}>
                  {user?.name}
                </Text>
                <Avatar size="sm" name={user?.name} src={user?.avatar} border="2px solid rgba(255,255,255,0.2)" />
                <Button size="sm" variant="ghost" color="white" onClick={handleLogout} _hover={{ bg: 'whiteAlpha.200' }}>
                  Logout
                </Button>
              </HStack>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box p={{ base: 4, md: 8 }}>
        <Container maxW="100%">
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default DeanLayout;
