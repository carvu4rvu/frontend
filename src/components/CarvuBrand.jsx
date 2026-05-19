import { HStack, Text, Icon } from '@chakra-ui/react';
import { LuLamp } from 'react-icons/lu';

const GOLD = '#d4a960';

/**
 * Navbar brand: lamp icon + CARVu text — gold (C, A, u), white (R, V).
 */
export function CarvuBrand({ fontSize = { base: '2xl', md: '3xl' }, ...props }) {
  return (
    <HStack
      as="span"
      spacing={2}
      align="center"
      display="inline-flex"
      fontSize={fontSize}
      lineHeight="1"
      userSelect="none"
      aria-label="CARVu"
      {...props}
    >
      <Icon as={LuLamp} color={GOLD} boxSize="0.9em" flexShrink={0} aria-hidden />
      <Text
        as="span"
        fontWeight="bold"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="-0.02em"
        fontSize="inherit"
      >
        <Text as="span" color={GOLD}>C</Text>
        <Text as="span" color={GOLD}>A</Text>
        <Text as="span" color="white">R</Text>
        <Text as="span" color="white">V</Text>
        <Text as="span" color={GOLD}>u</Text>
      </Text>
    </HStack>
  );
}
