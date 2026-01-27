/**
 * Component: TrainingWorkshopsForm
 * 
 * Fields (Repeatable):
 * - title (Text, Required)
 * - organization (Text, Required)
 * - trainingType (Select)
 * - startDate (Date)
 * - endDate (Date)
 * - skills (Text)
 * - description (Textarea)
 * - proofDocument (Text/Url)
 * 
 * Validation:
 * - title: Required
 * - organization: Required
 * 
 * API Contracts:
 * - GET /api/student/profile/trainings
 * - POST /api/student/profile/trainings
 */

import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, Select, useToast } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { useState } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"
import { StudentProfileService } from "../../../services/studentProfile.service"

export const TrainingWorkshopsForm = ({ data = {}, onUpdate, isEditing = false }) => {
  const items = Array.isArray(data) ? data : (data.trainings || [])
  const toast = useToast()
  const { user } = useAuth()
  const usn = user?.usn

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
        organization: "",
        trainingType: "",
        startDate: "",
        endDate: "",
        skills: "",
        description: "",
        proofDocument: ""
      }
    ])
  }

  const handleDelete = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate(newItems)
  }

  const handleUpload = async (index, file) => {
    if (!file || !usn) return
    try {
      const result = await StudentProfileService.uploadFile(usn, file, { folder: "trainings" })
      const url = result?.url || result?.path
      if (url) {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], proofDocument: url }
        onUpdate(newItems)
        toast({
          status: "success",
          description: "File uploaded",
          duration: 3000,
          isClosable: true
        })
      }
    } catch (e) {
      console.error("Error uploading training file:", e)
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
      <Heading size="lg" mb={6} color="#20343c">Training & Workshops</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <TrainingItem 
            key={index} 
            index={index} 
            item={item} 
            onChange={handleChange} 
            onDelete={handleDelete} 
            isEditing={isEditing}
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
            Add Training / Workshop
            </Button>
        )}

        {items.length === 0 && (
            <Box p={8} textAlign="center" color="gray.500" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No trainings added yet.
            </Box>
        )}
      </VStack>
    </Box>
  )
}

const TrainingItem = ({ index, item, onChange, onDelete, isEditing }) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Card variant="outline" borderColor="gray.200">
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
            <HStack onClick={() => setIsOpen(!isOpen)} cursor="pointer" flex={1}>
                <Text fontWeight="bold" color="gray.700">
                    {item.title ? `${item.title} - ${item.organization}` : `Training ${index + 1}`}
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
            <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Field label="Training / Workshop Title (Required)" required>
                        <Input 
                            value={item.title || ""} 
                            onChange={(e) => onChange(index, "title", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="e.g. Advanced Python"
                        />
                    </Field>
                    <Field label="Organization / Institution (Required)" required>
                        <Input 
                            value={item.organization || ""} 
                            onChange={(e) => onChange(index, "organization", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="e.g. Coursera / Stanford"
                        />
                    </Field>
                    <Field label="Type">
                        <Select 
                            value={item.trainingType || ""} 
                            onChange={(e) => onChange(index, "trainingType", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="Select Type"
                        >
                            <option value="Training">Training</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Course">Course</option>
                            <option value="Bootcamp">Bootcamp</option>
                            <option value="Other">Other</option>
                        </Select>
                    </Field>
                    <Field label="Skills Learned">
                        <Input 
                            value={item.skills || ""} 
                            onChange={(e) => onChange(index, "skills", e.target.value)} 
                            variant="flushed"
                            placeholder="e.g. Python, AWS"
                            isDisabled={!isEditing}
                        />
                    </Field>
                    <Field label="Start Date">
                        <Input 
                            type="date"
                            value={item.startDate ? item.startDate.split('T')[0] : ""} 
                            onChange={(e) => onChange(index, "startDate", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                        />
                    </Field>
                    <Field label="End Date">
                        <Input 
                            type="date"
                            value={item.endDate ? item.endDate.split('T')[0] : ""} 
                            onChange={(e) => onChange(index, "endDate", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
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
                <Field label="Description">
                    <Textarea 
                        value={item.description || ""} 
                        onChange={(e) => onChange(index, "description", e.target.value)} 
                        variant="flushed"
                        rows={3}
                        isDisabled={!isEditing}
                        placeholder="Describe the training/workshop..."
                    />
                </Field>
            </VStack>
        </Collapse>
      </CardBody>
    </Card>
  )
}
