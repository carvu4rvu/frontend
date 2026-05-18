/**
 * Component: InternshipsForm
 * 
 * Fields (Repeatable):
 * - jobRole (Text, Required)
 * - organization (Text, Required)
 * - organizationDetails (Textarea)
 * - durationMonths (Number)
 * - startDate (Date)
 * - endDate (Date)
 * - location (Text)
 * - stipend (Number)
 * - skills (Text)
 * - description (Textarea)
 * - mentorName (Text)
 * - proofDocument (Text/Url)
 * 
 * Validation:
 * - jobRole: Required
 * - organization: Required
 * 
 * API Contracts:
 * - GET /api/student/profile/internships
 * - POST /api/student/profile/internships
 */

import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, Image, Link, Wrap, WrapItem, Badge } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { useState, useEffect, useRef } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { getFileUrl } from "../../../utils/fileUrl"

/** Get value from item supporting both camelCase and snake_case (API returns snake_case). */
function getField(item, ...keys) {
  for (const k of keys) {
    const v = item?.[k]
    if (v !== undefined && v !== null && v !== "") return v
  }
  return ""
}

/** Restrict to digits only, optional max length. */
function onlyDigits(value, maxLength = 0) {
  const digits = String(value).replace(/\D/g, "")
  if (maxLength && digits.length > maxLength) return digits.slice(0, maxLength)
  return digits
}

/** Normalize date for type="date" input: returns YYYY-MM-DD or empty string. */
function toDateValue(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim()
  const dateOnly = s.split("T")[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : ""
}

export const InternshipsForm = ({ data = {}, onUpdate, isEditing = false, onFileSelect, fieldErrors = null }) => {
  const items = Array.isArray(data) ? data : (data.internships || [])
  // fieldErrors: { 0: { organization: "...", job_role: "..." }, 1: {...} } from GenericProfileSection (mapIndexedFieldErrors)
  const errorsByIndex = fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {}
  const getErrorsForIndex = (index) => {
    const row = errorsByIndex[index] ?? errorsByIndex[String(index)]
    return row && typeof row === "object" ? row : {}
  }

  const handleChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onUpdate(newItems)
  }

  const handleAdd = () => {
    onUpdate([
      ...items,
      {
        jobRole: "",
        organization: "",
        organizationDetails: "",
        durationMonths: "",
        startDate: "",
        endDate: "",
        location: "",
        stipend: "",
        skills: "",
        description: "",
        mentorName: "",
        proofDocument: "",
        _isNewEntry: true
      }
    ])
  }

  const handleDelete = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate(newItems)
  }

  return (
    <Box bg="white" p={8} borderRadius="xl" shadow="sm" color="gray.800">
      <Heading size="lg" mb={6} color="gray.800">Internships</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <InternshipItem 
            key={index} 
            index={index} 
            item={item} 
            onChange={handleChange} 
            onDelete={handleDelete}
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
            Add Internship
            </Button>
        )}

        {items.length === 0 && (
            <Box p={8} textAlign="center" color="gray.600" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No internships added yet.
            </Box>
        )}
      </VStack>
    </Box>
  )
}

const InternshipItem = ({ index, item, onChange, onDelete, isEditing, onFileSelect, fieldErrors = {} }) => {
  const hasErrors = !!(fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length > 0)
  const isNewEntry = item?._isNewEntry === true
  const [isOpen, setIsOpen] = useState(hasErrors || isNewEntry)
  const [pendingPreview, setPendingPreview] = useState(null)
  const lastProcessedFileRef = useRef(null)
  const hasProof = !!(item.proof_document || item.proofDocument)
  useEffect(() => {
    if (hasProof && pendingPreview) {
      URL.revokeObjectURL(pendingPreview)
      setPendingPreview(null)
    }
    // Clear the _isNewEntry flag after component mounts
    if (isNewEntry && item._isNewEntry === true) {
      onChange(index, "_isNewEntry", false)
    }
  }, [hasProof, isNewEntry])
  useEffect(() => {
    if (hasErrors && !isOpen) setIsOpen(true)
  }, [hasErrors])

  const getError = (field) => {
    const msg = fieldErrors[field] || fieldErrors[field.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "")]
    return msg && String(msg).trim() ? String(msg).trim() : null
  }

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (file === lastProcessedFileRef.current) return
    lastProcessedFileRef.current = file
    setTimeout(() => { lastProcessedFileRef.current = null }, 0)
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    if (file.type.startsWith("image/")) {
      setPendingPreview(URL.createObjectURL(file))
    } else {
      setPendingPreview(null)
    }
    if (onFileSelect) onFileSelect(file)
    e.target.value = ""
  }

  return (
    <Card variant="outline" borderColor="gray.200" color="gray.800" sx={{ "& .chakra-form__label": { color: "gray.700" }, "& input:disabled, & select:disabled, & textarea:disabled": { color: "gray.800", opacity: 1 } }}>
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
            <HStack onClick={() => setIsOpen(!isOpen)} cursor="pointer" flex={1}>
                <Text fontWeight="bold" color="gray.800">
                    {getField(item, "organization") ? `${getField(item, "organization")} - ${getField(item, "jobRole", "job_role")}` : `Internship ${index + 1}`}
                </Text>
                {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </HStack>
            {isEditing && (
                <IconButton 
                    size="sm" 
                    variant="ghost" 
                    color="red.500" 
                    aria-label="Delete" 
                    onClick={() => onDelete(index)}
                >
                    <FaTrash />
                </IconButton>
            )}
        </Flex>

        <Collapse in={isOpen}>
            <VStack mt={4} align="stretch" gap={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Field label="Organization *" errorText={getError("organization")}>
                        <Input 
                            value={getField(item, "organization", "organization")} 
                            onChange={(e) => onChange(index, "organization", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="e.g. Google"
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                    <Field label="Job Role *" errorText={getError("job_role") || getError("jobRole")}>
                        <Input 
                            value={getField(item, "jobRole", "job_role")} 
                            onChange={(e) => onChange(index, "jobRole", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="e.g. Software Engineering Intern"
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                    <Field label="Location" errorText={getError("location")}>
                        <Input 
                            value={getField(item, "location", "location")} 
                            onChange={(e) => onChange(index, "location", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="e.g. Bangalore"
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                    <Field label="Stipend" errorText={getError("stipend")}>
                        <Input 
                            type="text"
                            inputMode="numeric"
                            value={getField(item, "stipend", "stipend")} 
                            onChange={(e) => {
                              const v = onlyDigits(e.target.value, 6)
                              if (v === "") { onChange(index, "stipend", ""); return }
                              const num = parseInt(v, 10)
                              onChange(index, "stipend", num > 500000 ? "500000" : v)
                            }} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="0 (max 5 lakh)"
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                    <Field label="Start Date *" errorText={getError("start_date") || getError("startDate")}>
                        <Input 
                            type="date"
                            value={toDateValue(getField(item, "startDate", "start_date"))} 
                            onChange={(e) => onChange(index, "startDate", toDateValue(e.target.value))} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            min="1900-01-01"
                            max="2100-12-31"
                        />
                    </Field>
                    <Field label="End Date *" errorText={getError("end_date") || getError("endDate")}>
                        <Input 
                            type="date"
                            value={toDateValue(getField(item, "endDate", "end_date"))} 
                            onChange={(e) => onChange(index, "endDate", toDateValue(e.target.value))} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            min="1900-01-01"
                            max="2100-12-31"
                        />
                    </Field>
                    <Field label="Duration (Months)" errorText={getError("duration_months") || getError("durationMonths")}>
                        <Input 
                            type="text"
                            inputMode="numeric"
                            value={getField(item, "durationMonths", "duration_months")} 
                            onChange={(e) => {
                              // allow only digits, max 2 chars (00-99)
                              const v = onlyDigits(e.target.value, 2)
                              if (v !== "" && parseInt(v, 10) > 99) return
                              onChange(index, "durationMonths", v === "" ? "" : v)
                            }} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="e.g. 06"
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                    <Field label="Mentor Name" errorText={getError("mentor_name") || getError("mentorName")}>
                        <Input 
                            value={getField(item, "mentorName", "mentor_name")} 
                            onChange={(e) => onChange(index, "mentorName", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="e.g. John Doe"
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                    <Field label="Skills (comma separated)">
                        {isEditing ? (
                          <Input 
                            value={getField(item, "skills", "skills")} 
                            onChange={(e) => onChange(index, "skills", e.target.value)} 
                            variant="flushed"
                            placeholder="e.g. React, Node.js"
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                          />
                        ) : (
                          <Wrap spacing={2}>
                            {(() => {
                              const val = getField(item, "skills", "skills");
                              const list = typeof val === "string" ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];
                              return list.length === 0 ? (
                                <Text color="gray.700" fontSize="sm">—</Text>
                              ) : (
                                list.map((skill, i) => (
                                  <WrapItem key={i}>
                                    <Badge colorScheme="gray" variant="subtle" px={2} py={1} borderRadius="md" fontWeight="medium" textTransform="none">
                                      {skill}
                                    </Badge>
                                  </WrapItem>
                                ))
                              );
                            })()}
                          </Wrap>
                        )}
                    </Field>
                    <Field label="Proof Document (PDF/Image) *" errorText={getError("proof_document") || getError("proofDocument")}>
                        {isEditing && (
                          <VStack align="stretch" spacing={2}>
                            <Text fontSize="sm" color="gray.700">Select a file (PDF or image), then click Save changes to upload.</Text>
                            <StyledFileInput
                              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
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
                        {(item.proofDocument || item.proof_document) && !pendingPreview && (
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
                <Field label="Organization Details">
                    <Textarea 
                        value={getField(item, "organizationDetails", "organization_details")} 
                        onChange={(e) => onChange(index, "organizationDetails", e.target.value)} 
                        variant="flushed"
                        rows={2}
                        isDisabled={!isEditing}
                        placeholder="Details about the organization..."
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>
                <Field label="Description">
                    <Textarea 
                        value={getField(item, "description", "description")} 
                        onChange={(e) => onChange(index, "description", e.target.value)} 
                        variant="flushed"
                        rows={3}
                        isDisabled={!isEditing}
                        placeholder="Describe your work and achievements..."
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>
            </VStack>
        </Collapse>
      </CardBody>
    </Card>
  )
}
