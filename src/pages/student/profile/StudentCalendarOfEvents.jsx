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
  Button,
} from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { PlacementService } from '../../../services/placement.service';
import { EventsService } from '../../../services/events.service';

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

export const StudentCalendarOfEvents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => new Date(today.getFullYear() - 1, today.getMonth(), 1), [today]);
  const maxDate = useMemo(() => new Date(today.getFullYear() + 1, today.getMonth(), 1), [today]);
  const canGoPrev = current > minDate;
  const canGoNext = current < maxDate;

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrent(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  }, []);

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
    return { days, start, end: days[days.length - 1], weeks };
  }, [current]);

  const monthEvents = useMemo(() => {
    const ym = current.getMonth();
    const yf = current.getFullYear();
    return events.filter((e) => {
      const ed = new Date(e.event_date);
      return ed.getMonth() === ym && ed.getFullYear() === yf;
    });
  }, [events, current]);

  const dateColors = ['pink', 'blue', 'purple', 'orange', 'teal', 'cyan', 'red', 'yellow'];
  const getDateColorName = (d) => dateColors[(d.getDate() - 1) % dateColors.length];

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [drivesRes, generalEventsList] = await Promise.all([
        PlacementService.getAllDrives(),
        EventsService.list().catch(() => []),
      ]);
      const drives = Array.isArray(drivesRes) ? drivesRes : drivesRes?.data ?? [];
      const companyName = (d) => d.company?.company_name || d.company_name || 'Company';
      const placementEvents = (drives || []).map((drive) => {
        const dateRaw = drive.event_datetime || drive.last_date_to_registration || drive.created_at;
        return {
          id: drive.id,
          title: `${companyName(drive)} Drive`,
          description: drive.job_description || 'Placement Drive',
          event_date: dateRaw,
          start_time: dateRaw ? new Date(dateRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
          type: 'Placement',
          placement_status: drive.placement_status,
        };
      }).filter((e) => e.event_date != null);

      const generalEvents = Array.isArray(generalEventsList) ? generalEventsList : [];
      const mappedEvents = generalEvents
        .filter((ev) => ev.event_datetime != null)
        .map((ev) => ({
          id: `event-${ev.id}`,
          rawId: ev.id,
          title: ev.title || 'Event',
          description: ev.details || ev.type || 'Event',
          event_date: ev.event_datetime,
          start_time: ev.event_datetime ? new Date(ev.event_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
          type: 'Event',
        }));
      setEvents([...placementEvents, ...mappedEvents]);
    } catch (err) {
      setError('Failed to load calendar events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDayClick = (d) => setSelectedDate(d);

  const dayEvents = (d) => {
    const iso = formatDate(d);
    return monthEvents.filter((e) => {
      if (!e.event_date) return false;
      const eDate = new Date(e.event_date);
      return formatDate(eDate) === iso;
    });
  };

  const handleEventClick = (e) => {
    if (e.type === 'Placement') navigate(`/student/placements/drive/${e.id}`);
    else navigate('/student/placements/events');
  };

  const HEADER_H = 56;
  const DAY_LABELS_H = 40;

  return (
    <Box
      bg="gray.50"
      minH="520px"
      h="calc(100vh - 140px)"
      py={4}
      px={4}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      minW="280px"
    >
      <HStack justify="space-between" align="flex-start" wrap="wrap" gap={3} mb={4} flexShrink={0}>
        <Box>
          <Heading size="lg" color="#20343c" mb={2}>
            Calendar of Events & Drives
          </Heading>
          <Text fontSize="sm" color="gray.700">
            Upcoming events and placement drives. Click a day to see details.
          </Text>
        </Box>
        <Button
          leftIcon={<FiCalendar />}
          size="sm"
          colorScheme="teal"
          variant="outline"
          onClick={goToToday}
          flexShrink={0}
        >
          Go to Today
        </Button>
      </HStack>

      {loading ? (
        <Box bg="white" borderRadius="xl" p={8} boxShadow="lg" textAlign="center" flex={1}>
          <Spinner size="lg" color="#d4a960" />
        </Box>
      ) : error ? (
        <Alert status="error" borderRadius="xl" variant="left-accent" flexShrink={0}>
          <AlertIcon />
          {error}
        </Alert>
      ) : (
        <HStack align="stretch" spacing={5} flex={1} minH={0} overflow="hidden" flexDir={{ base: 'column', lg: 'row' }}>
          <Box
            flex={1}
            minW={{ base: "280px", sm: "350px" }}
            minH="320px"
            bg="white"
            borderRadius="xl"
            boxShadow="lg"
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            <Box bg="#20343c" px={5} py={3} color="white" flexShrink={0} h={`${HEADER_H}px`}>
              <HStack justify="center" align="center" spacing={5}>
                <IconButton
                  aria-label="Previous month"
                  size="md"
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  icon={<FiChevronLeft />}
                  onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                  isDisabled={!canGoPrev}
                  opacity={canGoPrev ? 1 : 0.5}
                />
                <Heading as="h1" fontSize={{ base: 'lg', sm: 'xl' }} fontWeight="bold" textTransform="uppercase">
                  {current.toLocaleString(undefined, { month: 'short' })} {current.getFullYear()}
                </Heading>
                <IconButton
                  aria-label="Next month"
                  size="md"
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  icon={<FiChevronRight />}
                  onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                  isDisabled={!canGoNext}
                  opacity={canGoNext ? 1 : 0.5}
                />
              </HStack>
            </Box>
            <Box flex={1} minH={0} display="flex" flexDirection="column" overflow="hidden" p={0}>
              <Grid templateColumns="repeat(7, 1fr)" gap={0} flexShrink={0} h={`${DAY_LABELS_H}px`} w="100%">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
                  <Box key={w} bg="#fad373" py={2} px={1} borderBottom="1px solid" borderColor="gray.200">
                    <Text textAlign="center" fontSize="sm" fontWeight="bold" color="gray.800">
                      {w}
                    </Text>
                  </Box>
                ))}
              </Grid>

              <Grid
                templateColumns="repeat(7, 1fr)"
                templateRows={`repeat(${range.weeks}, 1fr)`}
                gap={0}
                flex={1}
                minH={0}
                w="100%"
                borderTop="1px solid"
                borderLeft="1px solid"
                borderColor="gray.200"
              >
                {range.days.map((d, idx) => {
                  const inMonth = d.getMonth() === current.getMonth();
                  const evs = dayEvents(d);
                  const isSelected = d.toDateString() === selectedDate.toDateString();
                  const isToday = new Date().toDateString() === d.toDateString();
                  const colorName = getDateColorName(d);
                  const hasEvents = evs.length > 0;
                  return (
                    <GridItem
                      key={idx}
                      cursor="pointer"
                      onClick={() => handleDayClick(d)}
                      borderRight="1px solid"
                      borderBottom="1px solid"
                      borderColor="gray.200"
                    >
                      <Box
                        position="relative"
                        p={1}
                        h="100%"
                        w="100%"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        bg={hasEvents ? `${colorName}.50` : 'white'}
                        opacity={inMonth ? 1 : 0.5}
                        _hover={{ bg: hasEvents ? `${colorName}.100` : 'gray.50' }}
                        borderRadius="sm"
                        boxSizing="border-box"
                        border={isSelected ? '2px solid' : 'none'}
                        borderColor={isSelected ? '#20343c' : 'transparent'}
                        boxShadow={isSelected ? '0 6px 18px rgba(32,52,60,0.08)' : 'none'}
                      >
                        <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} textAlign="center" color={isToday ? '#20343c' : 'gray.800'}>
                          {d.getDate()}
                        </Text>
                        {isToday && (
                          <Box position="absolute" top={1} right={1} w="2" h="2" borderRadius="full" bg="#d4a960" />
                        )}
                        {hasEvents && (
                          <HStack spacing={1} mt={1} wrap="wrap" justify="center">
                            {evs.slice(0, 3).map((e, i) => (
                              <Box
                                key={e.id || i}
                                w="6px"
                                h="6px"
                                borderRadius="full"
                                bg={e.type === 'Placement' ? '#20343c' : '#d4a960'}
                                title={e.title}
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
            </Box>
          </Box>
 
          <Box w={{ base: '100%', lg: '380px' }} flexShrink={0} bg="white" borderRadius="xl" p={5} boxShadow="lg" overflowY="auto" minH={0} alignSelf="flex-start" position={{ base: 'relative', lg: 'sticky' }} top={{ lg: '20px' }} maxH={{ lg: 'calc(100vh - 140px)' }}>
            <Heading as="h2" fontSize="md" fontWeight="bold" color="#20343c" mb={3}>
              {formatDMY(selectedDate)}
            </Heading>
            <Divider mb={3} />
            <VStack align="stretch" spacing={3}>
              {dayEvents(selectedDate).length === 0 ? (
                <Text color="gray.700" fontSize="sm">
                  No events for this date.
                </Text>
              ) : (
                dayEvents(selectedDate).map((e) => (
                  <Box
                    key={e.id}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    borderLeft="4px solid"
                    borderLeftColor={e.type === 'Placement' ? '#20343c' : '#d4a960'}
                    cursor="pointer"
                    onClick={() => handleEventClick(e)}
                    _hover={{ bg: 'gray.50' }}
                  >
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      {e.title}
                    </Text>
                    <Text fontSize="xs" color="gray.700">
                      {e.start_time ? `${e.start_time} – ` : ''}
                      {e.type}
                    </Text>
                    {e.description && (
                      <Text fontSize="xs" mt={1} noOfLines={2}>
                        {e.description}
                      </Text>
                    )}
                  </Box>
                ))
              )}
            </VStack>
          </Box>
        </HStack>
      )}
    </Box>
  );
};
