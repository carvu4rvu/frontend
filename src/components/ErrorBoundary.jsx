import React from 'react';
import { Box, Heading, Text, Button, Container, VStack, Icon } from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Container maxW="container.md" py={20} centerContent>
          <VStack spacing={6} textAlign="center">
            <Icon as={WarningTwoIcon} w={20} h={20} color="red.500" />
            <Heading as="h1" size="xl" color="gray.700">
              Oops! Something went wrong.
            </Heading>
            <Text fontSize="lg" color="gray.600">
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </Text>
            
            <Box p={4} bg="gray.100" borderRadius="md" w="full" textAlign="left" overflowX="auto">
               <Text fontFamily="monospace" fontSize="sm" color="red.600">
                 {this.state.error && this.state.error.toString()}
               </Text>
            </Box>

            <Box>
              <Button colorScheme="teal" onClick={this.handleReload} mr={4}>
                Reload Page
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                Go to Home
              </Button>
            </Box>
          </VStack>
        </Container>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
