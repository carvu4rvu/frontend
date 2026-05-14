import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  HStack,
  Container,
  Spinner,
  useToast,
  Link,
  SimpleGrid,
  Card,
  CardBody,
  Divider,
  Icon,
  Avatar,
  Badge,
} from '@chakra-ui/react';
import { ChevronLeftIcon, EmailIcon, PhoneIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { FaLinkedin, FaGlobe } from 'react-icons/fa';
import AlumniLayout from '../../components/AlumniLayout';
import { PlacementService } from '../../services/placement.service';

const colors = {
  accent: '#d4a960',
  accentHover: '#b8923d',
  dark: '#1e293b',
  darkBlue: '#0f172a',
  secondary: '#64748b',
  cardBg: '#ffffff',
  pageBg: '#f8fafc',
  border: '#e2e8f0',
  lightAccent: '#fef9e7',
  muted: '#94a3b8',
};

const CARD_RADIUS = '24px';
const CARD_SHADOW = '0 4px 24px rgba(15, 23, 42, 0.08)';

const AlumniViewAlumni = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identifier) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await PlacementService.getAlumniByIdOrUsn(identifier);
        if (!cancelled) setAlumni(data);
      } catch (e) {
        if (!cancelled) {
          toast({
            title: 'Failed to load alumni',
            description: e?.message || 'Alumni not found.',
            status: 'error',
            isClosable: true,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [identifier, toast]);

  if (loading) {
    return (
      <AlumniLayout>
        <Flex justify="center" align="center" minH="calc(100vh - 72px)" bg={colors.pageBg}>
          <VStack spacing={4}>
            <Spinner size="xl" color={colors.accent} thickness="4px" />
            <Text color={colors.secondary} fontSize="sm" fontWeight="500">Loading profile...</Text>
          </VStack>
        </Flex>
      </AlumniLayout>
    );
  }

  if (!alumni) {
    return (
      <AlumniLayout>
        <Flex justify="center" align="center" minH="calc(100vh - 72px)" bg={colors.pageBg} direction="column" gap={6} px={4}>
          <Text color={colors.secondary} fontSize="lg" fontWeight="500">Alumni not found.</Text>
          <Button
            leftIcon={<ChevronLeftIcon />}
            onClick={() => navigate('/placement/alumni-directory')}
            bg={colors.accent}
            color="white"
            fontWeight="600"
            borderRadius="xl"
            px={6}
            _hover={{ bg: colors.accentHover }}
          >
            Back to Directory
          </Button>
        </Flex>
      </AlumniLayout>
    );
  }

  const usn = alumni.student_id || alumni.usn;

  return (
    <AlumniLayout>
      <Box bg={colors.pageBg} minH="100vh" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
        <Container maxW="960px" px={{ base: 0, md: 4 }}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronLeftIcon boxSize={5} />}
            onClick={() => navigate('/placement/alumni-directory')}
            mb={{ base: 4, md: 6 }}
            color={colors.secondary}
            fontWeight="600"
            fontSize="sm"
            _hover={{ color: colors.dark, bg: 'white', boxShadow: 'sm' }}
            borderRadius="lg"
            px={4}
          >
            Back to Alumni Directory
          </Button>

          <Box
            bg={colors.cardBg}
            borderRadius={CARD_RADIUS}
            boxShadow={CARD_SHADOW}
            overflow="hidden"
            mb={{ base: 8, md: 12 }}
          >
            <Box px={{ base: 5, md: 10 }} py={{ base: 8, md: 10 }}>
              <Flex gap={{ base: 5, md: 8 }} align="flex-start" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                <Avatar
                  size="2xl"
                  name={alumni.full_name}
                  bg={colors.accent}
                  color="white"
                  border="4px solid white"
                  boxShadow={CARD_SHADOW}
                  flexShrink={0}
                />
                <Box flex="1" minW={{ base: '100%', md: '280px' }} pt={{ base: 2, md: 4 }}>
                  <Heading size="xl" color={colors.dark} mb={3} fontWeight="800" letterSpacing="-0.02em" lineHeight="1.2">
                    {alumni.full_name || '—'}
                  </Heading>
                  {usn && (
                    <Text fontSize="sm" color={colors.muted} fontWeight="500" mb={4}>
                      {usn}
                    </Text>
                  )}
                  <Flex gap={2} mb={6} flexWrap="wrap">
                    {alumni.graduation_year && (
                      <Badge
                        bg={colors.lightAccent}
                        color={colors.accentHover}
                        fontSize="xs"
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        fontWeight="600"
                        border="1px solid"
                        borderColor="rgba(212,169,96,0.3)"
                      >
                        Batch {alumni.graduation_year}
                      </Badge>
                    )}
                    {alumni.institution_name && (
                      <Badge
                        bg="rgba(15,23,42,0.06)"
                        color={colors.dark}
                        fontSize="xs"
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        fontWeight="600"
                      >
                        {alumni.institution_name}
                      </Badge>
                    )}
                  </Flex>

                  {(alumni.current_company || alumni.current_designation) && (
                    <Box
                      bg={colors.pageBg}
                      borderRadius="xl"
                      p={5}
                      mb={5}
                      border="1px solid"
                      borderColor={colors.border}
                    >
                      <Text fontSize="xs" color={colors.secondary} fontWeight="700" mb={3} textTransform="uppercase" letterSpacing="wider">
                        Current role
                      </Text>
                      {alumni.current_company && (
                        <Text fontSize="lg" fontWeight="700" color={colors.dark} mb={1}>
                          {alumni.current_company}
                        </Text>
                      )}
                      {alumni.current_designation && (
                        <Text fontSize="md" color={colors.secondary} fontWeight="500">
                          {alumni.current_designation}
                        </Text>
                      )}
                      {alumni.current_work_location && (
                        <Text fontSize="sm" color={colors.muted} mt={2}>
                          {alumni.current_work_location}
                        </Text>
                      )}
                    </Box>
                  )}

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color={colors.secondary} textTransform="uppercase" mb={2}>Contact</Text>
                      <VStack align="stretch" spacing={2}>
                        {alumni.personal_email && (
                          <HStack>
                            <EmailIcon color={colors.accent} boxSize={4} />
                            <Link href={`mailto:${alumni.personal_email}`} color={colors.dark} fontSize="sm" fontWeight="500" _hover={{ color: colors.accent }}>
                              {alumni.personal_email}
                            </Link>
                          </HStack>
                        )}
                        {alumni.phone_number && (
                          <HStack>
                            <PhoneIcon color={colors.accent} boxSize={4} />
                            <Text fontSize="sm" color={colors.dark}>{alumni.phone_number}</Text>
                          </HStack>
                        )}
                        {!alumni.personal_email && !alumni.phone_number && (
                          <Text fontSize="sm" color={colors.muted}>—</Text>
                        )}
                      </VStack>
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color={colors.secondary} textTransform="uppercase" mb={2}>Social</Text>
                      <VStack align="stretch" spacing={2}>
                        {alumni.linkedin && (
                          <Link href={alumni.linkedin} isExternal color="blue.600" fontSize="sm" fontWeight="500" _hover={{ color: colors.accent }}>
                            <HStack>
                              <Icon as={FaLinkedin} boxSize={4} />
                              <span>LinkedIn</span>
                              <ExternalLinkIcon boxSize={3} />
                            </HStack>
                          </Link>
                        )}
                        {alumni.other_links && (() => {
                          const u = typeof alumni.other_links === 'string' ? alumni.other_links : alumni.other_links?.url;
                          return u ? (
                            <Link href={u} isExternal color="blue.600" fontSize="sm" fontWeight="500" _hover={{ color: colors.accent }}>
                              <HStack>
                                <Icon as={FaGlobe} boxSize={4} />
                                <span>Website</span>
                                <ExternalLinkIcon boxSize={3} />
                              </HStack>
                            </Link>
                          ) : null;
                        })()}
                        {!alumni.linkedin && !alumni.other_links && <Text fontSize="sm" color={colors.muted}>—</Text>}
                      </VStack>
                    </Box>
                  </SimpleGrid>

                  {alumni.alumni_remark && (
                    <Box mt={6} pt={6} borderTop="1px solid" borderColor={colors.border}>
                      <Text fontSize="xs" fontWeight="bold" color={colors.secondary} textTransform="uppercase" mb={2}>Note</Text>
                      <Text fontSize="sm" color={colors.dark}>{alumni.alumni_remark}</Text>
                    </Box>
                  )}
                </Box>
              </Flex>
            </Box>
          </Box>
        </Container>
      </Box>
    </AlumniLayout>
  );
};

export default AlumniViewAlumni;
