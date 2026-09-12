// ─────────────────────────────────────────────
//  features/users/mocks.ts
//  RF-10 — Datos quemados de usuarios
// ─────────────────────────────────────────────

export type MockUserRole   = 'INSTRUCTOR' | 'APPRENTICE';
export type MockUserStatus = 'active' | 'inactive';
export type InstructorType = 'especifico' | 'transversal';

export interface MockUser {
  id: string;
  document: string;
  name: string;
  lastname: string;
  email: string;
  role: MockUserRole;
  status: MockUserStatus;
  // solo instructores
  instructorType?: InstructorType;
  programCode?: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    document:      '1029384756',
    name:          'Laura',
    lastname:      'Gómez',
    email:         'laura.gomez@correo.com',
    role:          'INSTRUCTOR',
    instructorType:'especifico',
    programCode:   'ADSO',
    status:        'active',
  },
  {
    id: '2',
    document:      '1087654321',
    name:          'Andrés',
    lastname:      'Martínez',
    email:         'andres.martinez@correo.com',
    role:          'INSTRUCTOR',
    instructorType:'especifico',
    programCode:   'COCI',
    status:        'active',
  },
  {
    id: '3',
    document:      '1050607080',
    name:          'Carlos',
    lastname:      'Ruiz',
    email:         'carlos.ruiz@correo.com',
    role:          'INSTRUCTOR',
    instructorType:'transversal',
    status:        'active',
  },
  {
    id: '4',
    document:      '1002345678',
    name:          'Juan',
    lastname:      'Pérez',
    email:         'juan.perez@correo.com',
    role:          'APPRENTICE',
    status:        'active',
  },
  {
    id: '5',
    document:      '1003456789',
    name:          'María',
    lastname:      'Rodríguez',
    email:         'maria.rodriguez@correo.com',
    role:          'APPRENTICE',
    status:        'active',
  },
  {
    id: '6',
    document:      '1004567890',
    name:          'Santiago',
    lastname:      'López',
    email:         'santiago.lopez@correo.com',
    role:          'APPRENTICE',
    status:        'inactive',
  },
];

// Programas disponibles para instructores específicos
export const MOCK_PROGRAMS = [
  { code: 'ADSO',  label: 'Análisis y Desarrollo de Software' },
  { code: 'COCI',  label: 'Cocina' },
  { code: 'CONT',  label: 'Contabilidad' },
  { code: 'MECA',  label: 'Mecánica Industrial' },
];
