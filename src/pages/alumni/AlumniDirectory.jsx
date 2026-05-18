import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Card,
  CardBody,
  Flex,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import AlumniLayout from '../../components/AlumniLayout';
import { PlacementService } from '../../services/placement.service';

const AlumniDirectory = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getAllAlumni();
      setAlumni(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ title: 'Error fetching alumni', status: 'error', duration: 3000, isClosable: true });
      setAlumni([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumni = alumni.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.full_name && a.full_name.toLowerCase().includes(q)) ||
      (a.student_id && a.student_id.toLowerCase().includes(q)) ||
      (a.current_company && a.current_company.toLowerCase().includes(q)) ||
      (a.current_designation && a.current_designation.toLowerCase().includes(q))
    );
  });

  return (
    <AlumniLayout>
      <Heading size="lg" mb={4} color="#166534">Alumni Directory</Heading>
      <Text color="gray.600" mb={6}>Browse and search the alumni network.</Text>

      <InputGroup maxW="400px" mb={6}>
        <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" /></InputLeftElement>
        <Input placeholder="Search by name, USN, company, designation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} bg="white" />
      </InputGroup>

      {loading ? (
        <Flex justify="center" py={12}><Spinner size="xl" color="#d4a960" /></Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredAlumni.map((a) => (
            <Card
              key={a.id}
              variant="outline"
              boxShadow="sm"
              cursor="pointer"
              _hover={{ boxShadow: 'md', borderColor: '#d4a960', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
              onClick={() => navigate(`/placement/alumni-directory/${encodeURIComponent(String(a.student_id || a.id))}`)}
            >
              <CardBody display="flex" flexDir="column" alignItems="flex-start" justifyContent="space-between">
                <Box flex="1" w="full">
                  <Text fontWeight="bold" fontSize="lg" color="#166534">{a.full_name || '—'}</Text>
                  {a.student_id && <Text fontSize="sm" color="gray.500">USN: {a.student_id}</Text>}
                  {a.graduation_year && <Text fontSize="sm" color="gray.500">Batch: {a.graduation_year}</Text>}
                  {a.current_company && <Text fontSize="sm" mt={2} color="gray.700">{a.current_company}</Text>}
                  {a.current_designation && <Text fontSize="sm" color="gray.600">{a.current_designation}</Text>}
                </Box>
                <Flex mt={3} align="center" color="#d4a960" fontWeight="600" fontSize="sm">
                  View details <ChevronRightIcon ml={1} />
                </Flex>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {!loading && filteredAlumni.length === 0 && (
        <Box py={8} textAlign="center" color="gray.500">No alumni found.</Box>
      )}
    </AlumniLayout>
  );
};

export default AlumniDirectory;
