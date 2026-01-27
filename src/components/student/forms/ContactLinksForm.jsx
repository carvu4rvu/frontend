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
import { FaPlus, FaTrash } from "react-icons/fa";

const Section = ({ title, bg, children }) => (
  <Box
    bg={bg}
    borderRadius="xl"
    boxShadow="sm"
    p={{ base: 6, md: 8 }}
    border="1px solid"
    borderColor="gray.100"
  >
    <Heading size="md" mb={6} color="gray.700">{title}</Heading>
    {children}
  </Box>
);

export const ContactLinksForm = ({
  data = {},
  onUpdate,
  isEditing,
}) => {
  const bg = "white"; // Clean white card
  const formData = data || {};
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

  const isStudent = true; // For styling consistency if needed

  // Parse "+91 9876543210" or "91-9876543210"
  // If no separator found, treat whole string as phone number (empty country code)
  const parsePhone = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return { phoneCountryCode: "", phoneNumber: "" };
    
    // Require at least one space or hyphen to separate code from number
    const m = /^\+?(\d{1,4})[\s-]+(.*)$/.exec(s);
    if (!m) {
      // No separator -> assume it's just the number
      return { phoneCountryCode: "", phoneNumber: s };
    }
    
    const code = m[1] || "";
    const rest = String(m[2] || "").replace(/[^\d]/g, "");
    return { phoneCountryCode: code ? `+${code}` : "", phoneNumber: rest || "" };
  };
  const phoneCombined = (() => {
    const cc = String(formData.phoneCountryCode || "").trim();
    const pn = String(formData.phoneNumber || "").trim();
    if (!cc && !pn) return "";
    if (!cc) return pn;
    const hasPlus = cc.startsWith("+");
    return `${hasPlus ? cc : `+${cc}`} ${pn}`.trim();
  })();

  return (
    <VStack spacing={8} align="stretch">
      <Section title="Contact Details" bg={bg}>
        <VStack spacing={6} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <FormControl>
              <FormLabel fontWeight="semibold" color="gray.600">College Email</FormLabel>
              <Input
                value={formData.collegeEmail || ""}
                onChange={(e) => handleChange("collegeEmail", e.target.value)}
                variant={inputVariant}
                focusBorderColor={focusBorderColor}
                px={inputPadding}
                type="email"
                isDisabled={!isEditing}
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="semibold" color="gray.600">Personal Email</FormLabel>
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
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="semibold" color="gray.600">Phone</FormLabel>
              <Input
                value={phoneCombined}
                onChange={(e) => {
                  const p = parsePhone(e.target.value);
                  const next = { ...formData, phoneCountryCode: p.phoneCountryCode || "", phoneNumber: p.phoneNumber || "" };
                  onUpdate(next);
                }}
                variant={inputVariant}
                focusBorderColor={focusBorderColor}
                px={inputPadding}
                type="tel"
                placeholder={isEditing ? "+91 9999999004" : ""}
                isDisabled={!isEditing}
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
              />
            </FormControl>
          </SimpleGrid>
        </VStack>
      </Section>

      <Section title="Links" bg={bg}>
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
                <Text color="gray.500" fontSize="sm">No links added.</Text>
            )}
            {linksArray.map((it, idx) => (
              <HStack key={idx} spacing={4}>
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
            ))}
          </VStack>
        </VStack>
      </Section>
    </VStack>
  );
};
