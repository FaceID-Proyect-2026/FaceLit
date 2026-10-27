import { Routes } from "@/shared/constants/routes";
import MobileFacialNotice from "@/shared/components/facial/MobileFacialNotice";
import { Platform } from "react-native";
import { useApprenticeFacial } from '@/features/facial/hooks/useApprenticeFacial';
import { FacialIdentityConfirmation } from '@/features/facial/components/FacialIdentityConfirmation';
import { FacialLiveCapture } from '@/features/facial/components/FacialLiveCapture';
import { FacialRegistrationComplete } from '@/features/facial/components/FacialRegistrationComplete';

export default function ApprenticeFacialScreen() {
  const model = useApprenticeFacial();
  if (Platform.OS !== 'web') return <MobileFacialNotice attendanceRoute={Routes.APPRENTICE.ATTENDANCE} />;
  if (model.step === 'confirm') return <FacialIdentityConfirmation model={model} />;
  if (model.step === 'camera') return <FacialLiveCapture model={model} />;
  return <FacialRegistrationComplete model={model} />;
}
