import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  useToast,
  Flex,
  Icon,
  Badge,
  Spinner,
  SimpleGrid,
  Button,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  FaBuilding,
  FaBriefcase,
  FaUsers,
  FaHandshake,
  FaCheckCircle,
  FaUserGraduate,
  FaPercent,
  FaRocket,
} from 'react-icons/fa';
import { CompanyLogo } from '../../components/CompanyLogo';
import { CompanyService } from '../../services/company.service';
import { resolveCompanyLogoUrl } from '../../utils/companyLogo';
import { formatDateIST } from '../../utils/dateTime';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './CompanyDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const FUNNEL_PALETTE = ['#64748b', '#6366f1', '#3b82f6', '#d4a960', '#eab308', '#22c55e', '#16a34a'];

const colors = {
  accent: '#d4a960',
  accentHover: '#c4983f',
  accentLight: '#f8f3e8',
  dark: '#172e36',
  darkBlue: '#1e3a47',
  secondary: '#64748b',
  cardBg: '#ffffff',
  pageBg: '#f1f5f9',
  border: '#e2e8f0',
};

const StatCard = ({ icon, label, value, color = colors.accent, bg = colors.accentLight, onClick }) => (
  <Box
    className="company-dashboard-stat-card"
    cursor={onClick ? 'pointer' : 'default'}
    onClick={onClick}
  >
    <HStack spacing={4}>
      <Flex w="52px" h="52px" bg={bg} borderRadius="xl" align="center" justify="center" flexShrink={0}>
        <Icon as={icon} color={color} boxSize={6} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="2xl" fontWeight="700" color={colors.dark} lineHeight="1.2">{value}</Text>
        <Text fontSize="sm" color={colors.secondary} mt={0.5}>{label}</Text>
      </Box>
    </HStack>
  </Box>
);

const MiniMetric = ({ label, value, hint, color = colors.dark }) => (
  <Box className="company-dashboard-mini-metric">
    <Text className="mini-value" color={color}>{value}</Text>
    <Text className="mini-label">{label}</Text>
    {hint ? <Text className="mini-hint">{hint}</Text> : null}
  </Box>
);

const ProgressMetric = ({ label, value, total, color, trackColor = '#e2e8f0' }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Box className="company-dashboard-progress-metric">
      <Flex justify="space-between" align="baseline" mb={1.5}>
        <Text fontSize="sm" fontWeight="600" color={colors.dark}>{label}</Text>
        <Text fontSize="sm" fontWeight="700" color={color}>
          {value}
          <Text as="span" fontWeight="500" color={colors.secondary} fontSize="xs"> / {total}</Text>
        </Text>
      </Flex>
      <Box h="8px" bg={trackColor} borderRadius="full" overflow="hidden">
        <Box h="100%" w={`${pct}%`} bg={color} borderRadius="full" transition="width 0.4s ease" />
      </Box>
      <Text fontSize="xs" color={colors.secondary} mt={1}>{pct}% of total</Text>
    </Box>
  );
};

function driveStatusColor(status) {
  const s = String(status || '').toLowerCase();
  if (['ongoing', 'active', 'scheduled'].includes(s)) return 'blue';
  if (['completed', 'closed'].includes(s)) return 'green';
  if (['cancelled', 'failed'].includes(s)) return 'red';
  return 'gray';
}

function driveStatusLabel(status) {
  const s = String(status || 'scheduled').toLowerCase();
  if (s === 'ongoing') return 'Ongoing';
  if (s === 'scheduled') return 'Scheduled';
  if (s === 'completed') return 'Completed';
  if (s === 'closed') return 'Closed';
  if (s === 'cancelled') return 'Cancelled';
  if (s === 'failed') return 'Failed';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const TopDrivesFunnelPanel = ({ drives }) => {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!drives?.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !drives.some((d) => d.id === selectedId)) {
      setSelectedId(drives[0].id);
    }
  }, [drives, selectedId]);

  const selectedDrive = useMemo(
    () => drives?.find((d) => d.id === selectedId) || drives?.[0] || null,
    [drives, selectedId]
  );

  const funnel = selectedDrive?.round_funnel || [];

  const chartData = useMemo(
    () => ({
      labels: funnel.map((s) => s.label),
      datasets: [
        {
          label: 'Candidates',
          data: funnel.map((s) => s.count),
          backgroundColor: funnel.map((_, i) => FUNNEL_PALETTE[Math.min(i, FUNNEL_PALETTE.length - 1)]),
          borderRadius: 4,
          barThickness: 20,
        },
      ],
    }),
    [funnel]
  );

  const chartOptions = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const stage = funnel[ctx.dataIndex];
              return [`${ctx.raw} candidates`, `${stage?.pct_of_registered ?? 0}% of registered`];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: '#f1f5f9' },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: '600' } },
        },
      },
    }),
    [funnel]
  );

  const chartHeight = Math.min(Math.max(funnel.length * 44 + 24, 180), 360);

  if (!drives?.length) {
    return (
      <Flex direction="column" align="center" justify="center" minH="160px" py={4}>
        <Icon as={FaBriefcase} boxSize={8} color="gray.300" mb={2} />
        <Text color={colors.secondary} fontSize="sm" textAlign="center">
          No placement drives yet. Round funnel analytics will appear once drives have candidates.
        </Text>
      </Flex>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Grid templateColumns={{ base: '1fr', md: '220px 1fr' }} gap={4}>
        <VStack spacing={1.5} align="stretch">
          {drives.map((drive, index) => {
            const isSelected = selectedDrive?.id === drive.id;
            return (
              <Box
                key={drive.id ?? index}
                className={`company-dashboard-drive-pick${isSelected ? ' is-selected' : ''}`}
                onClick={() => setSelectedId(drive.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId(drive.id)}
              >
                <Flex justify="space-between" align="start" gap={2}>
                  <HStack spacing={2} align="start" flex={1} minW={0}>
                    <Text fontSize="xs" fontWeight="700" color={isSelected ? colors.accent : colors.secondary}>
                      #{index + 1}
                    </Text>
                    <Box minW={0}>
                      <Text fontSize="xs" fontWeight="600" color={colors.dark} noOfLines={2}>
                        {drive.title}
                      </Text>
                      <Badge colorScheme={driveStatusColor(drive.status)} fontSize="9px" borderRadius="full" mt={0.5}>
                        {driveStatusLabel(drive.status)}
                      </Badge>
                    </Box>
                  </HStack>
                  <Text fontSize="sm" fontWeight="700" color={colors.dark} flexShrink={0}>
                    {drive.registrations}
                  </Text>
                </Flex>
              </Box>
            );
          })}
        </VStack>

        <Box>
          {selectedDrive ? (
            funnel.length > 0 ? (
              <Box className="company-dashboard-funnel-chart" h={`${chartHeight}px`}>
                <Bar data={chartData} options={chartOptions} />
              </Box>
            ) : (
              <Text fontSize="sm" color={colors.secondary} py={6} textAlign="center">
                No process data for this drive yet.
              </Text>
            )
          ) : null}
        </Box>
      </Grid>
    </VStack>
  );
};

const JOB_TYPE_LABELS = ['Internship', 'Full Time', 'Internship + Full Time'];

const JobTypeBars = ({ items }) => {
  const rows = useMemo(() => {
    const byType = Object.fromEntries((items || []).map((i) => [i.job_type, i.registrations || 0]));
    return JOB_TYPE_LABELS.map((job_type) => ({
      job_type,
      registrations: byType[job_type] ?? 0,
    }));
  }, [items]);

  const max = Math.max(...rows.map((i) => i.registrations), 1);
  return (
    <VStack spacing={2.5} align="stretch">
      {rows.map((item) => {
        const pct = item.registrations > 0 ? Math.round((item.registrations / max) * 100) : 0;
        return (
          <Box key={item.job_type}>
            <Flex justify="space-between" mb={1}>
              <Text fontSize="sm" fontWeight="500" color={colors.dark} noOfLines={1} flex={1} mr={2}>
                {item.job_type}
              </Text>
              <Text fontSize="sm" fontWeight="700" color={colors.dark}>{item.registrations}</Text>
            </Flex>
            <Box h="6px" bg="gray.100" borderRadius="full" overflow="hidden">
              <Box h="100%" w={`${pct}%`} bg="#6366f1" borderRadius="full" />
            </Box>
          </Box>
        );
      })}
    </VStack>
  );
};

const DrivePipelinePanel = ({ breakdown }) => {
  const entries = [
    { key: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
    { key: 'ongoing', label: 'Ongoing', color: '#d4a960' },
    { key: 'completed', label: 'Completed', color: '#22c55e' },
    { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  ];
  const total = entries.reduce((sum, e) => sum + (breakdown?.[e.key] || 0), 0) + (breakdown?.other || 0);

  if (total === 0) {
    return <Text fontSize="sm" color={colors.secondary}>No drives yet.</Text>;
  }

  return (
    <VStack spacing={3} align="stretch">
      <Flex h="10px" borderRadius="full" overflow="hidden" bg="gray.100">
        {entries.map((e) => {
          const count = breakdown?.[e.key] || 0;
          if (!count) return null;
          return (
            <Box
              key={e.key}
              h="100%"
              w={`${(count / total) * 100}%`}
              bg={e.color}
              title={`${e.label}: ${count}`}
            />
          );
        })}
      </Flex>
      <SimpleGrid columns={2} spacing={2}>
        {entries.map((e) => (
          <HStack key={e.key} spacing={2}>
            <Box w="8px" h="8px" borderRadius="full" bg={e.color} flexShrink={0} />
            <Text fontSize="xs" color={colors.secondary} flex={1}>{e.label}</Text>
            <Text fontSize="sm" fontWeight="700" color={colors.dark}>{breakdown?.[e.key] || 0}</Text>
          </HStack>
        ))}
      </SimpleGrid>
    </VStack>
  );
};

const UpcomingDrivesPanel = ({ drives, onSelect }) => {
  if (!drives?.length) {
    return <Text fontSize="sm" color={colors.secondary}>No active drives right now.</Text>;
  }

  return (
    <VStack spacing={2} align="stretch">
      {drives.map((drive) => (
        <Box
          key={drive.id}
          className="company-dashboard-upcoming-drive"
          onClick={() => onSelect(drive.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(drive.id)}
        >
          <Flex justify="space-between" align="start" gap={2}>
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="600" color={colors.dark} noOfLines={1}>{drive.title}</Text>
              <Badge colorScheme={driveStatusColor(drive.status)} fontSize="10px" borderRadius="full" mt={1}>
                {driveStatusLabel(drive.status)}
              </Badge>
            </Box>
            <VStack spacing={0} align="end" flexShrink={0}>
              <Text fontSize="md" fontWeight="700" color={colors.dark}>{drive.registrations}</Text>
              <Text fontSize="10px" color={colors.secondary}>registered</Text>
            </VStack>
          </Flex>
        </Box>
      ))}
    </VStack>
  );
};

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await CompanyService.getDashboardStats();
      setDashboardData(data);
    } catch (err) {
      toast({
        title: 'Failed to load dashboard',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const {
    company,
    stats,
    top_drives = [],
    upcoming_drives = [],
    chart_offers = { accepted: 0, pending: 0 },
    chart_drives_status = { active: 0, completed: 0 },
    drive_status_breakdown = {},
    registrations_by_job_type = [],
  } = dashboardData || {};

  const totalOffersChart = (chart_offers.accepted || 0) + (chart_offers.pending || 0);
  const totalDrivesChart = (chart_drives_status.active || 0) + (chart_drives_status.completed || 0);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="60vh">
        <Spinner size="xl" color={colors.accent} thickness="4px" />
      </Flex>
    );
  }

  const logoUrl = company?.company_logo_link ? resolveCompanyLogoUrl(company.company_logo_link) : null;

  return (
    <Box className="company-dashboard-page" minH="100vh" py={6}>
      <Container maxW="1400px">
        {/* Welcome Header */}
        <Box className="company-dashboard-welcome" mb={6}>
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <HStack spacing={4}>
              <CompanyLogo
                boxSize="72px"
                name={company?.company_name}
                src={logoUrl}
                variant="circle"
                border="3px solid"
                borderColor={colors.accent}
              />
              <Box>
                <Text color="whiteAlpha.700" fontSize="sm" mb={0.5}>Welcome back</Text>
                <Heading color="white" size="lg" mb={1}>
                  {company?.company_name || 'Company'}
                </Heading>
                {company?.company_type && (
                  <Badge bg={colors.accent} color={colors.dark} fontSize="xs" borderRadius="full" px={2.5}>
                    {company.company_type}
                  </Badge>
                )}
              </Box>
            </HStack>
            <VStack align={{ base: 'start', md: 'end' }} spacing={2}>
              <Text color="whiteAlpha.700" fontSize="sm">
                {formatDateIST(new Date(), {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                <Button size="sm" variant="outline" colorScheme="whiteAlpha" onClick={() => navigate('/company/drives')}>
                  Drives
                </Button>
                <Button size="sm" variant="outline" colorScheme="whiteAlpha" onClick={() => navigate('/company/offers')}>
                  Offers
                </Button>
                <Button size="sm" bg={colors.accent} color={colors.dark} _hover={{ bg: colors.accentHover }} onClick={() => navigate('/company/profile')}>
                  Profile
                </Button>
              </HStack>
            </VStack>
          </Flex>
        </Box>

        {/* Primary KPIs */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={5}>
          <StatCard
            icon={FaBriefcase}
            label="Active Drives"
            value={stats?.active_drives || 0}
            color="blue.500"
            bg="blue.50"
            onClick={() => navigate('/company/drives')}
          />
          <StatCard
            icon={FaUsers}
            label="Total Registrations"
            value={stats?.total_registrations || 0}
            color="purple.500"
            bg="purple.50"
            onClick={() => navigate('/company/drives')}
          />
          <StatCard
            icon={FaHandshake}
            label="Offers Made"
            value={stats?.total_offers || 0}
            color={colors.accent}
            bg={colors.accentLight}
            onClick={() => navigate('/company/offers')}
          />
          <StatCard
            icon={FaCheckCircle}
            label="Offers Accepted"
            value={stats?.accepted_offers || 0}
            color="green.500"
            bg="green.50"
            onClick={() => navigate('/company/offers')}
          />
        </SimpleGrid>

        {/* Performance snapshot strip */}
        <Box className="company-dashboard-section-card company-dashboard-performance-strip" mb={5}>
          <SimpleGrid columns={{ base: 2, sm: 3, lg: 6 }} spacing={3}>
            <MiniMetric label="Acceptance Rate" value={`${stats?.acceptance_rate ?? 0}%`} color="green.500" />
            <MiniMetric label="Pending Offers" value={stats?.pending_offers ?? 0} />
            <MiniMetric label="Hire Conversion" value={`${stats?.conversion_rate ?? 0}%`} hint="offers / registrations" color="#6366f1" />
            <MiniMetric label="Avg Reg / Drive" value={stats?.avg_registrations_per_drive ?? 0} />
            <MiniMetric label="Total Drives" value={stats?.total_drives ?? 0} />
            <MiniMetric label="Contacts" value={stats?.contacts_count ?? 0} />
          </SimpleGrid>
        </Box>

        {/* Main analytics grid */}
        <Grid templateColumns={{ base: '1fr', xl: '1fr 360px' }} gap={5} mb={5}>
          <GridItem>
            <VStack spacing={5} align="stretch">
              <Box className="company-dashboard-section-card">
                <TopDrivesFunnelPanel drives={top_drives} />
              </Box>

              <Box className="company-dashboard-section-card">
                <div className="company-dashboard-section-head company-dashboard-section-head--compact">
                  <div className="section-icon">
                    <Icon as={FaUsers} color="#6366f1" boxSize={4} />
                  </div>
                  <div>
                    <h2 className="section-title">Registrations by Job Type</h2>
                    <Text fontSize="xs" color={colors.secondary} mt={0.5}>Where candidate interest is concentrated</Text>
                  </div>
                </div>
                <JobTypeBars items={registrations_by_job_type} />
              </Box>
            </VStack>
          </GridItem>

          <GridItem>
            <VStack spacing={4} align="stretch">
              <Box className="company-dashboard-section-card">
                <div className="company-dashboard-section-head company-dashboard-section-head--compact">
                  <div className="section-icon">
                    <Icon as={FaPercent} color="green.500" boxSize={4} />
                  </div>
                  <h2 className="section-title">Offers & Drives</h2>
                </div>
                <VStack spacing={4} align="stretch">
                  <ProgressMetric
                    label="Offers Accepted"
                    value={chart_offers.accepted || 0}
                    total={totalOffersChart}
                    color="#22c55e"
                  />
                  <ProgressMetric
                    label="Active Drives"
                    value={chart_drives_status.active || 0}
                    total={totalDrivesChart}
                    color={colors.accent}
                  />
                </VStack>
              </Box>

              <Box className="company-dashboard-section-card">
                <div className="company-dashboard-section-head company-dashboard-section-head--compact">
                  <div className="section-icon">
                    <Icon as={FaBriefcase} color="blue.500" boxSize={4} />
                  </div>
                  <h2 className="section-title">Drive Pipeline</h2>
                </div>
                <DrivePipelinePanel breakdown={drive_status_breakdown} />
              </Box>

              <Box className="company-dashboard-section-card">
                <div className="company-dashboard-section-head company-dashboard-section-head--compact">
                  <div className="section-icon">
                    <Icon as={FaRocket} color={colors.accent} boxSize={4} />
                  </div>
                  <h2 className="section-title">Active Drives</h2>
                </div>
                <UpcomingDrivesPanel
                  drives={upcoming_drives}
                  onSelect={(id) => navigate(`/company/drives/${id}`)}
                />
              </Box>
            </VStack>
          </GridItem>
        </Grid>

        {/* Quick Actions */}
        <Box className="company-dashboard-section-card">
          <div className="company-dashboard-section-head company-dashboard-section-head--compact">
            <div className="section-icon">
              <Icon as={FaUserGraduate} color={colors.accent} boxSize={4} />
            </div>
            <h2 className="section-title">Quick Actions</h2>
          </div>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            <Button
              className="company-dashboard-quick-action"
              variant="outline"
              justifyContent="space-between"
              onClick={() => navigate('/company/drives')}
            >
              <HStack spacing={3}>
                <Icon as={FaBriefcase} color={colors.accent} boxSize={4} />
                <Box textAlign="left">
                  <Text fontWeight="600" color={colors.dark} fontSize="sm">View Placement Drives</Text>
                  <Text fontSize="xs" color={colors.secondary}>Manage hiring pipelines</Text>
                </Box>
              </HStack>
              <ArrowForwardIcon color={colors.secondary} />
            </Button>
            <Button
              className="company-dashboard-quick-action"
              variant="outline"
              justifyContent="space-between"
              onClick={() => navigate('/company/offers')}
            >
              <HStack spacing={3}>
                <Icon as={FaHandshake} color={colors.accent} boxSize={4} />
                <Box textAlign="left">
                  <Text fontWeight="600" color={colors.dark} fontSize="sm">Track Offers</Text>
                  <Text fontSize="xs" color={colors.secondary}>Status & acceptances</Text>
                </Box>
              </HStack>
              <ArrowForwardIcon color={colors.secondary} />
            </Button>
            <Button
              className="company-dashboard-quick-action"
              variant="outline"
              justifyContent="space-between"
              onClick={() => navigate('/company/projects')}
            >
              <HStack spacing={3}>
                <Icon as={FaBuilding} color={colors.accent} boxSize={4} />
                <Box textAlign="left">
                  <Text fontWeight="600" color={colors.dark} fontSize="sm">Browse Projects</Text>
                  <Text fontSize="xs" color={colors.secondary}>Student work from your drives</Text>
                </Box>
              </HStack>
              <ArrowForwardIcon color={colors.secondary} />
            </Button>
          </SimpleGrid>
        </Box>
      </Container>
    </Box>
  );
};

export default CompanyDashboard;
