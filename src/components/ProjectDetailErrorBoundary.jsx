import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { FaChevronLeft } from 'react-icons/fa';
import AdminLayout from './AdminLayout';

/**
 * Error boundary for project detail route.
 * Shows a friendly message when the project fails to load (404, network error, etc.)
 */
export default function ProjectDetailErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const is404 = error?.response?.status === 404 || (error?.message && error.message.includes('404'));

  return (
    <AdminLayout>
      <Box bg="#f0f0f0" minH="100vh" py={12}>
        <Container maxW="md">
          <VStack spacing={6} align="stretch" bg="white" p={8} borderRadius="xl" shadow="md">
            <Heading size="lg" color="gray.800">
              {is404 ? 'Project Not Found' : 'Something went wrong'}
            </Heading>
            <Text color="gray.600">
              {is404
                ? 'The project you are looking for does not exist or has been removed.'
                : error?.message || 'An unexpected error occurred while loading this project.'}
            </Text>
            <Button
              leftIcon={<Box as={FaChevronLeft} />}
              colorScheme="blue"
              onClick={() => navigate('/placement/gallery/manage')}
            >
              Back to Manage Projects
            </Button>
          </VStack>
        </Container>
      </Box>
    </AdminLayout>
  );
}
