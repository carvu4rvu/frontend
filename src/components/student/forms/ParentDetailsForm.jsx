/**
 * Component: ParentDetailsForm
 * 
 * Fields:
 * - parentType (Select: Father, Mother, Guardian)
 * - name (Text, Required)
 * - occupation (Text)
 * - organization (Text)
 * - email (Email)
 * - phoneCountryCode (Text)
 * - phoneNumber (Tel, Required)
 * 
 * Validation:
 * - name: Required
 * - email: Valid format
 * - phoneNumber: 10 digits
 * 
 * API Contracts:
 * - GET /api/student/profile/family
 * - POST/PUT /api/student/profile/family
 *   Body: { parentType, name, occupation, email, phoneNumber, ... }
 */

import { Box, SimpleGrid, Input, Select, VStack, Heading, Flex, Button } from "@chakra-ui/react"
import { useEffect } from "react"
import { Field } from "../../ui/field"
import { FaUserFriends, FaMobile, FaEnvelope } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"

const SectionHeader = ({ title, icon: Icon }) => (
  <Flex align="center" gap={3} mb={6} borderBottom="1px solid" borderColor="gray.200" pb={2}>
    <Box p={2} bg="orange.50" borderRadius="md" color="#d4a960">
      <Icon size={18} />
    </Box>
    <Heading size="md" color="#20343c" fontWeight="bold">
      {title}
    </Heading>
  </Flex>
)

export const ParentDetailsForm = ({ data = [], onUpdate, isEditing = false }) => {
  // If data is array, use it. If it's an object (legacy/error), try to use parents prop or empty array.
  // Ideally data should be the array of parents from backend.
  const parentsData = Array.isArray(data) ? data : (data?.parents || [])
  const { user } = useAuth()
  const storageKey = `parentDetailsDraft:${user?.usn || 'anon'}`

  const INITIAL_PARENTS = [
    { 
      parentType: "Father",
      name: "", 
      occupation: "",
      organisation: "",
      email: "",
      phoneCountryCode: "+91",
      phoneNumber: ""
    },
    { 
      parentType: "Mother",
      name: "", 
      occupation: "",
      organisation: "",
      email: "",
      phoneCountryCode: "+91",
      phoneNumber: ""
    }
  ]

  const parents = (parentsData.length > 0) ? parentsData : INITIAL_PARENTS

  const handleParentChange = (index, field, value) => {
    const currentParents = (parentsData.length > 0) ? [...parentsData] : JSON.parse(JSON.stringify(INITIAL_PARENTS))
    if (!currentParents[index]) currentParents[index] = {}
    currentParents[index] = { ...currentParents[index], [field]: value }
    onUpdate(currentParents)
    try {
      if (isEditing) sessionStorage.setItem(storageKey, JSON.stringify(currentParents))
    } catch {}
  }

  const handleAddParent = () => {
    const currentParents = (parentsData.length > 0) ? [...parentsData] : JSON.parse(JSON.stringify(INITIAL_PARENTS))
    const newParents = [...currentParents, { 
      name: "", 
      parentType: "Guardian",
      occupation: "",
      organization: "",
      email: "",
      phoneCountryCode: "+91",
      phoneNumber: ""
    }]
    onUpdate(newParents)
    try {
      if (isEditing) sessionStorage.setItem(storageKey, JSON.stringify(newParents))
    } catch {}
  }

  const handleRemoveParent = (index) => {
    const currentParents = (parentsData.length > 0) ? [...parentsData] : JSON.parse(JSON.stringify(INITIAL_PARENTS))
    const newParents = currentParents.filter((_, i) => i !== index)
    onUpdate(newParents)
    try {
      if (isEditing) sessionStorage.setItem(storageKey, JSON.stringify(newParents))
    } catch {}
  }

  useEffect(() => {
    try {
      if (!isEditing) return
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          onUpdate(parsed)
        } else if (parsed && Array.isArray(parsed.parents)) {
           // Handle legacy format in session storage
           onUpdate(parsed.parents)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box bg="white" p={8} borderRadius="xl" shadow="sm">
      <VStack spacing={8} align="stretch">
        
        {parents.map((parent, index) => (
            <Box key={index}>
                <Flex justify="space-between" align="center" mb={4}>
                    <SectionHeader title={`${parent.parentType || "Parent"}'s Details`} icon={FaUserFriends} />
                    {isEditing && (
                        <Button 
                            colorScheme="red" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveParent(index)}
                        >
                            Remove
                        </Button>
                    )}
                </Flex>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                    <Field label="Type" required>
                        <Select 
                            value={parent.parentType || "Father"} 
                            onChange={(e) => handleParentChange(index, "parentType", e.target.value)} 
                            variant="flushed" 
                            isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }}
                        >
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Guardian">Guardian</option>
                        </Select>
                    </Field>
                    <Field label="Name" required>
                        <Input 
                            value={parent.name || ""} 
                            onChange={(e) => handleParentChange(index, "name", e.target.value)} 
                            variant="flushed" 
                            autoComplete="name"
                            isDisabled={!isEditing} 
                            _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} 
                        />
                    </Field>
                    <Field label="Occupation">
                        <Input 
                            value={parent.occupation || ""} 
                            onChange={(e) => handleParentChange(index, "occupation", e.target.value)} 
                            variant="flushed" 
                            autoComplete="organization-title"
                            isDisabled={!isEditing} 
                            _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} 
                        />
                    </Field>
                    <Field label="Organization">
                        <Input 
                            value={parent.organization || ""} 
                            onChange={(e) => handleParentChange(index, "organization", e.target.value)} 
                            variant="flushed" 
                            autoComplete="organization"
                            isDisabled={!isEditing} 
                            _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} 
                        />
                    </Field>
                    <Field label="Mobile Number" required>
                        <Flex gap={2}>
                            <Input 
                                w="80px"
                                value={parent.phoneCountryCode || "+91"} 
                                onChange={(e) => handleParentChange(index, "phoneCountryCode", e.target.value)} 
                                variant="flushed" 
                                autoComplete="tel-country-code"
                                isDisabled={!isEditing} 
                                _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} 
                            />
                            <Input 
                                type="tel" 
                                value={parent.phoneNumber || ""} 
                                onChange={(e) => handleParentChange(index, "phoneNumber", e.target.value)} 
                                variant="flushed" 
                                autoComplete="tel-national"
                                isDisabled={!isEditing} 
                                _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} 
                            />
                        </Flex>
                    </Field>
                    <Field label="Email" required>
                        <Input 
                            type="email" 
                            value={parent.email || ""} 
                            onChange={(e) => handleParentChange(index, "email", e.target.value)} 
                            variant="flushed" 
                            autoComplete="email"
                            isDisabled={!isEditing} 
                            _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} 
                        />
                    </Field>
                </SimpleGrid>
            </Box>
        ))}

        {isEditing && (
            <Button 
                onClick={handleAddParent} 
                variant="outline" 
                colorScheme="blue" 
                alignSelf="start"
            >
                Add Parent/Guardian
            </Button>
        )}

      </VStack>
    </Box>
  )
}
