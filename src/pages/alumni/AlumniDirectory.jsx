import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { buildPlacementNavState } from '../../utils/placementNavigationHistory';
import {
  Box,
  Text,
  Spinner,
  Flex,
  useToast,
  Button,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { FiSearch } from 'react-icons/fi';
import { PlacementService } from '../../services/placement.service';
import './AlumniDirectory.css';

const ALL = 'all';

function getBatch(a) {
  const v = a.batch_year ?? a.graduation_year;
  if (v == null || v === '') return null;
  return String(v);
}

function getSchool(a) {
  return (a.school_name || a.institution_name || '').trim() || null;
}

function getProgram(a) {
  return (a.program_name || '').trim() || null;
}

function getCompany(a) {
  return (a.current_company || '').trim() || null;
}

function getLocation(a) {
  return (a.current_work_location || '').trim() || null;
}

function hasPlacement(a) {
  return !!(getCompany(a) || (a.current_designation || '').trim());
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true })
  );
}

const INITIAL_FILTERS = {
  batch: ALL,
  school: ALL,
  company: ALL,
  sort: 'name_asc',
};

const AlumniDirectory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await PlacementService.getAllAlumni();
        setAlumni(Array.isArray(data) ? data : []);
      } catch {
        toast({ title: 'Error fetching alumni', status: 'error', duration: 3000, isClosable: true });
        setAlumni([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filterOptions = useMemo(
    () => ({
      batches: uniqueSorted(alumni.map(getBatch)),
      schools: uniqueSorted(alumni.map(getSchool)),
      companies: uniqueSorted(alumni.map(getCompany)),
    }),
    [alumni]
  );

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filters.batch !== ALL ||
    filters.school !== ALL ||
    filters.company !== ALL;

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchQuery('');
  };

  const filteredAlumni = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = alumni.filter((a) => {
      if (q) {
        const haystack = [
          a.full_name,
          a.usn,
          a.student_id,
          getCompany(a),
          a.current_designation,
          a.personal_email,
          getSchool(a),
          getProgram(a),
          getLocation(a),
          getBatch(a),
        ].map((v) => (v == null ? '' : String(v)).toLowerCase());
        if (!haystack.some((s) => s.includes(q))) return false;
      }
      if (filters.batch !== ALL && getBatch(a) !== filters.batch) return false;
      if (filters.school !== ALL && getSchool(a) !== filters.school) return false;
      if (filters.company !== ALL && getCompany(a) !== filters.company) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      switch (filters.sort) {
        case 'name_desc':
          return (b.full_name || '').localeCompare(a.full_name || '');
        case 'batch_desc': {
          const ba = Number(getBatch(a)) || 0;
          const bb = Number(getBatch(b)) || 0;
          return bb - ba || (a.full_name || '').localeCompare(b.full_name || '');
        }
        case 'batch_asc': {
          const ba = Number(getBatch(a)) || 0;
          const bb = Number(getBatch(b)) || 0;
          return ba - bb || (a.full_name || '').localeCompare(b.full_name || '');
        }
        default:
          return (a.full_name || '').localeCompare(b.full_name || '');
      }
    });
  }, [alumni, searchQuery, filters]);

  const linkId = (a) => a.student_id || a.usn || a.id;

  return (
    <div className="alumni-dir">
        <header className="alumni-dir__hero">
          <div>
            <h1 className="alumni-dir__title">Alumni Directory</h1>
            <p className="alumni-dir__subtitle">
              Search and filter by batch, school, or company.
            </p>
          </div>
          <p className="alumni-dir__hero-count">
            <strong>{alumni.length}</strong> alumni
          </p>
        </header>

        <div className="alumni-dir__toolbar">
          <label className="alumni-dir__field alumni-dir__field--search">
            <span className="alumni-dir__field-label">Search</span>
            <span className="alumni-dir__field-icon" aria-hidden>
              <FiSearch />
            </span>
            <input
              type="search"
              className="alumni-dir__input"
              placeholder="Search name, USN, company, role…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <label className="alumni-dir__field">
            <span className="alumni-dir__field-label">Batch</span>
            <select
              className="alumni-dir__select"
              value={filters.batch}
              onChange={(e) => setFilter('batch', e.target.value)}
            >
              <option value={ALL}>All batches</option>
              {filterOptions.batches.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label className="alumni-dir__field">
            <span className="alumni-dir__field-label">School</span>
            <select
              className="alumni-dir__select"
              value={filters.school}
              onChange={(e) => setFilter('school', e.target.value)}
            >
              <option value={ALL}>All schools</option>
              {filterOptions.schools.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="alumni-dir__field">
            <span className="alumni-dir__field-label">Company</span>
            <select
              className="alumni-dir__select"
              value={filters.company}
              onChange={(e) => setFilter('company', e.target.value)}
            >
              <option value={ALL}>All companies</option>
              {filterOptions.companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="alumni-dir__bar">
          <p className="alumni-dir__results">
            Showing <strong>{filteredAlumni.length}</strong> of {alumni.length}
          </p>
          <div className="alumni-dir__bar-actions">
            <div className="alumni-dir__sort" role="group" aria-label="Sort">
              <button
                type="button"
                className={`alumni-dir__sort-btn${filters.sort === 'name_asc' ? ' is-active' : ''}`}
                onClick={() => setFilter('sort', 'name_asc')}
              >
                A–Z
              </button>
              <button
                type="button"
                className={`alumni-dir__sort-btn${filters.sort === 'batch_desc' ? ' is-active' : ''}`}
                onClick={() => setFilter('sort', 'batch_desc')}
              >
                Batch
              </button>
            </div>
            {hasActiveFilters && (
              <button type="button" className="alumni-dir__clear" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <Flex justify="center" py={14}>
            <Spinner size="lg" color="#d4a960" thickness="3px" />
          </Flex>
        ) : filteredAlumni.length === 0 ? (
          <div className="alumni-dir__empty">
            <p className="alumni-dir__empty-title">No alumni found</p>
            <p className="alumni-dir__empty-text">Try a different search or clear your filters.</p>
            {hasActiveFilters && (
              <Button size="sm" mt={3} colorScheme="green" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} className="alumni-dir__grid">
            {filteredAlumni.map((a) => {
              const batch = getBatch(a);
              const school = getSchool(a);
              const program = getProgram(a);
              return (
                <Card
                  key={a.id ?? linkId(a)}
                  className="alumni-dir__card"
                  variant="outline"
                  onClick={() =>
                    navigate(`/placement/alumni-directory/${encodeURIComponent(String(linkId(a)))}`, {
                      state: buildPlacementNavState(location),
                    })
                  }
                >
                  <CardBody p={4}>
                    <Text className="alumni-dir__card-name" noOfLines={1}>
                      {a.full_name || '—'}
                    </Text>
                    {(a.student_id || a.usn) && (
                      <Text className="alumni-dir__card-meta">USN {a.usn || a.student_id}</Text>
                    )}
                    {(school || program) && (
                      <Text className="alumni-dir__card-meta" noOfLines={2}>
                        {[school, program].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                    {batch && <Text className="alumni-dir__card-meta">Batch {batch}</Text>}
                    {getCompany(a) && (
                      <Text className="alumni-dir__card-company" noOfLines={1}>
                        {getCompany(a)}
                      </Text>
                    )}
                    {a.current_designation && (
                      <Text className="alumni-dir__card-role" noOfLines={1}>
                        {a.current_designation}
                      </Text>
                    )}
                    <Flex className="alumni-dir__card-foot" align="center" justify="space-between" mt={3}>
                      <Flex gap={1} flexWrap="wrap">
                        {hasPlacement(a) && (
                          <Badge size="sm" colorScheme="green" variant="subtle">
                            Placed
                          </Badge>
                        )}
                      </Flex>
                      <span className="alumni-dir__card-link">
                        View <ChevronRightIcon boxSize={4} />
                      </span>
                    </Flex>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </div>
  );
};

export default AlumniDirectory;
