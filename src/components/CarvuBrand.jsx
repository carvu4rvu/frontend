import { HStack, Text, Icon } from '@chakra-ui/react';

const GOLD = '#FDE74C';

const DeepamIcon = (props) => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
    <path
      d="M12 38c4 10 12 16 20 16s16-6 20-16c-5 3-11 5-20 5s-15-2-20-5Z"
      fill="currentColor"
    />
    <path
      d="M15 39h34"
      stroke="#20343c"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.35"
    />
    <path
      d="M32 8c-8 9-9 17-3 22 2 2 5 2 7 0 6-5 4-13-4-22Z"
      fill="currentColor"
    />
    <path
      d="M32 17c-3 5-3 9-1 11 1 1 3 1 4 0 2-2 1-6-3-11Z"
      fill="#fff6d7"
      opacity="0.85"
    />
    <path
      d="M21 54h22"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Navbar brand: deepam icon + CARVu text — gold (C, A, u), white (R, V).
 */
export function CarvuBrand({ fontSize = { base: '2xl', md: '3xl' }, ...props }) {
  return (
    <HStack
      as="span"
      spacing={1}
      align="center"
      display="inline-flex"
      fontSize={fontSize}
      lineHeight="1"
      userSelect="none"
      aria-label="CARVu"
      {...props}
    >
      <Text
        as="span"
        fontWeight="800"
        fontFamily="'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif"
        letterSpacing="-0.035em"
        fontSize="inherit"
      >
        <Text as="span" color={GOLD}>C</Text>
        <Text as="span" color={GOLD}>A</Text>
        <Text as="span" color="white">R</Text>
        <Text as="span" color="white">V</Text>
        <Text as="span" color={GOLD}>u</Text>
      </Text>
      <Icon as={DeepamIcon} color={GOLD} boxSize="1.3em" flexShrink={0} transform="translateY(-0.16em)" />
    </HStack>
  );
}
