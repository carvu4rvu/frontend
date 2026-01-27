import React from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { Box, Heading, Text, Button, Container, VStack, Icon } from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';

const RouteError = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage = 'An unexpected error occurred.';
  let errorTitle = 'Oops! Something went wrong.';

  if (isRouteErrorResponse(error)) {
    // Handle specific status codes
    if (error.status === 404) {
      errorTitle = 'Page Not Found';
      errorMessage = "We couldn't find the page you're looking for.";
    } else if (error.status === 401) {
      errorTitle = 'Unauthorized';
      errorMessage = "You don't have permission to access this page.";
    } else if (error.status === 503) {
      errorTitle = 'Service Unavailable';
      errorMessage = "Our servers are busy. Please try again later.";
    } else {
      errorMessage = error.statusText || error.data?.message || errorMessage;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  const handleGoHome = () => {
    navigate('/');
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Container maxW="container.md" py={20} centerContent>
      <VStack spacing={6} textAlign="center">
        <Icon as={WarningTwoIcon} w={20} h={20} color="red.500" />
        <Heading as="h1" size="xl" color="gray.700">
          {errorTitle}
        </Heading>
        <Text fontSize="lg" color="gray.600">
          {errorMessage}
        </Text>
        
        {/* Only show detailed error stack in development or if needed */}
        {process.env.NODE_ENV === 'development' && error && (
             <Box p={4} bg="gray.100" borderRadius="md" w="full" textAlign="left" overflowX="auto">
               <Text fontFamily="monospace" fontSize="sm" color="red.600">
                 {error.toString()}
               </Text>
            </Box>
        )}

        <Box>
          <Button colorScheme="teal" onClick={handleReload} mr={4}>
            Reload Page
          </Button>
          <Button variant="outline" onClick={handleGoHome}>
            Go to Home
          </Button>
        </Box>
      </VStack>
    </Container>
  );
};

export default RouteError;
