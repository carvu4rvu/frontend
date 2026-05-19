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
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Image,
  Flex,
  Tag,
  Icon,
  IconButton,
  Tooltip,
  SimpleGrid,
  Wrap,
  WrapItem,
  Link,
  Badge,
} from '@chakra-ui/react';
import { ViewIcon, SearchIcon, StarIcon } from '@chakra-ui/icons';
import { FaExternalLinkAlt, FaGithub, FaChevronLeft, FaChevronRight, FaUser, FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaLink, FaComment } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { PlacementService } from '../services/placement.service';
import { getFileUrl } from '../utils/fileUrl';
import { getShowcasePreviewImage, getShowcaseGalleryStrip, MAX_GALLERY_IMAGES } from '../utils/projectSnaps';
import TopChartsList from '../components/projects/TopChartsList';

const PLAY_GREEN = '#01875f';
const PLAY_GREEN_HOVER = '#01704f';
const CARD_RADIUS = '16px';
const CARD_SHADOW = '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)';
const colors = { accent: '#01875f', dark: '#1e293b', secondary: '#64748b', cardBg: '#f8fafc', border: '#e2e8f0' };

function formatCount(n) {
  if (n == null) return '0';
  const num = Number(n);
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

/**
 * Universal Projects Showcase page – same UI for admin (placement/gallery/showcase) and alumni (placement/alumni-projects).
 * Pass LayoutComponent (AdminLayout or AlumniLayout), variant ('admin' | 'alumni'), and fetchProjects (async () => projects[]).
 */
export default function ProjectsShowcasePage({ LayoutComponent, variant = 'admin', fetchProjects: fetchProjectsFn, projectBasePath, hideViewStudent = false }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showcaseFilter, setShowcaseFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [likingId, setLikingId] = useState(null);
  const [favoritingId, setFavoritingId] = useState(null);
  const [shareLoadingId, setShareLoadingId] = useState(null);
  const heroCarouselRef = useRef(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjectsFn();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({ title: 'Failed to load projects', status: 'error', isClosable: true });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [fetchProjectsFn, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const title = (p.title || '').toLowerCase();
      const usn = (p.usn || '').toLowerCase();
      const genre = (p.genre || p.category || '').toLowerCase();
      const tech = Array.isArray(p.technologies) ? p.technologies.join(' ').toLowerCase() : String(p.technologies || '').toLowerCase();
      return `${title} ${usn} ${genre} ${tech}`.includes(q);
    });
  }, [projects, search]);

  const favoriteProjects = useMemo(() => projects.filter((p) => p.is_favorited), [projects]);

  const showcaseDisplayProjects = useMemo(() => {
    let list = showcaseFilter === 'favorites' ? favoriteProjects : filteredProjects;
    if (variant === 'admin') {
      if (visibilityFilter === 'public') {
        list = list.filter((p) => String(p.visibility || '').toUpperCase() === 'PUBLIC');
      } else if (visibilityFilter === 'private') {
        list = list.filter((p) => String(p.visibility || 'PRIVATE').toUpperCase() !== 'PUBLIC');
      }
    }
    return list;
  }, [showcaseFilter, favoriteProjects, filteredProjects, visibilityFilter, variant]);

  const publicCount = useMemo(
    () => projects.filter((p) => String(p.visibility || '').toUpperCase() === 'PUBLIC').length,
    [projects]
  );
  const featuredProjects = useMemo(() => showcaseDisplayProjects.slice(0, 6), [showcaseDisplayProjects]);
  const topByLikes = useMemo(
    () => [...showcaseDisplayProjects].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 6),
    [showcaseDisplayProjects]
  );
  const scrollHero = (direction) => {
    const el = heroCarouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth + 16;
    el.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
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
    } catch (err) {
      toast({ title: 'Failed to update like', status: 'error', isClosable: true });
    } finally {
      setLikingId(null);
    }
  };

  const projectsBase = projectBasePath ?? (variant === 'admin' ? '/placement/gallery' : variant === 'company' ? '/company/projects' : '/placement/alumni-projects');
  const topChartsPath =
    variant === 'admin' ? '/placement/gallery/top-charts' : `${projectsBase}/top-charts`;
  const goToProjectDetail = (project, e) => {
    if (e) e.stopPropagation();
    if (project?.id) {
      navigate(`${projectsBase}/project/${project.id}`);
    }
  };

  const goToManageProject = (project) => {
    const norm = (s) => {
      if (s === 'draft' || s === 'submitted') return 'not_approved';
      return s || (project.is_approved ? 'approved' : 'not_approved');
    };
    const status = norm(project.project_status || (project.is_approved ? 'approved' : 'not_approved'));
    navigate(`/placement/gallery/manage?project=${project.id}&tab=${status}`);
  };

  const studentLink = (usn) => {
    if (variant === 'admin') return `/placement/students/${encodeURIComponent(usn || '')}`;
    if (variant === 'company') return `/company/student/${encodeURIComponent(usn || '')}`;
    return `/placement/alumni-student/${encodeURIComponent(usn || '')}`;
  };

  const isAdmin = variant === 'admin';

  if (loading && projects.length === 0) {
    return (
      <LayoutComponent>
        <Box py={16} display="flex" justifyContent="center" alignItems="center">
          <Spinner size="xl" color={PLAY_GREEN} thickness="3px" />
        </Box>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent>
      <Box bg="#f0f0f0" minH="100vh" py={6} color="gray.800">
        <Container maxW="6xl">
          <Heading size="lg" mb={variant === 'company' ? 1 : 6} color="gray.800" fontFamily="inherit">
            {variant === 'company' ? 'Student Projects' : 'Showcase Projects'}
          </Heading>
          {variant === 'company' && (
            <Text mb={6} color="gray.600" fontSize="sm">
              Projects from students who have registered to your placement drives.
            </Text>
          )}
          {variant === 'alumni' && (
            <Text mb={6} color="gray.600" fontSize="sm">
              Showing approved projects marked <strong>Public</strong> by students ({showcaseDisplayProjects.length} visible).
              Private projects stay hidden until the student sets visibility to Public.
            </Text>
          )}
          {variant === 'admin' && (
            <Text mb={4} color="gray.600" fontSize="sm">
              Manage all projects. Alumni showcase lists approved + public only ({publicCount} public of {projects.length} total).
            </Text>
          )}

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
            <HStack spacing={2} ml={{ md: 'auto' }} flexWrap="wrap">
              {variant === 'admin' && (
                <>
                  <Button
                    size="sm"
                    variant={visibilityFilter === 'all' ? 'solid' : 'outline'}
                    colorScheme={visibilityFilter === 'all' ? 'teal' : 'gray'}
                    onClick={() => setVisibilityFilter('all')}
                  >
                    All visibility
                  </Button>
                  <Button
                    size="sm"
                    variant={visibilityFilter === 'public' ? 'solid' : 'outline'}
                    colorScheme={visibilityFilter === 'public' ? 'green' : 'gray'}
                    onClick={() => setVisibilityFilter('public')}
                  >
                    Public
                  </Button>
                  <Button
                    size="sm"
                    variant={visibilityFilter === 'private' ? 'solid' : 'outline'}
                    colorScheme={visibilityFilter === 'private' ? 'gray' : 'gray'}
                    onClick={() => setVisibilityFilter('private')}
                  >
                    Private
                  </Button>
                </>
              )}
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
                  <Button size="sm" variant="outline" borderRadius="full" borderColor="gray.200" onClick={() => scrollHero(-1)} _hover={{ bg: 'gray.50' }}>
                    <Icon as={FaChevronLeft} boxSize={3} />
                  </Button>
                  <Button size="sm" variant="outline" borderRadius="full" borderColor="gray.200" onClick={() => scrollHero(1)} _hover={{ bg: 'gray.50' }}>
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
                  const heroImg = getShowcasePreviewImage(p);
                  const icon = getShowcasePreviewImage(p);
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
                        <Box w="100%" h="100%" aspectRatio="16/9" bg="gray.200" borderRadius="2xl" />
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
                      <Box position="absolute" bottom={{ base: 5, md: 8 }} left={{ base: 5, md: 8 }} right={6} color="white" maxW={{ base: 'sm', md: 'lg' }}>
                        <HStack align="flex-start" spacing={4} mb={3}>
                          {icon ? (
                            <Image
                              src={getFileUrl(icon)}
                              w={{ base: 14, md: 16 }}
                              h={{ base: 14, md: 16 }}
                              borderRadius="xl"
                              border="2px solid"
                              borderColor="whiteAlpha.400"
                              shadow="xl"
                              objectFit="cover"
                              flexShrink={0}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <Box w={{ base: 14, md: 16 }} h={{ base: 14, md: 16 }} borderRadius="xl" bg="whiteAlpha.300" flexShrink={0} />
                          )}
                          <Box minW={0}>
                            <Text fontWeight="bold" fontSize={{ base: 'xl', md: '2xl' }} lineHeight="short">
                              {p.title}
                            </Text>
                            <Text fontSize={{ base: 'sm', md: 'md' }} opacity={0.92} mt={0.5}>
                              {p.usn} • {p.genre || p.category || '—'}
                            </Text>
                          </Box>
                        </HStack>
                        <Text fontSize={{ base: 'sm', md: 'md' }} noOfLines={2} opacity={0.88} display={{ base: 'none', md: 'block' }} mb={3} lineHeight="tall">
                          {desc}
                        </Text>
                        <Button
                          size={{ base: 'sm', md: 'md' }}
                          colorScheme="whiteAlpha"
                          bg="whiteAlpha.900"
                          color="gray.800"
                          fontWeight="semibold"
                          px={{ base: 4, md: 5 }}
                          _hover={{ bg: 'white' }}
                          leftIcon={<ViewIcon boxSize={{ base: 4, md: 5 }} />}
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
                    onClick={() => navigate(topChartsPath)}
                  >
                    View more
                  </Button>
                </Flex>
                <TopChartsList
                  projects={topByLikes}
                  mode="preview"
                  onViewProject={goToProjectDetail}
                />
              </Box>
            </Box>
          )}

          {/* Section 3: Main feed */}
          <Box>
            <Flex justify="space-between" align="center" mb={6}>
              <Heading size="md" fontWeight="bold">
                {showcaseFilter === 'favorites' ? 'My Favorites' : 'All Projects'}
              </Heading>
            </Flex>

            {showcaseDisplayProjects.length === 0 ? (
              <Box bg="white" borderRadius={CARD_RADIUS} p={12} textAlign="center" shadow={CARD_SHADOW}>
                <Text color="gray.500" fontSize="lg">
                  {showcaseFilter === 'favorites'
                    ? 'No favorited projects yet. Click the bookmark icon on any project to add it to your favorites.'
                    : projects.length === 0
                      ? (variant === 'company'
                        ? 'No student projects yet. Projects from students who register to your placement drives will appear here.'
                        : variant === 'alumni'
                          ? 'No public approved projects yet. Students can set a project to Public in their profile after it is approved.'
                          : 'No projects found.')
                      : 'No projects match your search. Try different keywords.'}
                </Text>
              </Box>
            ) : (
              <VStack spacing={12} align="stretch">
                {showcaseDisplayProjects.map((p) => {
                  const icon = getShowcasePreviewImage(p);
                  const screenshots = getShowcaseGalleryStrip(p);
                  const desc = p.full_description || p.one_line_description || 'No description.';
                  return (
                    <Box key={p.id} p={5} borderRadius={CARD_RADIUS} shadow={CARD_SHADOW} bg="white">
                      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} flexWrap="wrap" mb={2}>
                        <HStack align="center" spacing={4} flex={1} minW={0}>
                          {icon ? (
                            <Box boxSize="64px" flexShrink={0} borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.100">
                              <Image src={getFileUrl(icon)} w="100%" h="100%" objectFit="cover" onError={(e) => { e.target.style.display = 'none'; }} />
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
                            <HStack spacing={2} mt={0.5} flexWrap="wrap">
                              <Text color="gray.500" fontSize="xs">
                                {p.genre || p.category || '—'}
                              </Text>
                              <Badge
                                size="sm"
                                colorScheme={String(p.visibility || '').toUpperCase() === 'PUBLIC' ? 'green' : 'gray'}
                                variant="subtle"
                              >
                                {String(p.visibility || 'PRIVATE').toUpperCase() === 'PUBLIC' ? 'Public' : 'Private'}
                              </Badge>
                              {String(p.project_status || '').toLowerCase() !== 'approved' && (
                                <Badge size="sm" colorScheme="orange" variant="subtle">
                                  {p.project_status || 'pending'}
                                </Badge>
                              )}
                            </HStack>
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
                          {!hideViewStudent && (
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<Icon as={FaUser} />}
                              color="gray.600"
                              borderColor="gray.300"
                              _hover={{ bg: 'gray.50' }}
                              onClick={(e) => { e.stopPropagation(); navigate(studentLink(p.usn)); }}
                            >
                              View Student
                            </Button>
                          )}
                          {isAdmin && (
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
                          )}
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
                          {isAdmin && (
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
                          )}
                        </HStack>
                      </Flex>

                      <Flex gap={8} py={3} overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                        <Box as="button" type="button" textAlign="center" minW={14} cursor="pointer" border="none" bg="transparent" p={0} _hover={{ color: 'blue.600' }} _focus={{ outline: 'none', boxShadow: 'none' }} _active={{ outline: 'none' }} onClick={(e) => { e.stopPropagation(); goToProjectDetail(p, e); }} title="View project">
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

                      <Text color="gray.600" fontSize="sm" lineHeight="relaxed" noOfLines={{ base: 2, md: 3 }}>
                        {desc}
                      </Text>

                      {screenshots.length > 0 && (
                        <SimpleGrid columns={4} spacing={3} py={2}>
                          {Array.from({ length: MAX_GALLERY_IMAGES }, (_, i) => i).map((i) => {
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
                                  <Image src={getFileUrl(snap)} w="100%" h="100%" objectFit="contain" onError={(e) => { e.target.style.display = 'none'; }} />
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
        </Container>
      </Box>

    </LayoutComponent>
  );
}
