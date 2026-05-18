import React, { memo, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Box,
  Flex,
  Spinner,
  Text,
  Checkbox,
  Badge,
  Avatar,
  Skeleton,
} from '@chakra-ui/react';

const ROW_HEIGHT = 48;
const MIN_TABLE_WIDTH = 1680;

const cellEllipsis = {
  minW: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function HeaderCell({ children, ...rest }) {
  return (
    <Box
      px={2}
      py={2.5}
      fontSize="10px"
      fontWeight="700"
      color="gray.600"
      textTransform="uppercase"
      letterSpacing="wider"
      borderBottomWidth="1px"
      borderColor="gray.200"
      bg="gray.50"
      {...cellEllipsis}
      {...rest}
    >
      {children}
    </Box>
  );
}

function BodyCell({ children, ...rest }) {
  return (
    <Box px={2} py={1} display="flex" alignItems="center" minH={`${ROW_HEIGHT}px`} {...cellEllipsis} {...rest}>
      {children}
    </Box>
  );
}

function StudentRow({
  student,
  driveId,
  isSelected,
  isDisabled,
  onToggleSelect,
  gridTemplateColumns,
}) {
  return (
    <Box
      display="grid"
      gridTemplateColumns={gridTemplateColumns}
      alignItems="center"
      h={`${ROW_HEIGHT}px`}
      borderBottomWidth="1px"
      borderColor="gray.100"
      bg={isDisabled ? 'gray.50' : 'white'}
      _hover={{ bg: isDisabled ? 'gray.100' : 'gray.50' }}
    >
      <BodyCell>
        <Checkbox
          isChecked={isSelected}
          onChange={() => onToggleSelect(student.usn)}
          isDisabled={isDisabled}
        />
      </BodyCell>
      <BodyCell>
        <Flex align="center" minW={0}>
          <Avatar size="xs" name={student.name} mr={2} flexShrink={0} />
          <Text fontWeight="600" color="gray.700" fontSize="sm" title={student.name} {...cellEllipsis}>
            {student.name}
          </Text>
        </Flex>
      </BodyCell>
      <BodyCell>
        <Badge colorScheme="blue" fontSize="xs" variant="subtle" maxW="100%">
          {student.usn}
        </Badge>
      </BodyCell>
      <BodyCell fontSize="sm" color="gray.600">
        {student.year_of_joining ?? '-'}
      </BodyCell>
      <BodyCell fontSize="sm" color="gray.600">
        {student.graduation_year ?? '-'}
      </BodyCell>
      <BodyCell fontSize="sm" color="gray.600" title={student.school || ''}>
        {student.school || '-'}
      </BodyCell>
      <BodyCell fontSize="sm" color="gray.600" title={student.program || ''}>
        {student.program || '-'}
      </BodyCell>
      <BodyCell fontSize="sm" color="gray.600" title={student.specialization || ''}>
        {student.specialization || '-'}
      </BodyCell>
      <BodyCell fontSize="sm" color="gray.600" title={student.major || ''}>
        {student.major || '-'}
      </BodyCell>
      <BodyCell fontSize="sm" fontWeight="bold">
        {student.latest_sgpa ?? '-'}
      </BodyCell>
      <BodyCell fontSize="sm" color={(student.live_backlogs ?? 0) > 0 ? 'red.500' : 'green.500'}>
        {student.live_backlogs != null ? student.live_backlogs : '-'}
      </BodyCell>
      <BodyCell fontSize="sm">
        {student.closed_backlogs != null ? student.closed_backlogs : '-'}
      </BodyCell>
      <BodyCell fontSize="sm" color="gray.600">
        {student.offers_count ?? '-'}
      </BodyCell>
      <BodyCell fontSize="sm" color="gray.600">
        {student.max_ctc_lpa != null ? student.max_ctc_lpa : '-'}
      </BodyCell>
      <BodyCell fontSize="sm">
        <Badge colorScheme={student.is_placed ? 'green' : 'gray'} size="sm">
          {student.is_placed ? 'Yes' : 'No'}
        </Badge>
      </BodyCell>
      <BodyCell fontSize="sm">
        <Badge colorScheme={student.is_placed_off_campus ? 'orange' : 'gray'} size="sm">
          {student.is_placed_off_campus ? 'Yes' : 'No'}
        </Badge>
      </BodyCell>
      <BodyCell fontSize="sm">
        <Badge colorScheme={(student.disciplinary ?? 0) > 0 ? 'red' : 'gray'} size="sm">
          {(student.disciplinary ?? 0) > 0 ? 'Yes' : 'No'}
        </Badge>
      </BodyCell>
      <BodyCell fontSize="sm">
        <Badge colorScheme={(student.placement_violations ?? 0) > 0 ? 'red' : 'gray'} size="sm">
          {(student.placement_violations ?? 0) > 0 ? 'Yes' : 'No'}
        </Badge>
      </BodyCell>
      <BodyCell fontSize="sm">
        <Badge
          colorScheme={
            student.admin_hold === true || student.admin_hold === 'true' || student.admin_hold === 1
              ? 'orange'
              : 'gray'
          }
          size="sm"
        >
          {student.admin_hold === true || student.admin_hold === 'true' || student.admin_hold === 1 ? 'Yes' : 'No'}
        </Badge>
      </BodyCell>
      {driveId && (
        <BodyCell fontSize="sm">
          {student.is_eligible === false ? (
            <Badge colorScheme="red" fontSize="xs" title={student.rejection_reasons?.join('; ')}>
              Ineligible
            </Badge>
          ) : student.is_eligible === true ? (
            <Badge colorScheme="green" fontSize="xs">
              Eligible
            </Badge>
          ) : (
            <Text fontSize="xs" color="gray.400">
              —
            </Text>
          )}
        </BodyCell>
      )}
    </Box>
  );
}

function VirtualizedStudentTable({
  students,
  driveId,
  loading,
  hasFetched,
  existingUsnsSet,
  selectedStudents,
  onToggleSelect,
  onSelectAllPage,
  allOnPageSelected,
  someOnPageSelected,
  selectableOnPageCount,
}) {
  const parentRef = useRef(null);

  const gridTemplateColumns = useMemo(
    () =>
      driveId
        ? '48px minmax(150px, 1.35fr) 112px 68px 68px minmax(100px, 1fr) minmax(120px, 1.1fr) minmax(100px, 1fr) minmax(88px, 0.95fr) 56px 56px 56px 56px 68px 60px 76px 56px 56px 68px 84px'
        : '48px minmax(150px, 1.35fr) 112px 68px 68px minmax(100px, 1fr) minmax(120px, 1.1fr) minmax(100px, 1fr) minmax(88px, 0.95fr) 56px 56px 56px 56px 68px 60px 76px 56px 56px 68px',
    [driveId]
  );

  const virtualizer = useVirtualizer({
    count: students.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      overflow="hidden"
      bg="white"
    >
      <Box
        ref={parentRef}
        position="relative"
        overflow="auto"
        maxH="560px"
        className="virtualized-student-table-scroll"
        sx={{
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '8px' },
          '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
        }}
      >
        <Box minW={`${MIN_TABLE_WIDTH}px`} position="relative">
          <Box
            display="grid"
            gridTemplateColumns={gridTemplateColumns}
            position="sticky"
            top={0}
            zIndex={3}
            minW={`${MIN_TABLE_WIDTH}px`}
            boxShadow="0 1px 0 #e2e8f0"
          >
            <HeaderCell>
              <Checkbox
                isChecked={allOnPageSelected}
                isIndeterminate={someOnPageSelected}
                onChange={(e) => onSelectAllPage(e.target.checked)}
                isDisabled={selectableOnPageCount === 0}
              />
            </HeaderCell>
            <HeaderCell>Name</HeaderCell>
            <HeaderCell>USN</HeaderCell>
            <HeaderCell>Join Yr</HeaderCell>
            <HeaderCell>Grad Yr</HeaderCell>
            <HeaderCell>School</HeaderCell>
            <HeaderCell>Program</HeaderCell>
            <HeaderCell>Spec</HeaderCell>
            <HeaderCell>Major</HeaderCell>
            <HeaderCell>CGPA</HeaderCell>
            <HeaderCell>Live BL</HeaderCell>
            <HeaderCell>Clr BL</HeaderCell>
            <HeaderCell>Offers</HeaderCell>
            <HeaderCell>Max CTC</HeaderCell>
            <HeaderCell>Placed</HeaderCell>
            <HeaderCell>Off-Camp</HeaderCell>
            <HeaderCell>Disc</HeaderCell>
            <HeaderCell>Viol</HeaderCell>
            <HeaderCell>Hold</HeaderCell>
            {driveId && <HeaderCell>Eligible</HeaderCell>}
          </Box>

          {loading && !hasFetched ? (
            <Box p={4}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} height={`${ROW_HEIGHT}px`} mb={2} borderRadius="md" />
              ))}
            </Box>
          ) : !loading && hasFetched && students.length === 0 ? (
            <Flex justify="center" align="center" minH="200px">
              <Text color="gray.500">No students found</Text>
            </Flex>
          ) : (
            <Box
              height={`${virtualizer.getTotalSize()}px`}
              position="relative"
              width="100%"
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const student = students[virtualRow.index];
                if (!student) return null;
                const alreadyInDrive = existingUsnsSet.has(student.usn);
                return (
                  <Box
                    key={student.usn}
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    minW={`${MIN_TABLE_WIDTH}px`}
                    transform={`translateY(${virtualRow.start}px)`}
                  >
                    <StudentRow
                      student={student}
                      driveId={driveId}
                      isSelected={selectedStudents.includes(student.usn)}
                      isDisabled={alreadyInDrive}
                      onToggleSelect={onToggleSelect}
                      gridTemplateColumns={gridTemplateColumns}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {loading && hasFetched && (
          <Flex
            position="absolute"
            inset={0}
            bg="whiteAlpha.800"
            align="center"
            justify="center"
            zIndex={4}
            pointerEvents="none"
          >
            <Spinner size="md" color="teal.500" thickness="3px" />
          </Flex>
        )}
      </Box>
    </Box>
  );
}

export default memo(VirtualizedStudentTable);
