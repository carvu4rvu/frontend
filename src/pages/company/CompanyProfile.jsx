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
  Avatar,
  Icon,
  Badge,
  Divider,
  Spinner,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  SimpleGrid,
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
} from '@chakra-ui/react';
import {
  EditIcon,
  CheckIcon,
  CloseIcon,
  AddIcon,
  DeleteIcon,
  EmailIcon,
  PhoneIcon,
  ExternalLinkIcon,
} from '@chakra-ui/icons';
import {
  FaBuilding,
  FaGlobe,
  FaLinkedin,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaUsers,
  FaUserTie,
  FaBriefcase,
} from 'react-icons/fa';
import CompanyLayout from '../../components/CompanyLayout';
import { CompanyService } from '../../services/company.service';
import { getFileUrl } from '../../utils/fileUrl';

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

const CompanyProfile = () => {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    description: '',
    website: '',
    linkedin: '',
    address: '',
  });
  const [contactForm, setContactForm] = useState(emptyContact);
  const [editingContactId, setEditingContactId] = useState(null);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen: isContactModalOpen, onOpen: onContactModalOpen, onClose: onContactModalClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profileData, contactsData] = await Promise.all([
        CompanyService.getMyProfile(),
        CompanyService.getContacts(),
      ]);
      setProfile(profileData);
      setContacts(contactsData || []);
      setProfileForm({
        description: profileData?.description || '',
        website: profileData?.website || '',
        linkedin: profileData?.linkedin || '',
        address: profileData?.address || '',
      });
    } catch (err) {
      toast({
        title: 'Failed to load data',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await CompanyService.getContacts();
      setContacts(data || []);
    } catch (err) {
      toast({ title: 'Failed to load contacts', status: 'error', isClosable: true });
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const updated = await CompanyService.updateProfile(profileForm);
      setProfile(updated);
      setIsEditingProfile(false);
      toast({ title: 'Profile updated', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({
        title: 'Failed to update profile',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const cancelProfileEdit = () => {
    setProfileForm({
      description: profile?.description || '',
      website: profile?.website || '',
      linkedin: profile?.linkedin || '',
      address: profile?.address || '',
    });
    setIsEditingProfile(false);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddContact = () => {
    setContactForm(emptyContact);
    setEditingContactId(null);
    onContactModalOpen();
  };

  const openEditContact = (contact) => {
    setContactForm({
      contact_name: contact.contact_name || '',
      email: contact.email || '',
      phone_number: contact.phone_number || '',
      role_title: contact.role_title || '',
      remarks: contact.remarks || '',
    });
    setEditingContactId(contact.id);
    onContactModalOpen();
  };

  const saveContact = async () => {
    if (!contactForm.contact_name?.trim()) {
      toast({ title: 'Contact name is required', status: 'warning', isClosable: true });
      return;
    }
    setIsSavingContact(true);
    try {
      if (editingContactId) {
        const updated = await CompanyService.updateContact(editingContactId, contactForm);
        setContacts((prev) => prev.map((c) => (c.id === editingContactId ? updated : c)));
        toast({ title: 'Contact updated', status: 'success', duration: 3000, isClosable: true });
      } else {
        const newContact = await CompanyService.addContact(contactForm);
        setContacts((prev) => [newContact, ...prev]);
        toast({ title: 'Contact added', status: 'success', duration: 3000, isClosable: true });
      }
      onContactModalClose();
      setContactForm(emptyContact);
      setEditingContactId(null);
    } catch (err) {
      toast({
        title: editingContactId ? 'Failed to update contact' : 'Failed to add contact',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingContact(false);
    }
  };

  const openDeleteContact = (contact) => {
    setDeleteTarget(contact);
    onDeleteOpen();
  };

  const deleteContact = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await CompanyService.deleteContact(deleteTarget.id);
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
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

  const logoUrl = profile?.company_logo_link ? getFileUrl(profile.company_logo_link) : null;

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
        <Container maxW="1100px">
          {/* Header */}
          <Flex justify="space-between" align="start" mb={8} flexWrap="wrap" gap={4}>
            <HStack spacing={5} align="start">
              <Avatar
                size="2xl"
                name={profile?.company_name}
                src={logoUrl}
                bg={colors.dark}
                color="white"
                icon={<Icon as={FaBuilding} boxSize={12} />}
                border="4px solid white"
                boxShadow="lg"
              />
              <Box>
                <Heading size="xl" color={colors.dark} mb={1}>
                  {profile?.company_name || 'Company'}
                </Heading>
                {profile?.company_type && (
                  <Badge
                    bg={colors.accentLight}
                    color={colors.accent}
                    fontSize="sm"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontWeight="600"
                  >
                    {profile.company_type}
                  </Badge>
                )}
                <Text color={colors.secondary} mt={2} fontSize="sm">
                  Profile & contacts — edit and save directly
                </Text>
              </Box>
            </HStack>

            {!isEditingProfile ? (
              <Button
                leftIcon={<EditIcon />}
                bg={colors.accent}
                color="white"
                _hover={{ bg: colors.accentHover }}
                onClick={() => setIsEditingProfile(true)}
                size="md"
                borderRadius="lg"
              >
                Edit Profile
              </Button>
            ) : (
              <HStack spacing={3}>
                <Button
                  leftIcon={<CloseIcon />}
                  variant="outline"
                  colorScheme="gray"
                  onClick={cancelProfileEdit}
                  size="md"
                  borderRadius="lg"
                >
                  Cancel
                </Button>
                <Button
                  leftIcon={<CheckIcon />}
                  bg={colors.dark}
                  color="white"
                  _hover={{ bg: colors.darkBlue }}
                  onClick={saveProfile}
                  isLoading={isSavingProfile}
                  size="md"
                  borderRadius="lg"
                >
                  Save
                </Button>
              </HStack>
            )}
          </Flex>

          {/* Profile: Basic + Details */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
            <Card bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
              <CardBody p={6}>
                <HStack spacing={3} mb={5}>
                  <Flex w="40px" h="40px" bg={colors.accentLight} borderRadius="xl" align="center" justify="center">
                    <Icon as={FaInfoCircle} color={colors.accent} boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontWeight="700" color={colors.dark} fontSize="lg">Basic Information</Text>
                    <Text fontSize="xs" color={colors.secondary}>Read-only</Text>
                  </Box>
                </HStack>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color={colors.secondary} mb={1}>Company Name</Text>
                    <Text fontSize="md" color={colors.dark} fontWeight="500">{profile?.company_name || '—'}</Text>
                  </Box>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color={colors.secondary} mb={1}>Company Type</Text>
                    <Text fontSize="md" color={colors.dark} fontWeight="500">{profile?.company_type || '—'}</Text>
                  </Box>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color={colors.secondary} mb={1}>Member Since</Text>
                    <Text fontSize="md" color={colors.dark} fontWeight="500">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '—'}
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            <Card bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
              <CardBody p={6}>
                <HStack spacing={3} mb={5}>
                  <Flex w="40px" h="40px" bg={colors.accentLight} borderRadius="xl" align="center" justify="center">
                    <Icon as={FaGlobe} color={colors.accent} boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontWeight="700" color={colors.dark} fontSize="lg">Quick Links</Text>
                    <Text fontSize="xs" color={colors.secondary}>External resources</Text>
                  </Box>
                </HStack>
                <VStack spacing={4} align="stretch">
                  {profile?.website && (
                    <HStack
                      as="a"
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      p={3}
                      bg={colors.pageBg}
                      borderRadius="xl"
                      _hover={{ bg: colors.accentLight }}
                      transition="all 0.2s"
                    >
                      <Icon as={FaGlobe} color={colors.accent} boxSize={5} />
                      <Text flex="1" fontSize="sm" fontWeight="500" color={colors.dark} isTruncated>
                        {profile.website}
                      </Text>
                      <ExternalLinkIcon color={colors.secondary} />
                    </HStack>
                  )}
                  {profile?.linkedin && (
                    <HStack
                      as="a"
                      href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      p={3}
                      bg={colors.pageBg}
                      borderRadius="xl"
                      _hover={{ bg: colors.accentLight }}
                      transition="all 0.2s"
                    >
                      <Icon as={FaLinkedin} color="#0A66C2" boxSize={5} />
                      <Text flex="1" fontSize="sm" fontWeight="500" color={colors.dark}>
                        LinkedIn
                      </Text>
                      <ExternalLinkIcon color={colors.secondary} />
                    </HStack>
                  )}
                  {!profile?.website && !profile?.linkedin && (
                    <Text color={colors.secondary} fontSize="sm" py={2}>No links yet</Text>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Company Details (editable) */}
          <Card bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor={colors.border} mb={8}>
            <CardBody p={6}>
              <HStack spacing={3} mb={6}>
                <Flex w="40px" h="40px" bg={colors.accentLight} borderRadius="xl" align="center" justify="center">
                  <Icon as={FaBuilding} color={colors.accent} boxSize={5} />
                </Flex>
                <Box>
                  <Text fontWeight="700" color={colors.dark} fontSize="lg">Company Details</Text>
                  <Text fontSize="xs" color={colors.secondary}>
                    {isEditingProfile ? 'Edit below and click Save' : 'Description, website, LinkedIn, address'}
                  </Text>
                </Box>
              </HStack>
              <VStack spacing={5} align="stretch">
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600" color={colors.secondary}>About / Description</FormLabel>
                  {isEditingProfile ? (
                    <Textarea
                      name="description"
                      value={profileForm.description}
                      onChange={handleProfileChange}
                      placeholder="Tell us about your company..."
                      rows={4}
                      borderRadius="xl"
                      borderWidth="2px"
                      _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                    />
                  ) : (
                    <Text
                      p={4}
                      bg={colors.pageBg}
                      borderRadius="xl"
                      fontSize="sm"
                      color={profile?.description ? colors.dark : colors.secondary}
                      lineHeight="1.7"
                    >
                      {profile?.description || 'No description provided'}
                    </Text>
                  )}
                </FormControl>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600" color={colors.secondary}>Website</FormLabel>
                    {isEditingProfile ? (
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FaGlobe} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          name="website"
                          value={profileForm.website}
                          onChange={handleProfileChange}
                          placeholder="https://www.company.com"
                          borderRadius="xl"
                          borderWidth="2px"
                          _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                        />
                      </InputGroup>
                    ) : (
                      <HStack p={3} bg={colors.pageBg} borderRadius="xl">
                        <Icon as={FaGlobe} color={colors.accent} />
                        <Text fontSize="sm" color={profile?.website ? colors.dark : colors.secondary}>
                          {profile?.website || 'Not provided'}
                        </Text>
                      </HStack>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600" color={colors.secondary}>LinkedIn</FormLabel>
                    {isEditingProfile ? (
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FaLinkedin} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          name="linkedin"
                          value={profileForm.linkedin}
                          onChange={handleProfileChange}
                          placeholder="https://linkedin.com/company/..."
                          borderRadius="xl"
                          borderWidth="2px"
                          _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                        />
                      </InputGroup>
                    ) : (
                      <HStack p={3} bg={colors.pageBg} borderRadius="xl">
                        <Icon as={FaLinkedin} color="#0A66C2" />
                        <Text fontSize="sm" color={profile?.linkedin ? colors.dark : colors.secondary}>
                          {profile?.linkedin || 'Not provided'}
                        </Text>
                      </HStack>
                    )}
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600" color={colors.secondary}>Address</FormLabel>
                  {isEditingProfile ? (
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaMapMarkerAlt} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        name="address"
                        value={profileForm.address}
                        onChange={handleProfileChange}
                        placeholder="Company address"
                        borderRadius="xl"
                        borderWidth="2px"
                        _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                      />
                    </InputGroup>
                  ) : (
                    <HStack p={3} bg={colors.pageBg} borderRadius="xl">
                      <Icon as={FaMapMarkerAlt} color={colors.accent} />
                      <Text fontSize="sm" color={profile?.address ? colors.dark : colors.secondary}>
                        {profile?.address || 'Not provided'}
                      </Text>
                    </HStack>
                  )}
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Contacts */}
          <Card bg="white" borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
            <CardBody p={6}>
              <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
                <HStack spacing={3}>
                  <Flex w="40px" h="40px" bg={colors.accentLight} borderRadius="xl" align="center" justify="center">
                    <Icon as={FaUsers} color={colors.accent} boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontWeight="700" color={colors.dark} fontSize="lg">Contacts</Text>
                    <Text fontSize="xs" color={colors.secondary}>
                      {contacts.length} contact{contacts.length !== 1 ? 's' : ''} — add or edit, save directly
                    </Text>
                  </Box>
                </HStack>
                <Button
                  leftIcon={<AddIcon />}
                  bg={colors.accent}
                  color="white"
                  _hover={{ bg: colors.accentHover }}
                  onClick={openAddContact}
                  size="md"
                  borderRadius="lg"
                >
                  Add Contact
                </Button>
              </Flex>

              {contacts.length === 0 ? (
                <VStack py={10} spacing={4}>
                  <Flex w="80px" h="80px" borderRadius="full" bg={colors.accentLight} align="center" justify="center">
                    <Icon as={FaUserTie} boxSize={8} color={colors.accent} opacity={0.6} />
                  </Flex>
                  <Text color={colors.secondary} textAlign="center">
                    No contacts yet. Use the &quot;Add Contact&quot; button above to add contact persons for the placement team.
                  </Text>
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                  {contacts.map((contact, index) => (
                    <Card
                      key={contact.id}
                      bg="white"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor={colors.border}
                      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <CardBody p={5}>
                        <Flex justify="space-between" align="start" mb={3}>
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
                            <Tooltip label="Edit">
                              <IconButton
                                aria-label="Edit"
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => openEditContact(contact)}
                              />
                            </Tooltip>
                            <Tooltip label="Delete">
                              <IconButton
                                aria-label="Delete"
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => openDeleteContact(contact)}
                              />
                            </Tooltip>
                          </HStack>
                        </Flex>
                        <VStack spacing={2} align="stretch">
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
                            <Text fontSize="xs" color={colors.secondary} fontStyle="italic" noOfLines={2} px={2}>
                              {contact.remarks}
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </CardBody>
          </Card>
        </Container>
      </Box>

      {/* Add/Edit Contact Modal — save directly on Submit */}
      <Modal isOpen={isContactModalOpen} onClose={onContactModalClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack spacing={3}>
              <Flex w="40px" h="40px" bg={colors.accentLight} borderRadius="xl" align="center" justify="center">
                <Icon as={FaUserTie} color={colors.accent} />
              </Flex>
              <Box>
                <Text fontWeight="700">{editingContactId ? 'Edit Contact' : 'Add Contact'}</Text>
                <Text fontSize="sm" fontWeight="normal" color={colors.secondary}>
                  Edit below and click Save to save directly
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
                  value={contactForm.contact_name}
                  onChange={handleContactChange}
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
                    value={contactForm.role_title}
                    onChange={handleContactChange}
                    placeholder="e.g. HR Manager"
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
                      value={contactForm.email}
                      onChange={handleContactChange}
                      placeholder="email@company.com"
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
                      value={contactForm.phone_number}
                      onChange={handleContactChange}
                      placeholder="+91 9876543210"
                      borderRadius="xl"
                      borderWidth="2px"
                      _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                    />
                  </InputGroup>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color={colors.secondary}>Remarks</FormLabel>
                <Textarea
                  name="remarks"
                  value={contactForm.remarks}
                  onChange={handleContactChange}
                  placeholder="Optional notes"
                  rows={2}
                  borderRadius="xl"
                  borderWidth="2px"
                  _focus={{ borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onContactModalClose}>
              Cancel
            </Button>
            <Button
              bg={colors.dark}
              color="white"
              _hover={{ bg: colors.darkBlue }}
              onClick={saveContact}
              isLoading={isSavingContact}
              leftIcon={<CheckIcon />}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>Delete Contact</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Delete <Text as="span" fontWeight="bold">{deleteTarget?.contact_name}</Text>? This cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={deleteContact} isLoading={isDeleting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </CompanyLayout>
  );
};

export default CompanyProfile;
