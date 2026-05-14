import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import PixelCard from '../PixelCard';

export const PageTemplate = ({ title, description, children }) => (
  <Box>
      <PixelCard variant="default" gap={10} speed={40} colors="#d4a960,#e2b975,#f0c98a">
        <Box p={8} bg="white" borderRadius="xl" shadow="xl" minH="60vh">
          <VStack align="start" spacing={6} w="full">
            <Box borderBottom="2px solid" borderColor="#d4a960" pb={2} pr={10} w="full">
                 <Heading size="lg" color="#20343c">{title}</Heading>
                 {description && <Text mt={2} color="gray.600" fontSize="md">{description}</Text>}
            </Box>
            
            <Box w="full">
              {children || (
                <Text color="gray.500" fontSize="lg" fontStyle="italic">
                  This section is currently under development. Please check back later.
                </Text>
              )}
            </Box>
          </VStack>
        </Box>
      </PixelCard>
    </Box>
);

export default PageTemplate;
