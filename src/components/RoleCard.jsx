import { Box, VStack, Heading, Icon as ChakraIcon } from "@chakra-ui/react"

export const RoleCard = ({ title, icon, onClick }) => (
    <Box 
        as="button" 
        onClick={onClick}
        p={4} 
        borderWidth="1px" 
        borderRadius="xl" 
        borderColor="gray.200"
        _hover={{ borderColor: "#d4a960", shadow: "sm", transform: "translateY(-1px)" }}
        transition="all 0.2s"
        textAlign="center"
        bg="gray.50"
        width="full"
        cursor="pointer"
    >
        <VStack gap={3}>
            <Box color="#20343c" p={2} bg="white" borderRadius="full" shadow="sm">
                <ChakraIcon as={icon} w={5} h={5} />
            </Box>
            <Heading size="xs" color="#20343c">{title}</Heading>
        </VStack>
    </Box>
)
