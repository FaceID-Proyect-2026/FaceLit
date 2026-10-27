

export type ManagedUserDetail = {
  userId: string;
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  email?: string;
  role?: string;
  accountStatus?: string;
  sessionStatus?: string;
  sessionExpiresAt?: string;
  hasSession?: boolean;
  chipCode?: string | null;
  programName?: string | null;
  instructorChipCodes?: string[];
  instructorProgramNames?: string[];
};

export type FormState = {
  document: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type FormErrors = Partial<Record<keyof FormState, string>>;

export const EMPTY_FORM: FormState = { document: '', firstName: '', lastName: '', email: '' };

export const LETTERS_ONLY = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

export function normalizeDate(value: string | null | undefined, emptyLabel: string, locale?: string) {
  if (!value) return emptyLabel;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(locale);
}

export function roleLabel(role: string | undefined, t: (key: any) => string) {
  const roleKeys: Record<string, string> = {
    ADMINISTRATOR: 'users.roles.ADMINISTRATOR',
    COORDINATOR: 'users.roles.COORDINATOR',
    COORDINATOR_REGISTER: 'users.roles.COORDINATOR_REGISTER',
    INSTRUCTOR: 'users.roles.INSTRUCTOR',
    APPRENTICE: 'users.roles.APPRENTICE',
  };
  return role ? t(roleKeys[role] ?? 'users.detail.noRole') : t('users.detail.noRole');
}
