import { Box, Container, Heading, Text, VStack, SimpleGrid, Icon, Flex } from "@chakra-ui/react"
import { FaUniversity, FaGraduationCap, FaHandshake } from "react-icons/fa"

export const About = () => {
  return (
    <Box py={20} bg="gray.50">
      <Container maxW="container.xl">
        <VStack spacing={12} align="stretch">
          <Box textAlign="center">
            <Heading color="#20343c" mb={4} size="2xl">About Carv U</Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto">
              Bridging the gap between academic excellence and industry requirements.
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <Feature 
              icon={FaUniversity} 
              title="Our Legacy" 
              text="With over 20 years of excellence in education, CarvU has established itself as a premier institution for engineering and management studies."
            />
            <Feature 
              icon={FaGraduationCap} 
              title="Student Focus" 
              text="We prioritize holistic development, ensuring our students are not just academically proficient but also industry-ready professionals."
            />
            <Feature 
              icon={FaHandshake} 
              title="Industry Relations" 
              text="Our strong network with top-tier companies facilitates seamless campus recruitment and internship opportunities for our students."
            />
          </SimpleGrid>

          <Box bg="white" p={10} borderRadius="xl" shadow="lg" borderLeft="4px solid" borderColor="#d4a960">
            <Heading size="lg" color="#20343c" mb={6}>Vision & Mission</Heading>
            <VStack align="start" spacing={4}>
              <Text color="gray.700">
                <Text as="span" fontWeight="bold" color="#20343c">Vision:</Text> To be a globally recognized center of excellence in technical education and research.
              </Text>
              <Text color="gray.700">
                <Text as="span" fontWeight="bold" color="#20343c">Mission:</Text> To provide quality education, foster innovation, and groom students into ethical leaders who contribute to society.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

const Feature = ({ icon, title, text }) => {
  return (
    <Flex direction="column" align="center" textAlign="center" bg="white" p={8} borderRadius="xl" shadow="md" _hover={{ transform: "translateY(-5px)", shadow: "xl" }} transition="all 0.3s">
      <Icon as={icon} w={12} h={12} color="#d4a960" mb={6} />
      <Heading size="md" color="#20343c" mb={4}>{title}</Heading>
      <Text color="gray.600">{text}</Text>
    </Flex>
  )
}
