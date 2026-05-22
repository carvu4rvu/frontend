import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import { EventsService } from '../../services/events.service';
import { NotificationService } from '../../services/notification.service';
import {
  buildCampusEventNotificationContent,
  navigateToCampusEventNotificationSend,
} from '../../utils/campusEventNotification';
import CampusEventsView from './CampusEventsView';
import CampusEventFormModal from './CampusEventFormModal';

export default function CampusEventsAdmin({
  events,
  loading,
  onRefresh,
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const cancelDeleteRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [editingEvent, setEditingEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notifyingId, setNotifyingId] = useState(null);
  const [notifyingVcDigest, setNotifyingVcDigest] = useState(false);

  const openAdd = () => {
    setEditingEvent(null);
    onOpen();
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    onOpen();
  };

  const handleFormClose = () => {
    setEditingEvent(null);
    onClose();
  };

  const handleSubmit = async ({ form, imageFile, editingId, removeImage }) => {
    const title = (form.title || '').trim();
    const type = (form.type || '').trim();
    if (!title || !type) {
      toast({ title: 'Title and type are required', status: 'warning' });
      return;
    }
    if (!form.event_datetime) {
      toast({ title: 'Date & time is required', status: 'warning' });
      return;
    }

    let eventDatetime = form.event_datetime;
    if (eventDatetime && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(eventDatetime)) {
      eventDatetime = `${eventDatetime}:00+05:30`;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        type,
        details: (form.details || '').trim() || null,
        event_datetime: eventDatetime,
        status: form.status || 'scheduled',
      };

      let saved;
      if (editingId) {
        if (removeImage) {
          payload.images = [];
        }
        saved = await EventsService.update(editingId, payload);
        toast({ title: 'Event updated', status: 'success' });
      } else {
        saved = await EventsService.create(payload);
        toast({ title: 'Event created', status: 'success' });
      }

      if (imageFile && saved?.id) {
        await EventsService.uploadImage(saved.id, imageFile);
      }

      handleFormClose();
      onRefresh?.();
    } catch (err) {
      toast({
        title: editingId ? 'Update failed' : 'Create failed',
        description: err?.message,
        status: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (event) => {
    setEventToDelete(event);
    onDeleteOpen();
  };

  const handleDelete = async () => {
    if (!eventToDelete?.id) return;
    setDeleting(true);
    try {
      await EventsService.remove(eventToDelete.id);
      toast({ title: 'Event deleted', status: 'success' });
      onDeleteClose();
      setEventToDelete(null);
      onRefresh?.();
    } catch (err) {
      toast({ title: 'Delete failed', description: err?.message, status: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleNotifyVcDigest = useCallback(async () => {
    setNotifyingVcDigest(true);
    try {
      const result = await EventsService.notifyVcDigest();
      toast({
        title: 'VC notified',
        description: `${result?.notificationsCreated ?? result?.eventCount ?? 0} notification(s) sent to ${result?.vcCount ?? 'all'} VC user(s) for ${result?.eventCount ?? ''} event(s).`,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
    } catch (err) {
      toast({
        title: 'Failed to notify VC',
        description: err?.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom',
      });
    } finally {
      setNotifyingVcDigest(false);
    }
  }, [toast]);

  const handleSendNotification = useCallback(
    async (event) => {
      if (!event?.id) return;
      setNotifyingId(event.id);
      try {
        const { title, message, link, notification_type } =
          buildCampusEventNotificationContent(event);
        const created = await NotificationService.create({
          title,
          message,
          notification_type,
          link,
        });
        const draftId = created?.id ?? created?.notification_id ?? null;

        try {
          await EventsService.notifyVcForEvent(event.id);
        } catch (vcErr) {
          toast({
            title: 'VC notify failed',
            description: vcErr?.message || 'Could not send to VC users',
            status: 'warning',
            duration: 4000,
            isClosable: true,
          });
        }

        toast({
          title: 'Draft ready',
          description: 'Opening notification message… VC users were notified for this event.',
          status: 'success',
          duration: 2000,
        });
        navigateToCampusEventNotificationSend(navigate, {
          title,
          message,
          link,
          notification_type,
          openNotificationId: draftId,
        });
      } catch (err) {
        toast({
          title: 'Failed to create notification',
          description: err?.message,
          status: 'error',
        });
      } finally {
        setNotifyingId(null);
      }
    },
    [navigate, toast]
  );

  return (
    <>
      <CampusEventsView
        events={events}
        loading={loading}
        manageMode
        onAddEvent={openAdd}
        onEditEvent={openEdit}
        onDeleteEvent={confirmDelete}
        onSendNotification={handleSendNotification}
        onNotifyVcDigest={handleNotifyVcDigest}
        notifyingEventId={notifyingId}
        notifyingVcDigest={notifyingVcDigest}
      />

      <CampusEventFormModal
        isOpen={isOpen}
        onClose={handleFormClose}
        editingEvent={editingEvent}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelDeleteRef} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader>Delete event?</AlertDialogHeader>
            <AlertDialogBody>
              Delete <strong>{eventToDelete?.title || 'this event'}</strong>? This cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} variant="ghost" onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleDelete} isLoading={deleting} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
