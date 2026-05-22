import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Flex,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useDisclosure,
  Container,
  VStack,
  Textarea,
  Select,
  IconButton,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, DeleteIcon, ViewIcon, EditIcon, AttachmentIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import VcLayout from '../../components/VcLayout';
import { CompanyLogo } from '../../components/CompanyLogo';
import { StyledFileInput } from '../../components/ui/StyledFileInput';
import CompanyDeleteDialog from '../../components/placement/CompanyDeleteDialog';
import { PlacementService } from '../../services/placement.service';
import { useAuth } from '../../context/AuthContext';
import { usePlacementBack } from '../../hooks/usePlacementBack';
import { buildPlacementNavState } from '../../utils/placementNavigationHistory';

const emptyContact = () => ({ contact_name: '', email: '', phone_number: '', role_title: '', remarks: '' });

const toCamelCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word, i) => (i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join('');
};

const Companies = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { userRole } = useAuth();
  const isVc = (userRole || '').toLowerCase() === 'vc';
  const { backLabel, goBack } = usePlacementBack(
    isVc ? '/placement/dashboard' : '/placement/companies'
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState(null); // null = All Schools
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [createdCompanyId, setCreatedCompanyId] = useState(null);
  const [createdCompanyName, setCreatedCompanyName] = useState('');
  const [contactsList, setContactsList] = useState([emptyContact()]);

  const [newCompany, setNewCompany] = useState({
    company_name: '',
    description: '',
    company_type: '',
    address: '',
    website: '',
    linkedin: '',
    logo: '',
  });
  const [remarksList, setRemarksList] = useState(['']);
  const [companyTypeDropdownOpen, setCompanyTypeDropdownOpen] = useState(false);
  const companyTypeInputRef = useRef(null);
  const companyTypeListRef = useRef(null);

  const [schoolsList, setSchoolsList] = useState([]); // [{ id, name, count }] from API
  const [totalCompanies, setTotalCompanies] = useState(0); // total when no filter (for All Schools card)

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, company: null });
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [newLogo, setNewLogo] = useState(null);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOffersAction, setDeleteOffersAction] = useState('delete');
  const [deletePreview, setDeletePreview] = useState({ drives: 0, contacts: 0, offers: 0 });
  const [deletePreviewLoading, setDeletePreviewLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, [selectedSchoolId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === '1') {
      onOpen();
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname]);

  const fetchCompanies = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { companies: companyList, schoolsList: schools, totalCompanies: total } = await PlacementService.getCompaniesWithSchools(selectedSchoolId ?? undefined);
      setCompanies(Array.isArray(companyList) ? companyList : []);
      setSchoolsList(Array.isArray(schools) ? schools : []);
      setTotalCompanies(total ?? companyList?.length ?? 0);
    } catch (err) {
      setCompanies([]);
      setSchoolsList([]);
      setTotalCompanies(0);
      const msg = err?.message || '';
      if (msg.includes('403') || msg.includes('Forbidden') || msg.includes('Session expired')) {
        setFetchError('Session expired. Please log out and log in again.');
        toast({ title: 'Session expired', description: 'Please log out and log in again.', status: 'error', duration: 5000, isClosable: true });
      } else {
        setFetchError(msg || 'Failed to load companies');
        toast({ title: 'Error fetching companies', description: msg || 'Please try again.', status: 'error', duration: 4000, isClosable: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCompany((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setNewCompany((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemarkChange = (index, value) => {
    const updated = [...remarksList];
    updated[index] = value;
    setRemarksList(updated);
  };

  const handleAddRemark = () => setRemarksList([...remarksList, '']);
  const handleRemoveRemark = (index) => setRemarksList(remarksList.filter((_, i) => i !== index));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewCompany((prev) => ({ ...prev, logo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const resetAddModal = () => {
    setAddStep(1);
    setCreatedCompanyId(null);
    setCreatedCompanyName('');
    setContactsList([emptyContact()]);
    setNewCompany({ company_name: '', description: '', company_type: '', address: '', website: '', linkedin: '', logo: '' });
    setRemarksList(['']);
  };

  const handleCloseAddModal = () => {
    resetAddModal();
    onClose();
  };

  const handleAddCompany = async () => {
    const name = (newCompany.company_name || '').trim();
    if (!name) {
      toast({ title: 'Company name is required', status: 'warning' });
      return;
    }
    const remarks = remarksList.map((r) => (r || '').trim()).filter(Boolean);
    const companyTypeRaw = (newCompany.company_type || '').trim();
    const payload = {
      company_name: name,
      description: newCompany.description || null,
      company_type: companyTypeRaw || null,
      address: newCompany.address || null,
      website: newCompany.website || null,
      linkedin: newCompany.linkedin || null,
      remarks: remarks.length ? remarks : null,
      company_logo_link: newCompany.logo || null,
    };
    setAddSubmitting(true);
    try {
      const created = await PlacementService.addCompany(payload);
      toast({ title: 'Company added. Add contacts (optional) or skip.', status: 'success' });
      setCreatedCompanyId(created.id);
      setCreatedCompanyName(created.company_name || name);
      setAddStep(2);
      setContactsList([emptyContact()]);
    } catch (err) {
      toast({ title: err.message || 'Error adding company', status: 'error' });
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleContextMenu = (e, company) => {
    if (isVc) return;
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.pageX,
      y: e.y,
      company
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const loadDeletePreview = async (companyId) => {
    setDeletePreviewLoading(true);
    setDeletePreview({ drives: 0, contacts: 0, offers: 0 });
    try {
      const [contactsData, drivesData, offersData] = await Promise.all([
        PlacementService.getCompanyContacts(companyId),
        PlacementService.getCompanyDrives(companyId),
        PlacementService.getCompanyOffers(companyId),
      ]);
      setDeletePreview({
        drives: Array.isArray(drivesData) ? drivesData.length : 0,
        contacts: Array.isArray(contactsData) ? contactsData.length : 0,
        offers: Array.isArray(offersData) ? offersData.length : 0,
      });
    } catch (err) {
      toast({
        title: 'Could not load delete preview',
        description: err.message,
        status: 'warning',
      });
    } finally {
      setDeletePreviewLoading(false);
    }
  };

  const handleAction = (action) => {
    const { company } = contextMenu;
    closeContextMenu();
    if (!company) return;

    switch (action) {
      case 'view':
        navigate(`/placement/company/${company.id}`, { state: buildPlacementNavState(location) });
        break;
      case 'edit':
        navigate(`/placement/company/${company.id}?edit=1`, { state: buildPlacementNavState(location) });
        break;
      case 'image':
        setSelectedCompany(company);
        setNewLogo(null);
        onImageOpen();
        break;
      case 'delete':
        setSelectedCompany(company);
        setDeleteOffersAction('delete');
        onDeleteOpen();
        loadDeletePreview(company.id);
        break;
      default:
        break;
    }
  };

  const handleUpdateLogo = async () => {
    if (!newLogo || !selectedCompany) return;
    setIsUpdatingLogo(true);
    try {
      await PlacementService.updateCompany(selectedCompany.id, {
        ...selectedCompany,
        company_logo_link: newLogo
      });
      toast({ title: 'Logo updated successfully', status: 'success' });
      onImageClose();
      fetchCompanies();
    } catch (err) {
      toast({ title: 'Error updating logo', description: err.message, status: 'error' });
    } finally {
      setIsUpdatingLogo(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;
    setIsDeleting(true);
    try {
      await PlacementService.deleteCompany(selectedCompany.id, { offersAction: deleteOffersAction });
      toast({ title: 'Company deleted', status: 'success' });
      handleDeleteClose();
      fetchCompanies();
    } catch (err) {
      toast({ title: 'Error deleting company', description: err.message, status: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClose = () => {
    setDeleteOffersAction('delete');
    setDeletePreview({ drives: 0, contacts: 0, offers: 0 });
    setDeletePreviewLoading(false);
    onDeleteClose();
  };

  const handleContactChange = (index, field, value) => {
    const updated = [...contactsList];
    if (!updated[index]) updated[index] = emptyContact();
    updated[index] = { ...updated[index], [field]: value };
    setContactsList(updated);
  };
  const handleAddContact = () => setContactsList([...contactsList, emptyContact()]);
  const handleRemoveContact = (index) => setContactsList(contactsList.filter((_, i) => i !== index));

  const handleSkipContacts = () => {
    fetchCompanies();
    handleCloseAddModal();
  };

  const handleDoneContacts = async () => {
    const toSave = contactsList
      .map((c) => ({
        contact_name: (c.contact_name || '').trim() || null,
        email: (c.email || '').trim() || null,
        phone_number: (c.phone_number || '').trim() || null,
        role_title: (c.role_title || '').trim() || null,
        remarks: (c.remarks || '').trim() || null,
      }))
      .filter((c) => c.contact_name || c.email || c.phone_number);
    setAddSubmitting(true);
    try {
      if (toSave.length > 0) {
        await PlacementService.addCompanyContacts(createdCompanyId, toSave);
        toast({ title: 'Contacts added', status: 'success' });
      }
      fetchCompanies();
      handleCloseAddModal();
    } catch (err) {
      toast({ title: err.message || 'Error saving contacts', status: 'error' });
    } finally {
      setAddSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter((c) =>
    (c.company_name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const Layout = isVc ? VcLayout : AdminLayout;
  return (
    <Layout>
      <Box bg="#f0f0f0" minH="100vh" pb={10}>
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} pt={8}>
          <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
              <Heading size="lg" color="gray.800">{isVc ? 'View All Companies' : 'All Companies'}</Heading>
              <Text color="gray.500" fontSize="sm">{isVc ? 'Hiring partners (view only)' : 'Browse hiring partners; click for full details'}</Text>
            </Box>
            {!isVc && (
              <HStack spacing={3}>
                <Button
                  bg="#22c35e"
                  color="white"
                  _hover={{ bg: '#1da851' }}
                  leftIcon={<AddIcon />}
                  onClick={onOpen}
                  size="sm"
                >
                  Add Company
                </Button>
                <Button variant="outline" borderColor="gray.300" onClick={goBack} size="sm" bg="white">
                  {backLabel}
                </Button>
              </HStack>
            )}
            {isVc && (
              <Button variant="outline" borderColor="gray.300" onClick={goBack} size="sm" bg="white">
                {backLabel}
              </Button>
            )}
          </Flex>

          <Box bg="white" p={4} borderRadius="xl" shadow="sm" mb={6}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search companies"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="gray.50"
                border="none"
                _focus={{ bg: 'white', boxShadow: 'outline' }}
              />
            </InputGroup>
          </Box>

          <Box mb={8}>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="bold" color="gray.700" fontSize="sm">Filter by School</Text>
              {selectedSchoolId != null && (
                <Button size="xs" onClick={() => setSelectedSchoolId(null)}>Clear</Button>
              )}
            </Flex>
            <Flex gap={4} wrap="wrap">
              <Card
                bg="white"
                boxShadow="sm"
                borderRadius="xl"
                cursor="pointer"
                border={selectedSchoolId == null ? '2px solid #d1a85d' : '1px solid transparent'}
                onClick={() => setSelectedSchoolId(null)}
                minW="100px"
                _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                <CardBody p={3} textAlign="center">
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>All Schools</Text>
                  <Text fontSize="lg" fontWeight="bold" color="blue.600">{selectedSchoolId == null ? companies.length : totalCompanies}</Text>
                </CardBody>
              </Card>
              {schoolsList.map((school) => (
                <Card
                  key={school.id}
                  bg="white"
                  boxShadow="sm"
                  borderRadius="xl"
                  cursor="pointer"
                  border={selectedSchoolId === school.id ? '2px solid #d1a85d' : '1px solid transparent'}
                  onClick={() => setSelectedSchoolId(selectedSchoolId === school.id ? null : school.id)}
                  minW="100px"
                  _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <CardBody p={3} textAlign="center">
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1} noOfLines={2}>{school.name}</Text>
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">{school.count}</Text>
                  </CardBody>
                </Card>
              ))}
            </Flex>
          </Box>

          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner size="xl" color="blue.500" />
            </Flex>
          ) : fetchError ? (
            <Alert status="error" borderRadius="lg" flexDirection="column" alignItems="stretch" textAlign="center" py={6}>
              <AlertIcon boxSize="6" />
              <AlertTitle>Could not load companies</AlertTitle>
              <AlertDescription mb={4}>{fetchError}</AlertDescription>
              <Button colorScheme="red" variant="outline" size="sm" onClick={fetchCompanies} alignSelf="center">
                Retry
              </Button>
            </Alert>
          ) : filteredCompanies.length === 0 ? (
            <Box bg="white" p={8} borderRadius="xl" shadow="sm" textAlign="center">
              <Text color="gray.500">
                {companies.length === 0
                  ? 'No companies yet. Add one with the button above.'
                  : 'No companies match your search.'}
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing={6}>
              {filteredCompanies.map((company) => (
                <Flex
                  key={company.id}
                  direction="column"
                  align="center"
                  justify="center"
                  p={4}
                  bg="transparent"
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                  cursor="pointer"
                  onClick={() =>
                    navigate(`/placement/company/${company.id}`, {
                      state: buildPlacementNavState(location),
                    })
                  }
                  onContextMenu={(e) => handleContextMenu(e, company)}
                >
                  <Box boxShadow="sm" mb={2}>
                    <CompanyLogo
                      src={company.logo || company.company_logo_link}
                      name={company.company_name}
                      boxSize="80px"
                    />
                  </Box>
                  <Text fontWeight="bold" fontSize="md" color="gray.800" textAlign="center" noOfLines={2}>
                    {company.company_name}
                  </Text>
                </Flex>
              ))}
            </SimpleGrid>
          )}

          <Modal isOpen={isOpen} onClose={handleCloseAddModal} size="xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>{addStep === 1 ? 'Add Company' : `Add contacts for ${createdCompanyName}`}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {addStep === 1 ? (
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Company Name</FormLabel>
                      <Input
                        name="company_name"
                        value={newCompany.company_name}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        name="description"
                        value={newCompany.description}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Company Type</FormLabel>
                      <Box position="relative" ref={companyTypeListRef}>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.400" />
                          </InputLeftElement>
                          <Input
                            placeholder="Search or type company type"
                            value={newCompany.company_type}
                            onChange={(e) => handleSelectChange('company_type', e.target.value)}
                            onFocus={() => setCompanyTypeDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setCompanyTypeDropdownOpen(false), 150)}
                            pl={10}
                            ref={companyTypeInputRef}
                          />
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
                              const query = (newCompany.company_type || '').toLowerCase().trim();
                              const uniqueTypes = [...new Set(companies.map(c => c.company_type).filter(Boolean))];
                              const filtered = query
                                ? uniqueTypes.filter(t => (t || '').toLowerCase().includes(query))
                                : uniqueTypes;
                              const typedValue = (newCompany.company_type || '').trim();
                              const canAddNew = typedValue && !uniqueTypes.some(t => (t || '').toLowerCase() === typedValue.toLowerCase());
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
                                        handleSelectChange('company_type', type);
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
                                        handleSelectChange('company_type', typedValue);
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
                      <Textarea name="address" value={newCompany.address} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Website</FormLabel>
                      <Input name="website" value={newCompany.website} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>LinkedIn</FormLabel>
                      <Input name="linkedin" value={newCompany.linkedin} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Logo</FormLabel>
                      <StyledFileInput accept="image/*" onChange={handleLogoChange} acceptLabel="Images" />
                      {newCompany.logo && (
                        <Image src={newCompany.logo} alt="Preview" boxSize="50px" mt={2} objectFit="contain" />
                      )}
                    </FormControl>
                    <FormControl>
                      <FormLabel>Remarks</FormLabel>
                      <VStack spacing={2} align="stretch">
                        {remarksList.map((remark, index) => (
                          <HStack key={index}>
                            <Input
                              value={remark}
                              onChange={(e) => handleRemarkChange(index, e.target.value)}
                              placeholder={`Remark ${index + 1}`}
                            />
                            {remarksList.length > 1 && (
                              <IconButton
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleRemoveRemark(index)}
                                aria-label="Remove remark"
                              />
                            )}
                          </HStack>
                        ))}
                        <Button leftIcon={<AddIcon />} size="sm" onClick={handleAddRemark} alignSelf="flex-start">
                          Add Remark
                        </Button>
                      </VStack>
                    </FormControl>
                  </VStack>
                ) : (
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.600">You can add contacts now or skip and add them later from the company profile.</Text>
                    {contactsList.map((contact, index) => (
                      <Box key={index} p={3} borderWidth="1px" borderRadius="md" borderColor="gray.200">
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="medium" fontSize="sm">Contact {index + 1}</Text>
                          {contactsList.length > 1 && (
                            <IconButton
                              icon={<DeleteIcon />}
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleRemoveContact(index)}
                              aria-label="Remove contact"
                            />
                          )}
                        </HStack>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                          <FormControl>
                            <FormLabel fontSize="xs">Name</FormLabel>
                            <Input
                              size="sm"
                              value={contact.contact_name}
                              onChange={(e) => handleContactChange(index, 'contact_name', e.target.value)}
                              placeholder="Contact name"
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="xs">Email</FormLabel>
                            <Input
                              size="sm"
                              type="email"
                              value={contact.email}
                              onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                              placeholder="email@company.com"
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="xs">Phone</FormLabel>
                            <Input
                              size="sm"
                              value={contact.phone_number}
                              onChange={(e) => handleContactChange(index, 'phone_number', e.target.value)}
                              placeholder="Phone number"
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="xs">Role / Title</FormLabel>
                            <Input
                              size="sm"
                              value={contact.role_title}
                              onChange={(e) => handleContactChange(index, 'role_title', e.target.value)}
                              placeholder="e.g. HR, Recruiter"
                            />
                          </FormControl>
                          <FormControl gridColumn={{ base: '1', md: '1 / -1' }}>
                            <FormLabel fontSize="xs">Remarks</FormLabel>
                            <Input
                              size="sm"
                              value={contact.remarks}
                              onChange={(e) => handleContactChange(index, 'remarks', e.target.value)}
                              placeholder="Optional"
                            />
                          </FormControl>
                        </SimpleGrid>
                      </Box>
                    ))}
                    <Button leftIcon={<AddIcon />} size="sm" onClick={handleAddContact} alignSelf="flex-start" variant="outline">
                      Add another contact
                    </Button>
                  </VStack>
                )}
              </ModalBody>
              <ModalFooter>
                {addStep === 1 ? (
                  <>
                    <Button variant="ghost" mr={3} onClick={handleCloseAddModal}>Cancel</Button>
                    <Button
                      colorScheme="green"
                      bg="#22c35e"
                      onClick={handleAddCompany}
                      isLoading={addSubmitting}
                      loadingText="Saving"
                    >
                      Save & Add Contacts
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" mr={3} onClick={handleSkipContacts}>Skip</Button>
                    <Button
                      colorScheme="green"
                      bg="#22c35e"
                      onClick={handleDoneContacts}
                      isLoading={addSubmitting}
                      loadingText="Saving"
                    >
                      Done
                    </Button>
                  </>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>
      

        {/* Custom Context Menu */}
        {contextMenu.isOpen && (
          <Portal>
            <Box
              position="fixed"
              top={contextMenu.y}
              left={contextMenu.x}
              zIndex={1000}
              bg="white"
              boxShadow="xl"
              borderRadius="md"
              py={1}
              minW="160px"
              border="1px"
              borderColor="gray.200"
              onClick={(e) => e.stopPropagation()}
              onMouseLeave={closeContextMenu}
            >
              <VStack align="stretch" spacing={0}>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={<ViewIcon />}
                  borderRadius={0}
                  fontWeight="normal"
                  size="sm"
                  onClick={() => handleAction('view')}
                >
                  View Company
                </Button>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={<EditIcon />}
                  borderRadius={0}
                  fontWeight="normal"
                  size="sm"
                  onClick={() => handleAction('edit')}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={<AttachmentIcon />}
                  borderRadius={0}
                  fontWeight="normal"
                  size="sm"
                  onClick={() => handleAction('image')}
                >
                  Edit Logo
                </Button>
                <Box h="1px" bg="gray.100" my={1} />
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={<DeleteIcon />}
                  borderRadius={0}
                  fontWeight="normal"
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleAction('delete')}
                >
                  Delete Company
                </Button>
              </VStack>
            </Box>
          </Portal>
        )}

        <CompanyDeleteDialog
          isOpen={isDeleteOpen}
          onClose={handleDeleteClose}
          cancelRef={cancelRef}
          companyName={selectedCompany?.company_name}
          counts={deletePreview}
          countsLoading={deletePreviewLoading}
          offersAction={deleteOffersAction}
          onOffersActionChange={setDeleteOffersAction}
          onConfirm={handleDeleteCompany}
          isDeleting={isDeleting}
        />

        {/* Edit Logo Modal */}
        <Modal isOpen={isImageOpen} onClose={onImageClose}>
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent borderRadius="xl">
            <ModalHeader>Update Company Logo</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
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
                >
                  <Image
                    src={newLogo || selectedCompany?.company_logo_link}
                    fallback={<AttachmentIcon boxSize={8} color="gray.300" />}
                    maxH="100%"
                    objectFit="contain"
                  />
                </Box>
                <FormControl>
                  <FormLabel>Logo URL</FormLabel>
                  <Input
                    placeholder="Enter new logo URL"
                    value={newLogo || ''}
                    onChange={(e) => setNewLogo(e.target.value)}
                  />
                  <Text fontSize="xs" color="gray.500" mt={2}>Or upload a file:</Text>
                  <StyledFileInput accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setNewLogo(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </FormControl>
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
                isDisabled={!newLogo}
              >
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        </Container>
      </Box>
    </Layout>
  );
};

export default Companies;
