import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { PlacementService } from '../services/placement.service';
import { getFileUrl } from '../utils/fileUrl';
import { useAuth } from './AuthContext';

const AlumniProfileContext = createContext(null);

export function AlumniProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await PlacementService.getAlumniMe();
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Failed to load alumni profile:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshProfile();
  }, [refreshProfile]);

  const updateProfile = useCallback((data) => {
    if (data) setProfile(data);
  }, []);

  const profileImage = useMemo(
    () => (profile?.profile_image ? getFileUrl(profile.profile_image) : null),
    [profile?.profile_image]
  );

  const displayName = profile?.full_name || user?.name || user?.full_name || 'Alumni';

  const value = useMemo(
    () => ({
      profile,
      loading,
      profileImage,
      displayName,
      refreshProfile,
      updateProfile,
    }),
    [profile, loading, profileImage, displayName, refreshProfile, updateProfile]
  );

  return (
    <AlumniProfileContext.Provider value={value}>
      {children}
    </AlumniProfileContext.Provider>
  );
}

export function useAlumniProfile() {
  const ctx = useContext(AlumniProfileContext);
  if (!ctx) {
    throw new Error('useAlumniProfile must be used within AlumniProfileProvider');
  }
  return ctx;
}
