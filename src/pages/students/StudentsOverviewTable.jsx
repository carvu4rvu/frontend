import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  HStack,
  Flex,
  Button,
  VStack,
  Checkbox,
  Stack,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverCloseButton,
} from '@chakra-ui/react';
import { SearchIcon, DownloadIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FiFilter } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { PlacementService } from '../../services/placement.service';

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

const ALL_COLUMNS = [
  { key: 'id', label: '#', rowKey: null },
  { key: 'name', label: 'Student Name', rowKey: 'full_name' },
  { key: 'usn', label: 'USN', rowKey: 'usn' },
  { key: 'email', label: 'Email', rowKey: 'college_email' },
  { key: 'opt_in', label: 'Opt-in', rowKey: 'opt_in' },
  { key: 'eligible', label: 'Drives eligible', rowKey: 'drives_eligible' },
  { key: 'applied', label: 'Drives applied', rowKey: 'drives_applied' },
  { key: 'oa', label: 'OA passed', rowKey: 'oas_passed' },
  { key: 'gd', label: 'GD passed', rowKey: 'gd_passed' },
  { key: 'technical', label: 'Technical passed', rowKey: 'technical_passed' },
  { key: 'interview', label: 'Interview passed', rowKey: 'interview_passed' },
  { key: 'hr', label: 'HR passed', rowKey: 'hr_passed' },
  { key: 'final_select', label: 'Final select passed', rowKey: 'final_select_passed' },
  { key: 'offers', label: 'Offers', rowKey: 'offers_count' },
  { key: 'internship_offers', label: 'Internship offers', rowKey: 'internship_offers' },
  { key: 'accepted', label: 'Offer accepted', rowKey: 'offer_accepted' },
  { key: 'ctc', label: 'Max CTC (LPA)', rowKey: 'max_ctc_lpa' },
  { key: 'stipend', label: 'Max stipend', rowKey: 'max_stipend' },
  { key: 'absent', label: 'Drives absent', rowKey: 'drives_absent' },
  { key: 'placement_violations', label: 'Placement violations', rowKey: 'placement_violations' },
  { key: 'disciplinary', label: 'Disciplinary', rowKey: 'disciplinary' },
  { key: 'admin_hold', label: 'Admin hold', rowKey: 'admin_hold' },
  { key: 'malpractice', label: 'Malpractice', rowKey: 'malpractice' },
];

const NUMERIC_COLUMN_KEYS = new Set([
  'eligible', 'applied', 'oa', 'gd', 'technical', 'interview', 'hr', 'final_select',
  'offers', 'internship_offers', 'ctc', 'stipend', 'absent', 'placement_violations', 'disciplinary', 'malpractice',
]);

function getCellValue(row, col) {
  if (col.key === 'id') return null;
  if (col.rowKey === 'offer_accepted') return row.offer_accepted ? 'Yes' : 'No';
  if (col.rowKey === 'opt_in') return row.opt_in === false ? 'No' : 'Yes';
  if (col.rowKey === 'admin_hold') return row.admin_hold ? 'Yes' : 'No';
  return row[col.rowKey] ?? '';
}

export default function StudentsOverviewTable() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map((c) => c.key));
  const [activeFilters, setActiveFilters] = useState({});
  const [sorting, setSorting] = useState({ column: 'usn', direction: 'asc' });
  const [columnsOpen, setColumnsOpen] = useState(false);
  const filterPopoverRef = useRef({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getStudentsOverviewTable({ limit: 5000 });
      setRawRows(data.rows || []);
    } catch (err) {
      toast({ title: 'Failed to load data', description: err?.message, status: 'error', isClosable: true });
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    let list = rawRows.filter((row) => {
      const searchLower = search.toLowerCase().trim();
      if (searchLower) {
        const match =
          (row.full_name || '').toLowerCase().includes(searchLower) ||
          (row.usn || '').toLowerCase().includes(searchLower) ||
          (row.college_email || '').toLowerCase().includes(searchLower) ||
          (row.school || '').toLowerCase().includes(searchLower) ||
          (row.program || '').toLowerCase().includes(searchLower);
        if (!match) return false;
      }
      for (const key of Object.keys(activeFilters)) {
        if (!activeFilters[key] || activeFilters[key].length === 0) continue;
        const col = ALL_COLUMNS.find((c) => c.key === key);
        const val = col && col.rowKey ? (getCellValue(row, col)) : '';
        if (!activeFilters[key].includes(val)) return false;
      }
      return true;
    });

    const col = ALL_COLUMNS.find((c) => c.key === sorting.column);
    if (col && col.rowKey) {
      list = [...list].sort((a, b) => {
        let va = getCellValue(a, col);
        let vb = getCellValue(b, col);
        if (typeof va === 'number' || NUMERIC_COLUMN_KEYS.has(col.key)) {
          va = Number(va) ?? 0;
          vb = Number(vb) ?? 0;
          return sorting.direction === 'asc' ? va - vb : vb - va;
        }
        va = String(va ?? '');
        vb = String(vb ?? '');
        const cmp = va.localeCompare(vb);
        return sorting.direction === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [rawRows, search, activeFilters, sorting]);

  const uniqueValues = useCallback(
    (columnKey) => {
      const col = ALL_COLUMNS.find((c) => c.key === columnKey);
      if (!col || !col.rowKey) return [];
      const set = new Set();
      rawRows.forEach((row) => {
        const v = getCellValue(row, col);
        set.add(v === undefined || v === null ? '' : String(v));
      });
      return Array.from(set).sort();
    },
    [rawRows]
  );

  const handleSort = (key) => {
    setSorting((prev) => ({
      column: key,
      direction: prev.column === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleFilterValue = (key, value) => {
    setActiveFilters((prev) => {
      const arr = prev[key] || [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      const nextFilters = { ...prev };
      if (next.length) nextFilters[key] = next;
      else delete nextFilters[key];
      return nextFilters;
    });
  };

  const clearFilter = (key) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetFilters = () => {
    setSearch('');
    setActiveFilters({});
  };

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => {
      const idx = prev.indexOf(key);
      if (idx > -1) {
        if (prev.length <= 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const exportCSV = () => {
    if (filteredRows.length === 0) {
      toast({ title: 'No data to export', status: 'warning' });
      return;
    }
    const headers = ALL_COLUMNS.filter((c) => c.key !== 'id' && visibleColumns.includes(c.key)).map((c) => c.label);
    const rowKeys = ALL_COLUMNS.filter((c) => c.key !== 'id' && visibleColumns.includes(c.key)).map((c) => c.rowKey);
    const rows = filteredRows.map((r) =>
      rowKeys.map((rk) => {
        if (rk === 'offer_accepted') return r.offer_accepted ? 'Yes' : 'No';
        if (rk === 'opt_in') return r.opt_in !== false ? 'Yes' : 'No';
        if (rk === 'admin_hold') return r.admin_hold ? 'Yes' : 'No';
        const v = r[rk];
        return v != null ? String(v) : '';
      })
    );
    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_placement_data.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export started', status: 'success' });
  };

  const appliedFilterCount = Object.keys(activeFilters).filter((k) => activeFilters[k] && activeFilters[k].length > 0).length;

  return (
    <Box w="full" fontFamily="Inter, system-ui, sans-serif" bg={slate[50]}>
      <VStack align="stretch" spacing={4}>
        {/* Toolbar - match reference */}
        <Flex
          bg="white"
          p={4}
          borderRadius="xl"
          shadow="sm"
          borderWidth="1px"
          borderColor={slate[200]}
          flexWrap="wrap"
          align="center"
          justify="space-between"
          gap={4}
        >
          <HStack spacing={3} flex="1" maxW="md">
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color={slate[400]} />
            </InputLeftElement>
            <Input
              placeholder="Search by name, USN, or school..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg={slate[50]}
              borderColor={slate[200]}
              borderRadius="lg"
              _focus={{ ring: 2, ringColor: 'blue.500', borderColor: 'blue.500' }}
            />
          </InputGroup>
          <Text fontSize="xs" bg={slate[100]} px={2} py={1} borderRadius="md" color={slate[600]} fontWeight="medium">
            {rawRows.length} Records Loaded
          </Text>
          </HStack>
          <HStack spacing={2}>
            <Popover isOpen={columnsOpen} onOpen={() => setColumnsOpen(true)} onClose={() => setColumnsOpen(false)} placement="bottom-end">
              <PopoverTrigger>
                <Button
                  size="sm"
                  rightIcon={<ChevronDownIcon />}
                  leftIcon={<Box as="span" fontSize="sm">☰</Box>}
                  borderWidth="1px"
                  borderColor={slate[200]}
                  borderRadius="lg"
                  bg="white"
                  color={slate[600]}
                  _hover={{ bg: slate[50] }}
                  fontWeight="medium"
                >
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent w="280px" maxH="400px" _focus={{ outline: 'none' }}>
                <PopoverCloseButton />
                <PopoverBody pt={8} pb={4} maxH="360px" overflowY="auto">
                  <Text fontSize="xs" fontWeight="bold" color={slate[400]} textTransform="uppercase" letterSpacing="wider" mb={3}>
                    Visible Columns
                  </Text>
                  <Stack spacing={2}>
                    {ALL_COLUMNS.map((col) => (
                      <Checkbox
                        key={col.key}
                        isChecked={visibleColumns.includes(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        colorScheme="blue"
                        size="sm"
                        isDisabled={col.key === 'id' || (visibleColumns.length <= 1 && visibleColumns.includes(col.key))}
                      >
                        {col.label}
                      </Checkbox>
                    ))}
                  </Stack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="link" color="blue.600" onClick={resetFilters}>
              Reset All
            </Button>
          </HStack>
        </Flex>

        {/* Table - match reference */}
        <Box
          bg="white"
          borderRadius="xl"
          shadow="sm"
          borderWidth="1px"
          borderColor={slate[200]}
          overflow="hidden"
          flex="1"
          display="flex"
          flexDir="column"
        >
          <TableContainer
            maxH="calc(100vh - 300px)"
            overflow="auto"
            css={{
              '&::-webkit-scrollbar': { width: 6, height: 6 },
              '&::-webkit-scrollbar-track': { background: slate[100] },
              '&::-webkit-scrollbar-thumb': { background: slate[400], borderRadius: 10 },
            }}
          >
            {loading ? (
              <Flex py={12} justify="center">
                <Spinner size="lg" color="blue.500" />
              </Flex>
            ) : (
              <Table size="sm" variant="simple">
                <Thead bg={slate[100]} borderBottom="2px" borderColor={slate[200]} position="sticky" top={0} zIndex={10}>
                  <Tr>
                    {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map((col) => (
                      <Th
                        key={col.key}
                        px={4}
                        py={3}
                        fontWeight="semibold"
                        color={slate[600]}
                        textTransform="none"
                        whiteSpace="nowrap"
                        borderColor={slate[200]}
                      >
                        <Flex align="center" gap={2}>
                          <Box
                            as="span"
                            cursor="pointer"
                            onClick={() => col.rowKey && handleSort(col.key)}
                            display="flex"
                            alignItems="center"
                            gap={1}
                          >
                            {col.label}
                            {col.rowKey && (
                              <Text as="span" color={slate[400]} fontSize="xs">
                                {sorting.column === col.key ? (sorting.direction === 'asc' ? '↑' : '↓') : '↕'}
                              </Text>
                            )}
                          </Box>
                          {col.rowKey && (
                            <Popover placement="bottom" closeOnBlur>
                              <PopoverTrigger>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  minW="auto"
                                  h="auto"
                                  p={1}
                                  opacity={0.7}
                                  _hover={{ opacity: 1, bg: slate[200] }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FiFilter size={12} />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent w="200px" maxH="300px" _focus={{ outline: 'none' }}>
                                <PopoverBody p={2}>
                                  <Flex justify="space-between" align="center" mb={2} pb={2} borderBottom="1px" borderColor={slate[200]}>
                                    <Text fontSize="xs" fontWeight="bold">Filter {col.label}</Text>
                                    <Button size="xs" variant="link" color="blue.500" onClick={() => clearFilter(col.key)}>
                                      Clear
                                    </Button>
                                  </Flex>
                                  <Stack spacing={1} maxH="200px" overflowY="auto">
                                    {uniqueValues(col.key).map((val) => (
                                      <Checkbox
                                        key={val}
                                        size="sm"
                                        isChecked={(activeFilters[col.key] || []).includes(val)}
                                        onChange={() => toggleFilterValue(col.key, val)}
                                      >
                                        <Text fontSize="xs" noOfLines={1}>{val || '(Empty)'}</Text>
                                      </Checkbox>
                                    ))}
                                  </Stack>
                                </PopoverBody>
                              </PopoverContent>
                            </Popover>
                          )}
                        </Flex>
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRows.map((row, idx) => (
                    <Tr
                      key={row.usn}
                      _hover={{ bg: 'blue.50' }}
                      cursor="pointer"
                      onClick={() => navigate(`/placement/students/${encodeURIComponent(row.usn)}`)}
                      borderBottom="1px"
                      borderColor={slate[100]}
                      bg="white"
                    >
                      {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map((col) => {
                        if (col.key === 'id') {
                          return (
                            <Td key={col.key} px={4} py={3} color={slate[500]} fontWeight="medium">
                              {idx + 1}
                            </Td>
                          );
                        }
                        const val = getCellValue(row, col);
                        return (
                          <Td key={col.key} px={4} py={3} whiteSpace="nowrap">
                            {col.key === 'offers' && (
                              (row.offers_count ?? 0) > 0 ? (
                                <Badge colorScheme="green" variant="subtle" px={2} py={0.5} borderRadius="full" fontSize="xs">
                                  {row.offers_count} Offers
                                </Badge>
                              ) : (
                                <Text as="span" color={slate[400]}>0</Text>
                              )
                            )}
                            {col.key === 'accepted' && (
                              <Text as="span" color={row.offer_accepted ? 'green.600' : slate[400]}>
                                {row.offer_accepted ? 'Yes' : 'No'}
                              </Text>
                            )}
                            {col.key === 'ctc' && (
                              row.max_ctc_lpa != null && Number(row.max_ctc_lpa) > 0 ? (
                                <>
                                  <Text as="span" fontWeight="bold" color={slate[900]}>{Number(row.max_ctc_lpa).toFixed(1)}</Text>
                                  <Text as="span" fontSize="10px" color={slate[400]} ml={1}>LPA</Text>
                                </>
                              ) : (
                                <Text as="span" color={slate[400]}>—</Text>
                              )
                            )}
                            {col.key === 'opt_in' && (
                              <Badge colorScheme={row.opt_in !== false ? 'green' : 'gray'} size="sm">{row.opt_in !== false ? 'Yes' : 'No'}</Badge>
                            )}
                            {col.key === 'admin_hold' && (
                              <Badge colorScheme={row.admin_hold ? 'orange' : 'gray'} size="sm">{row.admin_hold ? 'Yes' : 'No'}</Badge>
                            )}
                            {col.key === 'stipend' && (
                              row.max_stipend != null ? (
                                <Text as="span" fontSize="sm">{Number(row.max_stipend).toLocaleString()}</Text>
                              ) : (
                                <Text as="span" color={slate[400]}>—</Text>
                              )
                            )}
                            {!['offers', 'accepted', 'ctc', 'opt_in', 'admin_hold', 'stipend'].includes(col.key) && (
                              <Text as="span" fontSize="sm">{val !== '' && val !== undefined && val !== null ? String(val) : '—'}</Text>
                            )}
                          </Td>
                        );
                      })}
                    </Tr>
                  ))}
                  {Array.from({ length: Math.max(0, 10 - filteredRows.length) }).map((_, emptyIdx) => (
                    <Tr
                      key={`empty-${emptyIdx}`}
                      borderBottom="1px"
                      borderColor={slate[100]}
                      bg={slate[50]}
                      _hover={{}}
                      cursor="default"
                    >
                      {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map((col) => (
                        <Td key={col.key} px={4} py={3} whiteSpace="nowrap">
                          {' '}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </TableContainer>
          <Flex
            p={4}
            borderTop="1px"
            borderColor={slate[100]}
            bg={`${slate[50]}80`}
            align="center"
            justify="space-between"
            fontSize="xs"
            color={slate[500]}
          >
            <Text>Showing {filteredRows.length} of {rawRows.length} entries</Text>
            {appliedFilterCount > 0 && (
              <Badge colorScheme="blue" variant="subtle" px={2} py={1} borderRadius="md">
                Applied Filters: {appliedFilterCount}
              </Badge>
            )}
          </Flex>
        </Box>

        {/* Export - match reference header action */}
        <Flex justify="flex-end">
          <Button
            size="sm"
            leftIcon={<DownloadIcon />}
            colorScheme="green"
            bg="green.600"
            _hover={{ bg: 'green.700' }}
            color="white"
            onClick={exportCSV}
            isDisabled={filteredRows.length === 0}
            shadow="sm"
          >
            Export CSV
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
}
