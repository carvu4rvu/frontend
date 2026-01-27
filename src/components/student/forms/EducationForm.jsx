/**
 * Component: EducationForm
 * 
 * Fields (Repeatable):
 * - educationLevel (Select: 10th, 12th, Undergraduate, Postgraduate)
 * - instituteName (Text)
 * - boardOrUniversity (Text)
 * - city (Text)
 * - yearOfPassing (Number)
 * - resultType (Select: Percentage, CGPA)
 * - result (Text/Number)
 * - subjects (Text)
 * - gapDetails (Optional)
 * 
 * Validation:
 * - instituteName: Required
 * - yearOfPassing: Valid year
 * - result: Numeric
 * 
 * API Contracts:
 * - GET /api/student/profile/education
 * - POST /api/student/profile/education (Add Item)
 * - PUT /api/student/profile/education/:id (Update Item)
 * - DELETE /api/student/profile/education/:id (Delete Item)
 */

import { useState, useEffect } from "react"
import { Box, SimpleGrid, Input, Select, VStack, Heading, Flex, Button, Text, IconButton, Collapse, useToast } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { FaGraduationCap, FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"
import { StudentProfileService } from "../../../services/studentProfile.service"

const EducationItem = ({ item, onChange, onDelete, index, isOpen, onToggle, isEditing, onFileSelect, isPG }) => {
  const handleChange = (field, value) => {
    onChange({ ...item, [field]: value }, index)
  }

  return (
    <Box border="1px solid" borderColor="gray.200" borderRadius="xl" p={4} bg="white">
      <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0} cursor="pointer" onClick={onToggle}>
        <VStack align="start" gap={0}>
            <Heading size="sm" color="#20343c">{item.educationLevel || "New Education Entry"}</Heading>
            <Text fontSize="xs" color="gray.500">{item.instituteName}</Text>
        </VStack>
        <Flex gap={2}>
            <IconButton icon={<FaTrash />} size="sm" colorScheme="red" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(index); }} aria-label="Delete" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} />
            <IconButton icon={isOpen ? <FaChevronUp /> : <FaChevronDown />} size="sm" variant="ghost" aria-label="Toggle" />
        </Flex>
      </Flex>
      
      <Collapse in={isOpen}>
        <VStack spacing={6} align="stretch" mt={4}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field label="Education Level">
                <Select variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} value={item.educationLevel || ""} onChange={(e) => handleChange("educationLevel", e.target.value)}>
                    <option value="">Select Level</option>
                    <option value="10TH">10th</option>
                    <option value="12TH">12th</option>
                    <option value="DIPLOMA">Diploma</option>
                    {isPG && (
                        <>
                            <option value="GRADUATION">Undergraduate</option>
                            <option value="POST_GRADUATION">Postgraduate</option>
                            <option value="OTHER">Other</option>
                        </>
                    )}
                </Select>
            </Field>
            <Field label="Institute Name">
                <Input value={item.instituteName || ""} onChange={(e) => handleChange("instituteName", e.target.value)} variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} />
            </Field>
            <Field label="Board / University">
                <Input value={item.boardOrUniversity || ""} onChange={(e) => handleChange("boardOrUniversity", e.target.value)} variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} />
            </Field>
            <Field label="City">
                <Input value={item.city || ""} onChange={(e) => handleChange("city", e.target.value)} variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} />
            </Field>
            <Field label="Year of Passing">
                <Input type="number" value={item.yearOfPassing || ""} onChange={(e) => handleChange("yearOfPassing", e.target.value)} variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} />
            </Field>
            <Field label="Result Type">
                <Select variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} value={item.resultType || ""} onChange={(e) => handleChange("resultType", e.target.value)}>
                    <option value="Percentage">Percentage</option>
                    <option value="CGPA">CGPA</option>
                </Select>
            </Field>
            <Field label="Result Value">
                <Input value={item.result || ""} onChange={(e) => handleChange("result", e.target.value)} variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} />
            </Field>
            <Field label="Subjects">
                <Input value={item.subjects || ""} onChange={(e) => handleChange("subjects", e.target.value)} variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} />
            </Field>
          <Field label="Upload Marksheet/Certificate">
            <EducationFileInput
                isEditing={isEditing}
                value={item.proofFile}
                onChange={(url) => handleChange("proofFile", url)}
                onFileSelect={onFileSelect ? (file) => onFileSelect(index, file) : undefined}
            />
            {item.proofFile && <Text fontSize="xs" color="green.500">Uploaded: {item.proofFile}</Text>}
          </Field>
          </SimpleGrid>
          
          <Box bg="gray.50" p={4} borderRadius="md">
            <Heading size="xs" mb={4} color="gray.600">Gap Details (If any)</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                 <Field label="Gap Type">
                    <Select variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} value={item.gapType || ""} onChange={(e) => handleChange("gapType", e.target.value)}>
                        <option value="">None</option>
                        <option value="12TH_TO_GRADUATION">12th to Graduation</option>
                        <option value="DIPLOMA_TO_GRADUATION">Diploma to Graduation</option>
                        <option value="GRADUATION_TO_POST_GRADUATION">Graduation to Post Graduation</option>
                    </Select>
                </Field>
                <Field label="Duration (Months)">
                    <Input type="number" value={item.gapDurationMonths || ""} onChange={(e) => handleChange("gapDurationMonths", e.target.value)} variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} />
                </Field>
                <Field label="Reason">
                    <Input value={item.gapReason || ""} onChange={(e) => handleChange("gapReason", e.target.value)} variant="flushed" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} />
                </Field>
            </SimpleGrid>
          </Box>
          </VStack>
      </Collapse>
    </Box>
  )
}

export const EducationForm = ({ data = {}, onUpdate, isEditing = false, onFileSelect }) => {
  // Ensure items is always an array
  const items = Array.isArray(data) ? data : []

  const handleChange = (updatedItem, index) => {
      const newItems = [...items]
      newItems[index] = updatedItem
      onUpdate(newItems)
  }

  const handleAdd = () => {
      onUpdate([
          ...items,
          {
              educationLevel: "",
              instituteName: "",
              boardOrUniversity: "",
              city: "",
              yearOfPassing: "",
              resultType: "",
              result: "",
              subjects: ""
          }
      ])
  }

  const handleDelete = (index) => {
      const newItems = items.filter((_, i) => i !== index)
      onUpdate(newItems)
  }

  const [isPG, setIsPG] = useState(false)
  const [openIndex, setOpenIndex] = useState(0)
  const { user } = useAuth()
  const usn = user?.usn

  useEffect(() => {
    if (!usn) return
    const fetchPersonal = async () => {
        try {
            const personal = await StudentProfileService.getSection(usn, 'personal')
            if (personal && personal.programName) {
                // Simple heuristic: specific PG degrees or starts with M
                const name = personal.programName.toUpperCase()
                const isPostGrad = name.startsWith('M') || name.includes('MBA') || name.includes('PG') || name.includes('MASTER')
                setIsPG(isPostGrad)
            }
        } catch (e) {
            console.error("Failed to determine program type", e)
        }
    }
    fetchPersonal()
  }, [usn])

  return (
    <Box bg="white" p={8} borderRadius="xl" shadow="sm">
      <Heading size="lg" mb={6} color="#20343c">Education History</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <EducationItem 
            key={index} 
            index={index} 
            item={item} 
            onChange={handleChange} 
            onDelete={handleDelete}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            isEditing={isEditing}
            onFileSelect={onFileSelect}
            isPG={isPG}
          />
        ))}

        <Button 
          leftIcon={<FaPlus />} 
          onClick={handleAdd} 
          variant="outline" 
          colorScheme="orange" 
          borderColor="#d4a960" 
          color="#d4a960"
          _hover={{ bg: "#fff5e6" }}
          isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }}
        >
          Add Education
        </Button>
      </VStack>
    </Box>
  )
}

const EducationFileInput = ({ isEditing, value, onChange, onFileSelect }) => {
  const toast = useToast()
  const { user } = useAuth()
  const usn = user?.usn

  const handleUpload = async (file) => {
    if (!file || !usn) return
    try {
      const result = await StudentProfileService.uploadFile(usn, file, { folder: "education" })
      const url = result?.url || result?.path
      if (url) {
        onChange(url)
        toast({
          status: "success",
          description: "File uploaded",
          duration: 3000,
          isClosable: true
        })
      }
    } catch (e) {
      console.error("Error uploading education file:", e)
      toast({
        status: "error",
        description: "File upload failed",
        duration: 4000,
        isClosable: true
      })
    }
  }

  return (
    <Box>
      {isEditing && (
        <Input
          type="file"
          p={1}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          onChange={async (e) => {
            const file = e.target.files && e.target.files[0]
            if (!file) return
            if (onFileSelect) {
              onFileSelect(file)
              toast({
                status: "info",
                description: "File selected. It will be uploaded when you save changes.",
                duration: 3000,
                isClosable: true
              })
              return
            }
            await handleUpload(file)
          }}
          variant="outline"
        />
      )}
      <Input
        mt={2}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        variant="flushed"
        isDisabled={!isEditing}
        _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }}
        placeholder="https://..."
      />
      {value && (
        <Button 
          size="sm" 
          mt={2} 
          as="a" 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          variant="link" 
          colorScheme="blue"
        >
          View Uploaded File
        </Button>
      )}
    </Box>
  )
}
