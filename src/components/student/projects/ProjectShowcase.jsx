import { Box, SimpleGrid, Card, CardBody, Text, Heading, VStack, HStack, Icon, Button, Image, Badge, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, useDisclosure, Tag, Link } from "@chakra-ui/react";
import { FaExternalLinkAlt, FaGithub, FaStar, FaDownload, FaEye, FaHeart } from "react-icons/fa";
import { useState } from "react";
import { StudentProfileService } from "../../../services/studentProfile.service";

export const ProjectShowcase = ({ projects = [] }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    onOpen();
    if (project.id) {
        StudentProfileService.incrementProjectStats(project.id, 'view');
    }
  };

  const handleLike = async () => {
    if (!selectedProject?.id) return;
    try {
        const res = await StudentProfileService.incrementProjectStats(selectedProject.id, 'like');
        if (res && res.likes !== undefined) {
            setSelectedProject(prev => ({ ...prev, likes: res.likes }));
        }
    } catch (e) {
        console.error("Like failed", e);
    }
  };

  const handleDownload = async () => {
     if (!selectedProject?.id) return;
     try {
        const res = await StudentProfileService.incrementProjectStats(selectedProject.id, 'download');
        if (res && res.downloads !== undefined) {
            setSelectedProject(prev => ({ ...prev, downloads: res.downloads }));
        }
     } catch (e) {
        console.error("Download tracking failed", e);
     }
  };

  if (projects.length === 0) {
    return (
        <Box textAlign="center" py={10} color="gray.500">
            <Text fontSize="lg">No projects to showcase yet.</Text>
            <Text fontSize="sm">Go to "Manage Projects" to add your first project!</Text>
        </Box>
    );
  }

  return (
    <Box p={4}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {projects.map((project, index) => (
          <ShowcaseCard key={index} project={project} onView={() => handleViewDetails(project)} />
        ))}
      </SimpleGrid>

      {/* Project Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader>
            <HStack>
                {selectedProject?.snaps && selectedProject.snaps[0] ? (
                    <Image src={selectedProject.snaps[0]} boxSize="40px" borderRadius="md" objectFit="cover" />
                ) : (
                    <Box boxSize="40px" bg="orange.100" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                         <Icon as={FaStar} color="orange.400" />
                    </Box>
                )}
                <Text>{selectedProject?.title}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedProject && (
                <VStack align="stretch" spacing={6}>
                    {/* Hero Image / Snaps */}
                    {selectedProject.snaps && selectedProject.snaps.length > 0 && (
                        <Box overflowX="auto" whiteSpace="nowrap" pb={2}>
                            <HStack spacing={4}>
                                {selectedProject.snaps.map((snap, i) => (
                                    <Image key={i} src={snap} h="200px" borderRadius="lg" objectFit="cover" shadow="sm" />
                                ))}
                            </HStack>
                        </Box>
                    )}

                    <Box>
                        <Heading size="sm" mb={2}>About this app</Heading>
                        <Text color="gray.600" whiteSpace="pre-wrap">{selectedProject.description}</Text>
                    </Box>

                    {/* Meta Info */}
                    <SimpleGrid columns={2} spacing={4}>
                        <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="bold">RATING</Text>
                            <HStack>
                                <Text fontWeight="bold" fontSize="lg">{selectedProject.selfRating || 5}</Text>
                                <Icon as={FaStar} color="orange.400" />
                            </HStack>
                        </Box>
                         <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="bold">DOWNLOADS</Text>
                            <Text fontWeight="bold" fontSize="lg">{selectedProject.downloads || 0}</Text>
                        </Box>
                        <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="bold">LIKES</Text>
                            <Text fontWeight="bold" fontSize="lg">{selectedProject.likes || 0}</Text>
                        </Box>
                         <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="bold">GENRE</Text>
                            <Text fontWeight="bold">{selectedProject.genre || "Productivity"}</Text>
                        </Box>
                         <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="bold">MENTOR</Text>
                            <Text fontWeight="bold">{selectedProject.mentorName || "N/A"}</Text>
                        </Box>
                    </SimpleGrid>

                    {/* Tech Stack */}
                    <Box>
                         <Heading size="sm" mb={2}>Tech Stack</Heading>
                         <HStack wrap="wrap">
                            {(() => {
                                let skills = [];
                                if (typeof selectedProject.skills === 'string') {
                                    skills = selectedProject.skills.split(',').map(s => s.trim()).filter(Boolean);
                                } else if (Array.isArray(selectedProject.skills)) {
                                    skills = selectedProject.skills;
                                } else if (Array.isArray(selectedProject.technologies)) {
                                    skills = selectedProject.technologies;
                                }
                                return skills.map((skill, i) => (
                                    <Tag key={i} colorScheme="orange" variant="subtle">{skill}</Tag>
                                ));
                            })()}
                         </HStack>
                    </Box>
                </VStack>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50" borderBottomRadius="xl">
             <HStack w="full" spacing={4}>
                <Button
                    flex={1}
                    colorScheme="pink"
                    variant="ghost"
                    leftIcon={<FaHeart />}
                    onClick={handleLike}
                >
                    Like
                </Button>
                {selectedProject?.projectLink && (
                    <Button 
                        as={Link} 
                        href={selectedProject.projectLink} 
                        isExternal 
                        flex={1} 
                        colorScheme="green" 
                        leftIcon={<FaExternalLinkAlt />}
                        _hover={{ textDecoration: 'none' }}
                        onClick={() => handleDownload()}
                    >
                        Live Demo
                    </Button>
                )}
                 {selectedProject?.githubRepo && (
                    <Button 
                        as={Link} 
                        href={selectedProject.githubRepo} 
                        isExternal 
                        flex={1} 
                        variant="outline" 
                        leftIcon={<FaGithub />}
                        _hover={{ textDecoration: 'none' }}
                        onClick={() => handleDownload()}
                    >
                        Source Code
                    </Button>
                )}
             </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

const ShowcaseCard = ({ project, onView }) => {
  // Parse snaps if needed
  const icon = (project.snaps && project.snaps.length > 0) ? project.snaps[0] : null;

  return (
    <Card 
        borderRadius="xl" 
        overflow="hidden" 
        shadow="sm" 
        _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} 
        transition="all 0.2s"
        cursor="pointer"
        onClick={onView}
    >
      <CardBody p={4}>
        <HStack align="start" spacing={4}>
            {icon ? (
                <Image src={icon} boxSize="60px" borderRadius="xl" objectFit="cover" shadow="sm" />
            ) : (
                <Box boxSize="60px" bg="gray.100" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FaStar} boxSize={6} color="gray.400" />
                </Box>
            )}
            
            <VStack align="start" spacing={1} flex={1}>
                <Heading size="sm" noOfLines={1}>{project.title}</Heading>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>{project.genre || "Application"}</Text>
                <HStack spacing={1}>
                    <Text fontSize="xs" fontWeight="bold">{project.selfRating || 5}.0</Text>
                    <Icon as={FaStar} boxSize={3} color="orange.400" />
                    <Text fontSize="xs" color="gray.400">| {project.downloads || 0} installs</Text>
                </HStack>
            </VStack>
        </HStack>
        
        <Text fontSize="sm" color="gray.600" mt={3} noOfLines={2}>
            {project.oneLineDescription || project.description || "No description available."}
        </Text>

        <Button mt={4} w="full" size="sm" variant="outline" colorScheme="orange" onClick={(e) => { e.stopPropagation(); onView(); }}>
            View Details
        </Button>
      </CardBody>
    </Card>
  );
};
