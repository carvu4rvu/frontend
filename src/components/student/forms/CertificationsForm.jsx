/**
 * Certifications — styled like Internships / Training (GrowthSections timeline).
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
  Image,
  Link,
  Wrap,
  WrapItem,
  Badge,
  Icon,
  Center,
  HStack,
} from "@chakra-ui/react"
import { useState, useEffect, useRef } from "react"
import {
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaCertificate,
  FaBuilding,
  FaCalendarAlt,
  FaAward,
  FaExternalLinkAlt,
  FaExclamationCircle,
} from "react-icons/fa"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { getFileUrl } from "../../../utils/fileUrl"
import "../../../pages/student/profile/GrowthSections.css"

function getField(item, ...keys) {
  for (const k of keys) {
    const v = item?.[k]
    if (v !== undefined && v !== null && v !== "") return v
  }
  return ""
}

function toDateValue(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim().split("T")[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ""
}

export const CertificationsForm = ({ data = {}, onUpdate, isEditing, onFileSelect, fieldErrors = null }) => {
  const certifications = Array.isArray(data) ? data : (data.certifications || [])
  const errorsByIndex = fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {}
  const getErrorsForIndex = (index) => {
    const row = errorsByIndex[index] ?? errorsByIndex[String(index)]
    return row && typeof row === "object" ? row : {}
  }

  const handleAdd = () => {
    onUpdate([
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
        _isNewEntry: true,
      },
    ])
  }

  const handleRemove = (index) => {
    onUpdate(certifications.filter((_, i) => i !== index))
  }

  const handleChange = (index, field, value) => {
    const newCertifications = [...certifications]
    newCertifications[index] = { ...newCertifications[index], [field]: value }
    onUpdate(newCertifications)
  }

  return (
    <Box className="growth-profile-container" bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="sm">
      <Flex className="growth-header">
        <Heading className="growth-title" size="md">
          <Icon as={FaCertificate} className="growth-title-icon" />
          Certifications
        </Heading>
        {isEditing && (
          <Button leftIcon={<FaPlus />} onClick={handleAdd} className="growth-add-btn" size="sm">
            Add Certification
          </Button>
        )}
      </Flex>

      <Box className="growth-timeline">
        {certifications.length === 0 ? (
          <Center py={12} flexDirection="column" gap={4} border="2px dashed" borderColor="gray.100" borderRadius="xl">
            <Icon as={FaCertificate} boxSize={12} color="gray.200" />
            <Text color="gray.500" fontWeight="500">
              No certifications added yet.
            </Text>
            {isEditing && (
              <Button leftIcon={<FaPlus />} variant="outline" colorScheme="orange" onClick={handleAdd}>
                Add your first certification
              </Button>
            )}
          </Center>
        ) : (
          certifications.map((cert, index) => (
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
          ))
        )}
      </Box>
    </Box>
  )
}

const CertificationItem = ({ index, item, onChange, onDelete, isEditing, onFileSelect, fieldErrors = {} }) => {
  const hasErrors = !!(fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length > 0)
  const isNewEntry = item?._isNewEntry === true
  const [isOpen, setIsOpen] = useState(hasErrors || isNewEntry)
  const [pendingPreview, setPendingPreview] = useState(null)
  const lastProcessedFileRef = useRef(null)
  const hasProof = !!(item.proof_document || item.proofDocument)

  const getError = (field) => {
    const msg =
      fieldErrors[field] ||
      fieldErrors[field.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "")]
    return msg && String(msg).trim() ? String(msg).trim() : null
  }

  useEffect(() => {
    if (hasErrors && !isOpen) setIsOpen(true)
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

  const title = getField(item, "title")
  const organization = getField(item, "organization")
  const certType = getField(item, "certificationType", "certification_type")
  const issueDate = getField(item, "issueDate", "issue_date")
  const expiryDate = getField(item, "expiryDate", "expiry_date")
  const proofUrl = getField(item, "proofDocument", "proof_document")
  const score = getField(item, "score")

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
            <Badge className="growth-badge">{certType || "Certification"}</Badge>
            <Heading className="growth-card-title" size="sm">
              {title || `Certification #${index + 1}`}
            </Heading>
            <Flex className="growth-meta-info">
              {organization && (
                <Box className="growth-meta-item">
                  <Icon as={FaBuilding} boxSize={3} />
                  <Text>{organization}</Text>
                </Box>
              )}
              {issueDate && (
                <Box className="growth-meta-item">
                  <Icon as={FaCalendarAlt} boxSize={3} />
                  <Text>
                    Issued {toDateValue(issueDate)}
                    {expiryDate ? ` · Exp ${toDateValue(expiryDate)}` : ""}
                  </Text>
                </Box>
              )}
              {score && (
                <Box className="growth-meta-item">
                  <Icon as={FaAward} boxSize={3} />
                  <Text>{score}</Text>
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
                aria-label="Remove certification"
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
              aria-label="Toggle details"
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
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Field label="Certification Name *" errorText={getError("title")}>
                    <Input
                      value={title}
                      onChange={(e) => onChange(index, "title", e.target.value)}
                      variant="flushed"
                      placeholder="e.g. AWS Solutions Architect"
                    />
                  </Field>
                  <Field label="Issuing Organization *" errorText={getError("organization")}>
                    <Input
                      value={organization}
                      onChange={(e) => onChange(index, "organization", e.target.value)}
                      variant="flushed"
                      placeholder="e.g. Amazon Web Services"
                    />
                  </Field>
                  <Field label="Certification Type">
                    <Input
                      value={certType}
                      onChange={(e) => onChange(index, "certificationType", e.target.value)}
                      variant="flushed"
                      placeholder="e.g. Technical / Professional"
                    />
                  </Field>
                  <Field label="Score / Grade">
                    <Input
                      value={score}
                      onChange={(e) => onChange(index, "score", e.target.value)}
                      variant="flushed"
                      placeholder="e.g. Pass / 95%"
                    />
                  </Field>
                  <Field label="Skills" gridColumn={{ md: "span 2" }}>
                    <Input
                      value={getField(item, "skills")}
                      onChange={(e) => onChange(index, "skills", e.target.value)}
                      variant="flushed"
                      placeholder="e.g. Cloud Computing, Architecture"
                    />
                  </Field>
                  <Field label="Issue Date" errorText={getError("issue_date") || getError("issueDate")}>
                    <Input
                      type="date"
                      value={toDateValue(issueDate)}
                      onChange={(e) => onChange(index, "issueDate", toDateValue(e.target.value))}
                      variant="flushed"
                      min="1900-01-01"
                      max="2100-12-31"
                    />
                  </Field>
                  <Field label="Expiry Date" errorText={getError("expiry_date") || getError("expiryDate")}>
                    <Input
                      type="date"
                      value={toDateValue(expiryDate)}
                      onChange={(e) => onChange(index, "expiryDate", toDateValue(e.target.value))}
                      variant="flushed"
                      min="1900-01-01"
                      max="2100-12-31"
                    />
                  </Field>
                  <Field
                    label="Proof Document (PDF/Image)"
                    gridColumn={{ md: "span 2" }}
                    errorText={getError("proof_document") || getError("proofDocument")}
                  >
                    <VStack align="stretch" spacing={2}>
                      <Text fontSize="xs" color="gray.500">
                        Select a file, then click Save changes to upload.
                      </Text>
                      <StyledFileInput
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,image/*,.doc,.docx,.ppt,.pptx"
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
              ) : (
                <Box>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} className="growth-view-grid">
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Certification Name</Text>
                      <Text className="growth-view-value">{title || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Organization</Text>
                      <Text className="growth-view-value">{organization || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Type</Text>
                      <Text className="growth-view-value">{certType || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Issue Date</Text>
                      <Text className="growth-view-value">{issueDate ? toDateValue(issueDate) : "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Expiry Date</Text>
                      <Text className="growth-view-value">{expiryDate ? toDateValue(expiryDate) : "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Score / Grade</Text>
                      <Text className="growth-view-value">{score || "—"}</Text>
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
                            alt="Certificate proof"
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
