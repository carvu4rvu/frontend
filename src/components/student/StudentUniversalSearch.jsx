import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Text,
  Icon,
  useDisclosure,
  Badge,
  Kbd,
  HStack
} from '@chakra-ui/react';
import { FiSearch, FiFile, FiBriefcase, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { PlacementService } from '../../services/placement.service';
import { usePlacementTrackPolicy } from '../../context/PlacementTrackPolicyContext';

const BASE_PAGES = [
  { name: 'Dashboard', path: '/student-dashboard', keywords: 'home, stats, overview, applications' },
  { name: 'Notifications', path: '/student/notifications', keywords: 'alerts, messages, updates' },
  { name: 'Personal Information', path: '/student/profile/personal', keywords: 'personal, profile, info, details' },
  { name: 'Contact Details', path: '/student/profile/contact', keywords: 'phone, email, address, contact' },
  { name: 'Parent / Guardian Details', path: '/student/profile/family', keywords: 'family, parent, guardian' },
  { name: 'Education', path: '/student/profile/education', keywords: 'college, school, marks, cgpa, education' },
  { name: 'Academic Performance', path: '/student/profile/academics', keywords: 'academics, grades, performance' },
  { name: 'Projects', path: '/student/profile/projects', keywords: 'work, portfolio, projects' },
  { name: 'My Projects', path: '/student/projects', keywords: 'gallery, showcase, my projects' },
  { name: 'Internships', path: '/student/profile/internships', keywords: 'experience, training, internship' },
  { name: 'Training & Workshops', path: '/student/profile/trainings', keywords: 'training, workshops' },
  { name: 'Certifications', path: '/student/profile/certifications', keywords: 'courses, certificates' },
  { name: 'Publications', path: '/student/profile/publications', keywords: 'papers, publications' },
  { name: 'Extra-Curricular Activities', path: '/student/profile/extra-curricular', keywords: 'activities, sports, clubs' },
  { name: 'Other Experiences', path: '/student/profile/other', keywords: 'other, experiences' },
  { name: 'Career Overview', path: '/student/profile/career', keywords: 'experience, summary, career' },
  { name: 'Resume', path: '/student/profile/resume', keywords: 'cv, download, upload, resume' },
  { name: 'Summer Immersion', path: '/student/profile/summer-immersion', keywords: 'summer, immersion' },
  { name: 'Summer Internship', path: '/student/profile/summer-internship', keywords: 'summer, internship' },
  { name: 'Campus Events', path: '/student/placements/events', keywords: 'events, workshops, seminars, campus' },
  { name: 'Calendar', path: '/student/calendar', keywords: 'calendar, schedule, dates' },
  { name: 'Placement Policy', path: '/student/placements/policy', keywords: 'policy, rules, placement' },
];

const OPT_IN_PAGES = [
  { name: 'Placement Drives', path: '/student/placements/feed', keywords: 'jobs, drives, opportunities, placements, feed, apply' },
  { name: 'Job Offers', path: '/student/placements/offers', keywords: 'offers, placed, job offers, results' },
];

const drivePath = (drive) => {
  const id = drive?.id ?? drive?.placement_drive_id;
  return id != null ? `/student/placements/drive/${id}` : null;
};

const StudentUniversalSearch = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ pages: [], drives: [] });
  const navigate = useNavigate();
  const initialRef = useRef(null);
  const { policy: trackPolicy } = usePlacementTrackPolicy();
  const placementOptIn = trackPolicy?.opt_in === true;

  const [allDrives, setAllDrives] = useState([]);

  const pages = useMemo(() => {
    const list = [...BASE_PAGES];
    if (placementOptIn) list.push(...OPT_IN_PAGES);
    return list;
  }, [placementOptIn]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);

  useEffect(() => {
    if (!isOpen || !placementOptIn || allDrives.length > 0) return;
    const loadDrives = async () => {
      try {
        const drives = await PlacementService.getAllDrives();
        setAllDrives(Array.isArray(drives) ? drives : []);
      } catch (_e) {
        setAllDrives([]);
      }
    };
    loadDrives();
  }, [isOpen, placementOptIn, allDrives.length]);

  useEffect(() => {
    if (!query) {
      setResults({ pages: [], drives: [] });
      return;
    }

    const lowerQuery = query.toLowerCase();

    const matchedPages = pages.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.keywords.toLowerCase().includes(lowerQuery)
    );

    const matchedDrives = placementOptIn
      ? allDrives
          .filter(
            (d) =>
              (d.company_name && d.company_name.toLowerCase().includes(lowerQuery)) ||
              (d.job_profile && d.job_profile.toLowerCase().includes(lowerQuery)) ||
              (d.job_location && d.job_location.toLowerCase().includes(lowerQuery))
          )
          .slice(0, 5)
      : [];

    setResults({ pages: matchedPages, drives: matchedDrives });
  }, [query, pages, allDrives, placementOptIn]);

  const handleSelect = (path) => {
    if (!path) return;
    navigate(path);
    onClose();
    setQuery('');
  };

  const handleClose = () => {
    onClose();
    setQuery('');
  };

  return (
    <>
      <Button
        leftIcon={<Icon as={FiSearch} color="whiteAlpha.600" boxSize={4} />}
        onClick={onOpen}
        variant="unstyled"
        display={{ base: 'none', md: 'flex' }}
        alignItems="center"
        bg="rgba(0, 0, 0, 0.2)"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        _hover={{
          bg: 'rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        _active={{ bg: 'rgba(0, 0, 0, 0.4)', transform: 'translateY(0)' }}
        color="whiteAlpha.800"
        h="44px"
        px={4}
        w="100%"
        maxW="400px"
        justifyContent="space-between"
        borderRadius="12px"
        transition="all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"
        fontFamily="system-ui, sans-serif"
        mr={4}
      >
        <Text fontSize="sm" fontWeight="normal" letterSpacing="0.3px">
          Search pages, drives...
        </Text>
        <HStack spacing={1}>
          <Kbd fontSize="xs" bg="whiteAlpha.100" color="whiteAlpha.600" borderColor="whiteAlpha.200" borderRadius="md" px={2} py={0.5} fontFamily="inherit">
            Ctrl
          </Kbd>
          <Kbd fontSize="xs" bg="whiteAlpha.100" color="whiteAlpha.600" borderColor="whiteAlpha.200" borderRadius="md" px={2} py={0.5} fontFamily="inherit">
            K
          </Kbd>
        </HStack>
      </Button>

      <Button
        display={{ base: 'flex', md: 'none' }}
        variant="ghost"
        color="white"
        onClick={onOpen}
        _hover={{ bg: 'whiteAlpha.100' }}
        borderRadius="full"
        w="40px"
        h="40px"
        mr={2}
      >
        <Icon as={FiSearch} boxSize={5} />
      </Button>

      <Modal initialFocusRef={initialRef} isOpen={isOpen} onClose={handleClose} size="xl" motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.700" />
        <ModalContent
          bg="#2d4454"
          color="gray.200"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.35)"
          border="1px solid"
          borderColor="#3d5a6a"
          mt={16}
        >
          <Box p={4} borderBottom="1px solid" borderColor="#3d5a6a" bg="#243b47">
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" h="100%">
                <Icon as={FiSearch} color="#90cdf4" boxSize={5} />
              </InputLeftElement>
              <Input
                ref={initialRef}
                placeholder="Search pages or placement drives..."
                variant="unstyled"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                color="gray.100"
                fontSize="lg"
                _placeholder={{ color: 'gray.400' }}
                pl={12}
                h="48px"
              />
            </InputGroup>
          </Box>

          <ModalBody
            p={0}
            maxH="60vh"
            overflowY="auto"
            bg="#2d4454"
            css={{
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: '#4a6578', borderRadius: '24px' }
            }}
          >
            {query && (
              <List spacing={0} pb={2}>
                {results.pages.length > 0 && (
                  <Box>
                    <Text px={6} py={3} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                      Pages
                    </Text>
                    {results.pages.map((page) => (
                      <ListItem
                        key={page.path}
                        px={6}
                        py={3}
                        cursor="pointer"
                        _hover={{ bg: 'whiteAlpha.100', borderLeftColor: '#63b3ed' }}
                        borderLeft="3px solid transparent"
                        onClick={() => handleSelect(page.path)}
                        display="flex"
                        alignItems="center"
                        transition="all 0.15s"
                      >
                        <Icon as={FiFile} mr={4} color="#90cdf4" boxSize={5} />
                        <Text flex={1} fontWeight="medium" color="gray.100">
                          {page.name}
                        </Text>
                        <Icon as={FiChevronRight} color="gray.500" />
                      </ListItem>
                    ))}
                  </Box>
                )}

                {results.drives.length > 0 && (
                  <Box>
                    <Text px={6} py={3} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mt={2}>
                      Placement Drives
                    </Text>
                    {results.drives.map((drive) => {
                      const path = drivePath(drive);
                      if (!path) return null;
                      return (
                        <ListItem
                          key={path}
                          px={6}
                          py={3}
                          cursor="pointer"
                          _hover={{ bg: 'whiteAlpha.100', borderLeftColor: '#63b3ed' }}
                          borderLeft="3px solid transparent"
                          onClick={() => handleSelect(path)}
                          display="flex"
                          alignItems="center"
                          transition="all 0.15s"
                        >
                          <Icon as={FiBriefcase} mr={4} color="#90cdf4" boxSize={5} />
                          <Box flex={1}>
                            <Text fontWeight="medium" color="gray.100">
                              {drive.company_name} - {drive.job_profile}
                            </Text>
                            <HStack fontSize="xs" color="gray.400" spacing={2}>
                              <Text>{drive.job_location}</Text>
                              {drive.ctc ? (
                                <>
                                  <Text>•</Text>
                                  <Text>{drive.ctc}</Text>
                                </>
                              ) : null}
                            </HStack>
                          </Box>
                          <Badge
                            fontSize="xx-small"
                            borderRadius="full"
                            px={2}
                            bg="#3d5a6a"
                            color="gray.200"
                            border="1px solid"
                            borderColor="#4a6578"
                          >
                            DRIVE
                          </Badge>
                        </ListItem>
                      );
                    })}
                  </Box>
                )}

                {Object.values(results).every((r) => r.length === 0) && (
                  <Box p={8} textAlign="center" color="gray.400">
                    <Text>No results found for &ldquo;{query}&rdquo;</Text>
                  </Box>
                )}
              </List>
            )}
            {!query && (
              <Box p={10} textAlign="center" color="gray.400">
                <Icon as={FiSearch} boxSize={8} mb={3} color="#4a6578" />
                <Text fontSize="sm">Type to search profile sections{placementOptIn ? ', placement drives, or offers' : ', events, or calendar'}</Text>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default StudentUniversalSearch;
