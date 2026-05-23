import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  SimpleGrid,
  Spinner,
  Link,
  Progress,
  Icon,
  Flex,
  Wrap,
  useToast,
} from "@chakra-ui/react";
import {
  FaBriefcase,
  FaCalendarAlt,
  FaCheckCircle,
  FaBell,
  FaExclamationCircle,
  FaChartBar,
  FaCertificate,
  FaBook,
  FaMedal,
  FaTimesCircle,
  FaChalkboardTeacher,
  FaBuilding,
} from "react-icons/fa";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useStudentDataCache } from "../context/StudentDataCacheContext";
import { usePlacementTrackPolicy } from "../context/PlacementTrackPolicyContext";
import { buildStudentDriveSummaries, buildAllDrivesStackedChart, buildStudentRoundOutcomesDoughnut } from "../utils/studentDriveFunnel";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const CARD_BG = "white";
const CARD_SHADOW = "md";
const CARD_RADIUS = "xl";
const ACCENT = "#20343c";
const ACCENT_LIGHT = "#d4a960";

const StudentDriveStackedChart = ({ drives }) => {
  const chartBundle = useMemo(() => buildAllDrivesStackedChart(drives), [drives]);
  const { labels, datasets, stageOrder } = chartBundle;

  const chartData = useMemo(() => ({ labels, datasets }), [labels, datasets]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            padding: 10,
            font: { size: 10 },
            usePointStyle: true,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          filter: (item) => item.raw > 0,
          callbacks: {
            title: (items) => {
              const idx = items[0]?.dataIndex;
              return drives[idx]?.title || items[0]?.label || "";
            },
            label: (ctx) => ` ${ctx.dataset.label}: Passed`,
            footer: (items) => {
              const driveIdx = items[0]?.dataIndex;
              const funnel = drives[driveIdx]?.round_funnel || [];
              const passed = funnel.filter((s) => s.status === "passed").length;
              const failed = funnel.find((s) => s.status === "failed");
              if (failed) return `${passed} cleared · Stopped at ${failed.label}`;
              return `${passed} of ${funnel.length} stages cleared`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { size: 10, weight: "600" }, maxRotation: 40, minRotation: 0 },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          suggestedMax: Math.max(stageOrder.length, 3),
          ticks: { stepSize: 1, precision: 0 },
          grid: { color: "#f1f5f9" },
          title: {
            display: true,
            text: "Rounds cleared",
            font: { size: 10 },
            color: "#64748b",
          },
        },
      },
    }),
    [drives, stageOrder.length]
  );

  if (!drives?.length) {
    return (
      <Flex direction="column" align="center" justify="center" h="100%" py={4}>
        <Icon as={FaBriefcase} boxSize={8} color="gray.300" mb={2} />
        <Text color="gray.500" fontSize="sm" textAlign="center" px={4}>
          Apply to placement drives to compare your round progress across companies here.
        </Text>
      </Flex>
    );
  }

  return <Bar data={chartData} options={chartOptions} />;
};

const StudentRoundOutcomesChart = ({ drives }) => {
  const chartBundle = useMemo(() => buildStudentRoundOutcomesDoughnut(drives), [drives]);
  const { labels, datasets, passRate, totals, totalCheckpoints, empty, segmentMeta } = chartBundle;

  const chartData = useMemo(() => ({ labels, datasets }), [labels, datasets]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            padding: 12,
            font: { size: 10 },
            usePointStyle: true,
            generateLabels: (chart) => {
              const data = chart.data;
              return (data.labels || []).map((label, i) => {
                const value = data.datasets[0]?.data[i] ?? 0;
                const pct = totalCheckpoints > 0 ? Math.round((value / totalCheckpoints) * 100) : 0;
                return {
                  text: `${label} · ${value} (${pct}%)`,
                  fillStyle: data.datasets[0]?.backgroundColor?.[i],
                  hidden: false,
                  index: i,
                };
              });
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.raw;
              const pct = totalCheckpoints > 0 ? ((value / totalCheckpoints) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${value} (${pct}%)`;
            },
          },
        },
      },
    }),
    [totalCheckpoints]
  );

  if (empty || !drives?.length) {
    return (
      <Flex direction="column" align="center" justify="center" h="100%" py={6}>
        <Icon as={FaChartBar} boxSize={8} color="gray.300" mb={2} />
        <Text color="gray.500" fontSize="sm" textAlign="center" px={4}>
          Apply to drives to see how your rounds are tracking.
        </Text>
      </Flex>
    );
  }

  return (
    <Grid templateColumns={{ base: "1fr", sm: "1fr 120px" }} gap={3} h="100%" alignItems="center">
      <Box position="relative" h={{ base: "180px", sm: "200px" }} minW={0}>
        <Doughnut data={chartData} options={chartOptions} />
        <Flex
          position="absolute"
          top="42%"
          left="50%"
          transform="translate(-50%, -50%)"
          direction="column"
          align="center"
          pointerEvents="none"
          textAlign="center"
        >
          <Text fontSize="2xl" fontWeight="800" color={ACCENT} lineHeight="1">
            {passRate}%
          </Text>
          <Text fontSize="10px" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wider">
            Clear rate
          </Text>
        </Flex>
      </Box>
      <VStack spacing={2} align="stretch" display={{ base: "none", sm: "flex" }}>
        <Box p={2} borderRadius="md" bg="green.50" border="1px solid" borderColor="green.100">
          <Text fontSize="10px" color="green.700" fontWeight="600">Cleared</Text>
          <Text fontSize="lg" fontWeight="700" color="green.800">{totals.passed}</Text>
        </Box>
        <Box p={2} borderRadius="md" bg="red.50" border="1px solid" borderColor="red.100">
          <Text fontSize="10px" color="red.700" fontWeight="600">Failed</Text>
          <Text fontSize="lg" fontWeight="700" color="red.800">{totals.failed}</Text>
        </Box>
        <Box p={2} borderRadius="md" bg="gray.50" border="1px solid" borderColor="gray.200">
          <Text fontSize="10px" color="gray.600" fontWeight="600">Pending</Text>
          <Text fontSize="lg" fontWeight="700" color={ACCENT}>{totals.pending + totals.not_reached}</Text>
        </Box>
      </VStack>
      <SimpleGrid columns={3} spacing={2} display={{ base: "grid", sm: "none" }} w="100%">
        {(segmentMeta || []).slice(0, 3).map((seg) => (
          <Box key={seg.key} textAlign="center" p={2} borderRadius="md" bg="gray.50">
            <Text fontSize="lg" fontWeight="700" color={ACCENT}>{seg.value}</Text>
            <Text fontSize="10px" color="gray.600" noOfLines={1}>{seg.label}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Grid>
  );
};

const StatCard = ({ icon, title, value, color = ACCENT, to }) => {
  const content = (
    <Box
      bg={CARD_BG}
      p={3}
      borderRadius="lg"
      shadow={CARD_SHADOW}
      borderLeft="4px solid"
      borderColor={color}
      h="100%"
      minW="0"
      transition="all 0.2s ease"
      _hover={{ shadow: "md", transform: "translateY(-1px)" }}
    >
      <HStack gap={2} spacing={0}>
        <Box p={2} bg={`${color}20`} borderRadius="full" color={color} flexShrink={0} fontSize="sm">
          {icon}
        </Box>
        <Box flex={1} minW={0}>
          <Text color="gray.500" fontSize="xs" fontWeight="medium" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">{title}</Text>
          <Heading size="sm" color={ACCENT} mt={0.5}>{value}</Heading>
        </Box>
      </HStack>
    </Box>
  );
  if (to) return <Link as={RouterLink} to={to} _hover={{ textDecoration: "none" }} w="100%">{content}</Link>;
  return content;
};

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { dateStyle: "medium", timeZone: 'Asia/Kolkata' }) : "—");
const formatShortDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { month: "short", day: "numeric", year: "numeric", timeZone: 'Asia/Kolkata' }) : "—");

export const StudentDashboard = ({ viewData = null, basePath = null, studentName = null }) => {
  const location = useLocation();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const { policy: trackPolicy } = usePlacementTrackPolicy();
  const {
    cache,
    loading,
    clearCache,
    fetchDashboard,
    fetchPlacementFeed,
    fetchEvents,
    fetchNotifications,
    fetchJobOffers,
  } = useStudentDataCache();

  const isViewMode = Boolean(viewData);
  const studentUSN = user?.usn;
  const dash = isViewMode ? viewData.dashboard : cache.dashboard;
  const completionPercentage = Number.isFinite(dash.completionPercentage)
    ? Math.min(100, Math.max(0, dash.completionPercentage))
    : 0;
  const applications = dash.applications || [];
  const processRecords = useMemo(() => {
    const fromDash = Array.isArray(applications) ? applications : [];
    const fromFeed = cache.placementFeed?.processRecords;
    if (fromDash.length > 0) return fromDash;
    if (Array.isArray(fromFeed) && fromFeed.length > 0) return fromFeed;
    return fromDash;
  }, [applications, cache.placementFeed?.processRecords]);
  const missingSections = dash.missingSections || [];
  const resumeUploaded = dash.resumeUploaded === true;
  const optIn = dash.optIn === true;
  const placementPolicyAgreed = dash.placementPolicyAgreed === true;
  const portfolioCounts = dash.portfolioCounts;
  const drives = (isViewMode ? viewData.placementFeed : cache.placementFeed)?.drives || [];
  const viewProcessRecords = isViewMode
    ? (viewData.placementFeed?.processRecords?.length
        ? viewData.placementFeed.processRecords
        : viewData.dashboard?.applications || [])
    : processRecords;
  const events = (isViewMode ? viewData.events : cache.events)?.list || [];
  const unreadCount = (isViewMode ? viewData.notifications : cache.notifications)?.unreadCount ?? 0;
  const jobOffers = (isViewMode ? viewData.jobOffers : cache.jobOffers)?.list || [];

  const showNotification = !isViewMode && (location.state?.isFirstLogin || completionPercentage < 100);

  useEffect(() => {
    if (isViewMode || authLoading || !studentUSN) return;
    fetchDashboard(studentUSN);
  }, [isViewMode, studentUSN, authLoading, fetchDashboard]);

  useEffect(() => {
    if (isViewMode || !studentUSN) return;
    fetchEvents();
    fetchNotifications();
    if (trackPolicy?.opt_in === true || dash.optIn === true) {
      fetchPlacementFeed(studentUSN);
      fetchJobOffers(studentUSN);
    }
  }, [
    isViewMode,
    studentUSN,
    trackPolicy?.opt_in,
    dash.optIn,
    fetchPlacementFeed,
    fetchEvents,
    fetchNotifications,
    fetchJobOffers,
  ]);

  const isLoading = !isViewMode && !cache.dashboard.loaded && loading.dashboard;

  const statsSource = isViewMode ? viewProcessRecords : processRecords;
  const totalApplications = statsSource.length;
  const companiesApplied = useMemo(() => {
    const set = new Set();
    (statsSource || []).forEach((p) => {
      const name = p.drive?.company?.company_name || p.drive?.company_name;
      const id = p.drive?.company_id || p.placement_drive_id;
      if (name) set.add(name);
      else if (id) set.add(String(id));
    });
    return set.size;
  }, [statsSource]);

  const isRoundPassed = (v) => {
    if (v === true) return true;
    if (v === false) return false;
    if (v == null || v === "") return false;
    const s = String(v).toLowerCase().trim();
    if (['pass', 'passed', 'cleared', 'selected', 'yes', 'true', 'completed'].includes(s)) return true;
    if (['pending', 'rejected', 'not scheduled', 'false', 'no', 'fail', 'failed', 'absent'].includes(s)) return false;
    return s.length > 0;
  };

  const getFinalSelectStatus = (p) => {
    const raw = p?.final_select_status ?? p?.finalSelectStatus;
    if (raw === true) return 'selected';
    if (raw === false) return 'rejected';
    return String(raw ?? '').trim().toLowerCase();
  };

  const oaPassed = (statsSource || []).filter((p) => isRoundPassed(p.oa_status ?? p.oaStatus)).length;
  const gdPassed = (statsSource || []).filter((p) => isRoundPassed(p.gd_status ?? p.gdStatus)).length;
  const technicalPassed = (statsSource || []).filter((p) => isRoundPassed(p.technical_round_status ?? p.technicalRoundStatus)).length;
  const hrPassed = (statsSource || []).filter((p) => isRoundPassed(p.hr_round_status ?? p.hrRoundStatus)).length;
  const selectedCount = (statsSource || []).filter((p) => getFinalSelectStatus(p) === "selected").length;

  const studentDriveSummaries = useMemo(
    () => buildStudentDriveSummaries(statsSource),
    [statsSource]
  );

  const processByDriveId = (statsSource || []).reduce((acc, p) => {
    const id = p?.placement_drive_id ?? p?.drive?.id;
    if (id != null) acc[id] = p;
    return acc;
  }, {});

  const eventStatusOrder = (s) => {
    const x = String(s || "scheduled").toLowerCase();
    if (x === "ongoing") return 0;
    if (x === "scheduled") return 1;
    if (x === "completed") return 2;
    if (x === "failed" || x === "cancelled") return 3;
    return 1;
  };
  const driveStatusOrder = (s) => {
    const x = String(s || "").toLowerCase();
    if (x === "ongoing") return 0;
    if (x === "upcoming" || x === "scheduled") return 1;
    if (x === "completed") return 2;
    if (x === "cancelled" || x === "failed" || x === "postponed") return 3;
    return 1;
  };

  const upcomingEventsSorted = useMemo(() => {
    const statusLower = (s) => String(s || "scheduled").toLowerCase();
    return (events || [])
      .filter((e) => e.event_date || e.event_datetime)
      .map((e) => ({
        ...e,
        _date: new Date(e.event_date || e.event_datetime),
        _title: e.title || e.name || "Event",
        _type: e.type,
        _status: e.status,
      }))
      .filter((e) => !Number.isNaN(e._date.getTime()))
      .sort((a, b) => {
        const oa = eventStatusOrder(a._status);
        const ob = eventStatusOrder(b._status);
        if (oa !== ob) return oa - ob;
        return a._date - b._date;
      })
      .slice(0, 4);
  }, [events]);

  const upcomingDrivesSorted = useMemo(() => {
    return (drives || [])
      .map((d) => ({
        ...d,
        _date: new Date(d.last_date_to_registration || d.event_datetime || d.created_at || 0),
      }))
      .filter((d) => !Number.isNaN(d._date.getTime()))
      .sort((a, b) => {
        const oa = driveStatusOrder(a.placement_status);
        const ob = driveStatusOrder(b.placement_status);
        if (oa !== ob) return oa - ob;
        return a._date - b._date;
      })
      .slice(0, 4);
  }, [drives]);

  const highestCtc = jobOffers.length
    ? Math.max(
        ...jobOffers.map((o) => parseFloat(o.ctc_max_lpa || o.ctc_min_lpa || 0)).filter((n) => !Number.isNaN(n)),
        0
      )
    : null;
  const acceptedOffers = jobOffers.filter((o) => o.is_accepted === true);
  const pendingOffers = jobOffers.filter((o) => o.is_accepted === null);

  if (!isViewMode && (authLoading || (isLoading && studentUSN))) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="80vh" w="100%">
        <Spinner size="xl" color={ACCENT_LIGHT} />
      </Box>
    );
  }

  return (
    <Box minH="100vh" w="100%" maxW="100%" overflowX="hidden" bg="gray.50" py={{ base: 4, md: 5 }} px={{ base: 3, sm: 4, md: 5, lg: 6, xl: 6 }}>
      <Box w="100%" maxW="100%" minW={0}>
        {showNotification && (
          <Box
            mb={{ base: 4, md: 5 }}
            bg="orange.50"
            p={4}
            borderRadius="lg"
            borderLeft="4px solid"
            borderColor="orange.400"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={3}
          >
            <HStack gap={3}>
              <FaExclamationCircle color="#dd6b20" size={20} />
              <Box>
                <Heading size="sm" color="orange.800">
                  Complete Your Profile
                </Heading>
                <Text fontSize="sm" color="orange.700">
                  Your profile is {completionPercentage}% complete. {missingSections.length > 0 && "Add missing sections to apply for jobs."}
                </Text>
              </Box>
            </HStack>
            <Button size="sm" colorScheme="orange" as={RouterLink} to={basePath ? `${basePath}/personal` : "/student/profile"}>
              {basePath ? "View profile" : "Complete Now"}
            </Button>
          </Box>
        )}

        <Flex justify="space-between" align="center" mb={{ base: 4, md: 5 }} flexWrap="wrap" gap={4}>
          <Box>
            <Heading color={ACCENT} size="xl">
              {isViewMode ? `Dashboard: ${studentName || "Student"}` : `Welcome back, ${user?.full_name || user?.firstName || "Student"}!`}
            </Heading>
            <Text color="gray.500">
              {isViewMode ? "View-only access to student dashboard." : "Here's your dashboard at a glance."}
            </Text>
          </Box>
          {!isViewMode && (
            <HStack gap={2} flexWrap="wrap">
              <Button as={RouterLink} to="/student/notifications" bg={ACCENT} color="white" _hover={{ bg: "#1a2b32" }} leftIcon={<FaBell />}>
                Notifications
                {unreadCount > 0 && (
                  <Badge ml={2} colorScheme="red" borderRadius="full">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <Button as={RouterLink} to="/student/calendar" colorScheme="teal" variant="outline" leftIcon={<FaCalendarAlt />}>
                Calendar
              </Button>
            </HStack>
          )}
        </Flex>

        {/* Stats row - full width numbers */}
        <Heading size="sm" color={ACCENT} mb={3}>
          Your numbers
        </Heading>
        {!isViewMode && !optIn && trackPolicy?.opt_in !== true && (
          <Text fontSize="sm" color="orange.600" mb={3}>
            Opt in to placement from your Personal profile to apply for drives and see live application counts here.
          </Text>
        )}
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 4, xl: 8 }} gap={{ base: 3, md: 4 }} mb={6} w="100%" minChildWidth={{ base: "120px", sm: "140px" }}>
          <StatCard icon={<FaBriefcase />} title="Applications" value={totalApplications} color={ACCENT} to={isViewMode ? undefined : "/student/placements/feed"} />
          <StatCard icon={<FaBuilding />} title="Companies applied" value={companiesApplied} color="#4299e1" to={isViewMode ? undefined : "/student/placements/feed"} />
          <StatCard icon={<FaChartBar />} title="OA passed" value={oaPassed} color="#48bb78" to={isViewMode ? undefined : "/student/placements/feed"} />
          <StatCard icon={<FaChartBar />} title="GD passed" value={gdPassed} color="#38b2ac" to={isViewMode ? undefined : "/student/placements/feed"} />
          <StatCard icon={<FaChartBar />} title="Technical passed" value={technicalPassed} color="#ed8936" to={isViewMode ? undefined : "/student/placements/feed"} />
          <StatCard icon={<FaChartBar />} title="HR passed" value={hrPassed} color="#d53f8c" to={isViewMode ? undefined : "/student/placements/feed"} />
          <StatCard icon={<FaCheckCircle />} title="Selected" value={selectedCount} color="#276749" to={isViewMode ? undefined : "/student/placements/feed"} />
          <StatCard icon={<FaBriefcase />} title="Offers" value={jobOffers.length} color={ACCENT_LIGHT} to={isViewMode ? undefined : "/student/placements/offers"} />
        </SimpleGrid>

        {/* Charts row */}
        <Grid templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" }} gap={{ base: 4, lg: 5 }} mb={6} w="100%" minW={0}>
          <Box bg={CARD_BG} p={4} borderRadius={CARD_RADIUS} shadow={CARD_SHADOW} minW={0}>
            <Heading size="sm" color={ACCENT} mb={1}>
              Round outcomes
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={3}>
              Cleared vs failed vs upcoming checkpoints across all your drives
            </Text>
            <Box h="240px" minW={0}>
              <StudentRoundOutcomesChart drives={studentDriveSummaries} />
            </Box>
          </Box>
          <Box bg={CARD_BG} p={4} borderRadius={CARD_RADIUS} shadow={CARD_SHADOW} minW={0}>
            <Heading size="sm" color={ACCENT} mb={2}>
              All drives — round progress
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={2}>
              Stacked bars show rounds you cleared per company (taller = further in the process)
            </Text>
            <Box h="210px" minW={0}>
              <StudentDriveStackedChart drives={studentDriveSummaries} />
            </Box>
          </Box>
        </Grid>

        {/* Upcoming events & drives with dates — hidden in admin view */}
        {!isViewMode && (
        <Grid templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" }} gap={{ base: 4, lg: 5 }} mb={6} w="100%" minW={0}>
          <Box
            bg={CARD_BG}
            p={5}
            borderRadius={CARD_RADIUS}
            shadow={CARD_SHADOW}
            minW={0}
            borderWidth="1px"
            borderColor="gray.100"
            _hover={{ shadow: "lg", borderColor: "gray.200" }}
            transition="all 0.2s ease"
          >
            <Heading size="sm" color={ACCENT} mb={4} fontWeight="600" letterSpacing="-0.01em">
              Upcoming events
            </Heading>
            <VStack align="stretch" gap={3} spacing={0}>
              {upcomingEventsSorted.length === 0 ? (
                <Text color="gray.500" fontSize="sm" py={4}>
                  No upcoming events.
                </Text>
              ) : (
                upcomingEventsSorted.map((item) => {
                  const s = String(item._status || "scheduled").toLowerCase();
                  const statusConfig = {
                    ongoing: { border: "green.500", badge: "green", label: "Ongoing" },
                    scheduled: { border: ACCENT_LIGHT, badge: "yellow", label: "Upcoming" },
                    completed: { border: "gray.400", badge: "gray", label: "Completed" },
                    failed: { border: "red.400", badge: "red", label: "Cancelled" },
                    cancelled: { border: "red.400", badge: "red", label: "Cancelled" },
                  };
                  const cfg = statusConfig[s] || statusConfig.scheduled;
                  return (
                    <Box
                      key={`event-${item.id}`}
                      p={3}
                      pl={4}
                      minH="60px"
                      display="flex"
                      alignItems="center"
                      borderRadius="lg"
                      bg="gray.50"
                      borderLeft="4px solid"
                      borderColor={cfg.border}
                      transition="all 0.2s ease"
                      _hover={{
                        bg: "white",
                        shadow: "sm",
                        transform: "translateX(2px)",
                      }}
                    >
                      <Flex justify="space-between" align="center" gap={2} w="100%">
                        <Box flex={1} minW={0}>
                          <Text fontWeight="600" fontSize="sm" color={ACCENT} lineHeight="tall">
                            {item._title}
                          </Text>
                          <Text fontSize="xs" color="gray.600" mt={0.5}>
                            {formatShortDate(item._date)}
                            {item._type ? (
                              <>
                                {" "}
                                <Text as="span" color="gray.400">•</Text>{" "}
                                {item._type}
                              </>
                            ) : null}
                          </Text>
                        </Box>
                        <Badge colorScheme={cfg.badge} size="sm" fontWeight="500" flexShrink={0}>
                          {cfg.label}
                        </Badge>
                      </Flex>
                    </Box>
                  );
                })
              )}
            </VStack>
            {!isViewMode && (
              <Button size="sm" mt={4} as={RouterLink} to="/student/placements/events" colorScheme="blue" variant="outline">
                View all events
              </Button>
            )}
          </Box>

          <Box
            bg={CARD_BG}
            p={5}
            borderRadius={CARD_RADIUS}
            shadow={CARD_SHADOW}
            minW={0}
            borderWidth="1px"
            borderColor="gray.100"
            _hover={{ shadow: "lg", borderColor: "gray.200" }}
            transition="all 0.2s ease"
          >
            <Heading size="sm" color={ACCENT} mb={4} fontWeight="600" letterSpacing="-0.01em">
              Upcoming drives
            </Heading>
            <VStack align="stretch" gap={3} spacing={0}>
              {upcomingDrivesSorted.length === 0 ? (
                <Text color="gray.500" fontSize="sm" py={4}>
                  No upcoming drives.
                </Text>
              ) : (
                upcomingDrivesSorted.map((drive) => {
                  const proc = processByDriveId[drive.id];
                  const isRegistered = String(proc?.registration_status || "").toLowerCase() === "registered" || String(proc?.final_select_status || "").toLowerCase() === "selected";
                  const companyName = drive.company?.company_name || drive.company_name || "Company";
                  const dateStr = formatShortDate(drive.last_date_to_registration || drive.event_datetime);
                  const jobType = drive.job_type || drive.job_role || "Role";
                  const ds = String(drive.placement_status || "").toLowerCase();
                  const driveStatusConfig = {
                    ongoing: { border: "green.500", badge: "green", label: "Ongoing" },
                    upcoming: { border: ACCENT_LIGHT, badge: "yellow", label: "Upcoming" },
                    scheduled: { border: ACCENT_LIGHT, badge: "yellow", label: "Upcoming" },
                    completed: { border: "gray.400", badge: "gray", label: "Completed" },
                    cancelled: { border: "red.400", badge: "red", label: "Cancelled" },
                    failed: { border: "red.400", badge: "red", label: "Failed" },
                    postponed: { border: "orange.400", badge: "orange", label: "Postponed" },
                  };
                  const dCfg = driveStatusConfig[ds] || driveStatusConfig.scheduled;
                  return (
                    <Box
                      key={drive.id}
                      p={3}
                      pl={4}
                      minH="60px"
                      display="flex"
                      alignItems="center"
                      borderRadius="lg"
                      bg="gray.50"
                      borderLeft="4px solid"
                      borderColor={dCfg.border}
                      transition="all 0.2s ease"
                      _hover={{
                        bg: "white",
                        shadow: "sm",
                        transform: "translateX(2px)",
                      }}
                    >
                      <Flex justify="space-between" align="center" gap={2} w="100%">
                        <Box flex={1} minW={0}>
                          <Text fontWeight="600" fontSize="sm" color={ACCENT} lineHeight="tall">
                            {companyName}
                          </Text>
                          <Text fontSize="xs" color="gray.600" mt={0.5}>
                            {dateStr}
                            <Text as="span" color="gray.400" mx={1}>•</Text>
                            {jobType}
                          </Text>
                        </Box>
                        <HStack gap={2} flexShrink={0}>
                          <Badge colorScheme={dCfg.badge} size="sm" fontWeight="500">
                            {dCfg.label}
                          </Badge>
                          {isRegistered && (
                            <Icon as={FaCheckCircle} color="green.500" boxSize={4} aria-label="Registered" />
                          )}
                          {!isViewMode && (
                            <Link as={RouterLink} to={`/student/placements/drive/${drive.id}`} fontSize="xs" color="blue.600" fontWeight="500">
                              View
                            </Link>
                          )}
                        </HStack>
                      </Flex>
                    </Box>
                  );
                })
              )}
            </VStack>
            {!isViewMode && (
              <Button size="sm" mt={4} as={RouterLink} to="/student/placements/feed" colorScheme="blue" variant="outline">
                All drives
              </Button>
            )}
          </Box>
        </Grid>
        )}

        {/* Profile & placement status + Offers summary */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 4, md: 5 }} mb={6} w="100%" minW={0}>
          <Box bg={CARD_BG} p={4} borderRadius={CARD_RADIUS} shadow={CARD_SHADOW} minW={0} h="100%">
            <Heading size="sm" color={ACCENT} mb={3}>
              Profile & placement status
            </Heading>
            <Progress value={completionPercentage} colorScheme="blue" borderRadius="full" size="sm" mb={3} />
            <Text fontWeight="semibold" color={ACCENT} mb={2}>
              {completionPercentage}% complete
            </Text>
            {missingSections.length > 0 && (
              <Text fontSize="sm" color="gray.600" mb={2}>
                Missing: {missingSections.map((s) => s.label).join(", ")}
              </Text>
            )}
            <HStack mb={2}>
              <Icon as={resumeUploaded ? FaCheckCircle : FaTimesCircle} color={resumeUploaded ? "green.500" : "gray.400"} />
              <Text fontSize="sm">{resumeUploaded ? "Resume uploaded" : "Resume not uploaded"}</Text>
            </HStack>
            <HStack mb={2}>
              <Icon as={optIn ? FaCheckCircle : FaTimesCircle} color={optIn ? "green.500" : "gray.400"} />
              <Text fontSize="sm">Placement opt-in: {optIn ? "Yes" : "No"}</Text>
            </HStack>
            <HStack mb={4}>
              <Icon as={placementPolicyAgreed ? FaCheckCircle : FaTimesCircle} color={placementPolicyAgreed ? "green.500" : "gray.400"} />
              <Text fontSize="sm">Placement policy: {placementPolicyAgreed ? "Agreed" : "Not agreed"}</Text>
            </HStack>
            {!isViewMode && (
              <Wrap spacing={2}>
                <Button size="sm" as={RouterLink} to="/student/profile" colorScheme="blue" variant="outline">
                  Complete profile
                </Button>
                {!resumeUploaded && (
                  <Button size="sm" as={RouterLink} to="/student/profile?section=resume" colorScheme="teal" variant="outline">
                    Upload resume
                  </Button>
                )}
                {!placementPolicyAgreed && (
                  <Button size="sm" as={RouterLink} to="/student/placements/policy" colorScheme="orange" variant="outline">
                    Agree to policy
                  </Button>
                )}
              </Wrap>
            )}
            {isViewMode && basePath && (
              <Button size="sm" as={RouterLink} to={`${basePath}/personal`} colorScheme="blue" variant="outline">
                View profile
              </Button>
            )}
          </Box>

          <Box bg={CARD_BG} p={4} borderRadius={CARD_RADIUS} shadow={CARD_SHADOW} minW={0} h="100%">
            <Heading size="sm" color={ACCENT} mb={3}>
              Offers summary
            </Heading>
            <VStack align="stretch" spacing={2}>
              <Text fontWeight="semibold" color={ACCENT}>
                Total: {jobOffers.length}
              </Text>
              {highestCtc != null && !Number.isNaN(highestCtc) && (
                <Text fontSize="sm" color="gray.600">
                  Highest CTC: {highestCtc} LPA
                </Text>
              )}
              <HStack gap={2} flexWrap="wrap">
                <Badge colorScheme="green">Accepted: {acceptedOffers.length}</Badge>
                <Badge colorScheme="yellow">Pending: {pendingOffers.length}</Badge>
              </HStack>
            </VStack>
            {!isViewMode && (
              <Button size="sm" mt={4} as={RouterLink} to="/student/placements/offers" colorScheme="blue" variant="outline">
                View all offers
              </Button>
            )}
          </Box>
        </SimpleGrid>

        {/* Portfolio overview */}
        <Box bg={CARD_BG} p={4} borderRadius={CARD_RADIUS} shadow={CARD_SHADOW} mb={6} w="100%" minW={0}>
          <Heading size="sm" color={ACCENT} mb={3}>
            Portfolio overview
          </Heading>
          {portfolioCounts ? (
            <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} gap={4}>
              {[
                { key: "projects", label: "Projects", icon: FaChartBar, path: "/student/profile?section=projects", segment: "projects" },
                { key: "internships", label: "Internships", icon: FaBriefcase, path: "/student/profile?section=internships", segment: "internships" },
                { key: "trainings", label: "Trainings", icon: FaChalkboardTeacher, path: "/student/profile?section=trainings", segment: "trainings" },
                { key: "certifications", label: "Certifications", icon: FaCertificate, path: "/student/profile?section=certifications", segment: "certifications" },
                { key: "publications", label: "Publications", icon: FaBook, path: "/student/profile?section=publications", segment: "publications" },
                { key: "extraCurricular", label: "Extra-curricular", icon: FaMedal, path: "/student/profile?section=extra-curricular", segment: "extra-curricular" },
              ].map(({ key, label, icon: IconItem, path, segment }) => {
                const to = isViewMode && basePath ? `${basePath}/${segment}` : path;
                return (
                  <Link key={key} as={RouterLink} to={to} _hover={{ textDecoration: "none" }}>
                    <Box
                      p={3}
                      borderWidth="1px"
                      borderRadius="lg"
                      borderColor="gray.100"
                      _hover={{ borderColor: ACCENT_LIGHT, shadow: "md" }}
                      textAlign="center"
                    >
                      <Icon as={IconItem} color={ACCENT} mb={2} />
                      <Text fontSize="sm" fontWeight="semibold" color={ACCENT}>
                        {portfolioCounts[key] ?? 0}
                      </Text>
                      <Text fontSize="xs" color="gray.600">{label}</Text>
                    </Box>
                  </Link>
                );
              })}
            </SimpleGrid>
          ) : (
            <Text color="gray.500">Complete your profile to see portfolio counts.</Text>
          )}
          {!isViewMode && (
            <Button size="sm" mt={4} as={RouterLink} to="/student/profile" variant="ghost">
              Edit portfolio
            </Button>
          )}
          {isViewMode && basePath && (
            <Button size="sm" mt={4} as={RouterLink} to={`${basePath}/personal`} variant="ghost">
              View profile
            </Button>
          )}
        </Box>

      </Box>
    </Box>
  );
};
