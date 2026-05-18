import React from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Text,
  useColorModeValue,
  Box,
  Heading,
  Flex,
  Icon,
  Divider,
} from "@chakra-ui/react";
import { FaRocket, FaBullseye, FaFlag, FaStar, FaHeart } from "react-icons/fa";
import "../../../pages/student/profile/GrowthSections.css";

function careerFieldSnakeKey(camelKey) {
  if (!camelKey || typeof camelKey !== "string") return "";
  return camelKey.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}

function CareerField({ label, fieldKey, formData, handleChange, isEditing, placeholder, errorText, icon }) {
  const snakeKey = careerFieldSnakeKey(fieldKey);
  const val = formData[fieldKey] ?? formData[snakeKey] ?? "";

  if (!isEditing) {
    return (
      <Box className="growth-view-item" mb={6}>
        <Flex align="center" gap={2} mb={2}>
          <Icon as={icon} color="orange.400" boxSize={4} />
          <Text className="growth-view-label" m={0}>{label}</Text>
        </Flex>
        <Box 
          p={4} 
          bg="gray.50" 
          borderRadius="lg" 
          borderLeft="4px solid" 
          borderColor="orange.200"
          fontSize="sm"
          lineHeight="tall"
          color="gray.700"
          whiteSpace="pre-wrap"
        >
          {val || "Not provided yet."}
        </Box>
      </Box>
    );
  }

  return (
    <FormControl isInvalid={!!errorText} mb={4}>
      <Flex align="center" gap={2} mb={2}>
        <Icon as={icon} color="orange.400" />
        <FormLabel m={0} fontWeight="600" fontSize="sm">{label}</FormLabel>
      </Flex>
      <Textarea
        value={typeof val === "string" ? val : ""}
        onChange={(e) => handleChange(fieldKey, e.target.value)}
        variant="flushed"
        minH="120px"
        placeholder={placeholder}
        _focus={{ borderColor: "orange.400", boxShadow: "0 1px 0 0 orange.400" }}
      />
      {errorText && <Text fontSize="xs" color="red.500" mt={1}>{errorText}</Text>}
    </FormControl>
  );
}

export const CareerOverviewForm = ({ data = {}, onUpdate, isEditing, fieldErrors = {} }) => {
  const bg = useColorModeValue("white", "gray.700");
  const formData = data || {};

  const handleChange = (field, value) => {
    onUpdate({ ...formData, [field]: value });
  };

  const getError = (camelKey) => {
    const snakeKey = careerFieldSnakeKey(camelKey);
    return (fieldErrors && (fieldErrors[camelKey] || fieldErrors[snakeKey])) || null;
  };

  return (
    <Box className="growth-profile-container" bg={bg} p={{ base: 4, md: 8 }} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.100">
      <Flex className="growth-header" mb={8}>
        <Heading className="growth-title" size="md">
          <Icon as={FaRocket} className="growth-title-icon" />
          Career & Resume Summary
        </Heading>
      </Flex>

      <Box className={!isEditing ? "growth-timeline" : ""}>
        {/* We use a timeline-like structure for the summary sections in view mode */}
        {!isEditing && <Box className="growth-item-dot" top="2.5rem" />}
        
        <VStack spacing={8} align="stretch">
          <CareerField
            label="Brief Summary"
            fieldKey="briefSummary"
            formData={formData}
            handleChange={handleChange}
            isEditing={isEditing}
            errorText={getError("briefSummary")}
            icon={FaRocket}
            placeholder="Introduce yourself in a few sentences..."
          />
          <CareerField
            label="Career Objective"
            fieldKey="careerObjective"
            formData={formData}
            handleChange={handleChange}
            isEditing={isEditing}
            errorText={getError("careerObjective")}
            icon={FaBullseye}
            placeholder="What kind of roles are you looking for?"
          />
          <CareerField
            label="Future Goals"
            fieldKey="futureGoals"
            formData={formData}
            handleChange={handleChange}
            isEditing={isEditing}
            errorText={getError("futureGoals")}
            icon={FaFlag}
            placeholder="Where do you see yourself in 3-5 years?"
          />
          <CareerField
            label="Key Expertise"
            fieldKey="keyExpertise"
            formData={formData}
            handleChange={handleChange}
            isEditing={isEditing}
            icon={FaStar}
            placeholder="List your key technical and soft skills..."
            errorText={getError("keyExpertise")}
          />
          <CareerField
            label="Hobbies & Interests"
            fieldKey="hobbiesInterests"
            formData={formData}
            handleChange={handleChange}
            isEditing={isEditing}
            icon={FaHeart}
            placeholder="What do you enjoy doing in your free time?"
            errorText={getError("hobbiesInterests")}
          />
        </VStack>
      </Box>
    </Box>
  );
};
