import React, { useMemo, useState } from 'react';
import { Box, Image, Text } from '@chakra-ui/react';
import { resolveCompanyLogoUrl } from '../utils/companyLogo';

/**
 * Company logo with fallback when image fails to load (e.g. Clearbit blocked by ad blocker).
 */
export function CompanyLogo({ src, name, boxSize = '80px', variant = 'circle', ...props }) {
  const [error, setError] = useState(false);
  const resolvedSrc = useMemo(() => resolveCompanyLogoUrl(src), [src]);
  const fallback = (name || '?').substring(0, 2).toUpperCase();
  const isCircle = variant === 'circle';
  const isRounded = variant === 'rounded';
  const borderRadius = isCircle ? 'full' : isRounded ? 'lg' : 'lg';
  const fallbackBox = (
    <Box
      boxSize={boxSize}
      bg="white"
      borderRadius={borderRadius}
      display="flex"
      alignItems="center"
      justifyContent="center"
      border="1px solid"
      borderColor="gray.200"
      {...props}
    >
      <Text fontWeight="bold" fontSize={isRounded ? 'md' : '2xl'} color="gray.500" fontFamily="serif">
        {fallback}
      </Text>
    </Box>
  );
  if (!resolvedSrc || error) return fallbackBox;
  return (
    <Box
      boxSize={boxSize}
      bg="white"
      borderRadius={borderRadius}
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
      {...props}
    >
      <Image
        src={resolvedSrc}
        alt={name || ''}
        objectFit="contain"
        maxH="60%"
        maxW="60%"
        onError={() => setError(true)}
      />
    </Box>
  );
}
