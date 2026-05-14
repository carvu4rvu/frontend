import React from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

function careerFieldSnakeKey(camelKey) {
  if (!camelKey || typeof camelKey !== "string") return "";
  return camelKey.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}

function CareerField({ label, fieldKey, formData, handleChange, isEditing, placeholder, errorText }) {
  const snakeKey = careerFieldSnakeKey(fieldKey);
  const val = formData[fieldKey] ?? formData[snakeKey] ?? "";

  return (
    <FormControl isInvalid={!!errorText}>
      <FormLabel>{label}</FormLabel>
      <Textarea
        value={typeof val === "string" ? val : ""}
        onChange={(e) => handleChange(fieldKey, e.target.value)}
        variant="flushed"
        minH="100px"
        isDisabled={!isEditing}
        _disabled={{ opacity: 1, cursor: "default", bg: "gray.100", px: 2, py: 1, borderRadius: "md", color: "gray.800" }}
        placeholder={placeholder}
      />
      {errorText && <Text fontSize="sm" color="red.500" mt={1}>{errorText}</Text>}
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
    <VStack spacing={6} align="stretch" bg={bg} p={6} borderRadius="lg" boxShadow="sm">
      <CareerField
        label="Brief Summary"
        fieldKey="briefSummary"
        formData={formData}
        handleChange={handleChange}
        isEditing={isEditing}
        errorText={getError("briefSummary")}
      />
      <CareerField
        label="Career Objective"
        fieldKey="careerObjective"
        formData={formData}
        handleChange={handleChange}
        isEditing={isEditing}
        errorText={getError("careerObjective")}
      />
      <CareerField
        label="Future Goals"
        fieldKey="futureGoals"
        formData={formData}
        handleChange={handleChange}
        isEditing={isEditing}
        errorText={getError("futureGoals")}
      />
      <CareerField
        label="Key Expertise"
        fieldKey="keyExpertise"
        formData={formData}
        handleChange={handleChange}
        isEditing={isEditing}
        placeholder="List your key skills and expertise..."
        errorText={getError("keyExpertise")}
      />
      <CareerField
        label="Hobbies & Interests"
        fieldKey="hobbiesInterests"
        formData={formData}
        handleChange={handleChange}
        isEditing={isEditing}
        placeholder="Share your hobbies and interests..."
        errorText={getError("hobbiesInterests")}
      />
    </VStack>
  );
};
