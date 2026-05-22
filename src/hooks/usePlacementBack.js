import { useLocation, useNavigate } from 'react-router-dom';
import { resolveAppBack } from '../utils/placementNavigationHistory';

/**
 * Dynamic back button: label + path from router state, session history, or fallback.
 */
export function usePlacementBack(fallbackPath = '/placement/dashboard') {
  const location = useLocation();
  const navigate = useNavigate();
  const { path, label } = resolveAppBack(location, fallbackPath);

  return {
    backPath: path,
    backLabel: label,
    goBack: () => navigate(path),
  };
}
