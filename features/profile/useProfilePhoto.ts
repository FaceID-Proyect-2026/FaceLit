import { useEffect, useState } from 'react';
import { usePathname } from 'expo-router';
import { useAuth } from '@/shared/contexts/AuthContext';
import { api } from '@/shared/services/api';

export function useProfilePhoto() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [photo, setPhoto] = useState<{ userId: string; uri: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (!user?.id || user.role !== 'APPRENTICE') { setPhoto(null); setLoading(false); return; }
    setLoading(true); setError(false);
    api.get('/api/facial/profile-photo').then(({ data }) => {
      if (active) setPhoto({ userId: user.id, uri: data.photo });
    }).catch(() => { if (active) { setPhoto(null); setError(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, user?.role, pathname, attempt]);
  return { photo: photo?.userId === user?.id ? photo?.uri : undefined, loading, error,
    reload: () => setAttempt(value => value + 1) };
}
