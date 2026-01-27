import { Box, Container, Grid, Heading, Text, Link, Stack } from "@chakra-ui/react"

export const Footer = () => {
  return (
    <Box bg="#20343c" color="gray.300" py={12} px={8} w="100%">
      <Box w="full">
        <Grid templateColumns={{ base: "1fr", md: "2fr 1fr 1fr" }} gap={8}>
          <Box>
            <Heading color="#d4a960" mb={4}>CarvU</Heading>
            <Text mb={4} color="whiteAlpha.800">
              Empowering students to achieve their career goals through world-class placement opportunities.
            </Text>
            <Text color="whiteAlpha.600">&copy; {new Date().getFullYear()} Carv U. All rights reserved.</Text>
          </Box>
          
          <Box>
            <Heading size="md" color="#d4a960" mb={4}>Quick Links</Heading>
            <Stack gap={2}>
              <Link href="#" color="white" _hover={{ color: "#d4a960" }}>About Us</Link>
              <Link href="#" color="white" _hover={{ color: "#d4a960" }}>Placement Process</Link>
              <Link href="#" color="white" _hover={{ color: "#d4a960" }}>Recruiters</Link>
              <Link href="#" color="white" _hover={{ color: "#d4a960" }}>Contact Us</Link>
            </Stack>
          </Box>

          <Box>
            <Heading size="md" color="#d4a960" mb={4}>Contact</Heading>
            <Stack gap={2} color="white">
              <Text>Email: placements@carvu.edu</Text>
              <Text>Phone: +91 98765 43210</Text>
              <Text>Address: 123 Education Lane, Tech City</Text>
            </Stack>
          </Box>
        </Grid>
      </Box>
    </Box>
  )
}
