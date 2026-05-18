import React, { useState } from 'react';
import { Box, Image, Text } from '@chakra-ui/react';

/**
 * Company logo with fallback when image fails to load (e.g. Clearbit blocked by ad blocker).
 */
export function CompanyLogo({ src, name, boxSize = '80px', variant = 'circle', ...props }) {
  const [error, setError] = useState(false);
  const fallback = (name || '?').substring(0, 2).toUpperCase();
  const isCircle = variant === 'circle';
  const fallbackBox = (
    <Box
      boxSize={boxSize}
      bg="gray.100"
      borderRadius={isCircle ? 'full' : 'lg'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      {...props}
    >
      <Text fontWeight="bold" fontSize="2xl" color="gray.500" fontFamily="serif">
        {fallback}
      </Text>
    </Box>
  );
  if (!src || error) return fallbackBox;
  return (
    <Box
      boxSize={boxSize}
      bg="white"
      borderRadius={isCircle ? 'full' : 'lg'}
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
      {...props}
    >
      <Image
        src={src}
        alt={name || ''}
        objectFit="contain"
        maxH="60%"
        maxW="60%"
        onError={() => setError(true)}
      />
    </Box>
  );
}
