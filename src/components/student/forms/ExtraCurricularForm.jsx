/**
 * Component: ExtraCurricularForm
 * 
 * Fields (Repeatable):
 * - activityName (Text, Required)
 * - activityType (Text, Required)
 * - role (Text)
 * - organization (Text)
 * - startDate (Date)
 * - endDate (Date)
 * - achievements (Text)
 * - skills (Text)
 * - description (Textarea)
 * - proofDocument (Link)
 */

import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, useColorModeValue, useToast, Image, Link } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { useState, useEffect, useRef } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"
import { getFileUrl } from "../../../utils/fileUrl"

/** Normalize date for type="date" input: YYYY-MM-DD or ISO string only. */
function normalizeDateValue(val) {
  if (val == null || val === "") return ""
  const s = String(val).trim().split("T")[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ""
}

export const ExtraCurricularForm = ({ data = {}, onUpdate, isEditing = false, onFileSelect, fieldErrors = null }) => {
  const items = Array.isArray(data) ? data : (data.extraCurricular || [])
  const bg = useColorModeValue("white", "gray.700")
  const errorsByIndex = fieldErrors && typeof fieldErrors === "object" ? fieldErrors : {}
  const getErrorsForIndex = (index) => {
    const row = errorsByIndex[index] ?? errorsByIndex[String(index)]
    return row && typeof row === "object" ? row : {}
  }
  const { user } = useAuth()

  const handleChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onUpdate(newItems)
  }

  const handleAdd = () => {
    onUpdate([
      ...items,
      {
        activityName: "",
        role: "",
        organization: "",
        activityType: "",
        startDate: "",
        endDate: "",
        skills: "",
        achievements: "",
        description: "",
        proofDocument: "",
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
      <Heading size="lg" mb={6} color="#20343c">Extra-Curricular Activities</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <ExtraCurricularItem 
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
            Add Activity
          </Button>
        )}

        {items.length === 0 && (
            <Box p={8} textAlign="center" color="gray.700" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No extra-curricular activities added yet.
            </Box>
        )}
      </VStack>
    </Box>
  )
}

const ExtraCurricularItem = ({ index, item, onChange, onDelete, isEditing, onFileSelect, fieldErrors = {} }) => {
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
    // Clear the _isNewEntry flag after component mounts
    if (isNewEntry && item._isNewEntry === true) {
      onChange(index, "_isNewEntry", false)
    }
  }, [hasProof, isNewEntry])
  useEffect(() => {
    if (hasErrors && !isOpen) setIsOpen(true)
  }, [hasErrors])

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
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
            <HStack onClick={() => setIsOpen(!isOpen)} cursor="pointer" flex={1}>
                <Text fontWeight="bold" color="gray.800">
                    {item.activityName || "New Activity"}
                </Text>
                {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </HStack>
            {isEditing && (
                <IconButton 
                    icon={<FaTrash />} 
                    size="sm" 
                    colorScheme="red" 
                    variant="ghost" 
                    onClick={() => onDelete(index)}
                    aria-label="Delete activity"
                />
            )}
        </Flex>

        <Collapse in={isOpen} animateOpacity>
            <VStack spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <Field label="Activity Name" required errorText={getError("activity_name") || getError("activityName")}>
                        <Input 
                            value={item.activityName ?? item.activity_name ?? ""} 
                            onChange={(e) => onChange(index, "activityName", e.target.value)}
                            placeholder="e.g. Hackathon, Debate Club"
                            isDisabled={!isEditing}
                            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                    <Field label="Activity Type" required errorText={getError("activity_type") || getError("activityType")}>
                        <Input 
                            value={item.activityType ?? item.activity_type ?? ""} 
                            onChange={(e) => onChange(index, "activityType", e.target.value)}
                            placeholder="e.g. Competition, Club, Volunteering"
                            isDisabled={!isEditing}
                            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <Field label="Role" errorText={getError("role")}>
                        <Input 
                            value={item.role || ""} 
                            onChange={(e) => onChange(index, "role", e.target.value)}
                            placeholder="e.g. Participant, Organizer, Lead"
                            isDisabled={!isEditing}
                            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                    <Field label="Organization" errorText={getError("organization")}>
                        <Input 
                            value={item.organization || ""} 
                            onChange={(e) => onChange(index, "organization", e.target.value)}
                            placeholder="e.g. College Name, IEEE"
                            isDisabled={!isEditing}
                            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                            _placeholder={{ opacity: 0.7, color: "inherit" }}
                        />
                    </Field>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <Field label="Start Date" errorText={getError("start_date") || getError("startDate")}>
                        <Input 
                            type="date"
                            min="1900-01-01"
                            max="2100-12-31"
                            value={normalizeDateValue(item.startDate ?? item.start_date)} 
                            onChange={(e) => onChange(index, "startDate", e.target.value || "")}
                            isDisabled={!isEditing}
                            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        />
                    </Field>
                    <Field label="End Date" errorText={getError("end_date") || getError("endDate")}>
                        <Input 
                            type="date"
                            min="1900-01-01"
                            max="2100-12-31"
                            value={normalizeDateValue(item.endDate ?? item.end_date)} 
                            onChange={(e) => onChange(index, "endDate", e.target.value || "")}
                            isDisabled={!isEditing}
                            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        />
                    </Field>
                </SimpleGrid>

                <Field label="Achievements" errorText={getError("achievements")}>
                    <Textarea 
                        value={item.achievements || ""} 
                        onChange={(e) => onChange(index, "achievements", e.target.value)}
                        placeholder="List your key achievements..."
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>

                <Field label="Skills Developed" errorText={getError("skills")}>
                    <Input 
                        value={item.skills || ""} 
                        onChange={(e) => onChange(index, "skills", e.target.value)}
                        placeholder="e.g. Leadership, Public Speaking, Coding"
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>

                <Field label="Description" errorText={getError("description")}>
                    <Textarea 
                        value={item.description || ""} 
                        onChange={(e) => onChange(index, "description", e.target.value)}
                        placeholder="Brief description of the activity..."
                        isDisabled={!isEditing}
                        _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
                        _placeholder={{ opacity: 0.7, color: "inherit" }}
                    />
                </Field>

                <Field label="Proof Document (PDF/Image)" errorText={getError("proof_document") || getError("proofDocument")}>
                    {isEditing && (
                      <Box>
                        <Text mb={2} fontWeight="medium" color="gray.700">Upload proof (saved when you click Save changes)</Text>
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
                    {(item.proof_document || item.proofDocument) && (
                      <Box mt={2}>
                        {(item.proof_document || item.proofDocument).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={2} bg="gray.50">
                            <Image
                              src={getFileUrl(item.proof_document || item.proofDocument)}
                              alt="Proof"
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
                              View full image
                            </Link>
                          </Box>
                        ) : (
                          <Link
                            href={getFileUrl(item.proof_document || item.proofDocument)}
                            isExternal
                            color="blue.500"
                            fontSize="sm"
                          >
                            View proof document
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
