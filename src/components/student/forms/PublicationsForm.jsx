import React, { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Button,
  HStack,
  Input,
  SimpleGrid,
  IconButton,
  Text,
  Card,
  CardBody,
  Collapse,
  Flex,
  Textarea,
  Select,
  useColorModeValue,
  useToast
} from "@chakra-ui/react";
import { Field } from "../../ui/field";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import { StudentProfileService } from "../../../services/studentProfile.service";

export const PublicationsForm = ({ data = {}, onUpdate, isEditing = false }) => {
  const items = Array.isArray(data) ? data : (data.publications || []);
  const bg = useColorModeValue("white", "gray.700");
  const toast = useToast();
  const { user } = useAuth();
  const usn = user?.usn;

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate(newItems);
  };

  const handleAdd = () => {
    onUpdate([
      ...items,
      {
        title: "",
        publicationName: "",
        publicationType: "",
        publicationDate: "",
        authorCount: "",
        mentorName: "",
        skills: "",
        evidenceDocument: "",
        description: ""
      }
    ]);
  };

  const handleDelete = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate(newItems);
  };

  const handleUpload = async (index, file) => {
    if (!file || !usn) return;
    try {
      const result = await StudentProfileService.uploadFile(usn, file, { folder: "publications" });
      const url = result?.url || result?.path;
      if (url) {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], evidenceDocument: url };
        onUpdate(newItems);
        toast({
          status: "success",
          description: "File uploaded",
          duration: 3000,
          isClosable: true
        });
      }
    } catch (e) {
      console.error("Error uploading publication file:", e);
      toast({
        status: "error",
        description: "File upload failed",
        duration: 4000,
        isClosable: true
      });
    }
  };

  return (
    <Box bg={bg} p={8} borderRadius="xl" shadow="sm">
      <Heading size="lg" mb={6} color="#20343c">Publications</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <PublicationItem 
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
            Add Publication
          </Button>
        )}

        {items.length === 0 && (
            <Box p={8} textAlign="center" color="gray.500" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No publications added yet.
            </Box>
        )}
      </VStack>
    </Box>
  );
};

const PublicationItem = ({ index, item, onChange, onDelete, isEditing }) => {
  const [isOpen, setIsOpen] = useState(true);
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Card variant="outline" borderColor={borderColor} borderRadius="lg" bg={useColorModeValue("gray.50", "gray.800")}>
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
            <HStack onClick={() => setIsOpen(!isOpen)} cursor="pointer" flex={1}>
                <Heading size="sm" color="blue.600">
                    {item.title || "New Publication"}
                </Heading>
                <Text fontSize="xs" color="gray.500">
                    {item.publicationName || "Publication Name"}
                </Text>
                {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </HStack>
            {isEditing && (
                <IconButton 
                    size="sm" 
                    variant="ghost" 
                    colorScheme="red" 
                    aria-label="Delete" 
                    onClick={() => onDelete(index)}
                >
                    <FaTrash />
                </IconButton>
            )}
        </Flex>

        <Collapse in={isOpen}>
            <VStack gap={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Field label="Title (Required)" required>
                        <Input 
                            value={item.title || ""} 
                            onChange={(e) => onChange(index, "title", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="e.g. AI in Healthcare"
                        />
                    </Field>
                    <Field label="Journal/Conference Name">
                        <Input 
                            value={item.publicationName || ""} 
                            onChange={(e) => onChange(index, "publicationName", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="e.g. IEEE Transactions"
                        />
                    </Field>
                    <Field label="Publication Type (Required)" required>
                        <Select 
                            value={item.publicationType || ""} 
                            onChange={(e) => onChange(index, "publicationType", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            placeholder="Select Type"
                        >
                            <option value="Journal">Journal</option>
                            <option value="Conference">Conference</option>
                            <option value="Book Chapter">Book Chapter</option>
                            <option value="Other">Other</option>
                        </Select>
                    </Field>
                    <Field label="Author Count">
                        <Input 
                            type="number"
                            value={item.authorCount || ""} 
                            onChange={(e) => onChange(index, "authorCount", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                            min={1}
                        />
                    </Field>
                    <Field label="Mentor Name">
                        <Input 
                            value={item.mentorName || ""} 
                            onChange={(e) => onChange(index, "mentorName", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                        />
                    </Field>
                    <Field label="Skills">
                        <Input 
                            value={item.skills || ""} 
                            onChange={(e) => onChange(index, "skills", e.target.value)} 
                            variant="flushed"
                            placeholder="e.g. Research, Writing"
                            isDisabled={!isEditing}
                        />
                    </Field>
                    <Field label="Publication Date">
                        <Input 
                            type="date"
                            value={item.publicationDate || ""} 
                            onChange={(e) => onChange(index, "publicationDate", e.target.value)} 
                            variant="flushed"
                            isDisabled={!isEditing}
                        />
                    </Field>
                    <Field label="Evidence Document">
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
                            value={item.evidenceDocument || ""} 
                            onChange={(e) => onChange(index, "evidenceDocument", e.target.value)} 
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
                    />
                </Field>
            </VStack>
        </Collapse>
      </CardBody>
    </Card>
  );
};
