import React from 'react';
import { Box, Heading, Text, Container } from '@chakra-ui/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Companies = () => {
  return (
    <Box>
      <Container maxW="container.xl" py={10}>
        <Heading as="h1" mb={6}>Our Partner Companies</Heading>
        <Text fontSize="lg">
          We collaborate with top-tier companies to provide the best opportunities for our students.
        </Text>
        {/* You can add a list or grid of companies here later */}
      </Container>
    </Box>
  );
};
