import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Collapse, Flex, Textarea, useToast, Image, Link, Badge, Icon, Center } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { useState, useEffect, useRef } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaBriefcase, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave, FaExternalLinkAlt, FaExclamationCircle } from "react-icons/fa"
import { getFileUrl } from "../../../utils/fileUrl"
import "../../../pages/student/profile/GrowthSections.css"

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
    const updated = { ...newItems[index], [field]: value }
    
    // Sync common camelCase/snake_case fields
    if (field === 'jobRole' || field === 'job_role') {
      updated.jobRole = value;
      updated.job_role = value;
    }
    if (field === 'durationMonths' || field === 'duration_months') {
      updated.durationMonths = value;
      updated.duration_months = value;
    }
    
    newItems[index] = updated
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
    <Box className="growth-profile-container" bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="sm">
      <Flex className="growth-header">
        <Heading className="growth-title" size="md">
          <Icon as={FaBriefcase} className="growth-title-icon" />
          Summer Internship
        </Heading>
        {isEditing && (
          <Button 
            leftIcon={<FaPlus />} 
            onClick={handleAdd} 
            className="growth-add-btn"
            size="sm"
          >
            Add Internship
          </Button>
        )}
      </Flex>
      
      <Box className="growth-timeline">
        {items.length === 0 ? (
          <Center py={12} flexDirection="column" gap={4} border="2px dashed" borderColor="gray.100" borderRadius="xl">
            <Icon as={FaBriefcase} boxSize={12} color="gray.200" />
            <Text color="gray.500" fontWeight="500">No summer internships found.</Text>
            {isEditing && (
              <Button leftIcon={<FaPlus />} variant="outline" colorScheme="orange" onClick={handleAdd}>
                Add your first record
              </Button>
            )}
          </Center>
        ) : (
          items.map((item, index) => (
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
          ))
        )}
      </Box>
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

    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const adjustedMonths = months <= 0 ? 1 : months;
    onChange(index, "durationMonths", String(adjustedMonths));
  }

  const org = getField(item, "organization")
  const role = getField(item, "jobRole", "job_role")
  const loc = getField(item, "location")
  const start = getField(item, "startDate", "start_date")
  const end = getField(item, "endDate", "end_date")

  return (
    <Box className="growth-item-wrapper">
      <Box className="growth-item-dot" />
      <Box className={`growth-card ${isOpen ? 'growth-card--expanded' : ''} ${hasErrors ? 'growth-card--error' : ''}`}>
        <Flex className="growth-card-header" onClick={() => setIsOpen(!isOpen)}>
          <Box className="growth-card-title-group" flex={1}>
            <Badge className="growth-badge">Summer Internship</Badge>
            <Heading className="growth-card-title" size="sm">
              {org ? `${org} - ${role}` : `Internship Entry #${index + 1}`}
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
                  <Text>{toDateValue(start)} {end ? `to ${toDateValue(end)}` : ''}</Text>
                </Box>
              )}
              {getField(item, "stipend") && (
                <Box className="growth-meta-item">
                  <Icon as={FaMoneyBillWave} boxSize={3} />
                  <Text>Stipend: {getField(item, "stipend")}</Text>
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
                      placeholder="e.g. Tech Innovations Inc."
                    />
                  </Field>
                  <Field label="Job Role *" required errorText={getError("job_role")}>
                    <Input 
                      value={role} 
                      onChange={(e) => onChange(index, "jobRole", e.target.value)} 
                      variant="flushed"
                      placeholder="e.g. Summer Intern"
                    />
                  </Field>
                  <Field label="Location">
                    <Input 
                      value={loc} 
                      onChange={(e) => onChange(index, "location", e.target.value)} 
                      variant="flushed"
                      placeholder="e.g. Bangalore"
                    />
                  </Field>
                  <Field label="Stipend">
                    <Input 
                      type="number"
                      value={getField(item, "stipend")} 
                      onChange={(e) => onChange(index, "stipend", e.target.value)} 
                      variant="flushed"
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Start Date *" errorText={getError("start_date")}>
                    <Input 
                      type="date"
                      max={today}
                      value={toDateValue(start)} 
                      onChange={(e) => {
                        const v = e.target.value;
                        onChange(index, "startDate", toDateValue(v));
                        calculateAndSetDuration(v, end);
                      }} 
                      variant="flushed"
                    />
                  </Field>
                  <Field label="End Date *" errorText={getError("end_date")}>
                    <Input 
                      type="date"
                      min={toDateValue(start) || "1900-01-01"}
                      max={today}
                      value={toDateValue(end)} 
                      onChange={(e) => {
                        const v = e.target.value;
                        onChange(index, "endDate", toDateValue(v));
                        calculateAndSetDuration(start, v);
                      }} 
                      variant="flushed"
                    />
                  </Field>
                  <Field label="Duration (Months)" errorText={getError("duration_months")}>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      value={getField(item, "durationMonths", "duration_months")} 
                      onChange={(e) => {
                        let v = String(e.target.value || '').replace(/[^0-9]/g, '').slice(0,2)
                        onChange(index, "durationMonths", v)
                      }}
                      variant="flushed"
                      placeholder="e.g. 03"
                    />
                  </Field>
                  <Field label="Mentor Name">
                    <Input 
                      value={getField(item, "mentorName", "mentor_name")} 
                      onChange={(e) => onChange(index, "mentorName", e.target.value)} 
                      variant="flushed"
                      placeholder="e.g. Dr. Priya Sharma"
                    />
                  </Field>
                  <Field label="Skills (comma separated)" gridColumn={{ md: "span 2" }}>
                    <Input 
                      value={getField(item, "skills")} 
                      onChange={(e) => onChange(index, "skills", e.target.value)} 
                      variant="flushed"
                      placeholder="e.g. Python, Machine Learning"
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
                      <Text className="growth-view-label">Stipend</Text>
                      <Text className="growth-view-value">{getField(item, "stipend") || "-"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Duration</Text>
                      <Text className="growth-view-value">{getField(item, "durationMonths", "duration_months") ? `${getField(item, "durationMonths", "duration_months")} Months` : "-"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Mentor</Text>
                      <Text className="growth-view-value">{getField(item, "mentorName", "mentor_name") || "-"}</Text>
                    </Box>
                    <Box className="growth-view-item" gridColumn={{ md: "span 3" }}>
                      <Text className="growth-view-label">Skills</Text>
                      <Text className="growth-view-value">{getField(item, "skills") || "-"}</Text>
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
                        <Text fontSize="sm" fontWeight="600" color="blue.700">Internship Proof / Certificate</Text>
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
