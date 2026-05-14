import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Container, VStack, Heading, Text, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { PlacementService } from '../../services/placement.service';
import { PlacementOverviewTab, StudentEligibilityTab, IndividualStudentEligibilityTab } from '../ViewAllStudents';
import StudentsOverviewTable from './StudentsOverviewTable';
import StudentsDashboardInsights from './StudentsDashboardInsights';
import { useBackgroundRefresh } from '../../hooks/useBackgroundRefresh';
import AdminLayout from '../../components/AdminLayout';
import { useSearchParams } from 'react-router-dom';

export default function PlacementOverviewPage() {
  const [placementOverviewData, setPlacementOverviewData] = useState([]);
  const [placementSalaryStats, setPlacementSalaryStats] = useState({});
  const [availableAcademicYears, setAvailableAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [academicTabLoading, setAcademicTabLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromQuery = (searchParams.get('tab') || '').toLowerCase();
  const initialTabIndex = useMemo(() => {
    if (tabFromQuery === 'student-eligibility') return 4;
    if (tabFromQuery === 'eligibility' || tabFromQuery === 'placement-eligibility') return 3;
    if (tabFromQuery === 'academic') return 2;
    if (tabFromQuery === 'overview') return 1;
    if (tabFromQuery === 'dashboard') return 0;
    return 0; // default: Dashboard insights
  }, [tabFromQuery]);
  const [tabIndex, setTabIndex] = useState(initialTabIndex);

  useEffect(() => {
    setTabIndex(initialTabIndex);
  }, [initialTabIndex]);

  const fetchPlacementOverview = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    if (!silent) setAcademicTabLoading(true);
    try {
      const data = await PlacementService.getPlacementOverview(selectedAcademicYear || undefined);
      setPlacementOverviewData(data.rows || []);
      setPlacementSalaryStats(data.schoolOverview || {});
      setAvailableAcademicYears(data.academicYears || []);
    } catch (e) {
      if (!silent) console.error('Placement overview:', e);
      if (!silent) {
        setPlacementOverviewData([]);
        setPlacementSalaryStats({});
      }
    } finally {
      if (!silent) setAcademicTabLoading(false);
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    fetchPlacementOverview();
  }, [fetchPlacementOverview]);

  useBackgroundRefresh(fetchPlacementOverview);

  return (
    <AdminLayout>
      <Box
        bg="#f0f0f0"
        minH="100vh"
        py={6}
        px={{ base: 4, md: 6 }}
      >
        <Container maxW="container.xl">
          <VStack spacing={6} align="stretch">
            <Heading size="lg" color="gray.800" fontWeight="700" letterSpacing="-0.02em">
              Placement Overview
            </Heading>
            <Text color="gray.600" fontSize="md">
              School-wise placement statistics and placement eligibility tracking.
            </Text>

            <Tabs
              index={tabIndex}
              onChange={(i) => {
                setTabIndex(i);
                const next = new URLSearchParams(searchParams);
                const tabSlug = i === 0 ? 'dashboard' : i === 1 ? 'overview' : i === 2 ? 'academic' : i === 3 ? 'eligibility' : 'student-eligibility';
                next.set('tab', tabSlug);
                setSearchParams(next, { replace: true });
              }}
              variant="unstyled"
            >
              <TabList
                gap={0}
                borderBottom="2px"
                borderColor="gray.200"
                bg="gray.100"
                borderRadius="lg"
                p={1}
                w="fit-content"
              >
                <Tab
                  borderRadius="md"
                  px={4}
                  py={2}
                  fontSize="sm"
                  fontWeight="medium"
                  _selected={{ bg: 'white', color: 'gray.800', boxShadow: 'sm', border: '1px', borderColor: 'gray.200', borderBottom: '2px solid white', mb: '-2px' }}
                  _hover={{ bg: 'whiteAlpha.700' }}
                  color="gray.600"
                >
                  Dashboard insights
                </Tab>
                <Tab
                  borderRadius="md"
                  px={4}
                  py={2}
                  fontSize="sm"
                  fontWeight="medium"
                  _selected={{ bg: 'white', color: 'gray.800', boxShadow: 'sm', border: '1px', borderColor: 'gray.200', borderBottom: '2px solid white', mb: '-2px' }}
                  _hover={{ bg: 'whiteAlpha.700' }}
                  color="gray.600"
                >
                  Placement overview
                </Tab>
                <Tab
                  borderRadius="md"
                  px={4}
                  py={2}
                  fontSize="sm"
                  fontWeight="medium"
                  _selected={{ bg: 'white', color: 'gray.800', boxShadow: 'sm', border: '1px', borderColor: 'gray.200', borderBottom: '2px solid white', mb: '-2px' }}
                  _hover={{ bg: 'whiteAlpha.700' }}
                  color="gray.600"
                >
                  Academic overview
                </Tab>
                <Tab
                  borderRadius="md"
                  px={4}
                  py={2}
                  fontSize="sm"
                  fontWeight="medium"
                  _selected={{ bg: 'white', color: 'gray.800', boxShadow: 'sm', border: '1px', borderColor: 'gray.200', borderBottom: '2px solid white', mb: '-2px' }}
                  _hover={{ bg: 'whiteAlpha.700' }}
                  color="gray.600"
                >
                  Placement eligibility track
                </Tab>
                <Tab
                  borderRadius="md"
                  px={4}
                  py={2}
                  fontSize="sm"
                  fontWeight="medium"
                  _selected={{ bg: 'white', color: 'gray.800', boxShadow: 'sm', border: '1px', borderColor: 'gray.200', borderBottom: '2px solid white', mb: '-2px' }}
                  _hover={{ bg: 'whiteAlpha.700' }}
                  color="gray.600"
                >
                  Student eligibility track
                </Tab>
              </TabList>

              <TabPanels pt={4}>
                <TabPanel p={0}>
                  <Box w="full" pt={2}>
                    <StudentsDashboardInsights />
                  </Box>
                </TabPanel>
                <TabPanel p={0}>
                  <Box w="full" pt={2}>
                    <StudentsOverviewTable />
                  </Box>
                </TabPanel>
                <TabPanel p={0}>
                  <Box w="full" pt={2}>
                    <PlacementOverviewTab
                      rows={placementOverviewData}
                      salaryStats={placementSalaryStats}
                      academicYears={availableAcademicYears}
                      selectedYear={selectedAcademicYear}
                      onYearChange={setSelectedAcademicYear}
                      loading={academicTabLoading}
                    />
                  </Box>
                </TabPanel>
                <TabPanel p={0}>
                  <Box w="full" pt={2}>
                    <StudentEligibilityTab />
                  </Box>
                </TabPanel>
                <TabPanel p={0}>
                  <Box w="full" pt={2}>
                    <IndividualStudentEligibilityTab />
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </Box>
    </AdminLayout>
  );
}
