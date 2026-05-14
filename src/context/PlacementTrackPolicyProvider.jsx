import { useState, useEffect, useCallback } from 'react';
import { PlacementService } from '../services/placement.service';
import { useAuth } from './AuthContext';
import { PlacementTrackPolicyContext } from './PlacementTrackPolicyContext';

/**
 * Provides placement track policy (opt-in, batch policy) for student.
 * Always fetches fresh data on load; no cached data used.
 */
export function PlacementTrackPolicyProvider({ children }) {
  const { user } = useAuth();
  const studentUSN = user?.usn;
  const isStudent = user?.role?.toLowerCase() === 'student';

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPolicy = useCallback(async (silent = false) => {
    if (!studentUSN || !isStudent) return;
    if (!silent) setLoading(true);
    try {
      const data = await PlacementService.getMyPolicy();
      setPolicy(data || null);
    } catch {
      setPolicy(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [studentUSN, isStudent]);

  useEffect(() => {
    if (!studentUSN || !isStudent) {
      setPolicy(null);
      setLoading(false);
      return;
    }
    fetchPolicy(false);
  }, [studentUSN, isStudent, fetchPolicy]);

  const value = {
    policy,
    loading,
    refetch: () => fetchPolicy(false),
  };

  return (
    <PlacementTrackPolicyContext.Provider value={value}>
      {children}
    </PlacementTrackPolicyContext.Provider>
  );
}
