import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  Flex,
  Spinner,
  Badge,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { EmailIcon, ViewIcon, CalendarIcon, BellIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import AlumniLayout from '../../components/AlumniLayout';
import { useAuth } from '../../context/AuthContext';
import { PlacementService } from '../../services/placement.service';

const colors = {
  accent: '#d4a960',
  accentHover: '#b8923d',
  darkGreen: '#166534',
  darkGreenLight: '#15803d',
  dark: '#1e293b',
  secondary: '#64748b',
  cardBg: '#ffffff',
  pageBg: '#f8fafc',
  border: '#e2e8f0',
  lightAccent: '#fef9e7',
  muted: '#94a3b8',
};

const CARD_RADIUS = '20px';
const CARD_SHADOW = '0 4px 24px rgba(15, 23, 42, 0.08)';

function formatEventDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function isUpcoming(iso) {
  return iso && new Date(iso) >= new Date();
}

const AlumniDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [hrCount, setHrCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [eventsData, hrData] = await Promise.all([
          PlacementService.getAlumniEvents(),
          PlacementService.getMyHrRecommendations().catch(() => []),
        ]);
        if (!cancelled) {
          setEvents(Array.isArray(eventsData) ? eventsData : []);
          setHrCount(Array.isArray(hrData) ? hrData.length : 0);
        }
      } catch (e) {
        if (!cancelled) toast({ title: 'Failed to load dashboard', status: 'error', isClosable: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const upcomingEvents = events.filter((e) => isUpcoming(e.event_datetime)).slice(0, 5);
  const displayName = user?.name || user?.full_name || 'Alumni';

  return (
    <AlumniLayout>
      <Box maxW="1200px" mx="auto">
        {/* Hero – matches alumni nav bar gray */}
        <Box
          bg="#20343c"
          borderRadius="2xl"
          p={{ base: 6, md: 10 }}
          color="white"
          boxShadow="xl"
          mb={{ base: 6, md: 10 }}
        >
          <Heading size="lg" mb={2} fontWeight="800" letterSpacing="-0.02em">
            Welcome back, {displayName}!
          </Heading>
          <Text fontSize="lg" opacity={0.95} mb={6}>
            Connect with your alma mater, mentor juniors, and stay updated with campus placements.
          </Text>
          <HStack spacing={4} flexWrap="wrap" gap={3}>
            <Button
              bg="#FDE74C"
              color="#20343c"
              _hover={{ bg: '#e5d43a', color: '#20343c' }}
              leftIcon={<ViewIcon />}
              onClick={() => navigate('/placement/alumni-profile')}
              fontWeight="600"
              borderRadius="xl"
              size="md"
            >
              My Profile
            </Button>
            <Button
              variant="outline"
              borderColor="whiteAlpha.600"
              color="white"
              _hover={{ bg: 'whiteAlpha.200', borderColor: 'white' }}
              leftIcon={<EmailIcon />}
              onClick={() => navigate('/placement/alumni-hr-recommendations')}
              fontWeight="600"
              borderRadius="xl"
              size="md"
            >
              Refer HR
            </Button>
            <Button
              variant="outline"
              borderColor="whiteAlpha.600"
              color="white"
              _hover={{ bg: 'whiteAlpha.200', borderColor: 'white' }}
              leftIcon={<ViewIcon />}
              onClick={() => navigate('/placement/alumni-directory')}
              fontWeight="600"
              borderRadius="xl"
              size="md"
            >
              Alumni Directory
            </Button>
            <Button
              variant="outline"
              borderColor="whiteAlpha.600"
              color="white"
              _hover={{ bg: 'whiteAlpha.200', borderColor: 'white' }}
              leftIcon={<CalendarIcon />}
              onClick={() => navigate('/placement/alumni-events')}
              fontWeight="600"
              borderRadius="xl"
              size="md"
            >
              Events
            </Button>
          </HStack>
        </Box>

        {/* Quick stats */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mb={8}>
          <Card
            borderLeft="4px solid"
            borderLeftColor={colors.accent}
            boxShadow={CARD_SHADOW}
            borderRadius={CARD_RADIUS}
            bg={colors.cardBg}
          >
            <CardBody>
              <Text color={colors.secondary} fontSize="sm" fontWeight="600" mb={1}>HR Referrals</Text>
              <Heading size="xl" color={colors.darkGreen}>{loading ? '—' : hrCount}</Heading>
              <Text fontSize="sm" color={colors.muted}>Submitted by you</Text>
            </CardBody>
          </Card>
          <Card
            borderLeft="4px solid"
            borderLeftColor={colors.darkGreen}
            boxShadow={CARD_SHADOW}
            borderRadius={CARD_RADIUS}
            bg={colors.cardBg}
          >
            <CardBody>
              <Text color={colors.secondary} fontSize="sm" fontWeight="600" mb={1}>Upcoming Events</Text>
              <Heading size="xl" color={colors.darkGreen}>
                {loading ? '—' : upcomingEvents.length}
              </Heading>
              <Text fontSize="sm" color={colors.muted}>Shared with alumni</Text>
            </CardBody>
          </Card>
          <Card
            borderLeft="4px solid"
            borderLeftColor="#3182ce"
            boxShadow={CARD_SHADOW}
            borderRadius={CARD_RADIUS}
            bg={colors.cardBg}
          >
            <CardBody>
              <Text color={colors.secondary} fontSize="sm" fontWeight="600" mb={1}>Quick Actions</Text>
              <HStack spacing={2} mt={2} flexWrap="wrap">
                <Button size="sm" colorScheme="green" variant="outline" onClick={() => navigate('/placement/alumni-events')}>
                  Events
                </Button>
                <Button size="sm" colorScheme="green" variant="outline" onClick={() => navigate('/placement/alumni-notifications')}>
                  Notifications
                </Button>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Upcoming events (alumni-specific) */}
        <Heading size="md" color={colors.dark} mb={4} fontWeight="700">
          Upcoming events for you
        </Heading>
        {loading ? (
          <Flex justify="center" py={10}><Spinner color={colors.accent} size="lg" /></Flex>
        ) : upcomingEvents.length === 0 ? (
          <Card bg={colors.cardBg} borderRadius={CARD_RADIUS} boxShadow="sm" p={8} borderWidth="1px" borderColor={colors.border}>
            <VStack spacing={2}>
              <Icon as={CalendarIcon} boxSize={10} color={colors.muted} />
              <Text color={colors.secondary}>No upcoming events shared with alumni yet.</Text>
              <Button size="sm" colorScheme="green" variant="ghost" onClick={() => navigate('/placement/alumni-events')}>
                View all events
              </Button>
            </VStack>
          </Card>
        ) : (
          <VStack align="stretch" spacing={4} mb={10}>
            {upcomingEvents.map((ev) => (
              <Card
                key={ev.id}
                bg={colors.cardBg}
                borderRadius={CARD_RADIUS}
                boxShadow={CARD_SHADOW}
                borderWidth="1px"
                borderColor={colors.border}
                _hover={{ borderColor: colors.accent, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => navigate('/placement/alumni-events')}
              >
                <CardBody>
                  <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
                    <Box>
                      <Badge colorScheme="green" mb={2}>{ev.type || 'Event'}</Badge>
                      <Heading size="sm" color={colors.dark}>{ev.title}</Heading>
                      <Text fontSize="sm" color={colors.secondary} mt={1}>{formatEventDate(ev.event_datetime)}</Text>
                    </Box>
                    <Button size="sm" colorScheme="green" variant="outline" onClick={(e) => { e.stopPropagation(); navigate('/placement/alumni-events'); }}>
                      View
                    </Button>
                  </Flex>
                </CardBody>
              </Card>
            ))}
            <Button variant="link" colorScheme="green" onClick={() => navigate('/placement/alumni-events')}>
              See all events →
            </Button>
          </VStack>
        )}

        {/* Quick links grid */}
        <Heading size="md" color={colors.dark} mb={4} fontWeight="700">
          Quick links
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <Card
            borderLeft="4px solid"
            borderLeftColor={colors.accent}
            boxShadow="md"
            cursor="pointer"
            borderRadius={CARD_RADIUS}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
            transition="all 0.2s"
            onClick={() => navigate('/placement/alumni-projects')}
          >
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color={colors.muted} fontSize="sm">Student Projects</Text>
                <Heading size="md" color={colors.darkGreen}>Explore student work</Heading>
                <Text fontSize="sm" color={colors.secondary}>View projects, skills, and profiles of current students.</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card
            borderLeft="4px solid"
            borderLeftColor="#3182ce"
            boxShadow="md"
            cursor="pointer"
            borderRadius={CARD_RADIUS}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
            transition="all 0.2s"
            onClick={() => navigate('/placement/alumni-directory')}
          >
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color={colors.muted} fontSize="sm">Alumni Directory</Text>
                <Heading size="md" color={colors.darkGreen}>Browse alumni network</Heading>
                <Text fontSize="sm" color={colors.secondary}>View and search fellow alumni.</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card
            borderLeft="4px solid"
            borderLeftColor={colors.darkGreen}
            boxShadow="md"
            cursor="pointer"
            borderRadius={CARD_RADIUS}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
            transition="all 0.2s"
            onClick={() => navigate('/placement/alumni-hr-recommendations')}
          >
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color={colors.muted} fontSize="sm">Refer HR</Text>
                <Heading size="md" color={colors.darkGreen}>Submit a referral</Heading>
                <Text fontSize="sm" color={colors.secondary}>Share job opportunities with the placement team.</Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
    </AlumniLayout>
  );
};

export default AlumniDashboard;
