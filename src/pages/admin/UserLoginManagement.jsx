import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  HStack,
  VStack,
  Input,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Switch,
  Flex,
  useToast,
  Spinner,
  Checkbox,
  Tooltip,
  useBreakpointValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Icon,
  IconButton,
  Avatar,
} from '@chakra-ui/react';
import { SearchIcon, CheckIcon, CloseIcon, AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  FaBuilding,
  FaGraduationCap,
  FaKey,
  FaUser,
  FaUserGraduate,
  FaUsers,
  FaUserShield,
  FaUserSlash,
  FaUserTie,
} from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';
import './UserLoginManagement.css';
import { formatDateTimeIST } from '../../utils/dateTime';

const formatDate = (d) => formatDateTimeIST(d);
import { 
  getUserLoginList, 
  getStudentsWithoutLogin, 
  updateUserLoginIsActive, 
  bulkUpdateUserLoginIsActive,
  getCompanyLogins,
  createCompanyLogin,
  updateCompanyLoginPassword,
  deleteCompanyLogin,
  getVcLogins,
  createVcLogin,
  updateVcLoginPassword,
  deleteVcLogin,
} from '../../services/userLogin.service';

/** e.g. student → "Student login", admin → "Admin login" */
function formatRoleTabLabel(roleName) {
  const raw = (roleName || '').trim();
  if (!raw) return 'Login';
  const titled = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return `${titled} login`;
}

/** These roles use dedicated tabs (create/edit passwords) — skip duplicate role tabs */
const DEDICATED_TAB_ROLE_NAMES = new Set(['company', 'vc']);

function getRoleTabIcon(roleName) {
  const n = (roleName || '').trim().toLowerCase();
  if (n === 'admin' || n === 'superadmin') return FaUserShield;
  if (n === 'alumni') return FaGraduationCap;
  if (n === 'student') return FaUserGraduate;
  return FaUser;
}

function LoginTabLabel({ icon, children }) {
  return (
    <HStack spacing={2}>
      <Icon as={icon} boxSize={3} aria-hidden />
      <Text as="span">{children}</Text>
    </HStack>
  );
}

const UserLoginManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [updatingId, setUpdatingId] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Tab: Students without login
  const [studentsNoLogin, setStudentsNoLogin] = useState([]);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);
  const [noLoginTotal, setNoLoginTotal] = useState(0);
  const [noLoginPage, setNoLoginPage] = useState(1);
  const [noLoginLoading, setNoLoginLoading] = useState(false);
  const [noLoginSchool, setNoLoginSchool] = useState('all');
  const [noLoginProgram, setNoLoginProgram] = useState('all');
  const [noLoginYear, setNoLoginYear] = useState('all');
  const [noLoginSearch, setNoLoginSearch] = useState('');
  const [noLoginSearchDebounced, setNoLoginSearchDebounced] = useState('');

  // Tab: Company logins
  const [companyLogins, setCompanyLogins] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companiesWithLogins, setCompaniesWithLogins] = useState([]);
  const [companyTotal, setCompanyTotal] = useState(0);
  const [companyPage, setCompanyPage] = useState(1);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [companySearchDebounced, setCompanySearchDebounced] = useState('');
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [newCompanyLogin, setNewCompanyLogin] = useState({ company_id: '', email: '', password: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { isOpen: isCompanyPasswordOpen, onOpen: onCompanyPasswordOpen, onClose: onCompanyPasswordClose } = useDisclosure();
  const [editCompanyTarget, setEditCompanyTarget] = useState(null);
  const [editCompanyPassword, setEditCompanyPassword] = useState('');
  const [companyPasswordLoading, setCompanyPasswordLoading] = useState(false);

  // Tab: VC logins
  const [vcLogins, setVcLogins] = useState([]);
  const [vcTotal, setVcTotal] = useState(0);
  const [vcPage, setVcPage] = useState(1);
  const [vcLoading, setVcLoading] = useState(false);
  const [vcSearch, setVcSearch] = useState('');
  const [vcSearchDebounced, setVcSearchDebounced] = useState('');
  const { isOpen: isVcCreateOpen, onOpen: onVcCreateOpen, onClose: onVcCreateClose } = useDisclosure();
  const { isOpen: isVcDeleteOpen, onOpen: onVcDeleteOpen, onClose: onVcDeleteClose } = useDisclosure();
  const [newVcLogin, setNewVcLogin] = useState({ email: '', password: '' });
  const [vcCreateLoading, setVcCreateLoading] = useState(false);
  const [deleteVcTarget, setDeleteVcTarget] = useState(null);
  const [vcDeleteLoading, setVcDeleteLoading] = useState(false);
  const { isOpen: isVcPasswordOpen, onOpen: onVcPasswordOpen, onClose: onVcPasswordClose } = useDisclosure();
  const [editVcTarget, setEditVcTarget] = useState(null);
  const [editVcPassword, setEditVcPassword] = useState('');
  const [vcPasswordLoading, setVcPasswordLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (roleFilter !== 'all') params.role_id = roleFilter;
      if (activeFilter !== 'all') params.is_active = activeFilter;
      if (searchDebounced.trim()) params.search = searchDebounced.trim();
      const data = await getUserLoginList(params);
      setUsers(data.users || []);
      const nextRoles = data.roles || [];
      setRoles((prev) => {
        if (
          prev.length === nextRoles.length &&
          prev.every((r, i) => r.id === nextRoles[i]?.id && r.name === nextRoles[i]?.name)
        ) {
          return prev;
        }
        return nextRoles;
      });
      setTotal(data.total ?? 0);
    } catch (err) {
      toast({
        title: 'Failed to load users',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, roleFilter, activeFilter, searchDebounced]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, activeFilter, searchDebounced]);

  const fetchNoLogin = useCallback(async () => {
    setNoLoginLoading(true);
    try {
      const params = { page: noLoginPage, limit: 50 };
      if (noLoginSchool !== 'all') params.school_id = noLoginSchool;
      if (noLoginProgram !== 'all') params.program_id = noLoginProgram;
      if (noLoginYear !== 'all') params.year_of_joining = noLoginYear;
      if (noLoginSearchDebounced.trim()) params.search = noLoginSearchDebounced.trim();
      const data = await getStudentsWithoutLogin(params);
      setStudentsNoLogin(data.students || []);
      setNoLoginTotal(data.total ?? 0);
      if (data.schools) setSchools(data.schools);
      if (data.programs) setPrograms(data.programs);
      if (data.years) setYears(data.years);
    } catch (err) {
      toast({
        title: 'Failed to load students',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setStudentsNoLogin([]);
    } finally {
      setNoLoginLoading(false);
    }
  }, [noLoginPage, noLoginSchool, noLoginProgram, noLoginYear, noLoginSearchDebounced]);

  useEffect(() => {
    const t = setTimeout(() => setNoLoginSearchDebounced(noLoginSearch), 400);
    return () => clearTimeout(t);
  }, [noLoginSearch]);

  useEffect(() => {
    setNoLoginPage(1);
  }, [noLoginSchool, noLoginProgram, noLoginYear, noLoginSearchDebounced]);

  // Company logins
  const fetchCompanyLogins = useCallback(async () => {
    setCompanyLoading(true);
    try {
      const params = { page: companyPage, limit: 50 };
      if (companySearchDebounced.trim()) params.search = companySearchDebounced.trim();
      const data = await getCompanyLogins(params);
      setCompanyLogins(data.logins || []);
      setCompanies(data.companies || []);
      setCompaniesWithLogins(data.companiesWithLogins || []);
      setCompanyTotal(data.total ?? 0);
    } catch (err) {
      toast({
        title: 'Failed to load company logins',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setCompanyLogins([]);
    } finally {
      setCompanyLoading(false);
    }
  }, [companyPage, companySearchDebounced]);

  useEffect(() => {
    const t = setTimeout(() => setCompanySearchDebounced(companySearch), 400);
    return () => clearTimeout(t);
  }, [companySearch]);

  useEffect(() => {
    setCompanyPage(1);
  }, [companySearchDebounced]);

  // VC logins
  const fetchVcLogins = useCallback(async () => {
    setVcLoading(true);
    try {
      const params = { page: vcPage, limit: 50 };
      if (vcSearchDebounced.trim()) params.search = vcSearchDebounced.trim();
      const data = await getVcLogins(params);
      setVcLogins(data.logins || []);
      setVcTotal(data.total ?? 0);
    } catch (err) {
      toast({
        title: 'Failed to load VC logins',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setVcLogins([]);
    } finally {
      setVcLoading(false);
    }
  }, [vcPage, vcSearchDebounced]);

  useEffect(() => {
    const t = setTimeout(() => setVcSearchDebounced(vcSearch), 400);
    return () => clearTimeout(t);
  }, [vcSearch]);

  useEffect(() => {
    setVcPage(1);
  }, [vcSearchDebounced]);

  const [tabIndex, setTabIndex] = useState(0);

  const sortedRoles = useMemo(
    () => [...roles].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [roles]
  );

  const rolesForLoginTabs = useMemo(
    () =>
      sortedRoles.filter((r) => !DEDICATED_TAB_ROLE_NAMES.has((r.name || '').trim().toLowerCase())),
    [sortedRoles]
  );

  const tabKinds = useMemo(() => {
    const kinds = [{ type: 'all-users', key: 'all-users' }];
    rolesForLoginTabs.forEach((r) => {
      kinds.push({ type: 'role', key: `role-${r.id}`, roleId: r.id, roleName: r.name });
    });
    kinds.push({ type: 'no-login', key: 'no-login' });
    kinds.push({ type: 'company', key: 'company' });
    kinds.push({ type: 'vc', key: 'vc' });
    return kinds;
  }, [rolesForLoginTabs]);

  const safeTabIndex = tabKinds.length ? Math.min(tabIndex, tabKinds.length - 1) : 0;
  const activeTabKind = tabKinds[safeTabIndex];
  const activeTabType = activeTabKind?.type ?? null;
  const activeRoleId = activeTabKind?.type === 'role' ? activeTabKind.roleId : null;

  useEffect(() => {
    getUserLoginList({ page: 1, limit: 1 })
      .then((data) => {
        const nextRoles = data.roles || [];
        if (!nextRoles.length) return;
        setRoles((prev) => {
          if (
            prev.length === nextRoles.length &&
            prev.every((r, i) => r.id === nextRoles[i]?.id && r.name === nextRoles[i]?.name)
          ) {
            return prev;
          }
          return nextRoles;
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tabKinds.length > 0 && tabIndex >= tabKinds.length) {
      setTabIndex(0);
      setRoleFilter('all');
    }
  }, [tabKinds.length, tabIndex]);

  const handleTabChange = useCallback(
    (index) => {
      setTabIndex(index);
      setSelectedIds(new Set());
      const kind = tabKinds[index];
      if (!kind) return;
      if (kind.type === 'all-users') {
        setRoleFilter('all');
        setPage(1);
      } else if (kind.type === 'role') {
        setRoleFilter(String(kind.roleId));
        setPage(1);
      } else if (kind.type === 'no-login') {
        setNoLoginPage(1);
      } else if (kind.type === 'company') {
        setCompanyPage(1);
      } else if (kind.type === 'vc') {
        setVcPage(1);
      }
    },
    [tabKinds]
  );

  useEffect(() => {
    if (!activeTabType) return;
    if (activeTabType === 'all-users' || activeTabType === 'role') fetchUsers();
    else if (activeTabType === 'no-login') fetchNoLogin();
    else if (activeTabType === 'company') fetchCompanyLogins();
    else if (activeTabType === 'vc') fetchVcLogins();
  }, [activeTabType, activeRoleId, tabIndex, fetchUsers, fetchNoLogin, fetchCompanyLogins, fetchVcLogins]);

  const handleSingleToggle = async (id, currentActive) => {
    const next = !currentActive;
    setUpdatingId(id);
    try {
      await updateUserLoginIsActive(id, next);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: next } : u)));
      toast({
        title: next ? 'User activated' : 'User deactivated',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err?.message,
        status: 'error',
        isClosable: true,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulk = async (is_active) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      toast({ title: 'Select at least one user', status: 'warning', isClosable: true });
      return;
    }
    setBulkLoading(true);
    try {
      await bulkUpdateUserLoginIsActive(ids, is_active);
      setUsers((prev) => prev.map((u) => (ids.includes(u.id) ? { ...u, is_active } : u)));
      setSelectedIds(new Set());
      toast({
        title: `${ids.length} user(s) ${is_active ? 'activated' : 'deactivated'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Bulk update failed',
        description: err?.message,
        status: 'error',
        isClosable: true,
      });
    } finally {
      setBulkLoading(false);
    }
  };


  // Company login handlers
  const handleCreateCompanyLogin = async () => {
    if (!newCompanyLogin.company_id || !newCompanyLogin.email || !newCompanyLogin.password) {
      toast({ title: 'Please fill all fields', status: 'warning', isClosable: true });
      return;
    }
    if (newCompanyLogin.password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', status: 'warning', isClosable: true });
      return;
    }
    setCreateLoading(true);
    try {
      await createCompanyLogin(newCompanyLogin);
      toast({
        title: 'Company login created',
        description: 'The company can now log in with these credentials',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNewCompanyLogin({ company_id: '', email: '', password: '' });
      onCreateClose();
      fetchCompanyLogins();
    } catch (err) {
      toast({
        title: 'Failed to create login',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteCompanyLogin = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCompanyLogin(deleteTarget.id);
      toast({
        title: 'Company login deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      setDeleteTarget(null);
      fetchCompanyLogins();
    } catch (err) {
      toast({
        title: 'Failed to delete login',
        description: err?.message || 'Please try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateVcLogin = async () => {
    if (!newVcLogin.email?.trim() || !newVcLogin.password) {
      toast({ title: 'Email and password required', status: 'warning', isClosable: true });
      return;
    }
    if (newVcLogin.password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', status: 'warning', isClosable: true });
      return;
    }
    setVcCreateLoading(true);
    try {
      await createVcLogin({ email: newVcLogin.email.trim(), password: newVcLogin.password });
      toast({ title: 'VC login created', status: 'success', isClosable: true });
      onVcCreateClose();
      setNewVcLogin({ email: '', password: '' });
      fetchVcLogins();
    } catch (err) {
      toast({ title: 'Create failed', description: err?.message, status: 'error', isClosable: true });
    } finally {
      setVcCreateLoading(false);
    }
  };

  const handleDeleteVcLogin = async () => {
    if (!deleteVcTarget) return;
    setVcDeleteLoading(true);
    try {
      await deleteVcLogin(deleteVcTarget.id);
      toast({ title: 'VC login deleted', status: 'success', isClosable: true });
      onVcDeleteClose();
      setDeleteVcTarget(null);
      fetchVcLogins();
    } catch (err) {
      toast({ title: 'Delete failed', description: err?.message, status: 'error', isClosable: true });
    } finally {
      setVcDeleteLoading(false);
    }
  };

  const handleUpdateCompanyPassword = async () => {
    if (!editCompanyTarget || !editCompanyPassword || editCompanyPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', status: 'warning', isClosable: true });
      return;
    }
    setCompanyPasswordLoading(true);
    try {
      await updateCompanyLoginPassword(editCompanyTarget.id, editCompanyPassword);
      toast({ title: 'Company password updated', status: 'success', isClosable: true });
      onCompanyPasswordClose();
      setEditCompanyTarget(null);
      setEditCompanyPassword('');
      fetchCompanyLogins();
    } catch (err) {
      toast({ title: 'Update failed', description: err?.message, status: 'error', isClosable: true });
    } finally {
      setCompanyPasswordLoading(false);
    }
  };

  const handleUpdateVcPassword = async () => {
    if (!editVcTarget || !editVcPassword || editVcPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', status: 'warning', isClosable: true });
      return;
    }
    setVcPasswordLoading(true);
    try {
      await updateVcLoginPassword(editVcTarget.id, editVcPassword);
      toast({ title: 'VC password updated', status: 'success', isClosable: true });
      onVcPasswordClose();
      setEditVcTarget(null);
      setEditVcPassword('');
      fetchVcLogins();
    } catch (err) {
      toast({ title: 'Update failed', description: err?.message, status: 'error', isClosable: true });
    } finally {
      setVcPasswordLoading(false);
    }
  };

  const isSmall = useBreakpointValue({ base: true, md: false });

  // Filter companies that don't have logins yet
  const availableCompanies = companies.filter(c => !companiesWithLogins.includes(c.id));

  const statSummary = (() => {
    if (!activeTabKind) {
      return { primary: 0, primaryLabel: 'accounts', page: 1, pageSize: limit };
    }
    if (activeTabKind.type === 'no-login') {
      return { primary: noLoginTotal, primaryLabel: 'without login', page: noLoginPage, pageSize: 50 };
    }
    if (activeTabKind.type === 'company') {
      return { primary: companyTotal, primaryLabel: 'company logins', page: companyPage, pageSize: 50 };
    }
    if (activeTabKind.type === 'vc') {
      return { primary: vcTotal, primaryLabel: 'VC logins', page: vcPage, pageSize: 50 };
    }
    if (activeTabKind.type === 'role') {
      return {
        primary: total,
        primaryLabel: formatRoleTabLabel(activeTabKind.roleName).toLowerCase(),
        page,
        pageSize: limit,
      };
    }
    return { primary: total, primaryLabel: 'all users login', page, pageSize: limit };
  })();

  const renderUserLoginPanel = () => (
    <Box className="login-settings__panel">
      <Flex className="login-settings__toolbar">
        <div className="login-settings__search-wrap">
          <SearchIcon className="login-settings__search-icon" aria-hidden />
          <input
            type="search"
            className="login-settings__search-input"
            placeholder="Search by USN or login..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            aria-label="Search user logins"
          />
        </div>
        <Select
          size="sm"
          w="140px"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          bg="white"
          borderColor="gray.300"
        >
          <option value="all">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
        <HStack flex="1" justify="flex-end" flexWrap="wrap" gap={2}>
          {selectedIds.size > 0 && (
            <>
              <Tooltip label="Activate selected users">
                <Button
                  size="sm"
                  leftIcon={<CheckIcon />}
                  className="login-settings__btn-outline-green"
                  variant="outline"
                  onClick={() => handleBulk(true)}
                  isLoading={bulkLoading}
                >
                  Activate ({selectedIds.size})
                </Button>
              </Tooltip>
              <Tooltip label="Deactivate selected users">
                <Button
                  size="sm"
                  leftIcon={<CloseIcon />}
                  className="login-settings__btn-outline-red"
                  variant="outline"
                  onClick={() => handleBulk(false)}
                  isLoading={bulkLoading}
                >
                  Deactivate ({selectedIds.size})
                </Button>
              </Tooltip>
            </>
          )}
        </HStack>
      </Flex>

      <TableContainer className="login-settings__table-wrap" overflowX="auto">
        {loading ? (
          <Flex className="login-settings__loading" justify="center" py={12}>
            <Spinner size="lg" color="gray.400" />
          </Flex>
        ) : (
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th w="40px" textAlign="center">
                  <Checkbox
                    isChecked={users.length > 0 && selectedIds.size === users.length}
                    isIndeterminate={selectedIds.size > 0 && selectedIds.size < users.length}
                    onChange={toggleSelectAll}
                    colorScheme="yellow"
                    borderColor="whiteAlpha.600"
                  />
                </Th>
                <Th fontSize="xs" textTransform="none">ID</Th>
                <Th fontSize="xs" textTransform="none">USN</Th>
                <Th fontSize="xs" textTransform="none">Email</Th>
                <Th fontSize="xs" textTransform="none">Role</Th>
                <Th fontSize="xs" textTransform="none" textAlign="center">Status</Th>
                {!isSmall && (
                  <>
                    <Th fontSize="xs" textTransform="none">Last login</Th>
                    <Th fontSize="xs" textTransform="none" textAlign="center">Failed logins</Th>
                  </>
                )}
              </Tr>
            </Thead>
            <Tbody>
              {users.map((u) => (
                <Tr key={u.id} borderBottom="1px" borderColor="gray.100">
                  <Td borderColor="gray.100" textAlign="center">
                    <Checkbox
                      isChecked={selectedIds.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      colorScheme="blue"
                    />
                  </Td>
                  <Td borderColor="gray.100" fontSize="sm" fontFamily="mono">{u.id}</Td>
                  <Td
                    borderColor="gray.100"
                    fontSize="sm"
                    className={u.usn ? 'login-settings__usn-link' : undefined}
                    onClick={u.usn ? () => navigate(`/placement/students/${encodeURIComponent(u.usn)}`) : undefined}
                  >
                    {u.usn || '—'}
                  </Td>
                  <Td borderColor="gray.100" fontSize="sm" noOfLines={1} maxW="200px">{u.email_id || '—'}</Td>
                  <Td borderColor="gray.100">
                    <span className="login-settings__role-badge">{u.role_name || '—'}</span>
                  </Td>
                  <Td borderColor="gray.100" textAlign="center">
                    <Switch
                      size="sm"
                      isChecked={!!u.is_active}
                      onChange={() => handleSingleToggle(u.id, u.is_active)}
                      isDisabled={updatingId === u.id}
                      colorScheme="green"
                    />
                    {updatingId === u.id && <Spinner size="xs" ml={2} />}
                  </Td>
                  {!isSmall && (
                    <>
                      <Td borderColor="gray.100" fontSize="xs" color="gray.600">{formatDate(u.last_login_at)}</Td>
                      <Td borderColor="gray.100" textAlign="center" fontSize="sm">{u.failed_login_attempts ?? 0}</Td>
                    </>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </TableContainer>

      {!loading && users.length === 0 && (
        <Flex className="login-settings__empty">No users match the current filters.</Flex>
      )}

      {!loading && total > 0 && (
        <Flex className="login-settings__footer">
          <Text className="login-settings__footer-text">
            Showing {users.length} of {total} user(s)
            {total > limit && ` (page ${page})`}
          </Text>
          <HStack spacing={2}>
            <Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button size="sm" variant="outline" isDisabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </Box>
  );

  return (
    <AdminLayout fullWidth>
      <div className="login-settings">
        <div className="login-settings__inner">
          <header className="login-settings__hero">
            <div className="login-settings__hero-inner">
              <div className="login-settings__hero-icon" aria-hidden>
                <FaKey />
              </div>
              <div>
                <h1 className="login-settings__hero-title">Login Settings</h1>
                <p className="login-settings__hero-subtitle">
                  Manage user accounts, students without login, company portal access, and VC credentials.
                </p>
              </div>
            </div>
          </header>

          <div className="login-settings__stats" aria-label="Summary">
            <span className="login-settings__stat-pill">
              <strong>{statSummary.primary.toLocaleString()}</strong> {statSummary.primaryLabel}
            </span>
            {statSummary.primary > statSummary.pageSize && (
              <span className="login-settings__stat-pill login-settings__stat-pill--muted">
                Page {statSummary.page}
              </span>
            )}
          </div>

          <Tabs isLazy index={safeTabIndex} onChange={handleTabChange} variant="unstyled" className="login-settings__tabs">
            <TabList className="login-settings__tab-list">
              {tabKinds.map((kind) => {
                if (kind.type === 'all-users') {
                  return (
                    <Tab key={kind.key} className="login-settings__tab">
                      <LoginTabLabel icon={FaUsers}>All users login</LoginTabLabel>
                    </Tab>
                  );
                }
                if (kind.type === 'role') {
                  return (
                    <Tab key={kind.key} className="login-settings__tab">
                      <LoginTabLabel icon={getRoleTabIcon(kind.roleName)}>
                        {formatRoleTabLabel(kind.roleName)}
                      </LoginTabLabel>
                    </Tab>
                  );
                }
                if (kind.type === 'no-login') {
                  return (
                    <Tab key={kind.key} className="login-settings__tab">
                      <LoginTabLabel icon={FaUserSlash}>Students without login</LoginTabLabel>
                    </Tab>
                  );
                }
                if (kind.type === 'company') {
                  return (
                    <Tab key={kind.key} className="login-settings__tab">
                      <LoginTabLabel icon={FaBuilding}>Company logins</LoginTabLabel>
                    </Tab>
                  );
                }
                return (
                  <Tab key={kind.key} className="login-settings__tab">
                    <LoginTabLabel icon={FaUserTie}>VC Management</LoginTabLabel>
                  </Tab>
                );
              })}
            </TabList>

            <TabPanels className="login-settings__tab-panels">
              {tabKinds.map((kind) => {
                if (kind.type === 'all-users' || kind.type === 'role') {
                  return (
                    <TabPanel key={kind.key} p={0}>
                      {renderUserLoginPanel()}
                    </TabPanel>
                  );
                }
                if (kind.type === 'no-login') {
                  return (
                    <TabPanel key={kind.key} p={0}>
                      
                                      <Box className="login-settings__panel">
                                        <Flex className="login-settings__toolbar">
                                          <div className="login-settings__search-wrap">
                                            <SearchIcon className="login-settings__search-icon" aria-hidden />
                                            <input
                                              type="search"
                                              className="login-settings__search-input"
                                              placeholder="Search by USN, name or email..."
                                              value={noLoginSearch}
                                              onChange={(e) => setNoLoginSearch(e.target.value)}
                                              autoComplete="off"
                                              aria-label="Search students without login"
                                            />
                                          </div>
                                          <Select
                                            size="sm"
                                            w="180px"
                                            value={noLoginSchool}
                                            onChange={(e) => setNoLoginSchool(e.target.value)}
                                            bg="white"
                                            borderColor="gray.300"
                                          >
                                            <option value="all">All schools</option>
                                            {schools.map((s) => (
                                              <option key={s.id} value={s.id}>
                                                {s.name}
                                              </option>
                                            ))}
                                          </Select>
                                          <Select
                                            size="sm"
                                            w="180px"
                                            value={noLoginProgram}
                                            onChange={(e) => setNoLoginProgram(e.target.value)}
                                            bg="white"
                                            borderColor="gray.300"
                                          >
                                            <option value="all">All programs</option>
                                            {programs.map((p) => (
                                              <option key={p.id} value={p.id}>
                                                {p.name}
                                              </option>
                                            ))}
                                          </Select>
                                          <Select
                                            size="sm"
                                            w="120px"
                                            value={noLoginYear}
                                            onChange={(e) => setNoLoginYear(e.target.value)}
                                            bg="white"
                                            borderColor="gray.300"
                                          >
                                            <option value="all">All years</option>
                                            {years.map((y) => (
                                              <option key={y} value={y}>
                                                {y}
                                              </option>
                                            ))}
                                          </Select>
                                        </Flex>
                      
                                        <TableContainer className="login-settings__table-wrap" overflowX="auto">
                                          {noLoginLoading ? (
                                            <Flex className="login-settings__loading" justify="center" py={12}>
                                              <Spinner size="lg" color="gray.400" />
                                            </Flex>
                                          ) : (
                                            <Table size="sm" variant="simple">
                                              <Thead>
                                                <Tr>
                                                  <Th fontSize="xs" textTransform="none">USN</Th>
                                                  <Th fontSize="xs" textTransform="none">Name</Th>
                                                  <Th fontSize="xs" textTransform="none">College email</Th>
                                                  <Th fontSize="xs" textTransform="none">School</Th>
                                                  <Th fontSize="xs" textTransform="none">Program</Th>
                                                  <Th fontSize="xs" textTransform="none">Year of joining</Th>
                                                </Tr>
                                              </Thead>
                                              <Tbody>
                                                {studentsNoLogin.map((s) => (
                                                  <Tr
                                                    key={s.usn}
                                                    _hover={{ cursor: 'pointer' }}
                                                    cursor="pointer"
                                                    onClick={() => s.usn && navigate(`/placement/students/${encodeURIComponent(s.usn)}`)}
                                                    borderBottom="1px"
                                                    borderColor="gray.100"
                                                  >
                                                    <Td borderColor="gray.100" fontSize="sm" fontWeight="medium" fontFamily="mono">{s.usn}</Td>
                                                    <Td borderColor="gray.100" fontSize="sm">{s.full_name || '—'}</Td>
                                                    <Td borderColor="gray.100" fontSize="sm" noOfLines={1} maxW="220px">{s.college_email || '—'}</Td>
                                                    <Td borderColor="gray.100" fontSize="sm">{s.school_name || '—'}</Td>
                                                    <Td borderColor="gray.100" fontSize="sm">{s.program_name || '—'}</Td>
                                                    <Td borderColor="gray.100" fontSize="sm">{s.year_of_joining ?? '—'}</Td>
                                                  </Tr>
                                                ))}
                                              </Tbody>
                                            </Table>
                                          )}
                                        </TableContainer>
                      
                                        {!noLoginLoading && studentsNoLogin.length === 0 && (
                                          <Flex className="login-settings__empty">
                                            No students without login match the current filters.
                                          </Flex>
                                        )}
                      
                                        {!noLoginLoading && noLoginTotal > 0 && (
                                          <Flex className="login-settings__footer">
                                            <Text className="login-settings__footer-text">
                                              Showing {studentsNoLogin.length} of {noLoginTotal} student(s)
                                              {noLoginTotal > 50 && ` (page ${noLoginPage})`}
                                            </Text>
                                            <HStack spacing={2}>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                isDisabled={noLoginPage <= 1}
                                                onClick={() => setNoLoginPage((p) => Math.max(1, p - 1))}
                                              >
                                                Previous
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                isDisabled={noLoginPage * 50 >= noLoginTotal}
                                                onClick={() => setNoLoginPage((p) => p + 1)}
                                              >
                                                Next
                                              </Button>
                                            </HStack>
                                          </Flex>
                                        )}
                                      </Box>
                                    </TabPanel>
                  );
                }
                if (kind.type === 'company') {
                  return (
                    <TabPanel key={kind.key} p={0}>
                      
                                      <Box className="login-settings__panel">
                                        <Flex className="login-settings__toolbar">
                                          <div className="login-settings__search-wrap">
                                            <SearchIcon className="login-settings__search-icon" aria-hidden />
                                            <input
                                              type="search"
                                              className="login-settings__search-input"
                                              placeholder="Search by email or company..."
                                              value={companySearch}
                                              onChange={(e) => setCompanySearch(e.target.value)}
                                              autoComplete="off"
                                              aria-label="Search company logins"
                                            />
                                          </div>
                                          <HStack flex="1" justify="flex-end">
                                            <Button
                                              size="sm"
                                              leftIcon={<AddIcon />}
                                              className="login-settings__btn-primary"
                                              onClick={onCreateOpen}
                                            >
                                              Create Company Login
                                            </Button>
                                          </HStack>
                                        </Flex>
                      
                                        {/* Company Logins Table */}
                                        <TableContainer className="login-settings__table-wrap" overflowX="auto">
                                          {companyLoading ? (
                                            <Flex className="login-settings__loading" justify="center" py={12}>
                                              <Spinner size="lg" color="gray.400" />
                                            </Flex>
                                          ) : (
                                            <Table size="sm" variant="simple">
                                              <Thead>
                                                <Tr>
                                                  <Th fontSize="xs" textTransform="none">Company</Th>
                                                  <Th fontSize="xs" textTransform="none">Email</Th>
                                                  <Th fontSize="xs" textTransform="none">Status</Th>
                                                  <Th fontSize="xs" textTransform="none">Last Login</Th>
                                                  <Th fontSize="xs" textTransform="none">Created</Th>
                                                  <Th fontSize="xs" textTransform="none" textAlign="center">Actions</Th>
                                                </Tr>
                                              </Thead>
                                              <Tbody>
                                                {companyLogins.map((login) => (
                                                  <Tr
                                                    key={login.id}
                                                    borderBottom="1px"
                                                    borderColor="gray.100"
                                                  >
                                                    <Td borderColor="gray.100">
                                                      <HStack spacing={3}>
                                                        <Avatar
                                                          size="sm"
                                                          name={login.company_name || 'Company'}
                                                          bg="#172e36"
                                                          color="white"
                                                        />
                                                        <VStack align="start" spacing={0}>
                                                          <Text fontSize="sm" fontWeight="medium">{login.company_name || '—'}</Text>
                                                          {login.company_type && (
                                                            <Text fontSize="xs" color="gray.500">{login.company_type}</Text>
                                                          )}
                                                        </VStack>
                                                      </HStack>
                                                    </Td>
                                                    <Td borderColor="gray.100" fontSize="sm">{login.email_id}</Td>
                                                    <Td borderColor="gray.100">
                                                      <Badge
                                                        fontSize="xs"
                                                        className={login.is_active ? 'login-settings__status-badge--active' : 'login-settings__status-badge--inactive'}
                                                      >
                                                        {login.is_active ? 'Active' : 'Inactive'}
                                                      </Badge>
                                                    </Td>
                                                    <Td borderColor="gray.100" fontSize="xs" color="gray.600">
                                                      {formatDate(login.last_login_at)}
                                                    </Td>
                                                    <Td borderColor="gray.100" fontSize="xs" color="gray.600">
                                                      {formatDate(login.created_at)}
                                                    </Td>
                                                    <Td borderColor="gray.100" textAlign="center">
                                                      <HStack spacing={1} justify="center">
                                                        <Tooltip label="Edit password">
                                                          <IconButton
                                                            aria-label="Edit password"
                                                            icon={<EditIcon />}
                                                            size="sm"
                                                            colorScheme="blue"
                                                            variant="ghost"
                                                            onClick={() => {
                                                              setEditCompanyTarget(login);
                                                              setEditCompanyPassword('');
                                                              onCompanyPasswordOpen();
                                                            }}
                                                          />
                                                        </Tooltip>
                                                        <Tooltip label="Delete company login">
                                                          <IconButton
                                                            aria-label="Delete"
                                                            icon={<DeleteIcon />}
                                                            size="sm"
                                                            colorScheme="red"
                                                            variant="ghost"
                                                            onClick={() => {
                                                              setDeleteTarget(login);
                                                              onDeleteOpen();
                                                            }}
                                                          />
                                                        </Tooltip>
                                                      </HStack>
                                                    </Td>
                                                  </Tr>
                                                ))}
                                              </Tbody>
                                            </Table>
                                          )}
                                        </TableContainer>
                      
                                        {!companyLoading && companyLogins.length === 0 && (
                                          <Flex className="login-settings__empty" direction="column">
                                            <Icon as={FaBuilding} className="login-settings__empty-icon" boxSize={12} />
                                            <Text className="login-settings__empty-title">No company logins yet</Text>
                                            <Text className="login-settings__empty-hint">Create login credentials for companies to access the portal</Text>
                                            <Button
                                              size="sm"
                                              leftIcon={<AddIcon />}
                                              className="login-settings__btn-primary"
                                              onClick={onCreateOpen}
                                            >
                                              Create Company Login
                                            </Button>
                                          </Flex>
                                        )}
                      
                                        {!companyLoading && companyTotal > 0 && (
                                          <Flex className="login-settings__footer">
                                            <Text className="login-settings__footer-text">
                                              Showing {companyLogins.length} of {companyTotal} company login(s)
                                              {companyTotal > 50 && ` (page ${companyPage})`}
                                            </Text>
                                            <HStack spacing={2}>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                isDisabled={companyPage <= 1}
                                                onClick={() => setCompanyPage((p) => Math.max(1, p - 1))}
                                              >
                                                Previous
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                isDisabled={companyPage * 50 >= companyTotal}
                                                onClick={() => setCompanyPage((p) => p + 1)}
                                              >
                                                Next
                                              </Button>
                                            </HStack>
                                          </Flex>
                                        )}
                                      </Box>
                                    </TabPanel>
                  );
                }
                if (kind.type === 'vc') {
                  return (
                    <TabPanel key={kind.key} p={0}>
                      
                                      <Box className="login-settings__panel">
                                        <Flex className="login-settings__toolbar">
                                          <div className="login-settings__search-wrap">
                                            <SearchIcon className="login-settings__search-icon" aria-hidden />
                                            <input
                                              type="search"
                                              className="login-settings__search-input"
                                              placeholder="Search by email..."
                                              value={vcSearch}
                                              onChange={(e) => setVcSearch(e.target.value)}
                                              autoComplete="off"
                                              aria-label="Search VC logins"
                                            />
                                          </div>
                                          <HStack flex="1" justify="flex-end">
                                            <Button
                                              size="sm"
                                              leftIcon={<AddIcon />}
                                              className="login-settings__btn-primary"
                                              onClick={onVcCreateOpen}
                                            >
                                              Create VC Login
                                            </Button>
                                          </HStack>
                                        </Flex>
                      
                                        <TableContainer className="login-settings__table-wrap" overflowX="auto">
                                          {vcLoading ? (
                                            <Flex className="login-settings__loading" justify="center" py={12}>
                                              <Spinner size="lg" color="gray.400" />
                                            </Flex>
                                          ) : (
                                            <Table size="sm" variant="simple">
                                              <Thead>
                                                <Tr>
                                                  <Th fontSize="xs" textTransform="none">Email</Th>
                                                  <Th fontSize="xs" textTransform="none">Status</Th>
                                                  <Th fontSize="xs" textTransform="none">Last Login</Th>
                                                  <Th fontSize="xs" textTransform="none">Created</Th>
                                                  <Th fontSize="xs" textTransform="none" textAlign="center">Actions</Th>
                                                </Tr>
                                              </Thead>
                                              <Tbody>
                                                {vcLogins.map((login) => (
                                                  <Tr
                                                    key={login.id}
                                                    borderBottom="1px"
                                                    borderColor="gray.100"
                                                  >
                                                    <Td borderColor="gray.100">
                                                      <HStack spacing={3}>
                                                        <Avatar
                                                          size="sm"
                                                          name={login.email_id}
                                                          bg="#172e36"
                                                          color="white"
                                                        />
                                                        <Text fontSize="sm" fontWeight="medium">{login.email_id}</Text>
                                                      </HStack>
                                                    </Td>
                                                    <Td borderColor="gray.100">
                                                      <Badge
                                                        fontSize="xs"
                                                        className={login.is_active ? 'login-settings__status-badge--active' : 'login-settings__status-badge--inactive'}
                                                      >
                                                        {login.is_active ? 'Active' : 'Inactive'}
                                                      </Badge>
                                                    </Td>
                                                    <Td borderColor="gray.100" fontSize="xs" color="gray.600">
                                                      {formatDate(login.last_login_at)}
                                                    </Td>
                                                    <Td borderColor="gray.100" fontSize="xs" color="gray.600">
                                                      {formatDate(login.created_at)}
                                                    </Td>
                                                    <Td borderColor="gray.100" textAlign="center">
                                                      <HStack spacing={1} justify="center">
                                                        <Tooltip label="Edit password">
                                                          <IconButton
                                                            aria-label="Edit password"
                                                            icon={<EditIcon />}
                                                            size="sm"
                                                            colorScheme="blue"
                                                            variant="ghost"
                                                            onClick={() => {
                                                              setEditVcTarget(login);
                                                              setEditVcPassword('');
                                                              onVcPasswordOpen();
                                                            }}
                                                          />
                                                        </Tooltip>
                                                        <Tooltip label="Delete VC login">
                                                          <IconButton
                                                            aria-label="Delete"
                                                            icon={<DeleteIcon />}
                                                            size="sm"
                                                            colorScheme="red"
                                                            variant="ghost"
                                                            onClick={() => {
                                                              setDeleteVcTarget(login);
                                                              onVcDeleteOpen();
                                                            }}
                                                          />
                                                        </Tooltip>
                                                      </HStack>
                                                    </Td>
                                                  </Tr>
                                                ))}
                                              </Tbody>
                                            </Table>
                                          )}
                                        </TableContainer>
                      
                                        {!vcLoading && vcLogins.length === 0 && (
                                          <Flex className="login-settings__empty" direction="column">
                                            <Icon as={FaUserTie} className="login-settings__empty-icon" boxSize={12} />
                                            <Text className="login-settings__empty-title">No VC logins yet</Text>
                                            <Text className="login-settings__empty-hint">Create login credentials for Vice Chancellor / VC users</Text>
                                            <Button
                                              size="sm"
                                              leftIcon={<AddIcon />}
                                              className="login-settings__btn-primary"
                                              onClick={onVcCreateOpen}
                                            >
                                              Create VC Login
                                            </Button>
                                          </Flex>
                                        )}
                      
                                        {!vcLoading && vcTotal > 0 && (
                                          <Flex className="login-settings__footer">
                                            <Text className="login-settings__footer-text">
                                              Showing {vcLogins.length} of {vcTotal} VC login(s)
                                              {vcTotal > 50 && ` (page ${vcPage})`}
                                            </Text>
                                            <HStack spacing={2}>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                isDisabled={vcPage <= 1}
                                                onClick={() => setVcPage((p) => Math.max(1, p - 1))}
                                              >
                                                Previous
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                isDisabled={vcPage * 50 >= vcTotal}
                                                onClick={() => setVcPage((p) => p + 1)}
                                              >
                                                Next
                                              </Button>
                                            </HStack>
                                          </Flex>
                                        )}
                                      </Box>
                                    </TabPanel>
                  );
                }
                return null;
              })}
            </TabPanels>
          </Tabs>
        </div>
      </div>

      {/* Create Company Login Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="md">
        <ModalOverlay />
        <ModalContent className="login-settings__modal-content">
          <ModalHeader>
            <HStack spacing={3}>
              <Flex
                w="40px"
                h="40px"
                bg="#f8f3e8"
                borderRadius="lg"
                align="center"
                justify="center"
              >
                <Icon as={FaKey} color="#d4a960" />
              </Flex>
              <Box>
                <Text fontWeight="bold">Create Company Login</Text>
                <Text fontSize="sm" fontWeight="normal" color="gray.500">
                  Generate credentials for a company
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">Select Company</FormLabel>
                <Select
                  placeholder="Choose a company..."
                  value={newCompanyLogin.company_id}
                  onChange={(e) => setNewCompanyLogin(prev => ({ ...prev, company_id: e.target.value }))}
                >
                  {availableCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </Select>
                {availableCompanies.length === 0 && (
                  <Text fontSize="xs" color="orange.500" mt={1}>
                    All companies already have logins, or no companies exist yet.
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">Login Email</FormLabel>
                <Input
                  type="email"
                  placeholder="company@example.com"
                  value={newCompanyLogin.email}
                  onChange={(e) => setNewCompanyLogin(prev => ({ ...prev, email: e.target.value }))}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newCompanyLogin.password}
                  onChange={(e) => setNewCompanyLogin(prev => ({ ...prev, password: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button
              className="login-settings__btn-primary"
              onClick={handleCreateCompanyLogin}
              isLoading={createLoading}
              isDisabled={!newCompanyLogin.company_id || !newCompanyLogin.email || !newCompanyLogin.password}
            >
              Create Login
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalOverlay />
        <ModalContent className="login-settings__modal-content">
          <ModalHeader>Delete Company Login</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete the login for{' '}
              <Text as="span" fontWeight="bold">{deleteTarget?.company_name}</Text>?
            </Text>
            <Text fontSize="sm" color="gray.500" mt={2}>
              This action cannot be undone. The company will no longer be able to log in.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteCompanyLogin}
              isLoading={deleteLoading}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Company Password Modal */}
      <Modal
        isOpen={isCompanyPasswordOpen}
        onClose={() => {
          onCompanyPasswordClose();
          setEditCompanyTarget(null);
          setEditCompanyPassword('');
        }}
        size="md"
      >
        <ModalOverlay />
        <ModalContent className="login-settings__modal-content">
          <ModalHeader>Edit Company Login Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {editCompanyTarget && (
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  Set a new password for <Text as="span" fontWeight="bold">{editCompanyTarget.company_name}</Text> ({editCompanyTarget.email_id})
                </Text>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium">New password</FormLabel>
                  <Input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={editCompanyPassword}
                    onChange={(e) => setEditCompanyPassword(e.target.value)}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCompanyPasswordClose}>
              Cancel
            </Button>
            <Button
              className="login-settings__btn-primary"
              onClick={handleUpdateCompanyPassword}
              isLoading={companyPasswordLoading}
              isDisabled={!editCompanyPassword || editCompanyPassword.length < 6}
            >
              Update password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create VC Login Modal */}
      <Modal isOpen={isVcCreateOpen} onClose={onVcCreateClose} size="md">
        <ModalOverlay />
        <ModalContent className="login-settings__modal-content">
          <ModalHeader>
            <HStack spacing={3}>
              <Flex
                w="40px"
                h="40px"
                bg="#f8f3e8"
                borderRadius="lg"
                align="center"
                justify="center"
              >
                <Icon as={FaUserTie} color="#d4a960" />
              </Flex>
              <Box>
                <Text fontWeight="bold">Create VC Login</Text>
                <Text fontSize="sm" fontWeight="normal" color="gray.500">
                  Add credentials for a Vice Chancellor / VC user
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">Email</FormLabel>
                <Input
                  type="email"
                  placeholder="vc@example.edu.in"
                  value={newVcLogin.email}
                  onChange={(e) => setNewVcLogin(prev => ({ ...prev, email: e.target.value }))}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newVcLogin.password}
                  onChange={(e) => setNewVcLogin(prev => ({ ...prev, password: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onVcCreateClose}>
              Cancel
            </Button>
            <Button
              className="login-settings__btn-primary"
              onClick={handleCreateVcLogin}
              isLoading={vcCreateLoading}
              isDisabled={!newVcLogin.email?.trim() || !newVcLogin.password}
            >
              Create VC Login
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit VC Password Modal */}
      <Modal
        isOpen={isVcPasswordOpen}
        onClose={() => {
          onVcPasswordClose();
          setEditVcTarget(null);
          setEditVcPassword('');
        }}
        size="md"
      >
        <ModalOverlay />
        <ModalContent className="login-settings__modal-content">
          <ModalHeader>Edit VC Login Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {editVcTarget && (
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  Set a new password for <Text as="span" fontWeight="bold">{editVcTarget.email_id}</Text>
                </Text>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium">New password</FormLabel>
                  <Input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={editVcPassword}
                    onChange={(e) => setEditVcPassword(e.target.value)}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onVcPasswordClose}>
              Cancel
            </Button>
            <Button
              className="login-settings__btn-primary"
              onClick={handleUpdateVcPassword}
              isLoading={vcPasswordLoading}
              isDisabled={!editVcPassword || editVcPassword.length < 6}
            >
              Update password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete VC Login Modal */}
      <Modal isOpen={isVcDeleteOpen} onClose={onVcDeleteClose} size="sm">
        <ModalOverlay />
        <ModalContent className="login-settings__modal-content">
          <ModalHeader>Delete VC Login</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete the VC login for{' '}
              <Text as="span" fontWeight="bold">{deleteVcTarget?.email_id}</Text>?
            </Text>
            <Text fontSize="sm" color="gray.500" mt={2}>
              This action cannot be undone. The user will no longer be able to log in as VC.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onVcDeleteClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteVcLogin}
              isLoading={vcDeleteLoading}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
};

export default UserLoginManagement;
