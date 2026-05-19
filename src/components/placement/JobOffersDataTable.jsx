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
  Badge,
  Spinner,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
} from '@chakra-ui/react';
import { EditIcon, ViewIcon } from '@chakra-ui/icons';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { HiOutlineDotsVertical } from 'react-icons/hi';

export const JOB_OFFERS_COLUMN_DEFS = {
  usn: { id: 'usn', label: 'USN' },
  student: { id: 'student', label: 'Student' },
  batch: { id: 'batch', label: 'Batch' },
  school: { id: 'school', label: 'School' },
  program: { id: 'program', label: 'Program' },
  company: { id: 'company', label: 'Company' },
  designation: { id: 'designation', label: 'Designation' },
  job_type: { id: 'job_type', label: 'Job Type' },
  academic_year: { id: 'academic_year', label: 'Academic Year' },
  source: { id: 'source', label: 'Source' },
  remarks: { id: 'remarks', label: 'Remarks' },
  ctc_min: { id: 'ctc_min', label: 'CTC Min' },
  ctc_max: { id: 'ctc_max', label: 'CTC Max' },
  ctc_variable: { id: 'ctc_variable', label: 'Variable Pay' },
  ctc_stock: { id: 'ctc_stock', label: 'Stock (LPA)' },
  type_of_hiring: { id: 'type_of_hiring', label: 'Hiring Type' },
  job_description: { id: 'job_description', label: 'Job Description' },
  internship_duration: { id: 'internship_duration', label: 'Duration (Months)' },
  stipend_min: { id: 'stipend_min', label: 'Stipend Min' },
  stipend_max: { id: 'stipend_max', label: 'Stipend Max' },
  offer_status: { id: 'offer_status', label: 'Status' },
  actions: { id: 'actions', label: 'Actions' },
};

/** Default columns on company details (company hidden — already on company page). */
export const COMPANY_PAGE_OFFER_COLUMNS = [
  'usn',
  'student',
  'batch',
  'school',
  'program',
  'designation',
  'job_type',
  'ctc_min',
  'ctc_max',
  'offer_status',
  'actions',
];

function resolveOfferStatus(offer) {
  if (offer.is_accepted === false) return 'Declined';
  if (offer.is_accepted === true) {
    const letter =
      offer.placement_offer_letter_status ||
      offer.capstone_offer_letter_status ||
      offer.offer_letter_status;
    if (letter && ['Accepted', 'Issued'].includes(letter)) return letter;
    return 'Accepted';
  }
  const letter =
    offer.placement_offer_letter_status ||
    offer.capstone_offer_letter_status ||
    offer.offer_letter_status ||
    'Pending';
  if (letter === 'Rejected') return 'Declined';
  return letter;
}

function getOfferFields(offer) {
  return {
    companyName: offer.company_name || offer.capstone_company_name || '—',
    designation:
      offer.placement_designation || offer.capstone_designation || offer.designation || '—',
    jobType: offer.offer_job_type || offer.job_type || '—',
    offerStatus: resolveOfferStatus(offer),
    academicYear:
      offer.offer_academic_year ||
      offer.placement_academic_year ||
      offer.capstone_academic_year ||
      offer.academic_year ||
      '—',
    remarks:
      offer.offer_remarks || offer.placement_remarks || offer.capstone_remarks || offer.remarks || '—',
  };
}

function statusColorScheme(offerStatus) {
  if (['Issued', 'Accepted'].includes(offerStatus)) return 'green';
  if (['Yet to Receive', 'Pending'].includes(offerStatus)) return 'orange';
  if (offerStatus === 'Rejected' || offerStatus === 'Declined') return 'red';
  return 'gray';
}

const thProps = {
  color: 'gray.600',
  fontSize: 'xs',
  textTransform: 'uppercase',
  py: 4,
  letterSpacing: 'wider',
  whiteSpace: 'nowrap',
};

/**
 * Job offers table — same markup/styling as /placement/job-offers.
 */
export default function JobOffersDataTable({
  offers = [],
  loading = false,
  visibleColumns = COMPANY_PAGE_OFFER_COLUMNS,
  readOnly = false,
  onEditOffer,
  emptyMessage = 'No offers found',
  ctcSort = 'none',
  onCtcSortToggle,
  actionsAsMenu = false,
}) {
  const navigate = useNavigate();
  const cols = readOnly ? visibleColumns.filter((c) => c !== 'actions') : visibleColumns;

  const renderOfferActionsMenu = (offer) => (
    <Menu placement="bottom-end" isLazy closeOnSelect>
      <MenuButton
        as={IconButton}
        icon={<HiOutlineDotsVertical size={18} />}
        variant="ghost"
        size="sm"
        color="gray.500"
        borderRadius="md"
        aria-label="Offer actions"
        _hover={{ bg: 'gray.100', color: 'gray.800' }}
        onClick={(e) => e.stopPropagation()}
      />
      <MenuList minW="160px" shadow="lg" borderColor="gray.200" zIndex={30} onClick={(e) => e.stopPropagation()}>
        {onEditOffer && (
          <MenuItem
            icon={<EditIcon />}
            fontSize="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEditOffer(offer);
            }}
          >
            Edit offer
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );

  const renderCell = (offer, colId) => {
    const f = getOfferFields(offer);

    switch (colId) {
      case 'usn':
        return (
          <Badge colorScheme="purple" fontSize="xs" variant="subtle">
            {offer.usn}
          </Badge>
        );
      case 'student':
        return offer.usn ? (
          <Button
            variant="link"
            color="blue.600"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/placement/students/${encodeURIComponent(offer.usn)}`);
            }}
            sx={{ textDecoration: 'underline' }}
            size="sm"
            fontWeight="600"
          >
            {offer.student_name || offer.usn}
          </Button>
        ) : (
          <Text fontSize="sm" fontWeight="600" color="gray.700">
            {offer.student_name || '—'}
          </Text>
        );
      case 'batch':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.batch || '—'}
          </Text>
        );
      case 'school':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.school || '—'}
          </Text>
        );
      case 'program':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.program || '—'}
          </Text>
        );
      case 'company':
        return offer.company_id ? (
          <Text
            as="span"
            fontSize="sm"
            fontWeight="600"
            color="blue.600"
            cursor="pointer"
            _hover={{ textDecoration: 'underline' }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/placement/company/${offer.company_id}`);
            }}
          >
            {f.companyName}
          </Text>
        ) : (
          <Text fontSize="sm" fontWeight="600" color="gray.700">
            {f.companyName}
          </Text>
        );
      case 'designation':
        return (
          <Text fontSize="sm" color="gray.600">
            {f.designation}
          </Text>
        );
      case 'job_type':
        return (
          <Text fontSize="sm" color="gray.600">
            {f.jobType}
          </Text>
        );
      case 'academic_year':
        return (
          <Text fontSize="sm" color="gray.600">
            {f.academicYear}
          </Text>
        );
      case 'source':
        return (
          <Badge
            colorScheme={
              offer.source === 'capstone' ? 'purple' : offer.source === 'placement' ? 'blue' : 'gray'
            }
            fontSize="xs"
            variant="subtle"
          >
            {offer.source || 'offer'}
          </Badge>
        );
      case 'remarks':
        return (
          <Text fontSize="sm" color="gray.600" maxW="200px" isTruncated title={f.remarks}>
            {f.remarks}
          </Text>
        );
      case 'ctc_min':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.placement_ctc_min_lpa ?? '—'}
          </Text>
        );
      case 'ctc_max':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.placement_ctc_max_lpa ?? '—'}
          </Text>
        );
      case 'ctc_variable':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.placement_ctc_variable_pay ?? '—'}
          </Text>
        );
      case 'ctc_stock':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.placement_ctc_stock_in_lpa ?? '—'}
          </Text>
        );
      case 'type_of_hiring':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.placement_type_of_hiring ?? '—'}
          </Text>
        );
      case 'job_description':
        return (
          <Text
            fontSize="sm"
            color="gray.600"
            maxW="200px"
            isTruncated
            title={offer.placement_job_description}
          >
            {offer.placement_job_description || '—'}
          </Text>
        );
      case 'internship_duration':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.capstone_internship_duration_months || offer.internship_duration || '—'}
          </Text>
        );
      case 'stipend_min':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.capstone_internship_stipend_min || offer.internship_stipend_min || '—'}
          </Text>
        );
      case 'stipend_max':
        return (
          <Text fontSize="sm" color="gray.600">
            {offer.capstone_internship_stipend_max || offer.internship_stipend_max || '—'}
          </Text>
        );
      case 'offer_status':
        return (
          <Badge
            colorScheme={statusColorScheme(f.offerStatus)}
            px={2}
            py={0.5}
            borderRadius="full"
            fontSize="xs"
            textTransform="capitalize"
          >
            {f.offerStatus}
          </Badge>
        );
      case 'actions':
        if (readOnly) return '—';
        if (actionsAsMenu) {
          return (
            <Flex justify="flex-end" onClick={(e) => e.stopPropagation()}>
              {renderOfferActionsMenu(offer)}
            </Flex>
          );
        }
        if (!onEditOffer) return '—';
        return (
          <IconButton
            icon={<EditIcon />}
            size="sm"
            variant="ghost"
            colorScheme="blue"
            aria-label="Edit offer"
            onClick={(e) => {
              e.stopPropagation();
              onEditOffer(offer);
            }}
          />
        );
      default:
        return '—';
    }
  };

  return (
    <Box
      bg="white"
      borderRadius="xl"
      shadow="sm"
      overflowX="auto"
      border="1px solid"
      borderColor="gray.100"
      className="job-offers-data-table-wrap"
    >
      <Table variant="simple" size="sm">
        <Thead bg="gray.50" borderBottom="2px solid" borderColor="gray.100">
          <Tr>
            {cols.map((colId) => {
              if (colId === 'ctc_min' && onCtcSortToggle) {
                return (
                  <Th key={colId} {...thProps}>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={onCtcSortToggle}
                      p={0}
                    >
                      <HStack spacing={1} align="center">
                        <Text fontSize="xs">CTC Min</Text>
                        <HStack spacing={0} align="center">
                          <FiArrowUp size={10} color={ctcSort === 'asc' ? '#2b6cb0' : '#cbd5e0'} />
                          <FiArrowDown size={10} color={ctcSort === 'desc' ? '#2b6cb0' : '#cbd5e0'} />
                        </HStack>
                      </HStack>
                    </Button>
                  </Th>
                );
              }
              const def = JOB_OFFERS_COLUMN_DEFS[colId];
              return (
                <Th
                  key={colId}
                  {...thProps}
                  textAlign={colId === 'actions' ? 'center' : undefined}
                  w={colId === 'actions' ? '56px' : undefined}
                >
                  {colId === 'actions' ? '' : def?.label || colId}
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr>
              <Td colSpan={cols.length} textAlign="center" py={10}>
                <Spinner size="lg" color="blue.500" />
                <Text mt={4} color="gray.500">
                  Loading offers…
                </Text>
              </Td>
            </Tr>
          ) : offers.length === 0 ? (
            <Tr>
              <Td colSpan={cols.length} textAlign="center" py={10}>
                <Text color="gray.500">{emptyMessage}</Text>
              </Td>
            </Tr>
          ) : (
            offers.map((offer) => (
              <Tr key={offer.offer_row_id ?? offer.placement_id ?? offer.id ?? offer.usn} _hover={{ bg: 'gray.50' }} transition="all 0.2s">
                {cols.map((colId) => (
                  <Td
                    key={colId}
                    textAlign={colId === 'actions' ? 'center' : undefined}
                    w={colId === 'actions' ? '56px' : undefined}
                  >
                    {renderCell(offer, colId)}
                  </Td>
                ))}
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Box>
  );
}
