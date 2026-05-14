import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, useColorModeValue, Link, Image } from "@chakra-ui/react"
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

/** Normalize date for type="date" input: returns YYYY-MM-DD or empty string. */
function toDateValue(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim()
  const dateOnly = s.split("T")[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : ""
}

export const TrainingWorkshopsForm = ({ data = {}, onUpdate, isEditing = false, onFileSelect, fieldErrors = null }) => {
  const items = Array.isArray(data) ? data : (data.trainings || [])
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
        institution: "",
        training_type: "",
        startDate: "",
        endDate: "",
        skills: "",
        description: "",
        proof_document: "",
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
      <Heading size="lg" mb={6} color="#20343c">Training & Workshops</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <TrainingItem 
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
            Add Training/Workshop
          </Button>
        )}

        {items.length === 0 && (
          <Box p={8} textAlign="center" color="gray.700" border="1px dashed" borderColor="gray.300" borderRadius="xl">
            No trainings added yet.
          </Box>
        )}
      </VStack>
    </Box>
  )
}

const TrainingItem = ({ index, item, onChange, onDelete, isEditing, onFileSelect, fieldErrors = {} }) => {
  const hasErrors = !!(fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length > 0)
  const isNewEntry = item?._isNewEntry === true
  const [isOpen, setIsOpen] = useState(hasErrors || isNewEntry)
  const [pendingPreview, setPendingPreview] = useState(null)
  const lastProcessedFileRef = useRef(null)
  const hasProof = !!(item.proof_document || item.proofDocument)

  const getError = (field) => {
    const msg = fieldErrors[field] || fieldErrors[field.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "")]
    return msg && String(msg).trim() ? String(msg).trim() : null
  }

  useEffect(() => {
    if (hasErrors && !isOpen) setIsOpen(true)
    // Clear the _isNewEntry flag after component mounts
    if (isNewEntry && item._isNewEntry === true) {
      onChange(index, "_isNewEntry", false)
    }
  }, [hasErrors, isNewEntry])
  useEffect(() => {
    if (hasProof && pendingPreview) {
      URL.revokeObjectURL(pendingPreview)
      setPendingPreview(null)
    }
  }, [hasProof])

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
      <CardBody p={4}>
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
              {item.title || `Training ${index + 1}`}
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
              <Field label="Training/Workshop Title *" errorText={getError("title")}>
                <Input 
                  value={item.title || ""} 
                  onChange={(e) => onChange(index, "title", e.target.value)}
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Institution/Organization *" errorText={getError("institution")}>
                <Input 
                  value={item.institution || ""} 
                  onChange={(e) => onChange(index, "institution", e.target.value)}
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
            </SimpleGrid>

            <Field label="Type">
                <Input 
                    value={item.training_type || ""}
                    onChange={(e) => onChange(index, "training_type", e.target.value)}
                    isDisabled={!isEditing}
                    _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                    placeholder="e.g. Technical Workshop, Soft Skills, Bootcamp"
                    _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
            </Field>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Field label="Start Date *" errorText={getError("start_date") || getError("startDate")}>
                    <Input
                        type="date"
                        value={toDateValue(getField(item, "startDate", "start_date"))}
                        onChange={(e) => onChange(index, "startDate", toDateValue(e.target.value))}
                        variant="flushed"
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
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
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        min="1900-01-01"
                        max="2100-12-31"
                    />
                </Field>
            </SimpleGrid>

            <Field label="Skills Learned">
                <Input 
                    value={item.skills || ""}
                    onChange={(e) => onChange(index, "skills", e.target.value)}
                    isDisabled={!isEditing}
                    _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                    placeholder="e.g. Leadership, Python, Public Speaking"
                    _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
            </Field>

            <Field label="Description">
              <Textarea 
                value={item.description || ""} 
                onChange={(e) => onChange(index, "description", e.target.value)}
                isDisabled={!isEditing}
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                rows={3}
                _placeholder={{ opacity: 0.7, color: "inherit" }}
              />
            </Field>

            <Field label="Proof Document *" errorText={getError("proof_document") || getError("proofDocument")}>
                {isEditing && (
                    <Box>
                        <Text mb={2} fontWeight="medium" color="gray.700">Upload proof (saved when you click Save changes)</Text>
                        <StyledFileInput
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
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
                
                {(item.proof_document || item.proofDocument) && !pendingPreview && (
                  <Box mt={2}>
                    {(item.proof_document || item.proofDocument).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <Box 
                        border="1px solid" 
                        borderColor="gray.200" 
                        borderRadius="md" 
                        p={2}
                        bg="gray.50"
                      >
                        <Image 
                          src={getFileUrl(item.proof_document || item.proofDocument)} 
                          alt="Training Proof" 
                          maxH="150px" 
                          objectFit="contain" 
                        />
                        <Link 
                          href={getFileUrl(item.proof_document || item.proofDocument)} 
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
                        href={getFileUrl(item.proof_document || item.proofDocument)} 
                        isExternal 
                        color="blue.500"
                      >
                        View Proof Document
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
