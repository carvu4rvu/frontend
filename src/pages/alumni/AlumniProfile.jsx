import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  Container,
  Spinner,
  useToast,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  Badge,
  Flex,
  Divider,
  Link,
  SimpleGrid,
  Avatar,
  IconButton,
  Textarea,
  Icon,
  Tooltip,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { 
  EditIcon, 
  CheckIcon, 
  CloseIcon, 
  EmailIcon, 
  PhoneIcon,
  ExternalLinkIcon,
} from '@chakra-ui/icons';
import { FiCamera, FiMapPin, FiBriefcase, FiLinkedin, FiGlobe, FiCalendar, FiUser, FiHome, FiEdit3, FiSave, FiX } from 'react-icons/fi';
import AlumniLayout from '../../components/AlumniLayout';
import { PlacementService } from '../../services/placement.service';
import { getFileUrl } from '../../utils/fileUrl';

// Color Palette
const colors = {
  primary: '#f8fafc',
  accent: '#d3a75c',
  accentHover: '#c4983f',
  accentLight: '#f5edde',
  secondary: '#64748b', // bluish gray
  secondaryLight: '#94a3b8',
  secondaryDark: '#475569',
  dark: '#1e293b',
  cardBg: '#ffffff',
  cardBgAlt: '#f8fafc',
  pageBg: '#e2e8f0',
  headerBg: '#334155',
  border: '#cbd5e1',
  inputBg: '#f1f5f9',
};

const FIELD_LABELS = {
  full_name: 'Full Name',
  graduation_year: 'Graduation Year',
  institution_name: 'Institution',
  current_company: 'Current Company',
  current_designation: 'Designation',
  current_work_location: 'Location',
  personal_email: 'Email',
  phone_number: 'Phone',
  linkedin: 'LinkedIn',
  other_links: 'Portfolio / Website',
  alumni_remark: 'Bio',
};

const initialForm = {
  full_name: '',
  graduation_year: '',
  institution_name: '',
  current_company: '',
  current_designation: '',
  current_work_location: '',
  personal_email: '',
  phone_number: '',
  linkedin: '',
  other_links: '',
  alumni_remark: '',
};

const AlumniProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [imageUploading, setImageUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getAlumniMe();
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        graduation_year: data.graduation_year ?? '',
        institution_name: data.institution_name || '',
        current_company: data.current_company || '',
        current_designation: data.current_designation || '',
        current_work_location: data.current_work_location || '',
        personal_email: data.personal_email || '',
        phone_number: data.phone_number || '',
        linkedin: data.linkedin || '',
        other_links: typeof data.other_links === 'object' && data.other_links?.url
          ? data.other_links.url
          : (data.other_links && typeof data.other_links === 'string' ? data.other_links : ''),
        alumni_remark: data.alumni_remark || '',
      });
    } catch (err) {
      toast({
        title: 'Could not load profile',
        description: err.message || 'Please try again.',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Image too large', description: 'Max 5MB allowed', status: 'warning' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file', description: 'Please select an image', status: 'warning' });
        return;
      }
      setPendingImage(file);
      setPendingImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let profileImageUrl = profile?.profile_image;

      if (pendingImage && profile?.id) {
        setImageUploading(true);
        try {
          const uploadResult = await PlacementService.uploadAlumniImage(profile.id, pendingImage);
          profileImageUrl = uploadResult?.url || uploadResult?.path || profileImageUrl;
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
          toast({ title: 'Image upload failed', description: uploadErr.message, status: 'warning' });
        } finally {
          setImageUploading(false);
        }
      }

      const payload = {
        ...form,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year, 10) : null,
        other_links: form.other_links ? (form.other_links.trim() ? { url: form.other_links.trim() } : null) : null,
        profile_image: profileImageUrl,
      };
      const updated = await PlacementService.updateAlumniMe(payload);
      setProfile(updated);
      setEditing(false);
      setPendingImage(null);
      setPendingImagePreview(null);
      toast({ title: 'Profile updated', status: 'success', isClosable: true });
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err.message || 'Please try again.',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      full_name: profile?.full_name || '',
      graduation_year: profile?.graduation_year ?? '',
      institution_name: profile?.institution_name || '',
      current_company: profile?.current_company || '',
      current_designation: profile?.current_designation || '',
      current_work_location: profile?.current_work_location || '',
      personal_email: profile?.personal_email || '',
      phone_number: profile?.phone_number || '',
      linkedin: profile?.linkedin || '',
      other_links:
        typeof profile?.other_links === 'object' && profile?.other_links?.url
          ? profile.other_links.url
          : (profile?.other_links && typeof profile.other_links === 'string' ? profile.other_links : ''),
      alumni_remark: profile?.alumni_remark || '',
    });
    setPendingImage(null);
    setPendingImagePreview(null);
    setEditing(false);
  };

  const getProfileImageUrl = () => {
    if (pendingImagePreview) return pendingImagePreview;
    if (profile?.profile_image) return getFileUrl(profile.profile_image);
    return null;
  };

  if (loading) {
    return (
      <AlumniLayout>
        <Flex justify="center" align="center" minH="60vh" bg={colors.pageBg}>
          <Spinner size="xl" color={colors.accent} thickness="3px" />
        </Flex>
      </AlumniLayout>
    );
  }

  if (!profile) {
    return (
      <AlumniLayout>
        <Box bg={colors.pageBg} minH="100vh" py={10}>
          <Container maxW="2xl">
            <Card bg={colors.cardBg} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor={colors.border}>
              <CardBody p={8}>
                <Text color={colors.secondary}>Profile not found. If you just registered, try logging in again.</Text>
              </CardBody>
            </Card>
          </Container>
        </Box>
      </AlumniLayout>
    );
  }

  const isVerified = profile.is_verified === true;
  const profileImage = getProfileImageUrl();

  // Input styles
  const inputStyles = {
    bg: colors.inputBg,
    borderColor: colors.border,
    borderRadius: 'lg',
    _hover: { borderColor: colors.secondary },
    _focus: { borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}`, bg: 'white' },
    _placeholder: { color: colors.secondaryLight },
  };

  return (
    <AlumniLayout>
      <Box bg={colors.pageBg} minH="100vh">
        {/* Header Section */}
        <Box bg={colors.headerBg} py={10}>
          <Container maxW="5xl">
            <Flex 
              direction={{ base: 'column', md: 'row' }} 
              align={{ base: 'center', md: 'center' }}
              gap={6}
            >
              {/* Profile Image */}
              <Box position="relative">
                <Avatar
                  size="2xl"
                  name={profile.full_name}
                  src={profileImage}
                  bg={colors.secondary}
                  color="white"
                  w="130px"
                  h="130px"
                  fontSize="2xl"
                  border="4px solid"
                  borderColor={colors.accent}
                  boxShadow="lg"
                />
                {editing && (
                  <Tooltip label="Change photo" placement="bottom">
                    <IconButton
                      icon={<FiCamera size={16} />}
                      position="absolute"
                      bottom={1}
                      right={1}
                      size="sm"
                      borderRadius="full"
                      bg={colors.accent}
                      color={colors.dark}
                      _hover={{ bg: colors.accentHover }}
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={imageUploading}
                      boxShadow="md"
                    />
                  </Tooltip>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </Box>

              {/* Name and Info */}
              <VStack align={{ base: 'center', md: 'flex-start' }} spacing={1} flex={1}>
                <HStack spacing={3} flexWrap="wrap" justify={{ base: 'center', md: 'flex-start' }}>
                  <Heading size="lg" color="white" fontWeight="600">
                    {profile.full_name || 'Alumni'}
                  </Heading>
                  {isVerified && (
                    <Badge
                      bg={colors.accent}
                      color={colors.dark}
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontWeight="600"
                    >
                      <HStack spacing={1}>
                        <CheckIcon boxSize={2.5} />
                        <Text>Verified</Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>
                
                {(profile.current_designation || profile.current_company) && (
                  <Text color={colors.accentLight} fontSize="md" fontWeight="500">
                    {profile.current_designation}{profile.current_designation && profile.current_company && ' at '}{profile.current_company}
                  </Text>
                )}
                
                <HStack spacing={4} mt={1} color={colors.secondaryLight} fontSize="sm">
                  {profile.current_work_location && (
                    <HStack spacing={1}>
                      <Icon as={FiMapPin} boxSize={3.5} />
                      <Text>{profile.current_work_location}</Text>
                    </HStack>
                  )}
                  {profile.graduation_year && (
                    <HStack spacing={1}>
                      <Icon as={FiCalendar} boxSize={3.5} />
                      <Text>Class of {profile.graduation_year}</Text>
                    </HStack>
                  )}
                </HStack>
              </VStack>

              {/* Edit Button */}
              <Box>
                {!editing ? (
                  <Button
                    leftIcon={<FiEdit3 />}
                    bg={colors.accent}
                    color={colors.dark}
                    _hover={{ bg: colors.accentHover }}
                    size="md"
                    fontWeight="600"
                    borderRadius="lg"
                    onClick={() => setEditing(true)}
                    px={6}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <HStack spacing={2}>
                    <Button 
                      leftIcon={<FiX />}
                      variant="outline"
                      borderColor="whiteAlpha.400"
                      color="white"
                      _hover={{ bg: 'whiteAlpha.200' }}
                      onClick={handleCancel} 
                      isDisabled={saving}
                      borderRadius="lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      leftIcon={<FiSave />}
                      bg={colors.accent}
                      color={colors.dark}
                      _hover={{ bg: colors.accentHover }}
                      onClick={handleSave}
                      isLoading={saving}
                      loadingText="Saving"
                      borderRadius="lg"
                    >
                      Save
                    </Button>
                  </HStack>
                )}
              </Box>
            </Flex>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxW="5xl" py={8}>
          {editing ? (
            /* Edit Form */
            <VStack spacing={5} align="stretch">
              {/* Personal Information Card */}
              <Card bg={colors.cardBgAlt} borderRadius="xl" boxShadow="md" border="1px solid" borderColor={colors.border}>
                <CardBody p={6}>
                  <HStack mb={5} pb={3} borderBottom="1px solid" borderColor={colors.border}>
                    <Flex 
                      w={9} h={9} 
                      bg={colors.accent}
                      borderRadius="lg" 
                      align="center" 
                      justify="center"
                    >
                      <Icon as={FiUser} color={colors.dark} boxSize={4} />
                    </Flex>
                    <Heading size="sm" color={colors.dark} fontWeight="600">Personal Information</Heading>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="500" color={colors.secondaryDark}>{FIELD_LABELS.full_name}</FormLabel>
                      <Input
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        {...inputStyles}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="500" color={colors.secondaryDark}>{FIELD_LABELS.graduation_year}</FormLabel>
                      <Input
                        name="graduation_year"
                        type="number"
                        value={form.graduation_year}
                        onChange={handleChange}
                        placeholder="e.g. 2022"
                        {...inputStyles}
                      />
                    </FormControl>
                    <FormControl gridColumn={{ md: 'span 2' }}>
                      <FormLabel fontSize="sm" fontWeight="500" color={colors.secondaryDark}>{FIELD_LABELS.institution_name}</FormLabel>
                      <Input
                        name="institution_name"
                        value={form.institution_name}
                        onChange={handleChange}
                        placeholder="College / University name"
                        {...inputStyles}
                      />
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Current Role Card */}
              <Card bg={colors.cardBgAlt} borderRadius="xl" boxShadow="md" border="1px solid" borderColor={colors.border}>
                <CardBody p={6}>
                  <HStack mb={5} pb={3} borderBottom="1px solid" borderColor={colors.border}>
                    <Flex 
                      w={9} h={9} 
                      bg={colors.accent}
                      borderRadius="lg" 
                      align="center" 
                      justify="center"
                    >
                      <Icon as={FiBriefcase} color={colors.dark} boxSize={4} />
                    </Flex>
                    <Heading size="sm" color={colors.dark} fontWeight="600">Current Role</Heading>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="500" color={colors.secondaryDark}>{FIELD_LABELS.current_company}</FormLabel>
                      <Input
                        name="current_company"
                        value={form.current_company}
                        onChange={handleChange}
                        placeholder="Company name"
                        {...inputStyles}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="500" color={colors.secondaryDark}>{FIELD_LABELS.current_designation}</FormLabel>
                      <Input
                        name="current_designation"
                        value={form.current_designation}
                        onChange={handleChange}
                        placeholder="Job title"
                        {...inputStyles}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="500" color={colors.secondaryDark}>{FIELD_LABELS.current_work_location}</FormLabel>
                      <Input
                        name="current_work_location"
                        value={form.current_work_location}
                        onChange={handleChange}
                        placeholder="City / Remote"
                        {...inputStyles}
                      />
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Contact Information Card */}
              <Card bg={colors.cardBgAlt} borderRadius="xl" boxShadow="md" border="1px solid" borderColor={colors.border}>
                <CardBody p={6}>
                  <HStack mb={5} pb={3} borderBottom="1px solid" borderColor={colors.border}>
                    <Flex 
                      w={9} h={9} 
                      bg={colors.accent}
                      borderRadius="lg" 
                      align="center" 
                      justify="center"
                    >
                      <EmailIcon color={colors.dark} boxSize={4} />
                    </Flex>
                    <Heading size="sm" color={colors.dark} fontWeight="600">Contact Information</Heading>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="500" color={colors.secondaryDark}>{FIELD_LABELS.personal_email}</FormLabel>
                      <Input
                        name="personal_email"
                        type="email"
                        value={form.personal_email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        {...inputStyles}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="500" color={colors.secondaryDark}>{FIELD_LABELS.phone_number}</FormLabel>
                      <Input
                        name="phone_number"
                        value={form.phone_number}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        {...inputStyles}
                      />
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Social Links Card */}
              <Card bg={colors.cardBgAlt} borderRadius="xl" boxShadow="md" border="1px solid" borderColor={colors.border}>
                <CardBody p={6}>
                  <HStack mb={5} pb={3} borderBottom="1px solid" borderColor={colors.border}>
                    <Flex 
                      w={9} h={9} 
                      bg={colors.accent}
                      borderRadius="lg" 
                      align="center" 
                      justify="center"
                    >
                      <Icon as={FiGlobe} color={colors.dark} boxSize={4} />
                    </Flex>
                    <Heading size="sm" color={colors.dark} fontWeight="600">Social Links</Heading>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="500" color={colors.secondaryDark}>{FIELD_LABELS.linkedin}</FormLabel>
                      <Input
                        name="linkedin"
                        value={form.linkedin}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/..."
                        {...inputStyles}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="500" color={colors.secondaryDark}>{FIELD_LABELS.other_links}</FormLabel>
                      <Input
                        name="other_links"
                        value={form.other_links}
                        onChange={handleChange}
                        placeholder="Portfolio or personal website"
                        {...inputStyles}
                      />
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Bio Card */}
              <Card bg={colors.cardBgAlt} borderRadius="xl" boxShadow="md" border="1px solid" borderColor={colors.border}>
                <CardBody p={6}>
                  <HStack mb={5} pb={3} borderBottom="1px solid" borderColor={colors.border}>
                    <Flex 
                      w={9} h={9} 
                      bg={colors.accent}
                      borderRadius="lg" 
                      align="center" 
                      justify="center"
                    >
                      <Icon as={FiUser} color={colors.dark} boxSize={4} />
                    </Flex>
                    <Heading size="sm" color={colors.dark} fontWeight="600">Bio</Heading>
                  </HStack>
                  
                  <FormControl>
                    <Textarea
                      name="alumni_remark"
                      value={form.alumni_remark}
                      onChange={handleChange}
                      placeholder="Share a brief bio, your journey, or advice for juniors..."
                      rows={4}
                      {...inputStyles}
                      resize="vertical"
                    />
                    <FormHelperText color={colors.secondaryLight} fontSize="xs">
                      This will be visible to students and other alumni
                    </FormHelperText>
                  </FormControl>
                </CardBody>
              </Card>
            </VStack>
          ) : (
            /* View Mode */
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={5}>
              {/* Left Column */}
              <VStack spacing={5} align="stretch">
                {/* About Card */}
                {profile.alumni_remark && (
                  <Card bg={colors.cardBgAlt} borderRadius="xl" boxShadow="md" border="1px solid" borderColor={colors.border}>
                    <CardBody p={6}>
                      <HStack mb={4}>
                        <Flex 
                          w={9} h={9} 
                          bg={colors.accent}
                          borderRadius="lg" 
                          align="center" 
                          justify="center"
                        >
                          <Icon as={FiUser} color={colors.dark} boxSize={4} />
                        </Flex>
                        <Text fontSize="sm" fontWeight="600" color={colors.secondaryDark} textTransform="uppercase" letterSpacing="wide">
                          About
                        </Text>
                      </HStack>
                      <Text color={colors.dark} fontSize="md" lineHeight="1.7">
                        {profile.alumni_remark}
                      </Text>
                    </CardBody>
                  </Card>
                )}

                {/* Experience Card */}
                <Card bg={colors.cardBgAlt} borderRadius="xl" boxShadow="md" border="1px solid" borderColor={colors.border}>
                  <CardBody p={6}>
                    <HStack mb={4}>
                      <Flex 
                        w={9} h={9} 
                        bg={colors.accent}
                        borderRadius="lg" 
                        align="center" 
                        justify="center"
                      >
                        <Icon as={FiBriefcase} color={colors.dark} boxSize={4} />
                      </Flex>
                      <Text fontSize="sm" fontWeight="600" color={colors.secondaryDark} textTransform="uppercase" letterSpacing="wide">
                        Current Position
                      </Text>
                    </HStack>
                    
                    <VStack align="stretch" spacing={3}>
                      <Box>
                        <Text fontWeight="600" color={colors.dark} fontSize="lg">
                          {profile.current_designation || 'No designation added'}
                        </Text>
                        <Text color={colors.secondary} fontSize="md">
                          {profile.current_company || 'No company added'}
                        </Text>
                      </Box>
                      {profile.current_work_location && (
                        <HStack color={colors.secondary} fontSize="sm">
                          <Icon as={FiMapPin} boxSize={4} />
                          <Text>{profile.current_work_location}</Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Education Card */}
                <Card bg={colors.cardBgAlt} borderRadius="xl" boxShadow="md" border="1px solid" borderColor={colors.border}>
                  <CardBody p={6}>
                    <HStack mb={4}>
                      <Flex 
                        w={9} h={9} 
                        bg={colors.accent}
                        borderRadius="lg" 
                        align="center" 
                        justify="center"
                      >
                        <Icon as={FiHome} color={colors.dark} boxSize={4} />
                      </Flex>
                      <Text fontSize="sm" fontWeight="600" color={colors.secondaryDark} textTransform="uppercase" letterSpacing="wide">
                        Education
                      </Text>
                    </HStack>
                    
                    <VStack align="stretch" spacing={1}>
                      <Text fontWeight="600" color={colors.dark} fontSize="md">
                        {profile.institution_name || 'No institution added'}
                      </Text>
                      {profile.graduation_year && (
                        <Text color={colors.secondary} fontSize="sm">
                          Class of {profile.graduation_year}
                        </Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>

              {/* Right Column - Contact */}
              <VStack spacing={5} align="stretch">
                {/* Contact Card */}
                <Card bg={colors.cardBgAlt} borderRadius="xl" boxShadow="md" border="1px solid" borderColor={colors.border}>
                  <CardBody p={6}>
                    <HStack mb={4}>
                      <Flex 
                        w={9} h={9} 
                        bg={colors.accent}
                        borderRadius="lg" 
                        align="center" 
                        justify="center"
                      >
                        <EmailIcon color={colors.dark} boxSize={4} />
                      </Flex>
                      <Text fontSize="sm" fontWeight="600" color={colors.secondaryDark} textTransform="uppercase" letterSpacing="wide">
                        Contact
                      </Text>
                    </HStack>
                    
                    <VStack align="stretch" spacing={3}>
                      {profile.personal_email ? (
                        <HStack 
                          p={3} 
                          bg={colors.inputBg} 
                          borderRadius="lg"
                          spacing={3}
                          border="1px solid"
                          borderColor={colors.border}
                        >
                          <Flex 
                            w={9} h={9} 
                            bg={colors.secondaryDark} 
                            borderRadius="lg" 
                            align="center" 
                            justify="center"
                          >
                            <EmailIcon color="white" boxSize={4} />
                          </Flex>
                          <Box>
                            <Text fontSize="xs" color={colors.secondary} fontWeight="500">Email</Text>
                            <Text fontSize="sm" color={colors.dark} fontWeight="500">{profile.personal_email}</Text>
                          </Box>
                        </HStack>
                      ) : null}
                      
                      {profile.phone_number ? (
                        <HStack 
                          p={3} 
                          bg={colors.inputBg} 
                          borderRadius="lg"
                          spacing={3}
                          border="1px solid"
                          borderColor={colors.border}
                        >
                          <Flex 
                            w={9} h={9} 
                            bg={colors.secondaryDark} 
                            borderRadius="lg" 
                            align="center" 
                            justify="center"
                          >
                            <PhoneIcon color="white" boxSize={4} />
                          </Flex>
                          <Box>
                            <Text fontSize="xs" color={colors.secondary} fontWeight="500">Phone</Text>
                            <Text fontSize="sm" color={colors.dark} fontWeight="500">{profile.phone_number}</Text>
                          </Box>
                        </HStack>
                      ) : null}
                      
                      {!profile.personal_email && !profile.phone_number && (
                        <Text color={colors.secondary} fontSize="sm" fontStyle="italic">
                          No contact info added
                        </Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Social Links Card */}
                <Card bg={colors.cardBgAlt} borderRadius="xl" boxShadow="md" border="1px solid" borderColor={colors.border}>
                  <CardBody p={6}>
                    <HStack mb={4}>
                      <Flex 
                        w={9} h={9} 
                        bg={colors.accent}
                        borderRadius="lg" 
                        align="center" 
                        justify="center"
                      >
                        <Icon as={FiGlobe} color={colors.dark} boxSize={4} />
                      </Flex>
                      <Text fontSize="sm" fontWeight="600" color={colors.secondaryDark} textTransform="uppercase" letterSpacing="wide">
                        Links
                      </Text>
                    </HStack>
                    
                    <VStack align="stretch" spacing={2}>
                      {profile.linkedin && (
                        <Link 
                          href={profile.linkedin} 
                          isExternal
                          _hover={{ textDecoration: 'none' }}
                        >
                          <HStack 
                            p={3} 
                            bg={colors.inputBg} 
                            borderRadius="lg"
                            _hover={{ bg: colors.accentLight }}
                            transition="all 0.2s"
                            spacing={3}
                            border="1px solid"
                            borderColor={colors.border}
                          >
                            <Flex 
                              w={9} h={9} 
                              bg="#0077B5" 
                              borderRadius="lg" 
                              align="center" 
                              justify="center"
                            >
                              <Icon as={FiLinkedin} color="white" boxSize={4} />
                            </Flex>
                            <Text flex={1} fontSize="sm" fontWeight="500" color={colors.dark}>LinkedIn</Text>
                            <ExternalLinkIcon color={colors.secondary} boxSize={3.5} />
                          </HStack>
                        </Link>
                      )}
                      
                      {profile.other_links && (
                        <Link 
                          href={
                            typeof profile.other_links === 'object' && profile.other_links?.url
                              ? profile.other_links.url
                              : profile.other_links
                          } 
                          isExternal
                          _hover={{ textDecoration: 'none' }}
                        >
                          <HStack 
                            p={3} 
                            bg={colors.inputBg} 
                            borderRadius="lg"
                            _hover={{ bg: colors.accentLight }}
                            transition="all 0.2s"
                            spacing={3}
                            border="1px solid"
                            borderColor={colors.border}
                          >
                            <Flex 
                              w={9} h={9} 
                              bg={colors.accent} 
                              borderRadius="lg" 
                              align="center" 
                              justify="center"
                            >
                              <Icon as={FiGlobe} color={colors.dark} boxSize={4} />
                            </Flex>
                            <Text flex={1} fontSize="sm" fontWeight="500" color={colors.dark}>Portfolio</Text>
                            <ExternalLinkIcon color={colors.secondary} boxSize={3.5} />
                          </HStack>
                        </Link>
                      )}
                      
                      {!profile.linkedin && !profile.other_links && (
                        <Text color={colors.secondary} fontSize="sm" fontStyle="italic">
                          No links added
                        </Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </Grid>
          )}
        </Container>
      </Box>
    </AlumniLayout>
  );
};

export default AlumniProfile;
