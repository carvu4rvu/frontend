import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

/**
 * Dashboard insights view for a single student (admin).
 * Shown at /placement/students/:usn/dashboard-insights.
 * Empty placeholder for future content.
 */
export default function AdminStudentDashboardInsights() {
  return (
    <Box>
      <Heading size="md" color="gray.800" mb={2}>
        Dashboard insights
      </Heading>
      <Text color="gray.600" fontSize="sm">
        Content coming soon.
      </Text>
    </Box>
  );
}
