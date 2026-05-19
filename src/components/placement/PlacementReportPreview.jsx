import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
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
  Badge,
  Progress,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PlacementReportPreview({ report }) {
  if (!report) return null;

  return (
    <Box className="report-content" id="placement-report">
      <Card mb={6} bg="white" shadow="md" borderRadius="xl">
        <CardBody>
          <Text fontSize="xs" color="gray.500" mb={1}>
            Report Period: {formatDate(report.meta?.dateFrom)} – {formatDate(report.meta?.dateTo)}
          </Text>
          <Text fontSize="xs" color="gray.500">
            Generated: {formatDate(report.meta?.generatedAt)}
          </Text>
        </CardBody>
      </Card>

      <Card mb={6} bg="white" shadow="md" borderRadius="xl">
        <CardHeader bg="gray.50" borderBottomWidth="1px" borderTopRadius="xl">
          <Heading size="md">1. Executive Snapshot</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat><StatLabel>Eligible Students</StatLabel><StatNumber>{report.executiveSnapshot?.totalEligible ?? '-'}</StatNumber></Stat>
            <Stat>
              <StatLabel>Placed (This Period)</StatLabel>
              <StatNumber color="green.600">{report.executiveSnapshot?.placedThisPeriod ?? '-'}</StatNumber>
              <StatHelpText>Cumulative: {report.executiveSnapshot?.placedCumulative ?? '-'}</StatHelpText>
            </Stat>
            <Stat><StatLabel>Placement Rate</StatLabel><StatNumber>{report.executiveSnapshot?.placementRate ?? '-'}%</StatNumber></Stat>
            <Stat>
              <StatLabel>Avg CTC (LPA)</StatLabel>
              <StatNumber>{report.executiveSnapshot?.avgCtc ?? '-'}</StatNumber>
              <StatHelpText>Median: {report.executiveSnapshot?.medianCtc ?? '-'} | Max: {report.executiveSnapshot?.maxCtc ?? '-'}</StatHelpText>
            </Stat>
            <Stat><StatLabel>Companies Onboarded</StatLabel><StatNumber>{report.executiveSnapshot?.companiesOnboarded ?? '-'}</StatNumber></Stat>
            <Stat><StatLabel>Active Drives</StatLabel><StatNumber>{report.executiveSnapshot?.activeDrives ?? '-'}</StatNumber></Stat>
            <Stat><StatLabel>Pending Offers</StatLabel><StatNumber>{report.executiveSnapshot?.pendingOffers ?? '-'}</StatNumber></Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Card mb={6} bg="white" shadow="md" borderRadius="xl">
        <CardHeader bg="gray.50" borderBottomWidth="1px"><Heading size="md">2. Student Pipeline Health</Heading></CardHeader>
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
            value={report.pipelineHealth?.eligible > 0 ? ((report.pipelineHealth?.placed || 0) / report.pipelineHealth.eligible) * 100 : 0}
            colorScheme="green"
            size="sm"
            borderRadius="full"
          />
        </CardBody>
      </Card>

      <Card mb={6} bg="white" shadow="md" borderRadius="xl">
        <CardHeader bg="gray.50" borderBottomWidth="1px"><Heading size="md">3. Placement Drive Performance</Heading></CardHeader>
        <CardBody>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr><Th>Company</Th><Th isNumeric>Registrations</Th><Th isNumeric>Interviewed</Th><Th isNumeric>Selected</Th><Th isNumeric>Conversion %</Th></Tr>
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

      <Card mb={6} bg="white" shadow="md" borderRadius="xl">
        <CardHeader bg="gray.50" borderBottomWidth="1px"><Heading size="md">4. Company & Recruiter Portfolio</Heading></CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Stat><StatLabel>New Companies Added</StatLabel><StatNumber>{report.companyPortfolio?.newCompaniesAdded ?? 0}</StatNumber></Stat>
            <Stat><StatLabel>Companies with Placements</StatLabel><StatNumber>{report.companyPortfolio?.companiesWithPlacements ?? 0}</StatNumber></Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Card mb={6} bg="white" shadow="md" borderRadius="xl">
        <CardHeader bg="gray.50" borderBottomWidth="1px"><Heading size="md">5. Offer & Salary Analytics</Heading></CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={4}>
            <Stat><StatLabel>&lt;3 LPA</StatLabel><StatNumber>{report.offerAnalytics?.ctcDistribution?.under3 ?? 0}</StatNumber></Stat>
            <Stat><StatLabel>3–5 LPA</StatLabel><StatNumber>{report.offerAnalytics?.ctcDistribution?.between3and5 ?? 0}</StatNumber></Stat>
            <Stat><StatLabel>5–8 LPA</StatLabel><StatNumber>{report.offerAnalytics?.ctcDistribution?.between5and8 ?? 0}</StatNumber></Stat>
            <Stat><StatLabel>8+ LPA</StatLabel><StatNumber>{report.offerAnalytics?.ctcDistribution?.above8 ?? 0}</StatNumber></Stat>
          </SimpleGrid>
          {(report.offerAnalytics?.topOffers || []).length > 0 && (
            <TableContainer>
              <Text fontSize="sm" fontWeight="600" color="gray.600" mb={2}>Top offers (by CTC)</Text>
              <Table size="sm">
                <Thead>
                  <Tr><Th>USN</Th><Th>Company</Th><Th>Designation</Th><Th isNumeric>CTC (LPA)</Th></Tr>
                </Thead>
                <Tbody>
                  {report.offerAnalytics.topOffers.map((o, i) => (
                    <Tr key={o.usn || i}>
                      <Td>{o.usn}</Td>
                      <Td>{o.company}</Td>
                      <Td>{o.designation || '—'}</Td>
                      <Td isNumeric>{o.ctc ?? '—'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      <Card mb={6} bg="white" shadow="md" borderRadius="xl">
        <CardHeader bg="gray.50" borderBottomWidth="1px"><Heading size="md">6. Compliance & Risk</Heading></CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
            <Stat><StatLabel>Violations</StatLabel><StatNumber>{report.compliance?.violations ?? 0}</StatNumber></Stat>
            <Stat><StatLabel>Disciplinary</StatLabel><StatNumber>{report.compliance?.disciplinary ?? 0}</StatNumber></Stat>
            <Stat><StatLabel>Eligibility overrides</StatLabel><StatNumber>{report.compliance?.eligibilityOverrides ?? 0}</StatNumber></Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Card mb={6} bg="white" shadow="md" borderRadius="xl">
        <CardHeader bg="gray.50" borderBottomWidth="1px"><Heading size="md">7. Student Readiness</Heading></CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
            <Stat><StatLabel>Total students</StatLabel><StatNumber>{report.studentReadiness?.totalStudents ?? 0}</StatNumber></Stat>
            <Stat><StatLabel>With resume</StatLabel><StatNumber>{report.studentReadiness?.withResume ?? 0}</StatNumber></Stat>
            <Stat><StatLabel>With internship</StatLabel><StatNumber>{report.studentReadiness?.withInternship ?? 0}</StatNumber></Stat>
            <Stat><StatLabel>With project</StatLabel><StatNumber>{report.studentReadiness?.withProject ?? 0}</StatNumber></Stat>
            <Stat>
              <StatLabel>Resume coverage</StatLabel>
              <StatNumber>{report.studentReadiness?.resumePercent ?? 0}%</StatNumber>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Card mb={6} bg="white" shadow="md" borderRadius="xl">
        <CardHeader bg="gray.50" borderBottomWidth="1px"><Heading size="md">8. Alumni & Events</Heading></CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <Stat>
              <StatLabel>HR recommendations</StatLabel>
              <StatNumber>{report.alumniLeverage?.hrRecommendations ?? 0}</StatNumber>
            </Stat>
          </SimpleGrid>
          {(report.companyPortfolio?.placementsByCompany || []).length > 0 && (
            <TableContainer mb={4}>
              <Text fontSize="sm" fontWeight="600" color="gray.600" mb={2}>Placements by company</Text>
              <Table size="sm">
                <Thead><Tr><Th>Company</Th><Th isNumeric>Placements</Th></Tr></Thead>
                <Tbody>
                  {report.companyPortfolio.placementsByCompany.map((c, i) => (
                    <Tr key={c.company || i}>
                      <Td>{c.company}</Td>
                      <Td isNumeric>{c.count}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
          {(report.events || []).length > 0 && (
            <TableContainer>
              <Text fontSize="sm" fontWeight="600" color="gray.600" mb={2}>Events in period</Text>
              <Table size="sm">
                <Thead><Tr><Th>Title</Th><Th>Type</Th><Th>Status</Th><Th>Date</Th></Tr></Thead>
                <Tbody>
                  {report.events.map((e, i) => (
                    <Tr key={e.title || i}>
                      <Td>{e.title}</Td>
                      <Td>{e.type || '—'}</Td>
                      <Td><Badge>{e.status}</Badge></Td>
                      <Td>{formatDate(e.date)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      <Card mb={6} bg="white" shadow="md" borderRadius="xl">
        <CardHeader bg="gray.50" borderBottomWidth="1px"><Heading size="md">9. Placement Data (A–Z)</Heading></CardHeader>
        <CardBody>
          <TableContainer overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>#</Th><Th>Student</Th><Th>USN</Th><Th>School</Th><Th>Program</Th>
                  <Th>Company</Th><Th>Designation</Th><Th isNumeric>CTC Min</Th><Th isNumeric>CTC Max</Th>
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
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </Box>
  );
}
