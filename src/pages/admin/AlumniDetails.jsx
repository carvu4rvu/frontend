import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spinner,
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
  Button,
  VStack,
  SimpleGrid,
  useDisclosure,
} from '@chakra-ui/react';
import { ArrowBackIcon, EditIcon, DeleteIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';
import './AlumniPortal.css';

function formatOfferMeta(alum) {
  const parts = [];
  const jt = alum.accepted_offer?.job_type;
  const ay = alum.accepted_offer?.academic_year;
  if (jt) parts.push(jt);
  if (ay) parts.push(`AY ${ay}`);
  return parts.join(' · ');
}

function formatOfferSource(source) {
  if (!source) return null;
  const map = { placement: 'Placement drive', capstone: 'Capstone', offer: 'Direct offer' };
  return map[source] || source;
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function otherLinkUrl(otherLinks) {
  if (!otherLinks) return null;
  if (typeof otherLinks === 'string') return otherLinks.trim() || null;
  return otherLinks?.url?.trim() || null;
}

function FieldBlock({ label, value, emphasis, full, href, mailto }) {
  const raw = value === null || value === undefined ? '' : String(value).trim();
  const empty = !raw;

  let content;
  if (empty) {
    content = <p className="alumni-detail__value alumni-detail__value--muted">—</p>;
  } else if (href) {
    content = (
      <p className={`alumni-detail__value${emphasis ? ' alumni-detail__value--emphasis' : ''}`}>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {raw}
        </a>
      </p>
    );
  } else if (mailto) {
    content = (
      <p className={`alumni-detail__value${emphasis ? ' alumni-detail__value--emphasis' : ''}`}>
        <a href={`mailto:${raw}`}>{raw}</a>
      </p>
    );
  } else {
    content = (
      <p className={`alumni-detail__value${emphasis ? ' alumni-detail__value--emphasis' : ''}`}>
        {raw}
      </p>
    );
  }

  return (
    <div className={`alumni-detail__field${full ? ' alumni-detail__field--full' : ''}`}>
      <span className="alumni-detail__label">{label}</span>
      {content}
    </div>
  );
}

const AlumniDetails = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchDetails();
  }, [identifier]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getAlumniByIdOrUsn(identifier);
      if (!data) {
        toast({ title: 'Alumni not found', status: 'error' });
        navigate('/placement/alumni');
        return;
      }
      setAlumni(data);
      setEditData(data);
    } catch {
      toast({ title: 'Error loading alumni', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      await PlacementService.updateAlumni(identifier, editData);
      onClose();
      toast({ title: 'Updated successfully', status: 'success' });
      await fetchDetails();
    } catch (error) {
      toast({ title: error.message || 'Update failed', status: 'error' });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await PlacementService.deleteAlumni(identifier);
      toast({ title: 'Alumni removed', status: 'success' });
      onDeleteClose();
      navigate('/placement/alumni');
    } catch (error) {
      toast({ title: error.message || 'Failed to remove alumni', status: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="alumni-detail alumni-detail__loading">
          <Spinner size="xl" color="#2a5563" thickness="3px" />
        </div>
      </AdminLayout>
    );
  }

  if (!alumni) return null;

  const usn = alumni.usn ?? alumni.student_id;
  const batch = alumni.batch_year ?? alumni.graduation_year;
  const schoolProgram = [alumni.school_name, alumni.program_name].filter(Boolean).join(' · ');
  const role = alumni.current_designation?.trim();
  const company = alumni.current_company?.trim();
  const hasPlacement = !!(role || company);
  const offerMeta = formatOfferMeta(alumni);
  const offerSource = formatOfferSource(alumni.accepted_offer?.source);
  const otherUrl = otherLinkUrl(alumni.other_links);
  const createdAt = formatDate(alumni.created_at);
  const updatedAt = formatDate(alumni.updated_at);

  return (
    <AdminLayout>
      <div className="alumni-detail">
        <div className="alumni-detail__inner">
          <button type="button" className="alumni-detail__back" onClick={() => navigate('/placement/alumni')}>
            <ArrowBackIcon boxSize={3} aria-hidden />
            Back to alumni list
          </button>

          <header className="alumni-detail__hero">
            <div className="alumni-detail__hero-main">
              <div className="alumni-detail__avatar" aria-hidden>
                {getInitials(alumni.full_name)}
              </div>
              <div>
                <h1 className="alumni-detail__name">{alumni.full_name || '—'}</h1>
                {usn && <p className="alumni-detail__usn">{usn}</p>}
                {(schoolProgram || alumni.institution_name) && (
                  <p className="alumni-detail__meta-line">
                    {schoolProgram || alumni.institution_name}
                  </p>
                )}
                <div className="alumni-detail__badges">
                  {batch != null && batch !== '' && (
                    <span className="alumni-detail__badge alumni-detail__badge--batch">Batch {batch}</span>
                  )}
                  <span
                    className={`alumni-detail__badge ${
                      alumni.alumni_source === 'converted'
                        ? 'alumni-detail__badge--converted'
                        : 'alumni-detail__badge--registered'
                    }`}
                  >
                    {alumni.alumni_source === 'converted' ? 'Converted from student' : 'Self-registered'}
                  </span>
                  <span
                    className={`alumni-detail__badge ${
                      alumni.profile_data_added
                        ? 'alumni-detail__badge--complete'
                        : 'alumni-detail__badge--pending'
                    }`}
                  >
                    Profile {alumni.profile_data_added ? 'complete' : 'pending'}
                  </span>
                  {alumni.is_verified && (
                    <span className="alumni-detail__badge alumni-detail__badge--verified">Verified</span>
                  )}
                </div>
              </div>
            </div>
            <div className="alumni-detail__actions">
              <button type="button" className="alumni-detail__btn alumni-detail__btn--primary" onClick={onOpen}>
                <EditIcon boxSize={3} aria-hidden />
                Edit profile
              </button>
              <button type="button" className="alumni-detail__btn alumni-detail__btn--danger" onClick={onDeleteOpen}>
                <DeleteIcon boxSize={3} aria-hidden />
                Remove
              </button>
            </div>
          </header>

          <div className="alumni-detail__grid">
            <div>
              <section className="alumni-detail__section" aria-labelledby="alumni-contact-heading">
                <h2 id="alumni-contact-heading" className="alumni-detail__section-title">
                  Contact &amp; social
                </h2>
                <div className="alumni-detail__fields">
                  <FieldBlock label="Personal email" value={alumni.personal_email} mailto />
                  <FieldBlock label="Phone" value={alumni.phone_number} />
                  <FieldBlock label="LinkedIn" value={alumni.linkedin} href={alumni.linkedin} full />
                  <FieldBlock label="Other links" value={otherUrl} href={otherUrl} full />
                </div>
              </section>

              <section className="alumni-detail__section" aria-labelledby="alumni-academic-heading">
                <h2 id="alumni-academic-heading" className="alumni-detail__section-title">
                  Academic
                </h2>
                <div className="alumni-detail__fields">
                  <FieldBlock label="School" value={alumni.school_name} />
                  <FieldBlock label="Program" value={alumni.program_name} />
                  <FieldBlock label="Institution" value={alumni.institution_name} />
                  <FieldBlock label="College email" value={alumni.college_email} mailto />
                  <FieldBlock label="Graduation year" value={alumni.graduation_year} />
                  <FieldBlock label="Year of joining" value={alumni.year_of_joining} />
                </div>
                {usn && (
                  <a
                    className="alumni-detail__student-link"
                    href={`/placement/students/${encodeURIComponent(usn)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/placement/students/${encodeURIComponent(usn)}`);
                    }}
                  >
                    View student placement profile
                    <ExternalLinkIcon boxSize={3} aria-hidden />
                  </a>
                )}
              </section>

              <section className="alumni-detail__section" aria-labelledby="alumni-remark-heading">
                <h2 id="alumni-remark-heading" className="alumni-detail__section-title">
                  Admin remarks
                </h2>
                <p className={`alumni-detail__remark${!alumni.alumni_remark?.trim() ? ' alumni-detail__value--muted' : ''}`}>
                  {alumni.alumni_remark?.trim() || 'No remarks'}
                </p>
              </section>
            </div>

            <div>
              <section className="alumni-detail__section" aria-labelledby="alumni-employment-heading">
                <h2 id="alumni-employment-heading" className="alumni-detail__section-heading">
                  Current employment
                </h2>
                <div className="alumni-detail__fields">
                  <FieldBlock label="Company" value={company} emphasis />
                  <FieldBlock label="Designation" value={role} />
                  <FieldBlock label="Work location" value={alumni.current_work_location} full />
                </div>
                {alumni.placement_from_offer && (
                  <span className="alumni-detail__offer-tag">Synced from accepted placement offer</span>
                )}
              </section>

              <section className="alumni-detail__section" aria-labelledby="alumni-offer-heading">
                <h2 id="alumni-offer-heading" className="alumni-detail__section-heading">
                  Accepted placement offer
                </h2>
                <div
                  className={`alumni-detail__placement-box${hasPlacement ? '' : ' alumni-detail__placement-box--empty'}`}
                >
                  {hasPlacement || alumni.has_accepted_offer ? (
                    <div className="alumni-detail__fields">
                      <FieldBlock
                        label="Role"
                        value={alumni.accepted_offer?.role || role}
                        emphasis
                      />
                      <FieldBlock
                        label="Company"
                        value={alumni.accepted_offer?.company || company}
                      />
                      {offerMeta && <FieldBlock label="Offer details" value={offerMeta} full />}
                      {offerSource && <FieldBlock label="Source" value={offerSource} full />}
                    </div>
                  ) : (
                    <p className="alumni-detail__value alumni-detail__value--muted">
                      No accepted placement on record
                    </p>
                  )}
                </div>
              </section>

              <section className="alumni-detail__section" aria-labelledby="alumni-record-heading">
                <h2 id="alumni-record-heading" className="alumni-detail__section-title">
                  Record
                </h2>
                <div className="alumni-detail__fields">
                  <FieldBlock label="Alumni ID" value={alumni.id} />
                  <FieldBlock label="Has accepted offer" value={alumni.has_accepted_offer ? 'Yes' : 'No'} />
                  {createdAt && <FieldBlock label="Created" value={createdAt} />}
                  {updatedAt && <FieldBlock label="Last updated" value={updatedAt} />}
                </div>
              </section>
            </div>
          </div>
        </div>

        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent className="alumni-portal__modal-content">
            <ModalHeader>Edit alumni profile</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <SimpleGrid columns={2} spacing={4} w="100%">
                  <FormControl isReadOnly>
                    <FormLabel>USN / ID</FormLabel>
                    <Input value={usn ?? alumni.id} bg="gray.100" />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Full name</FormLabel>
                    <Input name="full_name" value={editData.full_name ?? ''} onChange={handleInputChange} />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel>Graduation year</FormLabel>
                  <Input
                    name="graduation_year"
                    type="number"
                    value={editData.graduation_year ?? ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Institution name</FormLabel>
                  <Input name="institution_name" value={editData.institution_name ?? ''} onChange={handleInputChange} />
                </FormControl>
                <SimpleGrid columns={2} spacing={4} w="100%">
                  <FormControl>
                    <FormLabel>Current company</FormLabel>
                    <Input name="current_company" value={editData.current_company ?? ''} onChange={handleInputChange} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Designation</FormLabel>
                    <Input
                      name="current_designation"
                      value={editData.current_designation ?? ''}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel>Work location</FormLabel>
                  <Input
                    name="current_work_location"
                    value={editData.current_work_location ?? ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
                <SimpleGrid columns={2} spacing={4} w="100%">
                  <FormControl>
                    <FormLabel>Personal email</FormLabel>
                    <Input
                      name="personal_email"
                      type="email"
                      value={editData.personal_email ?? ''}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Phone number</FormLabel>
                    <Input name="phone_number" value={editData.phone_number ?? ''} onChange={handleInputChange} />
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <Input name="linkedin" value={editData.linkedin ?? ''} onChange={handleInputChange} />
                </FormControl>
                <FormControl>
                  <FormLabel>Other links</FormLabel>
                  <Input
                    name="other_links"
                    value={
                      typeof editData.other_links === 'string'
                        ? editData.other_links
                        : editData.other_links?.url ?? ''
                    }
                    onChange={handleInputChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Remarks</FormLabel>
                  <Input
                    name="alumni_remark"
                    value={editData.alumni_remark ?? ''}
                    onChange={handleInputChange}
                    placeholder="Admin notes"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleUpdate}>
                Update
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
          <ModalOverlay />
          <ModalContent className="alumni-portal__modal-content">
            <ModalHeader>Remove alumni</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <p>
                Remove <strong>{alumni.full_name}</strong> from the alumni network? This deletes their alumni profile
                and alumni login for their personal email.
                {usn ? ' Their student (RVU) account will be restored to the student role.' : ''}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onDeleteClose} isDisabled={deleting}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} isLoading={deleting}>
                Remove
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AlumniDetails;
