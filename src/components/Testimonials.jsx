import { Box, Container, Heading, SimpleGrid, Text, VStack, Avatar } from "@chakra-ui/react"

const testimonials = [
  {
    name: "Alex Johnson",
    role: "SDE at Google",
    content: "The placement cell provided excellent guidance and support throughout the process. I am grateful for the opportunities.",
    image: ""
  },
  {
    name: "Sarah Williams",
    role: "Analyst at Goldman Sachs",
    content: "Mock interviews and resume building workshops were a game changer. Highly recommend the placement training.",
    image: ""
  },
  {
    name: "Michael Chen",
    role: "SDE at Amazon",
    content: "Getting placed at Amazon was a dream come true. The college placement team made it possible.",
    image: ""
  }
]

export const Testimonials = () => {
  return (
    <Box py={16} bg="white">
      <Container maxW="container.xl">
        <Heading textAlign="center" mb={12} color="#20343c">Student Success Stories</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
          {testimonials.map((t, i) => (
            <VStack 
              key={i} 
              bg="gray.50" 
              p={8} 
              borderRadius="xl" 
              align="start" 
              gap={4}
              shadow="md"
              borderTopWidth="4px"
              borderTopColor="#d4a960"
            >
              <Text fontStyle="italic" color="gray.600">&quot;{t.content}&quot;</Text>
              <Box display="flex" alignItems="center" gap={4}>
                <Avatar name={t.name} src={t.image} />
                <Box>
                  <Text fontWeight="bold" color="#20343c">{t.name}</Text>
                  <Text fontSize="sm" color="#d4a960">{t.role}</Text>
                </Box>
              </Box>
            </VStack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}
