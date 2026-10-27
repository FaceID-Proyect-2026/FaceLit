

export interface EditLearnerModalProps {
  visible: boolean;
  fichaId: string;
  learnerId: string;
  initialName: string;
  initialLastname: string;
  initialEmail: string;
  initialDocument: string;
  onClose: () => void;
  onSave: (data: { name: string; lastname: string; email: string; document: string }) => Promise<{ success: boolean; error?: string }>;
}
