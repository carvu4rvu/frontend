import React from 'react';
import { Box, VStack, Text, Heading } from '@chakra-ui/react';

/**
 * Empty "Coming Soon" page for Notifications.
 * Used for admin (/placement/notifications), student (/student/notifications), and company (/company/notifications).
 * Optional Layout wrapper (e.g. AdminLayout, CompanyLayout) is applied by the parent route.
 */
const NotificationsComingSoon = () => (
  <Box minH="50vh" display="flex" alignItems="center" justifyContent="center" py={12} px={4}>
    <VStack spacing={3}>
      <Heading size="lg" color="gray.600" fontWeight="medium">
        Notifications
      </Heading>
      <Text color="gray.500" fontSize="md">
        Coming soon
      </Text>
    </VStack>
  </Box>
);

export default NotificationsComingSoon;
