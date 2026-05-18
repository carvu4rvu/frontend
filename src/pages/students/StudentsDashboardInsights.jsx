import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Spinner,
  useToast,
  HStack,
  Button,
  Flex,
  Stack,
} from '@chakra-ui/react';
import { FiUsers, FiBriefcase, FiTrendingUp, FiAward, FiAlertCircle, FiAlertTriangle, FiLock, FiFileText } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { PlacementService } from '../../services/placement.service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const slate = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
};

export default function StudentsDashboardInsights() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [schoolsList, setSchoolsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    PlacementService.getStudentsOverviewTable({ limit: 5000 })
      .then((data) => {
        if (!cancelled) {
          setRows(data.rows || []);
          setSchoolsList(data.schoolsList || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast({ title: 'Failed to load insights', description: err?.message, status: 'error', isClosable: true });
          setRows([]);
          setSchoolsList([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [toast]);

  const stats = useMemo(() => {
    const total = rows.length;
    const totalOffers = rows.reduce((acc, r) => acc + (r.offers_count ?? 0), 0);
    const totalInternshipOffers = rows.reduce((acc, r) => acc + (r.internship_offers ?? 0), 0);
    const placedStudents = rows.filter((r) => (r.offers_count ?? 0) > 0).length;
    const maxCTC = rows.reduce((max, r) => {
      const c = r.max_ctc_lpa != null ? Number(r.max_ctc_lpa) : 0;
      return c > max ? c : max;
    }, 0);
    const placementRate = total > 0 ? ((placedStudents / total) * 100).toFixed(1) : '0';
    const totalDrivesAbsent = rows.reduce((acc, r) => acc + (r.drives_absent ?? 0), 0);
    const placementViolations = rows.filter((r) => (r.placement_violations ?? 0) > 0).length;
    const disciplinary = rows.filter((r) => (r.disciplinary ?? 0) > 0).length;
    const adminHold = rows.filter((r) => r.admin_hold).length;
    const malpractice = rows.filter((r) => (r.malpractice ?? 0) > 0).length;
    return {
      total, totalOffers, totalInternshipOffers, placedStudents, maxCTC, placementRate,
      totalDrivesAbsent, placementViolations, disciplinary, adminHold, malpractice,
    };
  }, [rows]);

  const schoolOfferData = useMemo(() => {
    const names = (schoolsList || []).map((s) => s.name);
    const counts = names.map((schoolName) =>
      rows
        .filter((r) => (r.school && r.school.trim()) === schoolName)
        .reduce((acc, r) => acc + (r.offers_count ?? 0), 0)
    );
    return { labels: names, data: counts };
  }, [rows, schoolsList]);

  const ctcDistribution = useMemo(() => {
    const ranges = ['0-5', '5-10', '10-15', '15-20', '20-25', '25+'];
    const data = ranges.map((_, i) => {
      if (i === 5) return rows.filter((r) => (r.max_ctc_lpa != null ? Number(r.max_ctc_lpa) : 0) >= 25).length;
      const low = i * 5;
      const high = (i + 1) * 5;
      return rows.filter((r) => {
        const c = r.max_ctc_lpa != null ? Number(r.max_ctc_lpa) : 0;
        return c >= low && c < high;
      }).length;
    });
    return { labels: ranges, data };
  }, [rows]);

  const funnelData = useMemo(() => {
    const total = rows.length;
    const applied = rows.filter((r) => (r.drives_applied ?? 0) > 0).length;
    const oaPassed = rows.filter((r) => (r.oas_passed ?? 0) > 0).length;
    const interviewed = rows.filter((r) => (r.interview_passed ?? 0) > 0).length;
    const placed = rows.filter((r) => (r.offers_count ?? 0) > 0).length;
    return {
      labels: ['Total', 'Applied', 'OA Passed', 'Interviewed', 'Placed'],
      data: [total, applied, oaPassed, interviewed, placed],
    };
  }, [rows]);

  const topPrograms = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const name = (r.program && r.program.trim()) || 'Other';
      map[name] = (map[name] || 0) + (r.offers_count ?? 0);
    });
    return Object.entries(map)
      .map(([name, offers]) => ({ name, offers }))
      .sort((a, b) => b.offers - a.offers)
      .slice(0, 5);
  }, [rows]);

  const totalOffersForRate = stats.totalOffers || 1;

  if (loading) {
    return (
      <Box py={12} display="flex" justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: slate[100] } },
      x: { grid: { display: false } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { position: 'bottom' } },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: slate[100] } },
      x: { grid: { display: false } },
    },
  };

  return (
    <Box w="full" fontFamily="Inter, system-ui, sans-serif" bg={slate[50]}>
      {/* Stats Cards - match reference */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <CardBody p={0}>
            <Flex justify="space-between" align="flex-start" mb={4}>
              <Box bg="blue.50" p={3} borderRadius="xl" color="blue.600">
                <FiUsers size={24} />
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="green.500">Opted-in</Text>
            </Flex>
            <Text color={slate[500]} fontSize="sm" fontWeight="medium">Total Students</Text>
            <Text fontSize="2xl" fontWeight="bold" color={slate[900]}>{stats.total}</Text>
          </CardBody>
        </Card>
        <Card bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <CardBody p={0}>
            <Flex justify="space-between" align="flex-start" mb={4}>
              <Box bg="green.50" p={3} borderRadius="xl" color="green.600">
                <FiBriefcase size={24} />
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="green.500">Active</Text>
            </Flex>
            <Text color={slate[500]} fontSize="sm" fontWeight="medium">Total Offers</Text>
            <Text fontSize="2xl" fontWeight="bold" color={slate[900]}>{stats.totalOffers}</Text>
          </CardBody>
        </Card>
        <Card bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <CardBody p={0}>
            <Flex justify="space-between" align="flex-start" mb={4}>
              <Box bg="orange.50" p={3} borderRadius="xl" color="orange.600">
                <FiTrendingUp size={24} />
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="orange.500">LPA</Text>
            </Flex>
            <Text color={slate[500]} fontSize="sm" fontWeight="medium">Highest CTC</Text>
            <Text fontSize="2xl" fontWeight="bold" color={slate[900]}>{stats.maxCTC ? `${Number(stats.maxCTC).toFixed(1)} LPA` : '0 LPA'}</Text>
          </CardBody>
        </Card>
        <Card bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <CardBody p={0}>
            <Flex justify="space-between" align="flex-start" mb={4}>
              <Box bg="purple.50" p={3} borderRadius="xl" color="purple.600">
                <FiAward size={24} />
              </Box>
              <Text fontSize="xs" fontWeight="bold" color="purple.500">Rate</Text>
            </Flex>
            <Text color={slate[500]} fontSize="sm" fontWeight="medium">Placement Rate</Text>
            <Text fontSize="2xl" fontWeight="bold" color={slate[900]}>{stats.placementRate}%</Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Second row: insights from overview columns */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 6 }} spacing={4} mb={8}>
        <Card bg="white" p={4} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <CardBody p={0}>
            <HStack mb={2}>
              <Box bg="teal.50" p={2} borderRadius="lg" color="teal.600">
                <FiBriefcase size={18} />
              </Box>
              <Text color={slate[500]} fontSize="xs" fontWeight="medium">Internship offers</Text>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color={slate[900]}>{stats.totalInternshipOffers}</Text>
          </CardBody>
        </Card>
        <Card bg="white" p={4} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <CardBody p={0}>
            <HStack mb={2}>
              <Box bg="gray.100" p={2} borderRadius="lg" color={slate[600]}>
                <FiAlertCircle size={18} />
              </Box>
              <Text color={slate[500]} fontSize="xs" fontWeight="medium">Drives absent (total)</Text>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color={slate[900]}>{stats.totalDrivesAbsent}</Text>
          </CardBody>
        </Card>
        <Card bg="white" p={4} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <CardBody p={0}>
            <HStack mb={2}>
              <Box bg="orange.50" p={2} borderRadius="lg" color="orange.600">
                <FiAlertTriangle size={18} />
              </Box>
              <Text color={slate[500]} fontSize="xs" fontWeight="medium">Placement violations</Text>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color={stats.placementViolations > 0 ? 'orange.600' : slate[900]}>{stats.placementViolations} students</Text>
          </CardBody>
        </Card>
        <Card bg="white" p={4} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <CardBody p={0}>
            <HStack mb={2}>
              <Box bg="red.50" p={2} borderRadius="lg" color="red.600">
                <FiAlertCircle size={18} />
              </Box>
              <Text color={slate[500]} fontSize="xs" fontWeight="medium">Disciplinary</Text>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color={stats.disciplinary > 0 ? 'red.600' : slate[900]}>{stats.disciplinary} students</Text>
          </CardBody>
        </Card>
        <Card bg="white" p={4} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <CardBody p={0}>
            <HStack mb={2}>
              <Box bg="yellow.50" p={2} borderRadius="lg" color="yellow.700">
                <FiLock size={18} />
              </Box>
              <Text color={slate[500]} fontSize="xs" fontWeight="medium">Admin hold</Text>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color={stats.adminHold > 0 ? 'yellow.700' : slate[900]}>{stats.adminHold} students</Text>
          </CardBody>
        </Card>
        <Card bg="white" p={4} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <CardBody p={0}>
            <HStack mb={2}>
              <Box bg="red.50" p={2} borderRadius="lg" color="red.600">
                <FiFileText size={18} />
              </Box>
              <Text color={slate[500]} fontSize="xs" fontWeight="medium">Malpractice</Text>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color={stats.malpractice > 0 ? 'red.600' : slate[900]}>{stats.malpractice} students</Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Charts Row */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <Text fontWeight="bold" color={slate[800]} mb={6}>School-wise Offers</Text>
          <Box h="256px" position="relative">
            <Bar
              data={{
                labels: schoolOfferData.labels,
                datasets: [{
                  label: 'Offers by School',
                  data: schoolOfferData.data,
                  backgroundColor: '#3b82f6',
                  borderRadius: 8,
                }],
              }}
              options={barOptions}
            />
          </Box>
        </Card>
        <Card bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <Text fontWeight="bold" color={slate[800]} mb={6}>CTC Distribution</Text>
          <Box h="256px" position="relative">
            <Doughnut
              data={{
                labels: ctcDistribution.labels,
                datasets: [{
                  data: ctcDistribution.data,
                  backgroundColor: ['#f87171', '#fb923c', '#fbbf24', '#4ade80', '#2dd4bf', '#3b82f6'],
                }],
              }}
              options={doughnutOptions}
            />
          </Box>
        </Card>
      </SimpleGrid>

      {/* Funnel + Top Programs */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={8}>
        <Card bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]} gridColumn={{ lg: 'span 2' }}>
          <Text fontWeight="bold" color={slate[800]} mb={6}>Offer Conversion Funnel</Text>
          <Box h="320px" position="relative">
            <Line
              data={{
                labels: funnelData.labels,
                datasets: [{
                  label: 'Student Count',
                  data: funnelData.data,
                  borderColor: '#8b5cf6',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#8b5cf6',
                }],
              }}
              options={lineOptions}
            />
          </Box>
        </Card>
        <Card bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor={slate[200]}>
          <Text fontWeight="bold" color={slate[800]} mb={6}>Top Programs</Text>
          <Stack spacing={4}>
            {topPrograms.length === 0 && <Text color={slate[500]} fontSize="sm">No offer data</Text>}
            {topPrograms.map((p) => {
              const pct = totalOffersForRate > 0 ? ((p.offers / totalOffersForRate) * 100).toFixed(0) : 0;
              return (
                <Box key={p.name} mb={4}>
                  <Flex justify="space-between" fontSize="sm" mb={1}>
                    <Text color={slate[600]} fontWeight="medium" noOfLines={1}>{p.name}</Text>
                    <Text color={slate[900]} fontWeight="bold">{p.offers} <Text as="span" fontSize="xs" color={slate[400]} fontWeight="normal">offers</Text></Text>
                  </Flex>
                  <Box w="full" bg={slate[100]} h={2} borderRadius="full" overflow="hidden">
                    <Box bg="blue.500" h="100%" borderRadius="full" w={`${pct}%`} />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Card>
      </SimpleGrid>

      <HStack spacing={3} mt={6}>
        <Button as={Link} to="/placement/overview?tab=overview" colorScheme="blue" size="sm">
          Open Data Table
        </Button>
        <Button as={Link} to="/placement/students" variant="outline" size="sm">
          View all students
        </Button>
      </HStack>
    </Box>
  );
}
