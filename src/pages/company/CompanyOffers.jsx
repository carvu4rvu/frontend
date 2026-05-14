import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Avatar,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import { 
  SearchIcon,
  ViewIcon,
  CheckCircleIcon,
  TimeIcon,
  CloseIcon,
} from '@chakra-ui/icons';
import { 
  FaHandshake, 
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

const CompanyOffers = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await CompanyService.getOffers();
      setOffers(data || []);
    } catch (err) {
      toast({
        title: 'Failed to load offers',
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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Unique dates from offers (created_at) for date filter dropdown
  const offerDates = React.useMemo(() => {
    const dates = new Set();
    (offers || []).forEach((offer) => {
      if (offer.created_at) {
        const d = new Date(offer.created_at);
        if (!isNaN(d.getTime())) dates.add(d.toISOString().slice(0, 10));
      }
    });
    return Array.from(dates).sort().reverse();
  }, [offers]);

  // Filter offers
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = !search || 
      offer.student_basic_details?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      offer.student_id?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'accepted' && offer.is_accepted === true) ||
      (statusFilter === 'pending' && offer.is_accepted === null) ||
      (statusFilter === 'declined' && offer.is_accepted === false);

    const matchesDate = !dateFilter || (offer.created_at && offer.created_at.slice(0, 10) === dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Stats
  const totalOffers = offers.length;
  const acceptedOffers = offers.filter(o => o.is_accepted === true).length;
  const pendingOffers = offers.filter(o => o.is_accepted === null).length;
  const declinedOffers = offers.filter(o => o.is_accepted === false).length;

  const getStatusBadge = (isAccepted) => {
    if (isAccepted === true) {
      return (
        <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
          <HStack spacing={1}>
            <Icon as={FaCheckCircle} boxSize={3} />
            <Text>Accepted</Text>
          </HStack>
        </Badge>
      );
    } else if (isAccepted === false) {
      return (
        <Badge colorScheme="red" fontSize="sm" px={3} py={1} borderRadius="full">
          <HStack spacing={1}>
            <Icon as={FaTimesCircle} boxSize={3} />
            <Text>Declined</Text>
          </HStack>
        </Badge>
      );
    }
    return (
      <Badge colorScheme="orange" fontSize="sm" px={3} py={1} borderRadius="full">
        <HStack spacing={1}>
          <Icon as={FaHourglassHalf} boxSize={3} />
          <Text>Pending</Text>
        </HStack>
      </Badge>
    );
  };

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
        <Container maxW="1400px">
          {/* Header */}
          <Box mb={8}>
            <Heading size="xl" color={colors.dark} mb={1}>
              Offers
            </Heading>
            <Text color={colors.secondary} fontSize="md">
              Track all offers made to students
            </Text>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
            <Card bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
              <CardBody p={5}>
                <HStack spacing={4}>
                  <Flex w="50px" h="50px" bg={colors.accentLight} borderRadius="xl" align="center" justify="center">
                    <Icon as={FaHandshake} color={colors.accent} boxSize={6} />
                  </Flex>
                  <Box>
                    <Text fontSize="2xl" fontWeight="700" color={colors.dark}>{totalOffers}</Text>
                    <Text fontSize="sm" color={colors.secondary}>Total Offers</Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
            <Card bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
              <CardBody p={5}>
                <HStack spacing={4}>
                  <Flex w="50px" h="50px" bg="green.50" borderRadius="xl" align="center" justify="center">
                    <CheckCircleIcon color="green.500" boxSize={6} />
                  </Flex>
                  <Box>
                    <Text fontSize="2xl" fontWeight="700" color="green.600">{acceptedOffers}</Text>
                    <Text fontSize="sm" color={colors.secondary}>Accepted</Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
            <Card bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
              <CardBody p={5}>
                <HStack spacing={4}>
                  <Flex w="50px" h="50px" bg="orange.50" borderRadius="xl" align="center" justify="center">
                    <TimeIcon color="orange.500" boxSize={6} />
                  </Flex>
                  <Box>
                    <Text fontSize="2xl" fontWeight="700" color="orange.600">{pendingOffers}</Text>
                    <Text fontSize="sm" color={colors.secondary}>Pending</Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
            <Card bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
              <CardBody p={5}>
                <HStack spacing={4}>
                  <Flex w="50px" h="50px" bg="red.50" borderRadius="xl" align="center" justify="center">
                    <CloseIcon color="red.500" boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontSize="2xl" fontWeight="700" color="red.600">{declinedOffers}</Text>
                    <Text fontSize="sm" color={colors.secondary}>Declined</Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filters */}
          <Card bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor={colors.border} mb={6}>
            <CardBody p={4}>
              <Flex gap={4} wrap="wrap" align="center">
                <InputGroup maxW="300px">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by name or USN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    borderRadius="lg"
                  />
                </InputGroup>
                <Select
                  w="160px"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  borderRadius="lg"
                >
                  <option value="all">All Status</option>
                  <option value="accepted">Accepted</option>
                  <option value="pending">Pending</option>
                  <option value="declined">Declined</option>
                </Select>
                <Select
                  w="180px"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  borderRadius="lg"
                  title="Filter by offer date"
                >
                  <option value="">All dates</option>
                  {offerDates.map((dateStr) => (
                    <option key={dateStr} value={dateStr}>
                      {formatDate(dateStr)}
                    </option>
                  ))}
                </Select>
                <Text fontSize="sm" color={colors.secondary} ml="auto">
                  {filteredOffers.length} of {totalOffers} offers
                </Text>
              </Flex>
            </CardBody>
          </Card>

          {/* Offers Table */}
          <Card bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
            <CardBody p={0}>
              {filteredOffers.length === 0 ? (
                <Flex direction="column" align="center" py={16}>
                  <Icon as={FaHandshake} boxSize={12} color="gray.300" mb={4} />
                  <Text color={colors.secondary} fontSize="md" fontWeight="500">
                    {offers.length === 0 ? 'No offers made yet' : 'No offers match your filters'}
                  </Text>
                </Flex>
              ) : (
                <TableContainer>
                  <Table size="md">
                    <Thead>
                      <Tr bg={colors.dark}>
                        <Th color={colors.accent} fontSize="xs">Student</Th>
                        <Th color={colors.accent} fontSize="xs">Job Type</Th>
                        <Th color={colors.accent} fontSize="xs">Academic Year</Th>
                        <Th color={colors.accent} fontSize="xs">Status</Th>
                        <Th color={colors.accent} fontSize="xs">Offer Date</Th>
                        <Th color={colors.accent} fontSize="xs">Remarks</Th>
                        <Th color={colors.accent} fontSize="xs">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredOffers.map((offer) => (
                        <Tr 
                          key={offer.id} 
                          _hover={{ bg: colors.pageBg }}
                          borderBottom="1px solid"
                          borderColor={colors.border}
                        >
                          <Td>
                            <HStack spacing={3}>
                              <Avatar 
                                size="sm" 
                                name={offer.student_basic_details?.full_name || offer.student_id}
                              />
                              <Box>
                                <Text fontWeight="600" fontSize="sm" color={colors.dark}>
                                  {offer.student_basic_details?.full_name || '—'}
                                </Text>
                                <Text fontSize="xs" color={colors.secondary}>{offer.student_id}</Text>
                              </Box>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge 
                              bg={colors.accentLight} 
                              color={colors.accent} 
                              borderRadius="full"
                              px={2}
                            >
                              {offer.job_type || '—'}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={colors.dark}>{offer.academic_year || '—'}</Text>
                          </Td>
                          <Td>
                            {getStatusBadge(offer.is_accepted)}
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={colors.secondary}>
                              {formatDate(offer.created_at)}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={colors.secondary} maxW="200px" isTruncated>
                              {offer.remarks || '—'}
                            </Text>
                          </Td>
                          <Td>
                            <Tooltip label="View Student Profile">
                              <IconButton
                                aria-label="View profile"
                                icon={<ViewIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => navigate(`/company/student/${offer.student_id}`)}
                              />
                            </Tooltip>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </CardBody>
          </Card>
        </Container>
      </Box>
    </CompanyLayout>
  );
};

export default CompanyOffers;
