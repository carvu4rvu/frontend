import React, { useState, useEffect, useRef } from "react";
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
  Image,
  Link
} from "@chakra-ui/react";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Field } from "../../ui/field";
import { StyledFileInput } from "../../ui/StyledFileInput";
import { getFileUrl } from "../../../utils/fileUrl";

/** Normalize date for type="date" input: YYYY-MM-DD only. */
function toDateValue(val) {
  if (val == null || val === "") return "";
  const s = String(val).trim().split("T")[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

export const CertificationsForm = ({ data = {}, onUpdate, isEditing, onFileSelect, fieldErrors = null }) => {
  const bg = useColorModeValue("white", "gray.700");
  const certifications = Array.isArray(data) ? data : (data.certifications || []);
  const errorsByIndex = fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {};
  const getErrorsForIndex = (index) => {
    const row = errorsByIndex[index] ?? errorsByIndex[String(index)];
    return row && typeof row === "object" ? row : {};
  };

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
        proofDocument: "",
        _isNewEntry: true
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
            onFileSelect={onFileSelect ? (file) => onFileSelect(index, file) : undefined}
            fieldErrors={getErrorsForIndex(index)}
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
            <Box p={8} textAlign="center" color="gray.700" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No certifications added yet.
            </Box>
        )}
      </VStack>
    </Box>
  );
};

const CertificationItem = ({ index, item, onChange, onDelete, isEditing, onFileSelect, fieldErrors = {} }) => {
    const isNewEntry = item?._isNewEntry === true
    const [isOpen, setIsOpen] = useState(Object.keys(fieldErrors || {}).length > 0 || isNewEntry);
    const [pendingPreview, setPendingPreview] = useState(null);
    const lastProcessedFileRef = useRef(null);
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const hasProof = !!(item.proof_document || item.proofDocument);
    useEffect(() => {
      if (hasProof && pendingPreview) {
        URL.revokeObjectURL(pendingPreview);
        setPendingPreview(null);
      }
      // Clear the _isNewEntry flag after component mounts
      if (isNewEntry && item._isNewEntry === true) {
        onChange(index, "_isNewEntry", false)
      }
    }, [fieldErrors, isNewEntry]);
    useEffect(() => {
      if (Object.keys(fieldErrors || {}).length > 0) setIsOpen(true);
    }, [fieldErrors]);

    const getError = (field) => {
      const msg = fieldErrors[field] || fieldErrors[field.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "")];
      return msg && String(msg).trim() ? String(msg).trim() : null;
    };

    const handleFileChange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file === lastProcessedFileRef.current) return;
      lastProcessedFileRef.current = file;
      setTimeout(() => { lastProcessedFileRef.current = null }, 0);
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      if (file.type.startsWith("image/")) {
        setPendingPreview(URL.createObjectURL(file));
      } else {
        setPendingPreview(null);
      }
      if (onFileSelect) onFileSelect(file);
      e.target.value = "";
    };

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
                    <Text fontSize="xs" color="gray.700">
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
                        <Field label="Certification Name *" required errorText={getError("title")}>
                            <Input 
                                value={item.title || ""} 
                                onChange={(e) => onChange(index, "title", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                                placeholder="e.g. AWS Solutions Architect"
                                _placeholder={{ opacity: 0.7, color: "inherit" }}
                            />
                        </Field>

                        <Field label="Issuing Organization *" required errorText={getError("organization")}>
                            <Input 
                                value={item.organization || ""} 
                                onChange={(e) => onChange(index, "organization", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                                placeholder="e.g. Amazon Web Services"
                                _placeholder={{ opacity: 0.7, color: "inherit" }}
                            />
                        </Field>

                        <Field label="Certification Type">
                            <Input 
                                value={item.certificationType || ""} 
                                onChange={(e) => onChange(index, "certificationType", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                                placeholder="e.g. Technical / Professional"
                                _placeholder={{ opacity: 0.7, color: "inherit" }}
                            />
                        </Field>

                        <Field label="Skills">
                            <Input 
                                value={item.skills || ""} 
                                onChange={(e) => onChange(index, "skills", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                                placeholder="e.g. Cloud Computing, Architecture"
                                _placeholder={{ opacity: 0.7, color: "inherit" }}
                            />
                        </Field>

                        <Field label="Score / Grade">
                            <Input 
                                value={item.score || ""} 
                                onChange={(e) => onChange(index, "score", e.target.value)} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                                _placeholder={{ opacity: 0.7, color: "inherit" }}
                            />
                        </Field>

                        <Field label="Issue Date" errorText={getError("issue_date") || getError("issueDate")}>
                            <Input 
                                type="date"
                                value={toDateValue(item.issueDate ?? item.issue_date)} 
                                onChange={(e) => onChange(index, "issueDate", toDateValue(e.target.value))} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                                min="1900-01-01"
                                max="2100-12-31"
                            />
                        </Field>

                        <Field label="Expiry Date" errorText={getError("expiry_date") || getError("expiryDate")}>
                            <Input 
                                type="date"
                                value={toDateValue(item.expiryDate ?? item.expiry_date)} 
                                onChange={(e) => onChange(index, "expiryDate", toDateValue(e.target.value))} 
                                variant="flushed"
                                isDisabled={!isEditing}
                                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                                min="1900-01-01"
                                max="2100-12-31"
                            />
                        </Field>

                        <Field label="Proof Document (PDF/Image)" errorText={getError("proof_document") || getError("proofDocument")}>
                            {isEditing && (
                              <VStack align="stretch" spacing={2}>
                                <Text fontSize="sm" color="gray.700">Upload proof (saved when you click Save changes)</Text>
                                <StyledFileInput
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                  onChange={handleFileChange}
                                  acceptLabel="PDF, JPG, PNG"
                                />
                                {pendingPreview && (
                                  <Box border="2px dashed" borderColor="orange.300" borderRadius="md" p={2} bg="orange.50" w="full">
                                    <Image src={pendingPreview} alt="Preview" maxH="200px" objectFit="contain" mx="auto" />
                                    <Text fontSize="xs" color="orange.600" mt={2} textAlign="center" fontWeight="bold">Pending (click Save changes to upload)</Text>
                                  </Box>
                                )}
                              </VStack>
                            )}
                            {(item.proofDocument || item.proof_document) && (
                              <Box mt={2}>
                                {(item.proofDocument || item.proof_document).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <Box 
                                    border="1px solid" 
                                    borderColor="gray.200" 
                                    borderRadius="md" 
                                    p={2}
                                    bg="gray.50"
                                  >
                                <Image 
                                  src={getFileUrl(item.proofDocument || item.proof_document)} 
                                  alt="Proof document" 
                                  maxH="200px" 
                                  objectFit="contain"
                                  mx="auto"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                <Link 
                                  href={getFileUrl(item.proofDocument || item.proof_document)} 
                                  isExternal 
                                  fontSize="sm" 
                                  color="blue.500"
                                  display="block"
                                  textAlign="center"
                                  mt={2}
                                >
                                  View Full Size
                                </Link>
                              </Box>
                            ) : (
                              <Link 
                                href={getFileUrl(item.proofDocument || item.proof_document)} 
                                isExternal 
                                fontSize="sm" 
                                color="blue.500"
                              >
                                📄 View Document
                              </Link>
                            )}
                              </Box>
                            )}
                        </Field>
                    </SimpleGrid>
                </VStack>
            </Collapse>
        </Box>
    );
};
