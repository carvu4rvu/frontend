import React, { useState, useEffect, useRef } from 'react';
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
import { FiSearch, FiFile, FiUser, FiBriefcase, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { PlacementService } from '../services/placement.service';

const UniversalSearch = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ pages: [], students: [], companies: [] });
  const navigate = useNavigate();
  const initialRef = useRef(null);

  // Data Cache
  const [allData, setAllData] = useState({ students: [], companies: [] });

  useEffect(() => {
    // Keyboard shortcut to open search
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
    const loadData = async () => {
      if (allData.students.length === 0) {
        try {
            const [studentsRes, companies] = await Promise.all([
                PlacementService.getAllStudents({ page: 1, page_size: 100 }),
                PlacementService.getAllCompanies(),
            ]);
            setAllData({ students: studentsRes?.students ?? [], companies });
        } catch (e) {
            console.error("Search data load failed", e);
        }
      }
    };
    if (isOpen) {
      loadData();
    }
  }, [isOpen, allData.students.length]);

  const pages = [
    { name: 'Dashboard', path: '/placement/dashboard', keywords: 'home, stats, overview' },
    { name: 'Placement Overview', path: '/placement/overview', keywords: 'statistics, school, batch, salary, placement, overview' },
    { name: 'Students Directory', path: '/placement/students', keywords: 'list, database, search, students' },
    { name: 'Job Offers', path: '/placement/job-offers', keywords: 'placements, offers, results' },
    { name: 'Campus Events', path: '/placement/student-events', keywords: 'events, workshops, seminars, campus' },
    { name: 'Placement Drives', path: '/placement/events', keywords: 'drives, placement, recruitment' },
    { name: 'Alumni Network', path: '/placement/alumni', keywords: 'graduates, network, alumni' },
    { name: 'Companies & Partners', path: '/placement/companies', keywords: 'partners, recruiters, companies' },
    { name: 'Project Gallery', path: '/placement/gallery', keywords: 'projects, gallery, showcase, students' },
  ];

  useEffect(() => {
    if (!query) {
      setResults({ pages: [], students: [], companies: [] });
      return;
    }

    const lowerQuery = query.toLowerCase();

    const matchedPages = pages.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || p.keywords.includes(lowerQuery)
    );

    const matchedStudents = allData.students.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) || 
      s.usn.toLowerCase().includes(lowerQuery) ||
      (s.school && s.school.toLowerCase().includes(lowerQuery))
    ).slice(0, 5); // Limit to 5

    const matchedCompanies = allData.companies.filter(c => 
      c.company_name.toLowerCase().includes(lowerQuery) ||
      (c.company_type && c.company_type.toLowerCase().includes(lowerQuery))
    ).slice(0, 5);

    setResults({ pages: matchedPages, students: matchedStudents, companies: matchedCompanies });
  }, [query, allData]);

  const handleSelect = (path) => {
    navigate(path);
    onClose();
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
          bg: "rgba(0, 0, 0, 0.3)", 
          borderColor: "rgba(255, 255, 255, 0.2)",
          transform: "translateY(-1px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
        _active={{ bg: "rgba(0, 0, 0, 0.4)", transform: "translateY(0)" }}
        color="whiteAlpha.800"
        h="44px" 
        px={4}
        w="100%"
        justifyContent="space-between"
        minW="320px"
        borderRadius="12px" 
        transition="all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"
        fontFamily="system-ui, sans-serif"
      >
        <Text fontSize="sm" fontWeight="normal" letterSpacing="0.3px">Search pages, students...</Text>
        <HStack spacing={1}>
          <Kbd fontSize="xs" bg="whiteAlpha.100" color="whiteAlpha.600" borderColor="whiteAlpha.200" borderRadius="md" px={2} py={0.5} fontFamily="inherit">Ctrl</Kbd>
          <Kbd fontSize="xs" bg="whiteAlpha.100" color="whiteAlpha.600" borderColor="whiteAlpha.200" borderRadius="md" px={2} py={0.5} fontFamily="inherit">K</Kbd>
        </HStack>
      </Button>

      <Button
        display={{ base: 'flex', md: 'none' }}
        variant="ghost"
        color="white"
        onClick={onOpen}
        _hover={{ bg: "whiteAlpha.100" }}
        borderRadius="full"
        w="40px"
        h="40px"
      >
        <Icon as={FiSearch} boxSize={5} />
      </Button>

      <Modal initialFocusRef={initialRef} isOpen={isOpen} onClose={onClose} size="xl" motionPreset="slideInBottom">
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
                placeholder="Search pages, students, companies..."
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
              '&::-webkit-scrollbar-thumb': { background: '#4a6578', borderRadius: '24px' },
            }}
          >
            {query && (
              <List spacing={0} pb={2}>
                {results.pages.length > 0 && (
                  <Box>
                    <Text px={6} py={3} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                      Pages
                    </Text>
                    {results.pages.map((page, idx) => (
                      <ListItem
                        key={`p-${idx}`}
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

                {results.companies.length > 0 && (
                  <Box>
                    <Text px={6} py={3} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mt={2}>
                      Companies
                    </Text>
                    {results.companies.map((comp, idx) => (
                      <ListItem
                        key={`c-${idx}`}
                        px={6}
                        py={3}
                        cursor="pointer"
                        _hover={{ bg: 'whiteAlpha.100', borderLeftColor: '#63b3ed' }}
                        borderLeft="3px solid transparent"
                        onClick={() => handleSelect('/placement/companies')}
                        display="flex"
                        alignItems="center"
                        transition="all 0.15s"
                      >
                        <Icon as={FiBriefcase} mr={4} color="#90cdf4" boxSize={5} />
                        <Box flex={1}>
                          <Text fontWeight="medium" color="gray.100">
                            {comp.company_name}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {comp.company_type}
                          </Text>
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
                          COMPANY
                        </Badge>
                      </ListItem>
                    ))}
                  </Box>
                )}

                {results.students.length > 0 && (
                  <Box>
                    <Text px={6} py={3} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mt={2}>
                      Students
                    </Text>
                    {results.students.map((student, idx) => (
                      <ListItem
                        key={`s-${idx}`}
                        px={6}
                        py={3}
                        cursor="pointer"
                        _hover={{ bg: 'whiteAlpha.100', borderLeftColor: '#63b3ed' }}
                        borderLeft="3px solid transparent"
                        onClick={() => handleSelect('/placement/students')}
                        display="flex"
                        alignItems="center"
                        transition="all 0.15s"
                      >
                        <Icon as={FiUser} mr={4} color="#90cdf4" boxSize={5} />
                        <Box flex={1}>
                          <Text fontWeight="medium" color="gray.100">
                            {student.name}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {student.usn} • {student.school}
                          </Text>
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
                          STUDENT
                        </Badge>
                      </ListItem>
                    ))}
                  </Box>
                )}

                {query && Object.values(results).every((r) => r.length === 0) && (
                  <Box p={8} textAlign="center" color="gray.400">
                    <Text>No results found for &ldquo;{query}&rdquo;</Text>
                  </Box>
                )}
              </List>
            )}
            {!query && (
              <Box p={10} textAlign="center" color="gray.400">
                <Icon as={FiSearch} boxSize={8} mb={3} color="#4a6578" />
                <Text fontSize="sm">Type to search for students, companies, or pages</Text>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UniversalSearch;
