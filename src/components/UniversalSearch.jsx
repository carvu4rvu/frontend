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
            const [students, companies] = await Promise.all([
                PlacementService.getAllStudents(),
                PlacementService.getAllCompanies()
            ]);
            setAllData({ students, companies });
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
    { name: 'Students Directory', path: '/placement/students', keywords: 'list, database, search, students' },
    { name: 'Job Offers', path: '/placement/job-offers', keywords: 'placements, offers, results' },
    { name: 'Events & Drives', path: '/placement/events', keywords: 'calendar, schedule, drives' },
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
          bg="#172e36" 
          color="white" 
          borderRadius="2xl" 
          overflow="hidden" 
          boxShadow="dark-lg" 
          border="1px solid" 
          borderColor="whiteAlpha.200"
          mt={16}
        >
          <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" h="100%">
                <Icon as={FiSearch} color="gray.400" boxSize={5} />
              </InputLeftElement>
              <Input
                ref={initialRef}
                placeholder="Search pages, students, companies..."
                variant="unstyled"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                color="white"
                fontSize="lg"
                _placeholder={{ color: 'whiteAlpha.400' }}
                pl={12}
                h="48px"
              />
            </InputGroup>
          </Box>
          
          <ModalBody p={0} maxH="60vh" overflowY="auto" css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-track': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '24px' },
          }}>
            {query && (
              <List spacing={0} pb={2}>
                {/* Pages */}
                {results.pages.length > 0 && (
                   <Box>
                     <Text px={6} py={3} fontSize="xs" fontWeight="bold" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider">Pages</Text>
                     {results.pages.map((page, idx) => (
                       <ListItem 
                         key={`p-${idx}`} 
                         px={6} py={3} 
                         cursor="pointer" 
                         _hover={{ bg: 'whiteAlpha.100', borderLeftColor: '#4FD1C5' }}
                         borderLeft="3px solid transparent"
                         onClick={() => handleSelect(page.path)}
                         display="flex"
                         alignItems="center"
                         transition="all 0.2s"
                       >
                         <Icon as={FiFile} mr={4} color="teal.300" boxSize={5} />
                         <Text flex={1} fontWeight="medium">{page.name}</Text>
                         <Icon as={FiChevronRight} color="whiteAlpha.300" />
                       </ListItem>
                     ))}
                   </Box>
                )}

                {/* Companies */}
                {results.companies.length > 0 && (
                   <Box>
                     <Text px={6} py={3} fontSize="xs" fontWeight="bold" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider" mt={2}>Companies</Text>
                     {results.companies.map((comp, idx) => (
                       <ListItem 
                         key={`c-${idx}`} 
                         px={6} py={3} 
                         cursor="pointer" 
                         _hover={{ bg: 'whiteAlpha.100', borderLeftColor: '#F6AD55' }}
                         borderLeft="3px solid transparent"
                         onClick={() => handleSelect('/placement/companies')}
                         display="flex"
                         alignItems="center"
                         transition="all 0.2s"
                       >
                         <Icon as={FiBriefcase} mr={4} color="orange.300" boxSize={5} />
                         <Box flex={1}>
                           <Text fontWeight="medium">{comp.company_name}</Text>
                           <Text fontSize="xs" color="whiteAlpha.600">{comp.company_type}</Text>
                         </Box>
                         <Badge colorScheme="orange" variant="subtle" fontSize="xx-small" borderRadius="full" px={2} bg="orange.900" color="orange.200">COMPANY</Badge>
                       </ListItem>
                     ))}
                   </Box>
                )}

                {/* Students */}
                {results.students.length > 0 && (
                   <Box>
                     <Text px={6} py={3} fontSize="xs" fontWeight="bold" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider" mt={2}>Students</Text>
                     {results.students.map((student, idx) => (
                       <ListItem 
                         key={`s-${idx}`} 
                         px={6} py={3} 
                         cursor="pointer" 
                         _hover={{ bg: 'whiteAlpha.100', borderLeftColor: '#68D391' }}
                         borderLeft="3px solid transparent"
                         onClick={() => handleSelect('/placement/students')}
                         display="flex"
                         alignItems="center"
                         transition="all 0.2s"
                       >
                         <Icon as={FiUser} mr={4} color="green.300" boxSize={5} />
                         <Box flex={1}>
                           <Text fontWeight="medium">{student.name}</Text>
                           <Text fontSize="xs" color="whiteAlpha.600">{student.usn} • {student.school}</Text>
                         </Box>
                         <Badge colorScheme="green" variant="subtle" fontSize="xx-small" borderRadius="full" px={2} bg="green.900" color="green.200">STUDENT</Badge>
                       </ListItem>
                     ))}
                   </Box>
                )}
                
                {query && Object.values(results).every(r => r.length === 0) && (
                    <Box p={8} textAlign="center" color="whiteAlpha.600">
                        <Text>No results found for "{query}"</Text>
                    </Box>
                )}
              </List>
            )}
            {!query && (
                <Box p={10} textAlign="center" color="whiteAlpha.500">
                    <Icon as={FiSearch} boxSize={8} mb={3} opacity={0.5} />
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
