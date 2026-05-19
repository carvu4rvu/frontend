import React from 'react';
import { Box, Badge, Text, Tooltip } from '@chakra-ui/react';
import {
  getEligibilityGroupsFromDrive,
  formatEligibilityGroupsPlain,
} from '../../utils/eligibilityDisplay';

/**
 * Renders eligibility grouped by school: SOB : " BCOM , BBA Hons " with school name highlighted.
 */
export function EligibilityDisplay({
  drive,
  fallback = '—',
  variant = 'badge',
  tooltipLabel,
  noOfLines = 3,
}) {
  const groups = getEligibilityGroupsFromDrive(drive);
  const plainText = groups.length ? formatEligibilityGroupsPlain(groups) : fallback;
  const tooltip = tooltipLabel ?? plainText;

  const content =
    groups.length > 0 ? (
      <Box as="span" display="inline" lineHeight="1.4" wordBreak="break-word">
        {groups.map((g, idx) => (
          <Box as="span" key={g.school} display="inline">
            {idx > 0 && (
              <Text as="span" color="gray.500" fontWeight="normal">
                {' , '}
              </Text>
            )}
            <Text as="span" fontWeight="700" color="blue.600">
              {g.school}
            </Text>
            <Text as="span" color="gray.600" fontWeight="normal">
              {' : '}
            </Text>
            <Text as="span" color="gray.600" fontWeight="normal">
              &ldquo;
            </Text>
            <Text as="span" color="gray.800" fontWeight="500">
              {g.programs.join(' , ')}
            </Text>
            <Text as="span" color="gray.600" fontWeight="normal">
              &rdquo;
            </Text>
          </Box>
        ))}
      </Box>
    ) : (
      <Text as="span" color="gray.600">
        {fallback}
      </Text>
    );

  if (variant === 'inline') {
    return (
      <Tooltip label={tooltip} hasArrow placement="top" openDelay={300}>
        <Box fontSize="xs" fontWeight="medium" color="gray.500" noOfLines={noOfLines}>
          {content}
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={tooltip} hasArrow placement="top" openDelay={300}>
      <Box cursor="help" maxW="100%" minW={0} overflow="hidden" display="block">
        <Badge
          fontSize="10px"
          colorScheme="gray"
          variant="subtle"
          fontWeight="normal"
          textTransform="none"
          letterSpacing="normal"
          px={2}
          py={1}
          borderRadius="md"
          whiteSpace="normal"
          maxW="100%"
          display="inline-block"
        >
          <Box noOfLines={noOfLines}>{content}</Box>
        </Badge>
      </Box>
    </Tooltip>
  );
}
