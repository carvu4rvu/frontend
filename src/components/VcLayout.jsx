import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  HStack,
  Button,
  Text,
  Flex,
  Avatar,
  Image,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import { PlacementService } from '../services/placement.service';

const NAV_ACCENT = '#FDE74C';
const HEADER_BG = '#20343c';
const HEADER_BORDER = '#2d4a54';

const VcLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const count = await PlacementService.getAlumniNotificationsUnreadCount();
        setUnreadCount(count);
      } catch (_e) {
        setUnreadCount(0);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/placement/dashboard', label: 'Dashboard' },
    { path: '/placement/companies', label: 'Companies' },
    { path: '/placement/vc-projects', label: 'Student Projects' },
    { path: '/placement/vc-events', label: 'Events' },
    { path: '/placement/vc-notifications', label: 'Notifications' },
  ];

  const isActive = (path) => {
    if (path === '/placement/dashboard') return location.pathname === '/placement/dashboard';
    if (path === '/placement/companies') return location.pathname === '/placement/companies' || location.pathname.startsWith('/placement/company/');
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  const displayName = user?.name || user?.full_name || user?.email || 'VC';
  const shortName = displayName.split(' ')[0] || displayName.split('@')[0];

  return (
    <Box minH="100vh" bg="gray.50">
      <Flex
        h={{ base: '60px', md: '72px' }}
        bg={HEADER_BG}
        borderBottom="1px solid"
        borderColor={HEADER_BORDER}
        align="center"
        justify="space-between"
        px={4}
        position="sticky"
        top={0}
        zIndex={1000}
      >
        <HStack
          spacing={3}
          minW="fit-content"
          cursor="pointer"
          onClick={() => navigate('/placement/dashboard')}
          _hover={{ opacity: 0.9 }}
        >
          <Image
            src="/logo.png"
            alt="CarvU"
            w={{ base: '160px', md: '220px' }}
            maxH={{ base: '32px', md: '44px' }}
            objectFit="contain"
            mt={-1}
            pointerEvents="none"
          />
        </HStack>

        <HStack spacing={4} align="center">
          <HStack spacing={4} align="center" display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  borderRadius={0}
                  borderBottomWidth="2px"
                  borderColor={active ? NAV_ACCENT : 'transparent'}
                  color={active ? NAV_ACCENT : 'white'}
                  fontWeight={active ? 'semibold' : 'medium'}
                  _hover={{ bg: 'transparent', color: NAV_ACCENT }}
                  _focus={{ outline: 'none', boxShadow: 'none' }}
                  _focusVisible={{ outline: `2px solid ${NAV_ACCENT}`, outlineOffset: '2px' }}
                  px={1}
                  onClick={() => navigate(item.path)}
                  type="button"
                >
                  {item.label}
                </Button>
              );
            })}
          </HStack>
          <IconButton
            aria-label="Notifications"
            icon={
              <Box position="relative">
                <BellIcon boxSize={5} />
                {unreadCount > 0 && (
                  <Badge
                    position="absolute"
                    top={-2}
                    right={-2}
                    bg="red.500"
                    color="white"
                    fontSize="10px"
                    borderRadius="full"
                    minW="18px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Box>
            }
            variant="ghost"
            color="white"
            _hover={{ bg: 'whiteAlpha.200', color: NAV_ACCENT }}
            onClick={() => navigate('/placement/vc-notifications')}
            size="sm"
          />
          <Button
            variant="ghost"
            color="red.300"
            _hover={{ bg: 'whiteAlpha.200', color: 'red.200' }}
            _focus={{ outline: 'none', boxShadow: 'none' }}
            _focusVisible={{ outline: `2px solid ${NAV_ACCENT}`, outlineOffset: '2px' }}
            onClick={handleLogout}
            size="sm"
            fontWeight="medium"
            flexShrink={0}
          >
            Logout
          </Button>
          <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
            <Avatar
              size="sm"
              name={displayName}
              src={user?.profile_image}
              border="2px solid"
              borderColor={NAV_ACCENT}
              bg="#475569"
              color="white"
            />
            <Text color="white" fontSize="sm" fontWeight="medium" maxW="120px" isTruncated>
              {shortName}
            </Text>
          </HStack>
        </HStack>
      </Flex>

      <Box p={{ base: 4, md: 8 }}>
        <Box maxW="100%">{children}</Box>
      </Box>
    </Box>
  );
};

export default VcLayout;
