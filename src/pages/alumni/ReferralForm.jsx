import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Button,
  useToast,
  Container,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  Icon,
  Spinner,
  Link,
} from '@chakra-ui/react';
import { 
  EmailIcon, 
  PhoneIcon, 
  AddIcon,
} from '@chakra-ui/icons';
import { 
  FaBuilding, 
  FaBriefcase, 
  FaPaperPlane,
  FaUserTie,
  FaCalendarAlt,
  FaCheckCircle,
  FaListAlt,
  FaPlusCircle,
} from 'react-icons/fa';
import AlumniLayout from '../../components/AlumniLayout';
import { PlacementService } from '../../services/placement.service';
import './ReferralForm.css';

const colors = {
  accent: '#6366f1',
  accentHover: '#4f46e5',
  accentLight: '#eef2ff',
  dark: '#1e293b',
  darkBlue: '#0f172a',
  secondary: '#64748b',
  cardBg: '#ffffff',
  pageBg: '#fcfcfd',
  border: '#e2e8f0',
  slate: '#1e293b',
  slate500: '#64748b',
  slate400: '#94a3b8',
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)',
];

const OPPORTUNITY_TYPES = [
  'Full-Time',
  'Internship',
  'Part-Time',
  'Contract',
  'Freelance',
  'Other',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODE_REGEX = /^\+\d{1,3}$/;
const PHONE_NUMBER_LENGTH = 10;

const ReferralForm = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRecommendations, setMyRecommendations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [formData, setFormData] = useState({
    company_name: '',
    hr_name: '',
    hr_email: '',
    hr_phone_country_code: '',
    hr_phone_number: '',
    hiring_role: '',
    opportunity_type: '',
    recommendation_note: '',
    consent_given: false,
  });
  const [fieldErrors, setFieldErrors] = useState({ hr_email: '', hr_phone_country_code: '', hr_phone_number: '' });

  useEffect(() => {
    loadMyRecommendations();
  }, []);

  const loadMyRecommendations = async () => {
    setLoadingHistory(true);
    try {
      const data = await PlacementService.getMyHrRecommendations();
      setMyRecommendations(data);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'hr_phone_country_code') {
      if (value === '+') {
        finalValue = '+';
      } else if (value.startsWith('+')) {
        const digits = value.slice(1).replace(/\D/g, '').slice(0, 3);
        finalValue = '+' + digits;
      } else {
        const digits = value.replace(/\D/g, '').slice(0, 3);
        finalValue = digits ? '+' + digits : '';
      }
    }
    if (name === 'hr_phone_number') {
      finalValue = value.replace(/\D/g, '').slice(0, PHONE_NUMBER_LENGTH);
    }
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : finalValue 
    }));
    if (name === 'hr_email' || name === 'hr_phone_country_code' || name === 'hr_phone_number') {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    if (name === 'hr_email' && formData.hr_email && !EMAIL_REGEX.test(formData.hr_email.trim())) {
      setFieldErrors((prev) => ({ ...prev, hr_email: 'Please enter a valid email address (e.g. name@company.com)' }));
    }
    if (name === 'hr_phone_country_code' && formData.hr_phone_number && formData.hr_phone_country_code) {
      if (!COUNTRY_CODE_REGEX.test(formData.hr_phone_country_code)) {
        setFieldErrors((prev) => ({ ...prev, hr_phone_country_code: 'Enter + followed by 1–3 digits (e.g. +91)' }));
      }
    }
    if (name === 'hr_phone_number' && formData.hr_phone_number) {
      if (formData.hr_phone_number.length !== PHONE_NUMBER_LENGTH) {
        setFieldErrors((prev) => ({ ...prev, hr_phone_number: `Phone number must be exactly ${PHONE_NUMBER_LENGTH} digits` }));
      }
    }
  };

  const validateEmail = (email) => !email || EMAIL_REGEX.test(email.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (formData.hr_email && !validateEmail(formData.hr_email)) {
      errors.hr_email = 'Please enter a valid email address (e.g. name@company.com)';
    }
    const hasPhoneNumber = formData.hr_phone_number && formData.hr_phone_number.length > 0;
    if (hasPhoneNumber) {
      if (formData.hr_phone_country_code && !COUNTRY_CODE_REGEX.test(formData.hr_phone_country_code)) {
        errors.hr_phone_country_code = 'Enter + followed by 1–3 digits (e.g. +91)';
      }
      if (formData.hr_phone_number.length !== PHONE_NUMBER_LENGTH) {
        errors.hr_phone_number = `Phone number must be exactly ${PHONE_NUMBER_LENGTH} digits`;
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      toast({ 
        title: 'Invalid input', 
        description: 'Please correct the email and/or phone number.', 
        status: 'warning', 
        duration: 3000, 
        isClosable: true 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData, consent_given: true };
      if (formData.hr_phone_number) {
        const countryCode = formData.hr_phone_country_code || '+91';
        payload.hr_phone = `${countryCode} ${formData.hr_phone_number}`;
      }
      delete payload.hr_phone_country_code;
      delete payload.hr_phone_number;
      await PlacementService.submitHrRecommendation(payload);
      toast({ 
        title: 'Recommendation Submitted!', 
        description: 'Thank you! The placement team will follow up.', 
        status: 'success', 
        duration: 5000, 
        isClosable: true 
      });
      
      setFormData({ 
        company_name: '', 
        hr_name: '', 
        hr_email: '', 
        hr_phone_country_code: '', 
        hr_phone_number: '', 
        hiring_role: '', 
        opportunity_type: '', 
        recommendation_note: '',
        consent_given: false,
      });
      setFieldErrors({ hr_email: '', hr_phone_country_code: '', hr_phone_number: '' });
      
      loadMyRecommendations();
      setActiveTab('list');
    } catch (error) {
      toast({ 
        title: 'Submission Failed', 
        description: error?.message || 'Please try again.', 
        status: 'error', 
        duration: 3000, 
        isClosable: true 
      });
    } finally {
      setIsSubmitting(false);
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

  const getOpportunityColor = (type) => {
    switch (type) {
      case 'Full-Time': return 'green';
      case 'Internship': return 'blue';
      case 'Part-Time': return 'purple';
      case 'Contract': return 'orange';
      default: return 'gray';
    }
  };

  const getOpportunityBadgeClass = (type) => {
    if (type === 'Full-Time') return 'badge-fulltime';
    if (type === 'Internship') return 'badge-internship';
    return 'badge-other';
  };

  const getAvatarGradient = (index) => AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const getInitial = (str) => (str && str.trim() ? str.trim().charAt(0).toUpperCase() : '?');

  return (
    <AlumniLayout>
      <Box className="referral-page" bg={colors.pageBg} minH="100vh" py={{ base: 4, md: 8 }}>
        <Container maxW="4xl">
          {/* Header - match admin/student: size lg, subtitle sm */}
          <Flex
            as="header"
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'flex-end' }}
            mb={6}
            gap={4}
          >
            <Box>
              <Heading as="h1" size="lg" color="gray.800" mb={1}>
                HR Recommendations
              </Heading>
              <Text color="gray.500" fontSize="sm">
                Strengthen the placement ecosystem by introducing HR experts from your professional circle.
              </Text>
            </Box>
            <Box className="badge-total" alignSelf={{ base: 'flex-start', md: 'center' }}>
              <span>{myRecommendations.length}</span> Total Leads
            </Box>
          </Flex>

          {/* Tabs - match admin: size sm, font sm */}
          <Flex className="nav-tabs-wrap" mb={6} gap={2}>
            <Button
              flex={1}
              size="sm"
              py={2}
              px={3}
              borderRadius="xl"
              fontWeight="600"
              fontSize="sm"
              transition="all 0.3s"
              leftIcon={<Icon as={FaListAlt} boxSize={4} />}
              className={activeTab === 'list' ? 'tab-active' : 'tab-inactive'}
              bg={activeTab === 'list' ? colors.dark : 'transparent'}
              color={activeTab === 'list' ? 'white' : undefined}
              _hover={activeTab === 'list' ? {} : { bg: '#f1f5f9', color: colors.dark }}
              onClick={() => setActiveTab('list')}
            >
              My Submissions
            </Button>
            <Button
              flex={1}
              size="sm"
              py={2}
              px={3}
              borderRadius="xl"
              fontWeight="600"
              fontSize="sm"
              transition="all 0.3s"
              leftIcon={<Icon as={FaPlusCircle} boxSize={4} />}
              className={activeTab === 'new' ? 'tab-active' : 'tab-inactive'}
              bg={activeTab === 'new' ? colors.dark : 'transparent'}
              color={activeTab === 'new' ? 'white' : undefined}
              _hover={activeTab === 'new' ? {} : { bg: '#f1f5f9', color: colors.dark }}
              onClick={() => setActiveTab('new')}
            >
              Refer HR
            </Button>
          </Flex>

          {/* Content */}
          <Box as="main">
            {activeTab === 'list' ? (
              /* My Submissions list */
              loadingHistory ? (
                <Flex justify="center" align="center" py={20}>
                  <VStack spacing={4}>
                    <Spinner size="xl" color={colors.accent} thickness="4px" />
                    <Text color="gray.500" fontSize="sm">Loading recommendations...</Text>
                  </VStack>
                </Flex>
              ) : myRecommendations.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py={20} px={8}>
                  <Flex
                    w="16"
                    h="16"
                    borderRadius="full"
                    bg={colors.accentLight}
                    align="center"
                    justify="center"
                    mb={4}
                    border="2px dashed"
                    borderColor={colors.border}
                  >
                    <Icon as={FaUserTie} boxSize={8} color={colors.accent} opacity={0.6} />
                  </Flex>
                  <Heading size="md" color="gray.600" mb={2}>No recommendations yet</Heading>
                  <Text color="gray.500" textAlign="center" mb={6} maxW="400px" fontSize="sm" lineHeight="1.6">
                    Strengthen the placement ecosystem by referring HR contacts from your network.
                  </Text>
                  <Button
                    leftIcon={<AddIcon />}
                    bg={colors.dark}
                    color="white"
                    size="sm"
                    borderRadius="xl"
                    px={6}
                    fontWeight="600"
                    _hover={{ bg: colors.darkBlue }}
                    onClick={() => setActiveTab('new')}
                  >
                    Add Your First Recommendation
                  </Button>
                </Flex>
              ) : (
                <VStack spacing={4} align="stretch">
                  {myRecommendations.map((rec, index) => (
                    <Box
                      key={rec.id}
                      className="rec-card card-hover"
                      display="flex"
                      flexDirection={{ base: 'column', md: 'row' }}
                      gap={4}
                    >
                      <Box className="rec-card-avatar" bg={getAvatarGradient(index)} boxShadow="sm">
                        {getInitial(rec.company_name)}
                      </Box>
                      <Box flex="1" minW={0}>
                        <Flex flexWrap="wrap" align="flex-start" justify="space-between" mb={3} gap={3}>
                          <Box>
                            <Heading as="h3" size="md" color="gray.800" mb={1}>
                              {rec.company_name}
                            </Heading>
                            <Flex flexWrap="wrap" align="center" gap={{ base: 2, md: 4 }} color="gray.500" fontSize="sm">
                              <HStack spacing={2}>
                                <Icon as={FaUserTie} color="gray.400" boxSize={4} />
                                <span>{rec.hr_name}</span>
                              </HStack>
                              {rec.hiring_role && (
                                <HStack spacing={2}>
                                  <Icon as={FaBriefcase} color="gray.400" boxSize={4} />
                                  <span>{rec.hiring_role}</span>
                                </HStack>
                              )}
                            </Flex>
                          </Box>
                          {rec.opportunity_type && (
                            <Box className={getOpportunityBadgeClass(rec.opportunity_type)}>
                              {rec.opportunity_type}
                            </Box>
                          )}
                        </Flex>

                        <Flex flexWrap="wrap" gap={3} mb={3}>
                          {rec.hr_email && (
                            <Link href={`mailto:${rec.hr_email}`} _hover={{ textDecoration: 'none' }}>
                              <Box as="span" className="contact-chip">
                                <EmailIcon color="#6366f1" boxSize={4} />
                                {rec.hr_email}
                              </Box>
                            </Link>
                          )}
                          {rec.hr_phone && (
                            <Box as="span" className="contact-chip">
                              <PhoneIcon color="#6366f1" boxSize={4} />
                              {rec.hr_phone}
                            </Box>
                          )}
                        </Flex>

                        {rec.recommendation_note && (
                          <Box
                            p={3}
                            bg="gray.50"
                            borderRadius="lg"
                            borderLeft="4px solid"
                            borderColor={colors.accent}
                            mb={3}
                          >
                            <Text fontSize="sm" color="gray.600" lineHeight="1.5" fontStyle="italic">
                              "{rec.recommendation_note}"
                            </Text>
                          </Box>
                        )}

                        <Flex align="center" pt={4} borderTop="1px solid" borderColor="gray.100">
                          <HStack spacing={2} color="gray.400" fontSize="xs" fontWeight="600">
                            <Icon as={FaCalendarAlt} boxSize={4} />
                            <span>Submitted {formatDate(rec.created_at)}</span>
                          </HStack>
                        </Flex>
                      </Box>
                    </Box>
                  ))}

                  <Box pt={4}>
                    <Button
                      leftIcon={<AddIcon />}
                      bg={colors.dark}
                      color="white"
                      size="sm"
                      borderRadius="xl"
                      w="full"
                      fontWeight="600"
                      _hover={{ bg: colors.darkBlue }}
                      onClick={() => setActiveTab('new')}
                    >
                      Add Another Recommendation
                    </Button>
                  </Box>
                </VStack>
              )
            ) : (
              /* New Recommendation Form - match reference */
              <Box className="form-card">
                <form onSubmit={handleSubmit}>
                  <VStack spacing={6} align="stretch">
                    {/* Section 01: Organization Profile - match admin section headings size md */}
                    <Box>
                      <HStack spacing={3} mb={4}>
                        <Box className="section-number">01</Box>
                        <Heading as="h2" size="md" color="gray.700">
                          Organization Profile
                        </Heading>
                      </HStack>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel fontWeight="600" color="gray.600" fontSize="sm">Company Name</FormLabel>
                          <Input
                            className="form-input-wrap input-focus"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            placeholder="Where is the opportunity?"
                            size="sm"
                            border="1px solid"
                            borderColor="gray.200"
                            bg="white"
                            _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontWeight="600" color="gray.600" fontSize="sm">Opportunity Type</FormLabel>
                          <Select
                            className="form-input-wrap input-focus"
                            name="opportunity_type"
                            value={formData.opportunity_type}
                            onChange={handleChange}
                            placeholder="Select type"
                            size="sm"
                            border="1px solid"
                            borderColor="gray.200"
                            bg="white"
                            _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                          >
                            {OPPORTUNITY_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </Select>
                        </FormControl>
                      </SimpleGrid>

                      <FormControl mt={4}>
                        <FormLabel fontWeight="600" color="gray.600" fontSize="sm">Position / Designation</FormLabel>
                        <Input
                          className="form-input-wrap input-focus"
                          name="hiring_role"
                          value={formData.hiring_role}
                          onChange={handleChange}
                          placeholder="e.g. Senior Technical Recruiter"
                          size="sm"
                          border="1px solid"
                          borderColor="gray.200"
                          bg="white"
                          _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                        />
                      </FormControl>
                    </Box>

                    {/* Section 02: HR Professional Details */}
                    <Box>
                      <HStack spacing={3} mb={4}>
                        <Box className="section-number">02</Box>
                        <Heading as="h2" size="md" color="gray.700">
                          HR Professional Details
                        </Heading>
                      </HStack>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel fontWeight="600" color="gray.600" fontSize="sm">Full Name</FormLabel>
                          <Input
                            className="form-input-wrap input-focus"
                            name="hr_name"
                            value={formData.hr_name}
                            onChange={handleChange}
                            placeholder="Who should we contact?"
                            size="sm"
                            border="1px solid"
                            borderColor="gray.200"
                            bg="white"
                            _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontWeight="600" color="gray.600" fontSize="sm">Mobile Number</FormLabel>
                          <HStack spacing={2} align="stretch" flexWrap="nowrap">
                            <FormControl isInvalid={!!fieldErrors.hr_phone_country_code} w="80px" flexShrink={0}>
                              <Input
                                className="form-input-wrap input-focus"
                                name="hr_phone_country_code"
                                value={formData.hr_phone_country_code}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="+91"
                                maxLength={4}
                                size="sm"
                                border="1px solid"
                                borderColor="gray.200"
                                bg="white"
                                _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                                _invalid={{ borderColor: 'red.400' }}
                              />
                              <FormErrorMessage fontSize="xs">{fieldErrors.hr_phone_country_code}</FormErrorMessage>
                            </FormControl>
                            <FormControl isInvalid={!!fieldErrors.hr_phone_number} flex={1} minW={0}>
                              <InputGroup size="sm">
                                <InputLeftElement pointerEvents="none" pl={3}>
                                  <PhoneIcon color="gray.400" boxSize={4} />
                                </InputLeftElement>
                                <Input
                                  className="form-input-wrap input-focus"
                                  name="hr_phone_number"
                                  type="tel"
                                  inputMode="numeric"
                                  value={formData.hr_phone_number}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  placeholder="XXXXXXXXXX"
                                  maxLength={PHONE_NUMBER_LENGTH}
                                  pl="40px"
                                  border="1px solid"
                                  borderColor="gray.200"
                                  bg="white"
                                  _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                                  _invalid={{ borderColor: 'red.400' }}
                                />
                              </InputGroup>
                              <FormErrorMessage fontSize="xs">{fieldErrors.hr_phone_number}</FormErrorMessage>
                            </FormControl>
                          </HStack>
                        </FormControl>

                        <FormControl isInvalid={!!fieldErrors.hr_email} gridColumn={{ md: '1 / -1' }}>
                          <FormLabel fontWeight="600" color="gray.600" fontSize="sm">Work Email</FormLabel>
                          <Input
                            className="form-input-wrap input-focus"
                            name="hr_email"
                            type="email"
                            value={formData.hr_email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="professional@company.com"
                            maxLength={254}
                            size="sm"
                            border="1px solid"
                            borderColor="gray.200"
                            bg="white"
                            _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                            _invalid={{ borderColor: 'red.400' }}
                          />
                          <FormErrorMessage fontSize="xs">{fieldErrors.hr_email}</FormErrorMessage>
                        </FormControl>
                      </SimpleGrid>
                    </Box>

                    {/* Section 03: Context & Notes */}
                    <Box>
                      <HStack spacing={3} mb={4}>
                        <Box className="section-number">03</Box>
                        <Heading as="h2" size="md" color="gray.700">
                          Context & Notes
                        </Heading>
                      </HStack>
                      <FormControl>
                        <Textarea
                          className="form-input-wrap input-focus"
                          name="recommendation_note"
                          value={formData.recommendation_note}
                          onChange={handleChange}
                          placeholder="Briefly explain your professional relationship or any specific tips for the placement team..."
                          rows={4}
                          size="sm"
                          border="1px solid"
                          borderColor="gray.200"
                          bg="white"
                          resize="none"
                          _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                        />
                      </FormControl>
                    </Box>

                    {/* Submit & Back - match admin button size sm */}
                    <Flex flexDirection={{ base: 'column', sm: 'row' }} align="center" gap={4} pt={6} borderTop="1px solid" borderColor="gray.100">
                      <Button
                        type="submit"
                        className="btn-submit-ref"
                        size="sm"
                        bg={colors.dark}
                        color="white"
                        fontWeight="600"
                        borderRadius="xl"
                        px={6}
                        isLoading={isSubmitting}
                        loadingText="Submitting..."
                        leftIcon={<Icon as={FaPaperPlane} boxSize={4} />}
                        _hover={{ bg: colors.darkBlue }}
                        transition="all 0.2s"
                      >
                        Submit Referral
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="btn-back"
                        size="sm"
                        fontSize="sm"
                        onClick={() => setActiveTab('list')}
                      >
                        Back to Dashboard
                      </Button>
                    </Flex>
                  </VStack>
                </form>
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </AlumniLayout>
  );
};

export default ReferralForm;
