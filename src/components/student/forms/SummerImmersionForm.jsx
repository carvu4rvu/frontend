import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, Image, Link } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { useState, useEffect, useRef } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { getFileUrl } from "../../../utils/fileUrl"

/** Normalize date for type="date" input: YYYY-MM-DD or ISO string only. */
function normalizeDateValue(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim().split("T")[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ""
}

/** Get value from item supporting both camelCase and snake_case (API returns snake_case). */
function getField(item, ...keys) {
  for (const k of keys) {
    const v = item?.[k]
    if (v !== undefined && v !== null && v !== "") return v
  }
  return ""
}

const STIPEND_MAX = 999999999999
const STIPEND_MAX_DIGITS = 15

/** Restrict stipend: max 15 digits, max value 999999999999, non-negative. */
function sanitizeStipend(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim().replace(/,/g, "")
  if (s === "" || s === "-") return ""
  const num = parseFloat(s)
  if (Number.isNaN(num) || num < 0) return ""
  if (num > STIPEND_MAX) return String(STIPEND_MAX)
  const digitChars = s.replace(/[^\d]/g, "")
  if (digitChars.length > STIPEND_MAX_DIGITS) return String(Math.min(Math.floor(num), STIPEND_MAX))
  return s
}

/** Allow only letters, spaces, hyphens, apostrophes, periods (no numbers). */
function sanitizeMentorName(val) {
  if (val == null || val === "") return ""
  return String(val).replace(/\d/g, "")
}

export const SummerImmersionForm = ({ data, onUpdate, isEditing = false, onFileSelect, fieldErrors = null }) => {
  const safeData = data != null ? data : []
  const immersionItems = Array.isArray(safeData) ? safeData : (safeData.summerImmersion || safeData.immersion || [])
  const errorsByIndex = fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {}
  const getErrorsForIndex = (index) => {
    const row = errorsByIndex[index] ?? errorsByIndex[String(index)]
    return row && typeof row === "object" ? row : {}
  }

  const updateImmersion = (items) => {
    if (Array.isArray(safeData)) {
        onUpdate(items)
    } else {
        onUpdate({ ...safeData, summerImmersion: items, immersion: items })
    }
  }

  const handleImmersionChange = (index, field, value) => {
    const newItems = [...immersionItems]
    const prev = newItems[index] || {}
    newItems[index] = { ...prev, [field]: value }
    if (field === 'jobRole' || field === 'job_role') {
      newItems[index].jobRole = value
      newItems[index].job_role = value
    }
    updateImmersion(newItems)
  }

  const handleAddImmersion = () => {
    updateImmersion([
      ...immersionItems,
      {
        job_role: "",
        organization: "",
        organization_details: "",
        duration_weeks: "",
        start_date: "",
        end_date: "",
        location: "",
        stipend: "",
        skills: "",
        description: "",
        mentor_name: "",
        proof_document: ""
      }
    ])
  }

  const handleDeleteImmersion = (index) => {
    const newItems = immersionItems.filter((_, i) => i !== index)
    updateImmersion(newItems)
  }

  return (
    <Box bg="white" p={8} borderRadius="xl" shadow="sm">
      <Heading size="lg" mb={6} color="#20343c">Summer Immersion</Heading>

      <VStack spacing={6} align="stretch">
        {immersionItems.map((item, index) => (
          <SummerExperienceItem
            key={`immersion-${index}`}
            index={index}
            item={item}
            onChange={handleImmersionChange}
            onDelete={handleDeleteImmersion}
            isEditing={isEditing}
            kind="Immersion"
            onFileSelect={onFileSelect ? (file) => onFileSelect(index, file) : undefined}
            fieldErrors={getErrorsForIndex(index)}
          />
        ))}

        {isEditing && (
          <Button
            leftIcon={<FaPlus />}
            onClick={handleAddImmersion}
            variant="outline"
            colorScheme="orange"
            borderColor="#d4a960"
            color="#d4a960"
            _hover={{ bg: "#fff5e6" }}
          >
            Add Summer Immersion
          </Button>
        )}

        {immersionItems.length === 0 && !isEditing && (
          <Box p={8} textAlign="center" color="gray.700" border="1px dashed" borderColor="gray.300" borderRadius="xl">
            No summer immersion added yet.
          </Box>
        )}
      </VStack>
    </Box>
  )
}

const SummerExperienceItem = ({ index, item, onChange, onDelete, isEditing, kind, onFileSelect, fieldErrors = {} }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingPreview, setPendingPreview] = useState(null)
  const lastProcessedFileRef = useRef(null)
  const hasProof = !!(getField(item, "proof_document", "proofDocument"))

  const getError = (field) => {
    const msg = fieldErrors[field] || fieldErrors[field.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "")]
    return msg && String(msg).trim() ? String(msg).trim() : null
  }
  useEffect(() => {
    if (hasProof && pendingPreview) {
      URL.revokeObjectURL(pendingPreview)
      setPendingPreview(null)
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
    } else {
      setPendingPreview(null)
    }
    if (onFileSelect) onFileSelect(file)
    e.target.value = ""
  }

  const titleFallback = kind === "Immersion" ? `Summer Immersion ${index + 1}` : `Summer Internship ${index + 1}`
  const durationLabel = kind === "Immersion" ? "Duration (Weeks)" : "Duration (Months)"
  const durationField = kind === "Immersion" ? "durationWeeks" : "durationMonths"

  return (
    <Card variant="outline" borderColor="gray.200">
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
          <HStack onClick={() => setIsOpen(!isOpen)} cursor="pointer" flex={1}>
            <Text fontWeight="bold" color="gray.800">
              {getField(item, "organization") ? `${getField(item, "organization")} - ${getField(item, "job_role", "jobRole")}` : titleFallback}
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
              <Field label="Organization (Required)" required errorText={getError("organization")}>
                <Input
                  value={getField(item, "organization")}
                  onChange={(e) => onChange(index, "organization", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. Tech Innovations Inc."
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Job Role (Required)" required errorText={getError("job_role")}>
                <Input
                  value={getField(item, "job_role", "jobRole")}
                  onChange={(e) => onChange(index, "jobRole", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. Data Science Intern"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Location">
                <Input
                  value={getField(item, "location")}
                  onChange={(e) => onChange(index, "location", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. Bangalore"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Stipend" errorText={getError("stipend")}>
                <Input
                  type="number"
                  value={getField(item, "stipend")}
                  onChange={(e) => {
                    const v = sanitizeStipend(e.target.value)
                    onChange(index, "stipend", v)
                  }}
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="0"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                  min={0}
                  max={999999999999}
                  step="any"
                />
              </Field>
              <Field label="Start Date" errorText={getError("start_date")}>
                <Input
                  type="date"
                  min="1900-01-01"
                  max="2100-12-31"
                  value={normalizeDateValue(getField(item, "start_date", "startDate"))}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v || /^\d{4}-\d{2}-\d{2}$/.test(v)) onChange(index, "startDate", v)
                  }}
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                />
              </Field>
              <Field label="End Date" errorText={getError("end_date")}>
                <Input
                  type="date"
                  min="1900-01-01"
                  max="2100-12-31"
                  value={normalizeDateValue(getField(item, "end_date", "endDate"))}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v || /^\d{4}-\d{2}-\d{2}$/.test(v)) onChange(index, "endDate", v)
                  }}
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                />
              </Field>
              <Field label={durationLabel} errorText={getError("duration_weeks")}>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={getField(item, durationField, "duration_weeks", "durationWeeks")}
                  onChange={(e) => {
                    // allow only digits, max 2 chars (00-99)
                    let v = String(e.target.value || '')
                    v = v.replace(/[^0-9]/g, '').slice(0,2)
                    onChange(index, durationField, v)
                  }}
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder={kind === "Immersion" ? "e.g. 12" : "e.g. 03"}
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Mentor Name (letters only, no numbers)" errorText={getError("mentor_name")}>
                <Input
                  value={getField(item, "mentor_name", "mentorName")}
                  onChange={(e) => onChange(index, "mentorName", sanitizeMentorName(e.target.value))}
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. Dr. Priya Sharma"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Skills (comma separated)">
                <Input
                  value={getField(item, "skills")}
                  onChange={(e) => onChange(index, "skills", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                  placeholder="e.g. Python, Machine Learning"
                  _placeholder={{ opacity: 0.7, color: "inherit" }}
                />
              </Field>
              <Field label="Proof Document (PDF/Image)">
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
                {(getField(item, "proof_document", "proofDocument")) && (
                  <Box mt={2}>
                    {(getField(item, "proof_document", "proofDocument")).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <Box 
                        border="1px solid" 
                        borderColor="gray.200" 
                        borderRadius="md" 
                        p={2}
                        bg="gray.50"
                      >
                        <Image 
                          src={getFileUrl(getField(item, "proof_document", "proofDocument"))} 
                          alt="Proof document" 
                          maxH="200px" 
                          objectFit="contain"
                          mx="auto"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <Link 
                          href={getFileUrl(getField(item, "proof_document", "proofDocument"))} 
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
                        href={getFileUrl(getField(item, "proof_document", "proofDocument"))} 
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
                value={getField(item, "organization_details", "organizationDetails")}
                onChange={(e) => onChange(index, "organizationDetails", e.target.value)}
                variant="flushed"
                rows={2}
                isDisabled={!isEditing}
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                placeholder="Details about the organization..."
                _placeholder={{ opacity: 0.7, color: "inherit" }}
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={getField(item, "description")}
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
