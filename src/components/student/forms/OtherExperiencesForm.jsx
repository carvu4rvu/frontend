/**
 * Component: OtherExperiencesForm
 * Files are only uploaded when user clicks "Save changes" (deferred upload via GenericProfileSection).
 */

import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, useColorModeValue, useToast, Image, Link } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { useState, useEffect, useRef } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"
import { getFileUrl } from "../../../utils/fileUrl"

/** Normalize date for type="date" input: YYYY-MM-DD or ISO string only. */
function normalizeDateValue(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim().split("T")[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ""
}

export const OtherExperiencesForm = ({ data = {}, onUpdate, isEditing = false, onFileSelect, fieldErrors = null }) => {
  const items = Array.isArray(data) ? data : (data.otherExperiences || [])
  const bg = useColorModeValue("white", "gray.700")
  const errorsByIndex = fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {}
  const getErrorsForIndex = (index) => {
    const row = errorsByIndex[index] ?? errorsByIndex[String(index)]
    return row && typeof row === "object" ? row : {}
  }
  const toast = useToast()
  const { user } = useAuth()

  const handleChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onUpdate(newItems)
  }

  const handleAdd = () => {
    onUpdate([
      ...items,
      {
        title: "",
        organization: "",
        location: "",
        startDate: "",
        endDate: "",
        skills: "",
        description: "",
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
    <Box bg={bg} p={8} borderRadius="xl" shadow="sm">
      <Heading size="lg" mb={6} color="#20343c">Other Experiences</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <OtherExperienceItem 
            key={index} 
            index={index} 
            item={item} 
            onChange={handleChange} 
            onDelete={handleDelete}
            onRemoveProof={(idx) => {
              const newItems = [...items]
              newItems[idx] = { ...newItems[idx], proofDocument: "", proof_document: "" }
              onUpdate(newItems)
            }}
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
            Add Experience
          </Button>
        )}

        {items.length === 0 && (
            <Box p={8} textAlign="center" color="gray.700" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No other experiences added yet.
            </Box>
        )}
      </VStack>
    </Box>
  )
}

const OtherExperienceItem = ({ index, item, onChange, onDelete, onRemoveProof, isEditing, onFileSelect, fieldErrors = {} }) => {
  const hasErrors = !!(fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length > 0)
  const isNewEntry = item?._isNewEntry === true
  const [isOpen, setIsOpen] = useState(hasErrors || isNewEntry)
  const [pendingPreview, setPendingPreview] = useState(null)
  const [pendingFileName, setPendingFileName] = useState(null)
  const fileInputRef = useRef(null)
  const lastProcessedFileRef = useRef(null)
  const hasProof = !!(item.proof_document || item.proofDocument)
  useEffect(() => {
    if (hasProof && pendingPreview) {
      URL.revokeObjectURL(pendingPreview)
      setPendingPreview(null)
    }
    if (hasProof) setPendingFileName(null)
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
  useEffect(() => () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
  }, [pendingPreview])

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (file === lastProcessedFileRef.current) return
    lastProcessedFileRef.current = file
    setTimeout(() => { lastProcessedFileRef.current = null }, 0)
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    if (file.type.startsWith("image/")) {
      setPendingPreview(URL.createObjectURL(file))
      setPendingFileName(null)
    } else {
      setPendingPreview(null)
      setPendingFileName(file.name)
    }
    if (onFileSelect) onFileSelect(file)
    e.target.value = ""
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Card variant="outline" borderColor="gray.200">
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
            <HStack onClick={() => setIsOpen(!isOpen)} cursor="pointer" flex={1}>
                <Text fontWeight="bold" color="gray.800">
                    {item.title || "New Experience"}
                </Text>
                {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </HStack>
            {isEditing && (
                <IconButton 
                    icon={<FaTrash />} 
                    size="sm" 
                    colorScheme="red" 
                    variant="ghost" 
                    onClick={() => onDelete(index)}
                    aria-label="Delete experience"
                />
            )}
        </Flex>

        <Collapse in={isOpen} animateOpacity>
            <VStack spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <Field label="Title" required errorText={getError("title")}>
                        <Input 
                            value={item.title || ""} 
                            onChange={(e) => onChange(index, "title", e.target.value)}
                            placeholder="e.g. Volunteer, Club Member"
                            isDisabled={!isEditing}
                            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                    <Field label="Organization" required errorText={getError("organization")}>
                        <Input 
                            value={item.organization || ""} 
                            onChange={(e) => onChange(index, "organization", e.target.value)}
                            placeholder="e.g. NGO Name, Student Body"
                            isDisabled={!isEditing}
                            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                </SimpleGrid>

                <Field label="Location" errorText={getError("location")}>
                    <Input 
                        value={item.location || ""} 
                        onChange={(e) => onChange(index, "location", e.target.value)}
                        placeholder="e.g. Bangalore, Remote"
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <Field label="Start Date" errorText={getError("start_date") || getError("startDate")}>
                        <Input 
                            type="date"
                            min="1900-01-01"
                            max="2100-12-31"
                            value={normalizeDateValue(item.startDate ?? item.start_date)} 
                            onChange={(e) => onChange(index, "startDate", e.target.value || "")}
                            isDisabled={!isEditing}
                            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        />
                    </Field>
                    <Field label="End Date" errorText={getError("end_date") || getError("endDate")}>
                        <Input 
                            type="date"
                            min="1900-01-01"
                            max="2100-12-31"
                            value={normalizeDateValue(item.endDate ?? item.end_date)} 
                            onChange={(e) => onChange(index, "endDate", e.target.value || "")}
                            isDisabled={!isEditing}
                            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        />
                    </Field>
                </SimpleGrid>

                <Field label="Skills Used/Gained" errorText={getError("skills")}>
                    <Input 
                        value={item.skills || ""} 
                        onChange={(e) => onChange(index, "skills", e.target.value)}
                        placeholder="e.g. Teamwork, Event Management"
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>

                <Field label="Description" errorText={getError("description")}>
                    <Textarea 
                        value={item.description || ""} 
                        onChange={(e) => onChange(index, "description", e.target.value)}
                        placeholder="Brief description of your role and contributions..."
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>

                <Field label="Proof Document (PDF/Image)" errorText={getError("proof_document") || getError("proofDocument")}>
                    {isEditing && (
                      <Box>
                        <Text mb={2} fontWeight="medium" color="gray.700">Upload proof (saved when you click Save changes)</Text>
                        <StyledFileInput
                          ref={fileInputRef}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                          onChange={handleFileChange}
                          acceptLabel="PDF, JPG, PNG"
                          mb={2}
                        />
                        {pendingPreview && (
                          <Box border="2px dashed" borderColor="orange.300" borderRadius="md" p={2} bg="orange.50" mb={2}>
                            <Image src={pendingPreview} alt="Preview" maxH="200px" objectFit="contain" mx="auto" />
                            <Text fontSize="xs" color="orange.600" mt={2} textAlign="center" fontWeight="bold">Pending (click Save changes to upload)</Text>
                          </Box>
                        )}
                        {pendingFileName && !pendingPreview && (
                          <Box border="2px dashed" borderColor="orange.300" borderRadius="md" p={2} bg="orange.50" mb={2}>
                            <Text fontSize="sm" color="gray.700">File selected: {pendingFileName}</Text>
                            <Text fontSize="xs" color="orange.600" mt={1} fontWeight="bold">Pending (click Save changes to upload)</Text>
                          </Box>
                        )}
                      </Box>
                    )}
                    {(item.proof_document || item.proofDocument) && (
                      <Box mt={2}>
                        {(item.proof_document || item.proofDocument).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={2} bg="gray.50" position="relative">
                            <Image src={getFileUrl(item.proof_document || item.proofDocument)} alt="Proof" maxH="150px" objectFit="contain" />
                            <HStack mt={2} justify="space-between" align="center">
                              <Link href={getFileUrl(item.proof_document || item.proofDocument)} isExternal color="blue.500" fontSize="sm">View full image</Link>
                              {isEditing && (
                                <Button size="sm" leftIcon={<FaTrash />} colorScheme="red" variant="outline" onClick={() => onRemoveProof(index)}>
                                  Remove image
                                </Button>
                              )}
                            </HStack>
                          </Box>
                        ) : (
                          <HStack spacing={2} align="center">
                            <Link href={getFileUrl(item.proof_document || item.proofDocument)} isExternal color="blue.500" fontSize="sm">View proof document</Link>
                            {isEditing && (
                              <Button size="sm" leftIcon={<FaTrash />} colorScheme="red" variant="outline" onClick={() => onRemoveProof(index)}>
                                Remove document
                              </Button>
                            )}
                          </HStack>
                        )}
                      </Box>
                    )}
                </Field>
            </VStack>
        </Collapse>
      </CardBody>
    </Card>
  )
}
