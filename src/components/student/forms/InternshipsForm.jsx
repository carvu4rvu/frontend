/**
 * Component: InternshipsForm
 * Styled like Education / Growth sections (timeline cards).
 */

import {
  Box,
  VStack,
  Heading,
  Button,
  Input,
  SimpleGrid,
  IconButton,
  Text,
  Collapse,
  Flex,
  Textarea,
  Image,
  Link,
  Wrap,
  WrapItem,
  Badge,
  Icon,
  Center,
  HStack,
} from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { useState, useEffect, useRef } from "react"
import {
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaBriefcase,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaExternalLinkAlt,
  FaExclamationCircle,
} from "react-icons/fa"
import { getFileUrl } from "../../../utils/fileUrl"
import "../../../pages/student/profile/GrowthSections.css"

function getField(item, ...keys) {
  for (const k of keys) {
    const v = item?.[k]
    if (v !== undefined && v !== null && v !== "") return v
  }
  return ""
}

function onlyDigits(value, maxLength = 0) {
  const digits = String(value).replace(/\D/g, "")
  if (maxLength && digits.length > maxLength) return digits.slice(0, maxLength)
  return digits
}

function toDateValue(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim()
  const dateOnly = s.split("T")[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : ""
}

export const InternshipsForm = ({ data = {}, onUpdate, isEditing = false, onFileSelect, fieldErrors = null }) => {
  const items = Array.isArray(data) ? data : (data.internships || [])
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
        _isNewEntry: true,
      },
    ])
  }

  const handleDelete = (index) => {
    onUpdate(items.filter((_, i) => i !== index))
  }

  return (
    <Box className="growth-profile-container" bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="sm">
      <Flex className="growth-header">
        <Heading className="growth-title" size="md">
          <Icon as={FaBriefcase} className="growth-title-icon" />
          Internships
        </Heading>
        {isEditing && (
          <Button leftIcon={<FaPlus />} onClick={handleAdd} className="growth-add-btn" size="sm">
            Add Internship
          </Button>
        )}
      </Flex>

      <Box className="growth-timeline">
        {items.length === 0 ? (
          <Center py={12} flexDirection="column" gap={4} border="2px dashed" borderColor="gray.100" borderRadius="xl">
            <Icon as={FaBriefcase} boxSize={12} color="gray.200" />
            <Text color="gray.500" fontWeight="500">
              No internships added yet.
            </Text>
            {isEditing && (
              <Button leftIcon={<FaPlus />} variant="outline" colorScheme="orange" onClick={handleAdd}>
                Add your first internship
              </Button>
            )}
          </Center>
        ) : (
          items.map((item, index) => (
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
          ))
        )}
      </Box>
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
    if (isNewEntry && item._isNewEntry === true) {
      onChange(index, "_isNewEntry", false)
    }
  }, [hasProof, isNewEntry])

  useEffect(() => {
    if (hasErrors && !isOpen) setIsOpen(true)
  }, [hasErrors])

  const getError = (field) => {
    const msg =
      fieldErrors[field] ||
      fieldErrors[field.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "")]
    return msg && String(msg).trim() ? String(msg).trim() : null
  }

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (file === lastProcessedFileRef.current) return
    lastProcessedFileRef.current = file
    setTimeout(() => {
      lastProcessedFileRef.current = null
    }, 0)
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    if (file.type.startsWith("image/")) {
      setPendingPreview(URL.createObjectURL(file))
    } else {
      setPendingPreview(null)
    }
    if (onFileSelect) onFileSelect(file)
    e.target.value = ""
  }

  const org = getField(item, "organization")
  const role = getField(item, "jobRole", "job_role")
  const loc = getField(item, "location")
  const start = getField(item, "startDate", "start_date")
  const end = getField(item, "endDate", "end_date")
  const proofUrl = getField(item, "proofDocument", "proof_document")

  const skillsList = (() => {
    const val = getField(item, "skills")
    return typeof val === "string" ? val.split(",").map((s) => s.trim()).filter(Boolean) : []
  })()

  return (
    <Box className="growth-item-wrapper">
      <Box className="growth-item-dot" />
      <Box className={`growth-card ${isOpen ? "growth-card--expanded" : ""} ${hasErrors ? "growth-card--error" : ""}`}>
        <Flex className="growth-card-header" onClick={() => setIsOpen(!isOpen)}>
          <Box className="growth-card-title-group" flex={1}>
            <Badge className="growth-badge">Internship</Badge>
            <Heading className="growth-card-title" size="sm">
              {org ? `${org} — ${role || "Role"}` : `Internship #${index + 1}`}
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
                  <Text>
                    {toDateValue(start)}
                    {end ? ` to ${toDateValue(end)}` : ""}
                  </Text>
                </Box>
              )}
              {getField(item, "stipend") && (
                <Box className="growth-meta-item">
                  <Icon as={FaMoneyBillWave} boxSize={3} />
                  <Text>₹{getField(item, "stipend")}</Text>
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
                className="growth-delete-btn"
                aria-label="Delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(index)
                }}
                icon={<FaTrash />}
              />
            )}
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Toggle"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(!isOpen)
              }}
              icon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
            />
          </Flex>
        </Flex>

        <Collapse in={isOpen}>
          <Box className="growth-card-body">
            <VStack align="stretch" spacing={6}>
              {isEditing ? (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Field label="Organization *" errorText={getError("organization")}>
                      <Input
                        value={org}
                        onChange={(e) => onChange(index, "organization", e.target.value)}
                        variant="flushed"
                        placeholder="e.g. Google"
                      />
                    </Field>
                    <Field label="Job Role *" errorText={getError("job_role") || getError("jobRole")}>
                      <Input
                        value={role}
                        onChange={(e) => onChange(index, "jobRole", e.target.value)}
                        variant="flushed"
                        placeholder="e.g. Software Engineering Intern"
                      />
                    </Field>
                    <Field label="Location" errorText={getError("location")}>
                      <Input
                        value={loc}
                        onChange={(e) => onChange(index, "location", e.target.value)}
                        variant="flushed"
                        placeholder="e.g. Bangalore"
                      />
                    </Field>
                    <Field label="Stipend" errorText={getError("stipend")}>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={getField(item, "stipend")}
                        onChange={(e) => {
                          const v = onlyDigits(e.target.value, 6)
                          if (v === "") {
                            onChange(index, "stipend", "")
                            return
                          }
                          const num = parseInt(v, 10)
                          onChange(index, "stipend", num > 500000 ? "500000" : v)
                        }}
                        variant="flushed"
                        placeholder="0 (max 5 lakh)"
                      />
                    </Field>
                    <Field label="Start Date *" errorText={getError("start_date") || getError("startDate")}>
                      <Input
                        type="date"
                        value={toDateValue(start)}
                        onChange={(e) => onChange(index, "startDate", toDateValue(e.target.value))}
                        variant="flushed"
                        min="1900-01-01"
                        max="2100-12-31"
                      />
                    </Field>
                    <Field label="End Date *" errorText={getError("end_date") || getError("endDate")}>
                      <Input
                        type="date"
                        value={toDateValue(end)}
                        onChange={(e) => onChange(index, "endDate", toDateValue(e.target.value))}
                        variant="flushed"
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
                          const v = onlyDigits(e.target.value, 2)
                          if (v !== "" && parseInt(v, 10) > 99) return
                          onChange(index, "durationMonths", v === "" ? "" : v)
                        }}
                        variant="flushed"
                        placeholder="e.g. 06"
                      />
                    </Field>
                    <Field label="Mentor Name" errorText={getError("mentor_name") || getError("mentorName")}>
                      <Input
                        value={getField(item, "mentorName", "mentor_name")}
                        onChange={(e) => onChange(index, "mentorName", e.target.value)}
                        variant="flushed"
                        placeholder="e.g. John Doe"
                      />
                    </Field>
                    <Field label="Skills (comma separated)" gridColumn={{ md: "span 2" }}>
                      <Input
                        value={getField(item, "skills")}
                        onChange={(e) => onChange(index, "skills", e.target.value)}
                        variant="flushed"
                        placeholder="e.g. React, Node.js"
                      />
                    </Field>
                    <Field
                      label="Proof Document (PDF/Image) *"
                      gridColumn={{ md: "span 2" }}
                      errorText={getError("proof_document") || getError("proofDocument")}
                    >
                      <VStack align="stretch" spacing={2}>
                        <Text fontSize="xs" color="gray.500">
                          Select a file, then click Save changes to upload.
                        </Text>
                        <StyledFileInput
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,image/*,.doc,.docx"
                          onChange={handleFileChange}
                          acceptLabel="PDF, JPG, PNG"
                        />
                        {pendingPreview && (
                          <Box className="growth-file-preview">
                            <Image src={pendingPreview} alt="Preview" maxH="120px" objectFit="contain" />
                            <Text fontSize="xs" fontWeight="bold" color="orange.600" mt={1}>
                              Pending (save to upload)
                            </Text>
                          </Box>
                        )}
                        {proofUrl && !pendingPreview && (
                          <Box className="growth-view-document" mt={2}>
                            <HStack>
                              <Icon as={FaExternalLinkAlt} color="blue.500" />
                              <Text fontSize="sm" fontWeight="600" color="blue.700">
                                Current document
                              </Text>
                            </HStack>
                            <Link
                              href={getFileUrl(proofUrl)}
                              isExternal
                              fontSize="xs"
                              color="blue.600"
                              fontWeight="bold"
                              textDecoration="underline"
                            >
                              VIEW DOCUMENT
                            </Link>
                          </Box>
                        )}
                      </VStack>
                    </Field>
                  </SimpleGrid>
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
                      placeholder="Describe your work and achievements..."
                    />
                  </Field>
                </>
              ) : (
                <Box>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} className="growth-view-grid">
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Organization</Text>
                      <Text className="growth-view-value">{org || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Job Role</Text>
                      <Text className="growth-view-value">{role || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Location</Text>
                      <Text className="growth-view-value">{loc || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Stipend</Text>
                      <Text className="growth-view-value">{getField(item, "stipend") || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Duration</Text>
                      <Text className="growth-view-value">
                        {getField(item, "durationMonths", "duration_months")
                          ? `${getField(item, "durationMonths", "duration_months")} months`
                          : "—"}
                      </Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Mentor</Text>
                      <Text className="growth-view-value">{getField(item, "mentorName", "mentor_name") || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Start Date</Text>
                      <Text className="growth-view-value">{start ? toDateValue(start) : "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">End Date</Text>
                      <Text className="growth-view-value">{end ? toDateValue(end) : "—"}</Text>
                    </Box>
                    <Box className="growth-view-item" gridColumn={{ md: "span 3" }}>
                      <Text className="growth-view-label">Skills</Text>
                      {skillsList.length > 0 ? (
                        <Wrap spacing={2} mt={1}>
                          {skillsList.map((skill, i) => (
                            <WrapItem key={i}>
                              <Badge
                                colorScheme="gray"
                                variant="subtle"
                                px={2}
                                py={1}
                                borderRadius="md"
                                fontWeight="medium"
                                textTransform="none"
                              >
                                {skill}
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      ) : (
                        <Text className="growth-view-value">—</Text>
                      )}
                    </Box>
                    {getField(item, "organizationDetails", "organization_details") && (
                      <Box className="growth-view-item" gridColumn={{ md: "span 3" }}>
                        <Text className="growth-view-label">Organization Details</Text>
                        <Text className="growth-view-value">
                          {getField(item, "organizationDetails", "organization_details")}
                        </Text>
                      </Box>
                    )}
                    {getField(item, "description") && (
                      <Box className="growth-view-item" gridColumn={{ md: "span 3" }}>
                        <Text className="growth-view-label">Description</Text>
                        <Text className="growth-view-value">{getField(item, "description")}</Text>
                      </Box>
                    )}
                  </SimpleGrid>
                  {hasProof && (
                    <Box className="growth-view-document" mt={4}>
                      <HStack>
                        <Icon as={FaExternalLinkAlt} color="blue.500" />
                        <Text fontSize="sm" fontWeight="600" color="blue.700">
                          Proof Document
                        </Text>
                      </HStack>
                      {proofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <Box mt={2}>
                          <Image
                            src={getFileUrl(proofUrl)}
                            alt="Proof"
                            maxH="160px"
                            objectFit="contain"
                            borderRadius="md"
                            onError={(e) => {
                              e.target.style.display = "none"
                            }}
                          />
                          <Link
                            href={getFileUrl(proofUrl)}
                            isExternal
                            fontSize="xs"
                            color="blue.600"
                            fontWeight="bold"
                            mt={2}
                            display="inline-block"
                          >
                            VIEW FULL SIZE
                          </Link>
                        </Box>
                      ) : (
                        <Link
                          href={getFileUrl(proofUrl)}
                          isExternal
                          fontSize="xs"
                          color="blue.600"
                          fontWeight="bold"
                          textDecoration="underline"
                          mt={2}
                          display="inline-block"
                        >
                          VIEW DOCUMENT
                        </Link>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </VStack>
          </Box>
        </Collapse>
      </Box>
    </Box>
  )
}
