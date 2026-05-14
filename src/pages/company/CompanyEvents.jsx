import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  useToast,
  Flex,
  Icon,
  Badge,
  Spinner,
  Card,
  CardBody,
  SimpleGrid,
  Image,
  Link,
} from '@chakra-ui/react';
import { 
  CalendarIcon,
  TimeIcon,
  AttachmentIcon,
  ExternalLinkIcon,
} from '@chakra-ui/icons';
import { 
  FaCalendarAlt, 
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
} from 'react-icons/fa';
import CompanyLayout from '../../components/CompanyLayout';
import { CompanyService } from '../../services/company.service';

const colors = {
  accent: '#d4a960',
  accentHover: '#c4983f',
  accentLight: '#f8f3e8',
  dark: '#172e36',
  darkBlue: '#1e3a47',
  secondary: '#64748b',
  cardBg: '#ffffff',
  pageBg: '#f1f5f9',
  border: '#e2e8f0',
};

const getStatusConfig = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return { color: 'green', icon: FaCheckCircle, label: 'Completed' };
    case 'ongoing':
    case 'in_progress':
      return { color: 'blue', icon: FaHourglassHalf, label: 'Ongoing' };
    case 'scheduled':
    case 'upcoming':
      return { color: 'orange', icon: FaClock, label: 'Scheduled' };
    case 'cancelled':
      return { color: 'red', icon: FaTimesCircle, label: 'Cancelled' };
    default:
      return { color: 'gray', icon: FaClock, label: status || 'Unknown' };
  }
};

const CompanyEvents = () => {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await CompanyService.getEvents();
      setEvents(data || []);
    } catch (err) {
      toast({
        title: 'Failed to load events',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Categorize events
  const upcomingEvents = events.filter(e => 
    new Date(e.event_datetime) > new Date() && 
    e.status?.toLowerCase() !== 'cancelled'
  );
  const pastEvents = events.filter(e => 
    new Date(e.event_datetime) <= new Date() || 
    e.status?.toLowerCase() === 'completed'
  );

  if (loading) {
    return (
      <CompanyLayout>
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color={colors.accent} thickness="4px" />
        </Flex>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <Box bg={colors.pageBg} minH="100vh" py={8}>
        <Container maxW="1200px">
          {/* Header */}
          <Box mb={8}>
            <Heading size="xl" color={colors.dark} mb={1}>
              Events
            </Heading>
            <Text color={colors.secondary} fontSize="md">
              Events shared with your company. When the placement team sends a notification about an event to companies, it appears here.
            </Text>
          </Box>

          {events.length === 0 ? (
            <Card bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
              <CardBody py={16}>
                <VStack spacing={4}>
                  <Flex
                    w="100px"
                    h="100px"
                    borderRadius="full"
                    bg={colors.accentLight}
                    align="center"
                    justify="center"
                  >
                    <Icon as={FaCalendarAlt} boxSize={12} color={colors.accent} opacity={0.6} />
                  </Flex>
                  <Heading size="md" color={colors.dark}>No events yet</Heading>
                  <Text color={colors.secondary} textAlign="center" maxW="400px">
                    When the placement team sends notifications about events to companies, they will appear here.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <VStack spacing={8} align="stretch">
              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <Box>
                  <HStack spacing={3} mb={4}>
                    <Badge bg={colors.accent} color="white" fontSize="sm" px={3} py={1} borderRadius="full">
                      Upcoming
                    </Badge>
                    <Text color={colors.secondary} fontSize="sm">
                      {upcomingEvents.length} event(s)
                    </Text>
                  </HStack>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {upcomingEvents.map((event) => {
                      const statusConfig = getStatusConfig(event.status);
                      return (
                        <Card 
                          key={event.id} 
                          bg="white" 
                          borderRadius="xl" 
                          boxShadow="sm" 
                          border="1px solid" 
                          borderColor={colors.border}
                          _hover={{ boxShadow: 'md', borderColor: colors.accent }}
                          transition="all 0.2s"
                        >
                          <CardBody p={5}>
                            <Flex justify="space-between" align="start" mb={3}>
                              <Badge colorScheme={statusConfig.color} fontSize="xs" borderRadius="full">
                                <HStack spacing={1}>
                                  <Icon as={statusConfig.icon} boxSize={3} />
                                  <Text>{statusConfig.label}</Text>
                                </HStack>
                              </Badge>
                              <Badge colorScheme="purple" fontSize="xs" borderRadius="full">
                                {event.type}
                              </Badge>
                            </Flex>

                            <Heading size="md" color={colors.dark} mb={3}>
                              {event.title}
                            </Heading>

                            {event.details && (
                              <Text fontSize="sm" color={colors.secondary} mb={4} noOfLines={2}>
                                {event.details}
                              </Text>
                            )}

                            <VStack spacing={2} align="stretch">
                              <HStack spacing={3}>
                                <Icon as={CalendarIcon} color={colors.accent} boxSize={4} />
                                <Text fontSize="sm" color={colors.dark} fontWeight="500">
                                  {formatDate(event.event_datetime)}
                                </Text>
                              </HStack>
                              {event.event_datetime && (
                                <HStack spacing={3}>
                                  <Icon as={TimeIcon} color={colors.accent} boxSize={4} />
                                  <Text fontSize="sm" color={colors.dark}>
                                    {formatTime(event.event_datetime)}
                                  </Text>
                                </HStack>
                              )}
                            </VStack>

                            {/* Attachments */}
                            {event.attachments && event.attachments.length > 0 && (
                              <HStack mt={4} spacing={2}>
                                <AttachmentIcon color={colors.secondary} />
                                <Text fontSize="xs" color={colors.secondary}>
                                  {event.attachments.length} attachment(s)
                                </Text>
                              </HStack>
                            )}
                          </CardBody>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <Box>
                  <HStack spacing={3} mb={4}>
                    <Badge bg="gray.500" color="white" fontSize="sm" px={3} py={1} borderRadius="full">
                      Past Events
                    </Badge>
                    <Text color={colors.secondary} fontSize="sm">
                      {pastEvents.length} event(s)
                    </Text>
                  </HStack>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {pastEvents.slice(0, 6).map((event) => {
                      const statusConfig = getStatusConfig(event.status);
                      return (
                        <Card 
                          key={event.id} 
                          bg="white" 
                          borderRadius="xl" 
                          boxShadow="sm" 
                          border="1px solid" 
                          borderColor={colors.border}
                          opacity={0.8}
                        >
                          <CardBody p={4}>
                            <HStack justify="space-between" mb={2}>
                              <Badge colorScheme="gray" fontSize="xs" borderRadius="full">
                                {event.type}
                              </Badge>
                              <Text fontSize="xs" color={colors.secondary}>
                                {formatDate(event.event_datetime)}
                              </Text>
                            </HStack>
                            <Text fontWeight="600" color={colors.dark} fontSize="sm" noOfLines={2}>
                              {event.title}
                            </Text>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              )}
            </VStack>
          )}
        </Container>
      </Box>
    </CompanyLayout>
  );
};

export default CompanyEvents;
