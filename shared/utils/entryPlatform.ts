import { Routes } from '../constants/routes';

interface BrowserDevice {
  userAgent?: string;
  maxTouchPoints?: number;
  userAgentData?: { mobile?: boolean };
}

/** Device detection does not depend on viewport width or desktop window size. */
export function isMobileEntry(platform: string, browser?: BrowserDevice): boolean {
  if (platform === 'android' || platform === 'ios') return true;
  if (platform !== 'web') return false;
  const agent = browser?.userAgent ?? '';
  return browser?.userAgentData?.mobile === true
    || /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Opera Mini/i.test(agent)
    // iPadOS can identify itself as a Mac when requesting desktop websites.
    || (/Macintosh/i.test(agent) && (browser?.maxTouchPoints ?? 0) > 1);
}

/** Reuse the existing role destinations without changing authentication or stored tokens. */
export function mobileEntryRoute(authenticated: boolean, role: string | null) {
  if (!authenticated) return Routes.AUTH.LOGIN;
  switch (role) {
    case 'ADMINISTRATOR':
    case 'COORDINATOR': return Routes.ADMIN.DASHBOARD;
    case 'INSTRUCTOR': return Routes.INSTRUCTOR.DASHBOARD;
    case 'APPRENTICE': return Routes.APPRENTICE.DASHBOARD;
    default: return Routes.AUTH.LOGIN;
  }
}
