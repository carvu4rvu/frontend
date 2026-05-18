import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  useToast,
  Spinner,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
} from '@chakra-ui/react';
import { FaRocket } from 'react-icons/fa';
import { HiLocationMarker } from 'react-icons/hi';
import { MdCalendarToday, MdHourglassEmpty } from 'react-icons/md';
import { ViewIcon } from '@chakra-ui/icons';
import '../admin/PlacementEvents.css';
import CompanyLayout from '../../components/CompanyLayout';
import { CompanyService } from '../../services/company.service';

/* Same columns as admin placement drive table */
const TABLE_COLUMNS = [
  { id: 'company_remarks_tpo', label: 'Company, Remarks & TPO' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'location_description', label: 'Location & Description' },
  { id: 'compensation', label: 'Compensation Details' },
  { id: 'important_dates', label: 'Important Dates' },
  { id: 'openings_reg', label: 'Openings/Reg' },
  { id: 'actions', label: 'Actions' },
];

const CompanyDrives = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [statusTab, setStatusTab] = useState('current'); // 'current' | 'history'

  const calculateTotalCTC = (c) => {
    if (!c || typeof c !== 'object') return null;
    const max = parseFloat(c.max ?? c.max_lpa ?? 0) || 0;
    const variablePercent = parseFloat(c.variable ?? 0) || 0;
    const stock = parseFloat(c.stock ?? 0) || 0;
    if (max <= 0) return null;
    if (variablePercent === 0 && stock === 0) return max;
    const variableAmount = (max * variablePercent) / 100;
    return Number((max + variableAmount + stock).toFixed(2));
  };

  const getDisplayCTCValue = (ctcStructure) => {
    if (!ctcStructure || typeof ctcStructure !== 'object') return null;
    const calculated = calculateTotalCTC(ctcStructure);
    const stored = ctcStructure.final ?? ctcStructure.package ?? ctcStructure.total;
    return calculated != null ? calculated : (stored != null && stored !== '' ? stored : null);
  };

  const derivePlacementStatusFromDates = (lastDateToReg, eventDatetime) => {
    const now = new Date();
    let regEnd = lastDateToReg ? new Date(lastDateToReg) : null;
    const eventStart = eventDatetime ? new Date(eventDatetime) : null;
    if (regEnd && !isNaN(regEnd.getTime())) {
      const str = String(lastDateToReg).trim();
      const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(str) || (str.length <= 10 && str.indexOf('T') === -1);
      if (dateOnly) regEnd.setHours(23, 59, 59, 999);
    }
    if (!eventStart || isNaN(eventStart.getTime())) return 'Scheduled';
    if (!regEnd || isNaN(regEnd.getTime())) return now < eventStart ? 'Scheduled' : 'Completed';
    if (now <= regEnd) return 'Scheduled';
    if (now < eventStart) return 'Ongoing';
    return 'Completed';
  };

  const isManualPlacementStatus = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'cancelled' || s === 'postponed' || s === 'failed';
  };

  const getEffectiveStatus = (drive) => {
    const s = (drive.placement_status || '').toString();
    if (isManualPlacementStatus(s)) return s.toLowerCase();
    return derivePlacementStatusFromDates(drive.last_date_to_registration, drive.event_datetime);
  };

  /** Use eligibility_display (school - program pairs) or fallback */
  const getEligibilityDisplay = (drive) => {
    if (drive?.eligibility_display) return drive.eligibility_display;
    const pairs = drive?.school_program_pairs || [];
    if (pairs.length > 0) return pairs.map((p) => `${p.school} - ${p.program}`).join(', ');
    return [drive?.school, drive?.program].filter(Boolean).join(' • ') || '—';
  };

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
      const isNoDrives = message.toLowerCase().includes('no drives') || message.toLowerCase().includes('not found') || err?.status === 404;
      toast({
        title: isNoDrives ? 'No placement drives' : 'Could not load placement drives',
        description: isNoDrives ? 'Your company has no placement drives yet.' : (message || 'Check your connection and try again.'),
        status: isNoDrives ? 'info' : 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const drivesByTab = drives.filter((drive) => {
    const status = getEffectiveStatus(drive);
    const statusLower = String(status || '').toLowerCase();
    if (statusTab === 'current') {
      return statusLower === 'scheduled' || statusLower === 'ongoing';
    }
    return statusLower === 'completed' || statusLower === 'cancelled' || statusLower === 'failed' || statusLower === 'postponed';
  });

  const registeredCount = (drive) => drive.registered_count ?? drive.number_of_registrations ?? 0;

  const renderTableCell = (drive, colId) => {
    const ctc = drive.ctc_structure || {};
    const stipend = drive.stipend_structure || {};
    switch (colId) {
      case 'company_remarks_tpo':
        return (
          <Box className="col-company-remarks-tpo">
            <Flex gap={3}>
              <Box className="company-logo">{(drive.company_name || drive.job_description || ' ')[0]}</Box>
              <Flex flexDirection="column">
                <Box className="company-name">{drive.company_name || '—'}</Box>
                <Box className="company-remarks line-clamp-2">"{drive.company_remarks || ''}"</Box>
                <Box className="company-tpo">TPO: {(drive.tpo || '').toUpperCase()}</Box>
              </Flex>
            </Flex>
          </Box>
        );
      case 'eligibility': {
        const eligText = getEligibilityDisplay(drive);
        return (
          <Badge
            fontSize="10px"
            colorScheme="gray"
            variant="subtle"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="tighter"
            px={2}
            py={1}
            borderRadius="md"
            title={eligText || undefined}
          >
            {eligText}
          </Badge>
        );
      }
      case 'location_description':
        return (
          <Flex flexDirection="column" gap={1} maxW="350px">
            <Flex as="span" alignItems="center" gap={1} fontSize="xs" fontWeight="bold" color="gray.700">
              <Box as={HiLocationMarker} boxSize={3} color="gray.500" /> {drive.job_location || '—'} (
              {drive.type_of_hiring || '—'})
            </Flex>
            <Text
              fontSize="11px"
              color="gray.500"
              fontWeight="medium"
              className="line-clamp-2"
              fontStyle="italic"
              lineHeight="relaxed"
            >
              "{drive.job_description || ''}"
            </Text>
          </Flex>
        );
      case 'compensation': {
        const ctcValue = getDisplayCTCValue(ctc);
        return (
          <Flex flexDirection="column" gap={1}>
            <Text fontSize="sm" fontWeight="bold" color="blue.600">
              {ctcValue != null ? `${ctcValue} LPA` : 'TBD'}
            </Text>
            <Text fontSize="xs" color="gray.500" fontWeight="normal">
              Base: {ctc.min || '0'}-{ctc.max || '0'} | Var: {ctc.variable || '0'}%
            </Text>
            {stipend && (stipend.avg || stipend.min || stipend.max) ? (
              <Text fontSize="xs" fontWeight="bold" color="green.500">
                Stipend: ₹{parseInt(stipend.avg || stipend.min || 0, 10).toLocaleString()}
              </Text>
            ) : (
              <Text fontSize="xs" color="gray.400">—</Text>
            )}
          </Flex>
        );
      }
      case 'important_dates':
        return (
          <Box fontSize="11px">
            <Flex
              as="p"
              alignItems="center"
              gap={1}
              color="gray.600"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="tighter"
            >
              <Box as={MdCalendarToday} boxSize={3} /> Drive:{' '}
              {drive.event_datetime ? new Date(drive.event_datetime).toLocaleDateString() : '—'}
            </Flex>
            <Flex
              as="p"
              alignItems="center"
              gap={1}
              color="red.400"
              fontWeight="bold"
              mt={1}
              letterSpacing="tighter"
              textTransform="uppercase"
            >
              <Box as={MdHourglassEmpty} boxSize={3} /> Reg:{' '}
              {drive.last_date_to_registration
                ? new Date(drive.last_date_to_registration).toLocaleDateString()
                : '—'}
            </Flex>
          </Box>
        );
      case 'openings_reg':
        return (
          <Flex alignItems="center" gap={3}>
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.800">
                {registeredCount(drive)}
              </Text>
              <Text fontSize="10px" color="gray.500" textTransform="uppercase" fontWeight="bold">
                Regs
              </Text>
            </Box>
            <Box w="1px" h={6} bg="gray.200" />
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.800">
                {drive.number_of_openings ?? '—'}
              </Text>
              <Text fontSize="10px" color="gray.500" textTransform="uppercase" fontWeight="bold">
                Seats
              </Text>
            </Box>
          </Flex>
        );
      case 'actions':
        return (
          <HStack spacing={1} justify="flex-end">
            <Box
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/company/drive/${drive.id}`);
              }}
              title="View drive"
              aria-label="View drive"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                w: 8,
                h: 8,
                borderRadius: 'lg',
                color: 'gray.400',
                _hover: { color: 'blue.600', bg: 'gray.100' },
              }}
            >
              <ViewIcon boxSize={4} />
            </Box>
          </HStack>
        );
      default:
        return '—';
    }
  };

  return (
    <CompanyLayout>
      <Box className="placement-events-page" minH="calc(100vh - 72px)" w="100%">
        <Container maxW="container.xl" p={0} w="100%">
          <Box as="header" className="placement-events-header">
            <Box>
              <Heading as="h1" size="md" display="flex" alignItems="center" gap={2}>
                <Box as={FaRocket} className="header-icon" boxSize={5} />
                Placement Drives
              </Heading>
              <Text className="header-subtitle">View your current drives and drive history. Click a row to open the process table.</Text>
            </Box>
          </Box>

          <Box as="main" className="placement-events-main">
          {loadError && (
            <Alert status="warning" borderRadius="md" mb={4} flexWrap="wrap" gap={2}>
              <AlertIcon />
              <Box flex={1}>
                <AlertTitle>Could not load placement drives</AlertTitle>
                <AlertDescription>
                  You may not have any drives yet, or there was a connection issue. You can try again below.
                </AlertDescription>
              </Box>
              <Button size="sm" colorScheme="orange" variant="outline" onClick={() => loadDrives()}>
                Try again
              </Button>
            </Alert>
          )}

          {/* Tabs: Current Drives | Drive History */}
          <div className="placement-events-tabs">
            <button
              type="button"
              className={statusTab === 'current' ? 'tab-active' : ''}
              onClick={() => setStatusTab('current')}
            >
              Current Drives
            </button>
            <button
              type="button"
              className={statusTab === 'history' ? 'tab-active' : ''}
              onClick={() => setStatusTab('history')}
            >
              Drive History
            </button>
          </div>

          {/* Table (same structure as admin placement drive table) */}
          <Box className="placement-events-table-wrap">
            <Table size="sm" variant="unstyled" className="placement-events-table" minW="1450px">
              <Thead>
                <Tr>
                  {TABLE_COLUMNS.map((col) => (
                    <Th key={col.id} textAlign={col.id === 'actions' ? 'right' : 'left'}>
                      {col.label}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={TABLE_COLUMNS.length} textAlign="center" py={8}>
                      <Spinner />
                    </Td>
                  </Tr>
                ) : drivesByTab.length === 0 ? (
                  <Tr>
                    <Td colSpan={TABLE_COLUMNS.length} textAlign="center" py={8} color="gray.500">
                      {statusTab === 'current'
                        ? (drives.length > 0
                            ? 'No current drives. Switch to the "Drive History" tab above to see your drives.'
                            : 'No current drives')
                        : 'No drives in history'}
                    </Td>
                  </Tr>
                ) : (
                  drivesByTab.map((drive) => (
                    <Tr
                      key={drive.id}
                      bg="white"
                      _hover={{ bg: '#f8fafc', cursor: 'pointer' }}
                      transition="background 0.15s ease"
                      onClick={() => navigate(`/company/drive/${drive.id}`)}
                    >
                      {TABLE_COLUMNS.map((col) => (
                        <Td
                          key={col.id}
                          textAlign={col.id === 'actions' ? 'right' : 'left'}
                          maxW={col.id === 'location_description' ? '350px' : col.id === 'eligibility' ? '220px' : undefined}
                          className={col.id === 'eligibility' ? 'col-eligibility' : undefined}
                        >
                          {renderTableCell(drive, col.id)}
                        </Td>
                      ))}
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
          </Box>
        </Container>
      </Box>
    </CompanyLayout>
  );
};

export default CompanyDrives;
