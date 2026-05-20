import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Image,
  VStack,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  Container,
  Spinner,
  useToast,
  Link,
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
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Textarea,
  Select,
  SimpleGrid,
  IconButton,
  useDisclosure,
  Portal,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { ArrowBackIcon, ExternalLinkIcon, EditIcon, DeleteIcon, AddIcon, AttachmentIcon, ChevronLeftIcon, ChevronRightIcon, EmailIcon, PhoneIcon, SearchIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Avatar, Divider } from '@chakra-ui/react';
import AdminLayout from '../../components/AdminLayout';
import VcLayout from '../../components/VcLayout';
import { CompanyLogo } from '../../components/CompanyLogo';
import { StyledFileInput } from '../../components/ui/StyledFileInput';
import { PlacementService } from '../../services/placement.service';
import { NotificationService } from '../../services/notification.service';
import { useAuth } from '../../context/AuthContext';
import PlacementDrivesTable from '../../components/placement/PlacementDrivesTable';
import JobOffersDataTable, { COMPANY_PAGE_OFFER_COLUMNS } from '../../components/placement/JobOffersDataTable';
import JobOfferEditModal from '../../components/placement/JobOfferEditModal';
import CompanyDeleteDialog from '../../components/placement/CompanyDeleteDialog';
import { buildCompanyLogoById } from '../../utils/companyLogo';
import {
  buildDriveNotificationContent,
  navigateToPlacementNotificationSend,
} from '../../utils/placementNotificationNav';
import './PlacementEvents.css';
import './CompanyDetails.css';

const emptyContact = () => ({ id: null, contact_name: '', email: '', phone_number: '', role_title: '', remarks: '' });
const toContactRow = (c) => ({ id: c.id || null, contact_name: c.contact_name || '', email: c.email || '', phone_number: c.phone_number || '', role_title: c.role_title || '', remarks: c.remarks || '' });

const avatarColors = [
  'blue.500', 'red.500', 'green.600', 'orange.500', 'purple.600', 
  'teal.500', 'pink.600', 'cyan.600', 'yellow.600', 'blackAlpha.800'
];

const getAvatarColor = (name, index) => {
  if (!name) return avatarColors[0];
  // Mix name and index to get more variety within the same company
  const charCode = name.charCodeAt(0) + (index || 0);
  return avatarColors[charCode % avatarColors.length];
};

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { userRole } = useAuth();
  const isVc = (userRole || '').toLowerCase() === 'vc';
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isContactModalOpen, onOpen: onContactModalOpen, onClose: onContactModalClose } = useDisclosure();
  const { isOpen: isContactDeleteOpen, onOpen: onContactDeleteOpen, onClose: onContactDeleteClose } = useDisclosure();
  const { isOpen: isOfferEditOpen, onOpen: onOfferEditOpen, onClose: onOfferEditClose } = useDisclosure();
  const [editingOffer, setEditingOffer] = useState(null);
  const cancelRef = useRef();
  const [company, setCompany] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [drives, setDrives] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [editContacts, setEditContacts] = useState([]);
  const [deletedContactIds, setDeletedContactIds] = useState([]);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  const [newLogo, setNewLogo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOffersAction, setDeleteOffersAction] = useState('delete');
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [selectedContact, setSelectedContact] = useState(emptyContact());
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [allCompanyTypes, setAllCompanyTypes] = useState([]);
  const [companyTypeDropdownOpen, setCompanyTypeDropdownOpen] = useState(false);
  const [notifyingDriveId, setNotifyingDriveId] = useState(null);

  const CARDS_PER_PAGE = 4;
  const totalPages = Math.ceil(contacts.length / CARDS_PER_PAGE);
  const currentPage = Math.floor(currentContactIndex / CARDS_PER_PAGE);

  useEffect(() => {
    if (!id) return;
    fetchDetails();
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === '1' && company && !isEditOpen) {
      openEdit();
      // Remove the edit param from URL without refreshing
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, company]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [companyData, contactsData, allDrives, offersData, allCosData] = await Promise.all([
        PlacementService.getCompanyById(id),
        PlacementService.getCompanyContacts(id),
        PlacementService.getAllDrives(),
        PlacementService.getCompanyOffers(id),
        PlacementService.getCompaniesWithSchools(),
      ]);
      const drivesData = (Array.isArray(allDrives) ? allDrives : []).filter(
        (d) => String(d.company_id) === String(id)
      );
      if (!companyData) {
        toast({ title: 'Company not found', status: 'error' });
        navigate('/placement/companies');
        return;
      }
      setCompany(companyData);
      setContacts(Array.isArray(contactsData) ? contactsData : []);
      setDrives(Array.isArray(drivesData) ? drivesData : []);
      setOffers(Array.isArray(offersData) ? offersData : []);
      
      const uniqueTypes = [...new Set((allCosData?.companies || []).map(c => c.company_type).filter(Boolean))];
      setAllCompanyTypes(uniqueTypes);
    } catch (err) {
      console.error('Error fetching company details:', err);
      toast({ title: 'Error loading data', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    setEditCompany({
      company_name: company.company_name || '',
      description: company.description || '',
      company_type: company.company_type || '',
      address: company.address || '',
      website: company.website || '',
      linkedin: company.linkedin || '',
      remarks: Array.isArray(company.remarks) ? company.remarks : (company.remarks ? [company.remarks] : []),
      company_logo_link: company.company_logo_link || company.logo || '',
    });
    setEditContacts((contacts || []).map(toContactRow));
    setDeletedContactIds([]);
    onEditOpen();
  };

  const handleEditCompanyChange = (field, value) => {
    setEditCompany((prev) => ({ ...prev, [field]: value }));
  };
  const handleEditContactChange = (index, field, value) => {
    const updated = [...editContacts];
    if (!updated[index]) updated[index] = emptyContact();
    updated[index] = { ...updated[index], [field]: value };
    setEditContacts(updated);
  };
  const addEditContact = () => setEditContacts([...editContacts, emptyContact()]);
  const removeEditContact = (index) => {
    const c = editContacts[index];
    if (c && c.id) setDeletedContactIds((prev) => [...prev, c.id]);
    setEditContacts(editContacts.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    const name = (editCompany.company_name || '').trim();
    if (!name) {
      toast({ title: 'Company name is required', status: 'warning' });
      return;
    }
    setEditSubmitting(true);
    try {
      const remarks = Array.isArray(editCompany.remarks) ? editCompany.remarks : (editCompany.remarks ? [editCompany.remarks] : []);
      await PlacementService.updateCompany(id, {
        company_name: name,
        description: editCompany.description || null,
        company_type: editCompany.company_type || null,
        address: editCompany.address || null,
        website: editCompany.website || null,
        linkedin: editCompany.linkedin || null,
        remarks: remarks.length ? remarks : null,
        company_logo_link: editCompany.company_logo_link || null,
      });
      for (const contactId of deletedContactIds) {
        await PlacementService.deleteCompanyContact(id, contactId);
      }
      for (const c of editContacts) {
        const payload = { contact_name: c.contact_name || null, email: c.email || null, phone_number: c.phone_number || null, role_title: c.role_title || null, remarks: c.remarks || null };
        if (!payload.contact_name && !payload.email && !payload.phone_number) continue;
        if (c.id) {
          await PlacementService.updateCompanyContact(id, c.id, payload);
        } else {
          await PlacementService.addCompanyContacts(id, [payload]);
        }
      }
      toast({ title: 'Profile updated', status: 'success' });
      onEditClose();
      fetchDetails();
    } catch (err) {
      toast({ title: err.message || 'Error saving', status: 'error' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleUpdateLogo = async () => {
    setIsUpdatingLogo(true);
    try {
      await PlacementService.updateCompany(id, {
        company_logo_link: newLogo || '',
      });
      toast({ title: 'Logo updated successfully', status: 'success' });
      onImageClose();
      fetchDetails();
    } catch (err) {
      toast({ title: 'Error updating logo', description: err.message, status: 'error' });
    } finally {
      setIsUpdatingLogo(false);
    }
  };

  const handleDeleteCompany = async () => {
    setIsDeleting(true);
    try {
      await PlacementService.deleteCompany(id, { offersAction: deleteOffersAction });
      toast({ title: 'Company deleted', status: 'success' });
      onDeleteClose();
      setDeleteOffersAction('delete');
      navigate('/placement/companies');
    } catch (err) {
      toast({ title: 'Error deleting company', description: err.message, status: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClose = () => {
    setDeleteOffersAction('delete');
    onDeleteClose();
  };

  const nextContact = () => {
    if (contacts.length <= CARDS_PER_PAGE) return;
    setCurrentContactIndex((prev) => (prev + CARDS_PER_PAGE) % (totalPages * CARDS_PER_PAGE));
  };

  const prevContact = () => {
    if (contacts.length <= CARDS_PER_PAGE) return;
    setCurrentContactIndex((prev) => (prev - CARDS_PER_PAGE + (totalPages * CARDS_PER_PAGE)) % (totalPages * CARDS_PER_PAGE));
  };

  const openAddContact = () => {
    setSelectedContact(emptyContact());
    onContactModalOpen();
  };

  const openEditContact = (contact) => {
    setSelectedContact(toContactRow(contact));
    onContactModalOpen();
  };

  const handleContactSave = async () => {
    if (!selectedContact.contact_name) {
      toast({ title: 'Contact name is required', status: 'warning' });
      return;
    }
    setIsContactSubmitting(true);
    try {
      const payload = {
        contact_name: selectedContact.contact_name,
        email: selectedContact.email || null,
        phone_number: selectedContact.phone_number || null,
        role_title: selectedContact.role_title || null,
        remarks: selectedContact.remarks || null,
      };

      if (selectedContact.id) {
        await PlacementService.updateCompanyContact(id, selectedContact.id, payload);
        toast({ title: 'Contact updated', status: 'success' });
      } else {
        await PlacementService.addCompanyContacts(id, [payload]);
        toast({ title: 'Contact added', status: 'success' });
      }
      onContactModalClose();
      fetchDetails();
    } catch (err) {
      toast({ title: 'Error saving contact', description: err.message, status: 'error' });
    } finally {
      setIsContactSubmitting(false);
    }
  };

  const initiateContactDelete = (contact) => {
    setContactToDelete(contact);
    onContactDeleteOpen();
  };

  const confirmContactDelete = async () => {
    if (!contactToDelete) return;
    setIsContactSubmitting(true);
    try {
      await PlacementService.deleteCompanyContact(id, contactToDelete.id);
      toast({ title: 'Contact deleted', status: 'success' });
      onContactDeleteClose();
      
      // Refresh details before adjusting index to get accurate count
      await fetchDetails();
      
      // Adjust index if we're on the last page and it becomes empty
      if (contacts.length % CARDS_PER_PAGE === 1 && currentPage === totalPages - 1 && currentPage > 0) {
        setCurrentContactIndex((currentPage - 1) * CARDS_PER_PAGE);
      }
    } catch (err) {
      toast({ title: 'Error deleting contact', description: err.message, status: 'error' });
    } finally {
      setIsContactSubmitting(false);
      setContactToDelete(null);
    }
  };

  const companyLogoById = useMemo(
    () =>
      company
        ? buildCompanyLogoById([
            {
              id: company.id,
              company_logo_link: company.company_logo_link || company.logo,
            },
          ])
        : {},
    [company]
  );

  const handleSendDriveNotification = useCallback(
    async (drive, e) => {
      if (e) e.stopPropagation();
      setNotifyingDriveId(drive.id);
      try {
        const { title, message, link, notification_type } = buildDriveNotificationContent(
          drive,
          company?.company_name
        );
        const created = await NotificationService.create({
          title,
          message,
          notification_type,
          link,
        });
        toast({
          title: 'Notification created',
          description: 'Redirecting to send to students.',
          status: 'success',
          duration: 2000,
        });
        navigateToPlacementNotificationSend(navigate, {
          title,
          message,
          link,
          notification_type,
          openNotificationId: created?.id,
        });
      } catch (err) {
        toast({ title: 'Failed to create notification', status: 'error', description: err?.message, isClosable: true });
      } finally {
        setNotifyingDriveId(null);
      }
    },
    [company, navigate, toast]
  );

  const handleEditDrive = useCallback(
    (drive, e) => {
      e?.stopPropagation();
      navigate('/placement/events', { state: { editDriveId: drive.id } });
    },
    [navigate]
  );

  const refreshOffers = useCallback(async () => {
    try {
      const offersData = await PlacementService.getCompanyOffers(id);
      setOffers(offersData || []);
    } catch (err) {
      console.error('Refresh offers:', err);
    }
  }, [id]);

  const handleEditOffer = useCallback(
    (offer) => {
      setEditingOffer(offer);
      onOfferEditOpen();
    },
    [onOfferEditOpen]
  );

  const handleOfferEditClose = useCallback(() => {
    onOfferEditClose();
    setEditingOffer(null);
  }, [onOfferEditClose]);

  const Layout = isVc ? VcLayout : AdminLayout;
  if (loading) {
    return (
      <Layout>
        <Flex justify="center" align="center" minH="80vh">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      </Layout>
    );
  }

  if (!company) return null;

  return (
    <Layout>
      <Box className="company-details-page">
        <Container className="company-details-container" maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} pt={8}>
          <Flex className="company-details-topbar" justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <Box>
              <Heading as="h1" size="lg">Company Details</Heading>
              <Text>Profile, contacts, placement drives, and offers</Text>
            </Box>
            <Button
              leftIcon={<ArrowBackIcon />}
              size="sm"
              variant="outline"
              onClick={() => navigate('/placement/companies')}
              bg="white"
              borderColor="gray.200"
              _hover={{ bg: 'gray.50', borderColor: 'gray.300' }}
            >
              Back to companies
            </Button>
          </Flex>

          <Card className="company-details-hero" shadow="none" border="none">
            <CardBody p={6} position="relative">
              <Flex direction={{ base: 'column', md: 'row' }} gap={6} align="start">
                <Box 
                  flexShrink={0} 
                  border="1px solid" 
                  borderColor="gray.100" 
                  position="relative" 
                  role="group"
                  borderRadius="lg"
                  overflow="hidden"
                >
                  <CompanyLogo
                    src={company.logo || company.company_logo_link}
                    name={company.company_name}
                    boxSize="100px"
                    variant="square"
                  />
                  {!isVc && (
                    <Box
                      position="absolute"
                      top="0"
                      left="0"
                      right="0"
                      bottom="0"
                      bg="blackAlpha.400"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      opacity="0"
                      _groupHover={{ opacity: 1 }}
                      transition="all 0.2s"
                      cursor="pointer"
                      onClick={() => {
                        setNewLogo(company.company_logo_link || company.logo || '');
                        onImageOpen();
                      }}
                    >
                      <IconButton
                        icon={<EditIcon />}
                        w="40px"
                        h="40px"
                        variant="solid"
                        bg="gray.100"
                        color="gray.600"
                        borderRadius="full"
                        _hover={{ bg: 'white', color: 'blue.500' }}
                        aria-label="Edit logo"
                        pointerEvents="none"
                      />
                    </Box>
                  )}
                </Box>
                <Box flex="1">
                  <Flex justify="space-between" align="start">
                    <Heading size="md" mb={2}>{company.company_name}</Heading>
                    {company.company_type && (
                      <Badge colorScheme="blue" px={2} py={1} borderRadius="md">
                        {company.company_type}
                      </Badge>
                    )}
                  </Flex>
                  <Text color="gray.600" mb={4} fontSize="sm">
                    {company.description || 'No description available.'}
                  </Text>
                  <HStack spacing={6} fontSize="sm">
                    {company.website && (
                      <Link href={company.website} isExternal color="blue.500" fontWeight="medium">
                        Website <ExternalLinkIcon mx="2px" />
                      </Link>
                    )}
                    {company.linkedin && (
                      <Link href={company.linkedin} isExternal color="blue.600" fontWeight="medium">
                        LinkedIn <ExternalLinkIcon mx="2px" />
                      </Link>
                    )}
                  </HStack>
                </Box>
              </Flex>
              {!isVc && (
                <HStack position="absolute" bottom="4" right="4" spacing={2}>
                  <IconButton
                    icon={<EditIcon />}
                    size="sm"
                    colorScheme="blue"
                    variant="ghost"
                    onClick={openEdit}
                    aria-label="Edit company details"
                    borderRadius="full"
                    _hover={{ bg: 'blue.50', transform: 'scale(1.1)' }}
                    transition="all 0.2s"
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={onDeleteOpen}
                    aria-label="Delete company"
                    borderRadius="full"
                    _hover={{ bg: 'red.50', transform: 'scale(1.1)' }}
                    transition="all 0.2s"
                  />
                </HStack>
              )}
            </CardBody>
          </Card>

          <Box className="company-details-section">
            <Flex className="company-details-section-head">
              <Box>
                <Heading as="h2" size="md">Company Contacts</Heading>
                <Text className="section-sub">People at this organization</Text>
              </Box>
              <HStack spacing={2}>
                <span className="company-details-drives-count">{contacts.length}</span>
                {!isVc && (
                  <Button
                    leftIcon={<AddIcon />}
                    size="sm"
                    colorScheme="teal"
                    bg="#172e36"
                    _hover={{ bg: '#1e3a47' }}
                    onClick={openAddContact}
                    borderRadius="lg"
                  >
                    Add Contact
                  </Button>
                )}
              </HStack>
            </Flex>

              <Box className="company-details-contacts-body">
                {contacts.length > 0 ? (
                  <VStack spacing={6}>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} w="full">
                      {contacts.slice(currentPage * CARDS_PER_PAGE, (currentPage + 1) * CARDS_PER_PAGE).map((contact, idx) => (
                        <Card 
                          key={contact.id || idx}
                          borderRadius="xl" 
                          shadow="md" 
                          p={4} 
                          border="1px" 
                          borderColor="gray.100" 
                          bg="white"
                          _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                          transition="all 0.3s"
                        >
                          <HStack spacing={3} align="center" mb={4}>
                            <Avatar 
                              name={contact.contact_name} 
                              bg={getAvatarColor(contact.contact_name, currentPage * CARDS_PER_PAGE + idx)} 
                              color="white" 
                              size="md"
                              fontWeight="bold"
                            />
                            <VStack align="start" spacing={0} overflow="hidden">
                              <Text fontSize="md" fontWeight="bold" color="gray.800" noOfLines={1}>
                                {contact.contact_name}
                              </Text>
                              <Text fontSize="xs" color="gray.500" fontWeight="medium" noOfLines={1}>
                                {contact.role_title || 'No Title'}
                              </Text>
                            </VStack>
                          </HStack>

                          <VStack spacing={2} align="start" mb={4} px={1}>
                            {contact.email && (
                              <HStack spacing={2}>
                                <EmailIcon color="blue.400" fontSize="sm" />
                                <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                  {contact.email}
                                </Text>
                              </HStack>
                            )}
                            {contact.phone_number && (
                              <HStack spacing={2}>
                                <PhoneIcon color="blue.400" fontSize="sm" />
                                <Text fontSize="xs" color="gray.600">
                                  {contact.phone_number}
                                </Text>
                              </HStack>
                            )}
                          </VStack>

                          <Divider mb={3} />

                          <Flex justify="space-between">
                            {!isVc ? (
                              <>
                                <Button 
                                  leftIcon={<EditIcon />} 
                                  variant="ghost" 
                                  size="sm" 
                                  color="gray.500" 
                                  _hover={{ color: 'blue.500', bg: 'blue.50' }}
                                  onClick={() => openEditContact(contact)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                leftIcon={<DeleteIcon />} 
                                variant="ghost" 
                                size="sm" 
                                color="gray.500" 
                                _hover={{ color: 'red.500', bg: 'red.50' }}
                                onClick={() => initiateContactDelete(contact)}
                              >
                                Delete
                              </Button>
                              </>
                            ) : (
                              <Text fontSize="xx-small" color="gray.400" w="full" textAlign="center">
                                View only
                              </Text>
                            )}
                          </Flex>
                        </Card>
                      ))}
                    </SimpleGrid>

                    {contacts.length > CARDS_PER_PAGE && (
                      <HStack spacing={4} justify="flex-end" w="full">
                        <IconButton
                          icon={<ChevronLeftIcon />}
                          onClick={prevContact}
                          variant="outline"
                          colorScheme="blue"
                          size="sm"
                          aria-label="Previous page"
                          borderRadius="full"
                        />
                        <HStack spacing={2}>
                          {Array.from({ length: totalPages }).map((_, idx) => (
                            <Box
                              key={idx}
                              w={idx === currentPage ? "12px" : "6px"}
                              h="6px"
                              bg={idx === currentPage ? "blue.500" : "gray.300"}
                              borderRadius="full"
                              transition="all 0.3s"
                              cursor="pointer"
                              onClick={() => setCurrentContactIndex(idx * CARDS_PER_PAGE)}
                            />
                          ))}
                        </HStack>
                        <IconButton
                          icon={<ChevronRightIcon />}
                          onClick={nextContact}
                          variant="outline"
                          colorScheme="blue"
                          size="sm"
                          aria-label="Next page"
                          borderRadius="full"
                        />
                      </HStack>
                    )}
                  </VStack>
                ) : (
                  <Flex direction="column" align="center" justify="center" py={10}>
                    <Text color="gray.500" mb={4}>No contacts found for this company.</Text>
                    {!isVc && (
                      <Button leftIcon={<AddIcon />} colorScheme="blue" variant="outline" size="sm" onClick={openAddContact}>
                        Add First Contact
                      </Button>
                    )}
                  </Flex>
                )}
              </Box>
          </Box>

          <Box className="company-details-drives-block company-details-section">
            <Flex className="company-details-section-head">
              <Box>
                <Heading as="h2" size="md">Placement Drives</Heading>
              </Box>
              <HStack spacing={2}>
                <span className="company-details-drives-count">{drives.length}</span>
                {!isVc && (
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="gray.200"
                    onClick={() => navigate('/placement/events')}
                  >
                    All drives
                  </Button>
                )}
              </HStack>
            </Flex>
            <PlacementDrivesTable
              drives={drives}
              loading={loading}
              readOnly={isVc}
              companyLogoById={companyLogoById}
              onSendNotification={isVc ? undefined : handleSendDriveNotification}
              notifyingDriveId={notifyingDriveId}
              onEditDrive={isVc ? undefined : handleEditDrive}
              emptyMessage="No placement drives found for this company."
              actionsAsMenu
            />
          </Box>

          <Box className="company-details-section company-details-offers-section">
            <Flex className="company-details-section-head">
              <Box>
                <Heading as="h2" size="md">Students & Job Offers</Heading>
              </Box>
              <HStack spacing={2}>
                <span className="company-details-drives-count">{offers.length}</span>
                {!isVc && (
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="gray.200"
                    onClick={() => navigate('/placement/job-offers')}
                  >
                    All offers
                  </Button>
                )}
              </HStack>
            </Flex>
            <Box className="company-details-offers-table-inner" pb={4}>
              <JobOffersDataTable
                offers={offers}
                loading={loading}
                visibleColumns={COMPANY_PAGE_OFFER_COLUMNS}
                readOnly={isVc}
                onEditOffer={isVc ? undefined : handleEditOffer}
                emptyMessage="No student offers recorded yet for this company."
              />
            </Box>
          </Box>

          <JobOfferEditModal
            isOpen={isOfferEditOpen}
            onClose={handleOfferEditClose}
            offer={editingOffer}
            companies={company ? [{ id: company.id, company_name: company.company_name }] : []}
            lockCompany
            onSaved={refreshOffers}
          />

          <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Edit profile</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {editCompany && (
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Company Name</FormLabel>
                      <Input
                        value={editCompany.company_name}
                        onChange={(e) => handleEditCompanyChange('company_name', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        value={editCompany.description}
                        onChange={(e) => handleEditCompanyChange('description', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Company Type</FormLabel>
                      <Box position="relative">
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.400" />
                          </InputLeftElement>
                          <Input
                            placeholder="Search or type company type"
                            value={editCompany.company_type}
                            onChange={(e) => handleEditCompanyChange('company_type', e.target.value)}
                            onFocus={() => setCompanyTypeDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setCompanyTypeDropdownOpen(false), 200)}
                            pl={10}
                          />
                          <InputRightElement pointerEvents="none">
                            <ChevronDownIcon color="gray.400" />
                          </InputRightElement>
                        </InputGroup>
                        {companyTypeDropdownOpen && (
                          <Box
                            position="absolute"
                            top="100%"
                            left={0}
                            right={0}
                            mt={1}
                            bg="white"
                            borderWidth="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            shadow="lg"
                            zIndex={10}
                            maxH="200px"
                            overflowY="auto"
                          >
                            {(() => {
                              const query = (editCompany.company_type || '').toLowerCase().trim();
                              const commonTypes = ['Service', 'Product', 'Startup', 'Fintech', 'Consulting', 'EdTech', 'Ecommerce'];
                              const combinedTypes = [...new Set([...allCompanyTypes, ...commonTypes])];
                              const filtered = query
                                ? combinedTypes.filter(t => (t || '').toLowerCase().includes(query))
                                : combinedTypes;
                              const typedValue = (editCompany.company_type || '').trim();
                               const canAddNew = typedValue && !combinedTypes.some(t => (t || '').toLowerCase() === typedValue.toLowerCase());
                              return (
                                <>
                                  {filtered.map((type) => (
                                    <Box
                                      key={type}
                                      px={4}
                                      py={2}
                                      cursor="pointer"
                                      _hover={{ bg: 'gray.100' }}
                                      onClick={() => {
                                        handleEditCompanyChange('company_type', type);
                                        setCompanyTypeDropdownOpen(false);
                                      }}
                                    >
                                      <Text fontSize="sm">{type}</Text>
                                    </Box>
                                  ))}
                                  {canAddNew && (
                                    <Box
                                      px={4}
                                      py={2}
                                      cursor="pointer"
                                      _hover={{ bg: 'gray.100' }}
                                      bg="blue.50"
                                      borderTopWidth="1px"
                                      borderColor="gray.100"
                                      onClick={() => {
                                        handleEditCompanyChange('company_type', typedValue);
                                        setCompanyTypeDropdownOpen(false);
                                      }}
                                    >
                                      <Text fontSize="sm" fontWeight="medium" color="blue.600">
                                        Use &quot;{typedValue}&quot; (new type)
                                      </Text>
                                    </Box>
                                  )}
                                  {filtered.length === 0 && !canAddNew && (
                                    <Box px={4} py={3}>
                                      <Text fontSize="sm" color="gray.500">No matching types. Type to add new.</Text>
                                    </Box>
                                  )}
                                </>
                              );
                            })()}
                          </Box>
                        )}
                      </Box>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Address</FormLabel>
                      <Textarea value={editCompany.address} onChange={(e) => handleEditCompanyChange('address', e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Website</FormLabel>
                      <Input value={editCompany.website} onChange={(e) => handleEditCompanyChange('website', e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>LinkedIn</FormLabel>
                      <Input value={editCompany.linkedin} onChange={(e) => handleEditCompanyChange('linkedin', e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Remarks</FormLabel>
                      <VStack spacing={2} align="stretch">
                        {(Array.isArray(editCompany.remarks) ? editCompany.remarks : [editCompany.remarks || '']).map((r, idx) => (
                          <HStack key={idx}>
                            <Input
                              value={r}
                              onChange={(e) => {
                                const arr = Array.isArray(editCompany.remarks) ? [...editCompany.remarks] : [editCompany.remarks || ''];
                                arr[idx] = e.target.value;
                                handleEditCompanyChange('remarks', arr);
                              }}
                              placeholder={`Remark ${idx + 1}`}
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => {
                                const arr = Array.isArray(editCompany.remarks) ? [...editCompany.remarks] : [editCompany.remarks || ''];
                                const updated = arr.filter((_, i) => i !== idx);
                                handleEditCompanyChange('remarks', updated);
                              }}
                              aria-label="Delete remark"
                            />
                          </HStack>
                        ))}
                        <Button
                          size="sm"
                          leftIcon={<AddIcon />}
                          variant="outline"
                          onClick={() => handleEditCompanyChange('remarks', [...(Array.isArray(editCompany.remarks) ? editCompany.remarks : [editCompany.remarks || '']), ''])}
                        >
                          Add remark
                        </Button>
                      </VStack>
                    </FormControl>
                  </VStack>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onEditClose}>Cancel</Button>
                <Button colorScheme="blue" onClick={handleSaveEdit} isLoading={editSubmitting} loadingText="Saving">
                  Save
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isImageOpen} onClose={onImageClose}>
            <ModalOverlay backdropFilter="blur(4px)" />
            <ModalContent borderRadius="xl">
              <ModalHeader>Update Company Logo</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={6}>
                  <Box
                    w="120px"
                    h="120px"
                    borderRadius="lg"
                    overflow="hidden"
                    bg="gray.50"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    border="2px dashed"
                    borderColor="gray.200"
                    position="relative"
                  >
                    <Image
                      src={newLogo}
                      fallback={<AttachmentIcon boxSize={8} color="gray.300" />}
                      maxH="100%"
                      objectFit="contain"
                    />
                  </Box>
                  <VStack spacing={3} w="full">
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="bold">Upload New Logo</FormLabel>
                      <StyledFileInput accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setNewLogo(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </FormControl>
                    {newLogo && (
                      <Button
                        leftIcon={<DeleteIcon />}
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        w="full"
                        onClick={() => setNewLogo(null)}
                      >
                        Remove Logo
                      </Button>
                    )}
                  </VStack>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onImageClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleUpdateLogo}
                  isLoading={isUpdatingLogo}
                >
                  Save Changes
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <CompanyDeleteDialog
            isOpen={isDeleteOpen}
            onClose={handleDeleteClose}
            cancelRef={cancelRef}
            companyName={company?.company_name}
            counts={{
              drives: drives.length,
              contacts: contacts.length,
              offers: offers.length,
            }}
            offersAction={deleteOffersAction}
            onOffersActionChange={setDeleteOffersAction}
            onConfirm={handleDeleteCompany}
            isDeleting={isDeleting}
          />

          <AlertDialog
            isOpen={isContactDeleteOpen}
            leastDestructiveRef={cancelRef}
            onClose={onContactDeleteClose}
          >
            <AlertDialogOverlay>
              <AlertDialogContent borderRadius="xl">
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Delete Contact
                </AlertDialogHeader>

                <AlertDialogBody>
                  Are you sure you want to delete <strong>{contactToDelete?.contact_name}</strong>?
                  This action cannot be undone.
                </AlertDialogBody>

                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onContactDeleteClose}>
                    Cancel
                  </Button>
                  <Button colorScheme="red" onClick={confirmContactDelete} ml={3} isLoading={isContactSubmitting}>
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>

          <Modal isOpen={isContactModalOpen} onClose={onContactModalClose} size="md">
            <ModalOverlay backdropFilter="blur(4px)" />
            <ModalContent borderRadius="xl">
              <ModalHeader>{selectedContact.id ? 'Edit Contact' : 'Add New Contact'}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Full Name</FormLabel>
                    <Input
                      placeholder="e.g. John Doe"
                      value={selectedContact.contact_name}
                      onChange={(e) => setSelectedContact({ ...selectedContact, contact_name: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Role / Designation</FormLabel>
                    <Input
                      placeholder="e.g. HR Manager"
                      value={selectedContact.role_title}
                      onChange={(e) => setSelectedContact({ ...selectedContact, role_title: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Email Address</FormLabel>
                    <Input
                      type="email"
                      placeholder="hr@company.com"
                      value={selectedContact.email}
                      onChange={(e) => setSelectedContact({ ...selectedContact, email: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Phone Number</FormLabel>
                    <Input
                      placeholder="+91 XXXXX XXXXX"
                      value={selectedContact.phone_number}
                      onChange={(e) => setSelectedContact({ ...selectedContact, phone_number: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Remarks</FormLabel>
                    <Textarea
                      placeholder="Any additional notes..."
                      value={selectedContact.remarks}
                      onChange={(e) => setSelectedContact({ ...selectedContact, remarks: e.target.value })}
                    />
                  </FormControl>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onContactModalClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleContactSave}
                  isLoading={isContactSubmitting}
                >
                  {selectedContact.id ? 'Save Changes' : 'Add Contact'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Container>
      </Box>
    </Layout>
  );
};

export default CompanyDetails;
