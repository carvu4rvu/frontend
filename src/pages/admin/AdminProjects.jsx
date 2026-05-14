import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  useToast,
  HStack,
  VStack,
  Badge,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Image,
  Flex,
  Tag,
  Icon,
  Divider,
  Link,
  Wrap,
  WrapItem,
  useBreakpointValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { ViewIcon, StarIcon, SearchIcon, CheckIcon, TimeIcon } from '@chakra-ui/icons';
import { FaExternalLinkAlt, FaGithub, FaChevronLeft, FaChevronRight, FaUser, FaHeart, FaRegHeart, FaStar, FaRegStar, FaChevronDown, FaBookmark, FaRegBookmark, FaLink, FaComment } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import ProjectsShowcasePage from '../ProjectsShowcasePage';
import { PlacementService } from '../../services/placement.service';
import { getFileUrl } from '../../utils/fileUrl';

const PLAY_GREEN = '#01875f';
const PLAY_GREEN_HOVER = '#01704f';
const CARD_RADIUS = '16px';
const CARD_SHADOW = '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)';

function formatCount(n) {
  if (n == null) return '0';
  const num = Number(n);
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

const AdminProjects = ({ mode = 'showcase' }) => {
  if (mode === 'showcase') {
    return (
      <ProjectsShowcasePage
        LayoutComponent={AdminLayout}
        variant="admin"
        fetchProjects={async () => {
          const data = await PlacementService.getAllProjects({});
          return Array.isArray(data) ? data : [];
        }}
      />
    );
  }

  const toast = useToast();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Showcase Tab State
  const [search, setSearch] = useState('');
  const [showcaseFilter, setShowcaseFilter] = useState('all'); // 'all' | 'favorites'

  // Manage Tab State - read project & tab from URL (?project=8&tab=approved)
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const project = params.get('project');
    const tab = params.get('tab');
    return {
      projectId: project ? parseInt(project, 10) : null,
      tab: tab && ['all', 'not_approved', 'approved', 'rejected', 'archived'].includes(tab) ? tab : null,
    };
  }, [location.search]);
  const projectIdFromUrl = urlParams.projectId;
  const tabFromUrl = urlParams.tab;
  const [manageSearch, setManageSearch] = useState('');
  const [manageFilter, setManageFilter] = useState(tabFromUrl || 'all');
  const highlightedProjectId = projectIdFromUrl;
  const highlightedProjectRef = useRef(null);

  const navigate = useNavigate();

  // Edit/Modal State (Manage tab uses inline edits; modal kept for backward compat)
  const [editingProject, setEditingProject] = useState(null);
  const [selectedDetailProject, setSelectedDetailProject] = useState(null);
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [isApproved, setIsApproved] = useState(false);
  const [archiveMode, setArchiveMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Inline edits per project (Manage tab - no modal)
  const [projectEdits, setProjectEdits] = useState({});
  const [savingProjectId, setSavingProjectId] = useState(null);
  const [likingId, setLikingId] = useState(null);
  const [favoritingId, setFavoritingId] = useState(null);
  const [shareLoadingId, setShareLoadingId] = useState(null);
  const heroCarouselRef = useRef(null);

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

  const handleFavorite = async (projectId, e) => {
    if (e) e.stopPropagation();
    if (favoritingId) return;
    setFavoritingId(projectId);
    try {
      const result = await PlacementService.toggleProjectFavorite(projectId);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, is_favorited: result.is_favorited, favorites_count: result.favorites_count } : p
        )
      );
      if (editingProject?.id === projectId) {
        setEditingProject((prev) => ({ ...prev, is_favorited: result.is_favorited, favorites_count: result.favorites_count }));
      }
      if (selectedDetailProject?.id === projectId) {
        setSelectedDetailProject((prev) => ({ ...prev, is_favorited: result.is_favorited, favorites_count: result.favorites_count }));
      }
    } catch (err) {
      toast({ title: 'Failed to update favorite', status: 'error', isClosable: true });
    } finally {
      setFavoritingId(null);
    }
  };

  const handleLike = async (projectId, e) => {
    if (e) e.stopPropagation();
    if (likingId) return;
    setLikingId(projectId);
    try {
      const result = await PlacementService.toggleProjectLike(projectId);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, is_liked: result.is_liked, likes_count: result.likes_count } : p
        )
      );
      if (editingProject?.id === projectId) {
        setEditingProject((prev) => ({ ...prev, is_liked: result.is_liked, likes_count: result.likes_count }));
      }
      if (selectedDetailProject?.id === projectId) {
        setSelectedDetailProject((prev) => ({ ...prev, is_liked: result.is_liked, likes_count: result.likes_count }));
      }
    } catch (err) {
      toast({ title: 'Failed to update like', status: 'error', isClosable: true });
    } finally {
      setLikingId(null);
    }
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (manageSearch.trim()) params.search = manageSearch.trim();
      const data = await PlacementService.getAllProjects(params);
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({ title: 'Failed to load projects', status: 'error', isClosable: true });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [manageSearch, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Sync tab from URL when in manage mode (handles direct navigation / refresh)
  useEffect(() => {
    if (mode === 'manage' && tabFromUrl) {
      setManageFilter(tabFromUrl);
    }
  }, [mode, tabFromUrl]);

  const manageTabIds = ['all', 'not_approved', 'approved', 'rejected', 'archived'];

  // Showcase Tab Filtered Projects (approved only)
  const filteredProjects = useMemo(() => {
    const isApproved = (p) => {
      const s = p.project_status || (p.is_approved ? 'approved' : 'not_approved');
      if (s === 'draft' || s === 'submitted') return false;
      return s === 'approved';
    };
    let res = projects.filter(isApproved);

    if (!search.trim()) return res;
    const q = search.trim().toLowerCase();
    return res.filter((p) => {
      const title = (p.title || '').toLowerCase();
      const genre = (p.genre || '').toLowerCase();
      const usn = (p.usn || '').toLowerCase();
      const one = (p.one_line_description || '').toLowerCase();
      const tech = Array.isArray(p.technologies)
        ? p.technologies.join(' ').toLowerCase()
        : (p.technologies || '').toString().toLowerCase();
      return `${title} ${genre} ${usn} ${one} ${tech}`.includes(q);
    });
  }, [projects, search]);

  const favoriteProjects = useMemo(
    () => filteredProjects.filter((p) => p.is_favorited),
    [filteredProjects]
  );

  const showcaseDisplayProjects = useMemo(
    () => (showcaseFilter === 'favorites' ? favoriteProjects : filteredProjects),
    [showcaseFilter, filteredProjects, favoriteProjects]
  );

  const featuredProjects = useMemo(
    () => showcaseDisplayProjects.slice(0, 6),
    [showcaseDisplayProjects]
  );

  const topByLikes = useMemo(
    () => [...showcaseDisplayProjects].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 6),
    [showcaseDisplayProjects]
  );

  const allRankedByLikes = useMemo(
    () => [...showcaseDisplayProjects].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)),
    [showcaseDisplayProjects]
  );

  const { isOpen: isRankingsOpen, onOpen: onRankingsOpen, onClose: onRankingsClose } = useDisclosure();

  // Manage Tab: filter by project_status client-side (treat draft/submitted as not_approved for backward compat)
  const manageFilteredProjects = useMemo(() => {
    const norm = (p) => {
      const s = p.project_status || (p.is_approved ? 'approved' : 'not_approved');
      if (s === 'draft' || s === 'submitted') return 'not_approved';
      return s;
    };
    let res = manageFilter === 'all' ? projects : projects.filter((p) => norm(p) === manageFilter);
    if (manageSearch.trim()) {
      const q = manageSearch.trim().toLowerCase();
      res = res.filter((p) => {
        const title = (p.title || '').toLowerCase();
        const usn = (p.usn || '').toLowerCase();
        const genre = (p.genre || '').toLowerCase();
        return `${title} ${usn} ${genre}`.includes(q);
      });
    }
    return res;
  }, [projects, manageSearch, manageFilter]);

  // Scroll to highlighted project when it's in the DOM (after projects load and tab is correct)
  const highlightedProjectInList = highlightedProjectId && manageFilteredProjects.some((p) => Number(p.id) === Number(highlightedProjectId));
  useEffect(() => {
    if (!highlightedProjectId || !highlightedProjectInList) return;
    const timer = setTimeout(() => {
      if (highlightedProjectRef.current) {
        highlightedProjectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [highlightedProjectId, highlightedProjectInList, manageFilter, manageFilteredProjects]);

  const scrollHero = (direction) => {
    const el = heroCarouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth + 16;
    el.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  };

  const openDetail = (project) => {
    setEditingProject(project);
    setIsApproved(project.project_status === 'approved' || project.is_approved === true);
    setArchiveMode(project.project_status === 'archived');
    onOpen();
  };

  const goToManageProject = (project) => {
    const norm = (s) => {
      if (s === 'draft' || s === 'submitted') return 'not_approved';
      return s || (project.is_approved ? 'approved' : 'not_approved');
    };
    const status = norm(project.project_status || (project.is_approved ? 'approved' : 'not_approved'));
    navigate(`/placement/gallery/manage?project=${project.id}&tab=${status}`);
  };

  /** Open full project detail page (same as "Full details" in Manage) */
  const goToProjectDetail = (project, e) => {
    if (e) e.stopPropagation();
    if (project?.id) navigate(`/placement/gallery/project/${project.id}`);
  };

  const openProjectDetailModal = (project) => {
    setSelectedDetailProject(project);
    onDetailOpen();
  };

  const handleSave = async () => {
    if (!editingProject?.id) return;
    setSaving(true);
    try {
      const status = archiveMode ? 'archived' : (isApproved ? 'approved' : 'rejected');
      await PlacementService.updateProject(editingProject.id, {
        is_approved: isApproved,
        project_status: status,
      });
      toast({ title: 'Project updated', status: 'success', isClosable: true });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id ? { ...p, is_approved: isApproved, project_status: status } : p
        )
      );
      onClose();
      setEditingProject(null);
    } catch (err) {
      toast({ title: err.message || 'Update failed', status: 'error', isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const getProjectEdits = (p) => {
    const norm = (s) => {
      if (s === 'draft' || s === 'submitted') return 'not_approved';
      return s || (p.is_approved ? 'approved' : 'not_approved');
    };
    const def = {
      projectStatus: norm(p.project_status || (p.is_approved ? 'approved' : 'not_approved')),
    };
    return projectEdits[p.id] ? { ...def, ...projectEdits[p.id] } : def;
  };

  const setProjectEdit = (projectId, field, value) => {
    setProjectEdits((prev) => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || {}), [field]: value },
    }));
  };

  const handleSaveForProject = async (p) => {
    const edits = getProjectEdits(p);
    setSavingProjectId(p.id);
    try {
      const status = edits.projectStatus;
      await PlacementService.updateProject(p.id, {
        is_approved: status === 'approved',
        project_status: status,
      });
      toast({ title: 'Project updated', status: 'success', isClosable: true });
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === p.id ? { ...proj, is_approved: status === 'approved', project_status: status } : proj
        )
      );
      setProjectEdits((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
    } catch (err) {
      toast({ title: err.message || 'Update failed', status: 'error', isClosable: true });
    } finally {
      setSavingProjectId(null);
    }
  };

  const snaps = editingProject?.project_snaps || [];
  const detailSnaps = selectedDetailProject?.project_snaps || selectedDetailProject?.snaps || [];

  const techList = useMemo(() => {
    const p = editingProject;
    if (!p) return [];
    if (Array.isArray(p.technologies)) return p.technologies.filter(Boolean);
    if (typeof p.technologies === 'string')
      return p.technologies.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  }, [editingProject]);

  const detailTechList = useMemo(() => {
    const p = selectedDetailProject;
    if (!p) return [];
    if (Array.isArray(p.technologies)) return p.technologies.filter(Boolean);
    if (typeof p.technologies === 'string')
      return p.technologies.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  }, [selectedDetailProject]);

  const notApprovedCount = projects.filter((p) => {
    const s = p.project_status || (p.is_approved ? 'approved' : 'not_approved');
    return s === 'draft' || s === 'submitted' || s === 'not_approved';
  }).length;
  const approvedCount = projects.filter((p) => (p.project_status || (p.is_approved ? 'approved' : '')) === 'approved').length;
  const rejectedCount = projects.filter((p) => (p.project_status || '') === 'rejected').length;
  const archivedCount = projects.filter((p) => (p.project_status || '') === 'archived').length;
  const allCount = projects.length;

  if (loading && projects.length === 0) {
    return (
      <AdminLayout>
        <Box py={16} display="flex" justifyContent="center" alignItems="center">
          <Spinner size="xl" color={PLAY_GREEN} thickness="3px" />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box bg="#f0f0f0" minH="100vh" py={6} color="gray.800">
        <Container maxW="6xl">
          <Heading size="lg" mb={6} color="gray.800" fontFamily="inherit">
            {mode === 'showcase' ? 'Showcase Projects' : 'Manage Projects'}
          </Heading>

          {mode === 'showcase' && (
            <>
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  gap={4}
                  mb={6}
                  align={{ base: 'stretch', md: 'center' }}
                  flexWrap="wrap"
                >
                  <InputGroup maxW={{ md: '320px' }} bg="white" borderRadius="xl" shadow="sm">
                    <InputLeftElement pointerEvents="none" color="gray.400">
                      <SearchIcon />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by title, genre, USN, tech…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="gray.200"
                      _focus={{ borderColor: PLAY_GREEN, boxShadow: `0 0 0 1px ${PLAY_GREEN}` }}
                    />
                  </InputGroup>
                  <HStack spacing={2} ml={{ md: 'auto' }}>
                    <Button
                      size="sm"
                      variant={showcaseFilter === 'all' ? 'solid' : 'outline'}
                      colorScheme={showcaseFilter === 'all' ? 'blue' : 'gray'}
                      onClick={() => setShowcaseFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={showcaseFilter === 'favorites' ? 'solid' : 'outline'}
                      colorScheme={showcaseFilter === 'favorites' ? 'orange' : 'gray'}
                      leftIcon={<Icon as={FaBookmark} boxSize={3} />}
                      onClick={() => setShowcaseFilter('favorites')}
                    >
                      My Favorites
                    </Button>
                  </HStack>
                </Flex>

                {/* Section 1: Featured Student Work (Carousel) */}
                {featuredProjects.length > 0 && (
                  <Box mb={10}>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="md" fontWeight="bold">
                        Featured Student Work
                      </Heading>
                      <HStack gap={2}>
                        <Button
                          size="sm"
                          variant="outline"
                          borderRadius="full"
                          borderColor="gray.200"
                          onClick={() => scrollHero(-1)}
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Icon as={FaChevronLeft} boxSize={3} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          borderRadius="full"
                          borderColor="gray.200"
                          onClick={() => scrollHero(1)}
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Icon as={FaChevronRight} boxSize={3} />
                        </Button>
                      </HStack>
                    </Flex>
                    <Flex
                      ref={heroCarouselRef}
                      overflowX="auto"
                      gap={4}
                      py={2}
                      sx={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}
                    >
                      {featuredProjects.map((p) => {
                        const heroImg = (p.project_snaps || [])[0];
                        const icon = (p.project_snaps || [])[0];
                        const desc = p.one_line_description || p.full_description || '';
                        return (
                          <Box
                            key={p.id}
                            flex="0 0 100%"
                            minW="100%"
                            scrollSnapAlign="start"
                            position="relative"
                            aspectRatio="16/9"
                            borderRadius="2xl"
                            overflow="hidden"
                            cursor="pointer"
                            onClick={() => goToProjectDetail(p)}
                          >
                            {heroImg ? (
                              <Image
                                src={getFileUrl(heroImg)}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                                borderRadius="2xl"
                                filter="brightness(0.75)"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <Box
                                w="100%"
                                h="100%"
                                aspectRatio="16/9"
                                bg="gray.200"
                                borderRadius="2xl"
                              />
                            )}
                            <Box position="absolute" top={4} right={4} display="flex" gap={2}>
                              <Tooltip label={p.is_liked ? 'Unlike' : 'Like'}>
                                <IconButton
                                  icon={<Icon as={p.is_liked ? FaHeart : FaRegHeart} />}
                                  size="sm"
                                  bg="whiteAlpha.800"
                                  color={p.is_liked ? 'red.500' : 'gray.600'}
                                  _hover={{ bg: 'white', color: 'red.500' }}
                                  onClick={(e) => handleLike(p.id, e)}
                                  isLoading={likingId === p.id}
                                  aria-label={p.is_liked ? 'Unlike' : 'Like'}
                                />
                              </Tooltip>
                              <Tooltip label={p.is_favorited ? 'Remove from favorites' : 'Add to favorites'}>
                                <IconButton
                                  icon={<Icon as={p.is_favorited ? FaBookmark : FaRegBookmark} />}
                                  size="sm"
                                  bg="whiteAlpha.800"
                                  color={p.is_favorited ? 'orange.500' : 'gray.600'}
                                  _hover={{ bg: 'white', color: 'orange.500' }}
                                  onClick={(e) => handleFavorite(p.id, e)}
                                  isLoading={favoritingId === p.id}
                                  aria-label={p.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                                />
                              </Tooltip>
                            </Box>
                            <Box
                              position="absolute"
                              bottom={6}
                              left={6}
                              right={6}
                              color="white"
                              maxW="md"
                            >
                              <HStack align="flex-start" spacing={3} mb={2}>
                                {icon ? (
                                  <Image
                                    src={getFileUrl(icon)}
                                    w={10}
                                    h={10}
                                    borderRadius="lg"
                                    border="1px solid"
                                    borderColor="whiteAlpha.300"
                                    shadow="lg"
                                    objectFit="cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <Box w={10} h={10} borderRadius="lg" bg="whiteAlpha.300" />
                                )}
                                <Box>
                                  <Text fontWeight="bold" fontSize="lg" lineHeight="tight">
                                    {p.title}
                                  </Text>
                                  <Text fontSize="xs" opacity={0.9}>
                                    {p.usn} • {p.genre || '—'}
                                  </Text>
                                </Box>
                              </HStack>
                              <Text fontSize="sm" noOfLines={2} opacity={0.8} display={{ base: 'none', md: 'block' }} mb={2}>
                                {desc}
                              </Text>
                              <Button
                                size="sm"
                                colorScheme="whiteAlpha"
                                bg="whiteAlpha.900"
                                color="gray.800"
                                _hover={{ bg: 'white' }}
                                leftIcon={<ViewIcon />}
                                onClick={(e) => goToProjectDetail(p, e)}
                              >
                                View full details
                              </Button>
                            </Box>
                          </Box>
                        );
                      })}
                    </Flex>
                  </Box>
                )}

                {/* Section 2: Top Charts */}
                {topByLikes.length > 0 && (
                  <Box mb={10}>
                    <Box
                      bg="white"
                      borderRadius="2xl"
                      p={{ base: 4, md: 6 }}
                      shadow="sm"
                      borderWidth="1px"
                      borderColor="gray.100"
                      overflow="hidden"
                    >
                      <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="md" fontWeight="bold">
                          Top Charts
                        </Heading>
                        <Button
                          size="sm"
                          colorScheme="green"
                          bg={PLAY_GREEN}
                          _hover={{ bg: PLAY_GREEN_HOVER }}
                          onClick={onRankingsOpen}
                        >
                          View more
                        </Button>
                      </Flex>
                      <Box
                        display="grid"
                        gridTemplateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
                        gap={{ base: 2, md: 6 }}
                        minW={0}
                      >
                      {topByLikes.map((p, i) => {
                        const icon = (p.project_snaps || [])[0];
                        return (
                          <Flex
                            key={p.id}
                            align="center"
                            gap={4}
                            py={2}
                            px={2}
                            borderRadius="xl"
                            cursor="pointer"
                            _hover={{ bg: 'gray.50' }}
                            transition="background 0.2s"
                            onClick={() => goToProjectDetail(p)}
                          >
                            <Text fontWeight="bold" fontSize="lg" color="gray.400" w={4}>
                              {i + 1}
                            </Text>
                            {icon ? (
                              <Box
                                boxSize="64px"
                                flexShrink={0}
                                borderRadius="xl"
                                overflow="hidden"
                                border="1px solid"
                                borderColor="gray.100"
                              >
                                <Image
                                  src={getFileUrl(icon)}
                                  w="100%"
                                  h="100%"
                                  objectFit="cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </Box>
                            ) : (
                              <Box boxSize="64px" flexShrink={0} borderRadius="xl" bg="gray.100" />
                            )}
                            <Box flex={1} minW={0} overflow="hidden">
                              <Tooltip label={p.title || 'Untitled'} placement="top" hasArrow>
                                <Text fontWeight="medium" color="gray.900" noOfLines={1} title={p.title || 'Untitled'}>
                                  {p.title || 'Untitled'}
                                </Text>
                              </Tooltip>
                              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                {p.genre || '—'}
                              </Text>
                              <HStack mt={1} spacing={2}>
                                <Text fontSize="10px" color="gray.400">
                                  {formatCount(p.likes_count)} likes
                                </Text>
                              </HStack>
                            </Box>
                            <HStack ml="auto" spacing={1} flexShrink={0}>
                              <Button
                                size="xs"
                                variant="outline"
                                leftIcon={<ViewIcon />}
                                borderColor="blue.200"
                                color="blue.600"
                                _hover={{ bg: 'blue.50' }}
                                onClick={(e) => goToProjectDetail(p, e)}
                              >
                                Full details
                              </Button>
                              <Tooltip label={p.is_liked ? 'Unlike' : 'Like'}>
                                <IconButton
                                  icon={<Icon as={p.is_liked ? FaHeart : FaRegHeart} />}
                                  size="sm"
                                  variant="ghost"
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
                                  variant="ghost"
                                  color={p.is_favorited ? 'orange.500' : 'gray.500'}
                                  _hover={{ color: 'orange.500' }}
                                  onClick={(e) => handleFavorite(p.id, e)}
                                  isLoading={favoritingId === p.id}
                                  aria-label={p.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                                />
                              </Tooltip>
                            </HStack>
                          </Flex>
                        );
                      })}
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Rankings modal: all projects by likes */}
                <Modal isOpen={isRankingsOpen} onClose={onRankingsClose} size="2xl" scrollBehavior="inside">
                  <ModalOverlay />
                  <ModalContent maxH="85vh">
                    <ModalHeader>Top Charts – Full Rankings</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6} overflowY="auto">
                      <VStack align="stretch" spacing={2}>
                        {allRankedByLikes.map((p, i) => {
                          const icon = (p.project_snaps || [])[0];
                          return (
                            <Flex
                              key={p.id}
                              align="center"
                              gap={4}
                              py={2}
                              px={3}
                              borderRadius="xl"
                              cursor="pointer"
                              _hover={{ bg: 'gray.50' }}
                              transition="background 0.2s"
                              onClick={() => { onRankingsClose(); goToProjectDetail(p); }}
                            >
                              <Text fontWeight="bold" fontSize="lg" color="gray.400" w={6} flexShrink={0}>
                                {i + 1}
                              </Text>
                              {icon ? (
                                <Box boxSize="48px" flexShrink={0} borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.100">
                                  <Image src={getFileUrl(icon)} w="100%" h="100%" objectFit="cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                </Box>
                              ) : (
                                <Box boxSize="48px" flexShrink={0} borderRadius="lg" bg="gray.100" />
                              )}
                              <Box flex={1} minW={0} overflow="hidden">
                                <Tooltip label={p.title || 'Untitled'} placement="top" hasArrow>
                                  <Text fontWeight="medium" color="gray.900" noOfLines={1}>{p.title || 'Untitled'}</Text>
                                </Tooltip>
                                <Text fontSize="xs" color="gray.500" noOfLines={1}>{p.genre || '—'}</Text>
                                <Text fontSize="10px" color="gray.400">{formatCount(p.likes_count)} likes</Text>
                              </Box>
                              <Button
                                size="xs"
                                variant="outline"
                                leftIcon={<ViewIcon />}
                                borderColor="blue.200"
                                color="blue.600"
                                _hover={{ bg: 'blue.50' }}
                                onClick={(e) => { e.stopPropagation(); onRankingsClose(); goToProjectDetail(p, e); }}
                              >
                                Full details
                              </Button>
                            </Flex>
                          );
                        })}
                      </VStack>
                    </ModalBody>
                  </ModalContent>
                </Modal>

                {/* Section 3: Main feed */}
                <Box>
                  <Flex justify="space-between" align="center" mb={6}>
                    <Heading size="md" fontWeight="bold">
                      {showcaseFilter === 'favorites' ? 'My Favorites' : 'All Projects'}
                    </Heading>
                  </Flex>

                  {showcaseDisplayProjects.length === 0 ? (
                    <Box
                      bg="white"
                      borderRadius={CARD_RADIUS}
                      p={12}
                      textAlign="center"
                      shadow={CARD_SHADOW}
                    >
                      <Text color="gray.500" fontSize="lg">
                        {showcaseFilter === 'favorites'
                          ? 'No favorited projects yet. Click the bookmark icon on any project to add it to your favorites.'
                          : projects.length === 0
                            ? 'No projects found.'
                            : 'No projects match your search. Try different keywords.'}
                      </Text>
                    </Box>
                  ) : (
                    <VStack spacing={12} align="stretch">
                      {showcaseDisplayProjects.map((p) => {
                        const icon = (p.project_snaps || [])[0];
                        const screenshots = p.project_snaps || [];
                        const desc = p.full_description || p.one_line_description || 'No description.';
                        return (
                          <Box
                            key={p.id}
                            p={5}
                            borderRadius={CARD_RADIUS}
                            shadow={CARD_SHADOW}
                            bg="white"
                          >
                            <Flex
                              direction={{ base: 'column', md: 'row' }}
                              justify="space-between"
                              align={{ base: 'stretch', md: 'center' }}
                              gap={4}
                              flexWrap="wrap"
                              mb={2}
                            >
                              <HStack align="center" spacing={4} flex={1} minW={0}>
                                {icon ? (
                                  <Box
                                    boxSize="64px"
                                    flexShrink={0}
                                    borderRadius="lg"
                                    overflow="hidden"
                                    border="1px solid"
                                    borderColor="gray.100"
                                  >
                                    <Image
                                      src={getFileUrl(icon)}
                                      w="100%"
                                      h="100%"
                                      objectFit="cover"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  </Box>
                                ) : (
                                  <Box boxSize="64px" flexShrink={0} borderRadius="lg" bg="gray.100" />
                                )}
                                <Box minW={0}>
                                  <Text fontSize="lg" fontWeight="bold" color="gray.900">
                                    {p.title}
                                  </Text>
                                  <Text color={PLAY_GREEN} fontSize="sm" fontWeight="medium">
                                    {p.usn}
                                  </Text>
                                  <Text color="gray.500" fontSize="xs">
                                    {p.genre || '—'}
                                  </Text>
                                </Box>
                              </HStack>
                              <HStack spacing={2} flexWrap="wrap">
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
                                  leftIcon={<Icon as={FaUser} />}
                                  color="gray.600"
                                  borderColor="gray.300"
                                  _hover={{ bg: 'gray.50' }}
                                  onClick={(e) => { e.stopPropagation(); navigate(`/placement/students/${encodeURIComponent(p.usn || '')}`); }}
                                >
                                  View Student
                                </Button>
                                <Tooltip label="Insights" placement="top">
                                  <IconButton
                                    icon={<Icon as={FaComment} />}
                                    size="sm"
                                    variant="outline"
                                    color="gray.600"
                                    borderColor="gray.300"
                                    _hover={{ bg: 'gray.50' }}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/placement/gallery/project/${p.id}?tab=reviews`); }}
                                    aria-label="Insights"
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
                                  onClick={(e) => goToProjectDetail(p, e)}
                                >
                                  Full details
                                </Button>
                                <Button
                                  bg={PLAY_GREEN}
                                  color="white"
                                  px={6}
                                  py={2}
                                  borderRadius="lg"
                                  fontWeight="medium"
                                  fontSize="sm"
                                  _hover={{ bg: PLAY_GREEN_HOVER }}
                                  leftIcon={<StarIcon />}
                                  onClick={(e) => { e.stopPropagation(); goToManageProject(p); }}
                                >
                                  {(p.project_status === 'approved' || p.is_approved) ? 'Manage' : 'Approve'}
                                </Button>
                              </HStack>
                            </Flex>

                            <Flex
                              gap={8}
                              py={3}
                              overflowX="auto"
                              sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}
                            >
                              <Box
                                as="button"
                                type="button"
                                textAlign="center"
                                minW={14}
                                cursor="pointer"
                                border="none"
                                bg="transparent"
                                p={0}
                                _hover={{ color: 'blue.600' }}
                                _focus={{ outline: 'none', boxShadow: 'none' }}
                                _active={{ outline: 'none' }}
                                onClick={(e) => { e.stopPropagation(); goToProjectDetail(p, e); }}
                                title="View project"
                              >
                                <Text fontWeight="bold" fontSize="sm">
                                  <Icon as={ViewIcon} boxSize={3} mr={0.5} />
                                  {formatCount(p.views_count)}
                                </Text>
                                <Text fontSize="10px" color="gray.500" textTransform="uppercase">
                                  Views
                                </Text>
                              </Box>
                              <Box borderLeft="1px" borderColor="gray.200" />
                              <Box
                                as="button"
                                type="button"
                                textAlign="center"
                                minW={14}
                                cursor="pointer"
                                border="none"
                                bg="transparent"
                                p={0}
                                _hover={{ color: 'red.500' }}
                                _focus={{ outline: 'none', boxShadow: 'none' }}
                                _active={{ outline: 'none' }}
                                onClick={(e) => { e.stopPropagation(); handleLike(p.id, e); }}
                                title={p.is_liked ? 'Unlike' : 'Like'}
                                disabled={likingId === p.id}
                              >
                                <Text fontWeight="bold" fontSize="sm">
                                  ♥ {formatCount(p.likes_count)}
                                </Text>
                                <Text fontSize="10px" color="gray.500" textTransform="uppercase">
                                  Likes
                                </Text>
                              </Box>
                              <Box borderLeft="1px" borderColor="gray.200" />
                              <Box
                                as="button"
                                type="button"
                                textAlign="center"
                                minW={14}
                                cursor="pointer"
                                border="none"
                                bg="transparent"
                                p={0}
                                _hover={{ color: 'orange.500' }}
                                _focus={{ outline: 'none', boxShadow: 'none' }}
                                _active={{ outline: 'none' }}
                                onClick={(e) => { e.stopPropagation(); handleFavorite(p.id, e); }}
                                title={p.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                                disabled={favoritingId === p.id}
                              >
                                <Text fontWeight="bold" fontSize="sm">
                                  <Icon as={FaBookmark} boxSize={3} color={p.is_favorited ? 'orange.500' : 'gray.400'} /> {formatCount(p.favorites_count ?? 0)}
                                </Text>
                                <Text fontSize="10px" color="gray.500" textTransform="uppercase">
                                  Favorites
                                </Text>
                              </Box>
                            </Flex>

                            <Text
                              color="gray.600"
                              fontSize="sm"
                              lineHeight="relaxed"
                              noOfLines={{ base: 2, md: 3 }}
                            >
                              {desc}
                            </Text>

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
                                      borderColor={snap ? 'gray.200' : 'transparent'}
                                      bg={snap ? '#000' : 'transparent'}
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      cursor={snap ? 'pointer' : 'default'}
                                      onClick={snap ? (e) => { e.stopPropagation(); goToProjectDetail(p, e); } : undefined}
                                      _hover={snap ? { opacity: 0.9 } : {}}
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
                                        <Box w="100%" h="100%" />
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
            </>
          )}

          {mode === 'manage' && (
                <Box bg="white" borderRadius="xl" shadow="sm" p={6}>
                  <Flex gap={4} mb={4} flexWrap="wrap">
                    <InputGroup maxW="320px">
                      <InputLeftElement pointerEvents="none" color="gray.400">
                        <SearchIcon />
                      </InputLeftElement>
                      <Input
                        placeholder="Search USN, Title..."
                        value={manageSearch}
                        onChange={(e) => setManageSearch(e.target.value)}
                        borderRadius="xl"
                      />
                    </InputGroup>
                  </Flex>

                  <Tabs variant="line" colorScheme="blue" index={manageTabIds.indexOf(manageFilter)} onChange={(i) => setManageFilter(manageTabIds[i])}>
                    <TabList mb={4} borderBottom="2px" borderColor="gray.200" display="flex" flexWrap="wrap" gap={0}>
                      <Tab _selected={{ color: 'blue.600', borderColor: 'blue.600', fontWeight: '600' }} borderBottom="3px" borderColor="transparent" mb="-2px" mr={6}>
                        All ({allCount})
                      </Tab>
                      <Tab _selected={{ color: 'blue.600', borderColor: 'blue.600', fontWeight: '600' }} borderBottom="3px" borderColor="transparent" mb="-2px" mr={6}>
                        Not Approved ({notApprovedCount})
                      </Tab>
                      <Tab _selected={{ color: 'blue.600', borderColor: 'blue.600', fontWeight: '600' }} borderBottom="3px" borderColor="transparent" mb="-2px" mr={6}>
                        Approved ({approvedCount})
                      </Tab>
                      <Tab _selected={{ color: 'blue.600', borderColor: 'blue.600', fontWeight: '600' }} borderBottom="3px" borderColor="transparent" mb="-2px" mr={6}>
                        Rejected ({rejectedCount})
                      </Tab>
                      <Tab _selected={{ color: 'blue.600', borderColor: 'blue.600', fontWeight: '600' }} borderBottom="3px" borderColor="transparent" mb="-2px" mr={6}>
                        Archived ({archivedCount})
                      </Tab>
                    </TabList>
                    <TabPanels>
                      {manageTabIds.map((status) => (
                        <TabPanel key={status} p={0}>
                          {manageFilteredProjects.length === 0 ? (
                            <Text textAlign="center" color="gray.500" mt={8}>
                              No projects found.
                            </Text>
                          ) : (
                            <VStack spacing={6} align="stretch">
                              {manageFilteredProjects.map((p) => {
                                const icon = (p.project_snaps || [])[0];
                                const screenshots = p.project_snaps || [];
                                const edits = getProjectEdits(p);
                                const isHighlighted = highlightedProjectId && Number(p.id) === Number(highlightedProjectId);
                                const statusLabel = (s) => {
                                  if (s === 'approved') return 'Approved';
                                  if (s === 'not_approved') return 'Not Approved';
                                  if (s === 'rejected') return 'Rejected';
                                  if (s === 'archived') return 'Archived';
                                  return s || 'Not Approved';
                                };
                                const displayStatus = statusLabel(edits.projectStatus);
                                return (
                                  <Box
                                    key={p.id}
                                    ref={isHighlighted ? highlightedProjectRef : null}
                                    p={{ base: 4, md: 6 }}
                                    borderRadius="xl"
                                    shadow={CARD_SHADOW}
                                    bg="white"
                                    borderWidth={isHighlighted ? '3px' : 0}
                                    borderColor="blue.500"
                                    borderStyle="solid"
                                    boxShadow={isHighlighted ? '0 0 0 3px rgba(49, 130, 206, 0.3), 0 1px 2px 0 rgba(60,64,67,.3)' : CARD_SHADOW}
                                    transition="all 0.3s ease"
                                  >
                                    <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
                                      {/* Thumbnail */}
                                      <Box w={{ base: '100%', md: '128px' }} h="128px" flexShrink={0} borderRadius="2xl" overflow="hidden" bg="gray.100" border="1px solid" borderColor="gray.100">
                                        {icon ? (
                                          <Image src={getFileUrl(icon)} w="100%" h="100%" objectFit="cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                        ) : (
                                          <Box w="100%" h="100%" bg="gray.200" />
                                        )}
                                      </Box>

                                      {/* Content */}
                                      <Box flex={1} minW={0}>
                                        {/* Title */}
                                        <Flex justify="space-between" align="flex-start" mb={1}>
                                          <Text fontSize="lg" fontWeight="600" color="gray.900">{p.title}</Text>
                                        </Flex>

                                        {/* USN • Genre tags */}
                                        <HStack spacing={2} mb={4} flexWrap="wrap">
                                          <Box px={3} py={1} borderRadius="lg" bg="gray.100" border="1px solid" borderColor="gray.200">
                                            <Text fontSize="sm" fontWeight="500" color="gray.600">{p.usn}</Text>
                                          </Box>
                                          <Box px={3} py={1} borderRadius="lg" bg="gray.100" border="1px solid" borderColor="gray.200">
                                            <Text fontSize="sm" fontWeight="500" color="gray.600">{p.genre || '—'}</Text>
                                          </Box>
                                        </HStack>

                                        {/* Action buttons: Like, Favorite, Full details, View Profile, Demo */}
                                        <HStack spacing={2} mb={4} flexWrap="wrap">
                                          <Tooltip label={p.is_liked ? 'Unlike' : 'Like'}>
                                            <Button
                                              size="xs"
                                              variant="outline"
                                              leftIcon={<Icon as={p.is_liked ? FaHeart : FaRegHeart} />}
                                              color={p.is_liked ? 'red.500' : 'gray.600'}
                                              borderColor="gray.300"
                                              _hover={{ bg: 'gray.50' }}
                                              onClick={(e) => { e.stopPropagation(); handleLike(p.id, e); }}
                                              isLoading={likingId === p.id}
                                            >
                                              Like
                                            </Button>
                                          </Tooltip>
                                          <Tooltip label={p.is_favorited ? 'Remove from favorites' : 'Add to favorites'}>
                                            <Button
                                              size="xs"
                                              variant="outline"
                                              leftIcon={<Icon as={p.is_favorited ? FaBookmark : FaRegBookmark} />}
                                              color={p.is_favorited ? 'orange.500' : 'gray.600'}
                                              borderColor="gray.300"
                                              _hover={{ bg: 'gray.50' }}
                                              onClick={(e) => { e.stopPropagation(); handleFavorite(p.id, e); }}
                                              isLoading={favoritingId === p.id}
                                            >
                                              Favorite
                                            </Button>
                                          </Tooltip>
                                          <Button
                                            size="xs"
                                            variant="outline"
                                            leftIcon={<ViewIcon />}
                                            borderColor="blue.200"
                                            bg="blue.50"
                                            color="blue.600"
                                            _hover={{ bg: 'blue.100', borderColor: 'blue.300' }}
                                            onClick={() => navigate(`/placement/gallery/project/${p.id}`)}
                                          >
                                            Full details
                                          </Button>
                                          <Button
                                            size="xs"
                                            variant="outline"
                                            leftIcon={<Icon as={FaUser} />}
                                            color="gray.600"
                                            borderColor="gray.300"
                                            _hover={{ bg: 'gray.50' }}
                                            onClick={() => navigate(`/placement/students/${encodeURIComponent(p.usn || '')}`)}
                                          >
                                            View Profile
                                          </Button>
                                          {p.hosted_link && (
                                            <Button as={Link} href={p.hosted_link} isExternal size="xs" variant="outline" leftIcon={<Icon as={FaExternalLinkAlt} />} color="gray.600" borderColor="gray.300" _hover={{ bg: 'gray.50' }}>
                                              Demo
                                            </Button>
                                          )}
                                          {p.github_repo && (
                                            <Button as={Link} href={p.github_repo} isExternal size="xs" variant="outline" leftIcon={<Icon as={FaGithub} />} color="gray.600" borderColor="gray.300" _hover={{ bg: 'gray.50' }}>
                                              Code
                                            </Button>
                                          )}
                                          <Tooltip label="Copy share link">
                                            <Button
                                              size="xs"
                                              variant="outline"
                                              leftIcon={<Icon as={FaLink} />}
                                              color="gray.600"
                                              borderColor="gray.300"
                                              _hover={{ bg: 'gray.50' }}
                                              onClick={(e) => { e.stopPropagation(); handleShareLink(p.id, e); }}
                                              isLoading={shareLoadingId === p.id}
                                            >
                                              Share
                                            </Button>
                                          </Tooltip>
                                        </HStack>

                                        {/* Views, Likes, Status | Dropdown + Save */}
                                        <Flex pt={4} borderTop="1px" borderColor="gray.100" flexWrap="wrap" justify="space-between" align="center" gap={4}>
                                          <HStack spacing={4} flexWrap="wrap">
                                            <Text fontSize="xs" color="gray.500">Views: <Text as="span" fontWeight="600" color="gray.700">{formatCount(p.views_count)}</Text></Text>
                                            <Text fontSize="xs" color="gray.500">Likes: <Text as="span" fontWeight="600" color="gray.700">{formatCount(p.likes_count)}</Text></Text>
                                            <Badge
                                              px={3}
                                              py={0.5}
                                              borderRadius="full"
                                              fontSize="xs"
                                              colorScheme={edits.projectStatus === 'approved' ? 'green' : edits.projectStatus === 'not_approved' ? 'orange' : edits.projectStatus === 'rejected' ? 'red' : 'gray'}
                                              variant="subtle"
                                            >
                                              {displayStatus}
                                            </Badge>
                                          </HStack>
                                          <HStack spacing={2}>
                                            <Menu>
                                              <MenuButton
                                                as={Button}
                                                size="sm"
                                                variant="outline"
                                                rightIcon={<Icon as={FaChevronDown} boxSize={3} />}
                                                minW="140px"
                                                borderColor="gray.300"
                                              >
                                                {displayStatus}
                                              </MenuButton>
                                              <MenuList>
                                                <MenuItem onClick={() => setProjectEdit(p.id, 'projectStatus', 'not_approved')}>Not Approved</MenuItem>
                                                <MenuItem onClick={() => setProjectEdit(p.id, 'projectStatus', 'approved')}>Approved</MenuItem>
                                                <MenuItem onClick={() => setProjectEdit(p.id, 'projectStatus', 'rejected')}>Rejected</MenuItem>
                                                <MenuItem onClick={() => setProjectEdit(p.id, 'projectStatus', 'archived')}>Archived</MenuItem>
                                              </MenuList>
                                            </Menu>
                                            <Button
                                              size="sm"
                                              bg="blue.600"
                                              color="white"
                                              _hover={{ bg: 'blue.700' }}
                                              onClick={() => handleSaveForProject(p)}
                                              isLoading={savingProjectId === p.id}
                                            >
                                              Save
                                            </Button>
                                          </HStack>
                                        </Flex>

                                        {/* Screenshots */}
                                        {screenshots.length > 0 && (
                                          <SimpleGrid columns={4} spacing={2} mt={4}>
                                            {[0, 1, 2, 3].map((i) => {
                                              const snap = screenshots[i] || null;
                                              return (
                                                <Box
                                                  key={i}
                                                  aspectRatio="16/9"
                                                  borderRadius="lg"
                                                  overflow="hidden"
                                                  bg="gray.200"
                                                  cursor={snap ? 'pointer' : 'default'}
                                                  onClick={snap ? () => navigate(`/placement/gallery/project/${p.id}`, { replace: false }) : undefined}
                                                  _hover={snap ? { opacity: 0.9 } : {}}
                                                  transition="opacity 0.2s"
                                                >
                                                  {snap ? (
                                                    <Image src={getFileUrl(snap)} w="100%" h="100%" objectFit="cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                                  ) : null}
                                                </Box>
                                              );
                                            })}
                                          </SimpleGrid>
                                        )}
                                      </Box>
                                    </Flex>
                                  </Box>
                                );
                              })}
                            </VStack>
                          )}
                        </TabPanel>
                      ))}
                    </TabPanels>
                  </Tabs>
                </Box>
          )}

          {/* EDIT/RATE MODAL */}
          <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            scrollBehavior="inside"
            isCentered
          >
            <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.300" />
            <ModalContent borderRadius="2xl" overflow="hidden">
              <ModalHeader borderBottom="1px" borderColor="gray.100" py={4}>
                <HStack>
                  <Text>Manage Project</Text>
                  {editingProject && (
                    <Badge colorScheme={editingProject.project_status === 'approved' ? 'green' : editingProject.project_status === 'archived' ? 'gray' : editingProject.project_status === 'not_approved' ? 'yellow' : 'red'}>
                      {editingProject.project_status || (editingProject.is_approved ? 'approved' : 'not approved')}
                    </Badge>
                  )}
                </HStack>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody py={6}>
                {editingProject && (
                  <VStack align="stretch" spacing={6}>
                    <Flex gap={4}>
                      <Box
                        w="120px"
                        h="80px"
                        borderRadius="lg"
                        overflow="hidden"
                        flexShrink={0}
                      >
                        {snaps.length > 0 ? (
                          <Image
                            src={getFileUrl(snaps[0])}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <Box w="100%" h="100%" bg="gray.100" />
                        )}
                      </Box>
                      <Box>
                        <Heading size="md">{editingProject.title}</Heading>
                        <Text color="gray.600" fontSize="sm">
                          {editingProject.usn}
                        </Text>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {editingProject.genre}
                        </Text>
                      </Box>
                    </Flex>

                    {/* Image gallery: 4 tiles (filled + empty transparent) */}
                    <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="600" mb={2} textTransform="uppercase">
                          Project images
                        </Text>
                        <SimpleGrid columns={4} spacing={3}>
                          {[0, 1, 2, 3].map((i) => {
                            const snap = snaps[i] || null;
                            return (
                              <Box
                                key={i}
                                aspectRatio="16/9"
                                borderRadius="xl"
                                overflow="hidden"
                                border="1px solid"
                                borderColor={snap ? 'gray.200' : 'transparent'}
                                bg={snap ? '#000' : 'transparent'}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
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
                                  <Box w="100%" h="100%" />
                                )}
                              </Box>
                            );
                          })}
                        </SimpleGrid>
                    </Box>

                    <Box bg="gray.50" p={4} borderRadius="xl">
                      <VStack spacing={4} align="stretch">
                        <FormControl display="flex" alignItems="center">
                          <FormLabel mb={0} fontSize="sm">
                            Archived
                          </FormLabel>
                          <Switch
                            isChecked={archiveMode}
                            onChange={(e) => {
                              setArchiveMode(e.target.checked);
                              if (e.target.checked) setIsApproved(false);
                            }}
                            colorScheme="gray"
                          />
                        </FormControl>
                        <FormControl display="flex" alignItems="center">
                          <FormLabel mb={0} fontSize="sm">
                            Approved
                          </FormLabel>
                          <Switch
                            isChecked={isApproved}
                            onChange={(e) => {
                              setIsApproved(e.target.checked);
                              if (e.target.checked) setArchiveMode(false);
                            }}
                            colorScheme="green"
                            isDisabled={archiveMode}
                          />
                        </FormControl>
                      </VStack>
                    </Box>
                  </VStack>
                )}
              </ModalBody>
              <ModalFooter
                bg="gray.50"
                borderTop="1px"
                borderColor="gray.100"
                flexWrap="wrap"
                gap={2}
              >
                {editingProject?.hosted_link && (
                  <Button
                    as={Link}
                    href={editingProject.hosted_link}
                    isExternal
                    leftIcon={<Icon as={FaExternalLinkAlt} />}
                    variant="outline"
                    colorScheme="green"
                    size="sm"
                    _hover={{ textDecoration: 'none' }}
                  >
                    Live demo
                  </Button>
                )}
                {editingProject?.github_repo && (
                  <Button
                    as={Link}
                    href={editingProject.github_repo}
                    isExternal
                    leftIcon={<Icon as={FaGithub} />}
                    variant="outline"
                    size="sm"
                    _hover={{ textDecoration: 'none' }}
                  >
                    Source code
                  </Button>
                )}
                <Button variant="ghost" mr="auto" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  bg={PLAY_GREEN}
                  _hover={{ bg: PLAY_GREEN_HOVER }}
                  color="white"
                  onClick={handleSave}
                  isLoading={saving}
                  leftIcon={<StarIcon />}
                >
                  Save approval
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* VIEW DETAIL MODAL */}
          <Modal
            isOpen={isDetailOpen}
            onClose={() => {
              onDetailClose();
              setSelectedDetailProject(null);
            }}
            size="xl"
            isCentered
            scrollBehavior="inside"
          >
            <ModalOverlay backdropFilter="blur(4px)" />
            <ModalContent borderRadius={CARD_RADIUS} overflow="hidden" maxH="90vh">
              <ModalHeader bg="white" borderBottom="1px" borderColor="gray.200" pb={4}>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between" align="start">
                    <Heading size="md" color="gray.800" noOfLines={2}>
                      {selectedDetailProject?.title}
                    </Heading>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    {selectedDetailProject?.usn} · {selectedDetailProject?.genre || '—'}
                  </Text>
                </VStack>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody py={4} overflowY="auto">
                {selectedDetailProject && (
                  <VStack align="stretch" spacing={6}>
                    {/* Image Gallery: 4 tiles (filled + empty transparent) like student view */}
                    <Box>
                      <Text fontSize="xs" color="gray.500" fontWeight="600" mb={2} textTransform="uppercase">
                        Project images
                      </Text>
                      <SimpleGrid columns={4} spacing={3}>
                        {[0, 1, 2, 3].map((i) => {
                          const snap = detailSnaps[i] || null;
                          return (
                            <Box
                              key={i}
                              aspectRatio="16/9"
                              borderRadius="xl"
                              overflow="hidden"
                              border="1px solid"
                              borderColor={snap ? 'gray.200' : 'transparent'}
                              bg={snap ? '#000' : 'transparent'}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {snap ? (
                                <Image
                                  src={getFileUrl(snap)}
                                  w="100%"
                                  h="100%"
                                  objectFit="contain"
                                  alt=""
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <Box w="100%" h="100%" />
                              )}
                            </Box>
                          );
                        })}
                      </SimpleGrid>
                    </Box>

                    {/* About */}
                    <Box>
                      <Text fontSize="xs" color="gray.500" fontWeight="600" mb={2} textTransform="uppercase">
                        About this project
                      </Text>
                      <Text color="gray.800" whiteSpace="pre-wrap" fontSize="sm" lineHeight="tall">
                        {selectedDetailProject.full_description || selectedDetailProject.one_line_description || 'No description.'}
                      </Text>
                    </Box>

                    {/* Stats */}
                    <Flex gap={6} flexWrap="wrap">
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="600">Views</Text>
                        <Text fontWeight="600" color="gray.800">{formatCount(selectedDetailProject.views_count)}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="600">Likes</Text>
                        <HStack>
                          <Icon as={FaHeart} color="red.500" />
                          <Text fontWeight="600" color="gray.800">{formatCount(selectedDetailProject.likes_count)}</Text>
                        </HStack>
                      </Box>
                    </Flex>

                    {/* Tech Stack */}
                    {detailTechList.length > 0 && (
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="600" mb={2} textTransform="uppercase">
                          Tech Stack
                        </Text>
                        <Wrap spacing={2}>
                          {detailTechList.map((t, i) => (
                            <WrapItem key={i}>
                              <Tag bg="gray.50" color="gray.800" borderRadius="full" size="sm" border="1px solid" borderColor="gray.200">
                                {t}
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}
                    
                     {selectedDetailProject.mentor_name && (
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="600">Mentor</Text>
                        <Text color="gray.800">{selectedDetailProject.mentor_name}</Text>
                      </Box>
                    )}
                  </VStack>
                )}
              </ModalBody>
              <ModalFooter bg="gray.50" borderTop="1px" borderColor="gray.200" flexWrap="wrap" gap={2}>
                {selectedDetailProject?.hosted_link && (
                  <Button
                    as={Link}
                    href={selectedDetailProject.hosted_link}
                    isExternal
                    leftIcon={<Icon as={FaExternalLinkAlt} />}
                    variant="outline"
                    borderColor={PLAY_GREEN}
                    color={PLAY_GREEN}
                    size="sm"
                    _hover={{ bg: PLAY_GREEN, color: 'white', textDecoration: 'none' }}
                  >
                    Live Demo
                  </Button>
                )}
                {selectedDetailProject?.github_repo && (
                  <Button
                    as={Link}
                    href={selectedDetailProject.github_repo}
                    isExternal
                    leftIcon={<Icon as={FaGithub} />}
                    variant="outline"
                    size="sm"
                    _hover={{ textDecoration: 'none' }}
                  >
                    Source Code
                  </Button>
                )}
                <Button
                  leftIcon={<Icon as={FaUser} />}
                  variant="outline"
                  size="sm"
                  colorScheme="teal"
                  onClick={() => {
                    onDetailClose();
                    navigate(`/placement/students/${selectedDetailProject?.usn}`);
                  }}
                >
                  View Student Profile
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default AdminProjects;
