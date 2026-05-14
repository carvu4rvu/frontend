import { 
  Box, 
  Heading, 
  Text, 
  HStack, 
  VStack,
  Badge, 
  Button, 
  Image, 
  Divider, 
  SimpleGrid, 
  Icon, 
  Spinner, 
  Container, 
  Card, 
  CardBody, 
  List,
  ListItem,
  ListIcon
} from "@chakra-ui/react"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import { useBackgroundRefresh } from "../../../hooks/useBackgroundRefresh"
import { PlacementService } from "../../../services/placement.service"
import { useAuth } from "../../../context/AuthContext"
import { CompanyLogo } from "../../../components/CompanyLogo"
import { FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaClock, FaBriefcase, FaArrowLeft, FaCalendarAlt, FaUserTie, FaGlobe, FaLinkedin } from "react-icons/fa"

const isRegistered = (app) => {
  if (!app) return false;
  const s = String(app.registration_status || "").toLowerCase();
  return s === "registered";
};

const formatDate = (val) => {
  if (val == null || val === "") return "—";
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "—";
  }
};

const formatDateTime = (val) => {
  if (val == null || val === "") return "—";
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
};

// Format a value for display (skip if null/undefined/empty)
const fmt = (v, suffix = "") => (v != null && v !== "") ? `${v}${suffix}` : null;

// Same total CTC calculation as admin (Events.jsx): final = max + (max * variable/100) + stock
const calculateTotalCTC = (c) => {
  if (!c || typeof c !== "object") return null;
  const max = parseFloat(c.max ?? c.max_lpa ?? 0) || 0;
  const variablePercent = parseFloat(c.variable ?? 0) || 0;
  const stock = parseFloat(c.stock ?? 0) || 0;
  if (max <= 0) return null;
  if (variablePercent === 0 && stock === 0) return max;
  const variableAmount = (max * variablePercent) / 100;
  const total = max + variableAmount + stock;
  return Number(total.toFixed(2));
};

export const StudentDriveDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [applying, setApplying] = useState(false);
  const { user } = useAuth();
  const studentUSN = user?.usn;

  const loadData = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      if (studentUSN) {
        const [driveData, processData] = await Promise.all([
          PlacementService.getDriveById(id),
          PlacementService.getStudentProcess(studentUSN)
        ]);
        setDrive(driveData);
        const driveIdNum = Number(id);
        const myApp = Array.isArray(processData)
          ? processData.find(p => Number(p.placement_drive_id) === driveIdNum)
          : null;
        setApplication(myApp || null);
      } else {
        const driveData = await PlacementService.getDriveById(id);
        setDrive(driveData);
        setApplication(null);
      }
    } catch (error) {
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, studentUSN]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

  useBackgroundRefresh(loadData);

  const handleApply = useCallback(async () => {
    if (!id || !studentUSN) return;
    setApplying(true);
    try {
      const result = await PlacementService.registerForDrive(studentUSN, Number(id));
      const record = result?.data ?? result;
      const success = record && (record.id ?? result?.id);
      if (success) {
        alert("Applied successfully!");
      } else {
        alert("Application processed.");
      }
      await loadData({ silent: true });
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Error applying for drive";
      alert(msg);
    } finally {
      setApplying(false);
    }
  }, [id, studentUSN, loadData]);

  // Drive is open if status is Open OR registration deadline has not yet passed
  const registrationDeadline = drive?.last_date_to_registration ? new Date(drive.last_date_to_registration) : null;
  const deadlineNotPassed = registrationDeadline && !isNaN(registrationDeadline.getTime()) && registrationDeadline > new Date();
  const statusOpen = String(drive?.placement_status || "").toLowerCase() === "open";
  const driveOpen = statusOpen || !!deadlineNotPassed;
  const showApplyButton = studentUSN && drive && !isRegistered(application);
  const canApply = showApplyButton && driveOpen;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        <Spinner size="xl" color="#d4a960" />
      </Box>
    )
  }

  if (!drive) {
    return (
      <Box p={8} textAlign="center">
          <Heading size="lg" color="gray.600">Drive Not Found</Heading>
          <Button mt={4} type="button" onClick={() => navigate('/student/placements/feed')}>Back to Feed</Button>
        </Box>
    )
  }

  return (
      <Container maxW="container.xl" py={8}>
        <Button 
          leftIcon={<FaArrowLeft />} 
          variant="ghost" 
          mb={6} 
          type="button"
          onClick={() => navigate('/student/placements/feed')}
        >
          Back to Placement Feed
        </Button>

        <SimpleGrid columns={{ base: 1, lg: 1 }} spacing={8}>
          <Box>
            <Card variant="outline" mb={6} borderColor="gray.200">
              <CardBody>
                <HStack spacing={6} align="start" mb={6}>
                  <CompanyLogo
                    src={drive.company?.company_logo_link || drive.company?.logo}
                    name={drive.company?.company_name ?? drive.company_name}
                    boxSize="80px"
                  />
                  <Box flex="1">
                    <HStack justify="space-between">
                      <Heading size="lg" color="#20343c">{drive.company?.company_name ?? drive.company_name ?? "Company"}</Heading>
                      <Badge 
                        colorScheme={drive.placement_status === "Open" ? "green" : "red"} 
                        fontSize="md" 
                        px={3} 
                        py={1} 
                        borderRadius="full"
                      >
                        {drive.placement_status}
                      </Badge>
                    </HStack>
                    <Text fontSize="lg" color="gray.700" mt={1}>{drive.job_type ?? "—"}</Text>
                    <HStack mt={2} spacing={4} color="gray.600" flexWrap="wrap">
                      <HStack><Icon as={FaMapMarkerAlt} /><Text>{drive.job_location ?? "—"}</Text></HStack>
                      <HStack><Icon as={FaBriefcase} /><Text>{drive.company?.company_type ?? "—"}</Text></HStack>
                      {(drive.academic_year ?? drive.year) && (
                        <HStack><Icon as={FaCalendarAlt} /><Text>AY {drive.academic_year ?? drive.year}</Text></HStack>
                      )}
                    </HStack>
                  </Box>
                </HStack>

                <Divider mb={6} />

                <Heading size="md" mb={4} color="#20343c">Job Description</Heading>
                <Text color="gray.700" whiteSpace="pre-wrap" mb={6}>
                  {drive.job_description ?? "No description."}
                </Text>

                <Heading size="md" mb={4} color="#20343c">Drive details</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mb={6}>
                  <Box bg="blue.50" p={4} borderRadius="md" gridColumn={{ base: "1", md: "1 / -1" }}>
                    <HStack mb={3}>
                      <Icon as={FaMoneyBillWave} color="blue.500" />
                      <Text fontWeight="bold" color="blue.700">CTC &amp; Stipend</Text>
                    </HStack>
                    {(() => {
                      const c = drive.ctc_structure && typeof drive.ctc_structure === "object" ? drive.ctc_structure : {};
                      const s = drive.stipend_structure && typeof drive.stipend_structure === "object" ? drive.stipend_structure : {};
                      const hasCtc = c.total != null || c.final != null || c.package != null || c.base != null || c.min != null || c.max != null || c.min_lpa != null || c.max_lpa != null || c.variable != null || c.stock != null;
                      const hasStipend = s.monthly != null || s.amount != null || s.avg != null || s.stipend != null || s.min != null || s.max != null;
                      if (!hasCtc && !hasStipend) {
                        return <Text fontWeight="semibold">Not Disclosed</Text>;
                      }
                      // Same total CTC as admin: max + (max * variable/100) + stock; fallback to stored final/package/total
                      const calculatedTotal = calculateTotalCTC(c);
                      const storedTotal = c.total ?? c.final ?? c.package;
                      const ctcTotalDisplay = calculatedTotal != null ? calculatedTotal : (storedTotal != null && storedTotal !== "" ? storedTotal : null);
                      const ctcBase = fmt(c.base, " LPA");
                      const ctcMin = fmt(c.min ?? c.min_lpa, " LPA");
                      const ctcMax = fmt(c.max ?? c.max_lpa, " LPA");
                      const ctcVariable = fmt(c.variable, "%");
                      const ctcStock = fmt(c.stock);
                      const stipSingle = s.monthly ?? s.amount ?? s.avg ?? s.stipend;
                      const stipMin = s.min != null && s.min !== "" ? s.min : null;
                      const stipMax = s.max != null && s.max !== "" ? s.max : null;
                      return (
                        <VStack align="stretch" spacing={3}>
                          {hasCtc && (
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>CTC</Text>
                              {ctcTotalDisplay != null && (
                                <Text fontSize="lg" fontWeight="semibold" mb={2}>{ctcTotalDisplay} LPA{!(ctcBase || ctcMin || ctcMax || ctcVariable || ctcStock) ? "" : " (Total)"}</Text>
                              )}
                              {(ctcBase || ctcMin || ctcMax || ctcVariable || ctcStock) && (
                                <List spacing={1} fontSize="sm">
                                  {ctcBase && <ListItem><Text as="span" fontWeight="semibold">Base:</Text> {ctcBase}</ListItem>}
                                  {(ctcMin || ctcMax) && <ListItem><Text as="span" fontWeight="semibold">Range:</Text> {[ctcMin, ctcMax].filter(Boolean).join(" – ")}</ListItem>}
                                  {ctcVariable && <ListItem><Text as="span" fontWeight="semibold">Variable pay:</Text> {ctcVariable}</ListItem>}
                                  {ctcStock && <ListItem><Text as="span" fontWeight="semibold">Stocks:</Text> {ctcStock}</ListItem>}
                                </List>
                              )}
                            </Box>
                          )}
                          {hasStipend && (
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>Stipend</Text>
                              {(stipMin != null || stipMax != null) ? (
                                <Text fontWeight="semibold">{[stipMin, stipMax].filter(Boolean).join(" – ")} / month</Text>
                              ) : stipSingle != null && stipSingle !== "" ? (
                                <Text fontWeight="semibold">{stipSingle} / month</Text>
                              ) : null}
                            </Box>
                          )}
                        </VStack>
                      );
                    })()}
                  </Box>
                  <Box bg="purple.50" p={4} borderRadius="md">
                    <HStack mb={2}>
                      <Icon as={FaClock} color="purple.500" />
                      <Text fontWeight="bold" color="purple.700">Important dates</Text>
                    </HStack>
                    <Text fontSize="sm"><Text as="span" fontWeight="semibold">Register by:</Text> {formatDate(drive.last_date_to_registration)}</Text>
                    <Text fontSize="sm"><Text as="span" fontWeight="semibold">Drive date:</Text> {formatDateTime(drive.event_datetime)}</Text>
                    {drive.onboarded_date && (
                      <Text fontSize="sm"><Text as="span" fontWeight="semibold">Onboard by:</Text> {formatDate(drive.onboarded_date)}</Text>
                    )}
                  </Box>
                  <Box bg="gray.50" p={4} borderRadius="md">
                    <HStack mb={2}>
                      <Icon as={FaBriefcase} color="gray.700" />
                      <Text fontWeight="bold" color="gray.700">Openings & applications</Text>
                    </HStack>
                    <Text fontSize="sm"><Text as="span" fontWeight="semibold">Openings:</Text> {drive.number_of_openings != null ? drive.number_of_openings : "—"}</Text>
                    <Text fontSize="sm"><Text as="span" fontWeight="semibold">Registrations:</Text> {drive.number_of_registrations != null ? drive.number_of_registrations : "—"}</Text>
                  </Box>
                </SimpleGrid>

                {(drive.company?.description ?? drive.company?.address ?? drive.company?.website ?? drive.company?.linkedin) && (
                  <>
                    <Heading size="md" mb={4} color="#20343c">Company</Heading>
                    <Box mb={6}>
                      {drive.company?.description && (
                        <Text color="gray.700" mb={3} whiteSpace="pre-wrap">{drive.company.description}</Text>
                      )}
                      <List spacing={2}>
                        {drive.company?.address && (
                          <ListItem display="flex" alignItems="flex-start" gap={2}>
                            <ListIcon as={FaMapMarkerAlt} color="gray.600" mt={0.5} />
                            <Text>{drive.company.address}</Text>
                          </ListItem>
                        )}
                        {drive.company?.website && (
                          <ListItem display="flex" alignItems="center" gap={2}>
                            <Icon as={FaGlobe} color="gray.600" />
                            <Text as="a" href={drive.company.website.startsWith("http") ? drive.company.website : `https://${drive.company.website}`} target="_blank" rel="noopener noreferrer" color="blue.600">{drive.company.website}</Text>
                          </ListItem>
                        )}
                        {drive.company?.linkedin && (
                          <ListItem display="flex" alignItems="center" gap={2}>
                            <Icon as={FaLinkedin} color="gray.600" />
                            <Text as="a" href={drive.company.linkedin.startsWith("http") ? drive.company.linkedin : `https://${drive.company.linkedin}`} target="_blank" rel="noopener noreferrer" color="blue.600">{drive.company.linkedin}</Text>
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </>
                )}

                {(drive.tpo ?? drive.company_remarks) && (
                  <>
                    <Heading size="md" mb={4} color="#20343c">Remarks</Heading>
                    <Box mb={6}>
                      {drive.tpo && (
                        <HStack align="start" mb={2}>
                          <Icon as={FaUserTie} color="gray.600" mt={0.5} />
                          <Text><Text as="span" fontWeight="semibold">TPO:</Text> {drive.tpo}</Text>
                        </HStack>
                      )}
                      {drive.company_remarks && (
                        <Text color="gray.700" whiteSpace="pre-wrap">{drive.company_remarks}</Text>
                      )}
                    </Box>
                  </>
                )}

                {application && isRegistered(application) && (
                  <>
                    <Divider mb={6} />
                    <Heading size="md" mb={4} color="#20343c">Process Status</Heading>
                    {application.approved_status !== "Qualified" ? (
                      <HStack spacing={3} alignItems="center">
                        <Badge
                          colorScheme={
                            application.approved_status === "Not Qualified" ? "red" : "yellow"
                          }
                          px={4}
                          py={2}
                          borderRadius="md"
                          fontSize="sm"
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          {application.approved_status === "Not Qualified"
                            ? "Not Shortlisted"
                            : "Awaiting Shortlist"}
                        </Badge>
                        <Text fontSize="sm" color="gray.700">
                          {application.approved_status === "Not Qualified"
                            ? "You were not shortlisted for this drive."
                            : "Process rounds will appear once your application is shortlisted."}
                        </Text>
                      </HStack>
                    ) : !Array.isArray(drive.process_rounds) || drive.process_rounds.length === 0 ? (
                      <Text color="gray.600">
                        Process rounds are not configured for this drive.
                      </Text>
                    ) : (
                      <VStack align="stretch" spacing={4}>
                        <Badge colorScheme="green" px={4} py={2} borderRadius="md" fontSize="sm" textTransform="uppercase" letterSpacing="wider" alignSelf="flex-start">
                          Application Shortlisted
                        </Badge>
                        <List spacing={3}>
                        {(Array.isArray(drive.process_rounds) ? drive.process_rounds : [])
                          .filter((r) => !/^aptitude$/i.test(String(r || "").trim()))
                          .map((round, index) => {
                          const normalized = String(round || "").toLowerCase().trim();
                          let field = null;
                          let label = round;
                          if (normalized === "approved" || normalized === "registration") {
                            return null;
                          } else if (normalized === "oa" || normalized === "online assessment" || normalized === "coding test") {
                            field = "oa_status";
                            label = normalized === "coding test" ? "Coding Test" : "OA";
                          } else if (normalized === "gd" || normalized === "group discussion") {
                            field = "gd_status";
                            label = "GD";
                          } else if (normalized === "technical round" || normalized === "technical") {
                            field = "technical_round_status";
                            label = normalized === "technical" ? "Technical" : "Technical Round";
                          } else if (normalized === "interview") {
                            field = "interview_status";
                            label = "Interview";
                          } else if (normalized === "hr round" || normalized === "hr") {
                            field = "hr_round_status";
                            label = "HR Round";
                          } else if (normalized === "final" || normalized === "final selection") {
                            field = "final_select_status";
                            label = "Final Selection";
                          }

                          if (!field) return null;

                          const rawStatus = application[field];
                          let displayStatus = "Pending";
                          let colorScheme = "yellow";
                          if (rawStatus === true) {
                            displayStatus = "Qualified";
                            colorScheme = "green";
                          } else if (rawStatus === false) {
                            displayStatus = "Not Qualified";
                            colorScheme = "red";
                          }

                          return (
                            <ListItem key={`${round}-${index}`} display="flex" alignItems="center" justifyContent="space-between">
                              <HStack spacing={3}>
                                <ListIcon as={FaClock} color="purple.500" />
                                <Text fontWeight="semibold">{label}</Text>
                              </HStack>
                              <Badge colorScheme={colorScheme} px={3} py={1} borderRadius="full">
                                {displayStatus}
                              </Badge>
                            </ListItem>
                          );
                        })}
                        </List>
                      </VStack>
                    )}
                  </>
                )}
                <Divider my={6} />
                <HStack justify="flex-end" spacing={4} flexWrap="wrap">
                  {showApplyButton && (
                    <Button
                      bg="#20343c"
                      color="white"
                      size="md"
                      type="button"
                      _hover={{ bg: "#1a2b32" }}
                      onClick={handleApply}
                      isLoading={applying}
                      isDisabled={!driveOpen}
                      leftIcon={<Icon as={FaBriefcase} />}
                    >
                      {canApply ? "Apply for this drive" : "Drive closed"}
                    </Button>
                  )}
                  {application && isRegistered(application) && (
                    <Badge colorScheme="green" px={4} py={2} borderRadius="md" fontSize="sm">
                      Applied
                    </Badge>
                  )}
                </HStack>
              </CardBody>
            </Card>
          </Box>
        </SimpleGrid>
      </Container>
  )
}
