import React from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  SimpleGrid,
  Box,
  Heading,
  IconButton,
  useColorModeValue,
  Select,
  Text,
  Flex,
  Collapse,
  useToast
} from "@chakra-ui/react";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaUpload, FaFile } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";

const AcademicsFileInput = ({ isEditing, value, onChange, onFileSelect, index }) => {
  const toast = useToast()
  const inputId = `academics-file-upload-${index}`
  
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 5MB",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        return
      }

      // Check file type
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Image file",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        return
      }

      if (onFileSelect) {
        onFileSelect(file)
        // We don't set the URL here immediately, we show the file name as pending or just let the user know
        toast({
          title: "File selected",
          description: `${file.name} selected for upload. Click Save Changes to upload.`,
          status: "info",
          duration: 3000,
          isClosable: true,
        })
      }
    }
  }

  const fileName = value ? (typeof value === 'string' ? value.split('/').pop() : 'File Uploaded') : ''

  return (
    <Box>
        {isEditing ? (
            <Flex align="center" gap={2}>
                <Button as="label" htmlFor={inputId} cursor="pointer" size="sm" leftIcon={<FaUpload />} colorScheme="blue" variant="outline" type="button">
                    Upload Marksheet
                    <input
                        id={inputId}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </Button>
                {fileName && <Text fontSize="xs" noOfLines={1}>{fileName}</Text>}
            </Flex>
        ) : (
            value ? (
                <Button size="sm" leftIcon={<FaFile />} as="a" href={value} target="_blank" variant="link" colorScheme="blue">
                    View Marksheet
                </Button>
            ) : (
                <Text fontSize="sm" color="gray.500">No marksheet uploaded</Text>
            )
        )}
    </Box>
  )
}

const SemesterItem = ({ item, onChange, onDelete, index, isOpen, onToggle, isEditing, onFileSelect, takenSemesters, maxAllowedSemester }) => {
  const handleChange = (field, value) => {
    // Handle number fields
    if (['academicYear', 'semester', 'sgpa', 'closedBacklogs', 'liveBacklogs'].includes(field)) {
       // Allow empty string for intermediate editing, but convert to number when possible
       // Actually, keeping as string in state is fine, backend sanitizes it.
       onChange({ ...item, [field]: value }, index);
    } else if (field === 'resultUploadLink') {
        // Handle as array for backend compatibility (text[]), but single input for now
        // If the user inputs a string, we'll store it. The parent component or submit handler can wrap it.
        // Actually, let's store it as string in form state, and wrap in array before sending if needed.
        // Or if the backend expects 'provisionalResultUploadLink' as array.
        // Let's assume the backend controller handles simple mapping.
        // Wait, if I send a string to text[] column, postgres will complain.
        // I should probably store it as array in state if possible, or convert on submit.
        // But this form receives `data` and calls `onUpdate`.
        // The `GenericProfileSection` likely just sends `data` to backend.
        // So I should ensure `data` has the correct structure.
        
        // If the backend expects an array, I should set it as an array.
        // But for a single input, it's easier to bind to a string.
        // I'll bind to a string property `resultUploadLinkStr` and update the actual array `resultUploadLink`.
        
        const val = value;
        onChange({ ...item, resultUploadLink: val ? [val] : [] }, index);
    } else {
        onChange({ ...item, [field]: value }, index);
    }
  };
  
  // Helper to get string value from potential array
  const getLinkValue = (links) => {
      if (Array.isArray(links) && links.length > 0) return links[0];
      if (typeof links === 'string') return links;
      return "";
  };

  const availableOptions = [1, 2, 3, 4, 5, 6, 7, 8].filter(sem => {
      // Condition 1: Must be less than current semester (past results)
      const isPast = sem < maxAllowedSemester;
      
      // Condition 2: Must not be already taken (unless it's the current item's value)
      const isAvailable = !takenSemesters.has(sem) || sem === Number(item.semester);
      
      return isPast && isAvailable;
  });

  return (
    <Box border="1px solid" borderColor="gray.200" borderRadius="xl" p={4} bg="white">
      <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0} cursor="pointer" onClick={onToggle}>
        <VStack align="start" gap={0}>
            <Heading size="sm" color="#20343c">{item.semester ? `Semester ${item.semester}` : "New Semester Entry"}</Heading>
            <Text fontSize="xs" color="gray.500">{item.academicYear || "Year"}</Text>
        </VStack>
        <Flex gap={2}>
            <IconButton icon={<FaTrash />} size="sm" colorScheme="red" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(index); }} aria-label="Delete" isDisabled={!isEditing} _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }} />
            <IconButton icon={isOpen ? <FaChevronUp /> : <FaChevronDown />} size="sm" variant="ghost" aria-label="Toggle" />
        </Flex>
      </Flex>
      
      <Collapse in={isOpen}>
        <VStack spacing={6} align="stretch" mt={4}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <FormControl isRequired>
              <FormLabel>Semester</FormLabel>
              <Select 
                value={item.semester || ""} 
                onChange={(e) => handleChange("semester", e.target.value)}
                isDisabled={!isEditing}
                placeholder="Select Semester"
              >
                {availableOptions.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Academic Year</FormLabel>
              <Input
                type="number"
                value={item.academicYear || ""}
                onChange={(e) => handleChange("academicYear", e.target.value)}
                isDisabled={!isEditing}
                placeholder="e.g. 2023"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>SGPA</FormLabel>
              <Input
                type="number"
                step="0.01"
                value={item.sgpa || ""}
                onChange={(e) => handleChange("sgpa", e.target.value)}
                isDisabled={!isEditing}
                placeholder="e.g. 8.5"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Live Backlogs</FormLabel>
              <Input
                type="number"
                value={item.liveBacklogs || ""}
                onChange={(e) => handleChange("liveBacklogs", e.target.value)}
                isDisabled={!isEditing}
                placeholder="0"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Closed Backlogs</FormLabel>
              <Input
                type="number"
                value={item.closedBacklogs || ""}
                onChange={(e) => handleChange("closedBacklogs", e.target.value)}
                isDisabled={!isEditing}
                placeholder="0"
              />
            </FormControl>

            <FormControl>
                <FormLabel>Result Marksheet</FormLabel>
                <AcademicsFileInput 
                    isEditing={isEditing}
                    value={getLinkValue(item.resultUploadLink)}
                    onChange={(url) => handleChange("resultUploadLink", url ? [url] : [])}
                    onFileSelect={onFileSelect ? (file) => onFileSelect(index, file) : undefined}
                    index={index}
                />
            </FormControl>
          </SimpleGrid>
        </VStack>
      </Collapse>
    </Box>
  )
}

export const AcademicPerformanceForm = ({ data = {}, onUpdate, isEditing, onFileSelect, personalDetails }) => {
  const bg = useColorModeValue("white", "gray.50");
  const formData = data || {};
  // Ensure we work with an array. The controller expects the root object to be the array or contain it.
  // Based on other forms, `formData` might be `{ academics: [...] }` or just `[...]`.
  // But `GenericProfileSection` usually passes the response from `getAcademics`.
  // `getAcademics` returns `mapData(..., result.rows, 'fromDb')` which returns an array of objects.
  // So `formData` should be the array itself if the structure is consistent.
  // However, `AcademicPerformanceForm` props are `{ data, onUpdate }`.
  // If `data` is the array, we can use it directly.
  // But the previous implementation used `formData.education`.
  // Let's check `AcademicsProfile.jsx` -> `GenericProfileSection`.
  // `GenericProfileSection` passes `data` from `useProfile`.
  // If `academics` endpoint returns an array, `data` will be that array.
  // Wait, `GenericProfileSection` might wrap it?
  // Let's assume `data` is the array for "academics" section.
  
  // Actually, looking at previous `AcademicPerformanceForm.jsx`:
  // `const formData = data || {};`
  // `...(formData.education || [])`
  // It expected an object with `education` property.
  // But `academicsController` returns `res.json(mapData(..., rows, ...))`.
  // If `mapData` returns an array (which it does for multiple rows), then `data` is an array.
  // So `formData` is an array.
  // But the previous form was accessing `formData.education`. This implies the previous controller might have been returning `{ education: [...] }` or the form was just wrong/legacy.
  // Given I am rewriting it, I will assume `data` is the array of semester records.
  
  // Correction: `GenericProfileSection` might expect `onUpdate` to receive the full object structure.
  // If I pass an array to `onUpdate`, `GenericProfileSection` will send that array to backend.
  // `updateAcademics` handles `req.body` being an array or object containing array.
  // So sending an array is fine.
  
  const academics = Array.isArray(formData) ? formData : (formData.academics || []);
  
  const currentSemester = personalDetails?.currentSemester ? Number(personalDetails.currentSemester) : 9;
  const takenSemesters = new Set(academics.map(a => Number(a.semester)).filter(Boolean));

  const [openIndex, setOpenIndex] = React.useState(null);

  const handleUpdate = (newAcademics) => {
    // If the original data structure was an object, we might want to preserve that?
    // But for simplicity and since I control the backend, I'll send the array.
    onUpdate(newAcademics);
  };

  const handleAdd = () => {
    const newAcademics = [
      ...academics,
      { semester: "", academicYear: "", sgpa: "", liveBacklogs: "0", closedBacklogs: "0", resultUploadLink: [] },
    ];
    handleUpdate(newAcademics);
    setOpenIndex(newAcademics.length - 1);
  };

  const handleRemove = (index) => {
    const newAcademics = academics.filter((_, i) => i !== index);
    handleUpdate(newAcademics);
    if (openIndex === index) setOpenIndex(null);
  };

  const handleChange = (item, index) => {
    const newAcademics = [...academics];
    newAcademics[index] = item;
    handleUpdate(newAcademics);
  };

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Heading size="md" color="#20343c">Semester Academics</Heading>
        {isEditing && (
          <Button
            leftIcon={<FaPlus />}
            onClick={handleAdd}
            colorScheme="orange"
            variant="outline"
            borderColor="#d4a960"
            color="#d4a960"
            _hover={{ bg: "#fff5e6" }}
          >
            Add Semester
          </Button>
        )}
      </Flex>

      <VStack spacing={4} align="stretch">
        {academics.map((item, index) => (
          <SemesterItem
            key={index}
            index={index}
            item={item}
            onChange={handleChange}
            onDelete={handleRemove}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            isEditing={isEditing}
            onFileSelect={onFileSelect}
            takenSemesters={takenSemesters}
            maxAllowedSemester={currentSemester}
          />
        ))}
        {academics.length === 0 && (
            <Box p={8} textAlign="center" color="gray.500" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No academic records added yet.
            </Box>
        )}
      </VStack>
    </VStack>
  );
};
