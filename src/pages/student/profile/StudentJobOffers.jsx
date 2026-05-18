import { useState } from "react"
import { Box, Heading, Text, VStack, Spinner, Badge, HStack, Card, CardBody, Stack, Divider, SimpleGrid, Icon, Tabs, TabList, TabPanels, Tab, TabPanel, Button, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, useDisclosure, Textarea, FormControl, FormLabel } from "@chakra-ui/react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaCheckCircle, FaBriefcase, FaMoneyBillWave, FaBuilding, FaTimesCircle, FaClock } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"
import { usePlacementTrackPolicy } from "../../../context/PlacementTrackPolicyContext"
import { useStudentDataCache } from "../../../context/StudentDataCacheContext"
import { PlacementService } from "../../../services/placement.service"

export const StudentJobOffers = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { policy, loading: policyLoading } = usePlacementTrackPolicy();
  const { cache, loading, clearCache, fetchJobOffers } = useStudentDataCache();
  const { user, loading: authLoading } = useAuth();
  const { isOpen: isAcceptOpen, onOpen: onAcceptOpen, onClose: onAcceptClose } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
  const [decisionOffer, setDecisionOffer] = useState(null);
  const [rejectRemark, setRejectRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const offers = Array.isArray(cache.jobOffers?.list) ? cache.jobOffers.list : [];
  const studentUSN = user?.usn;
  const isLoading = !cache.jobOffers.loaded && loading.jobOffers;

  useEffect(() => {
    if (policyLoading) return;
    if (policy && policy.opt_in !== true) {
      navigate("/student/profile/personal", { replace: true });
    }
  }, [policy, policyLoading, navigate]);

  useEffect(() => {
    if (authLoading) return;
    if (studentUSN && policy?.opt_in === true) {
      clearCache('jobOffers');
      fetchJobOffers(studentUSN);
    }
  }, [studentUSN, authLoading, policy?.opt_in, clearCache, fetchJobOffers]);

  // Wait for policy; redirect if not opted in (handled in useEffect)
  if (policyLoading || (policy && policy.opt_in !== true)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="xl" color="#d4a960" />
      </Box>
    );
  }

  if (authLoading || (isLoading && studentUSN)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="xl" color="#d4a960" />
      </Box>
    );
  }

  const getStatusConfig = (offer) => {
    if (offer.is_accepted === true) return { color: 'green', icon: FaCheckCircle, label: 'Offer Accepted' };
    if (offer.is_accepted === false) return { color: 'red', icon: FaTimesCircle, label: 'Offer Declined' };
    const s = String(offer.offer_letter_status || '').trim();
    switch (s) {
      case 'Accepted':
        return { color: 'green', icon: FaCheckCircle, label: 'Offer Accepted' };
      case 'Rejected':
        return { color: 'red', icon: FaTimesCircle, label: 'Offer Declined' };
      case 'Pending':
      case 'Released':
        return { color: 'orange', icon: FaClock, label: s === 'Released' ? 'Released' : 'Offer Pending' };
      default:
        return { color: 'gray', icon: FaBriefcase, label: s || '—' };
    }
  };

  const isPendingDecision = (offer) => offer.is_accepted == null;

  const handleAcceptClick = (offer) => {
    setDecisionOffer(offer);
    onAcceptOpen();
  };

  const handleRejectClick = (offer) => {
    setDecisionOffer(offer);
    setRejectRemark("");
    onRejectOpen();
  };

  const handleConfirmAccept = async () => {
    if (!decisionOffer || !studentUSN) return;
    setSubmitting(true);
    try {
      await PlacementService.submitOfferDecision(decisionOffer.id, true);
      toast({ title: "Offer accepted", status: "success", isClosable: true });
      onAcceptClose();
      setDecisionOffer(null);
      clearCache("jobOffers");
      await fetchJobOffers(studentUSN);
    } catch (err) {
      toast({ title: err?.message || "Failed to accept offer", status: "error", isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!decisionOffer || !studentUSN) return;
    const remark = (rejectRemark || "").trim();
    if (!remark) {
      toast({ title: "Please provide a reason for rejecting the offer", status: "warning", isClosable: true });
      return;
    }
    setSubmitting(true);
    try {
      await PlacementService.submitOfferDecision(decisionOffer.id, false, remark);
      toast({ title: "Offer rejected", status: "success", isClosable: true });
      onRejectClose();
      setDecisionOffer(null);
      setRejectRemark("");
      clearCache("jobOffers");
      await fetchJobOffers(studentUSN);
    } catch (err) {
      toast({ title: err?.message || "Failed to reject offer", status: "error", isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  const formatJobType = (typeOfHiring) => {
    if (!typeOfHiring) return 'N/A';
    const t = String(typeOfHiring).toLowerCase();
    if (t === 'fulltime' || t === 'full-time') return 'Full-time';
    if (t === 'internship') return 'Internship';
    return typeOfHiring;
  };

  const formatCtcOrStipend = (offer) => {
    if (offer.ctc_min_lpa != null || offer.ctc_max_lpa != null) {
      const min = offer.ctc_min_lpa != null ? Number(offer.ctc_min_lpa) : null;
      const max = offer.ctc_max_lpa != null ? Number(offer.ctc_max_lpa) : null;
      if (min != null && max != null) return `${min} - ${max} LPA`;
      if (min != null) return `${min} LPA`;
      if (max != null) return `Up to ${max} LPA`;
    }
    if (offer.internship_stipend) return offer.internship_stipend;
    return 'N/A';
  };

  const OfferCard = ({ offer }) => {
    const { color, icon, label } = getStatusConfig(offer);
    const showAcceptReject = isPendingDecision(offer);

    return (
      <Card key={offer.id} variant="outline" borderColor={`${color}.200`} borderWidth="2px" _hover={{ shadow: "lg" }} transition="all 0.2s" bg={`${color}.50`}>
        <CardBody>
          <Stack spacing={4}>
            <HStack justify="space-between" align="start">
              <HStack spacing={4}>
                <Box 
                  p={3} 
                  bg="white" 
                  borderRadius="full" 
                  color={`${color}.500`}
                  shadow="sm"
                >
                  <Icon as={icon} boxSize={6} />
                </Box>
                <Box>
                  <Heading size="md" color="#20343c">{offer.company_name || 'Company'}</Heading>
                  <Text fontSize="sm" color="gray.700">{offer.designation || '—'}</Text>
                </Box>
              </HStack>
              <HStack spacing={2}>
                <Badge 
                  colorScheme={color}
                  fontSize="0.9em" 
                  px={3} 
                  py={1} 
                  borderRadius="full"
                >
                  {label}
                </Badge>
                {showAcceptReject && (
                  <>
                    <Button size="sm" colorScheme="green" leftIcon={<Icon as={FaCheckCircle} />} onClick={() => handleAcceptClick(offer)}>
                      Accept
                    </Button>
                    <Button size="sm" colorScheme="red" variant="outline" leftIcon={<Icon as={FaTimesCircle} />} onClick={() => handleRejectClick(offer)}>
                      Reject
                    </Button>
                  </>
                )}
              </HStack>
            </HStack>

            <Divider borderColor={`${color}.200`} />

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
               <HStack>
                 <Icon as={FaBriefcase} color="gray.600" />
                 <Box>
                   <Text fontWeight="bold" fontSize="xs" color="gray.600" textTransform="uppercase">Job Type</Text>
                   <Text fontWeight="medium">{formatJobType(offer.type_of_hiring) || offer.job_type || 'N/A'}</Text>
                 </Box>
               </HStack>
               
               <HStack>
                 <Icon as={FaMoneyBillWave} color="gray.600" />
                 <Box>
                   <Text fontWeight="bold" fontSize="xs" color="gray.600" textTransform="uppercase">CTC / Stipend</Text>
                   <Text fontWeight="medium">{formatCtcOrStipend(offer)}</Text>
                 </Box>
               </HStack>

               <HStack>
                 <Icon as={FaBuilding} color="gray.600" />
                 <Box>
                   <Text fontWeight="bold" fontSize="xs" color="gray.600" textTransform="uppercase">Academic Year</Text>
                   <Text fontWeight="medium">{offer.academic_year || 'N/A'}</Text>
                 </Box>
               </HStack>
            </SimpleGrid>

            {(offer.remarks != null && offer.remarks !== '') && (
              <Box bg="white" p={4} borderRadius="md" border="1px dashed" borderColor={`${color}.300`}>
                <Text fontSize="sm" fontWeight="bold" color={`${color}.700`} mb={1}>Remarks</Text>
                <Text fontSize="sm" color="gray.700">{offer.remarks}</Text>
              </Box>
            )}
            {offer.is_accepted === false && (offer.rejection_remarks != null && offer.rejection_remarks !== '') && (
              <Box bg="red.50" p={4} borderRadius="md" border="1px dashed" borderColor="red.200">
                <Text fontSize="sm" fontWeight="bold" color="red.700" mb={1}>Reason for rejection</Text>
                <Text fontSize="sm" color="gray.700">{offer.rejection_remarks}</Text>
              </Box>
            )}
          </Stack>
        </CardBody>
      </Card>
    );
  };

  const acceptedOffers = offers.filter(o => o.is_accepted === true);
  const rejectedOffers = offers.filter(o => o.is_accepted === false);
  const pendingOffers = offers.filter(o => o.is_accepted == null);

  return (
    <Box bg="white" p={8} borderRadius="xl" shadow="sm" minH="80vh">
        <HStack mb={6} justify="space-between">
           <Heading size="lg" color="#20343c">My Job Offers</Heading>
           <Badge colorScheme="blue" p={2} borderRadius="md" fontSize="md">
             Total Offers: {offers.length}
           </Badge>
        </HStack>
        
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList mb={4}>
            <Tab>All ({offers.length})</Tab>
            <Tab>Accepted ({acceptedOffers.length})</Tab>
            <Tab>Pending ({pendingOffers.length})</Tab>
            <Tab>Rejected ({rejectedOffers.length})</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <VStack gap={6} align="stretch">
                {offers.length === 0 ? (
                   <EmptyState message="No offers found." />
                ) : (
                   offers.map(offer => <OfferCard key={offer.id} offer={offer} />)
                )}
              </VStack>
            </TabPanel>
            
            <TabPanel px={0}>
              <VStack gap={6} align="stretch">
                {acceptedOffers.length === 0 ? (
                   <EmptyState message="No accepted offers yet." />
                ) : (
                   acceptedOffers.map(offer => <OfferCard key={offer.id} offer={offer} />)
                )}
              </VStack>
            </TabPanel>

            <TabPanel px={0}>
               <VStack gap={6} align="stretch">
                {pendingOffers.length === 0 ? (
                   <EmptyState message="No pending offers." />
                ) : (
                   pendingOffers.map(offer => <OfferCard key={offer.id} offer={offer} />)
                )}
              </VStack>
            </TabPanel>

            <TabPanel px={0}>
               <VStack gap={6} align="stretch">
                {rejectedOffers.length === 0 ? (
                   <EmptyState message="No rejected offers." />
                ) : (
                   rejectedOffers.map(offer => <OfferCard key={offer.id} offer={offer} />)
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Accept confirmation modal */}
        <Modal isOpen={isAcceptOpen} onClose={onAcceptClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Accept offer</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {decisionOffer && (
                <Text>
                  Are you sure you want to accept the offer from <strong>{decisionOffer.company_name}</strong>?
                  This will confirm your acceptance.
                </Text>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAcceptClose} isDisabled={submitting}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={handleConfirmAccept} isLoading={submitting} loadingText="Accepting">
                Confirm Accept
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Reject with remark modal */}
        <Modal isOpen={isRejectOpen} onClose={onRejectClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Reject offer</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {decisionOffer && (
                <Stack spacing={4}>
                  <Text>
                    You are about to reject the offer from <strong>{decisionOffer.company_name}</strong>.
                    Please provide a reason (required).
                  </Text>
                  <FormControl isRequired>
                    <FormLabel>Reason for rejection</FormLabel>
                    <Textarea
                      value={rejectRemark}
                      onChange={(e) => setRejectRemark(e.target.value)}
                      placeholder="e.g. Accepted another offer, pursuing higher studies..."
                      rows={4}
                      resize="vertical"
                    />
                  </FormControl>
                </Stack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onRejectClose} isDisabled={submitting}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmReject}
                isLoading={submitting}
                loadingText="Rejecting"
                isDisabled={!rejectRemark.trim()}
              >
                Confirm Reject
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
  )
}

const EmptyState = ({ message }) => (
  <Box textAlign="center" py={10} bg="gray.50" borderRadius="lg">
    <Icon as={FaBriefcase} boxSize={10} color="gray.300" mb={4} />
    <Heading size="md" color="gray.600" mb={2}>{message}</Heading>
    <Text color="gray.600">Keep working hard!</Text>
  </Box>
);
