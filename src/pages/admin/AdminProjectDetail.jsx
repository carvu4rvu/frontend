import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Spinner,
  useToast,
  HStack,
  VStack,
  Badge,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  Icon,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  useDisclosure as useAlertDisclosure,
  Switch,
  Divider,
  Link,
  Wrap,
  WrapItem,
  Tag,
  SimpleGrid,
  Avatar,
} from '@chakra-ui/react';
import { ViewIcon, StarIcon, SearchIcon } from '@chakra-ui/icons';
import { FaExternalLinkAlt, FaGithub, FaUser, FaChevronLeft, FaChevronDown, FaTrash, FaPlus, FaLink } from 'react-icons/fa';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';
import { getFileUrl } from '../../utils/fileUrl';

const BLUE_ACCENT = '#1a73e8';
const CARD_RADIUS = '16px';
const STATUS_PILL = { px: 3, py: 0.5, borderRadius: 'full', fontSize: 'xs', fontWeight: 500 };

export default function AdminProjectDetail({ variant = 'admin', LayoutComponent = AdminLayout, backPath: backPathProp, fetchProjectById: fetchProjectByIdProp }) {
  const { projectId } = useParams();
  const location = useLocation();
  const toast = useToast();
  const navigate = useNavigate();
  const isAlumni = variant === 'alumni';
  const isCompany = variant === 'company';
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [archiveMode, setArchiveMode] = useState(false);
  const urlParams = new URLSearchParams(location.search || '');
  const tabFromUrl = urlParams.get('tab');
  const addReviewFromUrl = urlParams.get('addReview') === '1';
  const reviewsTabIndex = isAlumni ? 1 : 2;
  const initialTab = tabFromUrl === 'reviews' ? reviewsTabIndex : 0;
  const [activeTab, setActiveTab] = useState(initialTab);
  const { isOpen: isAddAssetOpen, onOpen: onAddAssetOpen, onClose: onAddAssetClose } = useDisclosure();
  const { isOpen: isShareLinkOpen, onOpen: onShareLinkOpen, onClose: onShareLinkClose } = useDisclosure();
  const { isOpen: isAddReviewOpen, onOpen: onAddReviewOpen, onClose: onAddReviewClose } = useDisclosure();
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetRole, setNewAssetRole] = useState('GALLERY');
  const [shareLinkHours, setShareLinkHours] = useState(168);
  const [newReviewText, setNewReviewText] = useState('');
  const [addingReview, setAddingReview] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useAlertDisclosure();
  const [deleteTarget, setDeleteTarget] = useState({ type: null, id: null, assetId: null, variantId: null });
  const viewRecordedRef = useRef(false);
  const addReviewOpenedRef = useRef(false);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setLoadError(null);
    try {
      let data;
      if (fetchProjectByIdProp) {
        data = await fetchProjectByIdProp(projectId);
      } else if (isAlumni) {
        data = await PlacementService.getAlumniProjectById(projectId);
      } else {
        data = await PlacementService.getProjectById(projectId);
      }
      setProject(data);
      setIsApproved(data?.project_status === 'approved');
      setArchiveMode(data?.project_status === 'archived');
    } catch (err) {
      setLoadError(err);
      toast({ title: err?.response?.status === 404 ? 'Project not found' : 'Failed to load project', status: 'error', isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast, isAlumni, fetchProjectByIdProp]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // When URL has tab=reviews, keep activeTab on Reviews (in case state was 0 on first render)
  useEffect(() => {
    if (tabFromUrl === 'reviews') setActiveTab(reviewsTabIndex);
  }, [tabFromUrl, reviewsTabIndex]);

  // When URL has addReview=1 and project is loaded, open the add-review modal once (e.g. from showcase "Add Review" button)
  useEffect(() => {
    if (!addReviewFromUrl || !project?.id || addReviewOpenedRef.current) return;
    addReviewOpenedRef.current = true;
    onAddReviewOpen();
    const params = new URLSearchParams(location.search);
    params.delete('addReview');
    const newSearch = params.toString();
    navigate({ pathname: location.pathname, search: newSearch ? `?${newSearch}` : '' }, { replace: true });
  }, [addReviewFromUrl, project?.id, location.search, location.pathname, navigate, onAddReviewOpen]);

  // Record a unique view when project detail is successfully loaded (counts as viewing the project)
  useEffect(() => {
    if (!projectId || !project?.id || viewRecordedRef.current) return;
    viewRecordedRef.current = true;
    PlacementService.incrementProjectView(projectId)
      .then((data) => {
        if (data?.views != null) {
          setProject((p) => (p ? { ...p, views_count: data.views, metrics: { ...(p.metrics || {}), views: data.views } } : p));
        }
      })
      .catch(() => {});
  }, [projectId, project?.id]);

  const handleSaveStatus = async () => {
    if (!project?.id) return;
    setSaving(true);
    try {
      const status = archiveMode ? 'archived' : (isApproved ? 'approved' : 'rejected');
      await PlacementService.updateProject(project.id, { is_approved: isApproved, project_status: status });
      toast({ title: 'Project updated', status: 'success', isClosable: true });
      setProject((p) => ({ ...p, project_status: status, metrics: { ...p.metrics } }));
    } catch (err) {
      toast({ title: err.message || 'Update failed', status: 'error', isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAsset = async () => {
    if (!project?.id || !newAssetUrl.trim()) return;
    try {
      await PlacementService.addProjectAsset(project.id, {
        original_url: newAssetUrl.trim(),
        asset_type: 'IMAGE',
        asset_role: newAssetRole,
      });
      toast({ title: 'Asset added', status: 'success', isClosable: true });
      setNewAssetUrl('');
      onAddAssetClose();
      fetchProject();
    } catch (err) {
      toast({ title: err.message || 'Failed to add asset', status: 'error', isClosable: true });
    }
  };

  const handleDeleteAsset = (assetId) => {
    setDeleteTarget({ type: 'asset', id: assetId, assetId });
    onDeleteOpen();
  };

  const handleDeleteVariant = (assetId, variantId) => {
    setDeleteTarget({ type: 'variant', id: variantId, assetId, variantId });
    onDeleteOpen();
  };

  const handleDeleteReview = (reviewId) => {
    setDeleteTarget({ type: 'review', id: reviewId });
    onDeleteOpen();
  };

  const handleDeleteShareLink = (linkId) => {
    setDeleteTarget({ type: 'shareLink', id: linkId });
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    const { type, id, assetId, variantId } = deleteTarget;
    if (!type || !id) return;
    setDeletingId(id);
    try {
      if (type === 'asset') {
        await PlacementService.deleteProjectAsset(project.id, id);
        toast({ title: 'Asset deleted', status: 'success', isClosable: true });
      } else if (type === 'variant') {
        await PlacementService.deleteProjectAssetVariant(project.id, assetId, id);
        toast({ title: 'Variant deleted', status: 'success', isClosable: true });
      } else if (type === 'review') {
        await PlacementService.deleteProjectReview(project.id, id);
        toast({ title: 'Review deleted', status: 'success', isClosable: true });
      } else if (type === 'shareLink') {
        await PlacementService.deleteProjectShareLink(project.id, id);
        toast({ title: 'Share link deleted', status: 'success', isClosable: true });
      }
      fetchProject();
    } catch (err) {
      toast({ title: err.message || 'Delete failed', status: 'error', isClosable: true });
    } finally {
      setDeletingId(null);
      onDeleteClose();
      setDeleteTarget({ type: null, id: null, assetId: null, variantId: null });
    }
  };

  const handleAddReview = async () => {
    if (!project?.id || !newReviewText.trim()) return;
    setAddingReview(true);
    try {
      if (isAlumni) {
        await PlacementService.addProjectReviewPublic(project.id, newReviewText.trim());
        toast({ title: 'Review added', status: 'success', isClosable: true });
        setNewReviewText('');
        onAddReviewClose();
        fetchProject();
      } else {
        const review = await PlacementService.addProjectReview(project.id, newReviewText.trim());
        setProject((p) => ({
          ...p,
          reviews: [review, ...(p.reviews || [])],
          metrics: { ...p.metrics, comments: (p.metrics?.comments ?? 0) + 1 },
        }));
        toast({ title: 'Review added', status: 'success', isClosable: true });
        setNewReviewText('');
        onAddReviewClose();
      }
    } catch (err) {
      toast({ title: err.message || 'Failed to add review', status: 'error', isClosable: true });
    } finally {
      setAddingReview(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!project?.id) return;
    try {
      const link = await PlacementService.createProjectShareLink(project.id, shareLinkHours);
      toast({ title: 'Share link created', status: 'success', isClosable: true });
      setProject((p) => ({
        ...p,
        share_links: [link, ...(p.share_links || [])],
      }));
      onShareLinkClose();
    } catch (err) {
      toast({ title: err.message || 'Failed to create share link', status: 'error', isClosable: true });
    }
  };

  const backPath = backPathProp ?? (isCompany ? '/company/projects' : isAlumni ? '/placement/alumni-projects' : '/placement/gallery/manage');
  const backLabel = backPathProp ? 'Back to Student Projects' : (isCompany || isAlumni ? 'Back to Student Projects' : 'Back to Manage Projects');

  if (loading && !project) {
    return (
      <LayoutComponent>
        <Box py={16} display="flex" justifyContent="center" alignItems="center">
          <Spinner size="xl" color="blue.500" thickness="3px" />
        </Box>
      </LayoutComponent>
    );
  }

  if (loadError || !project) {
    const is404 = loadError?.response?.status === 404;
    return (
      <LayoutComponent>
        <Box bg="#f0f0f0" minH="100vh" py={12}>
          <Container maxW="md">
            <VStack spacing={6} align="stretch" bg="white" p={8} borderRadius="xl" shadow="md">
              <Heading size="lg" color="gray.800">
                {is404 ? 'Project Not Found' : 'Something went wrong'}
              </Heading>
              <Text color="gray.600">
                {is404
                  ? 'The project you are looking for does not exist or has been removed.'
                  : loadError?.message || 'An unexpected error occurred while loading this project.'}
              </Text>
              <Button
                leftIcon={<Icon as={FaChevronLeft} />}
                colorScheme="blue"
                onClick={() => navigate(backPath)}
              >
                {backLabel}
              </Button>
            </VStack>
          </Container>
        </Box>
      </LayoutComponent>
    );
  }

  const snaps = project.project_snaps || [];
  const assets = project.assets || [];
  const reviews = project.reviews || [];
  const shareLinks = project.share_links || [];
  const metrics = project.metrics || {};

  return (
    <LayoutComponent>
      <Box bg="#f8f9fa" minH="100vh" py={6} color="gray.800">
        <Container maxW="6xl">
          <Button
            variant="ghost"
            leftIcon={<Icon as={FaChevronLeft} />}
            mb={4}
            color="gray.800"
            _hover={{ bg: 'gray.100', color: 'gray.900' }}
            onClick={() => navigate(backPath)}
          >
            {backLabel}
          </Button>

          {/* Header: Blue gradient + overlapping image (matches reference) */}
          <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" overflow="hidden" mb={6} boxShadow="sm">
            <Box h="140px" bgGradient="linear(to-r, blue.500, indigo.600)" position="relative">
              <Flex position="absolute" bottom="-36px" left={6} align="flex-end" gap={6}>
                <Box w="120px" h="120px" bg="white" p={1.5} borderRadius="2xl" shadow="lg" flexShrink={0}>
                  {snaps[0] ? (
                    <Image src={getFileUrl(snaps[0])} w="100%" h="100%" objectFit="cover" borderRadius="xl" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Box w="100%" h="100%" bg="gray.100" borderRadius="xl" />
                  )}
                </Box>
                <Box mb={3}>
                  <Heading size="lg" color="gray.900" fontWeight="bold" mb={0.5}>{project.title}</Heading>
                  <HStack spacing={3} align="center">
                    <Text color="gray.800" fontSize="sm">{project.owner_usn} • {project.category || '—'}</Text>
                    <Badge
                      px={3}
                      py={0.5}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight={500}
                      bg={
                        project.project_status === 'approved'
                          ? 'green.200'
                          : project.project_status === 'rejected'
                          ? 'red.200'
                          : project.project_status === 'archived'
                          ? 'gray.200'
                          : 'amber.200'
                      }
                      color={
                        project.project_status === 'approved'
                          ? 'green.800'
                          : project.project_status === 'rejected'
                          ? 'red.800'
                          : project.project_status === 'archived'
                          ? 'gray.800'
                          : 'amber.800'
                      }
                    >
                      {(project.project_status || 'not_approved').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </HStack>
                </Box>
              </Flex>
            </Box>
            <Box pt={12} px={8} pb={6} bg="white">
              <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={6}>
                <HStack spacing={6} flexWrap="wrap" divider={<Divider orientation="vertical" h={8} borderColor="gray.200" />}>
                  <Box px={4}>
                    <Text fontSize="xs" color="gray.700" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">Views</Text>
                    <Text fontSize="xl" fontWeight="bold" color="gray.900">{metrics.views ?? 0}</Text>
                  </Box>
                  <Box px={4}>
                    <Text fontSize="xs" color="gray.700" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">Likes</Text>
                    <Text fontSize="xl" fontWeight="bold" color="gray.900">{metrics.likes ?? 0}</Text>
                  </Box>
                  <Box px={4}>
                    <Text fontSize="xs" color="gray.700" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">Favorites</Text>
                    <Text fontSize="xl" fontWeight="bold" color="gray.900">{metrics.favorites ?? 0}</Text>
                  </Box>
                </HStack>
                {!isAlumni && (
                  <HStack spacing={4} flexWrap="wrap" align="center">
                    <Select
                      size="sm"
                      maxW="130px"
                      value={archiveMode ? 'archived' : (isApproved ? 'approved' : (project.project_status === 'rejected' ? 'rejected' : 'not_approved'))}
                      onChange={(e) => {
                        const v = e.target.value;
                        setArchiveMode(v === 'archived');
                        setIsApproved(v === 'approved');
                      }}
                      borderColor="gray.300"
                      borderRadius="lg"
                      fontSize="sm"
                      color="gray.800"
                      _hover={{ borderColor: 'gray.400' }}
                    >
                      <option value="not_approved">Not Approved</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="archived">Archived</option>
                    </Select>
                    <Button size="sm" bg="blue.600" color="white" _hover={{ bg: 'blue.700' }} onClick={handleSaveStatus} isLoading={saving}>
                      Save Status
                    </Button>
                  </HStack>
                )}
              </Flex>
            </Box>
          </Box>

          <Box bg="white" borderRadius={CARD_RADIUS} shadow="sm" p={6}>
            <Tabs index={activeTab} onChange={setActiveTab} variant="line" colorScheme="blue">
              <TabList mb={6} borderBottom="2px" borderColor="gray.200" gap={0}>
                <Tab px={8} py={4} fontSize="sm" fontWeight="medium" color="gray.700" _selected={{ color: 'blue.600', borderColor: 'blue.600' }}>Overview</Tab>
                {!isAlumni && <Tab px={8} py={4} fontSize="sm" fontWeight="medium" color="gray.700" _selected={{ color: 'blue.600', borderColor: 'blue.600' }}>Assets & Variants</Tab>}
                <Tab px={8} py={4} fontSize="sm" fontWeight="medium" color="gray.700" _selected={{ color: 'blue.600', borderColor: 'blue.600' }}>Reviews</Tab>
                {!isAlumni && <Tab px={8} py={4} fontSize="sm" fontWeight="medium" color="gray.700" _selected={{ color: 'blue.600', borderColor: 'blue.600' }}>Share Links</Tab>}
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
                  <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
                    <VStack align="stretch" spacing={6} gridColumn={{ base: 1, lg: '1 / 3' }}>
                      <Box bg="white" p={6} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
                        <Heading size="sm" mb={4} color="gray.900">Description</Heading>
                        <Text whiteSpace="pre-wrap" fontSize="sm" color="gray.700" lineHeight="tall">{project.description || project.short_description || '—'}</Text>
                      </Box>
                      {snaps.length > 0 && (
                        <Box bg="white" p={6} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
                          <Heading size="sm" mb={4} color="gray.900">Screenshots</Heading>
                          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                            {snaps.map((url, i) => (
                              <Box key={i} borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.100" aspectRatio="16/9">
                                <Image src={getFileUrl(url)} w="100%" h="100%" objectFit="cover" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                              </Box>
                            ))}
                          </SimpleGrid>
                        </Box>
                      )}
                    </VStack>
                    <VStack align="stretch" spacing={6} gridColumn={{ base: 1, lg: 3 }}>
                      <Box bg="white" p={6} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
                        <Heading size="sm" mb={4} color="gray.900">Tech Stack</Heading>
                        <Wrap spacing={2}>
                          {(project.tech_stack || project.tags || []).slice(0, 10).map((t, i) => (
                            <WrapItem key={i}>
                              <Tag size="sm" bg="blue.50" color="blue.700" borderWidth="1px" borderColor="blue.100" borderRadius="lg" px={3} py={1.5}>
                                {typeof t === 'string' ? t : t.name || t}
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                        {(!project.tech_stack?.length && !project.tags?.length) && <Text color="gray.600" fontSize="sm">—</Text>}
                      </Box>
                      <Box bg="white" p={6} borderRadius="2xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
                        <Heading size="sm" mb={4} color="gray.900">Project Details</Heading>
                        <VStack align="stretch" spacing={0} divider={<Divider />}>
                          <Flex justify="space-between" py={2}>
                            <Text fontSize="sm" color="gray.700">Mentor</Text>
                            <Text fontSize="sm" fontWeight="medium" color="gray.900">{project.mentor_name || '—'}</Text>
                          </Flex>
                          <Flex justify="space-between" py={2}>
                            <Text fontSize="sm" color="gray.700">Category</Text>
                            <Text fontSize="sm" fontWeight="medium" color="gray.900">{project.category || '—'}</Text>
                          </Flex>
                          <Flex justify="space-between" py={2}>
                            <Text fontSize="sm" color="gray.700">Submission Date</Text>
                            <Text fontSize="sm" fontWeight="medium" color="gray.900">
                              {project.submitted_at ? new Date(project.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </Text>
                          </Flex>
                        </VStack>
                        <HStack mt={4} spacing={2} flexWrap="wrap">
                          <Button
                            size="xs"
                            variant="outline"
                            leftIcon={<Icon as={FaUser} />}
                            onClick={() => navigate(isCompany ? `/company/student/${encodeURIComponent(project.owner_usn)}` : isAlumni ? `/placement/alumni-student/${encodeURIComponent(project.owner_usn)}` : `/placement/students/${project.owner_usn}`)}
                          >
                            View Student
                          </Button>
                          {project.hosted_url && (
                            <Button as={Link} href={project.hosted_url} isExternal size="xs" variant="outline" leftIcon={<Icon as={FaExternalLinkAlt} />}>
                              Demo
                            </Button>
                          )}
                          {project.github_url && (
                            <Button as={Link} href={project.github_url} isExternal size="xs" variant="outline" leftIcon={<Icon as={FaGithub} />}>
                              Code
                            </Button>
                          )}
                        </HStack>
                      </Box>
                    </VStack>
                  </SimpleGrid>
                </TabPanel>

                {!isAlumni && (
                <TabPanel p={0}>
                  <VStack align="stretch" spacing={6}>
                    <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                      <Heading size="md" fontWeight="bold" color="gray.900">Project Assets ({assets.length})</Heading>
                      <Button size="sm" leftIcon={<Icon as={FaPlus} />} bg="blue.600" color="white" _hover={{ bg: 'blue.700' }} onClick={onAddAssetOpen}>
                        Add Asset
                      </Button>
                    </Flex>

                    {assets.length === 0 ? (
                      <Text color="gray.700" fontSize="sm">No assets. Add one to display project images.</Text>
                    ) : (
                      <VStack align="stretch" spacing={6}>
                        {assets.map((asset) => (
                          <Box key={asset.id} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" overflow="hidden">
                            <Flex p={4} bg="gray.50" justify="space-between" align="center" borderBottomWidth="1px" borderColor="gray.200">
                              <HStack spacing={4}>
                                <Badge bg="blue.600" color="white" px={3} py={0.5} borderRadius="md" fontSize="xs" fontWeight={600}>
                                  {asset.asset_role || asset.asset_type || 'ASSET'}
                                </Badge>
                                <Text fontSize="sm" fontFamily="mono" color="gray.700">{asset.original_url || '—'}</Text>
                              </HStack>
                              <IconButton
                                icon={<Icon as={FaTrash} />}
                                size="sm"
                                color="red.500"
                                variant="ghost"
                                aria-label="Delete asset"
                                onClick={() => handleDeleteAsset(asset.id)}
                                isLoading={deletingId === asset.id}
                                _hover={{ bg: 'red.50' }}
                              />
                            </Flex>
                            <Flex p={6} direction={{ base: 'column', md: 'row' }} gap={8}>
                              <Box w={{ base: '100%', md: '256px' }} h="160px" bg="gray.100" borderRadius="xl" overflow="hidden" flexShrink={0} borderWidth="1px" borderColor="gray.200">
                                <Image
                                  src={getFileUrl(asset.original_url)}
                                  w="100%"
                                  h="100%"
                                  objectFit="contain"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </Box>
                              <Box flex={1} minW={0}>
                                <Text fontSize="sm" fontWeight="bold" color="gray.800" mb={3} textTransform="uppercase" letterSpacing="wider">Variants</Text>
                                {asset.variants?.length > 0 ? (
                                  <Box borderRadius="xl" borderWidth="1px" borderColor="gray.200" overflow="hidden">
                                    <Table size="sm">
                                      <Thead bg="gray.50">
                                        <Tr>
                                          <Th fontSize="xs" color="gray.700" fontWeight="medium">Type</Th>
                                          <Th fontSize="xs" color="gray.700" fontWeight="medium">Size</Th>
                                          <Th fontSize="xs" color="gray.700" fontWeight="medium">URL</Th>
                                          <Th fontSize="xs" color="gray.700" fontWeight="medium" textAlign="right">Action</Th>
                                        </Tr>
                                      </Thead>
                                      <Tbody>
                                        {asset.variants.map((v) => (
                                          <Tr key={v.id} _hover={{ bg: 'gray.50' }}>
                                            <Td fontSize="sm" fontWeight="medium" color="blue.600">{v.variant_type}</Td>
                                            <Td fontSize="sm" color="gray.700">{v.width}×{v.height}</Td>
                                            <Td><Text fontSize="xs" fontFamily="mono" color="gray.600" noOfLines={1} maxW="200px">{v.variant_url}</Text></Td>
                                            <Td textAlign="right">
                                              <IconButton
                                                icon={<Icon as={FaTrash} />}
                                                size="xs"
                                                color="gray.400"
                                                variant="ghost"
                                                aria-label="Delete variant"
                                                onClick={() => handleDeleteVariant(asset.id, v.id)}
                                                isLoading={deletingId === v.id}
                                                _hover={{ color: 'red.500', bg: 'red.50' }}
                                              />
                                            </Td>
                                          </Tr>
                                        ))}
                                      </Tbody>
                                    </Table>
                                  </Box>
                                ) : (
                                  <Text fontSize="sm" color="gray.700">No variants</Text>
                                )}
                              </Box>
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </VStack>
                </TabPanel>
                )}

                <TabPanel p={0}>
                  <VStack align="stretch" spacing={6}>
                    <HStack justify="space-between" flexWrap="wrap" gap={4}>
                      <Text fontSize="sm" fontWeight="600" color="gray.900">Reviews ({reviews.length})</Text>
                      <Button
                        size="sm"
                        leftIcon={<Icon as={FaPlus} />}
                        bg="blue.600"
                        color="white"
                        _hover={{ bg: 'blue.700' }}
                        onClick={onAddReviewOpen}
                        isDisabled={project.project_status !== 'approved'}
                        title={project.project_status !== 'approved' ? 'Project must be approved to add reviews' : ''}
                      >
                        Add Review
                      </Button>
                    </HStack>
                    {reviews.length === 0 ? (
                      <Box py={20} bg="white" borderRadius="2xl" borderWidth="1px" borderStyle="dashed" borderColor="gray.300" textAlign="center">
                        <Text color="gray.700">
                          {project.project_status === 'approved'
                            ? 'No reviews yet. Add one to provide feedback.'
                            : 'Reviews can only be added when the project is approved.'}
                        </Text>
                      </Box>
                    ) : (
                      <VStack align="stretch" spacing={6} maxW="3xl">
                        {reviews.map((r) => (
                          <Box key={r.id} p={6} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" shadow="sm">
                            <Flex justify="space-between" align="flex-start" mb={4}>
                              <HStack spacing={3}>
                                <Avatar size="md" name={r.reviewer_usn || `Reviewer ${r.id}`} bg="blue.100" color="blue.700" />
                                <Box>
                                  <Text fontWeight="bold" color="gray.800">{r.reviewer_usn || `Reviewer #${r.id}`}</Text>
                                </Box>
                              </HStack>
                              {!isAlumni && (
                                <IconButton
                                  icon={<Icon as={FaTrash} />}
                                  size="sm"
                                  color="gray.400"
                                  variant="ghost"
                                  aria-label="Delete review"
                                  onClick={() => handleDeleteReview(r.id)}
                                  isLoading={deletingId === r.id}
                                  _hover={{ color: 'red.500', bg: 'red.50' }}
                                />
                              )}
                            </Flex>
                            <Text fontSize="sm" color="gray.700" mb={r.reply_text ? 4 : 0}>{r.review_text}</Text>
                            {r.reply_text && (
                              <Box bg="blue.50" p={4} borderRadius="xl" borderWidth="1px" borderColor="blue.100">
                                <Text fontSize="xs" fontWeight="bold" color="blue.600" textTransform="uppercase" mb={1}>Reply from Admin</Text>
                                <Text fontSize="sm" color="blue.800">{r.reply_text}</Text>
                              </Box>
                            )}
                          </Box>
                        )                    )}
                      </VStack>
                    )}
                  </VStack>
                </TabPanel>

                {!isAlumni && (
                <TabPanel p={0}>
                  <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.200" overflow="hidden">
                    <Flex p={6} borderBottomWidth="1px" borderColor="gray.200" justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
                      <Box>
                        <Heading size="md" fontWeight="bold" mb={2} color="gray.900">Public Share Links</Heading>
                        <Text fontSize="sm" color="gray.700">Links that allow anyone with the URL to view this project even if it's private.</Text>
                      </Box>
                      <Button size="sm" leftIcon={<Icon as={FaLink} />} bg="blue.600" color="white" _hover={{ bg: 'blue.700' }} onClick={onShareLinkOpen}>
                        Create Link
                      </Button>
                    </Flex>

                    {shareLinks.length === 0 ? (
                      <Box p={12} textAlign="center">
                        <Text color="gray.700">No share links yet. Create one to share this project.</Text>
                      </Box>
                    ) : (
                      <TableContainer overflowX="auto">
                        <Table size="sm">
                          <Thead bg="gray.50">
                            <Tr>
                              <Th fontSize="xs" color="gray.700" fontWeight="bold" textTransform="uppercase" px={6} py={4}>Token</Th>
                              <Th fontSize="xs" color="gray.700" fontWeight="bold" textTransform="uppercase" px={6} py={4}>Created On</Th>
                              <Th fontSize="xs" color="gray.700" fontWeight="bold" textTransform="uppercase" px={6} py={4}>Expires</Th>
                              <Th fontSize="xs" color="gray.700" fontWeight="bold" textTransform="uppercase" px={6} py={4} textAlign="center">Active</Th>
                              <Th fontSize="xs" color="gray.700" fontWeight="bold" textTransform="uppercase" px={6} py={4} textAlign="right">Action</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {shareLinks.map((link) => (
                              <Tr key={link.id} _hover={{ bg: 'gray.50' }}>
                                <Td px={6} py={4} fontFamily="mono" fontSize="sm" color="blue.600">{link.share_token?.slice(0, 12)}…</Td>
                                <Td px={6} py={4} fontSize="sm" color="gray.700">
                                  {link.created_at ? new Date(link.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </Td>
                                <Td px={6} py={4} fontSize="sm" color={link.expires_at ? 'gray.800' : 'gray.600'} fontStyle={!link.expires_at ? 'italic' : 'normal'}>
                                  {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : 'Never'}
                                </Td>
                                <Td px={6} py={4} textAlign="center">
                                  <Badge
                                    bg={link.is_active ? 'green.100' : 'gray.100'}
                                    color={link.is_active ? 'green.700' : 'gray.600'}
                                    px={3}
                                    py={0.5}
                                    borderRadius="full"
                                    fontSize="xs"
                                  >
                                    {link.is_active ? 'Yes' : 'No'}
                                  </Badge>
                                </Td>
                                <Td px={6} py={4} textAlign="right">
                                  <IconButton
                                    icon={<Icon as={FaTrash} />}
                                    size="xs"
                                    color="red.500"
                                    variant="ghost"
                                    aria-label="Delete link"
                                    onClick={() => handleDeleteShareLink(link.id)}
                                    isLoading={deletingId === link.id}
                                    _hover={{ bg: 'red.50' }}
                                  />
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </TabPanel>
                )}
              </TabPanels>
            </Tabs>
          </Box>

        </Container>
      </Box>

      {/* Add Asset Modal */}
      <Modal isOpen={isAddAssetOpen} onClose={onAddAssetClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Asset</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Asset URL</FormLabel>
              <Input value={newAssetUrl} onChange={(e) => setNewAssetUrl(e.target.value)} placeholder="https://..." />
            </FormControl>
            <FormControl>
              <FormLabel>Role</FormLabel>
              <Menu>
                <MenuButton as={Button} rightIcon={<Icon as={FaChevronDown} />}>
                  {newAssetRole}
                </MenuButton>
                <MenuList>
                  {['LOGO', 'COVER', 'GALLERY', 'VIDEO'].map((r) => (
                    <MenuItem key={r} onClick={() => setNewAssetRole(r)}>{r}</MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddAssetClose}>Cancel</Button>
            <Button colorScheme="green" onClick={handleAddAsset} isDisabled={!newAssetUrl.trim()}>
              Add
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Review Modal - Play Store style */}
      <Modal isOpen={isAddReviewOpen} onClose={() => { onAddReviewClose(); setNewReviewText(''); }} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" overflow="hidden" boxShadow="xl" maxW="420px">
          <ModalHeader pb={2} pt={6} px={6} fontWeight="600" fontSize="lg">
            Write a review
          </ModalHeader>
          <ModalCloseButton top={4} right={4} size="sm" />
          <ModalBody px={6} py={0}>
            <Text fontSize="sm" color="gray.500" mb={3}>
              Your review will be visible to the project owner and admins.
            </Text>
            <Textarea
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              placeholder="Share your thoughts on this project..."
              rows={4}
              resize="vertical"
              borderRadius="xl"
              borderColor="gray.200"
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
              _placeholder={{ color: 'gray.400' }}
              maxLength={2000}
            />
            <Text fontSize="xs" color="gray.400" mt={2} textAlign="right">
              {newReviewText.length}/2000
            </Text>
          </ModalBody>
          <ModalFooter pt={4} pb={6} px={6} gap={3} borderTopWidth="1px" borderColor="gray.100">
            <Button variant="ghost" colorScheme="gray" onClick={() => { onAddReviewClose(); setNewReviewText(''); }}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              borderRadius="full"
              px={6}
              onClick={handleAddReview}
              isDisabled={!newReviewText.trim()}
              isLoading={addingReview}
            >
              Post review
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Share Link Modal */}
      <Modal isOpen={isShareLinkOpen} onClose={onShareLinkClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Share Link</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Expires in (hours)</FormLabel>
              <Input type="number" value={shareLinkHours} onChange={(e) => setShareLinkHours(parseInt(e.target.value, 10) || 168)} min={1} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onShareLinkClose}>Cancel</Button>
            <Button colorScheme="green" onClick={handleCreateShareLink}>Create</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Asset/Variant/Review/ShareLink Confirmation */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <AlertDialogContent>
          <AlertDialogHeader>Confirm Delete</AlertDialogHeader>
          <AlertDialogBody>
            Are you sure you want to delete this {deleteTarget.type}? This cannot be undone.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button onClick={onDeleteClose}>Cancel</Button>
            <Button colorScheme="red" onClick={confirmDelete} isLoading={deletingId !== null} ml={3}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </LayoutComponent>
  );
}
