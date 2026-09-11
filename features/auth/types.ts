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

// RF-1.1 V3: el identificador de acceso es el número de documento,
// no el correo electrónico. El correo se conserva solo para recuperación.
export interface LoginForm {
  document: string;
  password: string;
  accepted: boolean;
}

export interface LoginErrors {
  document: string;
  password: string;
  policy:   string;
}