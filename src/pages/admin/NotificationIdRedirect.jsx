import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flex, Spinner } from '@chakra-ui/react';

/**
 * Legacy URL /placement/notifications/:id → open send flow on the notifications list page.
 */
export default function NotificationIdRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const numId = id ? parseInt(id, 10) : null;
    navigate('/placement/notifications', {
      replace: true,
      state: {
        prefillNotification: true,
        openNotificationId: Number.isFinite(numId) ? numId : null,
        event: { notification_type: 'PLACEMENT' },
      },
    });
  }, [id, navigate]);

  return (
    <Flex justify="center" align="center" minH="40vh">
      <Spinner size="lg" color="blue.500" />
    </Flex>
  );
}
