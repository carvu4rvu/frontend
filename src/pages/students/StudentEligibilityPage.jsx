import React from 'react';
import { Navigate } from 'react-router-dom';

export default function StudentEligibilityPage() {
  // Moved into /placement/overview (tab=eligibility)
  return <Navigate to="/placement/overview?tab=eligibility" replace />;
}
