// ─────────────────────────────────────────────
//  features/auth/types.ts
//  Tipos del módulo de autenticación
// ─────────────────────────────────────────────

export type IdentityType = 'TI' | 'CC' | 'CE' | 'PA';

export interface RegisterForm {
  name:            string;
  lastname:        string;
  identityType:    IdentityType | '';
  document:        string;
  email:           string;
  password:        string;
  confirmPassword: string;
}

export interface RegisterErrors {
  name:            string;
  lastname:        string;
  identityType:    string;
  document:        string;
  email:           string;
  emailAction:     string;
  password:        string;
  confirmPassword: string;
  birthdate:       string;
  policy:          string;
  rights:          string;
}

export interface LoginForm {
  email:    string;
  password: string;
  accepted: boolean;
}

export interface LoginErrors {
  email:    string;
  password: string;
  policy:   string;
}