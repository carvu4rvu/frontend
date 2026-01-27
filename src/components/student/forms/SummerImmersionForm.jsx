import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, useToast } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { useState } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"
import { StudentProfileService } from "../../../services/studentProfile.service"

export const SummerImmersionForm = ({ data = {}, onUpdate, isEditing = false }) => {
  const immersionItems = Array.isArray(data.immersion) ? data.immersion : []
  const toast = useToast()
  const { user } = useAuth()
  const usn = user?.usn

  const updateImmersion = (items) => {
    onUpdate({ ...data, immersion: items })
  }

  const handleImmersionChange = (index, field, value) => {
    const newItems = [...immersionItems]
    newItems[index] = { ...newItems[index], [field]: value }
    updateImmersion(newItems)
  }

  const handleAddImmersion = () => {
    updateImmersion([
      ...immersionItems,
      {
        jobRole: "",
        organization: "",
        organizationDetails: "",
        durationWeeks: "",
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

  const handleDeleteImmersion = (index) => {
    const newItems = immersionItems.filter((_, i) => i !== index)
    updateImmersion(newItems)
  }

  const handleUpload = async (index, file) => {
    if (!file || !usn) return
    try {
      const result = await StudentProfileService.uploadFile(usn, file, { folder: "summer-immersion" })
      const url = result?.url || result?.path
      if (url) {
        const newItems = [...immersionItems]
        newItems[index] = { ...newItems[index], proofDocument: url }
        updateImmersion(newItems)
        toast({
          status: "success",
          description: "File uploaded",
          duration: 3000,
          isClosable: true
        })
      }
    } catch (e) {
      console.error("Error uploading summer immersion file:", e)
      toast({
        status: "error",
        description: "File upload failed",
        duration: 4000,
        isClosable: true
      })
    }
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
          <Box p={8} textAlign="center" color="gray.500" border="1px dashed" borderColor="gray.300" borderRadius="xl">
            No summer immersion added yet.
          </Box>
        )}
      </VStack>
    </Box>
  )
}

const SummerExperienceItem = ({ index, item, onChange, onDelete, isEditing, kind }) => {
  const [isOpen, setIsOpen] = useState(true)

  const titleFallback = kind === "Immersion" ? `Summer Immersion ${index + 1}` : `Summer Internship ${index + 1}`
  const durationLabel = kind === "Immersion" ? "Duration (Weeks)" : "Duration (Months)"
  const durationField = kind === "Immersion" ? "durationWeeks" : "durationMonths"

  return (
    <Card variant="outline" borderColor="gray.200">
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
          <HStack onClick={() => setIsOpen(!isOpen)} cursor="pointer" flex={1}>
            <Text fontWeight="bold" color="gray.700">
              {item.organization ? `${item.organization} - ${item.jobRole}` : titleFallback}
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
                  value={item.organization || ""}
                  onChange={(e) => onChange(index, "organization", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  placeholder="e.g. Tech Innovations Inc."
                />
              </Field>
              <Field label="Job Role (Required)" required>
                <Input
                  value={item.jobRole || ""}
                  onChange={(e) => onChange(index, "jobRole", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  placeholder="e.g. Data Science Intern"
                />
              </Field>
              <Field label="Location">
                <Input
                  value={item.location || ""}
                  onChange={(e) => onChange(index, "location", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  placeholder="e.g. Bangalore"
                />
              </Field>
              <Field label="Stipend">
                <Input
                  type="number"
                  value={item.stipend || ""}
                  onChange={(e) => onChange(index, "stipend", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  placeholder="0"
                />
              </Field>
              <Field label="Start Date">
                <Input
                  type="date"
                  value={item.startDate ? item.startDate.split("T")[0] : ""}
                  onChange={(e) => onChange(index, "startDate", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                />
              </Field>
              <Field label="End Date">
                <Input
                  type="date"
                  value={item.endDate ? item.endDate.split("T")[0] : ""}
                  onChange={(e) => onChange(index, "endDate", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                />
              </Field>
              <Field label={durationLabel}>
                <Input
                  type="number"
                  value={item[durationField] || ""}
                  onChange={(e) => onChange(index, durationField, e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  placeholder={kind === "Immersion" ? "e.g. 12" : "e.g. 3"}
                />
              </Field>
              <Field label="Mentor Name">
                <Input
                  value={item.mentorName || ""}
                  onChange={(e) => onChange(index, "mentorName", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  placeholder="e.g. Dr. Priya Sharma"
                />
              </Field>
              <Field label="Skills (comma separated)">
                <Input
                  value={item.skills || ""}
                  onChange={(e) => onChange(index, "skills", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  placeholder="e.g. Python, Machine Learning"
                />
              </Field>
              <Field label="Proof Document">
                {isEditing && (
                  <Input
                    type="file"
                    p={1}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    onChange={async (e) => {
                      const file = e.target.files && e.target.files[0]
                      if (!file) return
                      await handleUpload(index, file)
                    }}
                    variant="outline"
                  />
                )}
                <Input
                  mt={2}
                  value={item.proofDocument || ""}
                  onChange={(e) => onChange(index, "proofDocument", e.target.value)}
                  variant="flushed"
                  isDisabled={!isEditing}
                  placeholder="https://..."
                />
              </Field>
            </SimpleGrid>
            <Field label="Organization Details">
              <Textarea
                value={item.organizationDetails || ""}
                onChange={(e) => onChange(index, "organizationDetails", e.target.value)}
                variant="flushed"
                rows={2}
                isDisabled={!isEditing}
                placeholder="Details about the organization..."
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={item.description || ""}
                onChange={(e) => onChange(index, "description", e.target.value)}
                variant="flushed"
                rows={3}
                isDisabled={!isEditing}
                placeholder="Describe your work and learnings..."
              />
            </Field>
          </VStack>
        </Collapse>
      </CardBody>
    </Card>
  )
}
