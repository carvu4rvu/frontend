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
  HStack,
  VStack
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiFile, 
  FiBriefcase, 
  FiChevronRight, 
  FiCalendar,
  FiUser
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { PlacementService } from '../../services/placement.service';

const StudentUniversalSearch = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ pages: [], drives: [], companies: [] });
  const navigate = useNavigate();
  const initialRef = useRef(null);

  // Data Cache
  const [allData, setAllData] = useState({ drives: [], companies: [] });

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
      if (allData.drives.length === 0) {
        try {
          const [drives, companies] = await Promise.all([
            PlacementService.getAllDrives(),
            PlacementService.getAllCompanies()
          ]);
          setAllData({ drives, companies });
        } catch (e) {
          console.error("Search data load failed", e);
        }
      }
    };
    if (isOpen) {
      loadData();
    }
  }, [isOpen, allData.drives.length]);

  const pages = [
    { name: 'My Profile', path: '/student/profile/personal', keywords: 'personal, info, details' },
    { name: 'Resume', path: '/student/profile/resume', keywords: 'cv, download, upload' },
    { name: 'Education Details', path: '/student/profile/education', keywords: 'college, school, marks, cgpa' },
    { name: 'Career Overview', path: '/student/profile/career', keywords: 'experience, summary' },
    { name: 'Projects', path: '/student/profile/projects', keywords: 'work, portfolio' },
    { name: 'Internships', path: '/student/profile/internships', keywords: 'experience, training' },
    { name: 'Certifications', path: '/student/profile/certifications', keywords: 'courses, certificates' },
    { name: 'Placement Feed', path: '/student/placements', keywords: 'jobs, drives, offers, opportunities' },
    { name: 'My Applications', path: '/student/applications', keywords: 'applied, status, track' },
  ];

  useEffect(() => {
    if (!query) {
      setResults({ pages: [], drives: [], companies: [] });
      return;
    }

    const lowerQuery = query.toLowerCase();

    const matchedPages = pages.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || p.keywords.includes(lowerQuery)
    );

    const matchedDrives = allData.drives.filter(d => 
      (d.company_name && d.company_name.toLowerCase().includes(lowerQuery)) ||
      (d.job_profile && d.job_profile.toLowerCase().includes(lowerQuery)) ||
      (d.job_location && d.job_location.toLowerCase().includes(lowerQuery))
    ).slice(0, 5); // Limit to 5

    const matchedCompanies = allData.companies.filter(c => 
      c.company_name.toLowerCase().includes(lowerQuery) ||
      (c.company_type && c.company_type.toLowerCase().includes(lowerQuery))
    ).slice(0, 3);

    setResults({ pages: matchedPages, drives: matchedDrives, companies: matchedCompanies });
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
        h="40px" 
        px={4}
        w="100%"
        maxW="400px"
        justifyContent="space-between"
        borderRadius="full" 
        transition="all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"
        fontFamily="system-ui, sans-serif"
        mr={4}
      >
        <Text fontSize="sm" fontWeight="normal" letterSpacing="0.3px">Search for jobs, pages...</Text>
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
        mr={2}
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
                placeholder="Search pages, jobs, companies..."
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

                {/* Drives / Jobs */}
                {results.drives.length > 0 && (
                   <Box>
                     <Text px={6} py={3} fontSize="xs" fontWeight="bold" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider" mt={2}>Placement Drives</Text>
                     {results.drives.map((drive, idx) => (
                       <ListItem 
                         key={`d-${idx}`} 
                         px={6} py={3} 
                         cursor="pointer" 
                         _hover={{ bg: 'whiteAlpha.100', borderLeftColor: '#F6AD55' }}
                         borderLeft="3px solid transparent"
                         onClick={() => handleSelect(`/student/placements`)} // Ideally link to specific drive details
                         display="flex"
                         alignItems="center"
                         transition="all 0.2s"
                       >
                         <Icon as={FiBriefcase} mr={4} color="orange.300" boxSize={5} />
                         <Box flex={1}>
                           <Text fontWeight="medium">{drive.company_name} - {drive.job_profile}</Text>
                           <HStack fontSize="xs" color="whiteAlpha.600" spacing={2}>
                                <Text>{drive.job_location}</Text>
                                <Text>•</Text>
                                <Text>{drive.ctc}</Text>
                           </HStack>
                         </Box>
                         <Badge colorScheme="orange" variant="subtle" fontSize="xx-small" borderRadius="full" px={2} bg="orange.900" color="orange.200">JOB</Badge>
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
                         _hover={{ bg: 'whiteAlpha.100', borderLeftColor: '#9F7AEA' }}
                         borderLeft="3px solid transparent"
                         onClick={() => handleSelect('/student/placements')} // Just navigating to placements for now
                         display="flex"
                         alignItems="center"
                         transition="all 0.2s"
                       >
                         <Icon as={FiBriefcase} mr={4} color="purple.300" boxSize={5} />
                         <Box flex={1}>
                           <Text fontWeight="medium">{comp.company_name}</Text>
                           <Text fontSize="xs" color="whiteAlpha.600">{comp.company_type}</Text>
                         </Box>
                         <Badge colorScheme="purple" variant="subtle" fontSize="xx-small" borderRadius="full" px={2} bg="purple.900" color="purple.200">COMPANY</Badge>
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
                    <Text fontSize="sm">Type to search for jobs, profile sections, or companies</Text>
                </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default StudentUniversalSearch;
