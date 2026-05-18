import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useToast,
  Flex,
  Icon,
  Badge,
  Spinner,
  Card,
  CardBody,
  SimpleGrid,
  Avatar,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  EmailIcon, 
  PhoneIcon,
} from '@chakra-ui/icons';
import { 
  FaUsers, 
  FaUserTie,
  FaBriefcase,
} from 'react-icons/fa';
import CompanyLayout from '../../components/CompanyLayout';
import { CompanyService } from '../../services/company.service';

const colors = {
  accent: '#d4a960',
  accentHover: '#c4983f',
  accentLight: '#f8f3e8',
  dark: '#172e36',
  darkBlue: '#1e3a47',
  secondary: '#64748b',
  cardBg: '#ffffff',
  pageBg: '#f1f5f9',
  border: '#e2e8f0',
};

const emptyContact = {
  contact_name: '',
  email: '',
  phone_number: '',
  role_title: '',
  remarks: '',
};

const CompanyContacts = () => {
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyContact);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await CompanyService.getContacts();
      setContacts(data || []);
    } catch (err) {
      toast({
        title: 'Failed to load contacts',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setFormData(emptyContact);
    setEditingId(null);
    onFormOpen();
  };

  const openEditForm = (contact) => {
    setFormData({
      contact_name: contact.contact_name || '',
      email: contact.email || '',
      phone_number: contact.phone_number || '',
      role_title: contact.role_title || '',
      remarks: contact.remarks || '',
    });
    setEditingId(contact.id);
    onFormOpen();
  };

  const handleSave = async () => {
    if (!formData.contact_name.trim()) {
      toast({ title: 'Contact name is required', status: 'warning', isClosable: true });
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await CompanyService.updateContact(editingId, formData);
        setContacts(prev => prev.map(c => c.id === editingId ? updated : c));
        toast({ title: 'Contact updated', status: 'success', duration: 3000, isClosable: true });
      } else {
        const newContact = await CompanyService.addContact(formData);
        setContacts(prev => [newContact, ...prev]);
        toast({ title: 'Contact added', status: 'success', duration: 3000, isClosable: true });
      }
      onFormClose();
      setFormData(emptyContact);
      setEditingId(null);
    } catch (err) {
      toast({
        title: editingId ? 'Failed to update contact' : 'Failed to add contact',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (contact) => {
    setDeleteTarget(contact);
    onDeleteOpen();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await CompanyService.deleteContact(deleteTarget.id);
      setContacts(prev => prev.filter(c => c.id !== deleteTarget.id));
      toast({ title: 'Contact deleted', status: 'success', duration: 3000, isClosable: true });
      onDeleteClose();
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: 'Failed to delete contact',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <CompanyLayout>
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color={colors.accent} thickness="4px" />
        </Flex>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <Box bg={colors.pageBg} minH="100vh" py={8}>
        <Container maxW="1200px">
          {/* Header */}
          <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
            <Box>
              <Heading size="xl" color={colors.dark} mb={1}>
                Company Contacts
              </Heading>
              <Text color={colors.secondary} fontSize="md">
                Manage your company's official contact persons
              </Text>
            </Box>
            <Button
              leftIcon={<AddIcon />}
              bg={colors.accent}
              color="white"
              _hover={{ bg: colors.accentHover }}
              onClick={openAddForm}
              size="lg"
              borderRadius="xl"
              px={6}
            >
              Add Contact
            </Button>
          </Flex>

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
            <Card bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
              <CardBody p={5}>
                <HStack spacing={4}>
                  <Flex w="50px" h="50px" bg={colors.accentLight} borderRadius="xl" align="center" justify="center">
                    <Icon as={FaUsers} color={colors.accent} boxSize={6} />
                  </Flex>
                  <Box>
                    <Text fontSize="2xl" fontWeight="700" color={colors.dark}>{contacts.length}</Text>
                    <Text fontSize="sm" color={colors.secondary}>Total Contacts</Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Contacts List */}
          {contacts.length === 0 ? (
            <Card bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
              <CardBody py={16}>
                <VStack spacing={4}>
                  <Flex
                    w="100px"
                    h="100px"
                    borderRadius="full"
                    bg={colors.accentLight}
                    align="center"
                    justify="center"
                  >
                    <Icon as={FaUserTie} boxSize={12} color={colors.accent} opacity={0.6} />
                  </Flex>
                  <Heading size="md" color={colors.dark}>No contacts yet</Heading>
                  <Text color={colors.secondary} textAlign="center" maxW="400px">
                    Use the &quot;Add Contact&quot; button above to add your company&apos;s contact persons.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
              {contacts.map((contact, index) => (
                <Card 
                  key={contact.id} 
                  bg="white" 
                  borderRadius="2xl" 
                  boxShadow="sm" 
                  border="1px solid" 
                  borderColor={colors.border}
                  _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <CardBody p={5}>
                    <Flex justify="space-between" align="start" mb={4}>
                      <HStack spacing={3}>
                        <Avatar
                          size="md"
                          name={contact.contact_name}
                          bg={`hsl(${(index * 47) % 360}, 55%, 50%)`}
                          color="white"
                        />
                        <Box>
                          <Text fontWeight="700" color={colors.dark} fontSize="md">
                            {contact.contact_name}
                          </Text>
                          {contact.role_title && (
                            <Badge 
                              bg={colors.accentLight} 
                              color={colors.accent} 
                              fontSize="xs" 
                              borderRadius="full"
                              px={2}
                              mt={1}
                            >
                              {contact.role_title}
                            </Badge>
                          )}
                        </Box>
                      </HStack>
                      <HStack spacing={1}>
                        <Tooltip label="Edit contact">
                          <IconButton
                            aria-label="Edit"
                            icon={<EditIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => openEditForm(contact)}
                          />
                        </Tooltip>
                        <Tooltip label="Delete contact">
                          <IconButton
                            aria-label="Delete"
                            icon={<DeleteIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => openDeleteModal(contact)}
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>

                    <VStack spacing={3} align="stretch">
                      {contact.email && (
                        <HStack spacing={3} p={2} bg={colors.pageBg} borderRadius="lg">
                          <EmailIcon color={colors.accent} boxSize={4} />
                          <Text fontSize="sm" color={colors.dark} isTruncated>
                            {contact.email}
                          </Text>
                        </HStack>
                      )}
                      {contact.phone_number && (
                        <HStack spacing={3} p={2} bg={colors.pageBg} borderRadius="lg">
                          <PhoneIcon color={colors.accent} boxSize={4} />
                          <Text fontSize="sm" color={colors.dark}>
                            {contact.phone_number}
                          </Text>
                        </HStack>
                      )}
                      {contact.remarks && (
                        <Box p={2} bg={colors.pageBg} borderRadius="lg">
                          <Text fontSize="xs" color={colors.secondary} fontStyle="italic">
                            "{contact.remarks}"
                          </Text>
                        </Box>
                      )}
                    </VStack>

                    <Text fontSize="xs" color={colors.secondary} mt={4}>
                      Added {formatDate(contact.created_at)}
                    </Text>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Container>
      </Box>

      {/* Add/Edit Contact Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack spacing={3}>
              <Flex w="40px" h="40px" bg={colors.accentLight} borderRadius="xl" align="center" justify="center">
                <Icon as={FaUserTie} color={colors.accent} />
              </Flex>
              <Box>
                <Text fontWeight="700">{editingId ? 'Edit Contact' : 'Add New Contact'}</Text>
                <Text fontSize="sm" fontWeight="normal" color={colors.secondary}>
                  {editingId ? 'Update contact information' : 'Add a new contact person'}
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color={colors.secondary}>Contact Name</FormLabel>
                <Input
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  placeholder="Full name"
                  borderRadius="xl"
                  borderWidth="2px"
                  _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color={colors.secondary}>Role / Designation</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaBriefcase} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    name="role_title"
                    value={formData.role_title}
                    onChange={handleChange}
                    placeholder="e.g. HR Manager, Recruitment Lead"
                    borderRadius="xl"
                    borderWidth="2px"
                    _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                  />
                </InputGroup>
              </FormControl>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600" color={colors.secondary}>Email</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <EmailIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@company.com"
                      borderRadius="xl"
                      borderWidth="2px"
                      _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600" color={colors.secondary}>Phone</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <PhoneIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      borderRadius="xl"
                      borderWidth="2px"
                      _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                    />
                  </InputGroup>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color={colors.secondary}>Remarks / Notes</FormLabel>
                <Textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Any additional notes about this contact..."
                  rows={3}
                  borderRadius="xl"
                  borderWidth="2px"
                  _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFormClose}>
              Cancel
            </Button>
            <Button
              bg={colors.dark}
              color="white"
              _hover={{ bg: colors.darkBlue }}
              onClick={handleSave}
              isLoading={isSaving}
            >
              {editingId ? 'Update Contact' : 'Add Contact'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>Delete Contact</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete{' '}
              <Text as="span" fontWeight="bold">{deleteTarget?.contact_name}</Text>?
            </Text>
            <Text fontSize="sm" color={colors.secondary} mt={2}>
              This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </CompanyLayout>
  );
};

export default CompanyContacts;
