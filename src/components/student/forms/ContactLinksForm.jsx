import React from "react";
import {
  Box,
  VStack,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  HStack,
  Button,
  IconButton,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaPlus, FaTrash, FaGithub, FaLinkedin, FaInstagram, FaGoogle, FaLink, FaAddressBook, FaLink as FaLinkIcon } from "react-icons/fa";
import { Icon } from "@chakra-ui/react";

const Section = ({ title, bg, icon: IconComponent, children }) => (
  <Box
    bg={bg}
    borderRadius="xl"
    boxShadow="sm"
    p={{ base: 6, md: 8 }}
    border="1px solid"
    borderColor="gray.100"
  >
    <Heading size="md" mb={6} color="gray.700" display="flex" alignItems="center" gap={2}>
      {IconComponent && <Icon as={IconComponent} color="#d4a960" boxSize={5} />}
      {title}
    </Heading>
    {children}
  </Box>
);

export const ContactLinksForm = ({
  data = {},
  onUpdate,
  isEditing,
  fieldErrors = {},
}) => {
  const bg = "white"; // Clean white card
  const formData = data || {};
  const fe = fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {};
  // const borderColor = isEditing ? "#d4a960" : "gray.200"; // No border in card mode
  
  const inputVariant = isEditing ? "outline" : "unstyled";
  const inputPadding = isEditing ? 3 : 0;
  const focusBorderColor = "#d4a960";

  const handleChange = (field, value) => {
    onUpdate({ ...formData, [field]: value });
  };

  // Ensure links is always an array for rendering
  const linksArray = Array.isArray(formData.links) ? formData.links : [];

  const handleLinkChange = (idx, field, val) => {
    const next = [...linksArray];
    next[idx] = { ...next[idx], [field]: val };
    handleChange("links", next);
  };

  const handleAddLink = () => {
    handleChange("links", [...linksArray, { name: "", url: "" }]);
  };

  const handleRemoveLink = (idx) => {
    const next = [...linksArray];
    next.splice(idx, 1);
    handleChange("links", next);
  };

  const getLinkIcon = (name) => {
    const n = (name || "").trim().toLowerCase();
    if (n.includes("github")) return <FaGithub />;
    if (n.includes("linkedin")) return <FaLinkedin />;
    if (n.includes("instagram")) return <FaInstagram />;
    if (n.includes("gmail") || n.includes("mail")) return <FaGoogle />;
    return <FaLink />;
  };

  const isStudent = true; // For styling consistency if needed

  // Phone: exactly 10 digits only (no letters or symbols)
  const PHONE_LENGTH = 10;
  const handlePhoneChange = (raw) => {
    const digitsOnly = String(raw || "").replace(/\D/g, "").slice(0, PHONE_LENGTH);
    onUpdate({ ...formData, phoneCountryCode: "", phoneNumber: digitsOnly });
  };
  const phoneDisplay = String(formData.phoneNumber || "").replace(/\D/g, "").slice(0, PHONE_LENGTH);
  const phoneLen = phoneDisplay.length;
  const phoneInvalid = phoneLen > 0 && phoneLen !== PHONE_LENGTH;

  return (
    <VStack spacing={8} align="stretch">
      <Section title="Contact Details" bg={bg} icon={FaAddressBook}>
        <VStack spacing={6} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <FormControl>
              <FormLabel fontWeight="semibold" color="gray.700">College Email</FormLabel>
              <Text fontSize="lg" color="gray.800" py={1}>
                {formData.collegeEmail || formData.college_email || "—"}
              </Text>
            </FormControl>

            <FormControl isInvalid={!!(fe.personal_email || fe.personalEmail)}>
              <FormLabel fontWeight="semibold" color="gray.700">
                Personal Email
                {isEditing && (
                  <Text as="span" color="red.500" ml={2} fontSize="sm">*</Text>
                )}
              </FormLabel>
              <Input
                value={formData.personalEmail || ""}
                onChange={(e) => handleChange("personalEmail", e.target.value)}
                variant={inputVariant}
                focusBorderColor={focusBorderColor}
                px={inputPadding}
                type="email"
                isDisabled={!isEditing}
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
              />
              {(fe.personal_email || fe.personalEmail) && (
                <Text fontSize="sm" color="red.500" mt={1}>{fe.personal_email || fe.personalEmail}</Text>
              )}
              {isEditing && (
                <Text fontSize="sm" color="gray.700" mt={1}>Personal email is required and cannot be cleared.</Text>
              )}
            </FormControl>

            <FormControl isInvalid={phoneInvalid}>
              <FormLabel fontWeight="semibold" color="gray.700">
                Phone
                {isEditing && (
                  <Text as="span" color="red.500" ml={2} fontSize="sm">*</Text>
                )}
              </FormLabel>
              <Input
                value={phoneDisplay}
                onChange={(e) => handlePhoneChange(e.target.value)}
                variant={inputVariant}
                focusBorderColor={focusBorderColor}
                px={inputPadding}
                type="tel"
                inputMode="numeric"
                maxLength={PHONE_LENGTH}
                placeholder={isEditing ? "1234567890" : ""}
                isDisabled={!isEditing}
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
              />
              {phoneInvalid && (
                <Text fontSize="sm" color="red.500" mt={1}>Enter exactly 10 digits.</Text>
              )}
              {(fe.phoneNumber || fe.phone_number) && (
                <Text fontSize="sm" color="red.500" mt={1}>{fe.phoneNumber || fe.phone_number}</Text>
              )}
              {isEditing && (
                <Text fontSize="sm" color="gray.700" mt={1}>Phone number is required and cannot be cleared.</Text>
              )}
            </FormControl>
          </SimpleGrid>
        </VStack>
      </Section>

      <Section title="Links" bg={bg} icon={FaLinkIcon}>
        <VStack spacing={4} align="stretch">
          {isEditing && (
             <HStack justify="flex-end">
                <Button
                  leftIcon={<FaPlus />}
                  size="sm"
                  variant="outline"
                  colorScheme="orange"
                  borderColor="#d4a960"
                  color="#d4a960"
                  _hover={{ bg: "#fffaf0" }}
                  onClick={handleAddLink}
                >
                  Add Link
                </Button>
             </HStack>
          )}

          <VStack spacing={4} align="stretch">
            {linksArray.length === 0 && !isEditing && (
                <Text color="gray.700" fontSize="sm">No links added.</Text>
            )}
            {linksArray.map((it, idx) => {
              const linkError = fe.links || fe[`links[${idx}].url`] || fe[`link_${idx}`];
              return (
                <Box key={idx}>
                  <HStack spacing={4}>
                    <Box color="gray.700" fontSize="xl" minW="24px" display="flex" justifyContent="center">
                      {getLinkIcon(it.name)}
                    </Box>
                    <Input
                      value={it.name || ""}
                      onChange={(e) => handleLinkChange(idx, "name", e.target.value)}
                      placeholder="Name (e.g., LinkedIn)"
                      variant={inputVariant}
                      focusBorderColor={focusBorderColor}
                      px={inputPadding}
                      isDisabled={!isEditing}
                      w="30%"
                      fontWeight="medium"
                      autoComplete="off"
                      _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                    />
                    <FormControl isInvalid={!!linkError} flex={1}>
                      <Input
                        value={it.url || ""}
                        onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                        placeholder="Link (https://...)"
                        variant={inputVariant}
                        focusBorderColor={focusBorderColor}
                        px={inputPadding}
                        isDisabled={!isEditing}
                        color="blue.500"
                        autoComplete="off"
                        _disabled={{ opacity: 1, color: "blue.500", cursor: "pointer", textDecoration: "underline" }}
                      />
                    </FormControl>
                    {isEditing && (
                        <IconButton
                          aria-label="Remove link"
                          icon={<FaTrash />}
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleRemoveLink(idx)}
                        />
                    )}
                  </HStack>
                  {linkError && (
                    <Text fontSize="sm" color="red.500" mt={1} ml="40px">{linkError}</Text>
                  )}
                </Box>
              );
            })}
          </VStack>
        </VStack>
      </Section>
    </VStack>
  );
};
