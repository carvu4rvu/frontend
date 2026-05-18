import {
  Box,
  VStack,
  Button,
  HStack,
  Input,
  SimpleGrid,
  IconButton,
  Text,
  Textarea,
  useToast,
  Select,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Flex,
} from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { useState, useEffect, useRef } from "react"
import { FaPlus, FaTrash, FaEdit, FaExternalLinkAlt, FaPlusCircle } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"
import { StudentProfileService } from "../../../services/studentProfile.service"
import { ProjectService } from "../../../services/project.service"
import { getFileUrl } from "../../../utils/fileUrl"
import { validateUrl } from "../../../utils/profileValidators"

const MAX_PROJECT_IMAGES = 4
const MAX_GALLERY_IMAGES = 3 // gallery only; cover is separate (1 cover + 3 gallery = 4 total)

/** Priority: must be sequential (1 to total number of projects) */
function parsePriority(value) {
  if (value === undefined || value === null) return null
  const s = String(value).trim()
  if (s === "") return null
  const n = parseInt(s, 10)
  if (Number.isNaN(n) || s !== String(n) || n < 1) return undefined
  return n
}

/** Get next available priority (1, 2, 3... based on current projects) */
function getNextPriority(items) {
  return (Array.isArray(items) ? items.length : 0) + 1
}

/** Get max allowed priority (equals total number of projects) */
function getMaxPriority(items) {
  return Array.isArray(items) ? items.length : 0
}

/** Normalize visibility to PRIVATE or PUBLIC for API */
function normalizeVisibility(value) {
  const v = (value ?? "PRIVATE").toString().toUpperCase().trim()
  return v === "PUBLIC" ? "PUBLIC" : "PRIVATE"
}

/** Validate URL for GitHub and hosted links */
function validateProjectUrl(value) {
  if (!value || typeof value !== 'string') return { valid: true }
  const trimmed = value.trim()
  if (!trimmed) return { valid: true }
  const urlValidation = validateUrl(trimmed)
  return urlValidation
}

function validateProject(item, items, editingIndex) {
  const errors = {}
  if (!String(item?.title || "").trim()) {
    errors.title = "Project title is required"
  }
  if (!String(item?.one_line_description || "").trim()) {
    errors.one_line_description = "One line description is required"
  }
  const rawPriority = item?.priority
  const parsed = parsePriority(rawPriority)
  if (rawPriority !== undefined && rawPriority !== null && String(rawPriority).trim() !== "") {
    if (parsed === undefined) {
      errors.priority = "Priority must be a positive integer."
    } else {
      const maxAllowed = getMaxPriority(items)
      if (parsed > maxAllowed || parsed < 1) {
        errors.priority = `Priority must be between 1 and ${maxAllowed}.`
      } else {
        const duplicateIndex = (Array.isArray(items) ? items : [])
          .findIndex((p, i) => i !== editingIndex && parsePriority(p?.priority) === parsed)
        if (duplicateIndex !== -1) {
          errors.priority = "Priority must be unique for your projects."
        }
      }
    }
  }
  return errors
}

/** Auto-reorder priorities when one changes. Fills gaps sequentially. */
function reorderPriorities(items, changedIndex) {
  if (!Array.isArray(items) || items.length === 0) return items
  const withPriorities = items.map((item, i) => {
    const p = parsePriority(item?.priority)
    return { ...item, priority: p, index: i }
  })
  // Get all valid priorities
  const validPriorities = withPriorities
    .filter(p => p.priority !== null && p.priority !== undefined)
    .sort((a, b) => a.priority - b.priority)
  // Reassign 1, 2, 3... to projects with priorities
  let newPriority = 1
  validPriorities.forEach(p => {
    withPriorities[p.index].priority = newPriority
    newPriority++
  })
  // Return items in original structure
  return withPriorities.map(p => {
    const { index, priority, ...rest } = p
    return { ...rest, priority: priority === null || priority === undefined ? "" : priority }
  })
}

export const ProjectsForm = ({ data = {}, onUpdate, isEditing = false, onFileSelect, apiFieldErrors = null, onPriorityValidationChange = null }) => {
  const items = Array.isArray(data) ? data : (data.projects || [])
  const toast = useToast()
  const { user } = useAuth()
  const usn = user?.usn

  const [editingIndex, setEditingIndex] = useState(null)
  const [modalErrors, setModalErrors] = useState({})
  const [uploadingCount, setUploadingCount] = useState(0) // number of uploads in progress
  const openedForErrorsRef = useRef(null) // track which API error set we already auto-opened for
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure()
  const errorsForEditingIndex = editingIndex != null && apiFieldErrors && apiFieldErrors[editingIndex] ? apiFieldErrors[editingIndex] : {}
  const mergedFieldErrors = { ...modalErrors, ...errorsForEditingIndex }

  const hasPriorityError = (() => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const raw = item?.priority
      if (raw === undefined || raw === null || String(raw).trim() === "") continue
      const parsed = parsePriority(raw)
      if (parsed === undefined) return true
      const duplicate = items.some((p, j) => j !== i && parsePriority(p?.priority) === parsed)
      if (duplicate) return true
    }
    return false
  })()

  useEffect(() => {
    if (typeof onPriorityValidationChange === "function") onPriorityValidationChange(hasPriorityError)
  }, [hasPriorityError, onPriorityValidationChange])

  const openEditModal = (index) => {
    setEditingIndex(index)
    setModalErrors({})
    onModalOpen()
  }

  const closeEditModal = () => {
    setEditingIndex(null)
    setModalErrors({})
    onModalClose()
  }

  useEffect(() => {
    if (!isModalOpen) setEditingIndex(null)
  }, [isModalOpen])

  // When API validation errors appear (e.g. after failed save), auto-open edit modal for the first project with errors so user sees field-level errors
  useEffect(() => {
    if (!apiFieldErrors || typeof apiFieldErrors !== "object" || !isEditing) return
    const indicesWithErrors = Object.keys(apiFieldErrors).map(Number).filter((n) => !Number.isNaN(n))
    if (indicesWithErrors.length === 0) {
      openedForErrorsRef.current = null
      return
    }
    const errorKey = indicesWithErrors.sort((a, b) => a - b).join(",")
    if (openedForErrorsRef.current === errorKey) return
    openedForErrorsRef.current = errorKey
    const firstErrorIndex = Math.min(...indicesWithErrors)
    setEditingIndex(firstErrorIndex)
    onModalOpen()
  }, [apiFieldErrors, isEditing])

  const handleChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    // If priority changed, auto-reorder to keep sequential
    if (field === "priority") {
      const reordered = reorderPriorities(newItems, index)
      onUpdate(reordered)
    } else {
      onUpdate(newItems)
    }
  }

  const handleAdd = () => {
    const newItem = {
      title: "",
      one_line_description: "",
      full_description: "",
      genre: "",
      visibility: "PRIVATE",
      priority: getNextPriority(items),
      hosted_link: "",
      github_repo: "",
      mentor_name: "",
      technologies: [],
      project_snaps: [],
    }
    onUpdate([...items, newItem])
    setEditingIndex(items.length)
    setModalErrors({})
    onModalOpen()
  }

  const handleDelete = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate(newItems)
    if (editingIndex === index) closeEditModal()
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1)
  }

  const handleSaveProject = () => {
    if (editingIndex == null || editingIndex < 0 || editingIndex >= items.length) return
    const item = items[editingIndex]
    const errors = validateProject(item, items, editingIndex)
    if (Object.keys(errors).length > 0) {
      setModalErrors(errors)
      return
    }
    setModalErrors({})
    closeEditModal()
  }

  /** Upload one file as cover image (replaces first slot). */
  const handleUploadCover = async (index, file) => {
    if (!usn || !file || !(file instanceof File)) return
    if (file.size === 0) {
      toast({ status: "warning", description: "Please select a non-empty image.", isClosable: true })
      return
    }
    setUploadingCount((c) => c + 1)
    try {
      const result = await StudentProfileService.uploadFile(usn, file, { folder: "projects" })
      const url = result?.url || result?.path
      if (url) {
        const newItems = [...items]
        const snaps = newItems[index].project_snaps || []
        const rest = snaps.slice(1)
        newItems[index] = {
          ...newItems[index],
          project_snaps: [url, ...rest],
        }
        onUpdate(newItems)
        toast({ status: "success", description: "Cover image uploaded", duration: 3000, isClosable: true })
      }
    } catch (e) {
      toast({
        status: "error",
        title: "Cover upload failed",
        description: e?.message || "File upload failed",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1))
    }
  }

  /** Upload one or more files as gallery images (appended after cover; max 3 gallery). */
  const handleUploadGallery = async (index, fileOrFiles) => {
    if (!usn) return
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : fileOrFiles ? [fileOrFiles] : []
    if (files.length === 0) return

    const currentSnaps = items[index]?.project_snaps || []
    const galleryCount = Math.max(0, currentSnaps.length - 1)
    const remaining = Math.max(0, MAX_GALLERY_IMAGES - galleryCount)
    if (remaining === 0) {
      toast({
        status: "warning",
        description: `Maximum ${MAX_GALLERY_IMAGES} gallery images.`,
        duration: 4000,
        isClosable: true,
      })
      return
    }

    const toUpload = files.slice(0, remaining)
    let successCount = 0
    setUploadingCount((c) => c + toUpload.length)

    for (const file of toUpload) {
      if (!file || !(file instanceof File)) {
        setUploadingCount((c) => Math.max(0, c - 1))
        continue
      }
      if (file.size === 0) {
        toast({ status: "warning", description: "Skipped empty file", isClosable: true })
        setUploadingCount((c) => Math.max(0, c - 1))
        continue
      }
      try {
        const result = await StudentProfileService.uploadFile(usn, file, { folder: "projects" })
        const url = result?.url || result?.path
        if (url) {
          const newItems = [...items]
          const snaps = newItems[index].project_snaps || []
          newItems[index] = {
            ...newItems[index],
            project_snaps: [...snaps, url],
          }
          onUpdate(newItems)
          successCount += 1
        }
      } catch (e) {
        toast({
          status: "error",
          title: "Upload failed",
          description: e?.message || "File upload failed",
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1))
      }
    }

    if (successCount > 0) {
      toast({
        status: "success",
        description: successCount === 1 ? "Gallery image uploaded" : `${successCount} gallery images uploaded`,
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const currentItem = editingIndex != null && items[editingIndex] ? items[editingIndex] : null

  const handleShareFromManage = async (item) => {
    if (!item?.id) {
      toast({
        status: "warning",
        title: "Cannot share",
        description: "Please save the project first so it has an ID.",
        isClosable: true,
      })
      return
    }
    try {
      const data = await ProjectService.createShareLink(item.id)
      const path = data?.url || `/projects/share/${data?.share_token}`
      const fullUrl = `${window.location.origin}${path}`
      try {
        await navigator.clipboard.writeText(fullUrl)
        toast({
          status: "success",
          title: "Share link copied",
          description: fullUrl,
          isClosable: true,
          duration: 9000,
        })
      } catch {
        toast({
          status: "success",
          title: "Share link created",
          description: fullUrl,
          isClosable: true,
          duration: 9000,
        })
      }
    } catch (e) {
      console.error('[ProjectsForm.onShare] Error:', e?.message, e?.response, e);
      toast({
        status: "error",
        title: "Error creating share link",
        description: e.message,
        isClosable: true,
      })
    }
  }
  return (
    <Box className="projects-inventory-wrap">
      <Flex className="projects-inventory-header" justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <Text as="h2" className="projects-inventory-title">
          Project Inventory
        </Text>
        {isEditing && (
          <Button
            className="projects-add-new-btn"
            leftIcon={<FaPlus />}
            onClick={handleAdd}
            size="md"
          >
            Add New Project
          </Button>
        )}
      </Flex>

      <VStack spacing={3} align="stretch" mt={4}>
        {items
          .map((item, index) => ({ item, index }))
          .sort((a, b) => {
            const priorityA = parsePriority(a.item?.priority)
            const priorityB = parsePriority(b.item?.priority)
            if (priorityA === null || priorityA === undefined) return 1
            if (priorityB === null || priorityB === undefined) return -1
            return priorityA - priorityB
          })
          .map(({ item, index }) => (
            <ProjectInventoryCard
              key={index}
              index={index}
              item={item}
              isEditing={isEditing}
              onEdit={() => openEditModal(index)}
              onDelete={() => handleDelete(index)}
              onShare={handleShareFromManage}
            />
          ))}
      </VStack>

      <Modal isOpen={isModalOpen} onClose={closeEditModal} size="xl" scrollBehavior="inside" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent className="projects-edit-modal" maxW="720px">
          <ModalHeader className="projects-edit-modal-header">Edit Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody className="projects-edit-modal-body" pb={6}>
            {currentItem && (
              <EditProjectForm
                index={editingIndex}
                item={currentItem}
                maxPriority={getMaxPriority(items)}
                onChange={handleChange}
                onUploadCover={handleUploadCover}
                onUploadGallery={handleUploadGallery}
                uploadingCount={uploadingCount}
                onModalErrors={setModalErrors}
                isEditing={true}
                fieldErrors={mergedFieldErrors}
              />
            )}
          </ModalBody>
          <ModalFooter className="projects-edit-modal-footer">
            <Button variant="ghost" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button
              className="projects-save-project-btn"
              onClick={handleSaveProject}
              ml={3}
            >
              Save Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

function ProjectInventoryCard({ index, item, isEditing, onEdit, onDelete, onShare }) {
  const snaps = item.project_snaps || []
  const coverImg = snaps.length > 0 ? snaps[0] : null
  const visibility = (item.visibility || "PRIVATE").toUpperCase()
  const isPublic = visibility === "PUBLIC"
  const visibilityLabel = visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE"
  const priorityVal = item.priority
  const priorityDisplay = priorityVal !== undefined && priorityVal !== null && String(priorityVal).trim() !== ""
    ? String(priorityVal).trim()
    : "—"

  return (
    <div className="projects-inventory-card">
      <div className="projects-inventory-card-thumb">
        {coverImg ? (
          <img src={getFileUrl(coverImg)} alt="" />
        ) : (
          <div className="projects-inventory-card-thumb-placeholder" />
        )}
      </div>
      <div className="projects-inventory-card-info">
        <Text className="projects-inventory-card-title" noOfLines={1}>
          {item.title || `Project ${index + 1}`}
        </Text>
        <Text className="projects-inventory-card-category" noOfLines={1}>
          {item.genre || "—"}
        </Text>
        <span className={`projects-inventory-card-status ${isPublic ? "is-public" : ""}`}>
          {visibilityLabel}
        </span>
      </div>
      <div className="projects-inventory-card-priority">
        <Text className="projects-inventory-card-priority-label">PRIORITY</Text>
        <Text className="projects-inventory-card-priority-value">#{priorityDisplay}</Text>
      </div>
      {isEditing && (
        <HStack className="projects-inventory-card-actions" spacing={2} align="center" gap={2}>
          <IconButton
            aria-label="Edit project"
            icon={<FaEdit />}
            size="sm"
            variant="ghost"
            className="projects-inventory-card-action-edit"
            onClick={onEdit}
          />
          <IconButton
            aria-label="Delete project"
            icon={<FaTrash />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={onDelete}
          />
          {typeof onShare === "function" && item.id && (
            <IconButton
              aria-label="Share project"
              icon={<FaExternalLinkAlt />}
              size="sm"
              variant="ghost"
              onClick={() => onShare(item)}
            />
          )}
        </HStack>
      )}
    </div>
  )
}

function TechnologiesTagInput({ index, technologies = [], onChange, fieldErrors }) {
  const [inputValue, setInputValue] = useState("")

  const addTag = (val) => {
    const trimmed = String(val || "").trim()
    if (!trimmed) return
    const normalized = trimmed
    if (technologies.includes(normalized)) return
    onChange([...technologies, normalized])
    setInputValue("")
  }

  const removeTag = (idx) => {
    onChange(technologies.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && technologies.length > 0) {
      removeTag(technologies.length - 1)
    }
  }

  return (
    <Field label="TECHNOLOGIES" errorText={fieldErrors} helperText="Type and press Enter or click Add to add a tag">
      <Box
        className="projects-edit-tag-input-wrap"
        borderWidth="1px"
        borderColor={fieldErrors ? "red.400" : "gray.200"}
        borderRadius="lg"
        bg="gray.50"
        p={2}
        minH="48px"
        _focusWithin={{
          borderColor: "var(--palette-bright-green)",
          boxShadow: "0 0 0 1px rgba(3, 192, 60, 0.25)",
        }}
      >
        <Wrap spacing={2} align="center" mb={technologies.length > 0 ? 2 : 0}>
          {technologies.map((tech, i) => (
            <Tag
              key={`${tech}-${i}`}
              size="md"
              borderRadius="full"
              variant="solid"
              colorScheme="green"
              className="projects-edit-tag"
            >
              <TagLabel>{tech}</TagLabel>
              <TagCloseButton onClick={() => removeTag(i)} aria-label={`Remove ${tech}`} />
            </Tag>
          ))}
        </Wrap>
        <HStack spacing={2}>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. React, Node.js"
            variant="unstyled"
            size="sm"
            flex={1}
            className="projects-edit-tag-input"
          />
          <Button
            size="sm"
            leftIcon={<FaPlusCircle />}
            onClick={() => addTag(inputValue)}
            colorScheme="green"
            variant="outline"
            className="projects-edit-tag-add-btn"
          >
            Add
          </Button>
        </HStack>
      </Box>
    </Field>
  )
}

function EditProjectForm({ index, item, maxPriority = 0, onChange, onUploadCover, onUploadGallery, uploadingCount = 0, onModalErrors, isEditing, fieldErrors = {} }) {
  const setModalErrors = onModalErrors || (() => {})
  const snaps = item.project_snaps || []
  const coverUrl = snaps[0] || null
  const galleryUrls = snaps.slice(1)
  const isUploading = uploadingCount > 0
  return (
    <VStack spacing={4} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Field label="PROJECT TITLE" required errorText={fieldErrors.title}>
          <Input
            value={item.title || ""}
            onChange={(e) => onChange(index, "title", e.target.value)}
            placeholder="e.g. Spider Web Crawler"
            className="projects-edit-input"
          />
        </Field>
        <Field label="GENRE" errorText={fieldErrors.genre}>
          <Select
            value={item.genre || ""}
            onChange={(e) => onChange(index, "genre", e.target.value)}
            placeholder="Select genre"
            className="projects-edit-select"
          >
            {item.genre && !["Web Development", "Mobile App", "ML/AI", "DevOps", "Other"].includes(item.genre) && (
              <option value={item.genre}>{item.genre}</option>
            )}
            <option value="Web Development">Web Development</option>
            <option value="Mobile App">Mobile App</option>
            <option value="ML/AI">ML/AI</option>
            <option value="DevOps">DevOps</option>
            <option value="Other">Other</option>
          </Select>
        </Field>
      </SimpleGrid>

      <Field label="ONE LINE DESCRIPTION" required errorText={fieldErrors.one_line_description}>
        <Input
          value={item.one_line_description || ""}
          onChange={(e) => onChange(index, "one_line_description", e.target.value)}
          placeholder="Brief summary of the project"
          className="projects-edit-input"
        />
      </Field>

      <Field label="FULL DESCRIPTION" errorText={fieldErrors.full_description}>
        <Textarea
          value={item.full_description || ""}
          onChange={(e) => onChange(index, "full_description", e.target.value)}
          placeholder="Detailed description..."
          rows={4}
          className="projects-edit-textarea"
        />
      </Field>

      <TechnologiesTagInput
        index={index}
        technologies={Array.isArray(item.technologies) ? item.technologies : (typeof item.technologies === "string" && item.technologies ? item.technologies.split(",").map((t) => t.trim()).filter(Boolean) : [])}
        onChange={(val) => onChange(index, "technologies", val)}
        fieldErrors={fieldErrors.technologies}
      />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Field label="MENTOR NAME" errorText={fieldErrors.mentor_name}>
          <Input
            value={item.mentor_name || ""}
            onChange={(e) => onChange(index, "mentor_name", e.target.value)}
            placeholder="e.g. Dr. Aris Thorne"
            className="projects-edit-input"
          />
        </Field>
        <Field label="PRIORITY" errorText={fieldErrors.priority} helperText={`1-${maxPriority} (auto-ordered)`}>
          <Input
            type="text"
            inputMode="numeric"
            value={item.priority === undefined || item.priority === null ? "" : String(item.priority)}
            onChange={(e) => {
              const v = e.target.value
              if (v === "") {
                onChange(index, "priority", "")
                return
              }
              if (/^\d+$/.test(v)) {
                const n = parseInt(v, 10)
                const maxAllowed = maxPriority
                if (n >= 1 && n <= maxAllowed) {
                  onChange(index, "priority", n)
                }
              }
            }}
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (v === "") return
              const n = parseInt(v, 10)
              if (!Number.isNaN(n)) {
                const maxAllowed = maxPriority
                if (n >= 1 && n <= maxAllowed) {
                  onChange(index, "priority", n)
                } else if (n > maxAllowed) {
                  onChange(index, "priority", maxAllowed)
                } else if (n < 1) {
                  onChange(index, "priority", 1)
                }
              }
            }}
            placeholder={`e.g. 1 to ${maxPriority}`}
            className="projects-edit-input"
          />
        </Field>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Field label="VISIBILITY" errorText={fieldErrors.visibility}>
          <Select
            value={normalizeVisibility(item.visibility)}
            onChange={(e) => onChange(index, "visibility", normalizeVisibility(e.target.value))}
            className="projects-edit-select"
          >
            <option value="PRIVATE">PRIVATE</option>
            <option value="PUBLIC">PUBLIC</option>
          </Select>
        </Field>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Field label="GITHUB REPO" errorText={fieldErrors.github_repo || (item.github_repo ? validateProjectUrl(item.github_repo).message : null)}>
          <Input
            value={item.github_repo || ""}
            onChange={(e) => {
              const val = e.target.value
              onChange(index, "github_repo", val)
            }}
            onBlur={(e) => {
              const val = e.target.value.trim()
              if (val && !validateProjectUrl(val).valid) {
                setModalErrors((prev) => ({
                  ...prev,
                  github_repo: validateProjectUrl(val).message
                }))
              } else {
                setModalErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.github_repo
                  return newErrors
                })
              }
            }}
            placeholder="https://github.com/..."
            className="projects-edit-input"
          />
        </Field>
        <Field label="HOSTED LINK" errorText={fieldErrors.hosted_link || (item.hosted_link ? validateProjectUrl(item.hosted_link).message : null)}>
          <Input
            value={item.hosted_link || ""}
            onChange={(e) => {
              const val = e.target.value
              onChange(index, "hosted_link", val)
            }}
            onBlur={(e) => {
              const val = e.target.value.trim()
              if (val && !validateProjectUrl(val).valid) {
                setModalErrors((prev) => ({
                  ...prev,
                  hosted_link: validateProjectUrl(val).message
                }))
              } else {
                setModalErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.hosted_link
                  return newErrors
                })
              }
            }}
            placeholder="https://demo.com"
            className="projects-edit-input"
          />
        </Field>
      </SimpleGrid>

      {isEditing && (
        <Box>
          <Text mb={3} fontWeight="600" fontSize="sm" color="#334155">
            Project Images
          </Text>

          {/* Cover image: 1 separate upload */}
          <Text fontSize="xs" fontWeight="500" color="#64748b" mb={1}>Cover image (main image)</Text>
          <HStack spacing={3} align="flex-start" mb={4}>
            {coverUrl ? (
              <Box position="relative">
                <Box boxSize="100px" borderRadius="md" overflow="hidden" borderWidth="1px" borderColor="gray.200">
                  <img src={getFileUrl(coverUrl)} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Box>
                <IconButton
                  icon={<FaTrash />}
                  size="xs"
                  colorScheme="red"
                  position="absolute"
                  top={0}
                  right={0}
                  aria-label="Remove cover"
                  onClick={() => {
                    const newSnaps = (item.project_snaps || []).filter((_, idx) => idx !== 0)
                    onChange(index, "project_snaps", newSnaps)
                  }}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>Cover</Text>
              </Box>
            ) : null}
            <Box flex="1" minW="0">
              <StyledFileInput
                accept="image/*"
                disabled={isUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onUploadCover(index, f)
                  e.target.value = ""
                }}
                acceptLabel={coverUrl ? "Replace cover" : "Cover image"}
              />
              <Text fontSize="xs" color="#64748b" mt={1}>{coverUrl ? "Upload a new image to replace cover." : "1 image. Upload separately."}</Text>
            </Box>
          </HStack>

          {/* Gallery images: up to 3, multiple uploads allowed */}
          <Text fontSize="xs" fontWeight="500" color="#64748b" mb={1}>Gallery images (optional, up to {MAX_GALLERY_IMAGES})</Text>
          <HStack spacing={2} align="flex-start" flexWrap="wrap" mb={2}>
            {galleryUrls.map((url, i) => (
              <Box key={i} position="relative">
                <Box boxSize="80px" borderRadius="md" overflow="hidden" borderWidth="1px" borderColor="gray.200">
                  <img src={getFileUrl(url)} alt={`Gallery ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Box>
                <IconButton
                  icon={<FaTrash />}
                  size="xs"
                  colorScheme="red"
                  position="absolute"
                  top={0}
                  right={0}
                  aria-label={`Remove gallery image ${i + 1}`}
                  onClick={() => {
                    const snaps = item.project_snaps || []
                    const newSnaps = snaps.filter((_, idx) => idx !== i + 1)
                    onChange(index, "project_snaps", newSnaps)
                  }}
                />
              </Box>
            ))}
            {galleryUrls.length < MAX_GALLERY_IMAGES && (
              <StyledFileInput
                accept="image/*"
                multiple
                disabled={isUploading}
                onChange={(e) => {
                  const fileList = e.target.files
                  if (fileList?.length) onUploadGallery(index, Array.from(fileList))
                  e.target.value = ""
                }}
                acceptLabel="Gallery"
              />
            )}
          </HStack>
          <Text fontSize="xs" color="#64748b">
            {galleryUrls.length}/{MAX_GALLERY_IMAGES} gallery images. You can select multiple at once.
            {isUploading && " Uploading…"}
          </Text>
        </Box>
      )}

      {!isEditing && item.project_snaps && item.project_snaps.length > 0 && (
        <HStack spacing={2} overflowX="auto" py={2} flexWrap="wrap">
          {item.project_snaps.map((snap, i) => (
            <Box key={i} boxSize="80px" borderRadius="md" overflow="hidden" position="relative">
              <img
                src={getFileUrl(snap)}
                alt={i === 0 ? "Cover" : `Gallery ${i}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          ))}
        </HStack>
      )}
    </VStack>
  )
}
