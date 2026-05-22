import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  useDisclosure,
  Flex,
  Tooltip,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CopyIcon } from '@chakra-ui/icons';
import { PlacementService } from '../../services/placement.service';
import './AlumniPortal.css';

const AlumniRegistrationCodes = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeactivateOpen,
    onOpen: onDeactivateOpen,
    onClose: onDeactivateClose,
  } = useDisclosure();
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const toast = useToast();
  const [filterText, setFilterText] = useState('');

  const [formData, setFormData] = useState({
    batch_year: new Date().getFullYear(),
    institution_name: 'RV University',
    remarks: '',
    max_uses: 0,
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getRegistrationCodes();
      setCodes(data);
    } catch (error) {
      toast({ title: 'Error fetching codes', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    try {
      if (!formData.batch_year || !formData.institution_name) {
        toast({ title: 'Batch year and institution are required', status: 'warning' });
        return;
      }
      await PlacementService.generateRegistrationCode(formData);
      toast({ title: 'Code generated successfully', status: 'success' });
      onClose();
      fetchCodes();
    } catch (error) {
      toast({ title: error.message || 'Error generating code', status: 'error' });
    }
  };

  const openDeactivateModal = (code) => {
    setDeactivateTarget(code);
    onDeactivateOpen();
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget?.id) return;
    setDeactivating(true);
    try {
      await PlacementService.deleteRegistrationCode(deactivateTarget.id);
      toast({ title: 'Code deactivated', status: 'success' });
      onDeactivateClose();
      setDeactivateTarget(null);
      fetchCodes();
    } catch (error) {
      toast({
        title: 'Error deactivating code',
        description: error?.message || 'Could not deactivate this code.',
        status: 'error',
      });
    } finally {
      setDeactivating(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Code copied!', status: 'success', duration: 1500 });
  };

  const filteredCodes = codes.filter(
    (c) =>
      (c.remarks || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (c.code || '').toLowerCase().includes(filterText.toLowerCase()) ||
      String(c.batch_year || '').includes(filterText) ||
      (c.institution_name || '').toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <Box>
      <Flex justify="space-between" mb={4} gap={4} wrap="wrap">
        <Input
          placeholder="Filter by batch, code, remarks, institution…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          maxW="400px"
          bg="white"
        />
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
          Generate new code
        </Button>
      </Flex>

      {loading ? (
        <Flex justify="center"><Spinner /></Flex>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" bg="white" borderRadius="md" shadow="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Code</Th>
                <Th>Batch</Th>
                <Th>Institution</Th>
                <Th minW="160px">Remarks</Th>
                <Th>Usage</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredCodes.map((code) => (
                <Tr key={code.id} opacity={code.is_active ? 1 : 0.6}>
                  <Td fontWeight="bold">
                    {code.code}
                    <Tooltip label="Copy code">
                      <IconButton
                        icon={<CopyIcon />}
                        size="xs"
                        ml={2}
                        onClick={() => copyToClipboard(code.code)}
                        aria-label="Copy"
                      />
                    </Tooltip>
                  </Td>
                  <Td>{code.batch_year ?? '—'}</Td>
                  <Td>{code.institution_name || '—'}</Td>
                  <Td fontSize="sm" color="gray.600" maxW="240px" isTruncated title={code.remarks || undefined}>
                    {code.remarks?.trim() || '—'}
                  </Td>
                  <Td>
                    {code.used_count} / {code.max_uses === 0 ? '∞' : code.max_uses}
                  </Td>
                  <Td>
                    <Badge colorScheme={code.is_active ? 'green' : 'red'}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td fontSize="sm" color="gray.500">
                    {code.created_at ? new Date(code.created_at).toLocaleDateString() : '—'}
                  </Td>
                  <Td>
                    {code.is_active && (
                      <IconButton
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeactivateModal(code)}
                        aria-label="Deactivate"
                      />
                    )}
                  </Td>
                </Tr>
              ))}
              {filteredCodes.length === 0 && (
                <Tr>
                  <Td colSpan={8} textAlign="center" py={4}>
                    {codes.length === 0 ? 'No registration codes yet.' : 'No matching codes.'}
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isDeactivateOpen} onClose={onDeactivateClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <ModalContent className="alumni-portal__modal-content alumni-portal__modal-content--danger">
          <ModalHeader>Deactivate registration code?</ModalHeader>
          <ModalCloseButton isDisabled={deactivating} />
          <ModalBody>
            <Text fontSize="sm" color="gray.600" mb={3}>
              This code will no longer be usable for new alumni sign-ups. Existing alumni who registered with it are not affected.
            </Text>
            {deactivateTarget && (
              <Box className="alumni-portal__confirm-box">
                <Text fontWeight="700" fontFamily="mono" fontSize="lg" color="gray.800">
                  {deactivateTarget.code}
                </Text>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Batch {deactivateTarget.batch_year ?? '—'} · {deactivateTarget.institution_name || '—'}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Used {deactivateTarget.used_count ?? 0} /{' '}
                  {deactivateTarget.max_uses === 0 ? '∞' : deactivateTarget.max_uses} times
                </Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onDeactivateClose} isDisabled={deactivating}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeactivateConfirm} isLoading={deactivating}>
              Deactivate code
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.500" />
        <ModalContent className="alumni-portal__modal-content">
          <ModalHeader>Generate registration code</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>Batch year</FormLabel>
              <NumberInput
                value={formData.batch_year ?? ""}
                clampValueOnBlur={false}
                onChange={(valueString, valueNumber) => {
                  if (valueString === "" || valueString === undefined) {
                    setFormData((p) => ({ ...p, batch_year: "" }))
                  } else if (!Number.isNaN(valueNumber)) {
                    setFormData((p) => ({ ...p, batch_year: valueNumber }))
                  }
                }}
                min={2000}
                max={2100}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
            <FormControl mb={4} isRequired>
              <FormLabel>Institution name</FormLabel>
              <Input name="institution_name" value={formData.institution_name} onChange={handleInputChange} />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Remarks (optional)</FormLabel>
              <Textarea name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="e.g. Class of 2024 (CSE)" />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Max uses (0 = unlimited)</FormLabel>
              <NumberInput
                value={formData.max_uses ?? ""}
                clampValueOnBlur={false}
                onChange={(valueString, valueNumber) => {
                  if (valueString === "" || valueString === undefined) {
                    setFormData((p) => ({ ...p, max_uses: "" }))
                  } else if (!Number.isNaN(valueNumber)) {
                    setFormData((p) => ({ ...p, max_uses: Math.max(0, valueNumber) }))
                  }
                }}
                min={0}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleGenerate}>Generate</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AlumniRegistrationCodes;
