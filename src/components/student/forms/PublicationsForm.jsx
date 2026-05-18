import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, useColorModeValue, Link, Image, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { useState, useEffect, useRef } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { getFileUrl } from "../../../utils/fileUrl"

/** Normalize date for type="date" input: YYYY-MM-DD only. */
function toDateValue(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim().split("T")[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ""
}

export const PublicationsForm = ({ data = {}, onUpdate, isEditing = false, onFileSelect, fieldErrors = null }) => {
  const items = Array.isArray(data) ? data : (data.publications || [])
  const bg = useColorModeValue("white", "gray.700")
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
        title: "",
        publication_name: "",
        publication_type: "",
        publication_date: "",
        author_count: 1,
        mentor_name: "",
        link: "",
        skills: "",
        description: "",
        evidence_document: "",
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
      <Heading size="lg" mb={6} color="#20343c">Publications</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <PublicationItem 
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
            Add Publication
          </Button>
        )}

        {items.length === 0 && (
          <Box p={8} textAlign="center" color="gray.700" border="1px dashed" borderColor="gray.300" borderRadius="xl">
            No publications added yet.
          </Box>
        )}
      </VStack>
    </Box>
  )
}

const PublicationItem = ({ index, item, onChange, onDelete, isEditing, onFileSelect, fieldErrors = {} }) => {
  const isNewEntry = item?._isNewEntry === true
  const [isOpen, setIsOpen] = useState(Object.keys(fieldErrors || {}).length > 0 || isNewEntry)
  const [pendingPreview, setPendingPreview] = useState(null)
  const lastProcessedFileRef = useRef(null)
  const hasProof = !!(item.evidence_document || item.evidenceDocument)
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
    if (Object.keys(fieldErrors || {}).length > 0) setIsOpen(true)
  }, [fieldErrors])

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
    <Card variant="outline" borderColor="gray.200">
      <CardBody>
        <Flex justify="space-between" align="center" mb={4}>
          <HStack>
            <IconButton 
              icon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle"
            />
            <Heading size="md" color="#20343c">
              {item.title || `Publication ${index + 1}`}
            </Heading>
          </HStack>
          {isEditing && (
            <IconButton 
              icon={<FaTrash />} 
              colorScheme="red" 
              variant="ghost" 
              onClick={() => onDelete(index)}
              aria-label="Delete"
            />
          )}
        </Flex>

        <Collapse in={isOpen}>
          <VStack spacing={4} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Field label="Paper/Article Title" required errorText={getError("title")}>
                <Input 
                  value={item.title || ""} 
                  onChange={(e) => onChange(index, "title", e.target.value)}
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Publication Name (Journal/Conf)" required errorText={getError("publication_name")}>
                <Input 
                  value={item.publication_name || ""} 
                  onChange={(e) => onChange(index, "publication_name", e.target.value)}
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Field label="Type" required errorText={getError("publication_type")}>
                    <Input 
                        value={item.publication_type || ""}
                        onChange={(e) => onChange(index, "publication_type", e.target.value)}
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        placeholder="e.g. Journal, Conference, Article"
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>
                <Field label="Publication Date" errorText={getError("publication_date")}>
                    <Input 
                        type="date"
                        value={toDateValue(item.publication_date)}
                        onChange={(e) => onChange(index, "publication_date", toDateValue(e.target.value))}
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        min="1900-01-01"
                        max="2100-12-31"
                    />
                </Field>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Field label="Number of Authors" errorText={getError("author_count")}>
                    <NumberInput 
                        value={item.author_count ?? ""}
                        min={1}
                        allowMouseWheel
                        clampValueOnBlur={false}
                        onChange={(valueString, valueNumber) => {
                            if (valueString === "" || valueString === undefined) {
                                onChange(index, "author_count", "")
                            } else {
                                onChange(index, "author_count", valueNumber)
                            }
                        }}
                        isDisabled={!isEditing}
                    >
                        <NumberInputField _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }} />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                </Field>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Field label="Mentor Name" errorText={getError("mentor_name")}>
                    <Input 
                        value={item.mentor_name || ""}
                        onChange={(e) => onChange(index, "mentor_name", e.target.value)}
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>
                <Field label="Link (DOI/URL)" errorText={getError("link")}>
                    <Input 
                        value={item.link || ""}
                        onChange={(e) => onChange(index, "link", e.target.value)}
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>
            </SimpleGrid>

            <Field label="Skills Used" errorText={getError("skills")}>
                <Input 
                    value={item.skills || ""}
                    onChange={(e) => onChange(index, "skills", e.target.value)}
                    isDisabled={!isEditing}
                    _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                    placeholder="e.g. Research, Data Analysis"
                    _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
            </Field>

            <Field label="Description" errorText={getError("description")}>
              <Textarea 
                value={item.description || ""} 
                onChange={(e) => onChange(index, "description", e.target.value)}
                isDisabled={!isEditing}
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                rows={3}
                _placeholder={{ opacity: 0.7, color: "inherit" }}
              />
            </Field>

            <Field label="Evidence Document" errorText={getError("evidence_document") || getError("evidenceDocument")}>
                {isEditing && (
                    <Box>
                        <Text mb={2} fontWeight="medium" color="gray.700">Upload evidence (saved when you click Save changes)</Text>
                        <StyledFileInput
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
                    </Box>
                )}
                
                {(item.evidence_document || item.evidenceDocument) && (
                  <Box mt={2}>
                    {(item.evidence_document || item.evidenceDocument).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <Box 
                        border="1px solid" 
                        borderColor="gray.200" 
                        borderRadius="md" 
                        p={2}
                        bg="gray.50"
                      >
                        <Image 
                          src={getFileUrl(item.evidence_document || item.evidenceDocument)} 
                          alt="Publication Evidence" 
                          maxH="150px" 
                          objectFit="contain" 
                        />
                        <Link 
                          href={getFileUrl(item.evidence_document || item.evidenceDocument)} 
                          isExternal 
                          color="blue.500" 
                          fontSize="sm" 
                          display="block" 
                          mt={1}
                        >
                          View Full Image
                        </Link>
                      </Box>
                    ) : (
                      <Link 
                        href={getFileUrl(item.evidence_document || item.evidenceDocument)} 
                        isExternal 
                        color="blue.500"
                      >
                        View Evidence
                      </Link>
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
