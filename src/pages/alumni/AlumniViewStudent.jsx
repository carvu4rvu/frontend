import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  VStack,
  Text,
  Spinner,
  useToast,
  HStack,
  Button,
  Flex,
  Badge,
  Wrap,
  Icon,
  Image,
  Link,
  Avatar,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Tag,
  WrapItem,
  IconButton,
  Container,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  SimpleGrid,
  Tooltip,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ViewIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import {
  FaEnvelope,
  FaFileAlt,
  FaExternalLinkAlt,
  FaGithub,
  FaLinkedin,
  FaHeart,
  FaRegHeart,
  FaBookmark,
  FaRegBookmark,
  FaLink,
  FaGlobe,
  FaTwitter,
  FaInstagram,
  FaDownload,
} from 'react-icons/fa';
import AlumniLayout from '../../components/AlumniLayout';
import { PlacementService } from '../../services/placement.service';
import { getFileUrl } from '../../utils/fileUrl';

// Color palette – alumni brand
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
  gradientStart: '#0f172a',
  gradientEnd: '#1e3a5f',
};

const CARD_RADIUS = '24px';
const CARD_SHADOW = '0 4px 24px rgba(15, 23, 42, 0.08)';
const CARD_SHADOW_HOVER = '0 12px 40px rgba(15, 23, 42, 0.12)';

function formatCount(n) {
  if (n == null) return '0';
  const num = Number(n);
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

// Get icon for social link
function getSocialIcon(url, name) {
  const lowerUrl = (url || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();
  if (lowerUrl.includes('linkedin') || lowerName.includes('linkedin')) return FaLinkedin;
  if (lowerUrl.includes('github') || lowerName.includes('github')) return FaGithub;
  if (lowerUrl.includes('twitter') || lowerName.includes('twitter')) return FaTwitter;
  if (lowerUrl.includes('instagram') || lowerName.includes('instagram')) return FaInstagram;
  return FaGlobe;
}

// Get color for social link
function getSocialColor(url, name) {
  const lowerUrl = (url || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();
  if (lowerUrl.includes('linkedin') || lowerName.includes('linkedin')) return '#0077b5';
  if (lowerUrl.includes('github') || lowerName.includes('github')) return '#333';
  if (lowerUrl.includes('twitter') || lowerName.includes('twitter')) return '#1DA1F2';
  if (lowerUrl.includes('instagram') || lowerName.includes('instagram')) return '#E4405F';
  return colors.accent;
}

const AlumniViewStudent = () => {
  const { usn } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailSnapIndex, setDetailSnapIndex] = useState(0);
  const [likingId, setLikingId] = useState(null);
  const [favoritingId, setFavoritingId] = useState(null);
  const [shareLoadingId, setShareLoadingId] = useState(null);
  const [thumbErrors, setThumbErrors] = useState(new Set());
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isConnectOpen, onOpen: onConnectOpen, onClose: onConnectClose } = useDisclosure();
  const [connectFormData, setConnectFormData] = useState({
    connection_purpose: '',
    message_to_po: '',
    preferred_contact_date: '',
    preferred_time_slot: '',
    contact_mode: '',
  });
  const [connectLoading, setConnectLoading] = useState(false);

  const handleConnectChange = (e) => {
    const { name, value } = e.target;
    setConnectFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConnectSubmit = async () => {
    if (!connectFormData.connection_purpose || !connectFormData.message_to_po) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in Connection Purpose and Message to PO.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setConnectLoading(true);
    try {
      await PlacementService.createAlumniConnectionRequest({
        student_usn: decodeURIComponent(usn),
        ...connectFormData
      });
      toast({
        title: 'Request Sent',
        description: 'Your connection request has been submitted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onConnectClose();
      setConnectFormData({
        connection_purpose: '',
        message_to_po: '',
        preferred_contact_date: '',
        preferred_time_slot: '',
        contact_mode: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setConnectLoading(false);
    }
  };

  useEffect(() => {
    if (!usn) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await PlacementService.getStudentProfileForAlumni(decodeURIComponent(usn));
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) {
          toast({
            title: 'Failed to load student',
            description: e?.message || 'Student not found.',
            status: 'error',
            isClosable: true,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [usn, toast]);

  const openDetail = async (project) => {
    setSelectedProject(project);
    setDetailSnapIndex(0);
    onOpen();
    
    try {
      await PlacementService.incrementProjectView(project.id);
      setProfile((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id ? { ...p, views_count: (p.views_count || 0) + 1 } : p
        ),
      }));
    } catch (err) {
      // Silently fail
    }
  };

  const handleLike = async (projectId, e) => {
    if (e) e.stopPropagation();
    if (likingId) return;
    setLikingId(projectId);
    try {
      const result = await PlacementService.toggleProjectLike(projectId);
      setProfile((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, is_liked: result.is_liked, likes_count: result.likes_count } : p
        ),
      }));
      if (selectedProject?.id === projectId) {
        setSelectedProject((prev) => ({ ...prev, is_liked: result.is_liked, likes_count: result.likes_count }));
      }
    } catch (err) {
      toast({ title: 'Failed to update like', status: 'error', isClosable: true });
    } finally {
      setLikingId(null);
    }
  };

  const handleFavorite = async (projectId, e) => {
    if (e) e.stopPropagation();
    if (favoritingId) return;
    setFavoritingId(projectId);
    try {
      const result = await PlacementService.toggleProjectFavorite(projectId);
      setProfile((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, is_favorited: result.is_favorited, favorites_count: result.favorites_count } : p
        ),
      }));
      if (selectedProject?.id === projectId) {
        setSelectedProject((prev) => ({ ...prev, is_favorited: result.is_favorited, favorites_count: result.favorites_count }));
      }
    } catch (err) {
      toast({ title: 'Failed to update favorite', status: 'error', isClosable: true });
    } finally {
      setFavoritingId(null);
    }
  };

  const handleShareLink = async (projectId, e) => {
    if (e) e.stopPropagation();
    if (shareLoadingId) return;
    setShareLoadingId(projectId);
    try {
      const data = await PlacementService.createProjectShareLink(projectId, 168);
      const path = data?.url || `/projects/share/${data?.share_token}`;
      const fullUrl = `${window.location.origin}${path}`;
      try {
        await navigator.clipboard.writeText(fullUrl);
        toast({ title: 'Share link copied to clipboard', status: 'success', isClosable: true });
      } catch {
        toast({ title: 'Share link created', description: fullUrl, status: 'success', isClosable: true });
      }
    } catch (err) {
      toast({ title: err.message || 'Failed to create share link', status: 'error', isClosable: true });
    } finally {
      setShareLoadingId(null);
    }
  };

  const snaps = selectedProject?.project_snaps || [];
  const techList = useMemo(() => {
    const p = selectedProject;
    if (!p) return [];
    if (Array.isArray(p.technologies)) return p.technologies.filter(Boolean);
    if (typeof p.technologies === 'string')
      return p.technologies.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  }, [selectedProject]);

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

  if (!profile) {
    return (
      <AlumniLayout>
        <Flex justify="center" align="center" minH="calc(100vh - 72px)" bg={colors.pageBg} direction="column" gap={6} px={4}>
          <Text color={colors.secondary} fontSize="lg" fontWeight="500">Student not found.</Text>
          <Button
            leftIcon={<ChevronLeftIcon />}
            onClick={() => navigate('/placement/alumni-projects')}
            bg={colors.accent}
            color="white"
            fontWeight="600"
            borderRadius="xl"
            px={6}
            _hover={{ bg: colors.accentHover }}
          >
            Back to Projects
          </Button>
        </Flex>
      </AlumniLayout>
    );
  }

  const personal = profile.personal || {};
  const projects = profile.projects || [];
  const career = profile.career || {};
  const resumeFile = profile.resume_file || career?.resume_file;
  const displayName = (personal.full_name || personal.fullName || '').trim() || (profile?.usn || decodeURIComponent(usn || '')) || 'Student';

  // Parse social links
  const socialLinks = [];
  if (personal.social_links) {
    if (Array.isArray(personal.social_links)) {
      personal.social_links.forEach((item, idx) => {
        if (typeof item === 'string') {
          socialLinks.push({ key: idx, url: item, name: '' });
        } else if (item?.url) {
          socialLinks.push({ key: idx, url: item.url, name: item.name || '' });
        }
      });
    } else if (typeof personal.social_links === 'object') {
      Object.entries(personal.social_links).forEach(([key, val]) => {
        const url = typeof val === 'string' ? val : val?.url;
        const name = typeof val === 'object' ? val?.name : key;
        if (url) socialLinks.push({ key, url, name });
      });
    }
  }

  return (
    <AlumniLayout>
      <Box bg={colors.pageBg} minH="100vh" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
        <Container maxW="960px" px={{ base: 0, md: 4 }}>
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronLeftIcon boxSize={5} />}
            onClick={() => navigate(-1)}
            mb={{ base: 4, md: 6 }}
            color={colors.secondary}
            fontWeight="600"
            fontSize="sm"
            _hover={{ color: colors.dark, bg: 'white', boxShadow: 'sm' }}
            borderRadius="lg"
            px={4}
          >
            Back to Projects
          </Button>

          {/* Student Profile Card - no top banner */}
          <Box
            bg={colors.cardBg}
            borderRadius={CARD_RADIUS}
            boxShadow={CARD_SHADOW}
            overflow="hidden"
            mb={{ base: 8, md: 12 }}
          >
            <Box px={{ base: 5, md: 10 }} py={{ base: 8, md: 10 }}>
              <Flex gap={{ base: 5, md: 8 }} align="flex-start" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                {/* Profile Image */}
                <Avatar
                  size="2xl"
                  name={displayName}
                  src={personal.profile_image ? getFileUrl(personal.profile_image) : undefined}
                  bg={colors.accent}
                  color="white"
                  border="4px solid white"
                  boxShadow={CARD_SHADOW}
                  flexShrink={0}
                />

                {/* Student Info */}
                <Box flex="1" minW={{ base: '100%', md: '280px' }} pt={{ base: 2, md: 4 }}>
                  <Heading size="xl" color={colors.dark} mb={3} fontWeight="800" letterSpacing="-0.02em" lineHeight="1.2">
                    {displayName}
                  </Heading>
                  {(profile?.usn || usn) && (
                    <Text fontSize="sm" color={colors.muted} fontWeight="500" mb={4}>
                      {profile?.usn || decodeURIComponent(usn)}
                    </Text>
                  )}

                  {/* Program, School, Year Badges */}
                  <Flex gap={2} mb={6} flexWrap="wrap">
                    {personal.programName && (
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
                        {personal.programName}
                      </Badge>
                    )}
                    {personal.schoolName && (
                      <Badge
                        bg="rgba(15,23,42,0.06)"
                        color={colors.dark}
                        fontSize="xs"
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        fontWeight="600"
                      >
                        {personal.schoolName}
                      </Badge>
                    )}
                    {personal.year_of_joining && (
                      <Badge
                        bg={colors.pageBg}
                        color={colors.secondary}
                        fontSize="xs"
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        fontWeight="600"
                      >
                        Batch {personal.year_of_joining}
                      </Badge>
                    )}
                    {personal.current_year && (
                      <Badge
                        bg="white"
                        color={colors.dark}
                        fontSize="xs"
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        fontWeight="600"
                        border="1px solid"
                        borderColor={colors.border}
                      >
                        Year {personal.current_year}
                      </Badge>
                    )}
                  </Flex>

                  {/* Contact Card */}
                  <Box
                    bg={colors.pageBg}
                    borderRadius="xl"
                    p={5}
                    mb={5}
                    border="1px solid"
                    borderColor={colors.border}
                  >
                    <HStack spacing={4}>
                      <Flex
                        w="44px"
                        h="44px"
                        bg="white"
                        borderRadius="xl"
                        align="center"
                        justify="center"
                        border="1px solid"
                        borderColor={colors.border}
                        boxShadow="sm"
                      >
                        <Icon as={FaEnvelope} color={colors.accent} boxSize={5} />
                      </Flex>
                      <Box flex="1" minW={0}>
                        <Text fontSize="xs" color={colors.secondary} fontWeight="600" textTransform="uppercase" letterSpacing="wider" mb={0.5}>
                          College Email
                        </Text>
                        {personal.college_email ? (
                          <Link
                            href={`mailto:${personal.college_email}`}
                            color={colors.dark}
                            fontSize="md"
                            fontWeight="600"
                            _hover={{ color: colors.accent }}
                            isTruncated
                            display="block"
                          >
                            {personal.college_email}
                          </Link>
                        ) : (
                          <Text color={colors.muted} fontSize="sm" fontStyle="italic">
                            Not provided
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </Box>

                  {/* Social Links */}
                  {socialLinks.length > 0 && (
                    <Box mb={5}>
                      <Text fontSize="xs" color={colors.secondary} fontWeight="700" mb={3} textTransform="uppercase" letterSpacing="wider">
                        Social & Links
                      </Text>
                      <Flex gap={2} flexWrap="wrap">
                        {socialLinks.map(({ key, url, name }) => {
                          const IconComponent = getSocialIcon(url, name);
                          const iconColor = getSocialColor(url, name);
                          const displayName = name && !name.startsWith('http') && isNaN(Number(name))
                            ? name.charAt(0).toUpperCase() + name.slice(1)
                            : url.includes('linkedin') ? 'LinkedIn'
                            : url.includes('github') ? 'GitHub'
                            : url.includes('twitter') ? 'Twitter'
                            : 'Website';
                          return (
                            <Link key={key} href={url} isExternal _hover={{ textDecoration: 'none' }}>
                              <HStack
                                spacing={2}
                                px={4}
                                py={2.5}
                                bg="white"
                                borderRadius="xl"
                                borderWidth="1px"
                                borderColor={colors.border}
                                _hover={{
                                  borderColor: iconColor,
                                  transform: 'translateY(-2px)',
                                  boxShadow: CARD_SHADOW
                                }}
                                transition="all 0.2s"
                              >
                                <Icon as={IconComponent} boxSize={4} color={iconColor} />
                                <Text fontSize="sm" fontWeight="600" color={colors.dark}>{displayName}</Text>
                                <Icon as={ExternalLinkIcon} boxSize={3} color={colors.muted} />
                              </HStack>
                            </Link>
                          );
                        })}
                      </Flex>
                    </Box>
                  )}

                  {/* Download Resume + Connect with Student — same row at end of container */}
                  <Flex
                    mt={6}
                    w="full"
                    justify="flex-end"
                    align="center"
                    gap={4}
                    flexWrap="wrap"
                  >
                    {resumeFile ? (
                      <Button
                        as="a"
                        href={getFileUrl(resumeFile)}
                        target="_blank"
                        leftIcon={<FaDownload />}
                        bg={colors.darkBlue}
                        color="white"
                        size="lg"
                        borderRadius="xl"
                        px={8}
                        py={6}
                        fontWeight="600"
                        _hover={{
                          bg: colors.gradientEnd,
                          transform: 'translateY(-2px)',
                          boxShadow: CARD_SHADOW_HOVER
                        }}
                        transition="all 0.2s"
                      >
                        Download Resume
                      </Button>
                    ) : (
                      <HStack
                        spacing={3}
                        bg={colors.pageBg}
                        px={5}
                        py={4}
                        borderRadius="xl"
                        borderWidth="1px"
                        borderStyle="dashed"
                        borderColor={colors.border}
                      >
                        <Icon as={FaFileAlt} color={colors.muted} boxSize={5} />
                        <Text fontSize="sm" color={colors.secondary} fontWeight="500">
                          No resume uploaded yet
                        </Text>
                      </HStack>
                    )}
                    <Button
                      bg={colors.accent}
                      color="white"
                      size="lg"
                      onClick={onConnectOpen}
                      fontWeight="600"
                      borderRadius="xl"
                      px={8}
                      py={6}
                      _hover={{ bg: colors.accentHover, transform: 'translateY(-1px)', boxShadow: 'lg' }}
                      transition="all 0.2s"
                    >
                      Connect with Student
                    </Button>
                  </Flex>
                </Box>
              </Flex>
            </Box>
          </Box>

          {/* Projects Section - all projects from API (no limit) */}
          <Box as="section" pt={2} overflow="visible">
            <Flex justify="space-between" align="center" mb={5} flexWrap="wrap" gap={3}>
              <Heading size="lg" fontWeight="800" color={colors.dark} letterSpacing="-0.02em">
                Projects
              </Heading>
              {projects.length > 0 && (
                <Badge
                  bg={colors.accent}
                  color="white"
                  fontSize="sm"
                  px={4}
                  py={1.5}
                  borderRadius="full"
                  fontWeight="700"
                >
                  {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
                </Badge>
              )}
            </Flex>

            {projects.length === 0 ? (
              <Box
                bg="white"
                borderRadius={CARD_RADIUS}
                p={{ base: 12, md: 16 }}
                textAlign="center"
                boxShadow={CARD_SHADOW}
                border="1px solid"
                borderColor={colors.border}
              >
                <Icon as={FaFileAlt} boxSize={14} color={colors.muted} mb={4} />
                <Text color={colors.secondary} fontSize="lg" fontWeight="500">
                  No public projects available
                </Text>
              </Box>
            ) : (
              <VStack spacing={8} align="stretch" overflow="visible">
                {projects.map((p) => {
                  const icon = (p.project_snaps || [])[0];
                  const screenshots = p.project_snaps || [];
                  const desc = p.full_description || p.one_line_description || 'No description.';
                  const projectUsn = p.owner_usn || p.usn || profile?.usn || (usn ? decodeURIComponent(usn) : '');
                  return (
                    <Box
                      key={p.id}
                      p={5}
                      borderRadius="16px"
                      boxShadow="0 1px 3px rgba(0,0,0,0.08)"
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      _hover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderColor: 'gray.300' }}
                      transition="all 0.2s"
                    >
                      {/* Header: thumbnail + title/USN/category + action buttons (same as showcase) */}
                      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} flexWrap="wrap" mb={2}>
                        <HStack align="center" spacing={4} flex={1} minW={0}>
                          <Box boxSize="64px" flexShrink={0} borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.200" bg="gray.100" position="relative">
                            {icon && !thumbErrors.has(p.id) ? (
                              <Image
                                src={getFileUrl(icon)}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                                onError={() => setThumbErrors((prev) => new Set(prev).add(p.id))}
                              />
                            ) : null}
                            {(!icon || thumbErrors.has(p.id)) && (
                              <Flex position="absolute" inset={0} align="center" justify="center">
                                <Icon as={FaFileAlt} boxSize={7} color="gray.400" />
                              </Flex>
                            )}
                          </Box>
                          <Box minW={0}>
                            <Text fontSize="lg" fontWeight="bold" color="gray.900">
                              {p.title}
                            </Text>
                            {projectUsn && (
                              <Text color={colors.accent} fontSize="sm" fontWeight="medium">
                                {projectUsn}
                              </Text>
                            )}
                            <Text color="gray.500" fontSize="xs">
                              {p.genre || p.category || '—'}
                            </Text>
                          </Box>
                        </HStack>
                        <HStack spacing={2} flexWrap="wrap" onClick={(e) => e.stopPropagation()}>
                          <Tooltip label={p.is_liked ? 'Unlike' : 'Like'}>
                            <IconButton
                              icon={<Icon as={p.is_liked ? FaHeart : FaRegHeart} />}
                              size="sm"
                              variant="outline"
                              color={p.is_liked ? 'red.500' : 'gray.500'}
                              _hover={{ color: 'red.500' }}
                              onClick={(e) => handleLike(p.id, e)}
                              isLoading={likingId === p.id}
                              aria-label={p.is_liked ? 'Unlike' : 'Like'}
                            />
                          </Tooltip>
                          <Tooltip label={p.is_favorited ? 'Remove from favorites' : 'Add to favorites'}>
                            <IconButton
                              icon={<Icon as={p.is_favorited ? FaBookmark : FaRegBookmark} />}
                              size="sm"
                              variant="outline"
                              color={p.is_favorited ? 'orange.500' : 'gray.500'}
                              _hover={{ color: 'orange.500' }}
                              onClick={(e) => handleFavorite(p.id, e)}
                              isLoading={favoritingId === p.id}
                              aria-label={p.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                            />
                          </Tooltip>
                          <Tooltip label="Copy share link">
                            <IconButton
                              icon={<Icon as={FaLink} />}
                              size="sm"
                              variant="outline"
                              color="gray.500"
                              _hover={{ color: 'blue.500' }}
                              onClick={(e) => handleShareLink(p.id, e)}
                              isLoading={shareLoadingId === p.id}
                              aria-label="Share"
                            />
                          </Tooltip>
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<ViewIcon />}
                            borderColor="blue.200"
                            bg="blue.50"
                            color="blue.600"
                            _hover={{ bg: 'blue.100', borderColor: 'blue.300' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/placement/alumni-projects/project/${p.id}`); }}
                          >
                            Full details
                          </Button>
                        </HStack>
                      </Flex>

                      {/* Stats row: Views | Likes | Favorites (same as showcase) */}
                      <Flex gap={8} py={3} overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                        <Box as="button" type="button" textAlign="center" minW={14} cursor="pointer" border="none" bg="transparent" p={0} _hover={{ color: 'blue.600' }} _focus={{ outline: 'none', boxShadow: 'none' }} _active={{ outline: 'none' }} onClick={(e) => { e.stopPropagation(); openDetail(p); }} title="View project">
                          <Text fontWeight="bold" fontSize="sm">
                            <Icon as={ViewIcon} boxSize={3} mr={0.5} />
                            {formatCount(p.views_count)}
                          </Text>
                          <Text fontSize="10px" color="gray.500" textTransform="uppercase">Views</Text>
                        </Box>
                        <Box borderLeft="1px" borderColor="gray.200" />
                        <Box as="button" type="button" textAlign="center" minW={14} cursor="pointer" border="none" bg="transparent" p={0} _hover={{ color: 'red.500' }} _focus={{ outline: 'none', boxShadow: 'none' }} _active={{ outline: 'none' }} onClick={(e) => { e.stopPropagation(); handleLike(p.id, e); }} title={p.is_liked ? 'Unlike' : 'Like'} disabled={likingId === p.id}>
                          <Text fontWeight="bold" fontSize="sm">♥ {formatCount(p.likes_count)}</Text>
                          <Text fontSize="10px" color="gray.500" textTransform="uppercase">Likes</Text>
                        </Box>
                        <Box borderLeft="1px" borderColor="gray.200" />
                        <Box as="button" type="button" textAlign="center" minW={14} cursor="pointer" border="none" bg="transparent" p={0} _hover={{ color: 'orange.500' }} _focus={{ outline: 'none', boxShadow: 'none' }} _active={{ outline: 'none' }} onClick={(e) => { e.stopPropagation(); handleFavorite(p.id, e); }} title={p.is_favorited ? 'Remove from favorites' : 'Add to favorites'} disabled={favoritingId === p.id}>
                          <Text fontWeight="bold" fontSize="sm">
                            <Icon as={FaBookmark} boxSize={3} color={p.is_favorited ? 'orange.500' : 'gray.400'} /> {formatCount(p.favorites_count ?? 0)}
                          </Text>
                          <Text fontSize="10px" color="gray.500" textTransform="uppercase">Favorites</Text>
                        </Box>
                      </Flex>

                      <Text color="gray.600" fontSize="sm" lineHeight="relaxed" noOfLines={{ base: 2, md: 3 }} mb={4}>
                        {desc}
                      </Text>

                      {/* 4-image gallery grid (same as showcase) */}
                      {screenshots.length > 0 && (
                        <SimpleGrid columns={4} spacing={3} py={2}>
                          {[0, 1, 2, 3].map((i) => {
                            const snap = screenshots[i] || null;
                            return (
                              <Box
                                key={i}
                                aspectRatio="16/9"
                                borderRadius="xl"
                                overflow="hidden"
                                border="1px solid"
                                borderColor={snap ? 'gray.200' : 'gray.100'}
                                bg={snap ? 'gray.900' : 'gray.50'}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                cursor={snap ? 'pointer' : 'default'}
                                onClick={snap ? (e) => { e.stopPropagation(); openDetail(p); } : undefined}
                                _hover={snap ? { opacity: 0.95 } : {}}
                              >
                                {snap ? (
                                  <Image
                                    src={getFileUrl(snap)}
                                    w="100%"
                                    h="100%"
                                    objectFit="contain"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <Icon as={FaFileAlt} boxSize={6} color="gray.300" />
                                )}
                              </Box>
                            );
                          })}
                        </SimpleGrid>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Box>
        </Container>
      </Box>

      {/* Detail Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setSelectedProject(null);
        }}
        size="xl"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent borderRadius="2xl" overflow="hidden" maxH="90vh" boxShadow="2xl">
          <ModalHeader bg="white" borderBottom="1px solid" borderColor={colors.border} py={5} px={6}>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between" align="start" gap={4}>
                <Heading size="lg" color={colors.dark} noOfLines={2} fontWeight="800" letterSpacing="-0.02em">
                  {selectedProject?.title}
                </Heading>
                <IconButton
                  icon={<Icon as={selectedProject?.is_liked ? FaHeart : FaRegHeart} boxSize={5} />}
                  colorScheme={selectedProject?.is_liked ? 'red' : 'gray'}
                  variant={selectedProject?.is_liked ? 'solid' : 'outline'}
                  size="md"
                  borderRadius="full"
                  onClick={() => selectedProject && handleLike(selectedProject.id)}
                  isLoading={likingId === selectedProject?.id}
                  aria-label={selectedProject?.is_liked ? 'Unlike' : 'Like'}
                />
              </HStack>
              <Badge
                bg={colors.lightAccent}
                color={colors.accentHover}
                alignSelf="flex-start"
                px={3}
                py={1}
                borderRadius="full"
                fontWeight="600"
              >
                {selectedProject?.genre || 'Project'}
              </Badge>
            </VStack>
          </ModalHeader>
          <ModalCloseButton size="lg" top={4} right={4} />
          <ModalBody py={6} px={6} overflowY="auto">
            {selectedProject && (
              <VStack align="stretch" spacing={6}>
                {/* Image Gallery */}
                {snaps.length > 0 && (
                  <Box>
                    <Box borderRadius="xl" overflow="hidden" bg={colors.pageBg} position="relative" aspectRatio="16/9" boxShadow="md">
                      <Image
                        src={getFileUrl(snaps[detailSnapIndex])}
                        w="100%"
                        h="100%"
                        objectFit="contain"
                        alt=""
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </Box>
                    {snaps.length > 1 && (
                      <HStack mt={3} spacing={2} overflowX="auto" py={1}>
                        {snaps.map((s, i) => (
                          <Box
                            key={i}
                            as="button"
                            flexShrink={0}
                            w="80px"
                            h="50px"
                            borderRadius="lg"
                            overflow="hidden"
                            border="3px solid"
                            borderColor={i === detailSnapIndex ? colors.accent : 'transparent'}
                            opacity={i === detailSnapIndex ? 1 : 0.7}
                            _hover={{ opacity: 1 }}
                            transition="all 0.2s"
                            onClick={() => setDetailSnapIndex(i)}
                          >
                            <Image src={getFileUrl(s)} w="100%" h="100%" objectFit="cover" alt="" />
                          </Box>
                        ))}
                      </HStack>
                    )}
                  </Box>
                )}

                {/* About */}
                <Box>
                  <Text fontSize="xs" color={colors.secondary} fontWeight="700" mb={3} textTransform="uppercase" letterSpacing="wider">
                    About this project
                  </Text>
                  <Text color={colors.dark} whiteSpace="pre-wrap" fontSize="md" lineHeight="1.75">
                    {selectedProject.full_description || selectedProject.one_line_description || 'No description.'}
                  </Text>
                </Box>

                {/* Stats */}
                <Flex gap={8} flexWrap="wrap" bg={colors.pageBg} p={5} borderRadius="xl" border="1px solid" borderColor={colors.border}>
                  <Box>
                    <Text fontSize="xs" color={colors.secondary} fontWeight="600" mb={1} textTransform="uppercase" letterSpacing="wider">Views</Text>
                    <Text fontWeight="700" fontSize="lg" color={colors.dark}>{selectedProject.views_count ?? 0}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color={colors.secondary} fontWeight="600" mb={1} textTransform="uppercase" letterSpacing="wider">Likes</Text>
                    <HStack>
                      <Icon as={FaHeart} color={selectedProject.is_liked ? 'red.500' : colors.secondary} />
                      <Text fontWeight="700" fontSize="lg" color={colors.dark}>{selectedProject.likes_count ?? 0}</Text>
                    </HStack>
                  </Box>
                </Flex>

                {/* Tech Stack */}
                {techList.length > 0 && (
                  <Box>
                    <Text fontSize="xs" color={colors.secondary} fontWeight="700" mb={3} textTransform="uppercase" letterSpacing="wider">
                      Tech Stack
                    </Text>
                    <Wrap spacing={2}>
                      {techList.map((t, i) => (
                        <WrapItem key={i}>
                          <Tag
                            bg={colors.pageBg}
                            color={colors.dark}
                            borderRadius="full"
                            size="md"
                            border="1px solid"
                            borderColor={colors.border}
                            fontWeight="500"
                            px={3}
                          >
                            {t}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                )}

                {selectedProject.mentor_name && (
                  <Box>
                    <Text fontSize="xs" color={colors.secondary} fontWeight="700" mb={1} textTransform="uppercase" letterSpacing="wider">Mentor</Text>
                    <Text color={colors.dark} fontWeight="600">{selectedProject.mentor_name}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg={colors.pageBg} borderTop="1px solid" borderColor={colors.border} flexWrap="wrap" gap={3} py={5} px={6}>
            {selectedProject?.hosted_link && (
              <Button
                as={Link}
                href={selectedProject.hosted_link}
                isExternal
                leftIcon={<Icon as={FaExternalLinkAlt} />}
                bg={colors.accent}
                color="white"
                size="md"
                borderRadius="xl"
                fontWeight="600"
                _hover={{ bg: colors.accentHover, textDecoration: 'none' }}
              >
                Live Demo
              </Button>
            )}
            {selectedProject?.github_repo && (
              <Button
                as={Link}
                href={selectedProject.github_repo}
                isExternal
                leftIcon={<Icon as={FaGithub} />}
                variant="outline"
                size="md"
                borderRadius="xl"
                borderWidth="2px"
                borderColor={colors.border}
                _hover={{ textDecoration: 'none', bg: 'white', borderColor: colors.dark }}
              >
                Source Code
              </Button>
            )}
            <Button
              ml="auto"
              leftIcon={<Icon as={selectedProject?.is_liked ? FaHeart : FaRegHeart} />}
              colorScheme={selectedProject?.is_liked ? 'red' : 'gray'}
              variant={selectedProject?.is_liked ? 'solid' : 'outline'}
              size="md"
              borderRadius="xl"
              fontWeight="600"
              onClick={() => selectedProject && handleLike(selectedProject.id)}
              isLoading={likingId === selectedProject?.id}
            >
              {selectedProject?.is_liked ? 'Liked' : 'Like'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Connection Request Modal */}
      <Modal isOpen={isConnectOpen} onClose={onConnectClose} size="lg" isCentered>
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(6px)" />
        <ModalContent borderRadius="2xl" overflow="hidden" boxShadow="2xl">
          <ModalHeader bg="white" borderBottom="1px solid" borderColor={colors.border} py={5} fontWeight="700" fontSize="xl">
            Connect with Student
          </ModalHeader>
          <ModalCloseButton top={4} right={4} size="md" />
          <ModalBody pb={6} pt={6} px={6}>
            <VStack spacing={5} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="600" color={colors.dark}>Connection Purpose</FormLabel>
                <Input
                  name="connection_purpose"
                  value={connectFormData.connection_purpose}
                  onChange={handleConnectChange}
                  placeholder="e.g., Mentorship, Hiring, Project Collaboration"
                  borderRadius="xl"
                  borderColor={colors.border}
                  _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="600" color={colors.dark}>Message to Placement Officer</FormLabel>
                <Textarea
                  name="message_to_po"
                  value={connectFormData.message_to_po}
                  onChange={handleConnectChange}
                  placeholder="Explain why you want to connect with this student..."
                  borderRadius="xl"
                  borderColor={colors.border}
                  minH="100px"
                  _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="600" color={colors.dark}>Preferred Contact Date</FormLabel>
                <Input
                  name="preferred_contact_date"
                  type="date"
                  value={connectFormData.preferred_contact_date}
                  onChange={handleConnectChange}
                  borderRadius="xl"
                  borderColor={colors.border}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="600" color={colors.dark}>Preferred Time Slot</FormLabel>
                <Input
                  name="preferred_time_slot"
                  value={connectFormData.preferred_time_slot}
                  onChange={handleConnectChange}
                  placeholder="e.g., 10:00 AM - 11:00 AM"
                  borderRadius="xl"
                  borderColor={colors.border}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="600" color={colors.dark}>Contact Mode</FormLabel>
                <Select
                  name="contact_mode"
                  value={connectFormData.contact_mode}
                  onChange={handleConnectChange}
                  placeholder="Select mode"
                  borderRadius="xl"
                  borderColor={colors.border}
                >
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="Video Call">Video Call</option>
                  <option value="In Person">In Person</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter bg={colors.pageBg} borderTop="1px solid" borderColor={colors.border} py={5} px={6} gap={3}>
            <Button variant="ghost" onClick={onConnectClose} fontWeight="600" borderRadius="xl">
              Cancel
            </Button>
            <Button
              bg={colors.accent}
              color="white"
              onClick={handleConnectSubmit}
              isLoading={connectLoading}
              fontWeight="600"
              borderRadius="xl"
              px={6}
              _hover={{ bg: colors.accentHover }}
            >
              Submit Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AlumniLayout>
  );
};

export default AlumniViewStudent;
