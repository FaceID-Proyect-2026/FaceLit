

export type InstructorItem = {
  idInstructor: string;
  idUser: string;
  firstName: string;
  lastName: string;
  document: string;
  email: string;
  instructorType: 'ESPECIFICO' | 'TRANSVERSAL';
  programIds: string[];
  programNames?: string[];
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string | null;
  updatedAt?: string | null;
};
