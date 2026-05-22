import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  Button,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Spinner,
  Badge,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import { EditIcon, CheckCircleIcon, BellIcon } from '@chakra-ui/icons';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { HiLocationMarker } from 'react-icons/hi';
import { MdCalendarToday, MdHourglassEmpty } from 'react-icons/md';
import { CompanyLogo } from '../CompanyLogo';
import { EligibilityDisplay } from './EligibilityDisplay';
import {
  getEligibilityGroupsFromDrive,
  formatEligibilityGroupsPlain,
} from '../../utils/eligibilityDisplay';
import { getCompanyLogoRaw } from '../../utils/companyLogo';
import { formatDateIST } from '../../utils/dateTime';
import {
  getDisplayCTCValue,
  getStatusColor,
  registeredCount,
} from '../../utils/placementDriveDisplay';

export const PLACEMENT_DRIVE_TABLE_COLUMNS = [
  { id: 'company_remarks_tpo', label: 'Company, Remarks & TPO' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'location_description', label: 'Location & Description' },
  { id: 'compensation', label: 'Compensation Details' },
  { id: 'important_dates', label: 'Important Dates' },
  { id: 'openings_reg', label: 'Openings/Reg' },
  { id: 'placement_status', label: 'Status' },
  { id: 'actions', label: 'Actions' },
];

function getEligibilityDisplay(drive) {
  const groups = getEligibilityGroupsFromDrive(drive);
  if (groups.length > 0) {
    return { display: formatEligibilityGroupsPlain(groups), groups };
  }
  const display = [drive?.school, drive?.program].filter(Boolean).join(' • ') || '—';
  return { display };
}

/**
 * Placement drive table (same layout as /placement/events).
 * Row click opens drive process unless readOnly.
 */
export default function PlacementDrivesTable({
  drives = [],
  loading = false,
  readOnly = false,
  highlightDriveId = null,
  statusTab = 'all',
  companyLogoById = {},
  onSendNotification,
  notifyingDriveId = null,
  onEditDrive,
  onRowClick,
  emptyMessage = 'No placement drives found.',
  actionsAsMenu = false,
  tableWrapClassName = '',
}) {
  const navigate = useNavigate();

  const openDrive = (driveId) => {
    if (!readOnly) navigate(`/placement/events/${driveId}/process`);
  };

  const handleRowClick = (drive) => {
    if (onRowClick) {
      onRowClick(drive);
      return;
    }
    if (!readOnly) openDrive(drive.id);
  };

  const isRowClickable = Boolean(onRowClick) || !readOnly;

  const renderActionsMenu = (drive) => {
    return (
      <Menu placement="bottom-end" isLazy closeOnSelect>
        <MenuButton
          as={IconButton}
          icon={<HiOutlineDotsVertical size={18} />}
          variant="ghost"
          size="sm"
          color="gray.500"
          borderRadius="md"
          aria-label="Drive actions"
          _hover={{ bg: 'gray.100', color: 'gray.800' }}
          onClick={(e) => e.stopPropagation()}
        />
        <MenuList minW="200px" shadow="lg" borderColor="gray.200" zIndex={30} onClick={(e) => e.stopPropagation()}>
          {onSendNotification && (
            <MenuItem
              icon={<BellIcon />}
              fontSize="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.setTimeout(() => onSendNotification(drive, e), 0);
              }}
              isDisabled={notifyingDriveId === drive.id}
            >
              Send notification
            </MenuItem>
          )}
          <MenuItem
            icon={<CheckCircleIcon />}
            fontSize="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/placement/events/${drive.id}/process?clicked_add_students=true`);
            }}
          >
            Configure eligibility
          </MenuItem>
          <MenuItem
            icon={<EditIcon />}
            fontSize="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (onEditDrive) onEditDrive(drive, e);
              else navigate('/placement/events', { state: { editDriveId: drive.id } });
            }}
          >
            Edit drive
          </MenuItem>
        </MenuList>
      </Menu>
    );
  };

  const renderTableCell = (drive, colId) => {
    const ctc = drive.ctc_structure || {};
    const stipend = drive.stipend_structure || {};

    switch (colId) {
      case 'company_remarks_tpo':
        return (
          <Box className="col-company-remarks-tpo">
            <Flex gap={3}>
              <CompanyLogo
                className="company-logo"
                src={getCompanyLogoRaw(drive, companyLogoById)}
                name={drive.company_name}
                boxSize="44px"
                variant="square"
                flexShrink={0}
              />
              <Flex flexDirection="column">
                <Box className="company-name">{drive.company_name || '—'}</Box>
                {drive.company_remarks && (
                  <Box className="company-remarks line-clamp-2">"{drive.company_remarks}"</Box>
                )}
                <Box className="company-tpo">TPO: {(drive.tpo || '').toUpperCase()}</Box>
              </Flex>
            </Flex>
          </Box>
        );
      case 'eligibility': {
        const { display } = getEligibilityDisplay(drive);
        const tooltipParts = [display];
        const elig = drive?.placement_drive_eligibility;
        if (elig?.min_cgpa) tooltipParts.push(`Min CGPA: ${elig.min_cgpa}`);
        if (elig?.max_active_backlogs != null) tooltipParts.push(`Max Backlogs: ${elig.max_active_backlogs}`);
        return (
          <EligibilityDisplay
            drive={drive}
            fallback={display || '—'}
            tooltipLabel={tooltipParts.filter(Boolean).join('\n')}
          />
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
              {drive.event_datetime
                ? formatDateIST(drive.event_datetime)
                : '—'}
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
              {formatDateIST(drive.last_date_to_registration)}
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
      case 'placement_status': {
        const status = drive.placement_status || 'Scheduled';
        const color = getStatusColor(status);
        return (
          <Badge
            colorScheme={color}
            variant="subtle"
            px={2}
            py={1}
            borderRadius="md"
            textTransform="uppercase"
            fontSize="10px"
            fontWeight="bold"
          >
            {status}
          </Badge>
        );
      }
      case 'actions': {
        if (readOnly) return '—';
        if (actionsAsMenu) {
          return (
            <Flex justify="flex-end" onClick={(e) => e.stopPropagation()}>
              {renderActionsMenu(drive)}
            </Flex>
          );
        }
        const driveStatus = (drive.placement_status || 'Scheduled').toLowerCase();
        const isCompleted = driveStatus === 'completed' || driveStatus === 'closed';
        return (
          <HStack spacing={1} justify="flex-end">
            {!isCompleted && onSendNotification && (
              <Tooltip label="Send Notification">
                <Button
                  size="sm"
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: 'orange.600' }}
                  onClick={(e) => onSendNotification(drive, e)}
                  aria-label="Send Notification"
                  isLoading={notifyingDriveId === drive.id}
                >
                  <BellIcon boxSize={4} />
                </Button>
              </Tooltip>
            )}
            <Tooltip label="Configure Eligibility">
              <Button
                size="sm"
                variant="ghost"
                color="gray.400"
                _hover={{ color: 'teal.600' }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/placement/events/${drive.id}/process?clicked_add_students=true`);
                }}
                aria-label="Eligibility"
              >
                <CheckCircleIcon boxSize={4} />
              </Button>
            </Tooltip>
            <Tooltip label="Edit Drive">
              <Button
                size="sm"
                variant="ghost"
                color="gray.300"
                _hover={{ color: 'blue.600' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditDrive) onEditDrive(drive, e);
                  else navigate('/placement/events', { state: { editDriveId: drive.id } });
                }}
                aria-label="Edit"
              >
                <EditIcon boxSize={4} />
              </Button>
            </Tooltip>
          </HStack>
        );
      }
      default:
        return '—';
    }
  };

  const columns = readOnly
    ? PLACEMENT_DRIVE_TABLE_COLUMNS.filter((c) => c.id !== 'actions')
    : PLACEMENT_DRIVE_TABLE_COLUMNS;

  const wrapClass = ['placement-events-table-wrap', tableWrapClassName].filter(Boolean).join(' ');

  return (
    <Box className={wrapClass}>
      <Table size="sm" variant="unstyled" className="placement-events-table" minW="1450px">
        <Thead>
          <Tr>
            {columns.map((col) => (
              <Th key={col.id} textAlign={col.id === 'actions' ? 'center' : 'left'} w={col.id === 'actions' && actionsAsMenu ? '56px' : undefined}>
                {col.id === 'actions' && actionsAsMenu ? '' : col.label}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr>
              <Td colSpan={columns.length} textAlign="center" py={8}>
                <Spinner />
              </Td>
            </Tr>
          ) : drives.length === 0 ? (
            <Tr>
              <Td colSpan={columns.length} textAlign="center" py={8} color="gray.500">
                {emptyMessage}
              </Td>
            </Tr>
          ) : (
            drives.map((drive) => {
              const isHighlighted =
                highlightDriveId != null && String(highlightDriveId) === String(drive.id);
              const statusColor = getStatusColor(drive.placement_status);
              const rowBg = isHighlighted ? `${statusColor}.100` : `${statusColor}.50`;
              const hoverBg = isHighlighted ? `${statusColor}.200` : `${statusColor}.100`;

              return (
                <Tr
                  key={drive.id}
                  id={`drive-${drive.id}`}
                  bg={statusTab === 'all' ? rowBg : isHighlighted ? 'blue.50' : 'white'}
                  _hover={
                    isRowClickable
                      ? {
                          bg: statusTab === 'all' ? hoverBg : isHighlighted ? 'blue.100' : '#f8fafc',
                          cursor: 'pointer',
                        }
                      : undefined
                  }
                  transition="background 0.15s ease"
                  onClick={isRowClickable ? () => handleRowClick(drive) : undefined}
                >
                  {columns.map((col) => (
                    <Td
                      key={col.id}
                      textAlign={col.id === 'actions' ? 'center' : 'left'}
                      maxW={
                        col.id === 'location_description'
                          ? '350px'
                          : col.id === 'eligibility'
                            ? '220px'
                            : undefined
                      }
                      className={col.id === 'eligibility' ? 'col-eligibility' : undefined}
                    >
                      {renderTableCell(drive, col.id)}
                    </Td>
                  ))}
                </Tr>
              );
            })
          )}
        </Tbody>
      </Table>
    </Box>
  );
}
