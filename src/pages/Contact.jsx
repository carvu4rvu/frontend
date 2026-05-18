import { Box, Heading, Text, VStack, Container, SimpleGrid, FormControl, FormLabel, Input, Textarea, Button, Icon, HStack } from '@chakra-ui/react';
import { EmailIcon, PhoneIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
  return (
    <Box py={20} bg="gray.50">
      <Container maxW="container.xl">
        <VStack spacing={10}>
          <Box textAlign="center">
            <Heading as="h1" size="2xl" color="#20343c" mb={4}>Get in Touch</Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} w="full">
            {/* Contact Info */}
            <Box bg="#20343c" color="white" p={10} borderRadius="xl" shadow="lg">
              <VStack align="start" spacing={8}>
                <Heading size="lg" color="#d4a960">Contact Information</Heading>
                
                <HStack spacing={4}>
                  <Icon as={EmailIcon} w={6} h={6} color="#d4a960" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Email</Text>
                    <Text color="gray.300">placements@carvu.edu</Text>
                  </VStack>
                </HStack>

                <HStack spacing={4}>
                  <Icon as={PhoneIcon} w={6} h={6} color="#d4a960" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Phone</Text>
                    <Text color="gray.300">+91 98765 43210</Text>
                  </VStack>
                </HStack>

                <HStack spacing={4}>
                  <Icon as={FaMapMarkerAlt} w={6} h={6} color="#d4a960" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Address</Text>
                    <Text color="gray.300">123 Education Lane, Tech City, India</Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>

            {/* Contact Form */}
            <Box bg="white" p={10} borderRadius="xl" shadow="lg">
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input placeholder="Your Name" focusBorderColor="#d4a960" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" placeholder="your.email@example.com" focusBorderColor="#d4a960" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Message</FormLabel>
                  <Textarea placeholder="How can we help you?" rows={6} focusBorderColor="#d4a960" />
                </FormControl>
                <Button 
                  w="full" 
                  bg="#20343c" 
                  color="white" 
                  _hover={{ bg: "#2c4550" }}
                  size="lg"
                >
                  Send Message
                </Button>
              </VStack>
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default Contact;
