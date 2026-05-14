import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Card,
  CardBody,
  Flex,
  useToast,
  Container,
  Badge,
  Icon,
  Spinner,
  Link,
  VStack,
} from '@chakra-ui/react';
import { SearchIcon, EmailIcon, PhoneIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { 
  FaUserTie, 
  FaBriefcase, 
  FaCalendarAlt,
  FaBuilding,
  FaCheckCircle
} from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';

const colors = {
  accent: '#d4a960',
  dark: '#172e36',
  secondary: '#64748b',
  border: '#e2e8f0',
};

const AdminHrRecommendations = () => {
  const toast = useToast();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getAllHrRecommendations();
      setRecommendations(data);
    } catch (error) {
      toast({
        title: 'Error fetching recommendations',
        description: error.message || 'Failed to load data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getOpportunityColor = (type) => {
    switch (type) {
      case 'Full-Time': return 'green';
      case 'Internship': return 'blue';
      case 'Part-Time': return 'purple';
      case 'Contract': return 'orange';
      default: return 'gray';
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

  const filteredRecs = recommendations.filter(rec => {
    const q = searchQuery.toLowerCase();
    return (
      rec.company_name?.toLowerCase().includes(q) ||
      rec.hr_name?.toLowerCase().includes(q) ||
      rec.alumni?.full_name?.toLowerCase().includes(q) ||
      rec.alumni?.current_company?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <Box bg="#f0f0f0" minH="100vh" pb={10}>
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} pt={8}>
          <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
              <Heading size="lg" color="gray.800">HR Recommendations</Heading>
              <Text color="gray.500" fontSize="sm">Manage referrals from alumni network</Text>
            </Box>
            <Badge 
              bg={colors.dark} 
              color="white" 
              fontSize="md" 
              px={4} 
              py={2} 
              borderRadius="full"
            >
              {recommendations.length} Total
            </Badge>
          </Flex>

          {/* Search */}
          <Box bg="white" p={4} borderRadius="xl" shadow="sm" mb={6}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by company, HR name, or referring alumni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                border="1px solid"
                borderColor="gray.200"
                _focus={{ borderColor: colors.accent, boxShadow: 'none' }}
              />
            </InputGroup>
          </Box>

          {loading ? (
            <Flex justify="center" py={20}>
              <VStack>
                <Spinner size="xl" color={colors.accent} thickness="4px" />
                <Text color="gray.500" mt={4}>Loading recommendations...</Text>
              </VStack>
            </Flex>
          ) : filteredRecs.length === 0 ? (
            <Box textAlign="center" py={20} bg="white" borderRadius="xl" shadow="sm">
              <Icon as={FaBriefcase} boxSize={12} color="gray.300" mb={4} />
              <Heading size="md" color="gray.600" mb={2}>No recommendations found</Heading>
              <Text color="gray.500">Try adjusting your search or wait for alumni to submit referrals.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {filteredRecs.map((rec) => (
                <Card 
                  key={rec.id} 
                  bg="white" 
                  shadow="sm" 
                  borderRadius="xl" 
                  overflow="hidden"
                  border="1px solid"
                  borderColor="gray.100"
                  _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <CardBody p={6}>
                    {/* Header: Company & Date */}
                    <Flex justify="space-between" align="start" mb={4}>
                      <HStack spacing={3}>
                        <Flex 
                          w="48px" h="48px" 
                          bg="blue.50" 
                          borderRadius="lg" 
                          align="center" 
                          justify="center"
                        >
                          <Icon as={FaBuilding} color="blue.500" boxSize={6} />
                        </Flex>
                        <Box>
                          <Heading size="md" color="gray.800">{rec.company_name}</Heading>
                          <HStack spacing={2} mt={1}>
                            <Badge colorScheme={getOpportunityColor(rec.opportunity_type)}>
                              {rec.opportunity_type || 'General'}
                            </Badge>
                            {rec.hiring_role && (
                              <Text fontSize="sm" color="gray.500">• {rec.hiring_role}</Text>
                            )}
                          </HStack>
                        </Box>
                      </HStack>
                      <Text fontSize="xs" color="gray.400" fontWeight="600">
                        {formatDate(rec.created_at)}
                      </Text>
                    </Flex>

                    {/* HR Details */}
                    <Box bg="gray.50" p={4} borderRadius="lg" mb={4}>
                      <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" mb={3}>
                        HR Contact Details
                      </Text>
                      <HStack spacing={2} mb={2}>
                        <Icon as={FaUserTie} color="gray.400" />
                        <Text fontWeight="600" color="gray.700">{rec.hr_name}</Text>
                      </HStack>
                      <VStack align="start" spacing={1} pl={6}>
                        {rec.hr_email && (
                          <HStack>
                            <Icon as={EmailIcon} color="gray.400" boxSize={3} />
                            <Link href={`mailto:${rec.hr_email}`} fontSize="sm" color="blue.600">
                              {rec.hr_email}
                            </Link>
                          </HStack>
                        )}
                        {rec.hr_phone && (
                          <HStack>
                            <Icon as={PhoneIcon} color="gray.400" boxSize={3} />
                            <Text fontSize="sm" color="gray.600">{rec.hr_phone}</Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>

                    {/* Notes */}
                    {rec.recommendation_note && (
                      <Box mb={4}>
                        <Text fontSize="sm" color="gray.600" fontStyle="italic">
                          "{rec.recommendation_note}"
                        </Text>
                      </Box>
                    )}

                    {/* Footer: Alumni Source */}
                    <Flex 
                      pt={4} 
                      borderTop="1px solid" 
                      borderColor="gray.100" 
                      justify="space-between" 
                      align="center"
                    >
                      <Box>
                        <Text fontSize="xs" color="gray.400">Referred by</Text>
                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                          {rec.alumni?.full_name || 'Unknown Alumni'}
                        </Text>
                        {rec.alumni?.current_company && (
                          <Text fontSize="xs" color="gray.500">
                            @ {rec.alumni.current_company}
                          </Text>
                        )}
                      </Box>
                      {rec.consent_given && (
                        <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2}>
                          <HStack spacing={1}>
                            <Icon as={FaCheckCircle} boxSize={3} />
                            <Text fontSize="xs">Consent Verified</Text>
                          </HStack>
                        </Badge>
                      )}
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default AdminHrRecommendations;
