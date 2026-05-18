import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  IconButton,
  Grid,
  GridItem,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  useToast,
  Button,
} from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';
import { EventsService } from '../../services/events.service';
import { useAuth } from '../../context/AuthContext';

const CalendarOfEvents = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const range = useMemo(() => {
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const startIdx = firstDay.getDay();
    const totalDays = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil((startIdx + totalDays) / 7);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - startIdx);
    const days = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    const end = days[days.length - 1];
    return { days, start, end, weeks };
  }, [current]);

  const monthEvents = useMemo(() => {
    const ym = current.getMonth();
    const yf = current.getFullYear();
    return events.filter(e => {
      const ed = new Date(e.event_date);
      return ed.getMonth() === ym && ed.getFullYear() === yf;
    });
  }, [events, current]);

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDMY = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${m}-${y}`;
  };

  const dateColors = ['pink', 'blue', 'purple', 'orange', 'teal', 'cyan', 'red', 'yellow'];
  const getDateColorName = (d) => dateColors[(d.getDate() - 1) % dateColors.length];

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [drivesRes, generalEventsList] = await Promise.all([
        PlacementService.getAllDrives(),
        EventsService.list().catch(() => [])
      ]);
      const drives = Array.isArray(drivesRes) ? drivesRes : (drivesRes?.data != null ? drivesRes.data : []);
      const companyName = (d) => d.company?.company_name || d.company_name || 'Company';
      // All placement drives: use event_datetime, else last_date_to_registration, else created_at so every drive shows
      const placementEvents = (drives || []).map(drive => {
        const dateRaw = drive.event_datetime || drive.last_date_to_registration || drive.created_at;
        return {
          id: drive.id,
          title: `${companyName(drive)} Drive`,
          description: drive.job_description || 'Placement Drive',
          event_date: dateRaw,
          start_time: dateRaw ? new Date(dateRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
          type: 'Placement',
          notification_remarks: drive.placement_status
        };
      }).filter(e => e.event_date != null);
      // General events from events table
      const generalEvents = Array.isArray(generalEventsList) ? generalEventsList : [];
      const mappedEvents = generalEvents
        .filter(ev => ev.event_datetime != null)
        .map(ev => ({
          id: `event-${ev.id}`,
          rawId: ev.id,
          title: ev.title || 'Event',
          description: ev.details || ev.type || 'Event',
          event_date: ev.event_datetime,
          start_time: ev.event_datetime ? new Date(ev.event_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
          type: 'Event'
        }));
      setEvents([...placementEvents, ...mappedEvents]);
    } catch (err) {
      setError('Failed to load calendar events');
      console.error(err);
      if (err.message === 'Forbidden' || (err.message && err.message.includes('403'))) {
        toast({ title: 'Session expired', description: 'Please login again', status: 'error', duration: 3000 });
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDayClick = (d) => setSelectedDate(d);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrent(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  }, []);

  const dayEvents = (d) => {
    const iso = formatDate(d);
    return monthEvents.filter(e => {
      if (!e.event_date) return false;
      const eDate = new Date(e.event_date);
      return formatDate(eDate) === iso;
    });
  };

  return (
    <AdminLayout compactTop fullWidth>
      <Box
        bg="#f0f0f0"
        minH="calc(100vh - 72px)"
        overflow="auto"
        display="flex"
        flexDirection="column"
        pt={{ base: 6, md: 8 }}
        pb={{ base: 8, md: 12 }}
        px={{ base: 4, sm: 6, lg: 8 }}
        alignItems="flex-start"
      >
        <Box
          flex={1}
          minH={0}
          display="flex"
          flexDirection="column"
          maxW="100%"
          mx="auto"
          w="100%"
        >
          <VStack spacing={4} align="stretch" flex={1} minH={0}>
            <HStack justify="space-between" align="center" flexShrink={0} mb={2} w="100%">
              <Heading size="lg" lineHeight="shorter">Calendar of Events</Heading>
              <Button
                leftIcon={<FiCalendar />}
                size="sm"
                colorScheme="green"
                variant="outline"
                onClick={goToToday}
              >
                Go to Today
              </Button>
            </HStack>

            {loading ? (
              <Box bg="white" borderRadius="xl" p={8} boxShadow="lg" textAlign="center" flexShrink={0}>
                <Spinner size="lg" />
              </Box>
            ) : error ? (
              <Alert status="error" borderRadius="xl" variant="left-accent" flexShrink={0}>
                <AlertIcon />
                {error}
              </Alert>
            ) : (
              <HStack align="stretch" spacing={{ base: 5, lg: 6 }} flex={1} minH={0} overflow="hidden" flexDir={{ base: 'column', lg: 'row' }} w="100%">
                <Box flex={1} minW={0} minH={{ base: '400px', lg: '520px' }} bg="white" borderRadius="xl" boxShadow="lg" overflow="hidden" display="flex" flexDirection="column">
                  <Box bg="green.700" px={5} py={3} color="white" flexShrink={0}>
                    <HStack justify="center" align="center" spacing={4}>
                      <IconButton aria-label="Previous month" size="sm" variant="ghost" colorScheme="whiteAlpha" icon={<FiChevronLeft />} onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} />
                      <Heading as="h1" fontSize={{ base: 'md', sm: 'lg' }} fontWeight="bold" textTransform="uppercase">
                        {current.toLocaleString(undefined, { month: 'short' })} {current.getFullYear()}
                      </Heading>
                      <IconButton aria-label="Next month" size="sm" variant="ghost" colorScheme="whiteAlpha" icon={<FiChevronRight />} onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} />
                    </HStack>
                  </Box>
                  <VStack spacing={0} align="stretch" flex={1} minH={0}>
                    <Grid templateColumns="repeat(7, 1fr)" gap={0} flexShrink={0}>
                      {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((w) => (
                        <Box key={w} bg="#fad373" py={3} px={2}>
                          <Text textAlign="center" fontSize="sm" fontWeight="bold" color="gray.900">{w}</Text>
                        </Box>
                      ))}
                    </Grid>
                    <Grid
                      templateColumns="repeat(7, 1fr)"
                      templateRows={`repeat(${range.weeks}, 1fr)`}
                      gap={0}
                      borderTop="1px solid"
                      borderLeft="1px solid"
                      borderColor="gray.200"
                      flex={1}
                      minH={0}
                    >
                      {range.days.map((d, idx) => {
                        const inMonth = d.getMonth() === current.getMonth();
                        const evs = dayEvents(d);
                        const isSelected = d.toDateString() === selectedDate.toDateString();
                        const isSunday = d.getDay() === 0;
                        const isToday = new Date().toDateString() === d.toDateString();
                        const colorName = getDateColorName(d);
                        const hasEvents = evs.length > 0;
                        return (
                          <GridItem key={idx} cursor="pointer" onClick={() => handleDayClick(d)} borderRight="1px solid" borderBottom="1px solid" borderColor="gray.200">
                            <Box
                              position="relative"
                              p={2}
                              bg={hasEvents ? `${colorName}.50` : 'white'}
                              opacity={inMonth ? 1 : 0.5}
                              _hover={{ bg: hasEvents ? `${colorName}.100` : 'gray.50' }}
                              display="flex"
                              flexDir="column"
                              alignItems="center"
                              justifyContent="center"
                              height="100%"
                              w="100%"
                              border={isSelected ? '2px solid' : 'none'}
                              borderColor={isSelected ? 'green.500' : 'transparent'}
                              borderRadius="sm"
                            >
                              <Text fontWeight="bold" fontSize="md" textAlign="center" color={isSelected ? 'green.600' : (isSunday ? 'red.500' : 'gray.800')}>{d.getDate()}</Text>
                              {isToday && (
                                <Box position="absolute" top={1} right={1} w="2" h="2" borderRadius="full" bg="green.500" />
                              )}
                              {hasEvents && (
                                <HStack spacing={1} mt={1} wrap="wrap" justify="center" onClick={(ev) => ev.stopPropagation()}>
                                  {evs.slice(0, 3).map((e, i) => (
                                    <Box
                                      key={e.id || i}
                                      w="6px"
                                      h="6px"
                                      borderRadius="full"
                                      bg={e.type === 'Placement' ? 'blue.500' : 'orange.500'}
                                      cursor="pointer"
                                      title={e.title}
                                      onClick={() => e.type === 'Placement' ? navigate(`/placement/events/${e.id}/process`) : navigate('/events')}
                                      _hover={{ transform: 'scale(1.3)' }}
                                    />
                                  ))}
                                  {evs.length > 3 && <Text fontSize="xs">+{evs.length - 3}</Text>}
                                </HStack>
                              )}
                            </Box>
                          </GridItem>
                        );
                      })}
                    </Grid>
                  </VStack>
                </Box>

                <Box w={{ base: '100%', lg: '340px' }} flexShrink={0} bg="white" borderRadius="xl" p={5} boxShadow="lg" overflowY="auto" mb={{ base: 4, lg: 0 }}>
                  <Heading as="h2" fontSize="lg" fontWeight="bold" color="gray.700" mb={3}>
                    {formatDMY(selectedDate)}
                  </Heading>
                  <Divider mb={3} />
                  <VStack align="stretch" spacing={3}>
                    {dayEvents(selectedDate).length === 0 ? (
                      <Text color="gray.500" fontSize="sm">No events for this date.</Text>
                    ) : (
                      dayEvents(selectedDate).map(e => (
                        <Box
                          key={e.id}
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                          bg="white"
                          boxShadow="sm"
                          borderLeft="4px solid"
                          borderLeftColor={e.type === 'Placement' ? 'blue.500' : 'orange.500'}
                          cursor="pointer"
                          onClick={() => e.type === 'Placement' ? navigate(`/placement/events/${e.id}/process`) : navigate('/events')}
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Text fontWeight="bold" fontSize="sm" mb={1}>{e.title}</Text>
                          <Text fontSize="xs" color="gray.600">{e.start_time ? `${e.start_time} - ` : ''}{e.type}</Text>
                          {e.description && <Text fontSize="xs" mt={1} noOfLines={2}>{e.description}</Text>}
                        </Box>
                      ))
                    )}
                  </VStack>
                </Box>
              </HStack>
            )}
          </VStack>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default CalendarOfEvents;
