import { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  Box,
  IconButton,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { FiCalendar, FiFileText, FiImage, FiUploadCloud } from 'react-icons/fi';
import { getFileUrl } from '../../utils/fileUrl';
import '../../pages/EventsPage.css';

const EVENT_TYPES = [
  'Workshop',
  'Training',
  'Career Fair',
  'Hackathon',
  'Networking',
  'Contest',
  'Placement',
  'Other',
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Done' },
  { value: 'failed', label: 'Failed' },
];

const defaultForm = {
  title: '',
  type: 'Workshop',
  details: '',
  event_datetime: '',
  status: 'scheduled',
};

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getEventImageUrl(event) {
  if (!event) return null;
  const first = Array.isArray(event.images) && event.images[0];
  if (first) {
    const url = typeof first === 'string' ? first : first?.url;
    if (url) return getFileUrl(url) || url;
  }
  if (event.image_url) return getFileUrl(event.image_url) || event.image_url;
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (base && event.id) {
    return `${base.replace(/\/$/, '')}/storage/v1/object/public/system-assets/events/${event.id}.jpg`;
  }
  return null;
}

export default function CampusEventFormModal({
  isOpen,
  onClose,
  editingEvent,
  onSubmit,
  saving,
}) {
  const [form, setForm] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  const editingId = editingEvent?.id ?? null;
  const hasCoverImage = Boolean(imagePreview);

  useEffect(() => {
    if (!isOpen) return;
    if (editingEvent) {
      setForm({
        title: editingEvent.title || '',
        type: editingEvent.type || 'Workshop',
        details: editingEvent.details || '',
        event_datetime: toDatetimeLocal(editingEvent.event_datetime),
        status: editingEvent.status || 'scheduled',
      });
      setImageFile(null);
      setImageRemoved(false);
      setImagePreview(getEventImageUrl(editingEvent));
    } else {
      setForm(defaultForm);
      setImageFile(null);
      setImagePreview(null);
      setImageRemoved(false);
    }
  }, [isOpen, editingEvent]);

  const clearImageState = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(false);
  };

  const handleRemoveImage = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
  };

  const handleClose = () => {
    clearImageState();
    onClose();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageRemoved(false);
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ form, imageFile, editingId, removeImage: imageRemoved });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      scrollBehavior="inside"
      isCentered
      className="event-form-modal"
    >
      <ModalOverlay className="event-form-modal-overlay" />
      <ModalContent className="event-form-modal-content">
        <Box className="event-form-modal-header">
          <div className="event-form-modal-header-inner">
            <div className="event-form-modal-brand">
              <span className="event-form-modal-brand-icon" aria-hidden="true">
                <FiCalendar />
              </span>
              <div className="event-form-modal-brand-text">
                <h2 className="event-form-modal-title">
                  {editingId ? 'Edit Event' : 'Add Event'}
                </h2>
                <p className="event-form-modal-subtitle">
                  {editingId ? 'Update details or cover image' : 'Campus event for students, alumni & companies'}
                </p>
              </div>
            </div>
            <button type="button" className="event-form-modal-close" onClick={handleClose} aria-label="Close">
              ×
            </button>
          </div>
        </Box>

        <ModalBody className="event-form-modal-body" p={0}>
          <Box as="form" id="campus-event-form" onSubmit={handleSubmit} className="events-form events-form--compact">
            <article className="events-form-card">
              <div className="events-form-card-body events-form-card-body--flush-top">
                <FormControl isRequired className="events-form-field" mb={3}>
                  <FormLabel>Title</FormLabel>
                  <Input
                    className="events-form-input"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Placement Orientation 2026"
                  />
                </FormControl>
                <div className={`events-form-row events-form-row--compact ${editingId ? 'events-form-row--three' : 'events-form-row--two'}`}>
                  <FormControl isRequired className="events-form-field">
                    <FormLabel>Type</FormLabel>
                    <Select
                      className="events-form-input"
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    >
                      {EVENT_TYPES.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl isRequired className="events-form-field">
                    <FormLabel>Date & time</FormLabel>
                    <Input
                      type="datetime-local"
                      className="events-form-input events-form-input-datetime"
                      value={form.event_datetime}
                      onChange={(e) => setForm((f) => ({ ...f, event_datetime: e.target.value }))}
                    />
                  </FormControl>
                  {editingId && (
                    <FormControl className="events-form-field">
                      <FormLabel>Status</FormLabel>
                      <Select
                        className="events-form-input"
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </div>
              </div>
            </article>

            <div className="events-form-duo events-form-duo--compact">
              <article className="events-form-card">
                <header className="events-form-card-head events-form-card-head--mini">
                  <span className="events-form-card-icon events-form-card-icon--doc" aria-hidden="true">
                    <FiFileText />
                  </span>
                  <h3 className="events-form-card-title">Description</h3>
                </header>
                <div className="events-form-card-body">
                  <FormControl className="events-form-field">
                    <FormLabel>Details</FormLabel>
                    <Textarea
                      className="events-form-textarea events-form-textarea-compact"
                      value={form.details}
                      onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                      placeholder="Venue, organizer, agenda..."
                      rows={4}
                    />
                  </FormControl>
                </div>
              </article>

              <article className="events-form-card">
                <header className="events-form-card-head events-form-card-head--mini">
                  <span className="events-form-card-icon events-form-card-icon--image" aria-hidden="true">
                    <FiImage />
                  </span>
                  <h3 className="events-form-card-title">Cover image</h3>
                </header>
                <div className="events-form-card-body">
                  {hasCoverImage ? (
                    <Box className="events-image-preview-only">
                      <Box className="events-image-preview-stage">
                        <img src={imagePreview} alt="" className="events-image-preview" />
                        <IconButton
                          aria-label="Remove cover image"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="solid"
                          className="events-image-preview-remove"
                          onClick={handleRemoveImage}
                        />
                      </Box>
                      {imageFile && (
                        <p className="events-image-preview-filename">{imageFile.name}</p>
                      )}
                    </Box>
                  ) : (
                    <label className="events-image-upload-zone">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="events-image-upload-input"
                        onChange={handleImageChange}
                      />
                      <span className="events-image-upload-icon-wrap" aria-hidden="true">
                        <FiUploadCloud />
                      </span>
                      <span className="events-image-upload-text">
                        <strong>Upload</strong> cover
                      </span>
                      <span className="events-image-upload-hint">JPG, PNG, WebP</span>
                    </label>
                  )}
                </div>
              </article>
            </div>
          </Box>
        </ModalBody>

        <ModalFooter className="event-form-modal-footer">
          <p className="event-form-footer-hint">Required: title, type, and date & time</p>
          <div className="event-form-footer-actions">
            <Button className="event-form-btn-cancel" variant="ghost" onClick={handleClose} isDisabled={saving}>
              Cancel
            </Button>
            <Button
              className="event-form-btn-submit"
              type="submit"
              form="campus-event-form"
              isLoading={saving}
            >
              {editingId ? 'Save changes' : 'Add event'}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
