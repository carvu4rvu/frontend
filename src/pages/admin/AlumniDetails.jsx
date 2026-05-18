import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  HStack,
  Container,
  Spinner,
  useToast,
  Link,
  SimpleGrid,
  Card,
  CardBody,
  Divider,
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
  useDisclosure,
} from '@chakra-ui/react';
import { ArrowBackIcon, ExternalLinkIcon, EditIcon, EmailIcon, PhoneIcon } from '@chakra-ui/icons';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';

const AlumniDetails = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchDetails();
  }, [identifier]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getAlumniByIdOrUsn(identifier);
      if (!data) {
        toast({ title: 'Alumni not found', status: 'error' });
        navigate('/placement/alumni');
        return;
      }
      setAlumni(data);
      setEditData(data);
    } catch (error) {
      toast({ title: 'Error loading alumni', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      await PlacementService.updateAlumni(identifier, editData);
      setAlumni(editData);
      onClose();
      toast({ title: 'Updated successfully', status: 'success' });
    } catch (error) {
      toast({ title: error.message || 'Update failed', status: 'error' });
    }
  };

  const usn = alumni?.usn ?? alumni?.student_id;

  if (loading) {
    return (
      <AdminLayout>
        <Flex justify="center" align="center" minH="80vh">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      </AdminLayout>
    );
  }

  if (!alumni) return null;

  return (
    <AdminLayout>
      <Box bg="#f0f0f0" minH="100vh" pb={10}>
        <Container maxW="5xl" px={{ base: 4, sm: 6, lg: 8 }} pt={8}>
          <Flex mb={6} justify="space-between" align="center">
            <Box>
              <Button leftIcon={<ArrowBackIcon />} variant="link" mb={2} onClick={() => navigate('/placement/alumni')}>
                Back to list
              </Button>
              <Heading size="lg" color="gray.800">{alumni.full_name}</Heading>
              <Text color="gray.500" fontSize="md">
                {usn ? `${usn} • ` : ''}Batch of {alumni.graduation_year || '—'}
              </Text>
            </Box>
            <Button leftIcon={<EditIcon />} colorScheme="blue" variant="outline" onClick={onOpen}>
              Edit profile
            </Button>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <Box gridColumn={{ md: 'span 1' }}>
              <Card borderRadius="xl" boxShadow="sm" bg="white">
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Contact</Text>
                      <HStack mt={2}>
                        <EmailIcon color="gray.400" />
                        <Text fontSize="sm">{alumni.personal_email || 'N/A'}</Text>
                      </HStack>
                      <HStack mt={2}>
                        <PhoneIcon color="gray.400" />
                        <Text fontSize="sm">{alumni.phone_number || 'N/A'}</Text>
                      </HStack>
                    </Box>
                    <Divider />
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Social</Text>
                      {alumni.linkedin && (
                        <Link href={alumni.linkedin} isExternal color="blue.500" fontSize="sm" mt={2} display="block">
                          LinkedIn <ExternalLinkIcon mx="2px" />
                        </Link>
                      )}
                      {alumni.other_links && (() => {
                        const u = typeof alumni.other_links === 'string' ? alumni.other_links : alumni.other_links?.url;
                        return u ? (
                          <Link href={u} isExternal color="blue.500" fontSize="sm" mt={1} display="block">
                            Other links <ExternalLinkIcon mx="2px" />
                          </Link>
                        ) : null;
                      })()}
                      {!alumni.linkedin && !alumni.other_links && <Text fontSize="sm" color="gray.400">—</Text>}
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </Box>

            <Box gridColumn={{ md: 'span 2' }}>
              <Card borderRadius="xl" boxShadow="sm" bg="white" mb={6}>
                <CardBody>
                  <Heading size="md" mb={4} color="gray.700">Current employment</Heading>
                  <SimpleGrid columns={2} spacing={6}>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Company</Text>
                      <Text fontSize="lg" fontWeight="bold" color="blue.600">{alumni.current_company || '—'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Designation</Text>
                      <Text fontSize="lg" fontWeight="medium">{alumni.current_designation || '—'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Work location</Text>
                      <Text fontSize="md">{alumni.current_work_location || '—'}</Text>
                    </Box>
                    {alumni.institution_name && (
                      <Box>
                        <Text fontSize="sm" color="gray.500">Institution</Text>
                        <Text fontSize="md">{alumni.institution_name}</Text>
                      </Box>
                    )}
                  </SimpleGrid>
                </CardBody>
              </Card>
              {alumni.alumni_remark && (
                <Card borderRadius="xl" boxShadow="sm" bg="white" mb={6}>
                  <CardBody>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={2}>Remarks</Text>
                    <Text fontSize="sm">{alumni.alumni_remark}</Text>
                  </CardBody>
                </Card>
              )}
            </Box>
          </SimpleGrid>

          <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Edit alumni profile</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4}>
                  <SimpleGrid columns={2} spacing={4} w="100%">
                    <FormControl isReadOnly>
                      <FormLabel>USN / ID</FormLabel>
                      <Input value={usn ?? alumni.id} bg="gray.100" />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Full name</FormLabel>
                      <Input name="full_name" value={editData.full_name ?? ''} onChange={handleInputChange} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl>
                    <FormLabel>Graduation year</FormLabel>
                    <Input name="graduation_year" type="number" value={editData.graduation_year ?? ''} onChange={handleInputChange} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Institution name</FormLabel>
                    <Input name="institution_name" value={editData.institution_name ?? ''} onChange={handleInputChange} />
                  </FormControl>
                  <SimpleGrid columns={2} spacing={4} w="100%">
                    <FormControl>
                      <FormLabel>Current company</FormLabel>
                      <Input name="current_company" value={editData.current_company ?? ''} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Designation</FormLabel>
                      <Input name="current_designation" value={editData.current_designation ?? ''} onChange={handleInputChange} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl>
                    <FormLabel>Work location</FormLabel>
                    <Input name="current_work_location" value={editData.current_work_location ?? ''} onChange={handleInputChange} />
                  </FormControl>
                  <SimpleGrid columns={2} spacing={4} w="100%">
                    <FormControl>
                      <FormLabel>Personal email</FormLabel>
                      <Input name="personal_email" type="email" value={editData.personal_email ?? ''} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Phone number</FormLabel>
                      <Input name="phone_number" value={editData.phone_number ?? ''} onChange={handleInputChange} />
                    </FormControl>
                  </SimpleGrid>
                  <FormControl>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <Input name="linkedin" value={editData.linkedin ?? ''} onChange={handleInputChange} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Other links</FormLabel>
                    <Input name="other_links" value={typeof editData.other_links === 'string' ? editData.other_links : (editData.other_links?.url ?? '')} onChange={handleInputChange} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Remarks</FormLabel>
                    <Input name="alumni_remark" value={editData.alumni_remark ?? ''} onChange={handleInputChange} placeholder="Admin notes" />
                  </FormControl>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                <Button colorScheme="blue" onClick={handleUpdate}>Update</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default AlumniDetails;
