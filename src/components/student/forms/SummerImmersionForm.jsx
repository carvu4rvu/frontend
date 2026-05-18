import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Collapse, Flex, Textarea, useToast, Image, Link, Badge, Icon, Center } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { useState, useEffect, useRef } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaGraduationCap, FaMapMarkerAlt, FaCalendarAlt, FaExternalLinkAlt, FaExclamationCircle } from "react-icons/fa"
import { getFileUrl } from "../../../utils/fileUrl"
import "../../../pages/student/profile/GrowthSections.css"

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
    if (field === 'durationWeeks' || field === 'duration_weeks') {
      newItems[index].durationWeeks = value
      newItems[index].duration_weeks = value
    }
    if (field === 'durationMonths' || field === 'duration_months') {
      newItems[index].durationMonths = value
      newItems[index].duration_months = value
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
    <Box className="growth-profile-container" bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="sm">
      <Flex className="growth-header">
        <Heading className="growth-title" size="md">
          <Icon as={FaGraduationCap} className="growth-title-icon" />
          Summer Immersion
        </Heading>
        {isEditing && (
          <Button 
            leftIcon={<FaPlus />} 
            onClick={handleAddImmersion} 
            className="growth-add-btn"
            size="sm"
          >
            Add Immersion
          </Button>
        )}
      </Flex>
      
      <Box className="growth-timeline">
        {immersionItems.length === 0 ? (
          <Center py={12} flexDirection="column" gap={4} border="2px dashed" borderColor="gray.100" borderRadius="xl">
            <Icon as={FaGraduationCap} boxSize={12} color="gray.200" />
            <Text color="gray.500" fontWeight="500">No summer immersion records found.</Text>
            {isEditing && (
              <Button leftIcon={<FaPlus />} variant="outline" colorScheme="orange" onClick={handleAddImmersion}>
                Add your first record
              </Button>
            )}
          </Center>
        ) : (
          immersionItems.map((item, index) => (
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
          ))
        )}
      </Box>
    </Box>
  )
}

const SummerExperienceItem = ({ index, item, onChange, onDelete, isEditing, kind, onFileSelect, fieldErrors = {} }) => {
  const today = new Date().toISOString().split("T")[0]
  const [isOpen, setIsOpen] = useState(false)
  const [pendingPreview, setPendingPreview] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)
  const lastProcessedFileRef = useRef(null)
  const hasProof = !!(getField(item, "proof_document", "proofDocument"))

  const getError = (field) => {
    const msg = fieldErrors[field] || fieldErrors[field.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "")]
    return msg && String(msg).trim() ? String(msg).trim() : null
  }

  const hasErrors = Object.keys(fieldErrors).length > 0

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
    if (hasErrors) setIsOpen(true)
  }, [hasErrors])

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

  const calculateAndSetDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || end < start) return;

    const diffTime = Math.abs(end - start);
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    const adjustedWeeks = diffWeeks <= 0 ? 1 : diffWeeks;
    
    const durationField = kind === "Immersion" ? "durationWeeks" : "durationMonths";
    // For Internship in this generic form, it would still be months, but this component is specifically for Immersion usually
    onChange(index, durationField, String(adjustedWeeks));
  }

  const org = getField(item, "organization")
  const role = getField(item, "job_role", "jobRole")
  const loc = getField(item, "location")
  const start = getField(item, "start_date", "startDate")
  const end = getField(item, "end_date", "endDate")
  const durationLabel = kind === "Immersion" ? "Duration (Weeks)" : "Duration (Months)"
  const durationField = kind === "Immersion" ? "durationWeeks" : "durationMonths"

  return (
    <Box className="growth-item-wrapper">
      <Box className="growth-item-dot" />
      <Box className={`growth-card ${isOpen ? 'growth-card--expanded' : ''} ${hasErrors ? 'growth-card--error' : ''}`}>
        <Flex className="growth-card-header" onClick={() => setIsOpen(!isOpen)}>
          <Box className="growth-card-title-group" flex={1}>
            <Badge className="growth-badge">Summer {kind}</Badge>
            <Heading className="growth-card-title" size="sm">
              {org ? `${org} - ${role}` : `${kind} Entry #${index + 1}`}
            </Heading>
            <Flex className="growth-meta-info">
              {loc && (
                <Box className="growth-meta-item">
                  <Icon as={FaMapMarkerAlt} boxSize={3} />
                  <Text>{loc}</Text>
                </Box>
              )}
              {start && (
                <Box className="growth-meta-item">
                  <Icon as={FaCalendarAlt} boxSize={3} />
                  <Text>{normalizeDateValue(start)} {end ? `to ${normalizeDateValue(end)}` : ''}</Text>
                </Box>
              )}
            </Flex>
          </Box>
          <Flex align="center" gap={2}>
            {hasErrors && <Icon as={FaExclamationCircle} color="red.500" boxSize={5} />}
            {isEditing && (
              <IconButton 
                size="sm" 
                variant="ghost" 
                colorScheme="red" 
                aria-label="Delete" 
                onClick={(e) => { e.stopPropagation(); onDelete(index); }}
                icon={<FaTrash />}
              />
            )}
            <IconButton 
              size="sm" 
              variant="ghost" 
              aria-label="Toggle" 
              onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
              icon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
            />
          </Flex>
        </Flex>

        <Collapse in={isOpen}>
          <Box className="growth-card-body">
            <VStack align="stretch" spacing={6}>
              {isEditing ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Field label="Organization *" required errorText={getError("organization")}>
                    <Input 
                      value={org} 
                      onChange={(e) => onChange(index, "organization", e.target.value)} 
                      variant="flushed"
                      placeholder="e.g. Innovation Hub"
                    />
                  </Field>
                  <Field label="Job Role *" required errorText={getError("job_role")}>
                    <Input 
                      value={role} 
                      onChange={(e) => onChange(index, "jobRole", e.target.value)} 
                      variant="flushed"
                      placeholder="e.g. Trainee"
                    />
                  </Field>
                  <Field label="Location">
                    <Input 
                      value={loc} 
                      onChange={(e) => onChange(index, "location", e.target.value)} 
                      variant="flushed"
                      placeholder="e.g. Remote"
                    />
                  </Field>
                  <Field label="Stipend" errorText={getError("stipend")}>
                    <Input
                      type="number"
                      value={getField(item, "stipend")}
                      onChange={(e) => onChange(index, "stipend", sanitizeStipend(e.target.value))}
                      variant="flushed"
                      placeholder="0"
                      min={0}
                      max={999999999999}
                      step="any"
                    />
                  </Field>
                  <Field label="Start Date *" errorText={getError("start_date")}>
                     <Input 
                       type="date"
                       max={today}
                       value={normalizeDateValue(start)} 
                       onChange={(e) => {
                         const v = e.target.value;
                         onChange(index, "startDate", v);
                         calculateAndSetDuration(v, end);
                       }} 
                       variant="flushed"
                     />
                   </Field>
                   <Field label="End Date *" errorText={getError("end_date")}>
                     <Input 
                       type="date"
                       min={normalizeDateValue(start) || "1900-01-01"}
                       max={today}
                       value={normalizeDateValue(end)} 
                       onChange={(e) => {
                         const v = e.target.value;
                         onChange(index, "endDate", v);
                         calculateAndSetDuration(start, v);
                       }} 
                       variant="flushed"
                     />
                   </Field>
                  <Field label={durationLabel} errorText={getError(durationField)}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={getField(item, durationField, "duration_weeks", "durationWeeks")}
                      onChange={(e) => {
                        let v = String(e.target.value || '').replace(/[^0-9]/g, '').slice(0,2)
                        onChange(index, durationField, v)
                      }}
                      variant="flushed"
                      placeholder={kind === "Immersion" ? "e.g. 12" : "e.g. 03"}
                    />
                  </Field>
                  <Field label="Mentor Name" errorText={getError("mentor_name")}>
                    <Input 
                      value={getField(item, "mentorName", "mentor_name")} 
                      onChange={(e) => onChange(index, "mentorName", sanitizeMentorName(e.target.value))} 
                      variant="flushed"
                      placeholder="e.g. Mr. Rajesh Kumar"
                    />
                  </Field>
                  <Field label="Skills (comma separated)">
                    <Input
                      value={getField(item, "skills")}
                      onChange={(e) => onChange(index, "skills", e.target.value)}
                      variant="flushed"
                      placeholder="e.g. Python, ML"
                    />
                  </Field>
                  <Field label="Proof Document" gridColumn={{ md: "span 2" }}>
                    <VStack align="stretch" spacing={2}>
                      <StyledFileInput
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        acceptLabel="PDF, JPG, PNG"
                      />
                      {(pendingPreview || pendingFile) && (
                        <Box className="growth-file-preview">
                          <Icon as={FaCalendarAlt} color="orange.400" />
                          <Text fontSize="xs" fontWeight="bold" color="orange.600">
                            {pendingFile ? pendingFile.name : 'Image Preview'} (Pending Save)
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Field>
                </SimpleGrid>
              ) : (
                <Box>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} className="growth-view-grid">
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Organization</Text>
                      <Text className="growth-view-value">{org || "-"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Job Role</Text>
                      <Text className="growth-view-value">{role || "-"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Location</Text>
                      <Text className="growth-view-value">{loc || "-"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Duration</Text>
                      <Text className="growth-view-value">
                        {getField(item, durationField, kind === 'Immersion' ? 'duration_weeks' : 'duration_months') 
                          ? `${getField(item, durationField, kind === 'Immersion' ? 'duration_weeks' : 'duration_months')} ${kind === 'Immersion' ? 'Weeks' : 'Months'}` 
                          : "-"}
                      </Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Mentor</Text>
                      <Text className="growth-view-value">{getField(item, "mentorName", "mentor_name") || "-"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Stipend</Text>
                      <Text className="growth-view-value">{getField(item, "stipend") || "-"}</Text>
                    </Box>
                    {getField(item, "description") && (
                      <Box className="growth-view-item" gridColumn={{ md: "span 3" }}>
                        <Text className="growth-view-label">Description</Text>
                        <Text className="growth-view-value">{getField(item, "description")}</Text>
                      </Box>
                    )}
                  </SimpleGrid>
                  {hasProof && (
                    <Box className="growth-view-document">
                      <HStack>
                        <Icon as={FaExternalLinkAlt} color="blue.500" />
                        <Text fontSize="sm" fontWeight="600" color="blue.700">Immersion Proof / Certificate</Text>
                      </HStack>
                      <Link href={getFileUrl(getField(item, "proof_document", "proofDocument"))} isExternal fontSize="xs" color="blue.600" fontWeight="bold" textDecoration="underline">
                        VIEW DOCUMENT
                      </Link>
                    </Box>
                  )}
                </Box>
              )}
              {isEditing && (
                <>
                  <Field label="Organization Details">
                    <Textarea 
                      value={getField(item, "organizationDetails", "organization_details")} 
                      onChange={(e) => onChange(index, "organizationDetails", e.target.value)} 
                      variant="flushed"
                      rows={2}
                      placeholder="Details about the organization..."
                    />
                  </Field>
                  <Field label="Description">
                    <Textarea 
                      value={getField(item, "description")} 
                      onChange={(e) => onChange(index, "description", e.target.value)} 
                      variant="flushed"
                      rows={3}
                      placeholder="Describe your work and learnings..."
                    />
                  </Field>
                </>
              )}
            </VStack>
          </Box>
        </Collapse>
      </Box>
    </Box>
  )
}
