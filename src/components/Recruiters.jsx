import { Box, Container, Heading, SimpleGrid, Center, Text } from "@chakra-ui/react"

const companies = [
  "Google", "Microsoft", "Amazon", "Adobe", 
  "Goldman Sachs", "JP Morgan", "Deloitte", "TCS",
  "Infosys", "Wipro", "Accenture", "Capgemini"
]

export const Recruiters = () => {
  return (
    <Box py={16} bg="gray.50">
      <Container maxW="container.xl">
        <Heading textAlign="center" mb={12} color="#20343c">Top Recruiters</Heading>
        <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} gap={8}>
          {companies.map((company) => (
            <Center 
              key={company} 
              bg="white" 
              h="100px" 
              borderRadius="md" 
              shadow="sm"
              borderBottomWidth="4px"
              borderBottomColor="#20343c"
              _hover={{ shadow: "md", transform: "translateY(-2px)", transition: "all 0.2s", borderBottomColor: "#d4a960" }}
            >
              <Text fontWeight="bold" fontSize="lg" color="#20343c">{company}</Text>
            </Center>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}
