/**
 * Publications — styled like Internships / Training (GrowthSections timeline).
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { useState, useEffect, useRef } from "react"
import {
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaBookOpen,
  FaCalendarAlt,
  FaUsers,
  FaExternalLinkAlt,
  FaExclamationCircle,
  FaLink,
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

function toDateValue(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim().split("T")[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ""
}

export const PublicationsForm = ({ data = {}, onUpdate, isEditing = false, onFileSelect, fieldErrors = null }) => {
  const items = Array.isArray(data) ? data : (data.publications || [])
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
          <Icon as={FaBookOpen} className="growth-title-icon" />
          Publications
        </Heading>
        {isEditing && (
          <Button leftIcon={<FaPlus />} onClick={handleAdd} className="growth-add-btn" size="sm">
            Add Publication
          </Button>
        )}
      </Flex>

      <Box className="growth-timeline">
        {items.length === 0 ? (
          <Center py={12} flexDirection="column" gap={4} border="2px dashed" borderColor="gray.100" borderRadius="xl">
            <Icon as={FaBookOpen} boxSize={12} color="gray.200" />
            <Text color="gray.500" fontWeight="500">
              No publications added yet.
            </Text>
            {isEditing && (
              <Button leftIcon={<FaPlus />} variant="outline" colorScheme="orange" onClick={handleAdd}>
                Add your first publication
              </Button>
            )}
          </Center>
        ) : (
          items.map((item, index) => (
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
          ))
        )}
      </Box>
    </Box>
  )
}

const PublicationItem = ({ index, item, onChange, onDelete, isEditing, onFileSelect, fieldErrors = {} }) => {
  const hasErrors = !!(fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length > 0)
  const isNewEntry = item?._isNewEntry === true
  const [isOpen, setIsOpen] = useState(hasErrors || isNewEntry)
  const [pendingPreview, setPendingPreview] = useState(null)
  const lastProcessedFileRef = useRef(null)
  const hasProof = !!(item.evidence_document || item.evidenceDocument)

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
  const pubName = getField(item, "publication_name", "publicationName")
  const pubType = getField(item, "publication_type", "publicationType")
  const pubDate = getField(item, "publication_date", "publicationDate")
  const authorCount = item.author_count ?? item.authorCount
  const mentorName = getField(item, "mentor_name", "mentorName")
  const pubLink = getField(item, "link")
  const evidenceUrl = getField(item, "evidence_document", "evidenceDocument")

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
            <Badge className="growth-badge">{pubType || "Publication"}</Badge>
            <Heading className="growth-card-title" size="sm">
              {title || `Publication #${index + 1}`}
            </Heading>
            <Flex className="growth-meta-info">
              {pubName && (
                <Box className="growth-meta-item">
                  <Icon as={FaBookOpen} boxSize={3} />
                  <Text noOfLines={1}>{pubName}</Text>
                </Box>
              )}
              {pubDate && (
                <Box className="growth-meta-item">
                  <Icon as={FaCalendarAlt} boxSize={3} />
                  <Text>{toDateValue(pubDate)}</Text>
                </Box>
              )}
              {authorCount != null && authorCount !== "" && (
                <Box className="growth-meta-item">
                  <Icon as={FaUsers} boxSize={3} />
                  <Text>{authorCount} author{Number(authorCount) !== 1 ? "s" : ""}</Text>
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
                    <Field label="Paper/Article Title *" errorText={getError("title")}>
                      <Input
                        value={title}
                        onChange={(e) => onChange(index, "title", e.target.value)}
                        variant="flushed"
                        placeholder="Title of your paper or article"
                      />
                    </Field>
                    <Field label="Publication Name (Journal/Conf) *" errorText={getError("publication_name")}>
                      <Input
                        value={pubName}
                        onChange={(e) => onChange(index, "publication_name", e.target.value)}
                        variant="flushed"
                        placeholder="e.g. IEEE Transactions"
                      />
                    </Field>
                    <Field label="Type *" errorText={getError("publication_type")}>
                      <Input
                        value={pubType}
                        onChange={(e) => onChange(index, "publication_type", e.target.value)}
                        variant="flushed"
                        placeholder="e.g. Journal, Conference"
                      />
                    </Field>
                    <Field label="Publication Date" errorText={getError("publication_date")}>
                      <Input
                        type="date"
                        value={toDateValue(pubDate)}
                        onChange={(e) => onChange(index, "publication_date", toDateValue(e.target.value))}
                        variant="flushed"
                        min="1900-01-01"
                        max="2100-12-31"
                      />
                    </Field>
                    <Field label="Number of Authors" errorText={getError("author_count")}>
                      <NumberInput
                        value={authorCount ?? ""}
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
                      >
                        <NumberInputField variant="flushed" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </Field>
                    <Field label="Mentor Name" errorText={getError("mentor_name")}>
                      <Input
                        value={mentorName}
                        onChange={(e) => onChange(index, "mentor_name", e.target.value)}
                        variant="flushed"
                      />
                    </Field>
                    <Field label="Link (DOI/URL)" gridColumn={{ md: "span 2" }} errorText={getError("link")}>
                      <Input
                        value={pubLink}
                        onChange={(e) => onChange(index, "link", e.target.value)}
                        variant="flushed"
                        placeholder="https://doi.org/..."
                      />
                    </Field>
                    <Field label="Skills Used" gridColumn={{ md: "span 2" }} errorText={getError("skills")}>
                      <Input
                        value={getField(item, "skills")}
                        onChange={(e) => onChange(index, "skills", e.target.value)}
                        variant="flushed"
                        placeholder="e.g. Research, Data Analysis"
                      />
                    </Field>
                    <Field
                      label="Evidence Document"
                      gridColumn={{ md: "span 2" }}
                      errorText={getError("evidence_document") || getError("evidenceDocument")}
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
                        {evidenceUrl && !pendingPreview && (
                          <Box className="growth-view-document" mt={2}>
                            <HStack>
                              <Icon as={FaExternalLinkAlt} color="blue.500" />
                              <Text fontSize="sm" fontWeight="600" color="blue.700">
                                Current document
                              </Text>
                            </HStack>
                            <Link
                              href={getFileUrl(evidenceUrl)}
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
                  <Field label="Description" errorText={getError("description")}>
                    <Textarea
                      value={getField(item, "description")}
                      onChange={(e) => onChange(index, "description", e.target.value)}
                      variant="flushed"
                      rows={3}
                      placeholder="Brief summary of the publication"
                    />
                  </Field>
                </>
              ) : (
                <Box>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} className="growth-view-grid">
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Title</Text>
                      <Text className="growth-view-value">{title || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Publication Name</Text>
                      <Text className="growth-view-value">{pubName || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Type</Text>
                      <Text className="growth-view-value">{pubType || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Publication Date</Text>
                      <Text className="growth-view-value">{pubDate ? toDateValue(pubDate) : "—"}</Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Authors</Text>
                      <Text className="growth-view-value">
                        {authorCount != null && authorCount !== "" ? authorCount : "—"}
                      </Text>
                    </Box>
                    <Box className="growth-view-item">
                      <Text className="growth-view-label">Mentor</Text>
                      <Text className="growth-view-value">{mentorName || "—"}</Text>
                    </Box>
                    <Box className="growth-view-item" gridColumn={{ md: "span 3" }}>
                      <Text className="growth-view-label">Link</Text>
                      {pubLink ? (
                        <Link
                          href={pubLink.startsWith("http") ? pubLink : `https://${pubLink}`}
                          isExternal
                          className="growth-view-value"
                          color="blue.600"
                          fontWeight="500"
                          display="inline-flex"
                          alignItems="center"
                          gap={1}
                        >
                          <Icon as={FaLink} boxSize={3} />
                          {pubLink}
                        </Link>
                      ) : (
                        <Text className="growth-view-value">—</Text>
                      )}
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
                          Evidence Document
                        </Text>
                      </HStack>
                      {evidenceUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <Box mt={2}>
                          <Image
                            src={getFileUrl(evidenceUrl)}
                            alt="Publication evidence"
                            maxH="160px"
                            objectFit="contain"
                            borderRadius="md"
                            onError={(e) => {
                              e.target.style.display = "none"
                            }}
                          />
                          <Link
                            href={getFileUrl(evidenceUrl)}
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
                          href={getFileUrl(evidenceUrl)}
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
