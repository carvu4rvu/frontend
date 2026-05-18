import { 
  Box, SimpleGrid, Input, Select, VStack, Heading, Flex, Button, 
  Text, Menu, MenuButton, MenuList, MenuItem, Badge, useColorModeValue, FormControl, useToast
} from "@chakra-ui/react"
import { useEffect } from "react"
import { Field } from "../../ui/field"
import { FaUserTie, FaUser, FaUserShield, FaPlus, FaTrash, FaChevronDown, FaPhone, FaEnvelope, FaBriefcase, FaBuilding } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"

const ParentCard = ({ parent, index, isEditing, onChange, onRemove, fieldErrors = {} }) => {
  const bg = useColorModeValue("white", "gray.700")
  const borderColor = useColorModeValue("gray.200", "gray.600")
  
  // Extract field errors for this parent
  const getError = (field) => fieldErrors[field] || null
  
  const getIcon = (type) => {
    switch(type) {
      case "Father": return FaUserTie;
      case "Mother": return FaUser; // Using generic user for Mother or specific if available
      default: return FaUserShield;
    }
  }
  
  const Icon = getIcon(parent.parent_type)

  return (
    <Box 
      p={6} 
      bg={bg} 
      borderWidth="1px" 
      borderColor={borderColor} 
      borderRadius="xl" 
      shadow="sm"
      position="relative"
      transition="all 0.2s"
      _hover={{ shadow: "md" }}
      color="gray.800"
      sx={{ 
        "& .chakra-form__label": { color: "gray.700" },
        "& input:disabled, & select:disabled": { color: "gray.800", opacity: 1 }
      }}
    >
      <Flex justify="space-between" align="center" mb={6}>
        <Flex align="center" gap={3}>
          <Box p={2} bg="orange.50" borderRadius="lg" color="#d4a960">
            <Icon size={20} />
          </Box>
          <Box>
            <Heading size="md" color="#20343c">
              {parent.parent_type || "Parent"}
            </Heading>
            <Text fontSize="xs" color="gray.600" fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
              Family Member
            </Text>
          </Box>
        </Flex>
        
        {isEditing && (
          <Button 
            size="sm" 
            colorScheme="red" 
            variant="ghost" 
            leftIcon={<FaTrash />}
            onClick={() => onRemove(index)}
            _hover={{ bg: "red.50", color: "red.600" }}
          >
            Remove
          </Button>
        )}
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        <FormControl isInvalid={!!getError('parent_type')}>
          <Field label="Relationship Type" required>
            <Select 
              value={parent.parent_type || "Father"} 
              onChange={(e) => onChange(index, "parent_type", e.target.value)} 
              variant="filled" 
              bg="gray.50"
              _focus={{ bg: "white", borderColor: "#d4a960" }}
              isDisabled={!isEditing} 
            >
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
            </Select>
          </Field>
          {getError('parent_type') && (
            <Text fontSize="sm" color="red.500" mt={1}>{getError('parent_type')}</Text>
          )}
        </FormControl>

        <FormControl isInvalid={!!getError('name')}>
          <Field label="Full Name" required>
            <Input 
              value={parent.name || ""} 
              onChange={(e) => {
                const value = e.target.value;
                // Remove any numbers from the input
                const sanitized = value.replace(/[0-9]/g, '');
                onChange(index, "name", sanitized);
              }}
              placeholder="e.g. John Doe"
              variant="filled"
              bg="gray.50"
              _focus={{ bg: "white", borderColor: "#d4a960" }}
              isDisabled={!isEditing} 
            />
          </Field>
          {getError('name') && (
            <Text fontSize="sm" color="red.500" mt={1}>{getError('name')}</Text>
          )}
        </FormControl>

        <FormControl isInvalid={!!getError('email')}>
          <Field label="Email Address" required>
             <Flex align="center">
               <Box mr={2} color="gray.600"><FaEnvelope /></Box>
               <Input 
                type="email" 
                value={parent.email || ""} 
                onChange={(e) => onChange(index, "email", e.target.value)} 
                placeholder="name@example.com"
                variant="filled"
                bg="gray.50"
                _focus={{ bg: "white", borderColor: "#d4a960" }}
                isDisabled={!isEditing} 
              />
             </Flex>
          </Field>
          {getError('email') && (
            <Text fontSize="sm" color="red.500" mt={1}>{getError('email')}</Text>
          )}
        </FormControl>

        <FormControl isInvalid={!!getError('phone_number') || !!getError('phone_country_code')}>
          <Field label="Mobile Number" required>
            <Flex gap={2}>
              <Input 
                w="90px"
                value={parent.phone_country_code || "+91"} 
                onChange={(e) => onChange(index, "phone_country_code", e.target.value)} 
                variant="filled"
                bg="gray.50"
                isDisabled={!isEditing} 
              />
              <Flex align="center" flex={1} position="relative">
                <Box position="absolute" left={3} zIndex={2} color="gray.600"><FaPhone size={12} /></Box>
                <Input 
                  pl={8}
                  type="tel" 
                  value={parent.phone_number || ""} 
                  onChange={(e) => onChange(index, "phone_number", e.target.value)} 
                  placeholder="9876543210"
                  variant="filled"
                  bg="gray.50"
                  _focus={{ bg: "white", borderColor: "#d4a960" }}
                  isDisabled={!isEditing} 
                />
              </Flex>
            </Flex>
          </Field>
          {(getError('phone_country_code') || getError('phone_number')) && (
            <Text fontSize="sm" color="red.500" mt={1}>
              {getError('phone_country_code') || getError('phone_number')}
            </Text>
          )}
        </FormControl>

        <Field label="Occupation">
           <Flex align="center">
             <Box mr={2} color="gray.600"><FaBriefcase /></Box>
             <Input 
              value={parent.occupation || ""} 
              onChange={(e) => onChange(index, "occupation", e.target.value)} 
              placeholder="e.g. Engineer"
              variant="filled"
              bg="gray.50"
              _focus={{ bg: "white", borderColor: "#d4a960" }}
              isDisabled={!isEditing} 
            />
           </Flex>
        </Field>

        <Field label="Organization">
           <Flex align="center">
             <Box mr={2} color="gray.600"><FaBuilding /></Box>
             <Input 
              value={parent.organization || ""} 
              onChange={(e) => onChange(index, "organization", e.target.value)} 
              placeholder="e.g. Tech Corp"
              variant="filled"
              bg="gray.50"
              _focus={{ bg: "white", borderColor: "#d4a960" }}
              isDisabled={!isEditing} 
            />
           </Flex>
        </Field>
      </SimpleGrid>
    </Box>
  )
}

export const ParentDetailsForm = ({ data = [], onUpdate, isEditing = false, fieldErrors = {} }) => {
  const parentsData = Array.isArray(data) ? data : (data?.parents || [])
  const { user } = useAuth()
  const toast = useToast()
  const storageKey = `parentDetailsDraft:${user?.usn || 'anon'}`
  
  const showValidationError = (title, description) => {
    toast({
      title,
      description,
      status: "warning",
      duration: 4000,
      isClosable: true,
      position: "top",
    })
  }

  // If no data, start empty. 
  // We do NOT force INITIAL_PARENTS anymore to satisfy "button if everything is null"
  const parents = parentsData

  const handleParentChange = (index, field, value) => {
    const currentParents = [...parents]
    if (!currentParents[index]) currentParents[index] = {}
    
    // If changing parent_type, validate against duplicate rules
    if (field === 'parent_type') {
      const typeCounts = {};
      currentParents.forEach((p, i) => {
        const type = (i === index ? value : p.parent_type)?.toUpperCase();
        if (type) typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      const fatherCount = typeCounts['FATHER'] || 0;
      const motherCount = typeCounts['MOTHER'] || 0;
      const guardianCount = typeCounts['GUARDIAN'] || 0;
      
      // Don't allow two fathers
      if (fatherCount > 1) {
        showValidationError('Invalid Selection', 'Only one father is allowed. You already have a father entry.');
        return;
      }
      
      // Don't allow two mothers
      if (motherCount > 1) {
        showValidationError('Invalid Selection', 'Only one mother is allowed. You already have a mother entry.');
        return;
      }
      
      // Don't allow more than 1 guardian if father or mother exists
      if (guardianCount > 1 && (fatherCount > 0 || motherCount > 0)) {
        showValidationError('Invalid Selection', 'Only 1 guardian is allowed when father or mother is present.');
        return;
      }
      
      // Don't allow more than 2 guardians
      if (guardianCount > 2) {
        showValidationError('Invalid Selection', 'Maximum 2 guardians allowed.');
        return;
      }
    }
    
    currentParents[index] = { ...currentParents[index], [field]: value }
    onUpdate(currentParents)
    try {
      if (isEditing) sessionStorage.setItem(storageKey, JSON.stringify(currentParents))
    } catch {}
  }

  const MAX_PARENTS = 3 // Max 3: 1 Father + 1 Mother + 1 Guardian

  const handleAddParent = (type = "Father") => {
    if (parents.length >= MAX_PARENTS) return
    
    // Check if this type is allowed
    const typeCounts = {};
    parents.forEach((p) => {
      const pType = p.parent_type?.toUpperCase();
      if (pType) typeCounts[pType] = (typeCounts[pType] || 0) + 1;
    });
    
    const fatherCount = typeCounts['FATHER'] || 0;
    const motherCount = typeCounts['MOTHER'] || 0;
    const guardianCount = typeCounts['GUARDIAN'] || 0;
    const newType = type.toUpperCase();
    
    // Don't allow adding a second father
    if (newType === 'FATHER' && fatherCount >= 1) {
      showValidationError('Cannot Add Father', 'Only one father is allowed. You already have a father entry.');
      return;
    }
    
    // Don't allow adding a second mother
    if (newType === 'MOTHER' && motherCount >= 1) {
      showValidationError('Cannot Add Mother', 'Only one mother is allowed. You already have a mother entry.');
      return;
    }
    
    // Don't allow adding more than 1 guardian if father or mother exists
    if (newType === 'GUARDIAN' && guardianCount >= 1 && (fatherCount > 0 || motherCount > 0)) {
      showValidationError('Cannot Add Guardian', 'Only 1 guardian is allowed when father or mother is present.');
      return;
    }
    
    // Don't allow more than 2 guardians
    if (newType === 'GUARDIAN' && guardianCount >= 2) {
      showValidationError('Cannot Add Guardian', 'Maximum 2 guardians allowed.');
      return;
    }
    
    const newParents = [...parents, { 
      parent_type: type,
      name: "", 
      occupation: "",
      organization: "",
      email: "",
      phone_country_code: "+91",
      phone_number: ""
    }]
    onUpdate(newParents)
    try {
      if (isEditing) sessionStorage.setItem(storageKey, JSON.stringify(newParents))
    } catch {}
  }

  const handleRemoveParent = (index) => {
    const newParents = parents.filter((_, i) => i !== index)
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
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <VStack spacing={6} align="stretch" color="gray.800">
      {parents.length === 0 && (
        <Box 
          p={10} 
          borderWidth="2px" 
          borderStyle="dashed" 
          borderColor="gray.200" 
          borderRadius="xl" 
          textAlign="center"
          bg="gray.50"
        >
          <Heading size="md" color="gray.700" mb={2}>No Family Details Added</Heading>
          <Text color="gray.700" mb={6}>Add your parents or guardians to complete your profile.</Text>
          
          {isEditing && parents.length < MAX_PARENTS && (
             <Menu>
              <MenuButton 
                as={Button} 
                rightIcon={<FaChevronDown />} 
                bg="#d4a960" 
                color="#20343c"
                _hover={{ bg: "#c39850" }}
                size="lg"
                shadow="md"
              >
                Add Details
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FaUserTie />} onClick={() => handleAddParent("Father")}>Add Father</MenuItem>
                <MenuItem icon={<FaUser />} onClick={() => handleAddParent("Mother")}>Add Mother</MenuItem>
                <MenuItem icon={<FaUserShield />} onClick={() => handleAddParent("Guardian")}>Add Guardian</MenuItem>
              </MenuList>
            </Menu>
          )}
        </Box>
      )}

      {parents.map((parent, index) => (
        <ParentCard 
          key={index}
          index={index}
          parent={parent}
          isEditing={isEditing}
          onChange={handleParentChange}
          onRemove={handleRemoveParent}
          fieldErrors={fieldErrors?.[index] || {}}
        />
      ))}

      {parents.length > 0 && parents.length < MAX_PARENTS && isEditing && (
        <Flex justify="center" pt={4}>
           <Menu>
            <MenuButton 
              as={Button} 
              rightIcon={<FaChevronDown />} 
              variant="outline"
              colorScheme="orange"
              size="md"
            >
              Add Details
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FaUserTie />} onClick={() => handleAddParent("Father")}>Add Father</MenuItem>
              <MenuItem icon={<FaUser />} onClick={() => handleAddParent("Mother")}>Add Mother</MenuItem>
              <MenuItem icon={<FaUserShield />} onClick={() => handleAddParent("Guardian")}>Add Guardian</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      )}
    </VStack>
  )
}
