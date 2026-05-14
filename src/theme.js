import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      dark: '#172f37', // Dark Blue/Green
      gold: '#d4aa61', // Gold/Mustard
      light: '#ffffff',
    },
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
      /* Ensure buttons are visible when theme/defaults are used */
      button: {
        _focus: { boxShadow: 'outline' },
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        padding: '0.5rem 1rem',
        minHeight: '2.5rem',
        _focus: { boxShadow: '0 0 0 2px var(--chakra-colors-blue-400)' },
      },
    },
  },
});

export default theme;
