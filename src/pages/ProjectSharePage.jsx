import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  Image,
  VStack,
  HStack,
  Badge,
  Link,
  Icon,
} from '@chakra-ui/react';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
import { ProjectService } from '../services/project.service';
import { getFileUrl } from '../utils/fileUrl';

const ProjectSharePage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await ProjectService.getByShareToken(token);
        // Normalize snaps from assets -> project_snaps for display
        const snaps =
          Array.isArray(data?.assets) && data.assets.length
            ? data.assets
                .map((a) => a.original_url)
                .filter((u) => u && typeof u === 'string')
            : [];
        setProject({
          ...data,
          project_snaps: snaps,
        });
      } catch (e) {
        setError(e.message || 'Invalid or expired share link.');
        setProject(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <Center minH="80vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (error || !project) {
    return (
      <Center minH="80vh">
        <Box textAlign="center">
          <Heading size="md" mb={2}>
            Project not available
          </Heading>
          <Text color="gray.600">{error || 'This shared project link is invalid or has expired.'}</Text>
        </Box>
      </Center>
    );
  }

  const snaps = project.project_snaps || [];
  const hero = snaps[0] || null;

  return (
    <Box bg="gray.50" minH="100vh" py={10}>
      <Container maxW="4xl">
        <Box bg="white" borderRadius="xl" shadow="lg" overflow="hidden">
          {hero && (
            <Box h={{ base: '200px', md: '260px' }} overflow="hidden">
              <Image
                src={getFileUrl(hero)}
                w="100%"
                h="100%"
                objectFit="cover"
                alt=""
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Box>
          )}
          <Box p={6}>
            <VStack align="start" spacing={4}>
              <HStack spacing={3}>
                <Badge colorScheme="purple" textTransform="uppercase" fontSize="0.65rem" letterSpacing="wide">
                  Shared project
                </Badge>
                {project.category && <Badge variant="subtle">{project.category}</Badge>}
                {project.visibility && <Badge variant="outline">{project.visibility}</Badge>}
              </HStack>
              <Heading size="lg">{project.title || 'Untitled project'}</Heading>
              <Text fontSize="md" color="gray.700">
                {project.short_description || project.description || 'No description provided.'}
              </Text>
              {snaps.length > 1 && (
                <Box pt={2}>
                  <HStack spacing={3} overflowX="auto">
                    {snaps.slice(1).map((snap, i) => (
                      <Image
                        key={i}
                        src={getFileUrl(snap)}
                        boxSize="120px"
                        borderRadius="lg"
                        objectFit="cover"
                        alt=""
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ))}
                  </HStack>
                </Box>
              )}
              {project.description && (
                <Box pt={2}>
                  <Heading size="sm" mb={1}>
                    Details
                  </Heading>
                  <Text color="gray.700" whiteSpace="pre-wrap">
                    {project.description}
                  </Text>
                </Box>
              )}
              <HStack spacing={4} pt={2}>
                {project.hosted_url && (
                  <Link href={project.hosted_url} isExternal>
                    <HStack spacing={1} color="green.600">
                      <Icon as={FaExternalLinkAlt} />
                      <Text>Live demo</Text>
                    </HStack>
                  </Link>
                )}
                {project.github_url && (
                  <Link href={project.github_url} isExternal>
                    <HStack spacing={1} color="gray.700">
                      <Icon as={FaGithub} />
                      <Text>Source code</Text>
                    </HStack>
                  </Link>
                )}
              </HStack>
            </VStack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ProjectSharePage;

