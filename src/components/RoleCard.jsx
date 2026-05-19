import { Box, VStack, Heading, Text, Icon as ChakraIcon } from '@chakra-ui/react';
import './RoleCard.css';

export const RoleCard = ({ title, description, icon, onClick }) => (
  <button type="button" className="role-card" onClick={onClick}>
    <span className="role-card__icon-wrap" aria-hidden>
      <ChakraIcon as={icon} className="role-card__icon" />
    </span>
    <VStack gap={1} align="center">
      <Heading as="span" className="role-card__title">
        {title}
      </Heading>
      {description && (
        <Text as="span" className="role-card__description">
          {description}
        </Text>
      )}
    </VStack>
  </button>
);
