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
  Card,
  CardBody,
  SimpleGrid,
  Avatar,
  Divider,
  Button,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  FaBuilding,
  FaBriefcase,
  FaUsers,
  FaHandshake,
  FaCheckCircle,
  FaUserGraduate,
  FaClock,
  FaChartLine,
} from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import CompanyLayout from '../../components/CompanyLayout';
import { CompanyService } from '../../services/company.service';
import { getFileUrl } from '../../utils/fileUrl';
import './CompanyDashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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
      <Flex w="56px" h="56px" bg={bg} borderRadius="xl" align="center" justify="center" flexShrink={0}>
        <Icon as={icon} color={color} boxSize={7} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="2xl" fontWeight="700" color={colors.dark} lineHeight="1.2">{value}</Text>
        <Text fontSize="sm" color={colors.secondary} mt={0.5}>{label}</Text>
      </Box>
    </HStack>
  </Box>
);

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

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const {
    company,
    stats,
    recent_activity,
    chart_drives_registrations = [],
    chart_offers = { accepted: 0, pending: 0 },
    chart_drives_status = { active: 0, completed: 0 },
  } = dashboardData || {};

  const doughnutOffersData = useMemo(
    () => ({
      labels: ['Accepted', 'Pending'],
      datasets: [
        {
          data: [chart_offers.accepted || 0, chart_offers.pending || 0],
          backgroundColor: ['#22c55e', '#e2e8f0'],
          borderColor: ['#16a34a', '#cbd5e1'],
          borderWidth: 2,
        },
      ],
    }),
    [chart_offers.accepted, chart_offers.pending]
  );

  const doughnutDrivesData = useMemo(
    () => ({
      labels: ['Active', 'Completed'],
      datasets: [
        {
          data: [chart_drives_status.active || 0, chart_drives_status.completed || 0],
          backgroundColor: ['#d4a960', '#94a3b8'],
          borderColor: ['#c4983f', '#64748b'],
          borderWidth: 2,
        },
      ],
    }),
    [chart_drives_status.active, chart_drives_status.completed]
  );

  const barRegistrationsData = useMemo(
    () => ({
      labels: chart_drives_registrations.length
        ? chart_drives_registrations.map((d) => d.label)
        : ['No drives'],
      datasets: [
        {
          label: 'Registrations',
          data: chart_drives_registrations.length
            ? chart_drives_registrations.map((d) => d.registrations)
            : [0],
          backgroundColor: '#172e36',
          borderColor: '#172e36',
          borderWidth: 0,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        },
      ],
    }),
    [chart_drives_registrations]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
      },
    }),
    []
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { borderDash: [2, 4] } },
        x: { grid: { display: false } },
      },
    }),
    []
  );

  if (loading) {
    return (
      <CompanyLayout>
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color={colors.accent} thickness="4px" />
        </Flex>
      </CompanyLayout>
    );
  }

  const logoUrl = company?.company_logo_link ? getFileUrl(company.company_logo_link) : null;

  return (
    <CompanyLayout>
      <Box className="company-dashboard-page" minH="100vh" py={8}>
        <Container maxW="1400px">
          {/* Welcome Header */}
          <Box className="company-dashboard-welcome" mb={8}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <HStack spacing={5}>
                <Avatar
                  size="xl"
                  name={company?.company_name}
                  src={logoUrl}
                  bg="whiteAlpha.200"
                  color="white"
                  icon={<Icon as={FaBuilding} boxSize={8} />}
                  border="3px solid"
                  borderColor={colors.accent}
                />
                <Box>
                  <Text color="whiteAlpha.700" fontSize="sm" mb={1}>Welcome back</Text>
                  <Heading color="white" size="xl" mb={1}>
                    {company?.company_name || 'Company'}
                  </Heading>
                  {company?.company_type && (
                    <Badge bg={colors.accent} color={colors.dark} fontSize="sm" borderRadius="full" px={3}>
                      {company.company_type}
                    </Badge>
                  )}
                </Box>
              </HStack>
              <VStack align="end" spacing={1}>
                <Text color="whiteAlpha.700" fontSize="sm">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <HStack spacing={2}>
                  <Icon as={FaChartLine} color={colors.accent} />
                  <Text color="white" fontSize="sm" fontWeight="500">
                    Placement Portal
                  </Text>
                </HStack>
              </VStack>
            </Flex>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={5} mb={8}>
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

          {/* Data Analytics Charts */}
          <Box mb={8}>
            <HStack spacing={3} mb={4}>
              <Flex w="44px" h="44px" bg={colors.accentLight} borderRadius="xl" align="center" justify="center">
                <Icon as={FaChartLine} color={colors.accent} boxSize={5} />
              </Flex>
              <Box>
                <Text fontWeight="700" color={colors.dark} fontSize="lg">Data Analytics</Text>
                <Text fontSize="sm" color={colors.secondary}>Offers, drives & registrations at a glance</Text>
              </Box>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6} mb={6}>
              <Box className="company-dashboard-chart-wrap">
                <p className="chart-title">Offers (Accepted vs Pending)</p>
                <Box className="company-dashboard-chart-canvas">
                  <Doughnut data={doughnutOffersData} options={chartOptions} />
                </Box>
              </Box>
              <Box className="company-dashboard-chart-wrap">
                <p className="chart-title">Drives (Active vs Completed)</p>
                <Box className="company-dashboard-chart-canvas">
                  <Doughnut data={doughnutDrivesData} options={chartOptions} />
                </Box>
              </Box>
              <Box className="company-dashboard-chart-wrap">
                <p className="chart-title">Registrations per Drive</p>
                <Box className="company-dashboard-chart-canvas">
                  <Bar data={barRegistrationsData} options={barOptions} />
                </Box>
              </Box>
            </SimpleGrid>
          </Box>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* Recent Activity */}
            <Box className="company-dashboard-section-card">
              <div className="company-dashboard-section-head">
                <div className="section-icon">
                  <Icon as={FaClock} color={colors.accent} boxSize={5} />
                </div>
                <h2 className="section-title">Recent Activity</h2>
              </div>
              {(!recent_activity || recent_activity.length === 0) ? (
                <Flex direction="column" align="center" py={8}>
                  <Icon as={FaClock} boxSize={10} color="gray.300" mb={3} />
                  <Text color={colors.secondary} fontSize="sm">No recent activity</Text>
                </Flex>
              ) : (
                <VStack spacing={0} align="stretch">
                  {recent_activity.slice(0, 5).map((activity, idx) => (
                    <Box key={idx} className="company-dashboard-activity-item">
                      <HStack spacing={3}>
                        <Avatar size="sm" name={activity.student_name} bg="blue.500" color="white" />
                        <Box flex="1" minW={0}>
                          <Text fontSize="sm" color={colors.dark}>
                            <Text as="span" fontWeight="600">{activity.student_name}</Text>
                            {activity.type === 'registration' && ' registered for a drive'}
                            {activity.type === 'status_change' && ' status updated'}
                            {activity.type === 'offer_accepted' && ' accepted an offer'}
                          </Text>
                          <Text fontSize="xs" color={colors.secondary}>
                            {formatTimeAgo(activity.timestamp)}
                          </Text>
                        </Box>
                        <Badge
                          colorScheme={
                            activity.type === 'registration' ? 'blue' :
                            activity.type === 'offer_accepted' ? 'green' : 'gray'
                          }
                          fontSize="xs"
                          borderRadius="full"
                        >
                          {activity.type === 'registration' ? 'New' :
                            activity.type === 'offer_accepted' ? 'Accepted' : 'Update'}
                        </Badge>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>

            {/* Quick Actions */}
            <Box className="company-dashboard-section-card">
              <div className="company-dashboard-section-head">
                <div className="section-icon">
                  <Icon as={FaUserGraduate} color={colors.accent} boxSize={5} />
                </div>
                <h2 className="section-title">Quick Actions</h2>
              </div>
              <VStack spacing={3} align="stretch">
                <Button
                  className="company-dashboard-quick-action"
                  variant="outline"
                  justifyContent="space-between"
                  onClick={() => navigate('/company/drives')}
                >
                  <HStack spacing={3}>
                    <Icon as={FaBriefcase} color={colors.accent} boxSize={5} />
                    <Box textAlign="left">
                      <Text fontWeight="600" color={colors.dark}>View Placement Drives</Text>
                      <Text fontSize="xs" color={colors.secondary}>Manage your hiring pipelines</Text>
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
                    <Icon as={FaHandshake} color={colors.accent} boxSize={5} />
                    <Box textAlign="left">
                      <Text fontWeight="600" color={colors.dark}>Track Offers</Text>
                      <Text fontSize="xs" color={colors.secondary}>View offer status & acceptances</Text>
                    </Box>
                  </HStack>
                  <ArrowForwardIcon color={colors.secondary} />
                </Button>
                <Button
                  className="company-dashboard-quick-action"
                  variant="outline"
                  justifyContent="space-between"
                  onClick={() => navigate('/company/profile')}
                >
                  <HStack spacing={3}>
                    <Icon as={FaBuilding} color={colors.accent} boxSize={5} />
                    <Box textAlign="left">
                      <Text fontWeight="600" color={colors.dark}>Profile & Contacts</Text>
                      <Text fontSize="xs" color={colors.secondary}>Company details and contact persons</Text>
                    </Box>
                  </HStack>
                  <ArrowForwardIcon color={colors.secondary} />
                </Button>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Summary Stats */}
          <Box className="company-dashboard-section-card" mt={6}>
            <div className="company-dashboard-section-head">
              <div className="section-icon">
                <Icon as={FaChartLine} color="blue.500" boxSize={5} />
              </div>
              <h2 className="section-title">Summary</h2>
            </div>
            <div className="company-dashboard-summary-grid">
              <Box className="company-dashboard-summary-cell">
                <Text className="value" fontSize="xl" fontWeight="700" color={colors.dark}>{stats?.total_drives || 0}</Text>
                <Text className="label" fontSize="sm" color={colors.secondary}>Total Drives</Text>
              </Box>
              <Box className="company-dashboard-summary-cell">
                <Text className="value" fontSize="xl" fontWeight="700" color={colors.dark}>{stats?.active_drives || 0}</Text>
                <Text className="label" fontSize="sm" color={colors.secondary}>Active Drives</Text>
              </Box>
              <Box className="company-dashboard-summary-cell">
                <Text className="value" fontSize="xl" fontWeight="700" color="green.500">
                  {stats?.total_offers ? Math.round((stats.accepted_offers / stats.total_offers) * 100) : 0}%
                </Text>
                <Text className="label" fontSize="sm" color={colors.secondary}>Offer Acceptance Rate</Text>
              </Box>
              <Box className="company-dashboard-summary-cell">
                <Text className="value" fontSize="xl" fontWeight="700" color={colors.accent}>{stats?.total_registrations || 0}</Text>
                <Text className="label" fontSize="sm" color={colors.secondary}>Total Candidates</Text>
              </Box>
            </div>
          </Box>
        </Container>
      </Box>
    </CompanyLayout>
  );
};

export default CompanyDashboard;
