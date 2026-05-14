import { Box, Button, Container, Heading, Text, Stack, Image } from "@chakra-ui/react"
import { Link as RouterLink } from "react-router-dom"

export const Hero = () => {
  return (
    <Box bg="gray.50" py={20}>
      <Container maxW="container.xl">
        <Stack direction={{ base: "column", md: "row" }} alignItems="center" gap={10}>
          <Box flex={1}>
            <Heading size="3xl" mb={4} color="#20343c">
              Launch Your Career with Top Companies
            </Heading>
            <Text fontSize="xl" color="gray.600" mb={8}>
              CarvU connects talented students with world-class recruiters. 
              Get placed in your dream company today.
            </Text>
            <Stack direction="row" gap={4}>
              <Button as={RouterLink} to="/register" size="lg" bg="#20343c" color="white" _hover={{ bg: "#1a2b32" }}>
                Register Now
              </Button>
              <Button as={RouterLink} to="/login" size="lg" variant="outline" borderColor="#20343c" color="#20343c" _hover={{ bg: "#20343c", color: "white" }}>
                Login
              </Button>
            </Stack>
          </Box>
          <Box flex={1} display="flex" justifyContent="center">
            <Image 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80" 
              alt="Students" 
              borderRadius="xl"
              boxShadow="2xl"
              maxH="400px"
              objectFit="cover"
              borderColor="#d4a960"
              borderWidth="2px"
            />
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
