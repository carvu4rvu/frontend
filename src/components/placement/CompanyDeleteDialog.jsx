import React from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Box,
  Text,
  VStack,
  UnorderedList,
  ListItem,
  RadioGroup,
  Radio,
  Stack,
  Spinner,
} from '@chakra-ui/react';

const CompanyDeleteDialog = ({
  isOpen,
  onClose,
  cancelRef,
  companyName,
  counts = { drives: 0, contacts: 0, offers: 0 },
  countsLoading = false,
  offersAction,
  onOffersActionChange,
  onConfirm,
  isDeleting,
}) => {
  const driveCount = counts.drives ?? 0;
  const contactCount = counts.contacts ?? 0;
  const offerCount = counts.offers ?? 0;

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent borderRadius="xl" maxW="lg">
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete Company
          </AlertDialogHeader>

          <AlertDialogBody>
            <VStack align="stretch" spacing={4}>
              <Text>
                You are about to permanently delete <strong>{companyName || 'this company'}</strong>.
                This action cannot be undone.
              </Text>

              {countsLoading ? (
                <Box py={2} textAlign="center">
                  <Spinner size="sm" mr={2} />
                  <Text as="span" fontSize="sm" color="gray.600">
                    Loading related records…
                  </Text>
                </Box>
              ) : (
                <>
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      The following will always be removed:
                    </Text>
                    <UnorderedList spacing={1} pl={4} fontSize="sm" color="gray.700">
                      <ListItem>Company profile and details</ListItem>
                      <ListItem>
                        {driveCount} placement drive{driveCount === 1 ? '' : 's'} and related process records
                      </ListItem>
                      <ListItem>
                        {contactCount} contact{contactCount === 1 ? '' : 's'}
                      </ListItem>
                      <ListItem>Company portal login accounts</ListItem>
                    </UnorderedList>
                  </Box>

                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      Job offers ({offerCount})
                    </Text>
                    {offerCount === 0 ? (
                      <Text fontSize="sm" color="gray.600">
                        No job offers are linked to this company.
                      </Text>
                    ) : (
                      <RadioGroup value={offersAction} onChange={onOffersActionChange}>
                        <Stack spacing={3}>
                          <Radio value="delete" colorScheme="red">
                            <Box ml={2}>
                              <Text fontSize="sm" fontWeight="medium">
                                Delete all offers
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                Removes {offerCount} offer{offerCount === 1 ? '' : 's'} and linked placement/capstone records.
                              </Text>
                            </Box>
                          </Radio>
                          <Radio value="keep_off_campus" colorScheme="blue">
                            <Box ml={2}>
                              <Text fontSize="sm" fontWeight="medium">
                                Keep offers as external off-campus
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                Preserves student offers but removes the company link; marks them as off-campus hiring.
                              </Text>
                            </Box>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    )}
                  </Box>
                </>
              )}
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} isDisabled={isDeleting}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={onConfirm}
              ml={3}
              isLoading={isDeleting}
              isDisabled={countsLoading}
            >
              Delete Company
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default CompanyDeleteDialog;
