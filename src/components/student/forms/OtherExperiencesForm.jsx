/**
 * Component: OtherExperiencesForm
 * 
 * Fields (Repeatable):
 * - title (Text, Required)
 * - organization (Text)
 * - location (Text)
 * - startDate (Date)
 * - endDate (Date)
 * - skills (Text)
 * - description (Textarea)
 * - proofDocument (Link)
 */

import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, useColorModeValue, useToast } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { useState } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"
import { StudentProfileService } from "../../../services/studentProfile.service"

export const OtherExperiencesForm = ({ data = {}, onUpdate, isEditing = false }) => {
  const items = Array.isArray(data) ? data : (data.otherExperiences || [])
  const bg = useColorModeValue("white", "gray.700")
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
        location: "",
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
      const result = await StudentProfileService.uploadFile(usn, file, { folder: "other-experiences" })
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
      console.error("Error uploading other experience file:", e)
      toast({
        status: "error",
        description: "File upload failed",
        duration: 4000,
        isClosable: true
      })
    }
  }

  return (
    <Box bg={bg} p={8} borderRadius="xl" shadow="sm">
      <Heading size="lg" mb={6} color="#20343c">Other Experiences</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <OtherExperienceItem 
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
            Add Experience
          </Button>
        )}

        {items.length === 0 && (
            <Box p={8} textAlign="center" color="gray.500" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No other experiences added yet.
            </Box>
        )}
      </VStack>
    </Box>
  )
}

const OtherExperienceItem = ({ index, item, onChange, onDelete, isEditing }) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Card variant="outline" borderColor="gray.200">
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
            <HStack onClick={() => setIsOpen(!isOpen)} cursor="pointer" flex={1}>
                <Text fontWeight="bold" color="gray.700">
                    {item.title || "New Experience"}
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
                    aria-label="Delete experience"
                />
            )}
        </Flex>

        <Collapse in={isOpen} animateOpacity>
            <VStack spacing={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <Field label="Title" required>
                        <Input 
                            value={item.title || ""} 
                            onChange={(e) => onChange(index, "title", e.target.value)}
                            placeholder="e.g. Volunteer, Club Member"
                            readOnly={!isEditing}
                        />
                    </Field>
                    <Field label="Organization" required>
                        <Input 
                            value={item.organization || ""} 
                            onChange={(e) => onChange(index, "organization", e.target.value)}
                            placeholder="e.g. NGO Name, Student Body"
                            readOnly={!isEditing}
                        />
                    </Field>
                </SimpleGrid>

                <Field label="Location">
                    <Input 
                        value={item.location || ""} 
                        onChange={(e) => onChange(index, "location", e.target.value)}
                        placeholder="e.g. Bangalore, Remote"
                        readOnly={!isEditing}
                    />
                </Field>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <Field label="Start Date">
                        <Input 
                            type="date" 
                            value={item.startDate ? item.startDate.split('T')[0] : ""} 
                            onChange={(e) => onChange(index, "startDate", e.target.value)}
                            readOnly={!isEditing}
                        />
                    </Field>
                    <Field label="End Date">
                        <Input 
                            type="date" 
                            value={item.endDate ? item.endDate.split('T')[0] : ""} 
                            onChange={(e) => onChange(index, "endDate", e.target.value)}
                            readOnly={!isEditing}
                        />
                    </Field>
                </SimpleGrid>

                <Field label="Skills Used/Gained">
                    <Input 
                        value={item.skills || ""} 
                        onChange={(e) => onChange(index, "skills", e.target.value)}
                        placeholder="e.g. Teamwork, Event Management"
                        readOnly={!isEditing}
                    />
                </Field>

                <Field label="Description">
                    <Textarea 
                        value={item.description || ""} 
                        onChange={(e) => onChange(index, "description", e.target.value)}
                        placeholder="Brief description of your role and contributions..."
                        readOnly={!isEditing}
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
                        placeholder="https://..."
                        readOnly={!isEditing}
                    />
                </Field>
            </VStack>
        </Collapse>
      </CardBody>
    </Card>
  )
}
