import type { FacialResetState } from '@/shared/services/facialEnrollmentService';

export function hasUnusedFacialApproval(
  reset: FacialResetState | null,
  consumedRequests: ReadonlySet<string>,
  now = Date.now(),
): boolean {
  return !!reset && reset.status === 'ACCEPTED' && reset.canReregister
    && !!reset.requestId && !consumedRequests.has(reset.requestId)
    && !!reset.authorizationToken && !!reset.expiresAt
    && new Date(reset.expiresAt).getTime() > now;
}

export function canStartFacialCapture(options: {
  registered: boolean | null;
  savedInThisScreen: boolean;
  reset: FacialResetState | null;
  consumedRequests: ReadonlySet<string>;
  loading: boolean;
  hasError: boolean;
}): boolean {
  if (options.loading || options.hasError || options.registered === null) return false;
  return hasUnusedFacialApproval(options.reset, options.consumedRequests)
    || (options.registered === false && !options.savedInThisScreen);
}
