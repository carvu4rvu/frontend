import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Badge,
  Spinner,
  useToast,
  Flex,
  Progress,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { PlacementService } from '../../services/placement.service';
import AdminLayout from '../../components/AdminLayout';

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PlacementReportsPage() {
  const toast = useToast();
  const getDefaultDates = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: first.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  };
  const [dateFrom, setDateFrom] = useState(() => getDefaultDates().from);
  const [dateTo, setDateTo] = useState(() => getDefaultDates().to);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      toast({ title: 'Select date range', description: 'Please choose both From and To dates.', status: 'warning' });
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast({ title: 'Invalid range', description: 'From date must be before To date.', status: 'warning' });
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const data = await PlacementService.getPlacementReport(dateFrom, dateTo);
      setReport(data);
      toast({ title: 'Report generated', status: 'success' });
    } catch (e) {
      toast({ title: 'Failed to generate report', description: e.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Box bg="#f0f0f0" minH="100vh" py={6} px={{ base: 4, md: 6 }}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="stretch">
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <Heading size="lg" color="gray.800" fontWeight="700">
                Monthly Placement Report
              </Heading>
              <HStack spacing={4} flexWrap="wrap">
                <InputGroup size="md" w="auto" bg="white" borderRadius="lg" shadow="sm">
                  <InputLeftAddon>From</InputLeftAddon>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} borderLeft="none" />
                </InputGroup>
                <InputGroup size="md" w="auto" bg="white" borderRadius="lg" shadow="sm">
                  <InputLeftAddon>To</InputLeftAddon>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} borderLeft="none" />
                </InputGroup>
                <Button colorScheme="blue" onClick={handleGenerate} isLoading={loading} loadingText="Generating...">
                  Generate Report
                </Button>
              </HStack>
            </Flex>

            <Text color="gray.600" fontSize="md">
              Select a date range to generate a boardroom-ready placement report with executive snapshot, pipeline health, drive performance, and A–Z placement data.
            </Text>

            {loading && (
              <Flex justify="center" py={12}>
                <Spinner size="xl" color="blue.500" />
              </Flex>
            )}

            {report && !loading && (
              <Box className="report-content" id="placement-report">
                {/* Report Header */}
                <Card mb={6} bg="white" shadow="md">
                  <CardBody>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Report Period: {formatDate(report.meta?.dateFrom)} – {formatDate(report.meta?.dateTo)}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Generated: {formatDate(report.meta?.generatedAt)}
                    </Text>
                  </CardBody>
                </Card>

                {/* 1. Executive Snapshot */}
                <Card mb={6} bg="white" shadow="md">
                  <CardHeader bg="gray.50" borderBottomWidth="1px">
                    <Heading size="md">1. Executive Snapshot</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                      <Stat>
                        <StatLabel>Eligible Students</StatLabel>
                        <StatNumber>{report.executiveSnapshot?.totalEligible ?? '-'}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Placed (This Period)</StatLabel>
                        <StatNumber color="green.600">{report.executiveSnapshot?.placedThisPeriod ?? '-'}</StatNumber>
                        <StatHelpText>Cumulative: {report.executiveSnapshot?.placedCumulative ?? '-'}</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Placement Rate</StatLabel>
                        <StatNumber>{report.executiveSnapshot?.placementRate ?? '-'}%</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Avg CTC (LPA)</StatLabel>
                        <StatNumber>{report.executiveSnapshot?.avgCtc ?? '-'}</StatNumber>
                        <StatHelpText>Median: {report.executiveSnapshot?.medianCtc ?? '-'} | Max: {report.executiveSnapshot?.maxCtc ?? '-'}</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Companies Onboarded</StatLabel>
                        <StatNumber>{report.executiveSnapshot?.companiesOnboarded ?? '-'}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Active Drives</StatLabel>
                        <StatNumber>{report.executiveSnapshot?.activeDrives ?? '-'}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Pending Offers</StatLabel>
                        <StatNumber>{report.executiveSnapshot?.pendingOffers ?? '-'}</StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* 2. Student Pipeline Health */}
                <Card mb={6} bg="white" shadow="md">
                  <CardHeader bg="gray.50" borderBottomWidth="1px">
                    <Heading size="md">2. Student Pipeline Health</Heading>
                  </CardHeader>
                  <CardBody>
                    <Wrap spacing={4} mb={4}>
                      {['registered', 'eligible', 'applied', 'interviewed', 'selected', 'placed'].map((key, i) => (
                        <WrapItem key={key}>
                          <Badge colorScheme={i === 5 ? 'green' : 'blue'} fontSize="md" px={3} py={1}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}: {report.pipelineHealth?.[key] ?? '-'}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>
                    <Progress
                      value={report.pipelineHealth?.eligible > 0
                        ? ((report.pipelineHealth?.placed || 0) / report.pipelineHealth.eligible) * 100
                        : 0}
                      colorScheme="green"
                      size="sm"
                      borderRadius="full"
                    />
                  </CardBody>
                </Card>

                {/* 3. Placement Drive Performance */}
                <Card mb={6} bg="white" shadow="md">
                  <CardHeader bg="gray.50" borderBottomWidth="1px">
                    <Heading size="md">3. Placement Drive Performance</Heading>
                  </CardHeader>
                  <CardBody>
                    <TableContainer>
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Company</Th>
                            <Th isNumeric>Registrations</Th>
                            <Th isNumeric>Interviewed</Th>
                            <Th isNumeric>Selected</Th>
                            <Th isNumeric>Conversion %</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {(report.drivePerformance || []).map((d, i) => (
                            <Tr key={d.driveId || i}>
                              <Td fontWeight="medium">{d.company}</Td>
                              <Td isNumeric>{d.registrations}</Td>
                              <Td isNumeric>{d.interviewed}</Td>
                              <Td isNumeric>{d.selected}</Td>
                              <Td isNumeric>{d.conversionRate}%</Td>
                            </Tr>
                          ))}
                          {(!report.drivePerformance || report.drivePerformance.length === 0) && (
                            <Tr><Td colSpan={5} color="gray.500" textAlign="center">No drive activity in this period</Td></Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </CardBody>
                </Card>

                {/* 4. Company Portfolio */}
                <Card mb={6} bg="white" shadow="md">
                  <CardHeader bg="gray.50" borderBottomWidth="1px">
                    <Heading size="md">4. Company & Recruiter Portfolio</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Stat>
                        <StatLabel>New Companies Added</StatLabel>
                        <StatNumber>{report.companyPortfolio?.newCompaniesAdded ?? 0}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Companies with Placements</StatLabel>
                        <StatNumber>{report.companyPortfolio?.companiesWithPlacements ?? 0}</StatNumber>
                      </Stat>
                    </SimpleGrid>
                    {(report.companyPortfolio?.placementsByCompany || []).length > 0 && (
                      <Box mt={4}>
                        <Text fontWeight="bold" mb={2}>Placements by Company</Text>
                        <TableContainer>
                          <Table size="sm">
                            <Thead><Tr><Th>Company</Th><Th isNumeric>Placements</Th></Tr></Thead>
                            <Tbody>
                              {report.companyPortfolio.placementsByCompany.slice(0, 15).map((c, i) => (
                                <Tr key={i}><Td>{c.company}</Td><Td isNumeric>{c.count}</Td></Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </CardBody>
                </Card>

                {/* 5. Offer & Salary Analytics */}
                <Card mb={6} bg="white" shadow="md">
                  <CardHeader bg="gray.50" borderBottomWidth="1px">
                    <Heading size="md">5. Offer & Salary Analytics</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={4}>
                      <Stat><StatLabel>&lt;3 LPA</StatLabel><StatNumber>{report.offerAnalytics?.ctcDistribution?.under3 ?? 0}</StatNumber></Stat>
                      <Stat><StatLabel>3–5 LPA</StatLabel><StatNumber>{report.offerAnalytics?.ctcDistribution?.between3and5 ?? 0}</StatNumber></Stat>
                      <Stat><StatLabel>5–8 LPA</StatLabel><StatNumber>{report.offerAnalytics?.ctcDistribution?.between5and8 ?? 0}</StatNumber></Stat>
                      <Stat><StatLabel>8+ LPA</StatLabel><StatNumber>{report.offerAnalytics?.ctcDistribution?.above8 ?? 0}</StatNumber></Stat>
                    </SimpleGrid>
                    {(report.offerAnalytics?.topOffers || []).length > 0 && (
                      <Box>
                        <Text fontWeight="bold" mb={2}>Top Offers</Text>
                        <TableContainer>
                          <Table size="sm">
                            <Thead><Tr><Th>Student</Th><Th>Company</Th><Th>Designation</Th><Th isNumeric>CTC (LPA)</Th></Tr></Thead>
                            <Tbody>
                              {report.offerAnalytics.topOffers.map((o, i) => (
                                <Tr key={i}><Td>{o.usn}</Td><Td>{o.company}</Td><Td>{o.designation || '-'}</Td><Td isNumeric>{o.ctc}</Td></Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </CardBody>
                </Card>

                {/* 6. Compliance */}
                <Card mb={6} bg="white" shadow="md">
                  <CardHeader bg="gray.50" borderBottomWidth="1px">
                    <Heading size="md">6. Compliance, Discipline & Risk</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Stat><StatLabel>Policy Violations</StatLabel><StatNumber>{report.compliance?.violations ?? 0}</StatNumber></Stat>
                      <Stat><StatLabel>Disciplinary Records</StatLabel><StatNumber>{report.compliance?.disciplinary ?? 0}</StatNumber></Stat>
                      <Stat><StatLabel>Eligibility Overrides</StatLabel><StatNumber>{report.compliance?.eligibilityOverrides ?? 0}</StatNumber></Stat>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* 7. Student Readiness */}
                <Card mb={6} bg="white" shadow="md">
                  <CardHeader bg="gray.50" borderBottomWidth="1px">
                    <Heading size="md">7. Student Readiness & Profile Quality</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                      <Stat><StatLabel>With Resume</StatLabel><StatNumber>{report.studentReadiness?.withResume ?? 0}</StatNumber><StatHelpText>{report.studentReadiness?.resumePercent ?? 0}%</StatHelpText></Stat>
                      <Stat><StatLabel>With Internship</StatLabel><StatNumber>{report.studentReadiness?.withInternship ?? 0}</StatNumber></Stat>
                      <Stat><StatLabel>With Project</StatLabel><StatNumber>{report.studentReadiness?.withProject ?? 0}</StatNumber></Stat>
                      <Stat><StatLabel>With Certification</StatLabel><StatNumber>{report.studentReadiness?.withCertification ?? 0}</StatNumber></Stat>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* 8. Alumni Leverage */}
                <Card mb={6} bg="white" shadow="md">
                  <CardHeader bg="gray.50" borderBottomWidth="1px">
                    <Heading size="md">8. Alumni & Industry Leverage</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stat><StatLabel>HR Recommendations (from alumni)</StatLabel><StatNumber>{report.alumniLeverage?.hrRecommendations ?? 0}</StatNumber></Stat>
                  </CardBody>
                </Card>

                {/* 9. Placement List A–Z */}
                <Card mb={6} bg="white" shadow="md">
                  <CardHeader bg="gray.50" borderBottomWidth="1px">
                    <Heading size="md">9. Placement Data (A–Z by Student)</Heading>
                  </CardHeader>
                  <CardBody>
                    <TableContainer overflowX="auto">
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>#</Th>
                            <Th>Student</Th>
                            <Th>USN</Th>
                            <Th>School</Th>
                            <Th>Program</Th>
                            <Th>Company</Th>
                            <Th>Designation</Th>
                            <Th isNumeric>CTC Min</Th>
                            <Th isNumeric>CTC Max</Th>
                            <Th>Type</Th>
                            <Th>Academic Year</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {(report.placementList || []).map((p, i) => (
                            <Tr key={i}>
                              <Td>{i + 1}</Td>
                              <Td fontWeight="medium">{p.studentName}</Td>
                              <Td>{p.usn}</Td>
                              <Td>{p.school}</Td>
                              <Td>{p.program}</Td>
                              <Td>{p.company}</Td>
                              <Td>{p.designation || '-'}</Td>
                              <Td isNumeric>{p.ctcMin ?? '-'}</Td>
                              <Td isNumeric>{p.ctcMax ?? '-'}</Td>
                              <Td>{p.typeOfHiring || '-'}</Td>
                              <Td>{p.academicYear || '-'}</Td>
                            </Tr>
                          ))}
                          {(!report.placementList || report.placementList.length === 0) && (
                            <Tr><Td colSpan={11} color="gray.500" textAlign="center">No placements in this period</Td></Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </CardBody>
                </Card>
              </Box>
            )}
          </VStack>
        </Container>
      </Box>

    </AdminLayout>
  );
}
