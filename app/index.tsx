import { useAuth } from '@/shared/contexts/AuthContext';
import { isMobileEntry, mobileEntryRoute } from '@/shared/utils/entryPlatform';
import { Redirect, useRootNavigationState } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import LandingScreen from '@/features/landing/screens/LandingScreen';

export default function EntryScreen() {
  const { loading, isAuthenticated, role } = useAuth();
  const navigation = useRootNavigationState();
  // Static HTML and the first client render agree: no landing before device detection.
  const [mobile, setMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setMobile(isMobileEntry(Platform.OS, typeof navigator === 'undefined' ? undefined : navigator));
  }, []);

  if (mobile === null) return null;
  if (!mobile) return <LandingScreen />;
  if (loading || !navigation?.key) return null;
  return <Redirect href={mobileEntryRoute(isAuthenticated, role)} />;
}
