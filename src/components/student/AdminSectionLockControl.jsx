import { useState } from 'react';
import { IconButton, useToast } from '@chakra-ui/react';
import { FaLock, FaUnlock } from 'react-icons/fa';
import { useProfileView } from '../../context/ProfileViewContext';
import { SECTION_LOCK_MAP } from '../../context/ProfileViewContext';
import { PlacementService } from '../../services/placement.service';

/**
 * Single lock/unlock icon (red = locked, green = unlocked). Renders next to Add/Edit. Admin only.
 * - sectionKey: e.g. 'personal', 'contact' → section lock field(s)
 * - semesterNumber: 1-8 → is_sem{N}_locked
 */
export function AdminSectionLockControl({ sectionKey = null, semesterNumber = null, label = null }) {
  const toast = useToast();
  const { viewUsn, editControl, refetchEditControl, isAdminView } = useProfileView();
  const [updating, setUpdating] = useState(false);

  if (!isAdminView || !viewUsn) return null;

  let lockFields = [];
  let displayLabel = label ?? sectionKey ?? `Sem ${semesterNumber}`;
  if (sectionKey) {
    lockFields = SECTION_LOCK_MAP[sectionKey] || [];
  } else if (semesterNumber != null && semesterNumber >= 1 && semesterNumber <= 8) {
    lockFields = [`is_sem${Number(semesterNumber)}_locked`];
  }
  if (!lockFields.length) return null;

  const isLocked = lockFields.some((f) => editControl?.[f] === true);

  const handleToggle = async (e) => {
    e?.stopPropagation?.();
    setUpdating(true);
    try {
      const patch = {};
      lockFields.forEach((f) => {
        patch[f] = !isLocked;
      });
      await PlacementService.updateStudentProfileLocks(viewUsn, patch);
      await refetchEditControl();
      toast({
        title: isLocked ? 'Unlocked' : 'Locked',
        description: `${displayLabel} is now ${isLocked ? 'editable' : 'locked'} for the student.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (e) {
      toast({
        title: 'Failed to update lock',
        description: e?.message || 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <IconButton
      aria-label={isLocked ? 'Locked — click to unlock' : 'Unlocked — click to lock'}
      icon={isLocked ? <FaLock size={20} /> : <FaUnlock size={20} />}
      size="md"
      variant="ghost"
      colorScheme={isLocked ? 'red' : 'green'}
      onClick={handleToggle}
      isLoading={updating}
      title={isLocked ? 'Locked — click to unlock' : 'Unlocked — click to lock'}
      minW="40px"
      minH="40px"
    />
  );
}
