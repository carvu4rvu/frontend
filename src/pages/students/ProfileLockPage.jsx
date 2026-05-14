import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import { FaSearch, FaSync } from 'react-icons/fa';
import { PlacementService } from '../../services/placement.service';

const SECTION_FIELDS = [
  { key: 'is_basic_info_locked', label: 'Basic' },
  { key: 'is_contacts_locked', label: 'Contact' },
  { key: 'is_profile_details_locked', label: 'Profile' },
  { key: 'is_social_links_locked', label: 'Social' },
  { key: 'is_parent_details_locked', label: 'Parents' },
  { key: 'is_education_history_locked', label: 'Edu Hist' },
  { key: 'is_education_gaps_locked', label: 'Edu Gaps' },
  { key: 'is_course_academics_locked', label: 'Academics' },
  { key: 'is_extra_curricular_locked', label: 'Extra Curric' },
  { key: 'is_projects_locked', label: 'Projects' },
  { key: 'is_certifications_locked', label: 'Certs' },
  { key: 'is_internships_locked', label: 'Interns' },
  { key: 'is_trainings_locked', label: 'Trainings' },
  { key: 'is_other_experiences_locked', label: 'Other Exp' },
  { key: 'is_publications_locked', label: 'Publications' },
  { key: 'is_placements_locked', label: 'Placements' },
];

const SEM_FIELDS = [
  { key: 'is_sem1_locked', label: 'Sem 1' },
  { key: 'is_sem2_locked', label: 'Sem 2' },
  { key: 'is_sem3_locked', label: 'Sem 3' },
  { key: 'is_sem4_locked', label: 'Sem 4' },
  { key: 'is_sem5_locked', label: 'Sem 5' },
  { key: 'is_sem6_locked', label: 'Sem 6' },
  { key: 'is_sem7_locked', label: 'Sem 7' },
  { key: 'is_sem8_locked', label: 'Sem 8' },
];

export default function ProfileLockPage() {
  const toast = useToast();
  /** Database copy – only updated on load or when API save succeeds */
  const [rows, setRows] = useState([]);
  /** Display layer – key: `${usn}:${field}`, value: boolean. What user sees; updated on click, cleared on success/revert */
  const [localOverrides, setLocalOverrides] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingKey, setSavingKey] = useState(null); // `${usn}:${field}` for Reason input
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (r.usn || '').toLowerCase().includes(q) ||
        (r.full_name || '').toLowerCase().includes(q) ||
        (r.college_email || '').toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  const missingControlCount = useMemo(
    () => rows.filter((r) => r && (r.is_sem1_locked == null)).length,
    [rows]
  );

  /** Display value for a switch: local override if present, else DB copy */
  const getDisplayChecked = (usn, field, row) => {
    const key = `${usn}:${field}`;
    if (localOverrides[key] !== undefined) return !!localOverrides[key];
    return !!row[field];
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getStudentProfileLocks();
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setLocalOverrides({}); // clear overrides when we refresh from server
    } catch (e) {
      toast({
        title: 'Failed to load profile locks',
        description: e?.message || 'Could not load student edit control table.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await PlacementService.syncStudentProfileLocks();
      await load();
      toast({
        title: 'Synced',
        description: `Inserted ${result?.inserted ?? 0} missing student(s) into edit control.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (e) {
      toast({
        title: 'Sync failed',
        description: e?.message || 'Could not sync missing students.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  const updateLock = async (usn, field, nextVal) => {
    const key = `${usn}:${field}`;
    const isSwitch = field !== 'lock_reason';
    const payload = field === 'lock_reason' ? { [field]: nextVal } : { [field]: !!nextVal };

    if (isSwitch) {
      // Layer 1 – display: update immediately so DOM shows new toggle
      setLocalOverrides((prev) => ({ ...prev, [key]: !!nextVal }));
    } else {
      setSavingKey(key);
    }

    try {
      await PlacementService.updateStudentProfileLocks(usn, payload);
      // Success: update DB copy and clear override so display stays in sync
      setRows((prev) =>
        prev.map((r) => (r.usn === usn ? { ...r, [field]: isSwitch ? !!nextVal : nextVal } : r))
      );
      setLocalOverrides((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (isSwitch) {
        toast({ title: 'Saved', status: 'success', duration: 2000, isClosable: true });
      }
    } catch (e) {
      if (isSwitch) {
        setLocalOverrides((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
      toast({
        title: 'Update failed',
        description: e?.message || 'Could not update lock.',
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
        <Box>
          <Heading size="md" color="gray.800" mb={1}>
            Profile Lock
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Lock semester-wise editing for individual students. Locked semesters are view-only (no add/edit).
          </Text>
        </Box>

        <HStack spacing={3}>
          {missingControlCount > 0 && (
            <Text fontSize="sm" color="orange.600" fontWeight="semibold">
              {missingControlCount} missing control row(s)
            </Text>
          )}
          <Button
            leftIcon={<FaSync />}
            colorScheme="blue"
            variant="solid"
            onClick={handleSync}
            isLoading={syncing}
            loadingText="Syncing..."
          >
            Sync
          </Button>
        </HStack>
      </Flex>

      {!loading && rows.length > 0 && (
        <InputGroup maxW="400px" mb={4}>
          <InputLeftElement pointerEvents="none" color="gray.400">
            <FaSearch />
          </InputLeftElement>
          <Input
            placeholder="Search by USN, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="white"
            borderColor="gray.200"
          />
        </InputGroup>
      )}

      {loading ? (
        <Flex py={12} justify="center">
          <Spinner />
        </Flex>
      ) : (
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="auto">
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>USN</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th textAlign="center">Login Active</Th>
                {SECTION_FIELDS.map((s) => (
                  <Th key={s.key} textAlign="center">
                    {s.label}
                  </Th>
                ))}
                {SEM_FIELDS.map((s) => (
                  <Th key={s.key} textAlign="center">
                    {s.label}
                  </Th>
                ))}
                <Th>Locked By</Th>
                <Th minW="220px">Reason</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredRows.length === 0 ? (
                <Tr>
                  <Td colSpan={4 + SECTION_FIELDS.length + SEM_FIELDS.length + 2} py={8} textAlign="center" color="gray.500">
                    {rows.length === 0 ? 'No students found.' : 'No students match your search.'}
                  </Td>
                </Tr>
              ) : (
                filteredRows.map((r) => {
                  const hasControl = r.is_sem1_locked != null;
                  return (
                    <Tr key={r.usn}>
                      <Td fontWeight="semibold">{r.usn}</Td>
                      <Td>{r.full_name || '-'}</Td>
                      <Td>{r.college_email || '-'}</Td>
                      <Td textAlign="center">
                        <Switch
                          colorScheme="green"
                          isChecked={getDisplayChecked(r.usn, 'login_is_active', r)}
                          onChange={(e) => updateLock(r.usn, 'login_is_active', e.target.checked)}
                        />
                      </Td>
                      {SECTION_FIELDS.map((s) => (
                        <Td key={s.key} textAlign="center">
                          <Switch
                            colorScheme="red"
                            isChecked={getDisplayChecked(r.usn, s.key, r)}
                            isDisabled={!hasControl}
                            onChange={(e) => updateLock(r.usn, s.key, e.target.checked)}
                          />
                        </Td>
                      ))}
                      {SEM_FIELDS.map((s) => (
                        <Td key={s.key} textAlign="center">
                          <Switch
                            colorScheme="red"
                            isChecked={getDisplayChecked(r.usn, s.key, r)}
                            isDisabled={!hasControl}
                            onChange={(e) => updateLock(r.usn, s.key, e.target.checked)}
                          />
                        </Td>
                      ))}
                      <Td>{r.locked_by_name ?? r.locked_by ?? '-'}</Td>
                      <Td minW="220px">
                        <Input
                          size="xs"
                          defaultValue={r.lock_reason || ''}
                          isDisabled={savingKey === `${r.usn}:lock_reason`}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== (r.lock_reason || '')) {
                              updateLock(r.usn, 'lock_reason', val);
                            }
                          }}
                        />
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
