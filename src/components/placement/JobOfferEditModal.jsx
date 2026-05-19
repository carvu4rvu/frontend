import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { PlacementService } from '../../services/placement.service';
import { buildJobOfferEditForm, getJobOfferUpdateId } from './jobOfferEditForm';

/**
 * Edit job offer modal — used on job-offers list and company details page.
 */
export default function JobOfferEditModal({
  isOpen,
  onClose,
  offer,
  companies = [],
  lockCompany = false,
  onSaved,
}) {
  const toast = useToast();
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && offer) {
      setEditForm(buildJobOfferEditForm(offer));
    }
  }, [isOpen, offer]);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      if (name === 'company_name') {
        const match = companies.find((c) => c.company_name === value);
        setEditForm((prev) => ({
          ...prev,
          company_name: value,
          company_id: match?.id ?? prev.company_id,
        }));
        return;
      }
      setEditForm((prev) => ({ ...prev, [name]: value }));
    },
    [companies]
  );

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [saving, onClose]);

  const handleSave = async () => {
    const updateId = getJobOfferUpdateId(offer);
    if (!updateId) {
      toast({ title: 'Cannot update this offer', status: 'error', isClosable: true });
      return;
    }
    try {
      setSaving(true);
      await PlacementService.updateJobOffer(updateId, editForm);
      toast({ title: 'Job offer updated successfully', status: 'success' });
      onSaved?.();
      onClose();
    } catch (error) {
      toast({
        title: error.message || 'Error updating offer',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!offer) return null;

  const source = offer.source || (offer.capstone_id ? 'capstone' : offer.placement_id ? 'placement' : 'offer');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" closeOnOverlayClick={!saving}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Job Offer</ModalHeader>
        <ModalCloseButton isDisabled={saving} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box bg="gray.50" p={3} borderRadius="md">
              <HStack spacing={4} flexWrap="wrap">
                <Text fontSize="sm">
                  <strong>Student:</strong> {offer.student_name || '—'}
                </Text>
                {offer.usn && <Badge colorScheme="purple">{offer.usn}</Badge>}
                {offer.school && (
                  <Text fontSize="sm" color="gray.600">
                    {offer.school}
                  </Text>
                )}
              </HStack>
            </Box>

            <FormControl>
              <FormLabel>Company</FormLabel>
              {lockCompany ? (
                <Input value={editForm.company_name || ''} isReadOnly bg="gray.50" />
              ) : (
                <Select
                  name="company_name"
                  placeholder="Select company"
                  value={editForm.company_name}
                  onChange={handleInputChange}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.company_name}>
                      {c.company_name}
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Designation</FormLabel>
              <Input name="designation" value={editForm.designation} onChange={handleInputChange} />
            </FormControl>

            <FormControl>
              <FormLabel>Job Type</FormLabel>
              <Select
                name="job_type"
                placeholder="Select Job Type"
                value={editForm.job_type}
                onChange={handleInputChange}
              >
                <option value="internship">Internship</option>
                <option value="full time">Full Time</option>
                <option value="internship_cum_full_time">Internship cum Full Time</option>
                <option value="capstone">Capstone</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Offer Letter Status</FormLabel>
              <Select
                name="offer_letter_status"
                placeholder="Select status"
                value={editForm.offer_letter_status}
                onChange={handleInputChange}
              >
                <option value="Pending">Pending</option>
                <option value="Yet to Receive">Yet to Receive</option>
                <option value="Issued">Issued</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Declined">Declined</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Academic Year</FormLabel>
              <Input
                name="academic_year"
                value={editForm.academic_year}
                onChange={handleInputChange}
                placeholder="e.g. 2024-25"
              />
            </FormControl>

            {source === 'placement' && (
              <>
                <Divider />
                <Text fontWeight="bold" color="gray.600">
                  Placement Details
                </Text>
                <HStack width="100%" spacing={4}>
                  <FormControl>
                    <FormLabel>CTC Min (LPA)</FormLabel>
                    <Input
                      name="ctc_min_lpa"
                      type="number"
                      value={editForm.ctc_min_lpa}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>CTC Max (LPA)</FormLabel>
                    <Input
                      name="ctc_max_lpa"
                      type="number"
                      value={editForm.ctc_max_lpa}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                </HStack>
                <HStack width="100%" spacing={4}>
                  <FormControl>
                    <FormLabel>Variable Pay</FormLabel>
                    <Input
                      name="ctc_variable_pay"
                      type="number"
                      value={editForm.ctc_variable_pay}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Stock (LPA)</FormLabel>
                    <Input
                      name="ctc_stock_in_lpa"
                      type="number"
                      value={editForm.ctc_stock_in_lpa}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                </HStack>
                <FormControl>
                  <FormLabel>Type of Hiring</FormLabel>
                  <Select
                    name="type_of_hiring"
                    placeholder="Select type"
                    value={editForm.type_of_hiring}
                    onChange={handleInputChange}
                  >
                    <option value="local">Local</option>
                    <option value="global">Global</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Job Description</FormLabel>
                  <Textarea
                    name="job_description"
                    value={editForm.job_description}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </>
            )}

            {source === 'capstone' && (
              <>
                <Divider />
                <Text fontWeight="bold" color="gray.600">
                  Capstone Details
                </Text>
                <FormControl>
                  <FormLabel>Internship Duration (Months)</FormLabel>
                  <Input
                    name="internship_duration_months"
                    type="number"
                    value={editForm.internship_duration_months}
                    onChange={handleInputChange}
                  />
                </FormControl>
                <HStack width="100%" spacing={4}>
                  <FormControl>
                    <FormLabel>Stipend Min</FormLabel>
                    <Input
                      name="internship_stipend_min"
                      type="number"
                      value={editForm.internship_stipend_min}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Stipend Max</FormLabel>
                    <Input
                      name="internship_stipend_max"
                      type="number"
                      value={editForm.internship_stipend_max}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                </HStack>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="job_description"
                    value={editForm.job_description}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </>
            )}

            <FormControl>
              <FormLabel>Remarks</FormLabel>
              <Textarea name="remarks" value={editForm.remarks} onChange={handleInputChange} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={saving}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave} isLoading={saving} loadingText="Saving...">
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
