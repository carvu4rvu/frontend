import { Box, Container, Grid, Heading, Text, VStack } from "@chakra-ui/react"

const StatItem = ({ number, label }) => (
  <VStack bg="white" p={6} borderRadius="lg" shadow="md" borderWidth="1px" borderColor="#d4a960">
    <Heading size="3xl" color="#20343c">{number}</Heading>
    <Text fontSize="lg" fontWeight="medium" color="#d4a960">{label}</Text>
  </VStack>
)

export const Stats = () => {
  return (
    <Box py={16} bg="white">
      <Container maxW="container.xl">
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={8}>
          <StatItem number="95%" label="Placement Rate" />
          <StatItem number="500+" label="Recruiters" />
          <StatItem number="45 LPA" label="Highest Package" />
          <StatItem number="12 LPA" label="Average Package" />
        </Grid>
      </Container>
    </Box>
  )
}
