import { Box, Heading, Text, VStack, List, ListItem, ListIcon, Divider, Spinner, Link } from "@chakra-ui/react"
import { Link as RouterLink } from "react-router-dom"
import { usePlacementTrackPolicy } from "../../../context/PlacementTrackPolicyContext"
import { FaCheckCircle, FaInfoCircle } from "react-icons/fa"

export const StudentPlacementPolicy = () => {
  const { policy: batchPolicy, loading: policyLoading } = usePlacementTrackPolicy()
  /** Show opt-in option only when student is individually marked as eligible for placement or capstone */
  const canOptIn = Boolean(batchPolicy && (batchPolicy.is_placement_eligible === true || batchPolicy.is_capstone_eligible === true))

  return (
      <Box bg="white" p={8} borderRadius="xl" shadow="sm" minH="80vh">
        <Heading size="lg" color="#20343c" mb={6}>Placement Policy</Heading>

        {policyLoading ? (
          <Box py={4}>
            <Spinner size="sm" color="#d4a960" mr={2} />
            <Text as="span" fontSize="sm" color="gray.700">Checking your batch policy…</Text>
          </Box>
        ) : (
          <Box bg="blue.50" p={4} borderRadius="md" borderLeft="4px solid" borderColor="blue.400" mb={6}>
            <Text fontSize="sm" color="blue.800" mb={2}>
              This is the official placement policy. When you opt in to placement from your Personal profile, you confirm that you have read and agree to this policy.
            </Text>
            {canOptIn ? (
              <Text fontSize="sm" color="blue.800">
                Your batch allows Placement or Capstone track. You can opt in from your{" "}
                <Link as={RouterLink} to="/student/profile/personal" color="#d4a960" fontWeight="medium">Personal profile</Link>.
              </Text>
            ) : (
              <Text fontSize="sm" color="blue.700">
                Placement opt-in is available from your Personal profile only when your batch academic policy allows Placement or Capstone track. Contact your placement cell if you believe you are eligible.
              </Text>
            )}
          </Box>
        )}
        
        <VStack align="stretch" spacing={6}>
          <Box>
            <Heading size="md" color="gray.700" mb={3}>1. Eligibility Criteria</Heading>
            <List spacing={3}>
              <ListItem display="flex" alignItems="start">
                <ListIcon as={FaCheckCircle} color="green.500" mt={1} />
                <Text>Students must have a minimum CGPA of 6.0 with no active backlogs to register for placement drives.</Text>
              </ListItem>
              <ListItem display="flex" alignItems="start">
                <ListIcon as={FaCheckCircle} color="green.500" mt={1} />
                <Text>Minimum 75% attendance is required in all training sessions and workshops conducted by the placement cell.</Text>
              </ListItem>
              <ListItem display="flex" alignItems="start">
                <ListIcon as={FaCheckCircle} color="green.500" mt={1} />
                <Text>Students must clear the internal assessments conducted before the placement season.</Text>
              </ListItem>
            </List>
          </Box>

          <Divider />

          <Box>
            <Heading size="md" color="gray.700" mb={3}>2. Registration & Participation</Heading>
            <List spacing={3}>
              <ListItem display="flex" alignItems="start">
                <ListIcon as={FaInfoCircle} color="blue.500" mt={1} />
                <Text>Registration for each company drive is mandatory. Students who register but do not appear for the process will be debarred from the next 2 opportunities.</Text>
              </ListItem>
              <ListItem display="flex" alignItems="start">
                <ListIcon as={FaInfoCircle} color="blue.500" mt={1} />
                <Text>Students must be in formal attire for all placement related activities.</Text>
              </ListItem>
            </List>
          </Box>

          <Divider />

          <Box>
            <Heading size="md" color="gray.700" mb={3}>3. Job Offers</Heading>
            <List spacing={3}>
              <ListItem display="flex" alignItems="start">
                <ListIcon as={FaCheckCircle} color="green.500" mt={1} />
                <Text>One Student, One Offer policy: Once a student receives a job offer (above 5 LPA), they are considered placed and cannot apply for further companies.</Text>
              </ListItem>
              <ListItem display="flex" alignItems="start">
                <ListIcon as={FaCheckCircle} color="green.500" mt={1} />
                <Text>Dream Offer: Placed students can apply for "Dream Companies" offering a package at least 1.5x of their current offer.</Text>
              </ListItem>
            </List>
          </Box>

          <Divider />

          <Box bg="orange.50" p={4} borderRadius="md" borderLeft="4px solid" borderColor="orange.400">
             <Heading size="sm" color="orange.800" mb={2}>Important Note</Heading>
             <Text fontSize="sm" color="orange.700">
               The Placement Cell reserves the right to modify these policies. Students are advised to check the notice board and this portal regularly for updates.
             </Text>
          </Box>

        </VStack>
      </Box>
  )
}
