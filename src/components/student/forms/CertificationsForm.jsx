import React, { useState } from "react";
import {
  VStack,
  Input,
  Button,
  SimpleGrid,
  Box,
  Heading,
  IconButton,
  useColorModeValue,
  Flex,
  Text,
  Collapse,
  useToast
} from "@chakra-ui/react";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Field } from "../../ui/field";
import { useAuth } from "../../../context/AuthContext";
import { StudentProfileService } from "../../../services/studentProfile.service";

export const CertificationsForm = ({ data = {}, onUpdate, isEditing }) => {
  const bg = useColorModeValue("white", "gray.700");
  const toast = useToast();
  const { user } = useAuth();
  const usn = user?.usn;

  const certifications = Array.isArray(data) ? data : (data.certifications || []);

  const handleAdd = () => {
    const newCertifications = [
      ...certifications,
      { 
        title: "", 
        organization: "", 
        certificationType: "", 
        skills: "", 
        score: "", 
        issueDate: "", 
        expiryDate: "", 
        proofDocument: "" 
      },
    ];
    onUpdate(newCertifications);
  };

  const handleRemove = (index) => {
    const newCertifications = certifications.filter((_, i) => i !== index);
    onUpdate(newCertifications);
  };

  const handleChange = (index, field, value) => {
    const newCertifications = [...certifications];
    newCertifications[index] = { ...newCertifications[index], [field]: value };
    onUpdate(newCertifications);
  };

  const handleUpload = async (index, file) => {
    if (!file || !usn) return;
    try {
      const result = await StudentProfileService.uploadFile(usn, file, { folder: "certifications" });
      const url = result?.url || result?.path;
      if (url) {
        const newCertifications = [...certifications];
        newCertifications[index] = { ...newCertifications[index], proofDocument: url };
        onUpdate(newCertifications);
        toast({
          status: "success",
          description: "File uploaded",
          duration: 3000,
          isClosable: true
        });
      }
    } catch (e) {
      console.error("Error uploading certification file:", e);
      toast({
        status: "error",
        description: "File upload failed",
        duration: 4000,
        isClosable: true
      });
    }
  };

  return (
    <Box bg={bg} p={8} borderRadius="xl" shadow="sm">
      <Heading size="lg" mb={6} color="#20343c">Certifications</Heading>

      <VStack spacing={6} align="stretch">
        {certifications.map((cert, index) => (
          <CertificationItem 
            key={index} 
            index={index} 
            item={cert} 
            onChange={handleChange} 
            onDelete={handleRemove} 
            isEditing={isEditing}
          />
        ))}

        {isEditing && (
          <Button
            leftIcon={<FaPlus />}
            onClick={handleAdd}
            variant="outline"
            colorScheme="orange"
            borderColor="#d4a960"
            color="#d4a960"
            _hover={{ bg: "#fff5e6" }}
          >
            Add Certification
          </Button>
        )}

        {certifications.length === 0 && (
            <Box p={8} textAlign="center" color="gray.500" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No certifications added yet.
            </Box>
        )}
      </VStack>
    </Box>
  );
};

const CertificationItem = ({ index, item, onChange, onDelete, isEditing }) => {
    const [isOpen, setIsOpen] = useState(true);
    const borderColor = useColorModeValue("gray.200", "gray.600");

    return (
        <Box 
            borderWidth="1px" 
            borderColor={borderColor} 
            borderRadius="lg" 
            p={4} 
            bg={useColorModeValue("gray.50", "gray.800")}
        >
            <Flex justifyContent="space-between" alignItems="center" mb={isOpen ? 4 : 0}>
                <Box onClick={() => setIsOpen(!isOpen)} cursor="pointer" flex="1">
                    <Heading size="sm" color="blue.600">
                        {item.title || "New Certification"}
                    </Heading>
                    <Text fontSize="xs" color="gray.500">
                        {item.organization || "Organization Name"}
                    </Text>
                </Box>
                <Flex alignItems="center" gap={2}>
                    <IconButton
                        icon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle details"
                    />
                    {isEditing && (
                        <IconButton
                            icon={<FaTrash />}
                            colorScheme="red"
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(index)}
                            aria-label="Remove certification"
                        />
                    )}
                </Flex>
            </Flex>

            <Collapse in={isOpen}>
                <VStack spacing={4} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <Field label="Certification Name (Required)" required>
                            <Input 
                                value={item.title || ""} 
                                onChange={(e) => onChange(index, "title", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                placeholder="e.g. AWS Solutions Architect"
                            />
                        </Field>

                        <Field label="Issuing Organization (Required)" required>
                            <Input 
                                value={item.organization || ""} 
                                onChange={(e) => onChange(index, "organization", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                placeholder="e.g. Amazon Web Services"
                            />
                        </Field>

                        <Field label="Certification Type">
                            <Input 
                                value={item.certificationType || ""} 
                                onChange={(e) => onChange(index, "certificationType", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                placeholder="e.g. Technical / Professional"
                            />
                        </Field>

                        <Field label="Skills">
                            <Input 
                                value={item.skills || ""} 
                                onChange={(e) => onChange(index, "skills", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                placeholder="e.g. Cloud Computing, Architecture"
                            />
                        </Field>

                        <Field label="Score / Grade">
                            <Input 
                                value={item.score || ""} 
                                onChange={(e) => onChange(index, "score", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                            />
                        </Field>

                        <Field label="Issue Date">
                            <Input 
                                type="date"
                                value={item.issueDate || ""} 
                                onChange={(e) => onChange(index, "issueDate", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                            />
                        </Field>

                        <Field label="Expiry Date">
                            <Input 
                                type="date"
                                value={item.expiryDate || ""} 
                                onChange={(e) => onChange(index, "expiryDate", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                            />
                        </Field>

                        <Field label="Proof Document">
                            {isEditing && (
                              <Input
                                type="file"
                                p={1}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                onChange={async (e) => {
                                  const file = e.target.files && e.target.files[0];
                                  if (!file) return;
                                  await handleUpload(index, file);
                                }}
                                variant="outline"
                              />
                            )}
                            <Input 
                                mt={2}
                                value={item.proofDocument || ""} 
                                onChange={(e) => onChange(index, "proofDocument", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                placeholder="https://..."
                            />
                        </Field>
                    </SimpleGrid>
                </VStack>
            </Collapse>
        </Box>
    );
};
