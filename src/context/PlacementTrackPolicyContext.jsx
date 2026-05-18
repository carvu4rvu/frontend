import { createContext, useContext } from 'react';

/**
 * Policy for the current student's batch (school, program, year).
 * Used by Placement Track inner nav and track pages to gate access.
 * refetch: call after opt-in so nav bar (Placement Drives, Job Offers) updates from server.
 */
export const PlacementTrackPolicyContext = createContext(null);

export function usePlacementTrackPolicy() {
  const ctx = useContext(PlacementTrackPolicyContext);
  return ctx ?? { policy: null, loading: false, refetch: () => {} };
}
