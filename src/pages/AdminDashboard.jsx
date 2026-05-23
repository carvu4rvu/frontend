import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  useColorModeValue,
  Icon,
  Container,
  Button,
  Image,
  Stack,
  Divider,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Link,
  Tag,
  Spinner,
  Center
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { 
  FiUsers, 
  FiExternalLink, 
  FiBriefcase, 
  FiMapPin, 
  FiGlobe, 
  FiActivity, 
  FiLayers, 
  FiCheckSquare, 
  FiClock, 
  FiTrendingUp 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import VcLayout from '../components/VcLayout';
import { PlacementService } from '../services/placement.service';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- Animation Keyframes ---
const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

function formatLpaDisplay(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '0 LPA';
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${rounded} LPA`;
}

/** Combine per-school CTC rows (from placementBySchool) for filtered dashboard view. */
function aggregateSchoolCtcRows(rows) {
  const distribution = [0, 0, 0, 0, 0, 0, 0, 0];
  let maxLpa = 0;
  let minLpa = null;
  let weightedSum = 0;
  let weightedCount = 0;

  rows.forEach((row) => {
    (row.ctcDistribution || []).forEach((count, idx) => {
      if (idx < distribution.length) distribution[idx] += count;
    });
    const max = row.ctc?.maxLpa ?? 0;
    const min = row.ctc?.minLpa ?? 0;
    const avg = row.ctc?.avgLpa ?? 0;
    const count = row.ctcOfferCount ?? 0;
    if (max > maxLpa) maxLpa = max;
    if (min > 0 && (minLpa == null || min < minLpa)) minLpa = min;
    if (avg > 0 && count > 0) {
      weightedSum += avg * count;
      weightedCount += count;
    }
  });

  const avgLpa = weightedCount > 0 ? weightedSum / weightedCount : 0;
  return {
    ctc: {
      highest: formatLpaDisplay(maxLpa),
      average: formatLpaDisplay(avgLpa),
      lowest: formatLpaDisplay(minLpa ?? 0),
    },
    distribution,
  };
}

// --- Sub-Components for the Dashboard ---

const MainStatCard = ({ title, value, bg = "#20343c" }) => (
  <Box
    bg={bg}
    color="white"
    p={8}
    borderRadius="xl"
    boxShadow="lg"
    position="relative"
    overflow="hidden"
    _before={{
      content: '""',
      position: "absolute",
      top: "-10%",
      right: "-5%",
      width: "150px",
      height: "150px",
      bg: "whiteAlpha.100",
      borderRadius: "full",
    }}
  >
    <VStack align="start" spacing={1}>
      <Flex align="center" mb={2}>
        <Icon as={FiUsers} mr={3} boxSize={6} color="orange.400" />
        <Text fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" mb={2} opacity={0.9}>
          {title}
        </Text>
      </Flex>
      <Heading size="3xl" fontWeight="extrabold">
        {value}
      </Heading>
      <Text fontSize="sm" opacity={0.7} mt={2}>
        Academic Year 2025-26
      </Text>
    </VStack>
  </Box>
);

const SchoolStatCard = ({ school, count, isSelected, onClick }) => (
  <Box
    as="button"
    onClick={onClick}
    w="100%"
    h="100%"
    bg={isSelected ? "#20343c" : "white"}
    p={3}
    borderRadius="lg"
    border="2px solid"
    borderColor={isSelected ? "#d1a85d" : "gray.100"}
    boxShadow={isSelected ? "md" : "sm"}
    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    _hover={{
      transform: 'translateY(-4px)',
      boxShadow: 'xl',
      borderColor: isSelected ? "#d1a85d" : "blue.200",
      zIndex: 1
    }}
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    position="relative"
    overflow="hidden"
  >
    <Text fontSize="xs" fontWeight="bold" color={isSelected ? "white" : "gray.600"} mb={1}>
      {school}
    </Text>
    <Text fontSize="2xl" fontWeight="bold" color={isSelected ? "#d1a85d" : "#3182ce"}>
      {count}
    </Text>
  </Box>
);

const MetricCard = ({ title, value, subtitle, subtitleColor, icon, iconColor, trend }) => (
  <Box
    bg="white"
    p={5}
    borderRadius="xl"
    boxShadow="sm"
    border="1px solid"
    borderColor="gray.100"
    height="100%"
    transition="all 0.3s"
    _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
  >
    <Flex justify="space-between" align="start" mb={4}>
      <Box>
        <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wide" mb={1}>
          {title}
        </Text>
        <Heading size="lg" color="gray.800" fontWeight="bold">
          {value}
        </Heading>
      </Box>
      {icon && (
        <Box 
          p={2} 
          bg={`${iconColor || 'blue'}.50`} 
          borderRadius="lg" 
          color={`${iconColor || 'blue'}.500`}
        >
          <Icon as={icon} boxSize={5} />
        </Box>
      )}
    </Flex>
    
    {(subtitle || trend) && (
      <Flex align="center" mt={2}>
        {trend && (
          <Badge colorScheme={trend > 0 ? "green" : "red"} mr={2} borderRadius="full" px={2}>
            {trend > 0 ? "+" : ""}{trend}%
          </Badge>
        )}
        {subtitle && (
          <Text fontSize="xs" fontWeight="semibold" color={subtitleColor || "gray.500"}>
            {subtitle}
          </Text>
        )}
      </Flex>
    )}
  </Box>
);

const CTCCard = ({ title, value, bg, color = "gray.800" }) => (
  <Box
    bg={bg}
    p={4}
    borderRadius="lg"
    border="1px solid"
    borderColor={`${bg.split('.')[0]}.200`}
  >
    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={1}>
      {title}
    </Text>
    <Heading size="md" color={color} fontWeight="extrabold">
      {value}
    </Heading>
  </Box>
);

const PartnerLogo = ({ name, color, logo, onClick, style }) => {
  const [imgError, setImgError] = React.useState(false);
  const showFallback = !logo || imgError;
  return (
    <Flex 
      align="center" 
      justify="center" 
      bg="white" 
      h="80px" 
      w="200px"
      px={6} 
      borderRadius="md" 
      border="1px solid" 
      borderColor="gray.100"
      flexShrink={0}
      mx={3}
      boxShadow="sm"
      onClick={onClick}
      cursor="pointer"
      _hover={{ borderColor: "blue.300", transform: "scale(1.02)", boxShadow: "md" }}
      transition="all 0.2s"
    >
      {showFallback ? (
        <Text 
          fontWeight="bold" 
          color={style?.color || color} 
          fontSize="xl" 
          fontFamily={style?.fontFamily || "serif"} 
          textAlign="center"
          noOfLines={2}
        >
          {name}
        </Text>
      ) : (
        <Image 
          src={logo} 
          alt={name} 
          maxH="50px" 
          maxW="150px" 
          objectFit="contain" 
          onError={() => setImgError(true)}
        />
      )}
    </Flex>
  );
};

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const isVc = (userRole || '').toLowerCase() === 'vc';
  const [loading, setLoading] = useState(true);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const { isOpen: isCompanyOpen, onOpen: onCompanyOpen, onClose: onCompanyClose } = useDisclosure();
  const { isOpen: isAllCompaniesOpen, onOpen: onAllCompaniesOpen, onClose: onAllCompaniesClose } = useDisclosure();
  const [selectedCompany, setSelectedCompany] = useState(null);

  // State for data
  const [stats, setStats] = useState({
    totalRegistered: 0,
    totalStudents: 0,
    schoolWise: [],
    drives: { total: 0, ongoing: 0, upcoming: 0, completed: 0 },
    offers: { total: 0, percent: '0%', placed: 0, placedPercent: '0%' },
    breakdown: { fullTime: 0, fullTimePercent: '0%', internships: 0, internshipsPercent: '0%', internshipCumFulltime: 0, internshipCumFulltimePercent: '0%' },
    ctc: { highest: '0 LPA', average: '0 LPA', lowest: '0 LPA' }
  });
  const [partners, setPartners] = useState([]);
  const [placementTableData, setPlacementTableData] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const analytics = await PlacementService.getDashboardAnalytics();
        if (!analytics) return;

        setStats({
          totalRegistered: analytics.students?.totalRegistered ?? 0,
          totalStudents: analytics.students?.totalSeeking ?? 0,
          schoolWise: analytics.students?.schoolWise ?? [],
          drives: analytics.drives ?? { total: 0, ongoing: 0, upcoming: 0, completed: 0 },
          offers: analytics.offers ?? { total: 0, percent: '0%', placed: 0, placedPercent: '0%' },
          breakdown: analytics.breakdown ?? {
            fullTime: 0,
            fullTimePercent: '0%',
            internships: 0,
            internshipsPercent: '0%',
            internshipCumFulltime: 0,
            internshipCumFulltimePercent: '0%',
          },
          ctc: analytics.ctc ?? { highest: '0 LPA', average: '0 LPA', lowest: '0 LPA' },
        });

        setPlacementTableData(analytics.placementBySchool ?? []);

        const chartLabels = analytics.chart?.labels ?? [];
        const chartValues = analytics.chart?.data ?? [];
        setChartData({
          labels: chartLabels,
          datasets: [{
            label: 'Number of Students',
            data: chartValues,
            borderColor: '#2d3748',
            backgroundColor: 'rgba(45, 55, 72, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#2d3748',
          }],
        });

        setPartners((analytics.partners ?? []).map((c) => ({
          name: c.name,
          color: c.color || 'gray.600',
          fontFamily: c.fontFamily,
          logo: c.logo,
          industry: c.industry || c.company_type || 'Technology',
          website: c.website || '',
          location: c.location || 'Unknown',
          description: c.description || '',
          style: {
            color: c.color,
            fontFamily: c.fontFamily,
          },
        })));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper to handle school selection
  const toggleSchool = (schoolName) => {
    setSelectedSchools(prev => 
      prev.includes(schoolName) 
        ? prev.filter(s => s !== schoolName)
        : [...prev, schoolName]
    );
  };

  // Filter logic
  const filteredData = selectedSchools.length > 0
    ? placementTableData.filter(row => selectedSchools.includes(row.school))
    : placementTableData;

  // Calculate Aggregates
  const aggregatedStats = selectedSchools.length > 0 ? (() => {
    const totalOffers = filteredData.reduce((sum, row) => sum + row.totalOffers, 0);
    const totalSeeking = filteredData.reduce((sum, row) => sum + row.total, 0);
    const placed = filteredData.reduce((sum, row) => sum + row.placed, 0);
    const fullTime = filteredData.reduce((sum, row) => sum + row.fullTime, 0);
    const internships = filteredData.reduce((sum, row) => sum + row.internship, 0);
    const internshipCumFulltime = filteredData.reduce((sum, row) => sum + row.ppo, 0);

    return {
      offers: {
        total: totalOffers,
        percent: totalSeeking > 0 ? ((totalOffers / totalSeeking) * 100).toFixed(2) + '%' : '0%',
        placed,
        placedPercent: totalSeeking > 0 ? ((placed / totalSeeking) * 100).toFixed(2) + '%' : '0%',
      },
      breakdown: {
        fullTime,
        fullTimePercent: placed > 0 ? ((fullTime / placed) * 100).toFixed(2) + '%' : '0%',
        internships,
        internshipsPercent: placed > 0 ? ((internships / placed) * 100).toFixed(2) + '%' : '0%',
        internshipCumFulltime,
        internshipCumFulltimePercent: placed > 0 ? ((internshipCumFulltime / placed) * 100).toFixed(2) + '%' : '0%',
      },
    };
  })() : stats; // Use default stats if no filter

  const displayedCtc = useMemo(() => {
    if (selectedSchools.length === 0) return stats.ctc;
    const rows = placementTableData.filter((row) => selectedSchools.includes(row.school));
    if (!rows.length || !rows.some((row) => row.ctcDistribution)) return stats.ctc;
    return aggregateSchoolCtcRows(rows).ctc;
  }, [selectedSchools, placementTableData, stats.ctc]);

  const displayedChartData = useMemo(() => {
    if (selectedSchools.length === 0) return chartData;
    const rows = placementTableData.filter((row) => selectedSchools.includes(row.school));
    if (!rows.length || !rows.some((row) => row.ctcDistribution)) return chartData;
    const { distribution } = aggregateSchoolCtcRows(rows);
    const baseDataset = chartData.datasets?.[0] || {};
    return {
      labels: chartData.labels,
      datasets: [{
        label: baseDataset.label || 'Number of Students',
        data: distribution,
        borderColor: baseDataset.borderColor || '#2d3748',
        backgroundColor: baseDataset.backgroundColor || 'rgba(45, 55, 72, 0.1)',
        fill: baseDataset.fill ?? true,
        tension: baseDataset.tension ?? 0.4,
        pointBackgroundColor: baseDataset.pointBackgroundColor || '#2d3748',
      }],
    };
  }, [selectedSchools, placementTableData, chartData]);

  const handlePartnerClick = (partner) => {
    setSelectedCompany(partner);
    onCompanyOpen();
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { borderDash: [2, 4] }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  // Calculate marquee duration based on number of partners to ensure consistent speed
  const marqueeDuration = Math.max(30, partners.length * 4);

  const Layout = isVc ? VcLayout : AdminLayout;
  return (
    <Layout>
      <Box bg="#f0f0f0" minH="100vh" pb={10}>
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} pt={8}>
          <VStack spacing={8} align="stretch">
            
            {/* Header */}
            <Box>
              <Heading as="h1" size="lg" color="gray.800" mb={1}>
                {isVc ? 'Placement Dashboard' : 'Admin Overview'}
              </Heading>
              <Text color="gray.500" fontSize="sm">
                {isVc
                  ? 'Read-only overview of placement metrics, drives, offers, and recruiting partners.'
                  : 'Key metrics and placement statistics.'}
              </Text>
            </Box>

            {loading ? (
              <Center h="50vh">
                <Spinner size="xl" thickness='4px' speed='0.65s' emptyColor='gray.200' color='blue.500' />
              </Center>
            ) : (
              <>
                {/* 1. Main Stat Card */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <MainStatCard 
                    title="Total Registered Students" 
                    value={stats.totalRegistered} 
                    bg="#172e36"
                  />
                  <MainStatCard 
                    title="Total Placement Seeking" 
                    value={stats.totalStudents} 
                    bg="#20343c"
                  />
                </SimpleGrid>

                {/* 2. Drive Stats Row */}
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
                  <MetricCard 
                    title="TOTAL DRIVES" 
                    value={stats.drives.total} 
                    icon={FiLayers} 
                    iconColor="blue"
                  />
                  <MetricCard 
                    title="ONGOING DRIVES" 
                    value={stats.drives.ongoing} 
                    icon={FiActivity} 
                    iconColor="orange"
                    subtitle="Actively hiring"
                  />
                  <MetricCard 
                    title="UPCOMING DRIVES" 
                    value={stats.drives.upcoming} 
                    icon={FiClock} 
                    iconColor="purple"
                    subtitle="Scheduled next"
                  />
                  <MetricCard 
                    title="COMPLETED DRIVES" 
                    value={stats.drives.completed} 
                    icon={FiCheckSquare} 
                    iconColor="green"
                    subtitle="Successfully closed"
                  />
                </SimpleGrid>

                {/* 3. School-wise Stats */}
                <Box>
                  <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={3}>
                    Total Students School-wise
                  </Text>
                  <Text fontSize="xs" color="gray.400" mb={4}>
                    Click on schools to filter. Select multiple schools to view combined statistics.
                  </Text>
                  <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 8 }} spacing={3}>
                    {stats.schoolWise.map((school, idx) => (
                      <SchoolStatCard 
                        key={idx} 
                        school={school.name} 
                        count={school.count} 
                        isSelected={selectedSchools.includes(school.name)}
                        onClick={() => toggleSchool(school.name)}
                      />
                    ))}
                  </SimpleGrid>
                </Box>

                {/* 4. Placement Stats Rows */}
                <VStack spacing={4} align="stretch">
                  {/* Row 1 */}
                  <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                    <MetricCard 
                      title="TOTAL OFFERS" 
                      value={aggregatedStats.offers.total} 
                      icon={FiBriefcase}
                      iconColor="blue"
                    />
                    <MetricCard 
                      title="TOTAL OFFERS PERCENTAGE" 
                      value={aggregatedStats.offers.percent} 
                      subtitleColor="orange.400"
                      icon={FiTrendingUp}
                      iconColor="orange"
                    />
                    <MetricCard 
                      title="TOTAL PLACED" 
                      value={aggregatedStats.offers.placed} 
                      icon={FiCheckSquare}
                      iconColor="green"
                    />
                    <MetricCard 
                      title="TOTAL PLACED PERCENTAGE" 
                      value={aggregatedStats.offers.placedPercent} 
                      subtitleColor="orange.400"
                      icon={FiTrendingUp}
                      iconColor="green"
                    />
                  </SimpleGrid>

                  {/* Row 2 */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <MetricCard 
                      title="TOTAL FULL TIME" 
                      value={aggregatedStats.breakdown.fullTime}
                      subtitle={`Total Full time %: ${aggregatedStats.breakdown.fullTimePercent}`}
                      subtitleColor="green.600"
                    />
                    <MetricCard 
                      title="TOTAL INTERNSHIPS" 
                      value={aggregatedStats.breakdown.internships}
                      subtitle={`Total Internships %: ${aggregatedStats.breakdown.internshipsPercent}`}
                      subtitleColor="purple.600"
                    />
                    <MetricCard 
                      title="TOTAL INTERNSHIP-CUM-FULLTIME" 
                      value={aggregatedStats.breakdown.internshipCumFulltime}
                      subtitle={`Total Internship cum Fulltime %: ${aggregatedStats.breakdown.internshipCumFulltimePercent}`}
                      subtitleColor="orange.600"
                    />
                  </SimpleGrid>
                </VStack>

                {/* 5. CTC Financial Summary */}
                <Box bg="white" p={6} borderRadius="xl" boxShadow="sm">
                  <Heading size="md" mb={6} color="orange.400" display="flex" alignItems="center">
                    <Text as="span" mr={2}>$</Text> 
                    CTC Financial Summary (Cost to Company)
                  </Heading>
                  
                  <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
                    {/* Chart */}
                    <GridItem>
                      <Text fontSize="xs" textAlign="center" color="gray.500" mb={4}>
                        Placement Frequency by CTC Range
                        {selectedSchools.length > 0 && (
                          <Text as="span" color="blue.500" fontWeight="semibold">
                            {' '}({selectedSchools.length === 1 ? selectedSchools[0] : `${selectedSchools.length} schools`})
                          </Text>
                        )}
                      </Text>
                      <Box h="300px">
                        <Line data={displayedChartData} options={chartOptions} />
                      </Box>
                      <Text fontSize="xs" textAlign="center" color="gray.400" mt={2}>CTC Range (LPA)</Text>
                    </GridItem>

                    {/* Key Metrics */}
                    <GridItem>
                      <VStack spacing={4} align="stretch" h="100%" justify="center">
                        <CTCCard 
                          title="HIGHEST CTC" 
                          value={displayedCtc.highest} 
                          bg="green.50" 
                          color="green.600" 
                        />
                        <CTCCard 
                          title="AVERAGE CTC" 
                          value={displayedCtc.average} 
                          bg="blue.50" 
                          color="blue.600" 
                        />
                        <CTCCard 
                          title="LOWEST CTC" 
                          value={displayedCtc.lowest} 
                          bg="red.50" 
                          color="red.600" 
                        />
                      </VStack>
                    </GridItem>
                  </Grid>
                </Box>

                {/* 6. Hiring Partners (Animated Marquee) */}
                {partners.length > 0 && (
                  <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" overflow="hidden">
                    <Flex justify="space-between" align="center" mb={6}>
                      <Heading size="sm" color="gray.700">
                        Hiring Partners <Text as="span" color="blue.500">({partners.length} Companies)</Text>
                      </Heading>
                      <Button size="xs" variant="outline" colorScheme="gray" onClick={() => navigate('/placement/companies')}>View All</Button>
                    </Flex>
                    
                    <Box 
                      position="relative" 
                      width="100%" 
                      overflow="hidden"
                      _before={{
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "50px",
                        bgGradient: "linear(to-r, white, transparent)",
                        zIndex: 2
                      }}
                      _after={{
                        content: '""',
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: "50px",
                        bgGradient: "linear(to-l, white, transparent)",
                        zIndex: 2
                      }}
                    >
                      <Flex
                        as="div"
                        animation={`${scroll} ${marqueeDuration}s linear infinite`}
                        width="max-content"
                        _hover={{ animationPlayState: "paused" }}
                      >
                        {/* First set of partners */}
                        {partners.map((partner, idx) => (
                          <PartnerLogo key={`p1-${idx}`} name={partner.name} color={partner.color} logo={partner.logo} style={partner.style} onClick={() => handlePartnerClick(partner)} />
                        ))}
                        {/* Duplicate set for seamless loop */}
                        {partners.map((partner, idx) => (
                          <PartnerLogo key={`p2-${idx}`} name={partner.name} color={partner.color} logo={partner.logo} style={partner.style} onClick={() => handlePartnerClick(partner)} />
                        ))}
                        {/* Triplicate set for wide screens */}
                        {partners.map((partner, idx) => (
                          <PartnerLogo key={`p3-${idx}`} name={partner.name} color={partner.color} logo={partner.logo} style={partner.style} onClick={() => handlePartnerClick(partner)} />
                        ))}
                      </Flex>
                    </Box>
                  </Box>
                )}

                {/* 7. Placement by School Table */}
                <Box>
                  <Heading size="md" color="gray.800" mb={1}>Placement by School</Heading>
                  <Text fontSize="sm" color="gray.500" mb={4}>School-wise placement summary</Text>
                  
                  <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="sm" border="1px solid" borderColor="gray.200">
                    <TableContainer>
                      <Table variant="simple">
                        <Thead bg="#172e36">
                          <Tr>
                            <Th color="white" py={4}>SCHOOL</Th>
                            <Th color="white" isNumeric py={4}>TOTAL STUDENTS</Th>
                            <Th color="white" isNumeric py={4}>FULL TIME JOB</Th>
                            <Th color="white" isNumeric py={4}>INTERNSHIP</Th>
                            <Th color="white" isNumeric py={4}>PPO</Th>
                            <Th color="white" isNumeric py={4}>TOTAL OFFERS</Th>
                            <Th color="white" isNumeric py={4}>OFFER %</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredData.map((row, index) => (
                            <Tr key={index} _hover={{ bg: "gray.50" }}>
                              <Td fontWeight="medium" color="gray.700">{row.school}</Td>
                              <Td isNumeric fontWeight="bold" color="gray.800">{row.total}</Td>
                              <Td isNumeric fontWeight="bold" color="blue.600">{row.fullTime}</Td>
                              <Td isNumeric fontWeight="bold" color="purple.600">{row.internship}</Td>
                              <Td isNumeric fontWeight="bold" color="orange.500">{row.ppo}</Td>
                              <Td isNumeric fontWeight="bold" color="green.700">{row.totalOffers}</Td>
                              <Td isNumeric>
                                <Badge 
                                  colorScheme={row.percent > 50 ? "green" : row.percent > 0 ? "blue" : "red"} 
                                  variant="subtle"
                                  px={2}
                                  py={1}
                                  borderRadius="md"
                                >
                                  {row.percent}%
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                          {/* Total Row */}
                          <Tr bg="#172e36">
                            <Td color="white" fontWeight="extrabold" fontSize="md">TOTAL</Td>
                            <Td isNumeric color="white" fontWeight="extrabold">
                              {selectedSchools.length > 0 ? filteredData.reduce((sum, row) => sum + row.total, 0) : stats.totalStudents}
                            </Td>
                            <Td isNumeric color="blue.200" fontWeight="extrabold" fontSize="lg">{selectedSchools.length > 0 ? aggregatedStats.breakdown.fullTime : stats.breakdown.fullTime}</Td>
                            <Td isNumeric color="purple.200" fontWeight="extrabold" fontSize="lg">{selectedSchools.length > 0 ? aggregatedStats.breakdown.internships : stats.breakdown.internships}</Td>
                            <Td isNumeric color="orange.200" fontWeight="extrabold" fontSize="lg">{selectedSchools.length > 0 ? aggregatedStats.breakdown.internshipCumFulltime : stats.breakdown.internshipCumFulltime}</Td>
                            <Td isNumeric color="green.200" fontWeight="extrabold" fontSize="lg">{selectedSchools.length > 0 ? aggregatedStats.offers.total : stats.offers.total}</Td>
                            <Td isNumeric color="white" fontWeight="extrabold" fontSize="lg">{selectedSchools.length > 0 ? aggregatedStats.offers.percent : stats.offers.percent}</Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              </>
            )}

          </VStack>
        </Container>
      </Box>

      {/* Company Details Modal */}
      <Modal isOpen={isCompanyOpen} onClose={onCompanyClose} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={3}>
              <Box bg="gray.100" p={2} borderRadius="md">
                <Text fontWeight="bold" color={selectedCompany?.color} fontFamily="serif">
                  {selectedCompany?.name}
                </Text>
              </Box>
              <Text>{selectedCompany?.name}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>Description</Text>
                <Text color="gray.700">{selectedCompany?.description || 'No description available'}</Text>
              </Box>
              
              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <Flex align="center" gap={2} mb={1}>
                    <Icon as={FiBriefcase} color="gray.400" />
                    <Text fontSize="sm" color="gray.500">Industry</Text>
                  </Flex>
                  <Tag size="md" variant="subtle" colorScheme="blue">{selectedCompany?.industry}</Tag>
                </Box>
                <Box>
                  <Flex align="center" gap={2} mb={1}>
                    <Icon as={FiMapPin} color="gray.400" />
                    <Text fontSize="sm" color="gray.500">Location</Text>
                  </Flex>
                  <Text fontWeight="medium">{selectedCompany?.location}</Text>
                </Box>
              </SimpleGrid>

              {selectedCompany?.website && (
                <Box pt={2}>
                  <Flex align="center" gap={2} mb={1}>
                    <Icon as={FiGlobe} color="gray.400" />
                    <Text fontSize="sm" color="gray.500">Website</Text>
                  </Flex>
                  <Link href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`} isExternal color="blue.500" fontWeight="medium">
                    {selectedCompany.website} <Icon as={FiExternalLink} mx="2px" />
                  </Link>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter bg="gray.50">
            <Button colorScheme="blue" mr={3} onClick={onCompanyClose}>
              Close
            </Button>
            <Button variant="ghost" onClick={() => navigate('/placement/companies')}>View All Companies</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* All Companies Modal */}
      <Modal isOpen={isAllCompaniesOpen} onClose={onAllCompaniesClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>All Hiring Partners</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} pb={6}>
              {partners.map((partner, idx) => (
                <Box 
                  key={idx} 
                  p={4} 
                  border="1px solid" 
                  borderColor="gray.200" 
                  borderRadius="md" 
                  cursor="pointer"
                  _hover={{ borderColor: "blue.300", bg: "blue.50" }}
                  onClick={() => {
                    onAllCompaniesClose();
                    handlePartnerClick(partner);
                  }}
                >
                  <Text fontWeight="bold" color={partner.color} textAlign="center" mb={2} fontFamily="serif">
                    {partner.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500" textAlign="center">{partner.industry}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default AdminDashboard;
