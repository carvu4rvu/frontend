import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import PassThroughLayout from '../../components/PassThroughLayout';
import CampusEventsView from '../../components/campus/CampusEventsView';
import { PlacementService } from '../../services/placement.service';

const defaultFetchAlumniEvents = () => PlacementService.getAlumniEvents();

const AlumniEvents = ({ LayoutComponent = PassThroughLayout, fetchEvents, layoutProps }) => {
  const Layout = LayoutComponent;
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchFn = useMemo(
    () => fetchEvents ?? defaultFetchAlumniEvents,
    [fetchEvents]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchFn();
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          toast({ title: 'Failed to load events', status: 'error', isClosable: true });
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast, fetchFn]);

  return (
    <Layout {...layoutProps}>
      <CampusEventsView events={events} loading={loading} />
    </Layout>
  );
};

export default AlumniEvents;
