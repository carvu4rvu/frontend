import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { buildPlacementNavState } from '../../utils/placementNavigationHistory';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { FaRocket } from 'react-icons/fa';
import '../admin/PlacementEvents.css';
import CompanyLayout from '../../components/CompanyLayout';
import PlacementDrivesTable from '../../components/placement/PlacementDrivesTable';
import { CompanyService } from '../../services/company.service';
import {
  isHiddenFromCompanyDrives,
  matchesDriveSection,
} from '../../utils/placementDriveDisplay';

const DRIVE_SECTIONS = [
  {
    id: 'upcoming',
    title: 'Upcoming Drives',
    subtitle: 'Registration open or scheduled',
  },
  {
    id: 'ongoing',
    title: 'Ongoing Drives',
    subtitle: 'Registration closed, drive in progress',
  },
  {
    id: 'completed',
    title: 'Completed Drives',
    subtitle: 'Finished placement drives',
  },
];

const CompanyDrives = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await CompanyService.getDrives();
      setDrives(Array.isArray(data) ? data : []);
    } catch (err) {
      setDrives([]);
      setLoadError(true);
      const message = err?.message || '';
      const isNoDrives =
        message.toLowerCase().includes('no drives') ||
        message.toLowerCase().includes('not found') ||
        err?.status === 404;
      toast({
        title: isNoDrives ? 'No placement drives' : 'Could not load placement drives',
        description: isNoDrives
          ? 'Your company has no placement drives yet.'
          : message || 'Check your connection and try again.',
        status: isNoDrives ? 'info' : 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const visibleDrives = useMemo(
    () => drives.filter((drive) => !isHiddenFromCompanyDrives(drive)),
    [drives],
  );

  const drivesBySection = useMemo(() => {
    const grouped = { upcoming: [], ongoing: [], completed: [] };
    visibleDrives.forEach((drive) => {
      DRIVE_SECTIONS.forEach((section) => {
        if (matchesDriveSection(drive, section.id)) {
          grouped[section.id].push(drive);
        }
      });
    });
    return grouped;
  }, [visibleDrives]);

  const sectionsWithDrives = useMemo(
    () => DRIVE_SECTIONS.filter((section) => drivesBySection[section.id].length > 0),
    [drivesBySection],
  );

  const openDrive = (drive) => {
    navigate(`/company/drive/${drive.id}`, { state: buildPlacementNavState(location) });
  };

  const showPageEmpty = !loading && !loadError && visibleDrives.length === 0;

  return (
    <CompanyLayout>
      <Box className="placement-events-page company-drives-page" minH="calc(100vh - 72px)" w="100%">
        <Container maxW="container.xl" p={0} w="100%">
          <Box as="main" className="placement-events-main">
            <Box className="company-drives-hero">
              <Box className="company-drives-hero-inner">
                <Box className="company-drives-hero-icon" aria-hidden>
                  <FaRocket />
                </Box>
                <Box className="company-drives-hero-text">
                  <h1 className="company-drives-hero-title">Placement Drives</h1>
                  <p className="company-drives-hero-subtitle">
                    Upcoming, ongoing, and completed drives for your company. Click a row to open the
                    drive process.
                  </p>
                </Box>
              </Box>
            </Box>

            {loadError && (
              <Alert status="warning" borderRadius="md" mb={4} flexWrap="wrap" gap={2}>
                <AlertIcon />
                <Box flex={1}>
                  <AlertTitle>Could not load placement drives</AlertTitle>
                  <AlertDescription>
                    You may not have any drives yet, or there was a connection issue. You can try again
                    below.
                  </AlertDescription>
                </Box>
                <Button size="sm" colorScheme="orange" variant="outline" onClick={() => loadDrives()}>
                  Try again
                </Button>
              </Alert>
            )}

            {loading && (
              <Box className="company-drives-loading">
                <Spinner size="lg" color="#d4a960" thickness="3px" />
              </Box>
            )}

            {!loading && showPageEmpty && (
              <Box className="company-drives-empty">
                <p className="company-drives-empty-title">No placement drives yet</p>
                <p>When drives are scheduled for your company, they will appear here.</p>
              </Box>
            )}

            {!loading && sectionsWithDrives.length > 0 && (
              <Box className="placement-drives-sections">
                {sectionsWithDrives.map((section) => (
                  <Box key={section.id} className="placement-drives-section">
                    <Flex className="placement-drives-section-head">
                      <Box>
                        <Heading as="h2" size="md">
                          {section.title}
                        </Heading>
                        <Text className="section-sub">{section.subtitle}</Text>
                      </Box>
                      <span className="placement-drives-section-count">
                        {drivesBySection[section.id].length}
                      </span>
                    </Flex>
                    <PlacementDrivesTable
                      drives={drivesBySection[section.id]}
                      loading={false}
                      readOnly
                      onRowClick={openDrive}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </CompanyLayout>
  );
};

export default CompanyDrives;
