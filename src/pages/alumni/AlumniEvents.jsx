import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import PassThroughLayout from '../../components/PassThroughLayout';
import CampusEventsView from '../../components/campus/CampusEventsView';
import CampusEventsAdmin from '../../components/campus/CampusEventsAdmin';
import { PlacementService } from '../../services/placement.service';

const defaultFetchAlumniEvents = () => PlacementService.getAlumniEvents();

const AlumniEvents = ({ LayoutComponent = PassThroughLayout, fetchEvents, layoutProps, manageEvents = false }) => {
  const Layout = LayoutComponent;
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchFn = useMemo(
    () => fetchEvents ?? defaultFetchAlumniEvents,
    [fetchEvents]
  );

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFn();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Failed to load events', status: 'error', isClosable: true });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [toast, fetchFn]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const content = manageEvents ? (
    <CampusEventsAdmin events={events} loading={loading} onRefresh={loadEvents} />
  ) : (
    <CampusEventsView events={events} loading={loading} />
  );

  return (
    <Layout {...layoutProps}>
      {content}
    </Layout>
  );
};

export default AlumniEvents;
