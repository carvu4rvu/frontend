import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Flex,
  useToast,
  Badge,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  Select,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { PlacementService } from '../../services/placement.service';
import AdminLayout from '../../components/AdminLayout';

const formatBool = (v) => (v === true ? 'Yes' : v === false ? 'No' : '-');
const formatStatus = (v) => (v == null || v === '' ? '-' : String(v));

export default function Process() {
  const navigate = useNavigate();
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [driveFilter, setDriveFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await PlacementService.getAllProcessList();
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          toast({ title: 'Failed to load process list', status: 'error' });
          setList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const drives = [...new Set(list.map((r) => r.company_name).filter(Boolean))].sort();
  const filtered = list.filter((row) => {
    const q = (search || '').toLowerCase();
    const matchSearch =
      !q ||
      (row.usn || '').toLowerCase().includes(q) ||
      (row.student_name || '').toLowerCase().includes(q) ||
      (row.company_name || '').toLowerCase().includes(q);
    const matchDrive = !driveFilter || row.company_name === driveFilter;
    return matchSearch && matchDrive;
  });

  return (
    <AdminLayout>
      <Container maxW="7xl" py={6}>
        <Heading size="lg" mb={2}>Student Placement Process</Heading>
        <Text color="gray.600" fontSize="sm" mb={6}>
          All records from student_placement_process (drive, student, eligibility, round statuses).
        </Text>

        <HStack spacing={4} mb={6} flexWrap="wrap">
          <InputGroup maxW="xs">
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" /></InputLeftElement>
            <Input
              placeholder="Search USN, student, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <Select
            maxW="xs"
            placeholder="All drives"
            value={driveFilter}
            onChange={(e) => setDriveFilter(e.target.value)}
          >
            {drives.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Button size="sm" colorScheme="blue" onClick={() => navigate('/placement/events')}>
            Placement Drives
          </Button>
        </HStack>

        {loading ? (
          <Flex justify="center" py={12}><Spinner size="xl" /></Flex>
        ) : (
          <TableContainer bg="white" borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" overflowX="auto">
            <Table variant="striped" size="sm">
              <Thead bg="gray.100">
                <Tr>
                  <Th>ID</Th>
                  <Th>Drive</Th>
                  <Th>USN</Th>
                  <Th>Student</Th>
                  <Th>Eligible</Th>
                  <Th>Reg. Status</Th>
                  <Th>Approved</Th>
                  <Th>OA</Th>
                  <Th>GD</Th>
                  <Th>Technical</Th>
                  <Th>Interview</Th>
                  <Th>HR</Th>
                  <Th>Final</Th>
                  <Th>Malpractice</Th>
                  <Th>Remarks</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.length === 0 ? (
                  <Tr>
                    <Td colSpan={16} textAlign="center" py={8} color="gray.500">
                      No process records found.
                    </Td>
                  </Tr>
                ) : (
                  filtered.map((row) => (
                    <Tr
                      key={row.id}
                      _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                      cursor="pointer"
                      onClick={() => row.usn && navigate(`/placement/students/${encodeURIComponent(row.usn)}`)}
                    >
                      <Td fontWeight="medium">{row.id}</Td>
                      <Td>
                        <Box>
                          <Text fontWeight="medium">{row.company_name}</Text>
                          <Text fontSize="xs" color="gray.500">{row.job_type} · {row.placement_status}</Text>
                        </Box>
                      </Td>
                      <Td fontWeight="bold" color="blue.600">{row.usn}</Td>
                      <Td>{row.student_name}</Td>
                      <Td>{formatBool(row.is_eligible)}</Td>
                      <Td>{formatStatus(row.registration_status)}</Td>
                      <Td>{formatStatus(row.approved_status)}</Td>
                      <Td>{formatBool(row.oa_status)}</Td>
                      <Td>{formatBool(row.gd_status)}</Td>
                      <Td>{formatBool(row.technical_round_status)}</Td>
                      <Td>{formatBool(row.interview_status)}</Td>
                      <Td>{formatBool(row.hr_round_status)}</Td>
                      <Td>
                        <Badge colorScheme={row.final_select_status ? 'green' : 'gray'}>
                          {formatBool(row.final_select_status)}
                        </Badge>
                      </Td>
                      <Td>{formatBool(row.malpractice)}</Td>
                      <Td maxW="120px" isTruncated title={row.remarks}>{row.remarks || '-'}</Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        {row.drive_id && (
                          <Button
                            size="xs"
                            colorScheme="teal"
                            variant="outline"
                            onClick={() => navigate(`/placement/events/${row.drive_id}/process`)}
                          >
                            Drive Process
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </AdminLayout>
  );
}
