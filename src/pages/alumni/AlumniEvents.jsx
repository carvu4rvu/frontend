import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Flex,
  Spinner,
  useToast,
  Badge,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon } from '@chakra-ui/icons';
import AlumniLayout from '../../components/AlumniLayout';
import { PlacementService } from '../../services/placement.service';
import { getFileUrl } from '../../utils/fileUrl';

const colors = {
  accent: '#d4a960',
  accentHover: '#b8923d',
  dark: '#1e293b',
  darkGreen: '#166534',
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
  return d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });
}

function isUpcoming(iso) {
  return iso && new Date(iso) > new Date();
}

/** Event image: use API-provided image_url (system-assets), then event.images[0], then VITE_SUPABASE_URL fallback */
function getEventImageUrl(ev) {
  if (ev?.image_url) return ev.image_url;
  const first = Array.isArray(ev?.images) && ev.images[0];
  if (first && (typeof first === 'string' ? first : first?.url)) {
    const url = typeof first === 'string' ? first : first.url;
    return getFileUrl(url) || url;
  }
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (base && ev?.id) {
    return `${base.replace(/\/$/, '')}/storage/v1/object/public/system-assets/events/${ev.id}.jpg`;
  }
  return null;
}

function EventCardImage({ ev }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const src = getEventImageUrl(ev);
  if (!src) {
    return (
      <Box
        h="160px"
        bg={`linear-gradient(135deg, ${colors.lightAccent} 0%, ${colors.border} 100%)`}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={CalendarIcon} boxSize={10} color={colors.muted} />
      </Box>
    );
  }
  return (
    <Box h="160px" bg={colors.border} position="relative" overflow="hidden">
      <Box
        as="img"
        src={src}
        alt=""
        w="100%"
        h="100%"
        objectFit="cover"
        display={error ? 'none' : 'block'}
        onLoad={() => { setLoaded(true); setError(false); }}
        onError={() => setError(true)}
      />
      {(!loaded || error) && (
        <Box
          position="absolute"
          inset={0}
          bg={`linear-gradient(135deg, ${colors.lightAccent} 0%, ${colors.border} 100%)`}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={CalendarIcon} boxSize={10} color={colors.muted} />
        </Box>
      )}
    </Box>
  );
}

const defaultFetchAlumniEvents = () => PlacementService.getAlumniEvents();

const AlumniEvents = ({ LayoutComponent = AlumniLayout, fetchEvents }) => {
  const Layout = LayoutComponent;
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchFn = useMemo(
    () => fetchEvents ?? defaultFetchAlumniEvents,
    [fetchEvents]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchFn();
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          toast({ title: 'Failed to load events', status: 'error', isClosable: true });
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast, fetchFn]);

  const upcoming = events.filter((e) => isUpcoming(e.event_datetime));
  const past = events.filter((e) => !isUpcoming(e.event_datetime));

  return (
    <Layout>
      <Box bg={colors.pageBg} minH="100vh" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
        <Heading size="lg" color={colors.dark} mb={2} fontWeight="800" letterSpacing="-0.02em">
          Events for Alumni
        </Heading>
        <Text color={colors.secondary} mb={8} fontSize="md">
          All events shared with the alumni community. When a notification is sent to alumni about an event, it appears here for everyone.
        </Text>

        {loading ? (
          <Flex justify="center" py={16}>
            <Spinner size="xl" color={colors.accent} thickness="4px" />
          </Flex>
        ) : events.length === 0 ? (
          <Card bg={colors.cardBg} borderRadius={CARD_RADIUS} boxShadow={CARD_SHADOW} p={12} textAlign="center">
            <VStack spacing={4}>
              <Icon as={CalendarIcon} boxSize={14} color={colors.muted} />
              <Heading size="md" color={colors.dark}>No events yet</Heading>
              <Text color={colors.secondary} fontSize="sm">
                When the placement team shares events with alumni, they will appear here.
              </Text>
            </VStack>
          </Card>
        ) : (
          <VStack align="stretch" spacing={10}>
            {upcoming.length > 0 && (
              <Box>
                <HStack mb={4}>
                  <Badge bg={colors.darkGreen} color="white" px={3} py={1.5} borderRadius="full" fontSize="xs" fontWeight="700">
                    Upcoming
                  </Badge>
                  <Text color={colors.secondary} fontSize="sm">{upcoming.length} event(s)</Text>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  {upcoming.map((ev) => (
                    <Card
                      key={ev.id}
                      bg={colors.cardBg}
                      borderRadius={CARD_RADIUS}
                      boxShadow={CARD_SHADOW}
                      borderWidth="1px"
                      borderColor={colors.border}
                      overflow="hidden"
                      _hover={{ borderColor: colors.accent, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                      transition="all 0.2s"
                    >
                      <EventCardImage ev={ev} />
                      <CardBody>
                        <Badge mb={3} colorScheme="green" fontSize="xs">{ev.type || 'Event'}</Badge>
                        <Heading size="md" color={colors.dark} mb={2}>{ev.title}</Heading>
                        <Text fontSize="sm" color={colors.secondary} mb={3} noOfLines={2}>
                          {ev.details || '—'}
                        </Text>
                        <HStack color={colors.muted} fontSize="sm" spacing={4}>
                          <HStack><TimeIcon /><span>{formatEventDate(ev.event_datetime)}</span></HStack>
                        </HStack>
                        {ev.status && (
                          <Badge mt={3} colorScheme={ev.status === 'scheduled' ? 'blue' : 'gray'}>
                            {ev.status}
                          </Badge>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {past.length > 0 && (
              <Box>
                <HStack mb={4}>
                  <Badge bg={colors.muted} color="white" px={3} py={1.5} borderRadius="full" fontSize="xs" fontWeight="700">
                    Past
                  </Badge>
                  <Text color={colors.secondary} fontSize="sm">{past.length} event(s)</Text>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  {past.map((ev) => (
                    <Card
                      key={ev.id}
                      bg={colors.cardBg}
                      borderRadius={CARD_RADIUS}
                      boxShadow="sm"
                      borderWidth="1px"
                      borderColor={colors.border}
                      opacity={0.9}
                      overflow="hidden"
                    >
                      <EventCardImage ev={ev} />
                      <CardBody>
                        <Badge mb={3} colorScheme="gray" fontSize="xs">{ev.type || 'Event'}</Badge>
                        <Heading size="md" color={colors.dark} mb={2}>{ev.title}</Heading>
                        <Text fontSize="sm" color={colors.secondary} mb={3} noOfLines={2}>
                          {ev.details || '—'}
                        </Text>
                        <HStack color={colors.muted} fontSize="sm" spacing={4}>
                          <HStack><TimeIcon /><span>{formatEventDate(ev.event_datetime)}</span></HStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </VStack>
        )}
      </Box>
    </Layout>
  );
};

export default AlumniEvents;
