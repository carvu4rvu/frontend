import { Box, Heading, Text, VStack, Button, Badge, HStack, Spinner, Image, Card, CardBody, Stack, Divider, SimpleGrid, Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import { CompanyLogo } from "../../../components/CompanyLogo"
import { usePlacementTrackPolicy } from "../../../context/PlacementTrackPolicyContext"
import { useStudentDataCache } from "../../../context/StudentDataCacheContext"

export const PlacementFeed = () => {
  const navigate = useNavigate();
  const { policy, loading: policyLoading } = usePlacementTrackPolicy();
  const { cache, loading, clearCache, fetchPlacementFeed } = useStudentDataCache();
  const { user } = useAuth();

  const drives = cache.placementFeed.drives;
  const processRecords = cache.placementFeed.processRecords;
  const studentUSN = user?.usn;
  const isLoading = !cache.placementFeed.loaded && loading.placementFeed;

  useEffect(() => {
    if (policyLoading) return;
    if (policy && policy.opt_in !== true) {
      navigate("/student/profile/personal", { replace: true });
    }
  }, [policy, policyLoading, navigate]);

  useEffect(() => {
    if (studentUSN && policy?.opt_in === true) {
      clearCache('placementFeed');
      fetchPlacementFeed(studentUSN);
    }
  }, [studentUSN, policy?.opt_in, clearCache, fetchPlacementFeed]);

  // Filter Logic based on student_placement_process
  const allProcesses = Array.isArray(processRecords) ? processRecords : [];

  const getProcessByDriveId = (driveId) => {
    return allProcesses.find(p => p.placement_drive_id === driveId);
  };

  const isEligibleProcess = (process) => {
    return !!process && process.is_eligible === true;
  };

  const isRegisteredProcess = (process) => {
    if (!process) return false;
    const rawStatus = process.registration_status;
    if (!rawStatus) return false;
    const value = String(rawStatus).toLowerCase();
    return value === 'registered';
  };

  // Helper to check rejection and selection
  const isRejected = (driveId) => {
    const app = getProcessByDriveId(driveId);
    const finalStatus = app?.final_select_status;
    return finalStatus === false;
  };

  const isSelected = (driveId) => {
    const app = getProcessByDriveId(driveId);
    const finalStatus = app?.final_select_status;
    return finalStatus === true || app?.offer_letter_status === 'Issued';
  };

  const upcomingDrives = drives.filter(d => {
    const process = getProcessByDriveId(d.id);
    if (!isEligibleProcess(process)) return false;
    if (isRegisteredProcess(process)) return false;
    const status = String(d.placement_status || '').toLowerCase();
    return status !== 'closed';
  });

  const ongoingDrives = drives.filter(d => {
    const process = getProcessByDriveId(d.id);
    if (!isEligibleProcess(process)) return false;
    if (!isRegisteredProcess(process)) return false;
    const status = String(d.placement_status || '').toLowerCase();
    return status !== 'closed';
  });

  const historyDrives = drives.filter(d => {
    const process = getProcessByDriveId(d.id);
    if (!isEligibleProcess(process)) return false;
    if (!isRegisteredProcess(process)) return false;
    const status = String(d.placement_status || '').toLowerCase();
    return status === 'closed';
  });

  const missedDrives = drives.filter(d => {
    const process = getProcessByDriveId(d.id);
    if (!isEligibleProcess(process)) return false;
    if (isRegisteredProcess(process)) return false;
    const status = String(d.placement_status || '').toLowerCase();
    return status === 'closed';
  });

  const cancelledDrives = drives.filter(d => {
    const process = getProcessByDriveId(d.id);
    if (!isEligibleProcess(process)) return false;
    const status = String(d.placement_status || '').toLowerCase();
    return status === 'cancelled' || status === 'postponed';
  });

  const DriveCard = ({ drive, showApply = false }) => {
    const process = getProcessByDriveId(drive.id);
    const hasApplied = isRegisteredProcess(process);
    const totalApplied = drive.registered_count ?? drive.number_of_registrations ?? 0;
    const openings = drive.number_of_openings ?? null;
    const companyName = drive.company?.company_name ?? drive.company_name ?? "Company";
    const companyLogo = drive.company?.company_logo_link ?? drive.company?.logo;
    const jobType = drive.job_type ?? "—";
    const hiringType = drive.type_of_hiring ?? "—";
    const jobLocation = drive.job_location ?? "—";
    const companyType = drive.company?.company_type ?? "—";

    const getCtcLabel = () => {
      const total = drive.ctc_structure?.total;
      const stipendMonthly = drive.stipend_structure?.monthly ?? drive.stipend_structure?.amount;
      if (total != null && total !== "") return `${total} LPA`;
      if (stipendMonthly != null && stipendMonthly !== "") return `${stipendMonthly} / month`;
      return "Not Disclosed";
    };

    const formatDate = (val) => {
      if (!val) return "TBD";
      try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? "TBD" : d.toLocaleDateString();
      } catch {
        return "TBD";
      }
    };

    return (
      <Card key={drive.id} variant="outline" borderColor="gray.200" _hover={{ shadow: "md", borderColor: "#d4a960" }} transition="all 0.2s">
        <CardBody>
          <Stack spacing={4}>
            <HStack justify="space-between" align="start">
              <HStack spacing={4}>
                <CompanyLogo
                  src={companyLogo}
                  name={companyName}
                  boxSize="50px"
                  variant="square"
                />
                <Box>
                  <Heading size="md" color="#20343c">{companyName}</Heading>
                  <Text fontSize="sm" color="gray.700">
                    {jobType} • {hiringType}
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {jobLocation} • {companyType}
                  </Text>
                </Box>
              </HStack>
              {drive.placement_status && String(drive.placement_status).toLowerCase() !== "open" && (
                <Badge 
                  colorScheme={String(drive.placement_status || "").toLowerCase() === "closed" ? "red" : "blue"} 
                  fontSize="0.8em" 
                  px={2} 
                  py={1} 
                  borderRadius="full"
                >
                  {drive.placement_status}
                </Badge>
              )}
            </HStack>

            <Divider />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="gray.700">CTC</Text>
                <Text>{getCtcLabel()}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="gray.700">Location</Text>
                <Text>{jobLocation}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="gray.700">Drive Date</Text>
                <Text>{formatDate(drive.event_datetime)}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="gray.700">Apply By</Text>
                <Text color="red.500" fontWeight="medium">
                  {formatDate(drive.last_date_to_registration)}
                </Text>
              </Box>
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="gray.700">Eligibility</Text>
                <Text fontSize="sm">
                  CGPA ≥ {drive.placement_drive_eligibility?.min_cgpa ?? drive.eligibility_academics?.min_cgpa ?? "N/A"}
                </Text>
              </Box>
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="gray.700">Applications</Text>
                <Text fontSize="sm">
                  {totalApplied} applied{openings != null ? ` | ${openings} openings` : ""}
                </Text>
              </Box>
            </SimpleGrid>

            <Box bg="gray.50" p={3} borderRadius="md" fontSize="sm" color="gray.700">
              <Text noOfLines={2}>{drive.job_description || "No description."}</Text>
            </Box>

            <HStack justify="flex-end" pt={2} spacing={3}>
              <Button 
                variant="outline" 
                size="sm" 
                colorScheme="blue"
                type="button"
                onClick={() => navigate(`/student/placements/drive/${drive.id}`)}
              >
                View Details
              </Button>
              {(hasApplied || isSelected(drive.id) || isRejected(drive.id) || String(drive.placement_status || "").toLowerCase() === "closed") && (
                <Badge
                  colorScheme={
                    isSelected(drive.id) ? "green" :
                    isRejected(drive.id) ? "red" :
                    !hasApplied && String(drive.placement_status || "").toLowerCase() === "closed" ? "orange" :
                    String(drive.placement_status || "").toLowerCase() === "closed" ? "gray" :
                    "purple"
                  }
                  p={2}
                  borderRadius="md"
                >
                  {isSelected(drive.id)
                    ? "Selected / Offer Issued"
                    : isRejected(drive.id)
                    ? "Rejected"
                    : hasApplied
                    ? (String(drive.placement_status || "").toLowerCase() === "closed" ? "Completed" : "Applied")
                    : "Missed"}
                </Badge>
              )}
            </HStack>
          </Stack>
        </CardBody>
      </Card>
    );
  };

  // Wait for policy; redirect if not opted in (handled in useEffect)
  if (policyLoading || (policy && policy.opt_in !== true)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        <Spinner size="xl" color="#d4a960" />
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        <Spinner size="xl" color="#d4a960" />
      </Box>
    )
  }

  return (
      <Box bg="white" p={8} borderRadius="xl" shadow="sm" minH="80vh">
        <Heading size="lg" color="#20343c" mb={6}>Placement Drives</Heading>
        
        <Tabs variant="soft-rounded" colorScheme="yellow">
          <TabList mb={4} overflowX="auto" py={1}>
            <Tab _selected={{ color: 'white', bg: '#20343c' }}>
              New Drives ({upcomingDrives.length})
            </Tab>
            <Tab _selected={{ color: 'white', bg: '#20343c' }}>
              Ongoing ({ongoingDrives.length})
            </Tab>
            <Tab _selected={{ color: 'white', bg: '#20343c' }}>
              Completed ({historyDrives.length})
            </Tab>
            <Tab _selected={{ color: 'white', bg: '#20343c' }}>
              Missed ({missedDrives.length})
            </Tab>
            <Tab _selected={{ color: 'white', bg: '#20343c' }}>
              Cancelled ({cancelledDrives.length})
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <VStack gap={6} align="stretch">
                {upcomingDrives.length === 0 ? (
                  <Text color="gray.600">
                    No upcoming drives available for registration.
                  </Text>
                ) : (
                  upcomingDrives.map(drive => (
                    <DriveCard
                      key={drive.id}
                      drive={drive}
                      showApply={false}
                    />
                  ))
                )}
              </VStack>
            </TabPanel>

            <TabPanel px={0}>
              <VStack gap={6} align="stretch">
                {ongoingDrives.length === 0 ? (
                  <Text color="gray.600">No ongoing applications.</Text>
                ) : (
                  ongoingDrives.map(drive => (
                    <DriveCard
                      key={drive.id}
                      drive={drive}
                      showApply={false}
                    />
                  ))
                )}
              </VStack>
            </TabPanel>

            <TabPanel px={0}>
              <VStack gap={6} align="stretch">
                {historyDrives.length === 0 ? (
                  <Text color="gray.600">No completed drives found.</Text>
                ) : (
                  historyDrives.map(drive => (
                    <DriveCard
                      key={drive.id}
                      drive={drive}
                      showApply={false}
                    />
                  ))
                )}
              </VStack>
            </TabPanel>

            <TabPanel px={0}>
              <VStack gap={6} align="stretch">
                {missedDrives.length === 0 ? (
                  <Text color="gray.600">No missed drives.</Text>
                ) : (
                  missedDrives.map(drive => (
                    <DriveCard
                      key={drive.id}
                      drive={drive}
                      showApply={false}
                    />
                  ))
                )}
              </VStack>
            </TabPanel>

            <TabPanel px={0}>
              <VStack gap={6} align="stretch">
                {cancelledDrives.length === 0 ? (
                  <Text color="gray.600">No cancelled or postponed drives.</Text>
                ) : (
                  cancelledDrives.map(drive => (
                    <DriveCard
                      key={drive.id}
                      drive={drive}
                      showApply={false}
                    />
                  ))
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
  )
}

export default PlacementFeed
