import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  InputLeftElement,
  Select,
  Text,
  VStack,
  Card,
  CardBody,
  Badge,
  Spinner,
  useToast,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import {
  SearchIcon,
  ChevronDownIcon,
  DownloadIcon,
  ViewIcon,
  DeleteIcon,
  RepeatIcon,
} from '@chakra-ui/icons';
import { FiFileText, FiFolder } from 'react-icons/fi';
import { PlacementService } from '../../services/placement.service';
import AdminLayout from '../../components/AdminLayout';
import PlacementReportPreview from '../../components/placement/PlacementReportPreview';
import { formatShortDateIST, formatDateTimeIST } from '../../utils/dateTime';
import './PlacementReportsPage.css';

const TABS = [
  { id: 'generate', label: 'Generate Report', icon: FiFileText },
  { id: 'history', label: 'Report History', icon: FiFolder },
];

const formatDate = (iso) => formatShortDateIST(iso);

const formatDateTime = (iso) => formatDateTimeIST(iso);

function StatusBadge({ status }) {
  const scheme = status === 'ready' ? 'green' : status === 'failed' ? 'red' : 'yellow';
  return (
    <Badge colorScheme={scheme} fontSize="10px" px={2} py={0.5} borderRadius="full" textTransform="capitalize">
      {status}
    </Badge>
  );
}

export default function PlacementReportsPage() {
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef();

  const [activeTab, setActiveTab] = useState('generate');

  const getDefaultDates = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: first.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  };

  const [dateFrom, setDateFrom] = useState(() => getDefaultDates().from);
  const [dateTo, setDateTo] = useState(() => getDefaultDates().to);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [savedReport, setSavedReport] = useState(null);
  const [downloadId, setDownloadId] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewLoadingId, setViewLoadingId] = useState(null);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGeneratedBy, setFilterGeneratedBy] = useState('');
  const [filterHistoryFrom, setFilterHistoryFrom] = useState('');
  const [filterHistoryTo, setFilterHistoryTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await PlacementService.getPlacementReportHistory({
        search: search.trim() || undefined,
        reportType: filterType || undefined,
        generatedBy: filterGeneratedBy.trim() || undefined,
        status: filterStatus || undefined,
        historyFrom: filterHistoryFrom || undefined,
        historyTo: filterHistoryTo || undefined,
        page: historyPage,
        limit: 12,
        sort: sortBy,
      });
      setHistory(data?.items || []);
      setHistoryTotalPages(data?.totalPages || 1);
      setHistoryTotal(data?.total || 0);
      setHistoryLoaded(true);
    } catch (e) {
      toast({ title: 'Could not load report history', description: e.message, status: 'error' });
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [
    search,
    filterType,
    filterStatus,
    filterGeneratedBy,
    filterHistoryFrom,
    filterHistoryTo,
    historyPage,
    sortBy,
    toast,
  ]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      toast({ title: 'Select date range', status: 'warning' });
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast({ title: 'Invalid range', status: 'warning' });
      return;
    }
    setLoading(true);
    setReport(null);
    setSavedReport(null);
    try {
      const data = await PlacementService.generatePlacementReport(dateFrom, dateTo);
      setReport(data?.report || data);
      setSavedReport(data?.saved || null);
      toast({ title: 'Report generated & saved', status: 'success' });
      setHistoryLoaded(false);
      if (activeTab === 'history') loadHistory();
    } catch (e) {
      toast({ title: 'Failed to generate report', description: e.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (row) => {
    const id = row?.id || savedReport?.id;
    if (!id) return;
    setDownloadId(id);
    try {
      const name = (row?.reportName || savedReport?.reportName || 'placement-report').replace(/[^\w\s.-]/g, '_');
      await PlacementService.downloadPlacementReport(id, name);
      toast({ title: 'Download started', status: 'success' });
    } catch (e) {
      toast({ title: 'Download failed', description: e.message, status: 'error' });
    } finally {
      setDownloadId(null);
    }
  };

  const handleView = async (row) => {
    setViewLoadingId(row.id);
    try {
      const data = await PlacementService.viewPlacementReport(row.id);
      setReport(data?.report || null);
      setSavedReport(data?.meta || row);
      if (row.fromDate) setDateFrom(String(row.fromDate).slice(0, 10));
      if (row.toDate) setDateTo(String(row.toDate).slice(0, 10));
      setActiveTab('generate');
      toast({ title: 'Report loaded in preview', status: 'success' });
      setTimeout(() => {
        document.getElementById('placement-report-preview')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (e) {
      toast({ title: 'View failed', description: e.message, status: 'error' });
    } finally {
      setViewLoadingId(null);
    }
  };

  const handleRegenerate = (row) => {
    if (row?.fromDate) setDateFrom(String(row.fromDate).slice(0, 10));
    if (row?.toDate) setDateTo(String(row.toDate).slice(0, 10));
    setActiveTab('generate');
    toast({ title: 'Date range applied', description: 'Click Generate & Save to create a new report.', status: 'info' });
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row);
    onDeleteOpen();
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await PlacementService.deletePlacementReport(deleteTarget.id);
      if (savedReport?.id === deleteTarget.id) {
        setSavedReport(null);
        setReport(null);
      }
      toast({ title: 'Report deleted', status: 'success' });
      onDeleteClose();
      loadHistory();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, status: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const historyCountLabel =
    historyLoaded && !historyLoading ? `${historyTotal} report${historyTotal !== 1 ? 's' : ''}` : '—';

  return (
    <AdminLayout>
      <Box className="placement-reports-page" minH="100vh">
        <Box className="pr-sticky-shell">
          <Container maxW="container.xl" pt={6} pb={0}>
            <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={4} mb={4}>
              <Box>
                <Heading size="lg" className="pr-hero-title">Placement Reports</Heading>
                <Text className="pr-hero-sub">Enterprise reporting center — generate analytics and manage saved exports.</Text>
              </Box>
              {activeTab === 'history' && (
                <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                  {historyCountLabel}
                </Badge>
              )}
            </Flex>

            <nav className="pr-tabs" role="tablist">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`pr-tab ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <Icon className="pr-tab-icon" />
                    {t.label}
                    {t.id === 'history' && historyTotal > 0 && (
                      <span className="pr-tab-badge">{historyTotal}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </Container>
        </Box>

        <Container maxW="container.xl" py={6} px={{ base: 4, md: 6 }}>
          {activeTab === 'generate' && (
            <VStack spacing={6} align="stretch" className="pr-panel">
              <Card className="pr-toolbar-card" variant="outline">
                <CardBody>
                  <Text fontSize="sm" fontWeight="600" color="gray.600" mb={3}>
                    Report period
                  </Text>
                  <Flex gap={3} flexWrap="wrap" align="flex-end">
                    <InputGroup size="md" w="auto" bg="white" borderRadius="lg" className="pr-date-input">
                      <InputLeftAddon>From</InputLeftAddon>
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} borderLeft="none" />
                    </InputGroup>
                    <InputGroup size="md" w="auto" bg="white" borderRadius="lg" className="pr-date-input">
                      <InputLeftAddon>To</InputLeftAddon>
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} borderLeft="none" />
                    </InputGroup>
                    <Button
                      bg="#172e36"
                      color="white"
                      _hover={{ bg: '#1e3a47' }}
                      onClick={handleGenerate}
                      isLoading={loading}
                      loadingText="Generating…"
                    >
                      Generate & Save
                    </Button>
                    <Button
                      leftIcon={<DownloadIcon />}
                      variant="outline"
                      onClick={() => handleDownload(savedReport)}
                      isDisabled={!savedReport?.id}
                      isLoading={downloadId === savedReport?.id}
                    >
                      Download Excel
                    </Button>
                  </Flex>
                  {savedReport && (
                    <HStack mt={4} spacing={3} flexWrap="wrap" className="pr-saved-banner">
                      <Badge colorScheme="green">Saved · #{savedReport.id}</Badge>
                      <Text fontSize="sm" color="gray.600">{savedReport.fileSizeLabel}</Text>
                      <Text fontSize="sm" color="gray.500" noOfLines={1}>
                        {savedReport.reportName}
                      </Text>
                    </HStack>
                  )}
                </CardBody>
              </Card>

              {loading && (
                <Flex justify="center" py={16} direction="column" align="center" gap={3}>
                  <Spinner size="xl" color="#172e36" thickness="3px" />
                  <Text color="gray.500" fontSize="sm">Building analytics & Excel workbook…</Text>
                </Flex>
              )}

              {!loading && !report && (
                <Box className="pr-empty pr-empty-generate">
                  <FiFileText size={40} color="#94a3b8" />
                  <Text fontWeight="600" mt={4} color="gray.700">
                    No report preview yet
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={1} maxW="400px" textAlign="center">
                    Select a date range and click Generate & Save. Your report will appear here and be stored in Report History.
                  </Text>
                </Box>
              )}

              {report && !loading && (
                <Box id="placement-report-preview">
                  <PlacementReportPreview report={report} />
                </Box>
              )}
            </VStack>
          )}

          {activeTab === 'history' && (
            <VStack spacing={4} align="stretch" className="pr-panel">
              <Card className="pr-history-toolbar" variant="outline">
                <CardBody py={4}>
                  <Flex className="pr-filters" gap={3} flexWrap="wrap" align="center">
                    <InputGroup size="sm" flex="1" minW="200px" maxW="320px" bg="white">
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search name, author, period…"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setHistoryPage(1);
                        }}
                        pl={10}
                      />
                    </InputGroup>
                    <Select
                      size="sm"
                      maxW="150px"
                      bg="white"
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setHistoryPage(1);
                      }}
                    >
                      <option value="">All types</option>
                      <option value="placement_summary">Placement summary</option>
                    </Select>
                    <Select
                      size="sm"
                      maxW="130px"
                      bg="white"
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setHistoryPage(1);
                      }}
                    >
                      <option value="">All status</option>
                      <option value="ready">Ready</option>
                      <option value="generating">Generating</option>
                      <option value="failed">Failed</option>
                    </Select>
                    <Input
                      size="sm"
                      maxW="140px"
                      bg="white"
                      placeholder="Generated by"
                      value={filterGeneratedBy}
                      onChange={(e) => {
                        setFilterGeneratedBy(e.target.value);
                        setHistoryPage(1);
                      }}
                    />
                    <Input
                      type="date"
                      size="sm"
                      maxW="140px"
                      bg="white"
                      title="From date"
                      value={filterHistoryFrom}
                      onChange={(e) => {
                        setFilterHistoryFrom(e.target.value);
                        setHistoryPage(1);
                      }}
                    />
                    <Input
                      type="date"
                      size="sm"
                      maxW="140px"
                      bg="white"
                      title="To date"
                      value={filterHistoryTo}
                      onChange={(e) => {
                        setFilterHistoryTo(e.target.value);
                        setHistoryPage(1);
                      }}
                    />
                    <Select
                      size="sm"
                      maxW="150px"
                      bg="white"
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setHistoryPage(1);
                      }}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="name">Name A–Z</option>
                      <option value="size">Largest file</option>
                    </Select>
                  </Flex>
                </CardBody>
              </Card>

              {historyLoading ? (
                <Flex justify="center" py={16}>
                  <Spinner size="lg" color="#172e36" />
                </Flex>
              ) : history.length === 0 ? (
                <Box className="pr-empty">
                  <FiFolder size={40} color="#94a3b8" />
                  <Text fontWeight="600" mt={4} color="gray.700">
                    No saved reports
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Generate a report from the first tab — it will appear here automatically.
                  </Text>
                  <Button mt={4} size="sm" variant="outline" onClick={() => setActiveTab('generate')}>
                    Go to Generate Report
                  </Button>
                </Box>
              ) : (
                <>
                  {sortBy === 'newest' && historyPage === 1 && history[0] && (
                    <Flex className="pr-latest-strip" align="center" gap={3} flexWrap="wrap">
                      <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                        Latest
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="gray.800" noOfLines={1} flex="1" minW="160px">
                        {history[0].reportName}
                      </Text>
                      <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
                        {formatDate(history[0].fromDate)} – {formatDate(history[0].toDate)}
                      </Text>
                      <HStack spacing={2} flexShrink={0}>
                        <Button
                          size="xs"
                          variant="outline"
                          leftIcon={<ViewIcon />}
                          onClick={() => handleView(history[0])}
                          isLoading={viewLoadingId === history[0].id}
                        >
                          View
                        </Button>
                        <Button
                          size="xs"
                          bg="#172e36"
                          color="white"
                          _hover={{ bg: '#1e3a47' }}
                          leftIcon={<DownloadIcon />}
                          onClick={() => handleDownload(history[0])}
                          isDisabled={history[0].status !== 'ready'}
                          isLoading={downloadId === history[0].id}
                        >
                          Download
                        </Button>
                      </HStack>
                    </Flex>
                  )}

                  <Card variant="outline" className="pr-history-table-card">
                    <TableContainer className="pr-history-table-scroll">
                      <Table size="sm" className="pr-history-table">
                        <Thead>
                          <Tr>
                            <Th>Report</Th>
                            <Th>Period</Th>
                            <Th>Generated</Th>
                            <Th>Type</Th>
                            <Th>Size</Th>
                            <Th>Status</Th>
                            <Th textAlign="right" w="140px">
                              Actions
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {history.map((row) => (
                            <Tr key={row.id} className="pr-history-row">
                              <Td fontWeight="medium" maxW={{ base: '140px', md: '240px' }} isTruncated title={row.reportName}>
                                {row.reportName}
                              </Td>
                              <Td whiteSpace="nowrap" fontSize="xs" color="gray.600">
                                {formatDate(row.fromDate)} – {formatDate(row.toDate)}
                              </Td>
                              <Td whiteSpace="nowrap" fontSize="xs" color="gray.600">
                                {formatDateTime(row.generatedAt)}
                              </Td>
                              <Td>
                                <Badge variant="subtle" fontSize="10px" borderRadius="md">
                                  {row.reportType}
                                </Badge>
                              </Td>
                              <Td fontSize="xs" color="gray.600">
                                {row.fileSizeLabel}
                              </Td>
                              <Td>
                                <StatusBadge status={row.status} />
                              </Td>
                              <Td textAlign="right">
                                <HStack justify="flex-end" spacing={0} className="pr-row-actions">
                                  <IconButton
                                    size="sm"
                                    icon={<ViewIcon />}
                                    variant="ghost"
                                    aria-label="View"
                                    onClick={() => handleView(row)}
                                    isLoading={viewLoadingId === row.id}
                                  />
                                  <IconButton
                                    size="sm"
                                    icon={<DownloadIcon />}
                                    variant="ghost"
                                    aria-label="Download"
                                    onClick={() => handleDownload(row)}
                                    isDisabled={row.status !== 'ready'}
                                    isLoading={downloadId === row.id}
                                  />
                                  <Menu>
                                    <MenuButton
                                      as={IconButton}
                                      icon={<ChevronDownIcon />}
                                      size="sm"
                                      variant="ghost"
                                      aria-label="More actions"
                                    />
                                    <MenuList>
                                      <MenuItem icon={<RepeatIcon />} onClick={() => handleRegenerate(row)}>
                                        Regenerate
                                      </MenuItem>
                                      <MenuItem icon={<DeleteIcon />} color="red.500" onClick={() => confirmDelete(row)}>
                                        Delete
                                      </MenuItem>
                                    </MenuList>
                                  </Menu>
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </Card>

                  {historyTotalPages > 1 && (
                    <Flex justify="center" align="center" gap={3} pt={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        isDisabled={historyPage <= 1}
                        onClick={() => setHistoryPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <Text fontSize="sm" color="gray.600">
                        Page {historyPage} of {historyTotalPages}
                      </Text>
                      <Button
                        size="sm"
                        variant="outline"
                        isDisabled={historyPage >= historyTotalPages}
                        onClick={() => setHistoryPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </Flex>
                  )}
                </>
              )}
            </VStack>
          )}
        </Container>
      </Box>

      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader>Delete report?</AlertDialogHeader>
            <AlertDialogBody>
              This permanently removes &quot;{deleteTarget?.reportName}&quot; and its Excel file from storage.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} isLoading={deleting} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AdminLayout>
  );
}
