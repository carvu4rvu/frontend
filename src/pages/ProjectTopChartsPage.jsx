import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  useToast,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { SearchIcon, ChevronLeftIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { buildPlacementNavState } from '../utils/placementNavigationHistory';
import { usePlacementBack } from '../hooks/usePlacementBack';
import PassThroughLayout from '../components/PassThroughLayout';
import { PlacementService } from '../services/placement.service';
import TopChartsList from '../components/projects/TopChartsList';
import { sortByTopChartsScore } from '../utils/projectShowcaseScoring';
import ProjectImageLightbox from '../components/projects/ProjectImageLightbox';
import { useProjectImageLightbox } from '../hooks/useProjectImageLightbox';

const PLAY_GREEN = '#01875f';
const PLAY_GREEN_HOVER = '#01704f';

/**
 * Full Top Charts page — ranked by likes with images.
 * Same props as ProjectsShowcasePage for layout + data fetch.
 */
export default function ProjectTopChartsPage({
  LayoutComponent,
  variant = 'admin',
  fetchProjects: fetchProjectsFn,
  projectBasePath,
}) {
  const Layout = LayoutComponent ?? PassThroughLayout;
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [likingId, setLikingId] = useState(null);
  const [favoritingId, setFavoritingId] = useState(null);
  const { openProjectImages, lightboxProps } = useProjectImageLightbox();

  const projectsBase = projectBasePath
    ?? (variant === 'admin' ? '/placement/gallery' : variant === 'company' ? '/company/projects' : '/placement/alumni-projects');
  const backPath =
    variant === 'admin' ? '/placement/gallery/showcase' : projectsBase;
  const { backLabel, goBack } = usePlacementBack(backPath);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjectsFn();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Failed to load projects', status: 'error', isClosable: true });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [fetchProjectsFn, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const rankedProjects = useMemo(() => {
    let list = [...projects];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const title = (p.title || '').toLowerCase();
        const usn = (p.usn || '').toLowerCase();
        const genre = (p.genre || p.category || '').toLowerCase();
        return `${title} ${usn} ${genre}`.includes(q);
      });
    }
    return sortByTopChartsScore(list);
  }, [projects, search]);

  const goToProjectDetail = (project, e) => {
    if (e) e.stopPropagation();
    if (project?.id) {
      const path = `${projectsBase}/project/${project.id}`;
      const navState = variant === 'admin' ? buildPlacementNavState(location) : undefined;
      navigate(path, navState ? { state: navState } : undefined);
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
    } catch {
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
    } catch {
      toast({ title: 'Failed to update like', status: 'error', isClosable: true });
    } finally {
      setLikingId(null);
    }
  };

  return (
    <Layout>
      <Box bg="#f8fafc" minH="100vh" py={{ base: 6, md: 8 }}>
        <Container maxW="container.lg">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronLeftIcon />}
            mb={4}
            color="gray.600"
            onClick={goBack}
          >
            {backLabel}
          </Button>

          <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={4} mb={6}>
            <Box>
              <Heading size="lg" fontWeight="800" color="gray.900">
                Top Charts
              </Heading>
              <Text color="gray.600" fontSize="sm" mt={1}>
                Projects ranked by likes. {rankedProjects.length} project{rankedProjects.length === 1 ? '' : 's'}.
              </Text>
            </Box>
            <InputGroup maxW={{ base: '100%', sm: '280px' }} size="sm">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                bg="white"
                borderRadius="lg"
              />
            </InputGroup>
          </Flex>

          {loading ? (
            <Flex justify="center" py={20}>
              <Spinner size="xl" color={PLAY_GREEN} thickness="4px" />
            </Flex>
          ) : rankedProjects.length === 0 ? (
            <Box bg="white" borderRadius="2xl" p={12} textAlign="center" borderWidth="1px" borderColor="gray.100">
              <Text color="gray.500">No projects to rank yet.</Text>
              <Button mt={4} size="sm" bg={PLAY_GREEN} color="white" _hover={{ bg: PLAY_GREEN_HOVER }} onClick={goBack}>
                Return to showcase
              </Button>
            </Box>
          ) : (
            <Box bg="white" borderRadius="2xl" p={{ base: 4, md: 6 }} borderWidth="1px" borderColor="gray.100" shadow="sm">
              <TopChartsList
                projects={rankedProjects}
                mode="full"
                onViewProject={goToProjectDetail}
                onOpenProjectImages={openProjectImages}
                onLike={handleLike}
                onFavorite={handleFavorite}
                likingId={likingId}
                favoritingId={favoritingId}
              />
            </Box>
          )}
        </Container>
      </Box>
      <ProjectImageLightbox {...lightboxProps} />
    </Layout>
  );
}
