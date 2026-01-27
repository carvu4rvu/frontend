/**
 * Component: ProjectsForm
 * 
 * Fields (Repeatable):
 * - title (Text, Required)
 * - description (Textarea)
 * - skills (Text, Comma separated)
 * - projectLink (Url)
 * - snaps (Array of Urls)
 * - mentorName (Text)
 * 
 * Validation:
 * - title: Required
 * 
 * API Contracts:
 * - GET /api/student/profile/projects
 * - POST /api/student/profile/projects
 */

import { Box, VStack, Heading, Button, HStack, Input, SimpleGrid, IconButton, Text, Card, CardBody, Collapse, Flex, Textarea, useToast, Image, Link, Icon, Center, AspectRatio, Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from "@chakra-ui/react"
import { Field } from "../../ui/field"
import { useState, useRef } from "react"
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaUpload, FaExternalLinkAlt, FaImage, FaGithub, FaLink } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"
import { StudentProfileService } from "../../../services/studentProfile.service"

export const ProjectsForm = ({ data = {}, onUpdate, isEditing = false }) => {
  // Ensure we handle data as array (similar to Academics/Education)
  const items = Array.isArray(data) ? data : (data.projects || [])
  const { user } = useAuth();
  const usn = user?.usn;
  const toast = useToast();

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
        oneLineDescription: "",
        description: "",
        skills: "",
        projectLink: "",
        githubRepo: "",
        snaps: [], // Default to array
        mentorName: "",
        genre: "",
        visibility: "PRIVATE",
        selfRating: 5
      }
    ])
  }

  const handleDelete = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate(newItems)
  }

  return (
    <Box bg="white" p={8} borderRadius="xl" shadow="sm">
      <Heading size="lg" mb={6} color="#20343c">Projects</Heading>
      
      <VStack spacing={6} align="stretch">
        {items.map((item, index) => (
          <ProjectItem 
            key={index} 
            index={index} 
            item={item} 
            onChange={handleChange} 
            onDelete={handleDelete}
            isEditing={isEditing} 
            usn={usn}
            toast={toast}
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
            size="lg"
            w="full"
            borderStyle="dashed"
            >
            Add Project
            </Button>
        )}
        
        {items.length === 0 && (
            <Box p={8} textAlign="center" color="gray.500" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No projects added yet.
            </Box>
        )}
      </VStack>
    </Box>
  )
}

const ProjectItem = ({ index, item, onChange, onDelete, isEditing, usn, toast }) => {
  const [isOpen, setIsOpen] = useState(true)
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  // Normalize snaps to array
  const snaps = Array.isArray(item.snaps) 
    ? item.snaps 
    : (item.snaps ? [item.snaps] : []);

  const handleUploadSnap = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (snaps.length >= 4) {
        toast({ title: "Max 4 snaps allowed", status: "warning", duration: 3000, isClosable: true });
        return;
    }

    setUploading(true);
    try {
        const result = await StudentProfileService.uploadFile(usn, file, { folder: "projects" });
        const url = result?.url || result?.path;
        if (url) {
            const newSnaps = [...snaps, url];
            onChange(index, "snaps", newSnaps);
            toast({ status: "success", title: "Image uploaded", duration: 2000 });
        }
    } catch (error) {
        console.error("Upload failed:", error);
        toast({ status: "error", title: "Upload failed", description: "Please try again.", duration: 3000 });
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleRemoveSnap = (snapIndex) => {
    const newSnaps = snaps.filter((_, i) => i !== snapIndex);
    onChange(index, "snaps", newSnaps);
  }

  return (
    <Card 
        variant="outline" 
        borderColor="gray.200" 
        overflow="hidden"
        transition="all 0.2s"
        _hover={{ shadow: 'md', borderColor: 'gray.300' }}
    >
      <CardBody p={0}>
        <Flex 
            justify="space-between" 
            align="center" 
            p={4} 
            bg="gray.50" 
            borderBottomWidth={isOpen ? "1px" : "0"}
            borderColor="gray.100"
            cursor="pointer"
            onClick={() => setIsOpen(!isOpen)}
        >
            <HStack spacing={3}>
                <Box p={2} bg="white" borderRadius="md" shadow="sm" color="orange.400">
                    <FaExternalLinkAlt />
                </Box>
                <Text fontWeight="bold" fontSize="md" color="gray.700">
                    {item.title || `Project ${index + 1}`}
                </Text>
            </HStack>
            <HStack>
                {isOpen ? <FaChevronUp color="gray.500" /> : <FaChevronDown color="gray.500" />}
                {isEditing && (
                    <IconButton 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="red"
                        aria-label="Delete" 
                        icon={<FaTrash />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(index);
                        }}
                    />
                )}
            </HStack>
        </Flex>

        <Collapse in={isOpen}>
            <VStack p={6} spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Field label="Project Title" required>
                        <Input 
                            value={item.title || ""} 
                            onChange={(e) => onChange(index, "title", e.target.value)} 
                            variant="filled"
                            bg="gray.50"
                            _focus={{ bg: "white", borderColor: "orange.400" }}
                            isDisabled={!isEditing} 
                            placeholder="e.g. E-Commerce Website"
                        />
                    </Field>
                    
                    <Field label="One Line Description (Pitch)" required>
                         <Input 
                            value={item.oneLineDescription || ""} 
                            onChange={(e) => onChange(index, "oneLineDescription", e.target.value)} 
                            variant="filled"
                            bg="gray.50"
                            _focus={{ bg: "white", borderColor: "orange.400" }}
                            isDisabled={!isEditing} 
                            placeholder="Short pitch (e.g. A marketplace for books)"
                            maxLength={150}
                        />
                    </Field>

                    <Field label="Mentor Name">
                        <Input 
                            value={item.mentorName || ""} 
                            onChange={(e) => onChange(index, "mentorName", e.target.value)} 
                            variant="filled"
                            bg="gray.50"
                            _focus={{ bg: "white", borderColor: "orange.400" }}
                            isDisabled={!isEditing}
                            placeholder="e.g. Dr. Smith"
                        />
                    </Field>
                    
                    <Field label="Genre">
                        <Input 
                            value={item.genre || ""} 
                            onChange={(e) => onChange(index, "genre", e.target.value)} 
                            variant="filled"
                            bg="gray.50"
                            _focus={{ bg: "white", borderColor: "orange.400" }}
                            isDisabled={!isEditing}
                            placeholder="e.g. Web Dev, AI, Mobile App"
                        />
                    </Field>

                    <Field label="Technologies">
                        <Input 
                            placeholder="React, Node.js, MongoDB"
                            value={item.skills || ""} 
                            onChange={(e) => onChange(index, "skills", e.target.value)} 
                            variant="filled"
                            bg="gray.50"
                            _focus={{ bg: "white", borderColor: "orange.400" }}
                            isDisabled={!isEditing} 
                        />
                    </Field>
                    
                    <Field label="Visibility">
                         <Select 
                            value={item.visibility || "PRIVATE"} 
                            onChange={(e) => onChange(index, "visibility", e.target.value)} 
                            variant="filled"
                            bg="gray.50"
                            _focus={{ bg: "white", borderColor: "orange.400" }}
                            isDisabled={!isEditing}
                        >
                            <option value="PRIVATE">Private</option>
                            <option value="PUBLIC">Public</option>
                        </Select>
                    </Field>

                    <Field label="Hosted Link / Live Demo">
                        <Input 
                            value={item.projectLink || ""} 
                            onChange={(e) => onChange(index, "projectLink", e.target.value)} 
                            variant="filled"
                            bg="gray.50"
                            _focus={{ bg: "white", borderColor: "orange.400" }}
                            isDisabled={!isEditing}
                            placeholder="https://..."
                        />
                    </Field>
                    
                    <Field label="GitHub Repo">
                        <Input 
                            value={item.githubRepo || ""} 
                            onChange={(e) => onChange(index, "githubRepo", e.target.value)} 
                            variant="filled"
                            bg="gray.50"
                            _focus={{ bg: "white", borderColor: "orange.400" }}
                            isDisabled={!isEditing}
                            placeholder="https://github.com/..."
                        />
                    </Field>

                     <Field label="Self Rating (1-10)">
                        <NumberInput 
                            value={item.selfRating || 5} 
                            min={1} 
                            max={10} 
                            onChange={(val) => onChange(index, "selfRating", val)}
                            variant="filled"
                            bg="gray.50"
                            isDisabled={!isEditing}
                        >
                            <NumberInputField _focus={{ bg: "white", borderColor: "orange.400" }} />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </Field>

                </SimpleGrid>
                
                {/* Snaps Section */}
                <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.700">
                        Project Snaps ({snaps.length}/4)
                    </Text>
                    
                    <SimpleGrid columns={{ base: 2, sm: 4 }} gap={4}>
                        {snaps.map((url, i) => (
                            <AspectRatio key={i} ratio={16/9} w="full">
                                <Box 
                                    position="relative" 
                                    borderRadius="lg" 
                                    overflow="hidden" 
                                    border="1px solid" 
                                    borderColor="gray.200"
                                    shadow="sm"
                                    role="group"
                                >
                                    <Image src={url} alt={`Snap ${i+1}`} objectFit="cover" w="full" h="full" fallbackSrc="https://via.placeholder.com/150" />
                                    <Box 
                                        position="absolute" 
                                        inset={0} 
                                        bg="blackAlpha.300" 
                                        opacity={0} 
                                        _groupHover={{ opacity: 1 }} 
                                        transition="opacity 0.2s" 
                                    />
                                    {isEditing && (
                                        <IconButton
                                            icon={<FaTrash />}
                                            size="xs"
                                            colorScheme="red"
                                            position="absolute"
                                            top={2}
                                            right={2}
                                            onClick={() => handleRemoveSnap(i)}
                                            aria-label="Remove snap"
                                            opacity={0}
                                            _groupHover={{ opacity: 1 }}
                                        />
                                    )}
                                    <Link href={url} isExternal position="absolute" bottom={2} right={2} color="white" opacity={0} _groupHover={{ opacity: 1 }}>
                                        <FaExternalLinkAlt />
                                    </Link>
                                </Box>
                            </AspectRatio>
                        ))}
                        
                        {isEditing && snaps.length < 4 && (
                            <AspectRatio ratio={16/9} w="full">
                                <Button
                                    variant="outline"
                                    borderStyle="dashed"
                                    borderWidth="2px"
                                    borderColor="gray.300"
                                    color="gray.500"
                                    h="full"
                                    w="full"
                                    flexDirection="column"
                                    gap={2}
                                    _hover={{ borderColor: "orange.400", color: "orange.400", bg: "orange.50" }}
                                    onClick={() => fileInputRef.current.click()}
                                    isLoading={uploading}
                                >
                                    <FaUpload size={20} />
                                    <Text fontSize="xs">Upload Snap</Text>
                                </Button>
                            </AspectRatio>
                        )}
                    </SimpleGrid>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/*,application/pdf"
                        onChange={handleUploadSnap}
                    />
                </Box>

                <Field label="Full Description">
                    <Textarea 
                        value={item.description || ""} 
                        onChange={(e) => onChange(index, "description", e.target.value)} 
                        variant="filled"
                        bg="gray.50"
                        _focus={{ bg: "white", borderColor: "orange.400" }}
                        rows={3}
                        isDisabled={!isEditing}
                        placeholder="Detailed description of your project..."
                    />
                </Field>
            </VStack>
        </Collapse>
      </CardBody>
    </Card>
  )
}
