import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, useToast, Image, Link } from "@chakra-ui/react"
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

/** Normalize date for type="date" input: returns YYYY-MM-DD or empty string (per date_report.md). */
function toDateValue(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim()
  const dateOnly = s.split("T")[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : ""
}

export const SummerInternshipForm = ({ data = [], onUpdate, isEditing = false, onFileSelect, fieldErrors = null }) => {
  const items = Array.isArray(data) ? data : (data?.summerInternship ?? data?.summer_internship ?? data?.internships ?? [])
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
        proofDocument: ""
      }
    ])
  }

  const handleDelete = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate(newItems)
  }

  return (
    <Box bg="white" p={8} borderRadius="xl" shadow="sm">
      <Heading size="lg" mb={6} color="#20343c">Summer Internship</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <SummerInternshipItem 
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
            Add Summer Internship
          </Button>
        )}

        {items.length === 0 && !isEditing && (
          <Box p={8} textAlign="center" color="gray.700" border="1px dashed" borderColor="gray.300" borderRadius="xl">
            No summer internships added yet.
          </Box>
        )}
      </VStack>
    </Box>
  )
}

const SummerInternshipItem = ({ index, item, onChange, onDelete, isEditing, onFileSelect, fieldErrors = {} }) => {
  const today = new Date().toISOString().split("T")[0]
  const [isOpen, setIsOpen] = useState(false)
  const [pendingPreview, setPendingPreview] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)
  const lastProcessedFileRef = useRef(null)
  const hasProof = !!(item.proof_document || item.proofDocument)
  const getError = (field) => {
    const msg = fieldErrors[field] || fieldErrors[field.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "")]
    return msg && String(msg).trim() ? String(msg).trim() : null
  }
  useEffect(() => {
    if (hasProof) {
      if (pendingPreview) {
        URL.revokeObjectURL(pendingPreview)
        setPendingPreview(null)
      }
      setPendingFile(null)
    }
  }, [hasProof])
  useEffect(() => {
    if (Object.keys(fieldErrors || {}).length > 0) setIsOpen(true)
  }, [fieldErrors])

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (file === lastProcessedFileRef.current) return
    lastProcessedFileRef.current = file
    setTimeout(() => { lastProcessedFileRef.current = null }, 0)
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    if (file.type.startsWith("image/")) {
      setPendingPreview(URL.createObjectURL(file))
      setPendingFile(null)
    } else {
      setPendingPreview(null)
      setPendingFile(file)
    }
    if (onFileSelect) onFileSelect(file)
    e.target.value = ""
  }

  return (
    <Card variant="outline" borderColor="gray.200">
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
          <HStack onClick={() => setIsOpen(!isOpen)} cursor="pointer" flex={1}>
            <Text fontWeight="bold" color="gray.800">
              {getField(item, "organization") ? `${getField(item, "organization")} - ${getField(item, "jobRole", "job_role")}` : `Summer Internship ${index + 1}`}
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
              <Field label="Organization (Required)" required>
                <Input 
                  value={getField(item, "organization", "organization")} 
                  onChange={(e) => onChange(index, "organization", e.target.value)} 
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. Tech Innovations Inc."
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Job Role (Required)" required>
                <Input 
                  value={getField(item, "jobRole", "job_role")} 
                  onChange={(e) => onChange(index, "jobRole", e.target.value)} 
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. Summer Intern"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Location">
                <Input 
                  value={getField(item, "location", "location")} 
                  onChange={(e) => onChange(index, "location", e.target.value)} 
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. Bangalore"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Stipend">
                <Input 
                  type="number"
                  value={getField(item, "stipend", "stipend")} 
                  onChange={(e) => onChange(index, "stipend", e.target.value)} 
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="0"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Start Date *" errorText={getError("start_date") || getError("startDate")}>
                <Input 
                  type="date"
                  min="1900-01-01"
                  max={today}
                  value={toDateValue(getField(item, "startDate", "start_date"))} 
                  onChange={(e) => onChange(index, "startDate", toDateValue(e.target.value))} 
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                />
              </Field>
              <Field label="End Date *" errorText={getError("end_date") || getError("endDate")}>
                <Input 
                  type="date"
                  min={toDateValue(getField(item, "startDate", "start_date")) || "1900-01-01"}
                  max={today}
                  value={toDateValue(getField(item, "endDate", "end_date"))} 
                  onChange={(e) => onChange(index, "endDate", toDateValue(e.target.value))} 
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                />
              </Field>
              <Field label="Duration (Months)" errorText={getError("duration_months")}>
                <Input 
                  type="text"
                  inputMode="numeric"
                  value={getField(item, "durationMonths", "duration_months")} 
                  onChange={(e) => {
                    // allow only digits, max 2 chars (00-99)
                    let v = String(e.target.value || '')
                    v = v.replace(/[^0-9]/g, '').slice(0,2)
                    onChange(index, "durationMonths", v)
                  }}
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. 03"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Mentor Name">
                <Input 
                  value={getField(item, "mentorName", "mentor_name")} 
                  onChange={(e) => onChange(index, "mentorName", e.target.value)} 
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. Dr. Priya Sharma"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Skills (comma separated)">
                <Input 
                  value={getField(item, "skills", "skills")} 
                  onChange={(e) => onChange(index, "skills", e.target.value)} 
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. Python, Machine Learning"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Proof Document">
                {isEditing && (
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" color="gray.700">Upload proof (saved when you click Save changes)</Text>
                    <StyledFileInput
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                      onChange={handleFileChange}
                      acceptLabel="PDF, JPG, PNG"
                    />
                    {pendingPreview && (
                      <Box 
                        border="2px dashed" 
                        borderColor="orange.300" 
                        borderRadius="md" 
                        p={2}
                        bg="orange.50"
                      >
                        <Image 
                          src={pendingPreview} 
                          alt="Preview" 
                          maxH="200px" 
                          objectFit="contain"
                          mx="auto"
                        />
                        <Text fontSize="xs" color="orange.600" mt={2} textAlign="center" fontWeight="bold">
                          Pending Upload
                        </Text>
                      </Box>
                    )}
                    {pendingFile && !pendingPreview && (
                      <Box 
                        border="2px dashed" 
                        borderColor="orange.300" 
                        borderRadius="md" 
                        p={2}
                        bg="orange.50"
                      >
                        <Text fontSize="sm" color="orange.600" textAlign="center">
                          📄 {pendingFile.name} (Pending Upload)
                        </Text>
                      </Box>
                    )}
                  </VStack>
                )}
                {(getField(item, "proofDocument", "proof_document")) && (
                  <Box mt={2}>
                    {getField(item, "proofDocument", "proof_document").match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <Box 
                        border="1px solid" 
                        borderColor="gray.200" 
                        borderRadius="md" 
                        p={2}
                        bg="gray.50"
                      >
                        <Image 
                          src={getFileUrl(getField(item, "proofDocument", "proof_document"))} 
                          alt="Proof document" 
                          maxH="200px" 
                          objectFit="contain"
                          mx="auto"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <Link 
                          href={getFileUrl(getField(item, "proofDocument", "proof_document"))} 
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
                        href={getFileUrl(getField(item, "proofDocument", "proof_document"))} 
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
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                placeholder="Describe your work and learnings..."
                _placeholder={{ opacity: 0.7, color: "inherit" }}
              />
            </Field>
          </VStack>
        </Collapse>
      </CardBody>
    </Card>
  )
}
