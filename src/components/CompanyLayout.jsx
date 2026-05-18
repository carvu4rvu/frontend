import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  HStack,
  Button,
  Text,
  Flex,
  Avatar,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { ChevronDownIcon, BellIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import { CompanyService } from '../services/company.service';
import { getFileUrl } from '../utils/fileUrl';

// Same theme as AlumniLayout
const NAV_ACCENT = '#FDE74C';
const HEADER_BG = '#20343c';
const HEADER_BORDER = '#2d4a54';

const CompanyLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [companyProfile, setCompanyProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadCompanyProfile = async () => {
      try {
        const data = await CompanyService.getMyProfile();
        setCompanyProfile(data);
      } catch (err) {
        console.error('Failed to load company profile:', err);
      }
    };
    loadCompanyProfile();
  }, []);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const count = await CompanyService.getNotificationsUnreadCount();
        setUnreadCount(count);
      } catch {
        setUnreadCount(0);
      }
    };
    loadUnread();
    const interval = setInterval(loadUnread, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/company/dashboard', label: 'Dashboard' },
    { path: '/company/profile', label: 'Profile & Contacts' },
    { path: '/company/drives', label: 'Drives' },
    { path: '/company/offers', label: 'Offers' },
    { path: '/company/events', label: 'Events' },
    { path: '/company/projects', label: 'Student Projects' },
  ];

  const isActive = (path) => {
    if (path === '/company/drives') {
      return location.pathname === path || location.pathname.startsWith('/company/drive/');
    }
    if (path === '/company/projects') {
      return location.pathname === path || location.pathname.startsWith('/company/projects/');
    }
    return location.pathname === path;
  };

  const displayName = companyProfile?.company_name || 'Company';
  const logoUrl = companyProfile?.company_logo_link ? getFileUrl(companyProfile.company_logo_link) : null;
  const companyType = companyProfile?.company_type;
  const shortName = displayName.length > 20 ? `${displayName.slice(0, 18)}…` : displayName;

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Top header – same as Alumni nav bar */}
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
        {/* Left: Logo only */}
        <HStack
          spacing={3}
          minW="fit-content"
          cursor="pointer"
          onClick={() => navigate('/company/dashboard')}
          _hover={{ opacity: 0.9 }}
        >
          <Image
            src="/logo.png"
            alt="CarvU Company"
            w={{ base: '160px', md: '220px' }}
            maxH={{ base: '32px', md: '44px' }}
            objectFit="contain"
            mt={-1}
            pointerEvents="none"
          />
        </HStack>

        {/* Right: Nav items + Notifications + Logout + Profile menu */}
        <HStack spacing={4} align="center">
          {/* Nav items – text only, underline active (same style as Alumni) */}
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
            onClick={() => navigate('/company/notifications')}
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
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              _hover={{ bg: 'whiteAlpha.200' }}
              _active={{ bg: 'whiteAlpha.300' }}
              _focus={{ outline: 'none', boxShadow: 'none' }}
              _focusVisible={{ outline: `2px solid ${NAV_ACCENT}`, outlineOffset: '2px' }}
              borderRadius="full"
              pl={2}
              pr={3}
              py={1}
              h="auto"
              size="sm"
            >
              <HStack spacing={3}>
                <Avatar
                  size="sm"
                  name={displayName}
                  src={logoUrl}
                  border="2px solid"
                  borderColor={NAV_ACCENT}
                  bg="#475569"
                  color="white"
                />
                <Text
                  color="white"
                  fontSize="sm"
                  fontWeight="medium"
                  display={{ base: 'none', md: 'block' }}
                  maxW="150px"
                  isTruncated
                >
                  {shortName}
                </Text>
                <ChevronDownIcon color="whiteAlpha.700" display={{ base: 'none', md: 'block' }} />
              </HStack>
            </MenuButton>
            <MenuList
              bg="#1e293b"
              borderColor="#334155"
              boxShadow="lg"
              py={2}
              minW="220px"
            >
              <Box px={4} py={3} borderBottom="1px solid" borderColor="#334155">
                <HStack spacing={3}>
                  <Avatar
                    size="md"
                    name={displayName}
                    src={logoUrl}
                    border="2px solid"
                    borderColor={NAV_ACCENT}
                    bg="#475569"
                    color="white"
                  />
                  <Box minW={0}>
                    <Text color="white" fontWeight="600" fontSize="sm" noOfLines={1}>
                      {displayName}
                    </Text>
                    {companyType && (
                      <Text color={NAV_ACCENT} fontSize="xs" noOfLines={1}>
                        {companyType}
                      </Text>
                    )}
                    <Text color="gray.400" fontSize="xs" noOfLines={1}>
                      {user?.email}
                    </Text>
                  </Box>
                </HStack>
              </Box>
              {/* Mobile: nav links in dropdown (text only, no icons) */}
              <Box display={{ base: 'block', md: 'none' }} borderBottom="1px solid" borderColor="#334155">
                {navItems.map((item) => (
                  <MenuItem
                    key={item.path}
                    as={Link}
                    to={item.path}
                    bg="transparent"
                    color={isActive(item.path) ? NAV_ACCENT : 'gray.300'}
                    _hover={{ bg: '#334155', color: 'white' }}
                    fontSize="sm"
                    py={2}
                  >
                    {item.label}
                  </MenuItem>
                ))}
                <MenuItem
                  as={Link}
                  to="/company/notifications"
                  bg="transparent"
                  color={isActive('/company/notifications') ? NAV_ACCENT : 'gray.300'}
                  _hover={{ bg: '#334155', color: 'white' }}
                  fontSize="sm"
                  py={2}
                >
                  Notifications
                  {unreadCount > 0 && (
                    <Badge ml={2} colorScheme="red" fontSize="xs">
                      {unreadCount}
                    </Badge>
                  )}
                </MenuItem>
              </Box>
              <MenuItem
                as={Link}
                to="/company/profile"
                bg="transparent"
                color="gray.300"
                _hover={{ bg: '#334155', color: 'white' }}
                fontSize="sm"
                py={2}
              >
                Company Settings
              </MenuItem>
              <MenuDivider borderColor="#334155" />
              <MenuItem
                onClick={handleLogout}
                bg="transparent"
                color="red.400"
                _hover={{ bg: '#334155', color: 'red.300' }}
                fontSize="sm"
                py={2}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Full-bleed for drives/drive detail (match admin Events & Process pages) */}
      {location.pathname === '/company/drives' || location.pathname.startsWith('/company/drive/') ? (
        <Box bg="#f0f0f0" minH="100vh" w="100%">
          {children}
        </Box>
      ) : (
        <Box p={{ base: 4, md: 8 }}>
          <Box maxW="100%">{children}</Box>
        </Box>
      )}
    </Box>
  );
};

export default CompanyLayout;
